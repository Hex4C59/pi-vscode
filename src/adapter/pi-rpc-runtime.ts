import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { access } from "node:fs/promises";
import { parseGateEnvelope, type GateCall } from "../extension/toolApproval.js";
import { ActivityProjection, displayText } from "./activityProjection.js";
import { controlledEnvironment } from './controlledEnvironment.js';
import { CONTROLLED_TOOLS } from "./approvalGate.js";
import type { Readable } from "node:stream";

import { attachJsonlLineReader, serializeJsonLine } from "./jsonl.js";
import { resolvePiCliPath } from "./pi-rpc-probe.js";
import { readPiStartupModelArg } from "./piStartupModel.js";
import type {
  ModelMutationResult,
  ModelProjectionResult,
  PiRuntimeLifecycle,
  ProjectTrustFlag,
  RuntimeEvent,
  RuntimeStartResult,
} from "../extension/runtimeLifecycle.js";
import { boundUserFacingDetail, formatRuntimeError } from "../extension/chatBounds.js";
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

type RpcResponse = {
  id?: string;
  type?: string;
  command?: string;
  success?: boolean;
  data?: unknown;
  finalError?: string;
};

export function createPiRpcRuntime(): PiRuntimeLifecycle {
  let child: ChildProcess | null = null;
  let detachReader: (() => void) | null = null;
  let startToken = 0;
  let activeSession = 0;
  let promptInFlight = false;
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
      if (envelope?.runtime === gateId && envelope.cwd === cwd && envelope.kind === 'hello' && parsed.method === 'notify') { gateReady = true; return; }
      if (id && parsed.method === 'confirm') {
        const session = activeSession; const process = child;
        const reply = (allow: boolean): void => { approvals.delete(id); if (process === child) process?.stdin?.write(serializeJsonLine({type:'extension_ui_response',id,confirmed:allow && session===activeSession && !aborting})); };
        if (!gateReady || !session || aborting || envelope?.kind !== 'call' || envelope.runtime !== gateId || envelope.cwd !== cwd || !approvalHandler) { reply(false); return; }
        approvals.add(id);
        void approvalHandler(envelope).then(reply,()=>reply(false));
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

  const stop = async (): Promise<void> => {
    startToken += 1;
    activeSession = 0;
    promptInFlight = false;
    gateReady = false;
    aborting = false;
    activity.reset();
    for (const id of approvals) child?.stdin?.write(serializeJsonLine({type:'extension_ui_response',id,cancelled:true}));
    approvals.clear();
    for (const resolve of pending.values()) resolve({success:false});
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
    gateId = randomUUID();
    cwd = options.cwd;
    const gatePath = path.join(__dirname, 'approval-gate.mjs');
    try { await access(gatePath); } catch { return {ok:false,detail:'Bundled approval extension is missing. Tools remain disabled.'}; }
    const args = ["--mode", "rpc", "--no-session", "--tools", CONTROLLED_TOOLS.join(','), '--no-extensions', '-e', gatePath, trustArg];
    const startupModel = readPiStartupModelArg();
    if (startupModel) args.push("--model", startupModel);

    // Raw stderr may contain provider credentials; never project or accumulate it.
    try {
      child = spawn(process.execPath, [cliPath, ...args], {
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
      activeSession = token;
      return { ok: true, modelLabel: formatModelLabel(response.data) };
    } catch (error) {
      await stop();
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
    if (promptInFlight) {
      return { ok: false, detail: "A message is already in progress." };
    }
    const session = activeSession;
    const requestId = `pi-vscode-prompt-${session}-${++requestCounter}`;
    promptInFlight = true;
    try {
      const waiting = waitForResponse(requestId, PROMPT_TIMEOUT_MS);
      child.stdin?.write(serializeJsonLine({ id: requestId, type: "prompt", message: text }));
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

  return {
    start,
    stop,
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

async function stopChildProcess(child: ChildProcess, timeoutMs: number): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => { child.kill('SIGKILL'); }, timeoutMs);
    child.once('close', () => { clearTimeout(timer); resolve(); });
    child.kill('SIGTERM');
  });
}
