import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import path from "node:path";

import type {
  SavedHistoryPage,
  SavedHistoryPreview,
  SavedSession,
  SessionBackend,
  SessionBackendFailure,
} from "../extension/sessionBackend.js";
import { controlledEnvironment } from "./controlledEnvironment.js";

export const SESSION_WORKER_ARG = "--pi-vscode-session-worker";
export const SESSION_WORKER_PROTOCOL_VERSION = 1;
export const SESSION_PAGE_SIZE = 16;

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_TERMINATION_GRACE_MS = 1_000;
const DEFAULT_REQUEST_LIMIT_BYTES = 64 * 1024;
const DEFAULT_STDOUT_LIMIT_BYTES = 1024 * 1024;
const DEFAULT_STDERR_LIMIT_BYTES = 64 * 1024;
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

type WorkerListRequest = { version: typeof SESSION_WORKER_PROTOCOL_VERSION; action: "list"; root: string; page: number };
type WorkerInspectRequest = { version: typeof SESSION_WORKER_PROTOCOL_VERSION; action: "inspect"; root: string; id: string };
type WorkerHistoryRequest = { version: typeof SESSION_WORKER_PROTOCOL_VERSION; action: "history"; root: string; id: string; anchor: string; page: number };
type WorkerPreviewRequest = { version: typeof SESSION_WORKER_PROTOCOL_VERSION; action: "preview"; root: string; id: string; anchor: string; index: number; offset: number };
type WorkerRequest = WorkerListRequest | WorkerInspectRequest | WorkerHistoryRequest | WorkerPreviewRequest;

type HistoryProjection = SavedHistoryPage;
type PreviewProjection = SavedHistoryPreview;
const LOCAL_FAILURE = Symbol("session-backend-local-failure");
type LocalFailure = { ok: false; code: SessionBackendFailure["code"]; [LOCAL_FAILURE]: true };

function localFailure(code: SessionBackendFailure["code"]): LocalFailure {
  return { ok: false, code, [LOCAL_FAILURE]: true };
}
function publicFailure(value: LocalFailure): SessionBackendFailure {
  return { ok: false, code: value.code };
}
function isLocalFailure(value: unknown): value is LocalFailure {
  if (!isRecord(value)) return false;
  return (value as { [LOCAL_FAILURE]?: unknown })[LOCAL_FAILURE] === true
    && value.ok === false
    && typeof value.code === "string";
}

type ParsedWorkerResponse =
  | { ok: true; kind: "list"; entries: SavedSession[]; page: number; total: number }
  | { ok: true; kind: "inspect"; session: SavedSession; history: HistoryProjection; anchor: string | null }
  | { ok: true; kind: "history"; history: HistoryProjection }
  | { ok: true; kind: "preview"; preview: PreviewProjection }
  | SessionBackendFailure;

export type PiSessionBackendEnvironment = {
  spawn?: (command: string, args: readonly string[], options: SpawnOptions) => ChildProcess;
  execPath?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  terminationGraceMs?: number;
  requestLimitBytes?: number;
  stdoutLimitBytes?: number;
  stderrLimitBytes?: number;
};

type CloseResult = { code: number | null; signal: NodeJS.Signals | null };
type WorkerExit =
  | { kind: "close"; result: CloseResult }
  | { kind: "cancelled" }
  | { kind: "deadline" }
  | { kind: "error" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function isBoundedText(value: unknown, maxCharacters: number): value is string {
  return typeof value === "string" && Array.from(value).length <= maxCharacters;
}

function isValidRoot(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ROOT_LENGTH && path.isAbsolute(value);
}

function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH && /^[A-Za-z0-9_-]+$/.test(value);
}

function isValidPage(value: unknown, pageSize: number): value is number {
  return Number.isSafeInteger(value)
    && (value as number) >= 0
    && (value as number) <= Math.floor(Number.MAX_SAFE_INTEGER / pageSize);
}

