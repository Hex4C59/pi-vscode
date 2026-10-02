import { searchSessionMetadata } from "./session-search-projection.js";
import { stat as fsStat, realpath as fsRealpath } from "node:fs/promises";
import path from "node:path";
import { sameNativePath } from "../index.js";
import type { Readable, Writable } from "node:stream";

import type { SavedHistoryPage, SavedHistoryPreview, SavedSession } from "../../extension/contracts/index.js";
import { projectSavedHistory, projectSavedHistoryPreview } from "./session-history-projection.js";
import {
  SESSION_PAGE_SIZE,
  SESSION_WORKER_ARG,
  SESSION_WORKER_MAX_FIRST_MESSAGE_LENGTH,
  SESSION_WORKER_MAX_MODIFIED_LENGTH,
  SESSION_WORKER_MAX_NAME_LENGTH,
  SESSION_WORKER_MAX_PATH_LENGTH,
  SESSION_WORKER_PROTOCOL_VERSION,
  SESSION_WORKER_REQUEST_LIMIT_BYTES,
  SESSION_WORKER_RESPONSE_LIMIT_BYTES,
  isBoundedSessionWorkerText,
  isSessionWorkerHistory,
  isSessionWorkerId,
  isSessionWorkerPreview,
  isSessionWorkerRecord,
  isSessionWorkerRequest,
  isSessionWorkerRoot,
  sessionWorkerFailure,
  type SessionWorkerFailure,
  type SessionWorkerHistoryRequest,
  type SessionWorkerInspectRequest,
  type SessionWorkerPreviewRequest,
  type SessionWorkerRequest,
  type SessionWorkerSuccess,
} from "./session-worker-protocol.js";

import type { SessionInfoLike, SessionManagerApi, SessionWorkerEnvironment, SessionListProgress, FileSystemApi, HistoryPreviewProjector } from "./types.js";
export type { SessionInfoLike, SessionManagerHandleLike, SessionManagerApi, SessionWorkerEnvironment } from "./types.js";

function failure(code: SessionWorkerFailure["code"] = "unavailable"): SessionWorkerFailure {
  return sessionWorkerFailure(code);
}
async function canonicalDirectory(value: string, fileSystem: FileSystemApi): Promise<string | undefined> {
  if (!isSessionWorkerRoot(value)) return undefined;
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
  return isSessionWorkerRecord(value)
    && isSessionWorkerId(value.id)
    && isBoundedSessionWorkerText(value.path, SESSION_WORKER_MAX_PATH_LENGTH)
    && path.isAbsolute(value.path)
    && isSessionWorkerRoot(value.cwd)
    && (value.name === undefined || typeof value.name === "string")
    && typeof value.firstMessage === "string"
    && value.modified instanceof Date
    && Number.isFinite(value.modified.getTime());
}
async function metadataFor(value: unknown, projectRoot: string, fileSystem: FileSystemApi): Promise<{ ok: true; metadata: SavedSession } | SessionWorkerFailure> {
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
      name: value.name === undefined ? null : clipText(value.name, SESSION_WORKER_MAX_NAME_LENGTH),
      firstMessage: clipText(value.firstMessage, SESSION_WORKER_MAX_FIRST_MESSAGE_LENGTH),
      modified: value.modified.toISOString().slice(0, SESSION_WORKER_MAX_MODIFIED_LENGTH),
    },
  };
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
async function loadMetadata(request: SessionWorkerRequest, manager: SessionManagerApi, projectRoot: string, fileSystem: FileSystemApi, signal: AbortSignal): Promise<{ ok: true; metadata: SavedSession[] } | SessionWorkerFailure> {
  if (signal.aborted) return failure();
  const boundedSearch = request.action === "list" && !!request.search;
  const budget = new AbortController();
  const progress: SessionListProgress = (loaded, total) => { if (boundedSearch && (loaded > 5000 || total > 5000)) budget.abort(); };
  let values: readonly SessionInfoLike[];
  try { values = await manager.list(request.root, undefined, progress, boundedSearch ? AbortSignal.any([signal, budget.signal]) : signal); }
  catch (error) { if (budget.signal.aborted) return failure("catalogue-too-large"); throw error; }
  if (budget.signal.aborted || (boundedSearch && Array.isArray(values) && values.length > 5000)) return failure("catalogue-too-large");
  if (signal.aborted || !Array.isArray(values)) return failure();
  const metadata: SavedSession[] = [];
  for (const value of values) {
    const result = await metadataFor(value, projectRoot, fileSystem);
    if (!result.ok) return result;
    metadata.push(result.metadata);
  }
  metadata.sort((left, right) => right.modified.localeCompare(left.modified) || left.id.localeCompare(right.id));
  return { ok: true, metadata };
}

