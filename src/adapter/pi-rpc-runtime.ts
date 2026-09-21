import { spawn, type ChildProcess } from "node:child_process";

import { attachJsonlLineReader, serializeJsonLine } from "./jsonl.js";
import { resolvePiCliPath } from "./pi-rpc-probe.js";
import type { PiRuntimeLifecycle, ProjectTrustFlag, RuntimeStartResult } from "../extension/runtimeLifecycle.js";

const START_TIMEOUT_MS = 15_000;
const STOP_TIMEOUT_MS = 5_000;

type RpcResponse = {
  id?: string;
  type?: string;
  command?: string;
  success?: boolean;
};

export function createPiRpcRuntime(): PiRuntimeLifecycle {
  let child: ChildProcess | null = null;
  let stopReader: (() => void) | null = null;
  let startToken = 0;

  const stop = async (): Promise<void> => {
    startToken += 1;
    if (stopReader) {
      stopReader();
      stopReader = null;
    }
    if (child) {
      await stopChildProcess(child, STOP_TIMEOUT_MS);
      child = null;
    }
  };

  const start = async (options: {
    cwd: string;
    projectTrust: ProjectTrustFlag;
  }): Promise<RuntimeStartResult> => {
    await stop();
    const token = ++startToken;
    const cliPath = resolvePiCliPath();
    const trustArg = options.projectTrust === "approve" ? "--approve" : "--no-approve";
    const args = ["--mode", "rpc", "--no-session", trustArg];

    let stderr = "";
    try {
      child = spawn(process.execPath, [cliPath, ...args], {
        cwd: options.cwd,
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
        rejectResponse(new Error("Timed out waiting for get_state"));
      }, START_TIMEOUT_MS);

      const requestId = "pi-vscode-runtime-1";
      stopReader = attachJsonlLineReader(child.stdout!, (line) => {
        if (!line.trim()) return;
        let parsed: RpcResponse;
        try {
          parsed = JSON.parse(line) as RpcResponse;
        } catch {
          return;
        }
        if (
          parsed.type === "response" &&
          parsed.id === requestId &&
          parsed.command === "get_state"
        ) {
          clearTimeout(timeout);
          resolveResponse(parsed);
        }
      });

      child.stdin?.write(serializeJsonLine({ id: requestId, type: "get_state" }));

      const response = await responsePromise;
      if (token !== startToken) {
        return { ok: false, detail: "Runtime start superseded" };
      }
      if (!response.success) {
        await stop();
        return {
          ok: false,
          detail: `get_state failed${stderr ? ` (${stderr.slice(0, 200)})` : ""}`,
        };
      }
      return { ok: true };
    } catch (error) {
      await stop();
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        detail: `${message}${stderr ? ` (${stderr.slice(0, 200)})` : ""}`,
      };
    }
  };

  return { start, stop };
}

async function stopChildProcess(child: ChildProcess, timeoutMs: number): Promise<void> {
  if (child.exitCode !== null) return;
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
