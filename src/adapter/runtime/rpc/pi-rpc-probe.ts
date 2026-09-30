import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { attachJsonlLineReader, serializeJsonLine } from "./jsonl.js";

export type RuntimeProbeResult = {
  ok: boolean;
  detail: string;
  /** Present when ok */
  stateSummary?: string;
};

export type RuntimeProbeSpawn = (
  command: string,
  args: readonly string[],
  options: SpawnOptions,
) => ChildProcess;

export type RuntimeProbeOptions = {
  cwd?: string;
  cliPath?: string;
  spawn?: RuntimeProbeSpawn;
  stopTimeoutMs?: number;
};

const PROBE_ID = "pi-vscode-probe-1";
const STOP_TIMEOUT_MS = 5_000;

export function resolvePiCliPath(searchRoots?: string[]): string {
  const roots =
    searchRoots ??
    [path.join(__dirname, ".."), path.join(__dirname, "../..")];
  for (const root of roots) {
    const cli = path.join(
      root,
      "node_modules",
      "@earendil-works",
      "pi-coding-agent",
      "dist",
      "bundle",
      "cli.js",
    );
    if (fs.existsSync(cli)) {
      return cli;
    }
  }
  throw new Error(
    "Could not locate @earendil-works/pi-coding-agent CLI (dist/bundle/cli.js)",
  );
}

type StopEvidence = {
  observedExit: boolean;
  termAccepted: boolean;
  killAccepted: boolean;
};

/**
 * Start pi in RPC mode, run one `get_state` round-trip, then stop the process.
 * Used for WI-001 `gate-runtime-host` evidence (no LLM calls).
 */
export async function runPiRuntimeProbe(
  options?: RuntimeProbeOptions,
): Promise<RuntimeProbeResult> {
  const cliPath = options?.cliPath ?? resolvePiCliPath();
  const stopTimeoutMs = options?.stopTimeoutMs ?? STOP_TIMEOUT_MS;
  const spawnChild = options?.spawn ?? spawn;
  let child: ChildProcess | null = null;
  const stderr = { text: "" };
  try {
    child = spawnChild(process.execPath, [cliPath, "--mode", "rpc", "--no-session"], {
      cwd: options?.cwd,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    const result = await observeProbe(child, stderr, stopTimeoutMs);
    child = null;
    return result;
  } catch (error) {
    return failDetail(errorMessage(error), stderr.text);
  } finally {
    if (child) {
      await boundedStop(child, stopTimeoutMs);
    }
  }
}

async function observeProbe(
  child: ChildProcess,
  stderr: { text: string },
  stopTimeoutMs: number,
): Promise<RuntimeProbeResult> {
  attachStderr(child, stderr);
  const stdout = child.stdout;
  if (!stdout) {
    return failDetail("Runtime pipes are unavailable.", stderr.text);
  }
  const pending = collectGetState(child, stdout, stopTimeoutMs);
  child.stdin?.write(serializeJsonLine({ id: PROBE_ID, type: "get_state" }));
  const response = await pending;
  return resultAfterStop(response, await boundedStop(child, stopTimeoutMs), stderr.text);
}

function collectGetState(
  child: ChildProcess,
  stdout: NonNullable<ChildProcess["stdout"]>,
  timeoutMs: number,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const handles: { timer?: ReturnType<typeof setTimeout>; stopReader: () => void } = {
      stopReader: () => undefined,
    };
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      if (handles.timer !== undefined) clearTimeout(handles.timer);
      handles.stopReader();
      action();
    };
    const onFailure = (error: unknown) => {
      finish(() => reject(error instanceof Error ? error : new Error(String(error))));
    };
    child.on("error", onFailure);
    child.stdin?.on("error", onFailure);
    stdout.on("error", onFailure);
    child.stderr?.on("error", onFailure);
    handles.timer = setTimeout(() => {
      finish(() => reject(new Error("Timed out waiting for get_state response")));
    }, timeoutMs);
    handles.stopReader = attachJsonlLineReader(stdout, (line) => {
      if (!line.trim()) return;
      const parsed = parseProbeLine(line);
      if (parsed === undefined || !isGetStateEnvelope(parsed)) return;
      finish(() => resolve(parsed));
    });
  });
}

function resultAfterStop(
  response: unknown,
  stop: StopEvidence,
  stderr: string,
): RuntimeProbeResult {
  if (!isGetStateEnvelope(response) || response.success !== true) {
    return failDetail(`get_state failed: ${JSON.stringify(response)}`, stderr);
  }
  if (!stop.observedExit) {
    const refused = !stop.termAccepted && !stop.killAccepted;
    return failDetail(
      refused
        ? "get_state succeeded; termination was refused and process exit was not observed"
        : "get_state succeeded; process exit was not observed",
      stderr,
    );
  }
  return {
    ok: true,
    detail: "get_state succeeded; process exited within timeout",
    stateSummary: "get_state ok",
  };
}

function parseProbeLine(line: string): unknown {
  try {
    return JSON.parse(line) as unknown;
  } catch {
    return undefined;
  }
}

function isGetStateEnvelope(
  value: unknown,
): value is { type: string; id: string; command: string; success: unknown } {
  if (value === null || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.type === "response" &&
    record.id === PROBE_ID &&
    record.command === "get_state"
  );
}

function attachStderr(child: ChildProcess, sink: { text: string }): void {
  child.stderr?.on("data", (chunk: Buffer) => {
    sink.text += chunk.toString();
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function failDetail(message: string, stderr: string): RuntimeProbeResult {
  return {
    ok: false,
    detail: `${message}${stderr ? ` stderr=${stderr.slice(0, 500)}` : ""}`,
  };
}

function hasExited(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null;
}

async function boundedStop(child: ChildProcess, timeoutMs: number): Promise<StopEvidence> {
  try {
    return await stopChildProcess(child, timeoutMs);
  } catch {
    return { observedExit: hasExited(child), termAccepted: false, killAccepted: false };
  }
}

async function stopChildProcess(
  child: ChildProcess,
  timeoutMs: number,
): Promise<StopEvidence> {
  if (hasExited(child)) {
    return { observedExit: true, termAccepted: true, killAccepted: true };
  }
  let observedExit = false;
  let termAccepted = true;
  let killAccepted = true;
  await new Promise<void>((resolve) => {
    let finished = false;
    const handles: {
      escalate?: ReturnType<typeof setTimeout>;
      deadline?: ReturnType<typeof setTimeout>;
    } = {};
    const finish = () => {
      if (finished) return;
      finished = true;
      if (handles.escalate !== undefined) clearTimeout(handles.escalate);
      if (handles.deadline !== undefined) clearTimeout(handles.deadline);
      child.off("exit", onExit);
      child.off("close", onExit);
      resolve();
    };
    const onExit = () => {
      observedExit = true;
      finish();
    };
    child.once("exit", onExit);
    child.once("close", onExit);
    try {
      termAccepted = child.kill("SIGTERM") !== false;
    } catch {
      termAccepted = false;
    }
    handles.escalate = setTimeout(() => {
      if (finished || hasExited(child)) return;
      try {
        killAccepted = child.kill("SIGKILL") !== false;
      } catch {
        killAccepted = false;
      }
    }, timeoutMs);
    handles.deadline = setTimeout(finish, timeoutMs * 2);
  });
  return { observedExit: observedExit || hasExited(child), termAccepted, killAccepted };
}