function isValidHistory(value: unknown): value is HistoryProjection {
  if (!isRecord(value)
    || !hasExactKeys(value, ["messages", "page", "total"])
    || !Array.isArray(value.messages)
    || value.messages.length > MAX_HISTORY_ROWS
    || !isValidPage(value.page, 32)
    || !Number.isSafeInteger(value.total)
    || (value.total as number) < 0
    || (value.total as number) < value.messages.length) return false;

  let totalBytes = 0;
  for (const message of value.messages) {
    if (!isRecord(message)
      || (!hasExactKeys(message, ["role", "text"]) && !hasExactKeys(message, ["role", "text", "id"]))
      || (message.role !== "user" && message.role !== "assistant")
      || !isBoundedText(message.text, MAX_HISTORY_TEXT_LENGTH)
      || (Object.hasOwn(message, "id") && !isBoundedText(message.id, MAX_ID_LENGTH))) return false;
    totalBytes += Buffer.byteLength(message.text, "utf8");
    if (totalBytes > MAX_HISTORY_TOTAL_BYTES) return false;
  }
  return true;
}

function isValidPreview(value: unknown): value is PreviewProjection {
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

function isValidSavedSession(value: unknown): value is SavedSession {
  return isRecord(value)
    && hasExactKeys(value, ["id", "path", "name", "firstMessage", "modified"])
    && isValidId(value.id)
    && isBoundedText(value.path, MAX_PATH_LENGTH)
    && path.isAbsolute(value.path)
    && (value.name === null || isBoundedText(value.name, MAX_NAME_LENGTH))
    && isBoundedText(value.firstMessage, MAX_FIRST_MESSAGE_LENGTH)
    && isBoundedText(value.modified, MAX_MODIFIED_LENGTH)
    && Number.isFinite(Date.parse(value.modified));
}

function parseWorkerResponse(value: unknown, request: WorkerRequest): ParsedWorkerResponse {
  if (!isRecord(value) || value.version !== SESSION_WORKER_PROTOCOL_VERSION || typeof value.ok !== "boolean") return { ok: false, code: "unavailable" };
  if (!value.ok) {
    if (!hasExactKeys(value, ["version", "ok", "code"])) return { ok: false, code: "unavailable" };
    if (value.code === "wrong-project" || value.code === "stale") return { ok: false, code: value.code };
    return { ok: false, code: "unavailable" };
  }

  if (request.action === "list") {
    if (!hasExactKeys(value, ["version", "ok", "action", "entries", "page", "total"])
      || value.action !== "list"
      || !Array.isArray(value.entries)
      || value.entries.length > SESSION_PAGE_SIZE
      || !isValidPage(value.page, SESSION_PAGE_SIZE)
      || (value.page as number) !== request.page
      || !Number.isSafeInteger(value.total)
      || (value.total as number) < 0
      || (value.total as number) < value.entries.length) return { ok: false, code: "unavailable" };
    const entries = value.entries.filter(isValidSavedSession);
    if (entries.length !== value.entries.length || new Set(entries.map((entry) => entry.id)).size !== entries.length) return { ok: false, code: "unavailable" };
    return { ok: true, kind: "list", entries, page: value.page as number, total: value.total as number };
  }

  if (request.action === "inspect") {
    if (!hasExactKeys(value, ["version", "ok", "action", "session", "history", "anchor"])
      || value.action !== "inspect"
      || !isValidSavedSession(value.session)
      || !isValidHistory(value.history)
      || (value.anchor !== null && !isValidId(value.anchor))) return { ok: false, code: "unavailable" };
    return { ok: true, kind: "inspect", session: value.session, history: value.history, anchor: value.anchor };
  }

  if (request.action === "history") {
    if (!hasExactKeys(value, ["version", "ok", "action", "history"]) || value.action !== "history" || !isValidHistory(value.history)) return { ok: false, code: "unavailable" };
    return { ok: true, kind: "history", history: value.history };
  }

  if (!hasExactKeys(value, ["version", "ok", "action", "preview"]) || value.action !== "preview" || !isValidPreview(value.preview)) return { ok: false, code: "unavailable" };
  return { ok: true, kind: "preview", preview: value.preview };
}

function asBuffer(chunk: string | Buffer): Buffer {
  return Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
}

function waitForClose(closePromise: Promise<CloseResult>, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (closed: boolean): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(closed);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    timer.unref?.();
    void closePromise.then(() => finish(true));
  });
}

async function terminateChild(child: ChildProcess, closePromise: Promise<CloseResult>, graceMs: number): Promise<boolean> {
  try {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  } catch {
    // The close observation below is authoritative.
  }
  if (await waitForClose(closePromise, graceMs)) return true;
  try {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  } catch {
    // Report unavailable when close cannot be observed.
  }
  return waitForClose(closePromise, graceMs);
}

