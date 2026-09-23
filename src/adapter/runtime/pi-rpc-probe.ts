import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { attachJsonlLineReader, serializeJsonLine } from "./jsonl.js";

export type RuntimeProbeResult = {
  ok: boolean;
  detail: string;
  /** Present when ok */
  stateSummary?: string;
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

type RpcResponse = {
  id?: string;
  type?: string;
  command?: string;
  success?: boolean;
};

/**
 * Start pi in RPC mode, run one `get_state` round-trip, then stop the process.
 * Used for WI-001 `gate-runtime-host` evidence (no LLM calls).
 */
export async function runPiRuntimeProbe(options?: {
  cwd?: string;
  cliPath?: string;
}): Promise<RuntimeProbeResult> {
  const cliPath = options?.cliPath ?? resolvePiCliPath();
  const args = ["--mode", "rpc", "--no-session"];

  let child: ChildProcess | null = null;
  let stopReader: (() => void) | null = null;
  let stderr = "";

  try {
    child = spawn(process.execPath, [cliPath, ...args], {
      cwd: options?.cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    let resolveResponse!: (value: RpcResponse) => void;
    let rejectResponse!: (reason: Error) => void;
    const responsePromise = new Promise<RpcResponse>((resolve, reject) => {
      resolveResponse = resolve;
      rejectResponse = reject;
    });

    const timeout = setTimeout(() => {
      rejectResponse(new Error("Timed out waiting for get_state response"));
    }, STOP_TIMEOUT_MS);

    stopReader = attachJsonlLineReader(child.stdout!, (line) => {
      if (!line.trim()) {
        return;
      }
      let parsed: RpcResponse;
      try {
        parsed = JSON.parse(line) as RpcResponse;
      } catch {
        return;
      }
      if (
        parsed.type === "response" &&
        parsed.id === PROBE_ID &&
        parsed.command === "get_state"
      ) {
        clearTimeout(timeout);
        resolveResponse(parsed);
      }
    });

    child.stdin?.write(
      serializeJsonLine({ id: PROBE_ID, type: "get_state" }),
    );

    const response = await responsePromise;

    if (!response.success) {
      return {
        ok: false,
        detail: `get_state failed: ${JSON.stringify(response)} stderr=${stderr.slice(0, 500)}`,
      };
    }

    await stopChildProcess(child, STOP_TIMEOUT_MS);
    child = null;

    return {
      ok: true,
      detail: "get_state succeeded; process exited within timeout",
      stateSummary: "get_state ok",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      detail: `${message}${stderr ? ` stderr=${stderr.slice(0, 500)}` : ""}`,
    };
  } finally {
    if (stopReader) {
      stopReader();
    }
    if (child) {
      await stopChildProcess(child, STOP_TIMEOUT_MS);
    }
  }
}

async function stopChildProcess(
  child: ChildProcess,
  timeoutMs: number,
): Promise<void> {
  if (child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");

  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, timeoutMs);

    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}
