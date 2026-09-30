import { chmod, lstat, unlink } from "node:fs/promises";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server, type Socket } from "node:net";
import path from "node:path";
import { runtimeControlPath } from "./control-protocol.js";
import { createRecoveryObserver } from "./recovery-observer.js";
import { createRecoveryStore } from "./recovery-store.js";
import type { RecoveryFence, RecoveryObserver } from "./types.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_INITIALIZE_BYTES = 64 * 1024;
const MAX_CONTROL_BYTES = 4 * 1024;
const MAX_CONTROL_SOCKETS = 4;
const CONTROL_IDLE_MS = 1_000;
const TERMINATE_GRACE_MS = 5_000;
const KILL_GRACE_MS = 5_000;

const invocation = process.argv;
if (invocation.length === 5 && invocation[2] === "--owned-runtime") {
  const [, , , directory, runId] = invocation;
  void supervise(directory, runId).catch(() => {
    // A supervisor failure deliberately leaves the pending fence untouched.
    process.exitCode = 1;
  });
}

type SupervisorState = "owned" | "owner-lost" | "exited" | "never-spawned" | "termination-unconfirmed";
type InitializeMessage = { version: 1; type: "initialize"; runId: string; cliPath: string; args: string[]; cwd: string };
type ControlRequest = { version: 1; runId: string; action: "observe" | "end" };
type ControlResponse = { version: 1; runId: string; state: SupervisorState; endRequested: boolean };

type KillTimers = { term: NodeJS.Timeout | undefined; kill: NodeJS.Timeout | undefined };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every(key => Object.hasOwn(value, key));
}

function parseInitialize(value: unknown, expectedRunId: string): InitializeMessage | undefined {
  if (!isRecord(value) || !hasExactKeys(value, ["version", "type", "runId", "cliPath", "args", "cwd"])) return undefined;
  try {
    const json = JSON.stringify(value);
    if (Buffer.byteLength(json, "utf8") > MAX_INITIALIZE_BYTES) return undefined;
  } catch {
    return undefined;
  }
  if (value.version !== 1 || value.type !== "initialize" || value.runId !== expectedRunId
    || typeof value.cliPath !== "string" || value.cliPath.length === 0 || value.cliPath.includes("\0")
    || !Array.isArray(value.args) || !value.args.every(argument => typeof argument === "string" && !argument.includes("\0"))
    || typeof value.cwd !== "string" || value.cwd.length === 0 || value.cwd.includes("\0")) return undefined;
  return value as InitializeMessage;
}

function parseControlRequest(buffer: Buffer, runId: string): ControlRequest | undefined {
  if (buffer.length === 0 || buffer.length > MAX_CONTROL_BYTES) return undefined;
  try {
    const value: unknown = JSON.parse(buffer.toString("utf8"));
    if (!isRecord(value) || !hasExactKeys(value, ["version", "runId", "action"])) return undefined;
    if (value.version !== 1 || value.runId !== runId || (value.action !== "observe" && value.action !== "end")) return undefined;
    return value as ControlRequest;
  } catch {
    return undefined;
  }
}

function validInvocation(directory: string, runId: string): boolean {
  return path.isAbsolute(directory) && !directory.includes("\0") && UUID.test(runId);
}