type WorkerLifecycle = { onSpawned: () => void; onClosed: () => void };

async function runWorker(workerPath: string, request: WorkerRequest, signal: AbortSignal, environment: PiSessionBackendEnvironment, lifecycle?: WorkerLifecycle): Promise<unknown | LocalFailure> {
  if (signal.aborted) return localFailure("cancelled");
  const requestLine = `${JSON.stringify(request)}\n`;
  if (Buffer.byteLength(requestLine, "utf8") > (environment.requestLimitBytes ?? DEFAULT_REQUEST_LIMIT_BYTES)) return localFailure("unavailable");

  let child: ChildProcess;
  try {
    const baseEnvironment = controlledEnvironment(environment.env ?? process.env, "session-backend");
    child = (environment.spawn ?? spawn)(environment.execPath ?? process.execPath, [workerPath, SESSION_WORKER_ARG], {
      env: { ...baseEnvironment, ELECTRON_RUN_AS_NODE: "1" },
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    return localFailure("unavailable");
  }
  const closePromise = new Promise<CloseResult>((resolve) => child.once("close", (code, closeSignal) => { lifecycle?.onClosed(); resolve({ code, signal: closeSignal }); }));
  lifecycle?.onSpawned();
  const stdoutChunks: Buffer[] = [];
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let childError = false;
  let stdoutOverflow = false;
  let stderrOverflow = false;
  let errorResolve!: (exit: WorkerExit) => void;
  const childErrorPromise = new Promise<WorkerExit>((resolve) => { errorResolve = resolve; });
  const markError = (): void => { childError = true; errorResolve({ kind: "error" }); };
  const stdoutLimit = environment.stdoutLimitBytes ?? DEFAULT_STDOUT_LIMIT_BYTES;
  const stderrLimit = environment.stderrLimitBytes ?? DEFAULT_STDERR_LIMIT_BYTES;

  child.once("error", markError);
  child.stdin?.once("error", markError);
  child.stdout?.on("data", (chunk: string | Buffer) => {
    const buffer = asBuffer(chunk);
    stdoutBytes += buffer.byteLength;
    if (stdoutBytes > stdoutLimit) { stdoutOverflow = true; markError(); return; }
    stdoutChunks.push(buffer);
  });
  child.stderr?.on("data", (chunk: string | Buffer) => {
    stderrBytes += Buffer.isBuffer(chunk) ? chunk.byteLength : Buffer.byteLength(chunk);
    if (stderrBytes > stderrLimit) { stderrOverflow = true; markError(); }
  });

  try {
    if (!child.stdin) markError();
    else child.stdin.end(requestLine);
  } catch {
    markError();
  }

  let abortResolve!: () => void;
  const abortPromise = new Promise<WorkerExit>((resolve) => { abortResolve = () => resolve({ kind: "cancelled" }); });
  const abortHandler = (): void => abortResolve();
  signal.addEventListener("abort", abortHandler, { once: true });
  if (signal.aborted) abortResolve();
  let deadlineResolve!: () => void;
  const deadlinePromise = new Promise<WorkerExit>((resolve) => { deadlineResolve = () => resolve({ kind: "deadline" }); });
  const deadlineTimer = setTimeout(deadlineResolve, environment.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  deadlineTimer.unref?.();

  const first = await Promise.race([
    closePromise.then((result): WorkerExit => ({ kind: "close", result })),
    childErrorPromise,
    abortPromise,
    deadlinePromise,
  ]);
  if (first.kind !== "close") {
    const closed = await terminateChild(child, closePromise, environment.terminationGraceMs ?? DEFAULT_TERMINATION_GRACE_MS);
    clearTimeout(deadlineTimer);
    signal.removeEventListener("abort", abortHandler);
    if (!closed) return localFailure("unavailable");
    return first.kind === "cancelled" ? localFailure("cancelled") : localFailure("unavailable");
  }

  clearTimeout(deadlineTimer);
  signal.removeEventListener("abort", abortHandler);
  const closeResult = first.result;
  if (childError || stdoutOverflow || stderrOverflow || closeResult.code !== 0 || closeResult.signal !== null) return localFailure("unavailable");
  const stdout = Buffer.concat(stdoutChunks).toString("utf8").trim();
  if (!stdout) return localFailure("unavailable");
  try { return JSON.parse(stdout) as unknown; } catch { return localFailure("unavailable"); }
}

function validListInput(cwd: string, page: number): boolean {
  return isValidRoot(cwd) && isValidPage(page, SESSION_PAGE_SIZE);
}

function validHistoryInput(cwd: string, id: string, anchor: string, page: number): boolean {
  return isValidRoot(cwd) && isValidId(id) && isValidId(anchor) && isValidPage(page, 32);
}

function validPreviewInput(cwd: string, id: string, anchor: string, index: number, offset: number): boolean {
  return isValidRoot(cwd) && isValidId(id) && isValidId(anchor) && isValidPage(index, 1) && isValidPage(offset, 1);
}

export function createPiSessionBackend(workerPath: string, environment: PiSessionBackendEnvironment = {}): SessionBackend {
  const resolvedWorkerPath = typeof workerPath === "string" && workerPath.length > 0 ? path.resolve(workerPath) : "";
  let blockedClose: Promise<void> | undefined;
  const call = async (request: WorkerRequest, signal: AbortSignal): Promise<unknown | LocalFailure> => {
    if (blockedClose) return localFailure("unavailable");
    let spawned = false;
    let resolveClose!: () => void;
    const gate = new Promise<void>((resolve) => { resolveClose = resolve; });
    blockedClose = gate;
    const result = await runWorker(resolvedWorkerPath, request, signal, environment, {
      onSpawned: () => { spawned = true; },
      onClosed: () => {
        resolveClose();
        if (blockedClose === gate) blockedClose = undefined;
      },
    });
    if (!spawned && blockedClose === gate) {
      blockedClose = undefined;
      resolveClose();
    }
    return result;
  };

  return {
    async list(cwd, page, signal) {
      if (!resolvedWorkerPath || !validListInput(cwd, page)) return { ok: false, code: "unavailable" };
      const response = await call({ version: SESSION_WORKER_PROTOCOL_VERSION, action: "list", root: cwd, page }, signal);
      if (isLocalFailure(response)) return publicFailure(response);
      const parsed = parseWorkerResponse(response, { version: SESSION_WORKER_PROTOCOL_VERSION, action: "list", root: cwd, page });
      return !parsed.ok ? parsed : parsed.kind === "list" ? { ok: true, entries: parsed.entries, page: parsed.page, total: parsed.total } : { ok: false, code: "unavailable" };
    },
    async inspect(cwd, id, signal) {
      if (!resolvedWorkerPath || !isValidRoot(cwd) || !isValidId(id)) return { ok: false, code: "unavailable" };
      const request: WorkerInspectRequest = { version: SESSION_WORKER_PROTOCOL_VERSION, action: "inspect", root: cwd, id };
      const response = await call(request, signal);
      if (isLocalFailure(response)) return publicFailure(response);
      const parsed = parseWorkerResponse(response, request);
      return !parsed.ok ? parsed : parsed.kind === "inspect" ? { ok: true, session: parsed.session, history: parsed.history, anchor: parsed.anchor } : { ok: false, code: "unavailable" };
    },
    async history(cwd, id, anchor, page, signal) {
      if (!resolvedWorkerPath || !validHistoryInput(cwd, id, anchor, page)) return { ok: false, code: "unavailable" };
      const request: WorkerHistoryRequest = { version: SESSION_WORKER_PROTOCOL_VERSION, action: "history", root: cwd, id, anchor, page };
      const response = await call(request, signal);
      if (isLocalFailure(response)) return publicFailure(response);
      const parsed = parseWorkerResponse(response, request);
      return !parsed.ok ? parsed : parsed.kind === "history" ? { ok: true, history: parsed.history } : { ok: false, code: "unavailable" };
    },
    async preview(cwd, id, anchor, index, offset, signal) {
      if (!resolvedWorkerPath || !validPreviewInput(cwd, id, anchor, index, offset)) return { ok: false, code: "unavailable" };
      const request: WorkerPreviewRequest = { version: SESSION_WORKER_PROTOCOL_VERSION, action: "preview", root: cwd, id, anchor, index, offset };
      const response = await call(request, signal);
      if (isLocalFailure(response)) return publicFailure(response);
      const parsed = parseWorkerResponse(response, request);
      return !parsed.ok ? parsed : parsed.kind === "preview" ? { ok: true, preview: parsed.preview } : { ok: false, code: "unavailable" };
    },
  };
}