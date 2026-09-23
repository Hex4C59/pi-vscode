import { stat as fsStat, realpath as fsRealpath } from "node:fs/promises";
import path from "node:path";
import { sameNativePath } from "../index.js";
import type { Readable, Writable } from "node:stream";

import type { SavedHistoryPage, SavedHistoryPreview } from "../../extension/contracts/index.js";
import { projectSavedHistory, projectSavedHistoryPreview } from "./session-history-projection.js";

const WORKER_ARG = "--pi-vscode-session-worker";
const PROTOCOL_VERSION = 1;
const PAGE_SIZE = 16;
const HISTORY_PAGE_SIZE = 32;
const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const MAX_ROOT_LENGTH = 32 * 1024;
const MAX_ID_LENGTH = 200;
const MAX_PATH_LENGTH = 32 * 1024;
const MAX_NAME_LENGTH = 160;
const MAX_FIRST_MESSAGE_LENGTH = 256;
const MAX_MODIFIED_LENGTH = 40;
const MAX_HISTORY_ROWS = 32;
const MAX_HISTORY_TEXT_LENGTH = 8_000;
const MAX_HISTORY_TOTAL_BYTES = 128 * 1024;
const MAX_PREVIEW_TEXT_LENGTH = 8_192;

type WorkerListRequest = { version: typeof PROTOCOL_VERSION; action: "list"; root: string; page: number };
type WorkerInspectRequest = { version: typeof PROTOCOL_VERSION; action: "inspect"; root: string; id: string };
type WorkerHistoryRequest = { version: typeof PROTOCOL_VERSION; action: "history"; root: string; id: string; anchor: string; page: number };
type WorkerPreviewRequest = { version: typeof PROTOCOL_VERSION; action: "preview"; root: string; id: string; anchor: string; index: number; offset: number };
type WorkerRequest = WorkerListRequest | WorkerInspectRequest | WorkerHistoryRequest | WorkerPreviewRequest;
type SessionMetadata = { id: string; path: string; name: string | null; firstMessage: string; modified: string };
type WorkerFailure = { version: typeof PROTOCOL_VERSION; ok: false; code: "unavailable" | "wrong-project" | "stale" };
type WorkerSuccess =
  | { version: typeof PROTOCOL_VERSION; ok: true; action: "list"; entries: SessionMetadata[]; page: number; total: number }
  | { version: typeof PROTOCOL_VERSION; ok: true; action: "inspect"; session: SessionMetadata; history: SavedHistoryPage; anchor: string | null }
  | { version: typeof PROTOCOL_VERSION; ok: true; action: "history"; history: SavedHistoryPage }
  | { version: typeof PROTOCOL_VERSION; ok: true; action: "preview"; preview: SavedHistoryPreview };

import type { SessionInfoLike, SessionManagerApi, SessionWorkerEnvironment, SessionListProgress, FileSystemApi, HistoryPreviewProjector } from "./types.js";
export type { SessionInfoLike, SessionManagerHandleLike, SessionManagerApi, SessionWorkerEnvironment } from "./types.js";