async function supervise(directory: string, runId: string): Promise<void> {
  let ownerLost = false;
  let initializationOpen = true;
  let initializeSeen = false;
  let pendingInitialize: unknown;
  let controlReady = false;
  let spawnAttempted = false;
  let childSpawned = false;
  let childExited = false;
  let endRequested = false;
  let terminationUnconfirmed = false;
  let state: SupervisorState = "owned";
  const recovery: {
    server: Server | undefined;
    fence: RecoveryFence | undefined;
    observer: RecoveryObserver | undefined;
    controlPath: string | undefined;
  } = { server: undefined, fence: undefined, observer: undefined, controlPath: undefined };
  let child: ChildProcess | undefined;
  let terminalWork: Promise<void> | undefined;
  let cleanupWork: Promise<void> | undefined;
  const sockets = new Set<Socket>();
  const killTimers: KillTimers = { term: undefined, kill: undefined };

  const currentState = (): SupervisorState => {
    if (terminationUnconfirmed) return "termination-unconfirmed";
    if (childExited && state !== "exited") return "termination-unconfirmed";
    return state;
  };

  const responseFor = (wasEndRequested = endRequested): ControlResponse => ({
    version: 1,
    runId,
    state: currentState(),
    endRequested: wasEndRequested,
  });

  const closeSocket = (socket: Socket): void => {
    sockets.delete(socket);
    socket.destroy();
  };

  const closeControlServer = async (): Promise<void> => {
    const activeServer = recovery.server;
    if (!activeServer) return;
    for (const socket of sockets) {
      if (!socket.writableEnded) socket.destroy();
    }
    if (activeServer.listening) {
      let timeout: NodeJS.Timeout | undefined;
      const closed = new Promise<void>(resolve => activeServer.close(() => resolve()));
      const bounded = new Promise<void>(resolve => {
        timeout = setTimeout(() => {
          for (const socket of sockets) socket.destroy();
          resolve();
        }, CONTROL_IDLE_MS + 250);
      });
      await Promise.race([closed, bounded]);
      clearTimeout(timeout);
    }
    if (process.platform !== "win32" && recovery.controlPath) {
      try {
        const stat = await lstat(recovery.controlPath);
        if (stat.isSocket() && !stat.isSymbolicLink()) await unlink(recovery.controlPath);
      } catch { /* The owned endpoint may already be gone. */ }
    }
  };

  const cleanup = (): Promise<void> => {
    if (cleanupWork) return cleanupWork;
    cleanupWork = (async () => {
      initializationOpen = false;
      clearTimeout(killTimers.term);
      clearTimeout(killTimers.kill);
      process.off("message", onMessage);
      process.off("disconnect", onOwnerLost);
      process.stdin.off("data", onParentInput);
      process.stdin.off("end", onOwnerLost);
      process.stdin.off("close", onParentLostClose);
      process.stdin.off("error", onOwnerLost);
      process.stdout.off("drain", onParentOutputDrain);
      process.stdout.off("close", onOwnerLost);
      process.stdout.off("error", onOwnerLost);
      process.stdin.pause();
      await closeControlServer();
      if (child) {
        child.stdin?.destroy();
        child.stdout?.destroy();
        child.stderr?.destroy();
      }
      process.stdin.destroy();
      if (process.connected) {
        try { process.disconnect?.(); } catch { /* Exit remains determined by durable recovery evidence. */ }
      }
      process.stdout.end();
      process.stderr.end();
    })();
    return cleanupWork;
  };

  const finishNeverSpawned = (): Promise<void> => {
    if (terminalWork) return terminalWork;
    const receiptWriter = recovery.observer;
    if (spawnAttempted || childSpawned || childExited || !receiptWriter) return Promise.resolve();
    initializationOpen = false;
    terminalWork = (async () => {
      try {
        const result = await receiptWriter.recordNeverSpawned();
        state = result.ok ? "never-spawned" : "termination-unconfirmed";
        if (!result.ok) process.exitCode = 1;
      } catch {
        state = "termination-unconfirmed";
        process.exitCode = 1;
      }
      await cleanup();
    })();
    return terminalWork;
  };

  const finishChildExit = (code: number | null, signal: NodeJS.Signals | null): Promise<void> => {
    if (terminalWork) return terminalWork;
    childExited = true;
    const receiptWriter = recovery.observer;
    clearTimeout(killTimers.term);
    clearTimeout(killTimers.kill);
    terminalWork = (async () => {
      if (!receiptWriter) {
        state = "termination-unconfirmed";
        process.exitCode = 1;
        await cleanup();
        return;
      }
      try {
        const result = await receiptWriter.recordExit(code, signal);
        state = result.ok ? "exited" : "termination-unconfirmed";
        if (!result.ok) process.exitCode = 1;
      } catch {
        state = "termination-unconfirmed";
        process.exitCode = 1;
      }
      await cleanup();
    })();
    return terminalWork;
  };

  const requestOwnedChildEnd = (): void => {
    if (endRequested || childExited || terminalWork) return;
    endRequested = true;
    beginTermination();
  };

  const markOwnerLost = (): void => {
    if (ownerLost || terminalWork) return;
    ownerLost = true;
    initializationOpen = false;
    if (!childExited) state = "owner-lost";
    process.stdin.pause();
    if (child?.stdout) child.stdout.resume();
    if (!spawnAttempted && controlReady) void finishNeverSpawned();
    else if (spawnAttempted) requestOwnedChildEnd();
  };

  function onOwnerLost(): void { markOwnerLost(); }
  function onParentLostClose(): void {
    if (!cleanupWork && !terminalWork) markOwnerLost();
  }
  function onParentOutputDrain(): void { child?.stdout?.resume(); }

  function onParentInput(chunk: Buffer | string): void {
    if (ownerLost || !childSpawned || childExited || !child?.stdin || child.stdin.destroyed || child.stdin.writableEnded) return;
    if (!child.stdin.write(chunk)) process.stdin.pause();
  }

  const onChildInputDrain = (): void => {
    if (!ownerLost && !childExited) process.stdin.resume();
  };

  const onChildOutput = (chunk: Buffer): void => {
    if (ownerLost || childExited) return;
    if (!process.stdout.writable || process.stdout.destroyed) {
      markOwnerLost();
      return;
    }
    try {
      if (!process.stdout.write(chunk)) child?.stdout?.pause();
    } catch {
      markOwnerLost();
    }
  };

  const onChildOutputError = (): void => {
    if (child?.stdout) child.stdout.resume();
  };

  const onMessage = (value: unknown): void => {
    if (!initializationOpen || initializeSeen || terminalWork) return;
    initializeSeen = true;
    pendingInitialize = value;
    if (controlReady) void acceptInitialize();
  };

  const beginTermination = (): void => {
    if (!child || !childSpawned || childExited || killTimers.term || terminationUnconfirmed) return;
    try { child.kill("SIGTERM"); } catch { /* Continue observation; a signal is not exit evidence. */ }
    killTimers.term = setTimeout(() => {
      killTimers.term = undefined;
      if (childExited || !child || terminationUnconfirmed) return;
      try { child.kill("SIGKILL"); } catch { /* Continue observation; a signal is not exit evidence. */ }
      killTimers.kill = setTimeout(() => {
        killTimers.kill = undefined;
        if (!childExited) terminationUnconfirmed = true;
      }, KILL_GRACE_MS);
      killTimers.kill.unref();
    }, TERMINATE_GRACE_MS);
    killTimers.term.unref();
  };

  const reply = (socket: Socket, response: ControlResponse, afterWrite?: () => void): void => {
    if (socket.destroyed) return;
    const text = `${JSON.stringify(response)}\n`;
    if (Buffer.byteLength(text, "utf8") > MAX_CONTROL_BYTES) { closeSocket(socket); return; }
    socket.once("finish", () => socket.destroy());
    socket.end(text, afterWrite);
  };

  const handleControl = (socket: Socket, request: ControlRequest): void => {
    if (request.action === "observe") {
      reply(socket, responseFor());
      return;
    }
    if (state === "exited" || state === "never-spawned") {
      reply(socket, responseFor(false));
      return;
    }
    if (!endRequested) {
      endRequested = true;
      reply(socket, responseFor(true), () => beginTermination());
      return;
    }
    reply(socket, responseFor(true));
  };

  const onControlConnection = (socket: Socket): void => {
    if (sockets.size >= MAX_CONTROL_SOCKETS || terminalWork) { socket.destroy(); return; }
    sockets.add(socket);
    socket.setTimeout(CONTROL_IDLE_MS, () => closeSocket(socket));
    let input = Buffer.alloc(0);
    let requestHandled = false;
    socket.on("data", (chunk: Buffer) => {
      if (requestHandled) { closeSocket(socket); return; }
      if (input.length + chunk.length > MAX_CONTROL_BYTES) { closeSocket(socket); return; }
      input = Buffer.concat([input, chunk]);
      const newline = input.indexOf(0x0a);
      if (newline < 0) return;
      if (newline !== input.length - 1) { closeSocket(socket); return; }
      const request = parseControlRequest(input.subarray(0, newline), runId);
      if (!request) { closeSocket(socket); return; }
      requestHandled = true;
      handleControl(socket, request);
    });
    socket.on("error", () => closeSocket(socket));
    socket.on("close", () => { sockets.delete(socket); });
  };

  const onServerError = (): void => {
    if (!controlReady && recovery.observer && !spawnAttempted) void finishNeverSpawned();
  };

  const acceptInitialize = async (): Promise<void> => {
    const currentFence = recovery.fence;
    if (!currentFence || !controlReady || !initializationOpen || terminalWork || spawnAttempted) return;
    if (ownerLost) { await finishNeverSpawned(); return; }
    const init = parseInitialize(pendingInitialize, runId);
    if (!init) { await finishNeverSpawned(); return; }
    spawnAttempted = true;
    let runtime: ChildProcess;
    try {
      runtime = spawn(process.execPath, [init.cliPath, ...init.args], {
        cwd: init.cwd,
        env: process.env,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch {
      spawnAttempted = false;
      await finishNeverSpawned();
      return;
    }
    child = runtime;
    runtime.once("spawn", () => {
      childSpawned = true;
      initializationOpen = false;
      runtime.stdin?.on("drain", onChildInputDrain);
      runtime.stdin?.on("error", onOwnerLost);
      runtime.stdout?.on("data", onChildOutput);
      runtime.stdout?.on("error", onChildOutputError);
      runtime.stderr?.resume();
      if (ownerLost) runtime.stdout?.resume();
      else process.stdin.resume();
      if (endRequested) beginTermination();
      if (!ownerLost && process.connected && runtime.pid !== undefined) {
        try {
          process.send?.({ version: 1, type: "spawned", runId, childId: currentFence.childId, pid: runtime.pid }, error => {
            if (error) markOwnerLost();
          });
        } catch {
          markOwnerLost();
        }
      }
    });
    runtime.once("error", () => {
      if (!childSpawned) {
        spawnAttempted = false;
        void finishNeverSpawned();
      }
    });
    runtime.once("exit", (code, signal) => { void finishChildExit(code, signal); });
  };

  process.on("message", onMessage);
  process.once("disconnect", onOwnerLost);
  process.stdin.on("data", onParentInput);
  process.stdin.once("end", onOwnerLost);
  process.stdin.once("close", onParentLostClose);
  process.stdin.on("error", onOwnerLost);
  process.stdout.on("drain", onParentOutputDrain);
  process.stdout.on("close", onOwnerLost);
  process.stdout.on("error", onOwnerLost);

  if (!validInvocation(directory, runId)) {
    initializationOpen = false;
    process.off("message", onMessage);
    process.off("disconnect", onOwnerLost);
    process.stdin.pause();
    if (process.connected) process.disconnect?.();
    process.stdin.destroy();
    process.exitCode = 1;
    return;
  }

  const pending = await createRecoveryStore(directory).inspect();
  if (pending.kind !== "pending" || pending.fence.runId !== runId) {
    initializationOpen = false;
    process.off("message", onMessage);
    process.off("disconnect", onOwnerLost);
    process.stdin.pause();
    if (process.connected) process.disconnect?.();
    process.stdin.destroy();
    process.exitCode = 1;
    return;
  }
  recovery.fence = pending.fence;
  recovery.observer = createRecoveryObserver(directory, pending.fence);
  recovery.controlPath = runtimeControlPath(directory, runId);
  const controlServer = createServer(onControlConnection);
  recovery.server = controlServer;
  controlServer.on("error", onServerError);

  try {
    await new Promise<void>((resolve, reject) => {
      controlServer.once("error", reject);
      controlServer.listen(recovery.controlPath!, () => {
        controlServer.off("error", reject);
        resolve();
      });
    });
    if (process.platform !== "win32") await chmod(recovery.controlPath!, 0o600);
  } catch {
    await finishNeverSpawned();
    return;
  }
  controlReady = true;
  if (ownerLost) await finishNeverSpawned();
  else if (initializeSeen) await acceptInitialize();
}
