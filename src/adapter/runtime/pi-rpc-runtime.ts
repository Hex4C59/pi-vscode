import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { access } from "node:fs/promises";
import type { PiRpcRuntimeEnvironment } from "./types.js";
import { parseGateEnvelope, type GateCall } from "../../extension/contracts/index.js";
import { ActivityProjection, displayText } from "./activityProjection.js";
import { sameNativePath, controlledEnvironment, CONTROLLED_TOOLS } from "../index.js";
import type { Readable } from "node:stream";

import { attachJsonlLineReader, serializeJsonLine, serializePromptFrame } from "./jsonl.js";
import { resolvePiCliPath } from "./pi-rpc-probe.js";
import { readPiStartupModelArg } from "./piStartupModel.js";
import type {
  ModelMutationResult,
  ModelProjectionResult,
  PiRuntimeLifecycle,
  ProjectTrustFlag,
  RuntimeEvent,
  RuntimeStartResult,
} from "../../extension/contracts/index.js";
import { boundUserFacingDetail, formatRuntimeError } from "./runtime-errors.js";
import {
  formatModelLabel,
  parseModelCatalog,
  parseThinkingLevels,
  readThinkingLevel,
} from "./pi-rpc-model-parse.js";

const START_TIMEOUT_MS = 15_000;
const PROMPT_TIMEOUT_MS = 30_000;
const MODEL_RPC_TIMEOUT_MS = 15_000;
const STOP_TIMEOUT_MS = 5_000;

/** VS Code URI drives are lowercase; saved pi cwd may retain an uppercase drive.
 * Normalize separators/dot segments and the drive only, not potentially case-sensitive directory names. */
function sameGateCwd(candidate: string, owned: string): boolean {
  if (candidate === owned) return true;
  if (process.platform !== "win32") return false;
  return sameNativePath(candidate, owned);
}


type RpcResponse = {
  id?: string;
  type?: string;
  command?: string;
  success?: boolean;
  data?: unknown;
  finalError?: string;
};

