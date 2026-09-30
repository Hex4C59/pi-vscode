import { randomBytes } from "node:crypto";
import { constants, type Stats } from "node:fs";
import * as nativeFs from "node:fs/promises";
import path from "node:path";

const MAX_MODELS_FILE_BYTES = 1024 * 1024;
const LOCK_NAME = ".models.json.pi-vscode.lock";
const OWNER_FILE = "owner.json";

export type EndpointFileSystem = Pick<typeof nativeFs,
  "mkdir" | "realpath" | "lstat" | "open" | "writeFile" | "readFile" | "chmod" | "rename" | "unlink" | "rmdir">;
export type EndpointWriteFailure = "invalid" | "rejected" | "exists" | "native" | "write" | "missing" | "occupied" | "conflict" | "too-large";
export type EndpointWriteResult =
  | { kind: "committed" }
  | { kind: "committed-cleanup-failed" }
  | { kind: "not-committed"; reason: EndpointWriteFailure; cleanupFailed: boolean };
export type EndpointFileSnapshot =
  | { kind: "missing" }
  | { kind: "file"; bytes: Buffer; info: Stats };
type SnapshotRead = EndpointFileSnapshot | { kind: "invalid" };
type Change = { kind: "replace"; text: string } | { kind: "refused"; reason: EndpointWriteFailure };
type Lock = { directory: string; info: Stats; owner: string };
type Target = { file: string; parent: string; originalParent: string; info: Stats };

export function endpointWriteRefusal(reason: EndpointWriteFailure): EndpointWriteResult {
  return { kind: "not-committed", reason, cleanupFailed: false };
}

function hasCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function sameNode(first: Stats, second: Stats): boolean {
  return first.dev === second.dev && first.ino === second.ino;
}

function sameRevision(first: Stats, second: Stats): boolean {
  return sameNode(first, second) && first.size === second.size && first.mode === second.mode
    && first.mtimeMs === second.mtimeMs && first.ctimeMs === second.ctimeMs && first.nlink === second.nlink;
}

async function resolveTarget(file: string, fs: EndpointFileSystem): Promise<Target> {
  if (path.basename(file) !== "models.json") throw new Error("invalid target");
  const originalParent = path.dirname(path.resolve(file));
  await fs.mkdir(originalParent, { recursive: true });
  const parent = await fs.realpath(originalParent);
  const info = await fs.lstat(parent);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("invalid directory");
  return { file: path.join(parent, "models.json"), parent, originalParent, info };
}

async function targetUnchanged(target: Target, fs: EndpointFileSystem): Promise<boolean> {
  return await fs.realpath(target.originalParent) === target.parent
    && sameNode(target.info, await fs.lstat(target.parent));
}

async function readSnapshot(file: string, fs: EndpointFileSystem): Promise<SnapshotRead> {
  try {
    const before = await fs.lstat(file);
    if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1 || before.size > MAX_MODELS_FILE_BYTES) return { kind: "invalid" };
    const handle = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
    try {
      const info = await handle.stat();
      if (!info.isFile() || !sameRevision(before, info)) return { kind: "invalid" };
      const bytes = Buffer.alloc(MAX_MODELS_FILE_BYTES + 1);
      let size = 0;
      while (size < bytes.length) {
        const next = await handle.read(bytes, size, bytes.length - size, size);
        if (next.bytesRead === 0) break;
        size += next.bytesRead;
      }
      if (size > MAX_MODELS_FILE_BYTES || !sameRevision(info, await handle.stat())
        || !sameRevision(info, await fs.lstat(file))) return { kind: "invalid" };
      return { kind: "file", bytes: bytes.subarray(0, size), info };
    } finally { await handle.close(); }
  } catch (error) {
    return hasCode(error, "ENOENT") ? { kind: "missing" } : { kind: "invalid" };
  }
}

function sameSnapshot(first: EndpointFileSnapshot, second: SnapshotRead): boolean {
  if (first.kind === "missing") return second.kind === "missing";
  return second.kind === "file" && sameRevision(first.info, second.info) && first.bytes.equals(second.bytes);
}

async function ownLock(lock: Lock, fs: EndpointFileSystem, checkOwner: boolean): Promise<boolean> {
  const info = await fs.lstat(lock.directory);
  if (!info.isDirectory() || info.isSymbolicLink() || !sameNode(lock.info, info)) return false;
  if (!checkOwner) return true;
  const ownerFile = path.join(lock.directory, OWNER_FILE);
  const ownerInfo = await fs.lstat(ownerFile);
  return ownerInfo.isFile() && !ownerInfo.isSymbolicLink() && ownerInfo.size <= 128
    && await fs.readFile(ownerFile, "utf8") === lock.owner;
}