function failure(code: WorkerFailure["code"] = "unavailable"): WorkerFailure {
  return { version: PROTOCOL_VERSION, ok: false, code };
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}
function boundedText(value: unknown, maxCharacters: number): value is string {
  return typeof value === "string" && Array.from(value).length <= maxCharacters;
}
function validRoot(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ROOT_LENGTH && path.isAbsolute(value);
}
function validId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH && /^[A-Za-z0-9_-]+$/.test(value);
}
function validPage(value: unknown, pageSize: number): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= Math.floor(Number.MAX_SAFE_INTEGER / pageSize);
}
function validRequest(value: unknown): value is WorkerRequest {
  if (!isRecord(value) || value.version !== PROTOCOL_VERSION || !validRoot(value.root)) return false;
  if (value.action === "list") return hasExactKeys(value, ["version", "action", "root", "page"]) && validPage(value.page, PAGE_SIZE);
  if (value.action === "inspect") return hasExactKeys(value, ["version", "action", "root", "id"]) && validId(value.id);
  if (value.action === "history") return hasExactKeys(value, ["version", "action", "root", "id", "anchor", "page"]) && validId(value.id) && validId(value.anchor) && validPage(value.page, HISTORY_PAGE_SIZE);
  return value.action === "preview"
    && hasExactKeys(value, ["version", "action", "root", "id", "anchor", "index", "offset"])
    && validId(value.id)
    && validId(value.anchor)
    && validPage(value.index, 1)
    && validPage(value.offset, 1);
}
async function canonicalDirectory(value: string, fileSystem: FileSystemApi): Promise<string | undefined> {
  if (!validRoot(value)) return undefined;
  try {
    if (!(await fileSystem.stat(value)).isDirectory()) return undefined;
    return await fileSystem.realpath(value);
  } catch {
    return undefined;
  }
}
function clipText(value: string, maxCharacters: number): string {
  return Array.from(value).slice(0, maxCharacters).join("");
}
function validMetadata(value: unknown): value is SessionInfoLike {
  return isRecord(value)
    && validId(value.id)
    && boundedText(value.path, MAX_PATH_LENGTH)
    && path.isAbsolute(value.path)
    && validRoot(value.cwd)
    && (value.name === undefined || typeof value.name === "string")
    && typeof value.firstMessage === "string"
    && value.modified instanceof Date
    && Number.isFinite(value.modified.getTime());
}
async function metadataFor(value: unknown, projectRoot: string, fileSystem: FileSystemApi): Promise<{ ok: true; metadata: SessionMetadata } | WorkerFailure> {
  if (!validMetadata(value)) return failure();
  const sessionRoot = await canonicalDirectory(value.cwd, fileSystem);
  if (!sessionRoot || !sameNativePath(sessionRoot, projectRoot)) return failure("wrong-project");
  try {
    if (!(await fileSystem.stat(value.path)).isFile()) return failure();
  } catch {
    return failure();
  }
  return {
    ok: true,
    metadata: {
      id: value.id,
      path: value.path,
      name: value.name === undefined ? null : clipText(value.name, MAX_NAME_LENGTH),
      firstMessage: clipText(value.firstMessage, MAX_FIRST_MESSAGE_LENGTH),
      modified: value.modified.toISOString().slice(0, MAX_MODIFIED_LENGTH),
    },
  };
}
function validHistory(value: unknown): value is SavedHistoryPage {
  if (!isRecord(value)
    || !hasExactKeys(value, ["messages", "page", "total"])
    || !Array.isArray(value.messages)
    || value.messages.length > MAX_HISTORY_ROWS
    || !validPage(value.page, HISTORY_PAGE_SIZE)
    || !Number.isSafeInteger(value.total)
    || (value.total as number) < 0
    || (value.total as number) < value.messages.length) return false;
  let bytes = 0;
  for (const message of value.messages) {
    if (!isRecord(message)
      || (!hasExactKeys(message, ["role", "text"]) && !hasExactKeys(message, ["role", "text", "id"]))
      || (message.role !== "user" && message.role !== "assistant")
      || !boundedText(message.text, MAX_HISTORY_TEXT_LENGTH)
      || (Object.hasOwn(message, "id") && !boundedText(message.id, MAX_ID_LENGTH))) return false;
    bytes += Buffer.byteLength(message.text, "utf8");
    if (bytes > MAX_HISTORY_TOTAL_BYTES) return false;
  }
  return true;
}
function validPreview(value: unknown): value is SavedHistoryPreview {
  return isRecord(value)
    && hasExactKeys(value, ["text", "offset", "nextOffset", "done", "totalChars"])
    && typeof value.text === "string"
    && value.text.length <= MAX_PREVIEW_TEXT_LENGTH
    && Number.isSafeInteger(value.offset)
    && (value.offset as number) >= 0
    && Number.isSafeInteger(value.nextOffset)
    && (value.nextOffset as number) >= (value.offset as number)
    && Number.isSafeInteger(value.totalChars)
    && (value.totalChars as number) >= (value.nextOffset as number)
    && typeof value.done === "boolean";
}
function cloneHistory(value: SavedHistoryPage): SavedHistoryPage {
  return {
    page: value.page,
    total: value.total,
    messages: value.messages.map((message) => Object.hasOwn(message, "id")
      ? { id: message.id, role: message.role, text: message.text }
      : { role: message.role, text: message.text }),
  };
}
async function defaultSessionManager(): Promise<SessionManagerApi> {
  const module = await import("@earendil-works/pi-coding-agent");
  return module.SessionManager as unknown as SessionManagerApi;
}
async function loadMetadata(request: WorkerRequest, manager: SessionManagerApi, projectRoot: string, fileSystem: FileSystemApi, signal: AbortSignal): Promise<{ ok: true; metadata: SessionMetadata[] } | WorkerFailure> {
  if (signal.aborted) return failure();
  const progress: SessionListProgress = () => undefined;
  const values = await manager.list(request.root, undefined, progress, signal);
  if (signal.aborted || !Array.isArray(values)) return failure();
  const metadata: SessionMetadata[] = [];
  for (const value of values) {
    const result = await metadataFor(value, projectRoot, fileSystem);
    if (!result.ok) return result;
    metadata.push(result.metadata);
  }
  metadata.sort((left, right) => right.modified.localeCompare(left.modified) || left.id.localeCompare(right.id));
  return { ok: true, metadata };
}

