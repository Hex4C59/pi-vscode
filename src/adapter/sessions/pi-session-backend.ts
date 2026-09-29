import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

import type { SessionBackend, SessionBackendFailure } from "../../extension/contracts/index.js";
import { controlledEnvironment } from "../index.js";
import type { PiSessionBackendEnvironment } from "./types.js";
import {
  SESSION_WORKER_ARG,
  SESSION_WORKER_PROTOCOL_VERSION,
  SESSION_WORKER_REQUEST_LIMIT_BYTES,
  SESSION_WORKER_RESPONSE_LIMIT_BYTES,
  isSessionWorkerRequest,
  parseSessionWorkerResponse,
  type SessionWorkerRequest,
} from "./session-worker-protocol.js";

export { SESSION_WORKER_ARG, SESSION_WORKER_PROTOCOL_VERSION, SESSION_PAGE_SIZE } from "./session-worker-protocol.js";
export type { PiSessionBackendEnvironment } from "./types.js";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_TERMINATION_GRACE_MS = 1_000;
const DEFAULT_STDERR_LIMIT_BYTES = 64 * 1024;
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

type CloseResult = { code: number | null; signal: NodeJS.Signals | null };
type WorkerExit =
  | { kind: "close"; result: CloseResult }
  | { kind: "cancelled" }
  | { kind: "deadline" }
  | { kind: "error" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

async function runWorker(workerPath: string, request: SessionWorkerRequest, signal: AbortSignal, environment: PiSessionBackendEnvironment, lifecycle?: WorkerLifecycle): Promise<unknown | LocalFailure> {
  if (signal.aborted) return localFailure("cancelled");
  const requestLine = `${JSON.stringify(request)}\n`;
  if (Buffer.byteLength(requestLine, "utf8") > (environment.requestLimitBytes ?? SESSION_WORKER_REQUEST_LIMIT_BYTES)) return localFailure("unavailable");

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
  const stdoutLimit = environment.stdoutLimitBytes ?? SESSION_WORKER_RESPONSE_LIMIT_BYTES;
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

export function createPiSessionBackend(workerPath: string, environment: PiSessionBackendEnvironment = {}): SessionBackend {
  const resolvedWorkerPath = typeof workerPath === "string" && workerPath.length > 0 ? path.resolve(workerPath) : "";
  let blockedClose: Promise<void> | undefined;
  const call = async (request: SessionWorkerRequest, signal: AbortSignal): Promise<unknown | LocalFailure> => {
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
      const request = { version: SESSION_WORKER_PROTOCOL_VERSION, action: "list" as const, root: cwd, page };
      if (!resolvedWorkerPath || !isSessionWorkerRequest(request)) return { ok: false, code: "unavailable" };
      const response = await call(request, signal);
      if (isLocalFailure(response)) return publicFailure(response);
      const parsed = parseSessionWorkerResponse(response, request);
      return !parsed.ok ? parsed : parsed.kind === "list" ? { ok: true, entries: parsed.entries, page: parsed.page, total: parsed.total } : { ok: false, code: "unavailable" };
    },
    async inspect(cwd, id, signal) {
      const request = { version: SESSION_WORKER_PROTOCOL_VERSION, action: "inspect" as const, root: cwd, id };
      if (!resolvedWorkerPath || !isSessionWorkerRequest(request)) return { ok: false, code: "unavailable" };
      const response = await call(request, signal);
      if (isLocalFailure(response)) return publicFailure(response);
      const parsed = parseSessionWorkerResponse(response, request);
      return !parsed.ok ? parsed : parsed.kind === "inspect" ? { ok: true, session: parsed.session, history: parsed.history, anchor: parsed.anchor } : { ok: false, code: "unavailable" };
    },
    async history(cwd, id, anchor, page, signal) {
      const request = { version: SESSION_WORKER_PROTOCOL_VERSION, action: "history" as const, root: cwd, id, anchor, page };
      if (!resolvedWorkerPath || !isSessionWorkerRequest(request)) return { ok: false, code: "unavailable" };
      const response = await call(request, signal);
      if (isLocalFailure(response)) return publicFailure(response);
      const parsed = parseSessionWorkerResponse(response, request);
      return !parsed.ok ? parsed : parsed.kind === "history" ? { ok: true, history: parsed.history } : { ok: false, code: "unavailable" };
    },
    async preview(cwd, id, anchor, index, offset, signal) {
      const request = { version: SESSION_WORKER_PROTOCOL_VERSION, action: "preview" as const, root: cwd, id, anchor, index, offset };
      if (!resolvedWorkerPath || !isSessionWorkerRequest(request)) return { ok: false, code: "unavailable" };
      const response = await call(request, signal);
      if (isLocalFailure(response)) return publicFailure(response);
      const parsed = parseSessionWorkerResponse(response, request);
      return !parsed.ok ? parsed : parsed.kind === "preview" ? { ok: true, preview: parsed.preview } : { ok: false, code: "unavailable" };
    },
  };
}