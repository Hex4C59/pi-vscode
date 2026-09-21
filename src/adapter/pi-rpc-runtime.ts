import { spawn, type ChildProcess } from "node:child_process";
import type { Readable } from "node:stream";

import { attachJsonlLineReader, serializeJsonLine } from "./jsonl.js";
import { resolvePiCliPath } from "./pi-rpc-probe.js";
import { readPiStartupModelArg } from "./piStartupModel.js";
import type {
  PiRuntimeLifecycle,
  ProjectTrustFlag,
  RuntimeEvent,
  RuntimeStartResult,
} from "../extension/runtimeLifecycle.js";
import { boundUserFacingDetail, formatRuntimeError } from "../extension/chatBounds.js";

const START_TIMEOUT_MS = 15_000;
const PROMPT_TIMEOUT_MS = 30_000;
const STOP_TIMEOUT_MS = 5_000;

type RpcResponse = {
  id?: string;
  type?: string;
  command?: string;
  success?: boolean;
  data?: unknown;
  finalError?: string;
};

function formatModelLabel(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const model = (data as Record<string, unknown>).model;
  if (!model || typeof model !== "object") return null;
  const entry = model as Record<string, unknown>;
  const id = typeof entry.id === "string" ? entry.id : typeof entry.modelId === "string" ? entry.modelId : null;
  const provider = typeof entry.provider === "string" ? entry.provider : null;
  if (id && provider) return `${provider} / ${id}`;
  return id ?? provider;
}

export function createPiRpcRuntime(): PiRuntimeLifecycle {
  let child: ChildProcess | null = null;
  let detachReader: (() => void) | null = null;
  let startToken = 0;
  let activeSession = 0;
  let promptInFlight = false;
  let requestCounter = 0;
  const listeners = new Set<(event: RuntimeEvent) => void>();
  const pending = new Map<string, (value: RpcResponse) => void>();

  const emit = (event: RuntimeEvent): void => {
    for (const listener of listeners) listener(event);
  };

  const handleLine = (line: string): void => {
    if (!line.trim()) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return;
    }
    const id = typeof parsed.id === "string" ? parsed.id : undefined;
    if (parsed.type === "response" && id && pending.has(id)) {
      pending.get(id)!(parsed as RpcResponse);
      pending.delete(id);
      return;
    }
    const session = activeSession;
    if (!session) return;
    if (parsed.type === "message_update") {
      const assistantMessageEvent = parsed.assistantMessageEvent as Record<string, unknown> | undefined;
      if (assistantMessageEvent?.type === "text_delta" && typeof assistantMessageEvent.delta === "string") {
        emit({ kind: "text_delta", delta: assistantMessageEvent.delta, session });
      }
      return;
    }
    if (parsed.type === "auto_retry_end" && parsed.success === false) {
      const detail = typeof parsed.finalError === "string" && parsed.finalError.trim()
        ? parsed.finalError
        : "Assistant request failed.";
      emit({ kind: "stream_error", session, detail: formatRuntimeError(detail) });
      return;
    }
    if (parsed.type === "agent_settled") {
      promptInFlight = false;
      emit({ kind: "agent_settled", session });
    }
  };

  const attachReader = (stdout: Readable): void => {
    if (detachReader) detachReader();
    detachReader = attachJsonlLineReader(stdout, handleLine);
  };

  const waitForResponse = (requestId: string, timeoutMs: number): Promise<RpcResponse> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error("Timed out waiting for RPC response"));
      }, timeoutMs);
      pending.set(requestId, (response) => {
        clearTimeout(timer);
        resolve(response);
      });
    });

  const stop = async (): Promise<void> => {
    startToken += 1;
    activeSession = 0;
    promptInFlight = false;
    pending.clear();
    if (detachReader) {
      detachReader();
      detachReader = null;
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
    const args = ["--mode", "rpc", "--no-session", "--no-tools", trustArg];
    const startupModel = readPiStartupModelArg();
    if (startupModel) args.push("--model", startupModel);

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

      attachReader(child.stdout!);

      const requestId = `pi-vscode-get-state-${token}`;
      child.stdin?.write(serializeJsonLine({ id: requestId, type: "get_state" }));
      const response = await waitForResponse(requestId, START_TIMEOUT_MS);

      if (token !== startToken) {
        return { ok: false, detail: "Runtime start superseded" };
      }
      if (!response.success) {
        await stop();
        return {
          ok: false,
          detail: boundUserFacingDetail(`get_state failed${stderr ? ` (${stderr.slice(0, 120)})` : ""}`),
        };
      }
      activeSession = token;
      return { ok: true, modelLabel: formatModelLabel(response.data) };
    } catch (error) {
      await stop();
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        detail: boundUserFacingDetail(`${message}${stderr ? ` (${stderr.slice(0, 120)})` : ""}`),
      };
    }
  };

  const prompt = async (text: string): Promise<{ ok: true } | { ok: false; detail: string }> => {
    if (!child || !activeSession) {
      return { ok: false, detail: "Runtime not ready." };
    }
    if (promptInFlight) {
      return { ok: false, detail: "A message is already in progress." };
    }
    const session = activeSession;
    const requestId = `pi-vscode-prompt-${session}-${++requestCounter}`;
    promptInFlight = true;
    try {
      child.stdin?.write(serializeJsonLine({ id: requestId, type: "prompt", message: text }));
      const response = await waitForResponse(requestId, PROMPT_TIMEOUT_MS);
      if (session !== activeSession) {
        promptInFlight = false;
        return { ok: false, detail: "Runtime restarted during send." };
      }
      if (!response.success) {
        promptInFlight = false;
        return { ok: false, detail: "Prompt was rejected." };
      }
      return { ok: true };
    } catch (error) {
      promptInFlight = false;
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, detail: boundUserFacingDetail(message) };
    }
  };

  return {
    start,
    stop,
    getSession: () => activeSession,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    prompt,
  };
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