export function createPiRpcRuntime(environment: PiRpcRuntimeEnvironment = {}): PiRuntimeLifecycle {
  let child: ChildProcess | null = null;
  let detachReader: (() => void) | null = null;
  let startToken = 0;
  let activeSession = 0;
  let promptInFlight = false;
  let promptAckPending = false;
  let requestCounter = 0;
  let gateId = '';
  let cwd = '';
  let gateReady = false;
  let aborting = false;
  let approvalHandler: ((call: GateCall) => Promise<boolean>) | undefined;
  const approvals = new Set<string>();
  const activity = new ActivityProjection();
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
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
    const id = typeof parsed.id === "string" ? parsed.id : undefined;
    if (parsed.type === 'extension_ui_request') {
      let envelope; try { envelope = parseGateEnvelope(JSON.parse(typeof parsed.message === 'string' ? parsed.message : 'null')); } catch { /* Invalid request is denied below. */ }
      if (envelope?.runtime === gateId && sameGateCwd(envelope.cwd, cwd) && envelope.kind === 'hello' && parsed.method === 'notify') { gateReady = true; return; }
      if (id && parsed.method === 'confirm') {
        const session = activeSession; const process = child;
        const reply = (allow: boolean): void => { approvals.delete(id); if (process === child) process?.stdin?.write(serializeJsonLine({type:'extension_ui_response',id,confirmed:allow && session===activeSession && !aborting})); };
        if (!gateReady || !session || aborting || envelope?.kind !== 'call' || envelope.runtime !== gateId || !sameGateCwd(envelope.cwd, cwd) || !approvalHandler) { reply(false); return; }
        approvals.add(id);
        void approvalHandler({ ...envelope, cwd }).then(reply,()=>reply(false));
      }
      return;
    }
    if (parsed.type === "response" && id && pending.has(id)) {
      pending.get(id)!(parsed as RpcResponse);
      pending.delete(id);
      return;
    }
    const session = activeSession;
    if (!session) return;
    if (parsed.type === "tool_execution_end" && typeof parsed.toolCallId === "string" && parsed.toolCallId.length > 0 && parsed.toolCallId.length <= 200 && typeof parsed.isError === "boolean") {
      emit({ kind: "tool_finished", session, toolCallId: parsed.toolCallId, failed: parsed.isError });
    }
    for (const item of activity.parse(parsed)) emit({kind:'activity',session,item});
    const finalMessage = parsed.message as Record<string,unknown> | undefined;
    if(parsed.type==='message_end' && finalMessage?.role==='assistant' && Array.isArray(finalMessage.content)) {
      const text=finalMessage.content.filter((p:Record<string,unknown>)=>p.type==='text'&&typeof p.text==='string').map((p:Record<string,unknown>)=>p.text).join('').slice(0,65536);
      emit({kind:'message_final',session,messageId:activity.currentMessageId(),text:displayText(text)});
    }
    if (parsed.type === "message_update") {
      const assistantMessageEvent = parsed.assistantMessageEvent as Record<string, unknown> | undefined;
      if (assistantMessageEvent?.type === "text_delta" && typeof assistantMessageEvent.delta === "string") {
        emit({ kind: "text_delta", delta: displayText(assistantMessageEvent.delta.slice(0,65536)), session, messageId:activity.currentMessageId() });
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
      aborting = false;
      emit({ kind: "agent_settled", session });
    }
  };

  const attachReader = (stdout: Readable): void => {
    if (detachReader) detachReader();
    detachReader = attachJsonlLineReader(stdout, handleLine, () => {
      const session=activeSession;
      emit({kind:'runtime_error',session,detail:'Runtime frame exceeded the safety limit. Restart required.'});
      void stop();
    });
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

  let shutdown: Promise<void> = Promise.resolve();
  let shutdownUnconfirmed = false;
  const stop = async (): Promise<void> => {
    const owned = child;
    child = null; // Detach synchronously: late loss/close cannot affect a replacement.
    if (startToken < Number.MAX_SAFE_INTEGER) startToken += 1;
    activeSession = 0;
    promptAckPending = false;
    promptInFlight = false;
    gateReady = false;
    aborting = false;
    activity.reset();
    for (const id of approvals) { try { owned?.stdin?.write(serializeJsonLine({type:'extension_ui_response',id,cancelled:true})); } catch { /* Terminate even if cancellation cannot be written. */ } }
    approvals.clear();
    for (const resolve of pending.values()) resolve({success:false});
    pending.clear();
    if (detachReader) {
      detachReader();
      detachReader = null;
    }
    if (owned) shutdown = stopChildProcess(owned, STOP_TIMEOUT_MS).then(closed => { if (!closed) shutdownUnconfirmed = true; });
    await shutdown;
  };

  const start = async (options: {
    cwd: string;
    projectTrust: ProjectTrustFlag;
    resume?: { id: string; path: string };
  }): Promise<RuntimeStartResult> => {
    await stop();
    if (shutdownUnconfirmed) return { ok: false, detail: "Runtime shutdown was not confirmed. Manually end the old process and reload the extension host." };
    if (startToken >= Number.MAX_SAFE_INTEGER) return { ok: false, detail: "Runtime identity exhausted. Reload the extension host." };
    const token = ++startToken;
    const cliPath = (environment.cliPath ?? resolvePiCliPath)();
    const trustArg = options.projectTrust === "approve" ? "--approve" : "--no-approve";
    gateId = randomUUID();
    cwd = options.cwd;
    const gatePath = path.join(__dirname, 'approval-gate.mjs');
    try { await (environment.gateAccess ?? access)(gatePath); } catch { return {ok:false,detail:'Bundled approval extension is missing. Tools remain disabled.'}; }
    if (token !== startToken) return { ok: false, detail: "Runtime start superseded" };
    if (options.resume && (!/^[A-Za-z0-9_-]{1,100}$/.test(options.resume.id) || !path.isAbsolute(options.resume.path))) return { ok: false, detail: "Saved session identity is invalid." };
    const args = ["--mode", "rpc", "--tools", CONTROLLED_TOOLS.join(','), '--no-extensions', '-e', gatePath, trustArg];
    if (options.resume) args.push("--session", options.resume.path);
    const startupModel = (environment.startupModel ?? readPiStartupModelArg)();
    if (startupModel) args.push("--model", startupModel);

    // Raw stderr may contain provider credentials; never project or accumulate it.
    try {
      child = (environment.spawn ?? spawn)(process.execPath, [cliPath, ...args], {
        cwd: options.cwd,
        stdio: ["pipe", "pipe", "pipe"],
        env: controlledEnvironment(process.env, gateId),
      });

      child.stderr?.resume();
      const owned = child;
      const lost = (): void => {
        if (owned !== child) return;
        const session = activeSession; activeSession = 0; gateReady = false; promptInFlight = false;
        for (const resolve of pending.values()) resolve({success:false}); pending.clear();
        if (session) emit({kind:'runtime_error',session,detail:'Runtime disconnected. Work may be interrupted; no task was retried.'});
        if (child === owned) void stop();
      };
      child.on('error',lost); child.on('close',lost); child.stdin?.on('error',lost);

      attachReader(child.stdout!);

      const requestId = `pi-vscode-get-state-${token}`;
      const waiting = waitForResponse(requestId, START_TIMEOUT_MS);
      child.stdin?.write(serializeJsonLine({ id: requestId, type: "get_state" }));
      const response = await waiting;

      if (token !== startToken) {
        return { ok: false, detail: "Runtime start superseded" };
      }
      if (!response.success || !gateReady) {
        await stop();
        return {
          ok: false,
          detail: 'Runtime readiness or approval extension verification failed.',
        };
      }
      const data = response.data as Record<string, unknown> | undefined;
      const identityValid = data && typeof data === "object" && typeof data.sessionId === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(data.sessionId) && typeof data.sessionFile === "string" && data.sessionFile.length <= 32768 && path.isAbsolute(data.sessionFile) && (data.sessionName == null || typeof data.sessionName === "string");
      if (!identityValid || (options.resume && (data.sessionId !== options.resume.id || !sameNativePath(data.sessionFile as string, options.resume.path)))) {
        await stop();
        return { ok: false, detail: "Saved session identity could not be verified. No conversation is ready." };
      }
      activeSession = token;
      return { ok: true, modelLabel: formatModelLabel(response.data), conversation: { id: data.sessionId as string, path: data.sessionFile as string, name: typeof data.sessionName === "string" ? data.sessionName.slice(0,160) : null } };
    } catch (error) {
      if (token === startToken) await stop();
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        detail: boundUserFacingDetail(message),
      };
    }
  };

  const invokeRpc = async (
    body: Record<string, unknown>,
    timeoutMs: number,
  ): Promise<RpcResponse> => {
    if (!child || !activeSession) {
      throw new Error("Runtime not ready.");
    }
    const session = activeSession;
    if (requestCounter >= Number.MAX_SAFE_INTEGER) throw new Error("Runtime request identities exhausted.");
    const requestId = `pi-vscode-rpc-${session}-${++requestCounter}`;
    const waiting = waitForResponse(requestId, timeoutMs);
    child.stdin?.write(serializeJsonLine({ id: requestId, ...body }));
    const response = await waiting;
    if (session !== activeSession) {
      throw new Error("Runtime restarted during request.");
    }
    return response;
  };

  const loadModelProjection = async (expectedSession = activeSession): Promise<ModelProjectionResult> => {
    const current = (): void => {
      if (!expectedSession || expectedSession !== activeSession) throw new Error("Runtime changed.");
    };
    try {
      current();
      const stateResponse = await invokeRpc({ type: "get_state" }, MODEL_RPC_TIMEOUT_MS);
      if (!stateResponse.success) {
        return { ok: false, detail: "Could not read runtime state." };
      }
      current();
      const modelsResponse = await invokeRpc({ type: "get_available_models" }, MODEL_RPC_TIMEOUT_MS);
      if (!modelsResponse.success) {
        return { ok: false, detail: "Could not list available models." };
      }
      current();
      const levelsResponse = await invokeRpc({ type: "get_available_thinking_levels" }, MODEL_RPC_TIMEOUT_MS);
      if (!levelsResponse.success) {
        return { ok: false, detail: "Could not list thinking levels." };
      }
      return {
        ok: true,
        modelLabel: formatModelLabel(stateResponse.data),
        thinkingLevel: readThinkingLevel(stateResponse.data),
        thinkingLevels: parseThinkingLevels(levelsResponse.data),
        models: parseModelCatalog(modelsResponse.data),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, detail: boundUserFacingDetail(message) };
    }
  };

  const setThinkingLevel = async (level: string): Promise<ModelMutationResult> => {
    const session = activeSession;
    if (promptInFlight) return { ok: false, detail: "Wait until the agent has settled." };
    try {
      const response = await invokeRpc({ type: "set_thinking_level", level }, MODEL_RPC_TIMEOUT_MS);
      if (!response.success) {
        return { ok: false, detail: "Could not change thinking level." };
      }
      return await loadModelProjection(session);
    } catch {
      return { ok: false, detail: "Could not apply model settings." };
    }
  };

  const setModel = async (provider: string, modelId: string): Promise<ModelMutationResult> => {
    const session = activeSession;
    if (promptInFlight) return { ok: false, detail: "Wait until the agent has settled." };
    try {
      const response = await invokeRpc({ type: "set_model", provider, modelId }, MODEL_RPC_TIMEOUT_MS);
      if (!response.success) {
        return { ok: false, detail: "Could not switch model." };
      }
      return await loadModelProjection(session);
    } catch {
      return { ok: false, detail: "Could not apply model settings." };
    }
  };

  const prompt = async (text: string): Promise<{ ok: true } | { ok: false; detail: string }> => {
    if (!child || !activeSession || !gateReady || aborting) {
      return { ok: false, detail: "Runtime not ready." };
    }
    if (promptInFlight || promptAckPending || requestCounter >= Number.MAX_SAFE_INTEGER) {
      return { ok: false, detail: "A message is already in progress or request identities are exhausted." };
    }
    const session = activeSession;
    const requestId = `pi-vscode-prompt-${session}-${++requestCounter}`;
    promptInFlight = true;
    try {
      const waiting = waitForResponse(requestId, PROMPT_TIMEOUT_MS);
      child.stdin?.write(serializePromptFrame(requestId, { kind: "plain", body: text }));
      const response = await waiting;
      if (session !== activeSession) {
        promptInFlight = false;
        return { ok: false, detail: "Runtime restarted during send." };
      }
      if (!response.success) {
        promptInFlight = false;
        return { ok: false, detail: "Prompt was rejected." };
      }
      return { ok: true };
    } catch {
      if (session === activeSession) {
        emit({kind:'runtime_error',session,detail:'Prompt acknowledgement was lost. Runtime shut down; task was not retried.'});
        await stop();
      }
      return { ok: false, detail: 'Prompt acknowledgement was lost; restart runtime before retrying.' };
    }
  };

  const preparePrompt: PiRuntimeLifecycle["preparePrompt"] = (input, expectedSession) => {
    if (requestCounter >= Number.MAX_SAFE_INTEGER) throw new Error("Runtime request identifiers exhausted. Restart required.");
    const requestId = `pi-vscode-prompt-${expectedSession}-${++requestCounter}`;
    let frame = serializePromptFrame(requestId, input);
    let consumed = false;
    return { send(onAttempt) {
      const owned = child;
      const stream = owned?.stdin;
      if (consumed || expectedSession !== activeSession || !activeSession || !gateReady || aborting || promptInFlight || promptAckPending || !stream || stream.destroyed || stream.writableEnded) {
        frame = "";
        return Promise.resolve({ delivery: "not-sent", code: "runtime-lost" });
      }
      consumed = true; promptInFlight = true; promptAckPending = true;
      return new Promise(resolve => {
        let attempted = false; let finished = false; let callback = false; let drained = false; let returned = false;
        let response: RpcResponse | undefined;
        const finish = (delivery: "rpc-accepted" | "rpc-rejected" | "not-sent" | "unknown", code?: "write-failed" | "ack-timeout" | "rpc-rejected" | "runtime-lost") => {
          if (finished) return; finished = true;
          if (activeSession === expectedSession) promptAckPending = false;
          clearTimeout(writeTimer); clearTimeout(ackTimer); pending.delete(requestId);
          stream.off("error", lost); stream.off("close", lost); stream.off("drain", drain); frame = "";
          if (delivery !== "rpc-accepted" && child === owned) promptInFlight = false;
          resolve({ delivery, ...(code ? { code } : {}) });
          if (delivery === "unknown" && child === owned) {
            emit({ kind: "runtime_error", session: expectedSession, detail: "Prompt delivery is uncertain. Runtime stopped; no retry was made." });
            void stop();
          }
        };
        const check = () => {
          if (!returned || !callback || !drained) return;
          clearTimeout(writeTimer);
          if (response) {
            if (activeSession !== expectedSession || response.command !== "prompt" || typeof response.success !== "boolean") finish("unknown", "runtime-lost");
            else finish(response.success ? "rpc-accepted" : "rpc-rejected", response.success ? undefined : "rpc-rejected");
          }
        };
        const lost = () => finish(attempted ? "unknown" : "not-sent", "write-failed");
        const drain = () => { drained = true; check(); };
        const writeTimer = setTimeout(lost, 5000);
        const ackTimer = setTimeout(() => finish("unknown", "ack-timeout"), 30000);
        pending.set(requestId, value => { response = value; check(); });
        stream.on("error", lost); stream.on("close", lost); stream.on("drain", drain);
        try {
          attempted = true; onAttempt();
          const accepted = stream.write(frame, error => { if (error) lost(); else { callback = true; check(); } });
          drained ||= accepted; returned = true; frame = ""; check();
        } catch { lost(); }
      });
    } };
  };

  return {
    start,
    stop,
    preparePrompt,
    setApprovalHandler(handler) { approvalHandler = handler; },
    async abortTask() {
      aborting = true;
      for (const id of approvals) child?.stdin?.write(serializeJsonLine({type:'extension_ui_response',id,cancelled:true}));
      approvals.clear();
      try {
        const clear = await invokeRpc({type:'clear_queue'}, STOP_TIMEOUT_MS);
        if (!clear.success) throw new Error();
        const abort = await invokeRpc({type:'abort'}, STOP_TIMEOUT_MS);
        if (!abort.success) throw new Error();
        if (promptInFlight) { await stop(); return {ok:false,detail:'Stop did not settle; runtime was shut down. Side effects are not rolled back.'}; }
        aborting = false;
        return {ok:true};
      } catch { await stop(); return {ok:false,detail:'Stop failed; runtime was shut down. Side effects are not rolled back.'}; }
    },
    getSession: () => activeSession,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    prompt,
    getModelProjection: loadModelProjection,
    setThinkingLevel,
    setModel,
  };
}

async function stopChildProcess(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return new Promise<boolean>((resolve) => {
    let finished = false;
    const finish = (confirmed: boolean) => {
      if (finished) return; finished = true;
      clearTimeout(escalate); clearTimeout(deadline); child.off("close", closed); resolve(confirmed);
    };
    const closed = () => finish(true);
    const escalate = setTimeout(() => { try { child.kill("SIGKILL"); } catch { /* Final deadline reports unconfirmed shutdown. */ } }, timeoutMs);
    const deadline = setTimeout(() => finish(false), timeoutMs * 2);
    child.once("close", closed);
    try { child.kill("SIGTERM"); } catch { /* Still observe closure or deadline. */ }
  });
}