type SelectedSession = { metadata: SavedSession; branch: unknown[] };
async function selectSession(request: SessionWorkerInspectRequest | SessionWorkerHistoryRequest | SessionWorkerPreviewRequest, manager: SessionManagerApi, projectRoot: string, fileSystem: FileSystemApi, signal: AbortSignal): Promise<SelectedSession | SessionWorkerFailure> {
  const selectedPath = manager.findById(request.root, request.id);
  if (typeof selectedPath !== "string" || !path.isAbsolute(selectedPath) || selectedPath.length > SESSION_WORKER_MAX_PATH_LENGTH) return failure();
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
  return isSessionWorkerRecord(last) && isSessionWorkerId(last.id) ? last.id : undefined;
}
function truncateAtAnchor(branch: unknown[], anchor: string): unknown[] | SessionWorkerFailure {
  const index = branch.findIndex((entry) => isSessionWorkerRecord(entry) && entry.id === anchor);
  return index < 0 ? failure("stale") : branch.slice(0, index + 1);
}
function projectHistory(branch: unknown[], page: number, projector: (branch: unknown[], page?: number) => SavedHistoryPage): SavedHistoryPage | SessionWorkerFailure {
  try {
    const history = projector(branch, page);
    return isSessionWorkerHistory(history) ? cloneHistory(history) : failure();
  } catch {
    return failure("stale");
  }
}
function projectPreview(branch: unknown[], index: number, offset: number, projector: HistoryPreviewProjector | undefined): SavedHistoryPreview | SessionWorkerFailure {
  if (!projector) return failure();
  try {
    const preview = projector(branch, index, offset);
    return isSessionWorkerPreview(preview) ? { ...preview } : failure();
  } catch {
    return failure("stale");
  }
}

export async function runSessionWorkerRequest(requestValue: unknown, environment: SessionWorkerEnvironment = {}, signal: AbortSignal = new AbortController().signal): Promise<SessionWorkerFailure | SessionWorkerSuccess> {
  if (!isSessionWorkerRequest(requestValue) || signal.aborted) return failure();
  const request = requestValue;
  const fileSystem = environment.fileSystem ?? { stat: fsStat, realpath: fsRealpath };
  try {
    const manager = environment.sessionManager ?? await defaultSessionManager();
    const projectRoot = await canonicalDirectory(request.root, fileSystem);
    if (!projectRoot) return failure();
    if (request.action === "list") {
      const result = await loadMetadata(request, manager, projectRoot, fileSystem, signal);
      if (!result.ok) return result;
      const metadata = request.search ? searchSessionMetadata(result.metadata, request.search) : result.metadata;
      const page = request.search ? Math.min(request.page, Math.max(0, Math.ceil(metadata.length / SESSION_PAGE_SIZE) - 1)) : request.page;
      const start = page * SESSION_PAGE_SIZE;
      return { version: SESSION_WORKER_PROTOCOL_VERSION, ok: true, action: "list", entries: metadata.slice(start, start + SESSION_PAGE_SIZE), page, total: metadata.length };
    }

    const selected = await selectSession(request, manager, projectRoot, fileSystem, signal);
    if ("ok" in selected) return selected;
    if (request.action === "inspect") {
      const anchor = anchorFor(selected.branch);
      if (anchor === undefined) return failure();
      const history = projectHistory(selected.branch, 0, environment.projectHistory ?? projectSavedHistory);
      if ("ok" in history) return history;
      return { version: SESSION_WORKER_PROTOCOL_VERSION, ok: true, action: "inspect", session: selected.metadata, history, anchor };
    }

    const anchored = truncateAtAnchor(selected.branch, request.anchor);
    if ("ok" in anchored) return anchored;
    if (request.action === "history") {
      const history = projectHistory(anchored, request.page, environment.projectHistory ?? projectSavedHistory);
      if ("ok" in history) return history;
      return { version: SESSION_WORKER_PROTOCOL_VERSION, ok: true, action: "history", history };
    }
    const previewProjector = environment.projectHistoryPreview ?? projectSavedHistoryPreview;
    const preview = projectPreview(anchored, request.index, request.offset, previewProjector);
    if ("ok" in preview) return preview;
    return { version: SESSION_WORKER_PROTOCOL_VERSION, ok: true, action: "preview", preview };
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
      if (bytes > SESSION_WORKER_REQUEST_LIMIT_BYTES) return undefined;
      chunks.push(buffer);
    }
  } catch {
    return undefined;
  }
  if (chunks.length === 0) return undefined;
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; } catch { return undefined; }
}
async function writeResponse(output: Writable, response: SessionWorkerFailure | SessionWorkerSuccess): Promise<void> {
  let line: string;
  try { line = `${JSON.stringify(response)}\n`; } catch { line = `${JSON.stringify(failure())}\n`; }
  if (Buffer.byteLength(line, "utf8") > SESSION_WORKER_RESPONSE_LIMIT_BYTES) line = `${JSON.stringify(failure())}\n`;
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
if (process.argv.includes(SESSION_WORKER_ARG)) void runSessionWorkerCli();