type SelectedSession = { metadata: SessionMetadata; branch: unknown[] };
async function selectSession(request: WorkerInspectRequest | WorkerHistoryRequest | WorkerPreviewRequest, manager: SessionManagerApi, projectRoot: string, fileSystem: FileSystemApi, signal: AbortSignal): Promise<SelectedSession | WorkerFailure> {
  const selectedPath = manager.findById(request.root, request.id);
  if (typeof selectedPath !== "string" || !path.isAbsolute(selectedPath) || selectedPath.length > MAX_PATH_LENGTH) return failure();
  try {
    if (!(await fileSystem.stat(selectedPath)).isFile()) return failure();
  } catch {
    return failure();
  }
  const result = await loadMetadata(request, manager, projectRoot, fileSystem, signal);
  if (!result.ok) return result;
  const metadata = result.metadata.find((entry) => entry.id === request.id);
  if (!metadata || !sameNativePath(metadata.path, selectedPath)) return failure();
  const opened = manager.open(selectedPath);
  if (typeof opened.getCwd !== "function"
    || typeof opened.getSessionId !== "function"
    || typeof opened.getSessionFile !== "function"
    || typeof opened.getBranch !== "function"
    || opened.getSessionId() !== request.id) return failure();
  const openedCwd = await canonicalDirectory(opened.getCwd(), fileSystem);
  const sessionFile = opened.getSessionFile();
  if (!openedCwd || !sameNativePath(openedCwd, projectRoot) || typeof sessionFile !== "string" || !sameNativePath(sessionFile, selectedPath)) return failure("wrong-project");
  const branch = opened.getBranch();
  return Array.isArray(branch) ? { metadata, branch } : failure();
}
function anchorFor(branch: unknown[]): string | null | undefined {
  if (branch.length === 0) return null;
  const last = branch[branch.length - 1];
  return isRecord(last) && validId(last.id) ? last.id : undefined;
}
function truncateAtAnchor(branch: unknown[], anchor: string): unknown[] | WorkerFailure {
  const index = branch.findIndex((entry) => isRecord(entry) && entry.id === anchor);
  return index < 0 ? failure("stale") : branch.slice(0, index + 1);
}
function projectHistory(branch: unknown[], page: number, projector: (branch: unknown[], page?: number) => SavedHistoryPage): SavedHistoryPage | WorkerFailure {
  try {
    const history = projector(branch, page);
    return validHistory(history) ? cloneHistory(history) : failure();
  } catch {
    return failure("stale");
  }
}
function projectPreview(branch: unknown[], index: number, offset: number, projector: HistoryPreviewProjector | undefined): SavedHistoryPreview | WorkerFailure {
  if (!projector) return failure();
  try {
    const preview = projector(branch, index, offset);
    return validPreview(preview) ? { ...preview } : failure();
  } catch {
    return failure("stale");
  }
}