async function releaseLock(lock: Lock, fs: EndpointFileSystem, checkOwner = true): Promise<boolean> {
  try {
    if (!await ownLock(lock, fs, checkOwner)) return false;
    if (checkOwner) await fs.unlink(path.join(lock.directory, OWNER_FILE));
    await fs.rmdir(lock.directory);
    return true;
  } catch { return false; }
}

async function acquireLock(target: Target, fs: EndpointFileSystem): Promise<Lock | EndpointWriteResult> {
  const directory = path.join(target.parent, LOCK_NAME);
  try { await fs.mkdir(directory, { mode: 0o700 }); }
  catch (error) { return endpointWriteRefusal(hasCode(error, "EEXIST") ? "occupied" : "write"); }
  let lock: Lock;
  try {
    lock = { directory, info: await fs.lstat(directory), owner: JSON.stringify({ token: randomBytes(16).toString("hex"), pid: process.pid }) };
  } catch { return { kind: "not-committed", reason: "write", cleanupFailed: true }; }
  try {
    await fs.writeFile(path.join(directory, OWNER_FILE), lock.owner, { flag: "wx", mode: 0o600 });
    return lock;
  } catch {
    // Only an empty, still-owned directory is removable after failed initialization.
    return { kind: "not-committed", reason: "write", cleanupFailed: !await releaseLock(lock, fs, false) };
  }
}

async function commitReplacement(
  target: Target, original: EndpointFileSnapshot, text: string, fs: EndpointFileSystem,
): Promise<EndpointWriteResult> {
  const temporary = path.join(target.parent, `.models-${randomBytes(16).toString("hex")}.tmp`);
  let ownsTemporary = false;
  let result = endpointWriteRefusal("write");
  try {
    const handle = await fs.open(temporary, "wx", 0o600);
    ownsTemporary = true;
    try { await handle.writeFile(text); } finally { await handle.close(); }
    await fs.chmod(temporary, original.kind === "file" ? original.info.mode & 0o777 : 0o600);
    if (!await targetUnchanged(target, fs) || !sameSnapshot(original, await readSnapshot(target.file, fs))) {
      result = endpointWriteRefusal("conflict");
    } else {
      await fs.rename(temporary, target.file);
      ownsTemporary = false;
      result = { kind: "committed" };
    }
  } catch { /* Keep the fixed failure result; no mutation retry. */ }
  if (ownsTemporary) {
    try { await fs.unlink(temporary); }
    catch { return { kind: "not-committed", reason: result.kind === "not-committed" ? result.reason : "write", cleanupFailed: true }; }
  }
  return result;
}

async function changeUnderLock(
  target: Target, change: (snapshot: EndpointFileSnapshot) => Change, fs: EndpointFileSystem,
): Promise<EndpointWriteResult> {
  if (!await targetUnchanged(target, fs)) return endpointWriteRefusal("conflict");
  const snapshot = await readSnapshot(target.file, fs);
  if (snapshot.kind === "invalid") return endpointWriteRefusal("invalid");
  const next = change(snapshot);
  if (next.kind === "refused") return endpointWriteRefusal(next.reason);
  if (Buffer.byteLength(next.text, "utf8") > MAX_MODELS_FILE_BYTES) return endpointWriteRefusal("too-large");
  return commitReplacement(target, snapshot, next.text, fs);
}

/** Single-attempt host transaction; only cooperating writers are mutually exclusive. */
export async function writeEndpointDocument(
  file: string, change: (snapshot: EndpointFileSnapshot) => Change, fs: EndpointFileSystem = nativeFs,
): Promise<EndpointWriteResult> {
  let target: Target;
  try { target = await resolveTarget(file, fs); } catch { return endpointWriteRefusal("write"); }
  const acquired = await acquireLock(target, fs);
  if ("kind" in acquired) return acquired;
  let result: EndpointWriteResult;
  try { result = await changeUnderLock(target, change, fs); }
  catch { result = endpointWriteRefusal("write"); }
  const released = await releaseLock(acquired, fs);
  if (released) return result;
  return result.kind === "not-committed" ? { ...result, cleanupFailed: true } : { kind: "committed-cleanup-failed" };
}

/** Read-only provider listing shares bounded file validation but does not acquire a write lock. */
export async function readEndpointDocument(file: string): Promise<SnapshotRead> {
  return readSnapshot(file, nativeFs);
}