export async function runSessionWorkerRequest(requestValue: unknown, environment: SessionWorkerEnvironment = {}, signal: AbortSignal = new AbortController().signal): Promise<WorkerFailure | WorkerSuccess> {
  if (!validRequest(requestValue) || signal.aborted) return failure();
  const request = requestValue;
  const fileSystem = environment.fileSystem ?? { stat: fsStat, realpath: fsRealpath };
  try {
    const manager = environment.sessionManager ?? await defaultSessionManager();
    const projectRoot = await canonicalDirectory(request.root, fileSystem);
    if (!projectRoot) return failure();
    if (request.action === "list") {
      const result = await loadMetadata(request, manager, projectRoot, fileSystem, signal);
      if (!result.ok) return result;
      const start = request.page * PAGE_SIZE;
      return { version: PROTOCOL_VERSION, ok: true, action: "list", entries: result.metadata.slice(start, start + PAGE_SIZE), page: request.page, total: result.metadata.length };
    }

    const selected = await selectSession(request, manager, projectRoot, fileSystem, signal);
    if ("ok" in selected) return selected;
    if (request.action === "inspect") {
      const anchor = anchorFor(selected.branch);
      if (anchor === undefined) return failure();
      const history = projectHistory(selected.branch, 0, environment.projectHistory ?? projectSavedHistory);
      if ("ok" in history) return history;
      return { version: PROTOCOL_VERSION, ok: true, action: "inspect", session: selected.metadata, history, anchor };
    }

    const anchored = truncateAtAnchor(selected.branch, request.anchor);
    if ("ok" in anchored) return anchored;
    if (request.action === "history") {
      const history = projectHistory(anchored, request.page, environment.projectHistory ?? projectSavedHistory);
      if ("ok" in history) return history;
      return { version: PROTOCOL_VERSION, ok: true, action: "history", history };
    }
    const previewProjector = environment.projectHistoryPreview ?? projectSavedHistoryPreview;
    const preview = projectPreview(anchored, request.index, request.offset, previewProjector);
    if ("ok" in preview) return preview;
    return { version: PROTOCOL_VERSION, ok: true, action: "preview", preview };
  } catch {
    return failure();
  }
}

async function readRequest(input: Readable): Promise<unknown> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  try {
    for await (const chunk of input) {
      const buffer = typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk as Uint8Array);
      bytes += buffer.byteLength;
      if (bytes > MAX_REQUEST_BYTES) return undefined;
      chunks.push(buffer);
    }
  } catch {
    return undefined;
  }
  if (chunks.length === 0) return undefined;
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; } catch { return undefined; }
}
async function writeResponse(output: Writable, response: WorkerFailure | WorkerSuccess): Promise<void> {
  let line: string;
  try { line = `${JSON.stringify(response)}\n`; } catch { line = `${JSON.stringify(failure())}\n`; }
  if (Buffer.byteLength(line, "utf8") > MAX_RESPONSE_BYTES) line = `${JSON.stringify(failure())}\n`;
  await new Promise<void>((resolve, reject) => output.write(line, (error?: Error | null) => error ? reject(error) : resolve()));
}
export async function runSessionWorkerCli(input: Readable = process.stdin, output: Writable = process.stdout, environment: SessionWorkerEnvironment = {}): Promise<void> {
  const controller = new AbortController();
  const abort = (): void => controller.abort();
  process.once("SIGTERM", abort);
  process.once("SIGINT", abort);
  try {
    const response = await runSessionWorkerRequest(await readRequest(input), environment, controller.signal);
    await writeResponse(output, response);
  } catch {
    await writeResponse(output, failure());
  } finally {
    process.off("SIGTERM", abort);
    process.off("SIGINT", abort);
  }
}
if (process.argv.includes(WORKER_ARG)) void runSessionWorkerCli();