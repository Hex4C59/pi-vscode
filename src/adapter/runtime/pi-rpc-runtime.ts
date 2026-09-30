import { createExtensionFeedback } from "./extension-feedback.js";
import { extensionCommandNames, dispatchedExtensionCommand } from "./command-classification.js";
import { createInteractionWriter } from "./interaction-writer.js";
import { createRpcDialogs } from "./rpc-dialogs.js";
import { createRpcFrames, sameGateCwd } from "./rpc-frames.js";
import { createRpcOccupancy } from "./rpc-occupancy.js";
import { createRpcReplies, requireRpcResponse, RPC_PROTOCOL_ERROR, type RpcReplyResult, type RpcResponse } from "./rpc-replies.js";
import type { InteractionFormInput, InteractionReplyCallback } from "../../extension/interactions/index.js";
import type { RuntimeLink } from "./process/types.js";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { access } from "node:fs/promises";
import type { PiRpcRuntimeEnvironment } from "./types.js";
import type { GateCall } from "../../extension/contracts/index.js";
import { sameNativePath, controlledEnvironment, CONTROLLED_TOOLS } from "../index.js";
import type { Readable } from "node:stream";

import { attachJsonlLineReader, serializeJsonLine, serializePromptFrame } from "./jsonl.js";
import { resolvePiCliPath } from "./pi-rpc-probe.js";
import { readPiStartupModelArg } from "./piStartupModel.js";
import type {
  ExtensionExecutionProfile,
  ModelMutationResult,
  ModelProjectionResult,
  PiRuntimeLifecycle,
  ProjectTrustFlag,
  RuntimeEvent,
  RuntimeStartResult,
} from "../../extension/contracts/index.js";
import { boundUserFacingDetail, isAuthenticationError } from "./runtime-errors.js";
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

export function createPiRpcRuntime(environment: PiRpcRuntimeEnvironment): PiRuntimeLifecycle {
  let child: RuntimeLink | null = null;
  let detachLost: (() => void) | undefined;
  let detachReader: (() => void) | null = null;
  let startToken = 0;
  let activeSession = 0;
  let resumedConversation = false;
  let untouchedConversation = false;
  let commandNames: ReadonlySet<string> = new Set();
  let gateId = '';
  let cwd = '';
  let gateReady = false;
  let verifiedCustomTools: ReadonlySet<string> = new Set();
  let initializationFailed = false;
  let executionProfile: ExtensionExecutionProfile = { kind: "controlled" };
  let interactionHandler: ((form: InteractionFormInput, reply: InteractionReplyCallback) => void) | undefined;
  let dialogs: ReturnType<typeof createRpcDialogs> | undefined;
  let approvalHandler: ((call: GateCall) => Promise<boolean>) | undefined;
  const feedback = createExtensionFeedback();
  let feedbackHandler: Parameters<NonNullable<PiRuntimeLifecycle["setFeedbackHandler"]>>[0] | undefined;
  const frames = createRpcFrames();
  const occupancy = createRpcOccupancy();
  const replies = createRpcReplies();
  const listeners = new Set<(event: RuntimeEvent) => void>();

  const emit = (event: RuntimeEvent): void => {
    for (const listener of listeners) listener(event);
  };

  const applyRuntime = (result: Extract<ReturnType<ReturnType<typeof createRpcFrames>["interpret"]>, { kind: "runtime" }>): void => {
    if (result.conversationTouched) untouchedConversation = false;
    if (result.agentSettled) occupancy.noteAgentSettled();
    for (const event of result.events) emit(event);
    if (result.agentStarted) occupancy.noteAgentStarted();
  };

  const handleLine = (line: string): void => {
    if (!child) return;
    const interpreted = frames.interpret(line, {
      session: activeSession,
      aborting: occupancy.isStopping(),
      gateId,
      cwd,
      executionProfile,
    });
    if (interpreted.kind === "rpc") {
      if (replies.receive(interpreted.parsed) === "protocol-error") protocolFault();
      return;
    }
    if (interpreted.kind === "protocol-error") { protocolFault(); return; }
    if (interpreted.kind === "ignored") return;
    if (interpreted.kind === "extension_error") {
      if (!activeSession) { initializationFailed = true; void faultStop(); }
      else emit({ kind: 'stream_error', session: activeSession, detail: 'A runtime extension reported an error. Its operation may have failed; no automatic retry was made.' });
      return;
    }
    if (interpreted.kind === "hello") {
      const hello = interpreted.envelope;
      gateReady = executionProfile.kind === 'controlled' ? hello.profile !== 'trusted' : hello.profile === 'trusted' && Array.isArray(hello.customTools);
      verifiedCustomTools = gateReady && hello.profile === 'trusted' ? new Set(hello.customTools) : new Set();
      return;
    }
    if (interpreted.kind === "feedback") {
      feedback.accept(interpreted.parsed); feedbackHandler?.(feedback.snapshot()); return;
    }
    if (interpreted.kind === "interaction") {
      if (!dialogs) return; // A retired transport must not answer or retry.

      try {
        const interactionProcess = child;
        const interactionSession = activeSession;
        const opened = dialogs.open(interpreted.parsed);
        if (opened.kind === 'dialog') {
          occupancy.openDialog();
          let consumed = false;
          const answer: InteractionReplyCallback = async reply => {
            if (consumed) return;
            consumed = true;
            try { await opened.reply(reply); }
            finally {
              occupancy.closeDialog(interactionProcess);
              replies.resumeRemaining(occupancy.dialogs());
            }
          };
          if (executionProfile.kind !== 'trusted' || !interactionHandler || occupancy.isStopping()) {
            // Same replay registry, in-flight lease and bounded writer as a human reply.
            void Promise.resolve(answer({ kind: 'cancel', reason: occupancy.isStopping() ? 'stop' : 'unavailable' })).catch(() => undefined);
          } else {
            replies.pauseRemaining();
            interactionHandler(opened.form, answer);
          }
        }
        else if (opened.kind === 'rejected') {
          if (opened.code === 'identity-budget') {
            void faultStop();
            emit({ kind: 'runtime_error', session: interactionSession, detail: 'Extension interaction identity budget exhausted. Explicit safe recovery is required.' });
            return;
          }
          if (opened.cancellation) {
            occupancy.openDialog();
            void opened.cancellation.catch(() => undefined).finally(() => {
              occupancy.closeDialog(interactionProcess);
              replies.resumeRemaining(occupancy.dialogs());
            });
          }
          emit({ kind: 'stream_error', session: activeSession, detail: 'An unsupported or unsafe extension interaction was rejected.' });
        }
      } catch {
        const session = activeSession;
        void faultStop();
        emit({ kind: 'runtime_error', session, detail: 'Extension interaction transport failed. Work status is uncertain; no reply was retried.' });
      }
      return;
    }
    if (interpreted.kind === "approval") {
      const { id, envelope } = interpreted;
      const session = activeSession; const process = child;
      const reply = (allow: boolean): void => { occupancy.removeApproval(id); if (process === child) process?.stdin?.write(serializeJsonLine({type:'extension_ui_response',id,confirmed:allow && session===activeSession && !occupancy.isStopping()})); };
      if (!gateReady || !session || occupancy.isStopping() || envelope?.kind !== 'call' || envelope.runtime !== gateId || !sameGateCwd(envelope.cwd, cwd) || (envelope.category === 'custom' && (executionProfile.kind !== 'trusted' || !verifiedCustomTools.has(envelope.tool))) || !approvalHandler) { reply(false); return; }
      occupancy.addApproval(id);
      void approvalHandler({ ...envelope, cwd }).then(reply,()=>reply(false));
      return;
    }
    if (interpreted.kind === "runtime") applyRuntime(interpreted);
  };

  const attachReader = (stdout: Readable): void => {
    if (detachReader) detachReader();
    detachReader = attachJsonlLineReader(stdout, handleLine, () => {
      const session=activeSession;
      emit({kind:'runtime_error',session,detail:'Runtime frame exceeded the safety limit. Explicit recovery is required.'});
      void faultStop();
    });
  };

  const release = async (uncertain = false, failure: "disconnected" | "protocol-error" = "disconnected"): Promise<void> => {
    const owned = child;
    const reason = occupancy.classifyRelease({ forcedUncertain: uncertain, sessionActive: activeSession !== 0 });
    const cancelling = [...occupancy.approvalIds()];
    dialogs?.invalidate(); dialogs = undefined;
    occupancy.reset();
    feedback.reset(); feedbackHandler?.(feedback.snapshot());
    child = null; // Detach synchronously: late loss/close cannot affect a replacement.
    if (startToken < Number.MAX_SAFE_INTEGER) startToken += 1;
    activeSession = 0;
    commandNames = new Set();
    gateReady = false; verifiedCustomTools = new Set();
    frames.reset();
    if (detachReader) {
      detachReader();
      detachReader = null;
    }
    detachLost?.(); detachLost = undefined;
    for (const id of cancelling) { try { owned?.stdin?.write(serializeJsonLine({type:'extension_ui_response',id,cancelled:true})); } catch { /* Release the transport even if cancellation cannot be written. */ } }
    replies.failAll(failure);
    await environment.process.release(reason);
  };
  const stop = (): Promise<void> => release();
  const faultStop = (failure: "disconnected" | "protocol-error" = "disconnected"): Promise<void> => release(true, failure);
  const protocolFault = (): void => {
    if (!child) return;
    const session = activeSession;
    // release revokes the connection synchronously before pending callers or UI observe failure.
    void faultStop("protocol-error").catch(() => undefined);
    emit({ kind: "runtime_error", session, detail: RPC_PROTOCOL_ERROR });
  };

  const start = async (options: {
    cwd: string;
    projectTrust: ProjectTrustFlag;
    profile?: ExtensionExecutionProfile;
    resume?: { id: string; path: string };
  }): Promise<RuntimeStartResult> => {
    await stop();
    if (startToken >= Number.MAX_SAFE_INTEGER) return { ok: false, detail: "Runtime identity exhausted. Reload the extension host." };
    const token = ++startToken;
    const cliPath = (environment.cliPath ?? resolvePiCliPath)();
    const trustArg = options.projectTrust === "approve" ? "--approve" : "--no-approve";
    initializationFailed = false;
    executionProfile = options.profile ?? { kind: "controlled" };
    if (executionProfile.kind === "trusted" && (!path.isAbsolute(executionProfile.entryPath) || executionProfile.entryPath.includes("\0"))) return { ok: false, detail: "Extension entry is invalid." };
    gateId = randomUUID();
    cwd = options.cwd;
    const gatePath = path.join(__dirname, 'approval-gate.mjs');
    try { await (environment.gateAccess ?? access)(gatePath); } catch { return {ok:false,detail:'Bundled approval extension is missing. Tools remain disabled.'}; }
    if (token !== startToken) return { ok: false, detail: "Runtime start superseded" };
    if (options.resume && (!/^[A-Za-z0-9_-]{1,100}$/.test(options.resume.id) || !path.isAbsolute(options.resume.path))) return { ok: false, detail: "Saved session identity is invalid." };
    // pi's --tools allowlist also filters registered extension tools out of getAllTools().
    // Trusted inventory is instead validated and activated by the bundled approval gate.
    const toolArgs = executionProfile.kind === "controlled" ? ["--tools", CONTROLLED_TOOLS.join(',')] : [];
    const args = ["--mode", "rpc", ...toolArgs, '--no-extensions', '-e', gatePath, trustArg];
    if (executionProfile.kind === "trusted") args.push("-e", executionProfile.entryPath);
    if (options.resume) args.push("--session", options.resume.path);
    const startupModel = (environment.startupModel ?? readPiStartupModelArg)();
    if (startupModel) args.push("--model", startupModel);

    // Raw stderr may contain provider credentials; never project or accumulate it.
    try {
      const runtimeEnv = { ...controlledEnvironment(process.env, gateId), PI_VSCODE_EXTENSION_PROFILE: executionProfile.kind };
      const launched = await environment.process.launch({ cwd: options.cwd, cliPath, args, env: runtimeEnv });
      if (!launched.ok) return launched;
      if (token !== startToken) return { ok: false, detail: "Runtime start superseded" };
      child = launched.link;
      const owned = child;
      occupancy.bind({ connection: owned, session: 0 });
      if (!owned.stdin) throw new Error('Extension interaction input is unavailable.');
      const writeInteraction = createInteractionWriter(owned.stdin, () => child === owned);
      dialogs = createRpcDialogs(async frame => {
        try { await writeInteraction(frame); }
        catch {
          if (child === owned) {
            const session = activeSession;
            void faultStop();
            emit({ kind: 'runtime_error', session, detail: environment.process.describeFailure("reply-delivery") });
          }
          throw new Error('Extension reply delivery is unconfirmed.');
        }
      });
      const lost = (): void => {
        if (owned !== child) return;
        const session = activeSession; activeSession = 0; gateReady = false; occupancy.disconnectSend();
        replies.failAll();
        if (session) emit({kind:'runtime_error',session,detail:'Runtime disconnected. Work may be interrupted; no task was retried.'});
        if (child === owned) {
          void faultStop();
        }
      };
      detachLost = child.onLost(lost);

      attachReader(child.stdout);

      const requestId = replies.startupId(token);
      const waiting = replies.wait(requestId, "get_state", START_TIMEOUT_MS, { pauseable: executionProfile.kind === "trusted", outstanding: () => occupancy.dialogs() });
      child.stdin?.write(serializeJsonLine({ id: requestId, type: "get_state" }));
      const response = requireRpcResponse(await waiting);

      if (token !== startToken) {
        return { ok: false, detail: "Runtime start superseded" };
      }
      if (!response.success || !gateReady || initializationFailed) {
        await faultStop();
        return {
          ok: false,
          detail: 'Runtime readiness or approval extension verification failed.',
        };
      }
      const data = response.data as Record<string, unknown> | undefined;
      const identityValid = data && typeof data === "object" && typeof data.sessionId === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(data.sessionId) && typeof data.sessionFile === "string" && data.sessionFile.length <= 32768 && path.isAbsolute(data.sessionFile) && (data.sessionName == null || typeof data.sessionName === "string");
      if (!identityValid || (options.resume && (data.sessionId !== options.resume.id || !sameNativePath(data.sessionFile as string, options.resume.path)))) {
        await faultStop();
        return { ok: false, detail: "Saved session identity could not be verified. No conversation is ready." };
      }
      activeSession = token;
      occupancy.setSession(token);
      resumedConversation = options.resume !== undefined;
      untouchedConversation = !resumedConversation;
      if (executionProfile.kind === 'trusted') {
        const catalogue = await invokeRpc({ type: 'get_commands' }, START_TIMEOUT_MS);
        const names = catalogue.success ? extensionCommandNames(catalogue.data) : undefined;
        if (!names) { await faultStop(); return { ok: false, detail: 'Extension command catalogue could not be verified.' }; }
        commandNames = names;
      }
      return { ok: true, modelLabel: formatModelLabel(response.data), conversation: { id: data.sessionId as string, path: data.sessionFile as string, name: typeof data.sessionName === "string" ? data.sessionName.slice(0,160) : null } };
    } catch (error) {
      if (token === startToken) await faultStop();
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        detail: boundUserFacingDetail(message),
      };
    }
  };

  const invokeRpc = async (
    body: { type: string; [key: string]: unknown },
    timeoutMs: number,
  ): Promise<RpcResponse> => {
    if (!child || !activeSession) {
      throw new Error("Runtime not ready.");
    }
    const session = activeSession;
    const requestId = replies.rpcId(session);
    const waiting = replies.wait(requestId, body.type, timeoutMs);
    child.stdin?.write(serializeJsonLine({ id: requestId, ...body }));
    const response = requireRpcResponse(await waiting);
    if (session !== activeSession) {
      throw new Error("Runtime restarted during request.");
    }
    return response;
  };

  const checkpointRestart: NonNullable<PiRuntimeLifecycle["checkpointRestart"]> = async expected => {
    const session = activeSession;
    const idle = () => session !== 0 && session === activeSession && gateReady && occupancy.allowsRestart();
    const stateMatches = (response: RpcResponse, count?: number): boolean => {
      if (!response.success || !response.data || typeof response.data !== "object") return false;
      const state = response.data as Record<string, unknown>;
      return state.sessionId === expected.id && typeof state.sessionFile === "string" && sameNativePath(state.sessionFile, expected.path)
        && state.isStreaming === false && state.isCompacting === false && state.pendingMessageCount === 0
        && Number.isSafeInteger(state.messageCount) && (state.messageCount as number) >= 0
        && (count === undefined || state.messageCount === count);
    };
    try {
      if (!idle()) return { kind: "unavailable" };
      // Statistics are content-independent; never fetch history across the bounded JSONL transport.
      const before = await invokeRpc({ type: "get_state" }, 5000);
      if (!idle() || !stateMatches(before)) return { kind: "unavailable" };
      const response = await invokeRpc({ type: "get_session_stats" }, 5000);
      if (!idle() || !response.success || !response.data || typeof response.data !== "object") return { kind: "unavailable" };
      const stats = response.data as Record<string, unknown>;
      if (stats.sessionId !== expected.id || typeof stats.sessionFile !== "string" || !sameNativePath(stats.sessionFile, expected.path)
        || !Number.isSafeInteger(stats.assistantMessages) || !Number.isSafeInteger(stats.totalMessages)
        || (stats.assistantMessages as number) < 0 || (stats.totalMessages as number) < (stats.assistantMessages as number)) return { kind: "unavailable" };
      const messageCount = (before.data as Record<string, unknown>).messageCount as number;
      const after = await invokeRpc({ type: "get_state" }, 5000);
      if (!idle() || !stateMatches(after, messageCount)) return { kind: "unavailable" };
      if (messageCount === 0 && stats.totalMessages === 0 && untouchedConversation) return { kind: "empty" };
      // pi 0.86.1 flushes fresh session entries only once an assistant exists.
      // Stats count all entries, unlike active-branch messageCount after compaction.
      // A verified saved-session start is already durable, even with empty context.
      if (resumedConversation || (stats.assistantMessages as number) > 0) {
        return { kind: "resume", conversation: { ...expected } };
      }
      return { kind: "unavailable" };
    } catch { return { kind: "unavailable" }; }
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
    if (!occupancy.allowsModelMutation()) return { ok: false, detail: "Wait until the agent has settled." };
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
    if (!occupancy.allowsModelMutation()) return { ok: false, detail: "Wait until the agent has settled." };
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
    if (!child || !activeSession || !gateReady || occupancy.isStopping()) {
      return { ok: false, detail: "Runtime not ready." };
    }
    if (!occupancy.allowsSend() || replies.exhausted()) {
      return { ok: false, detail: "A message is already in progress or request identities are exhausted." };
    }
    const session = activeSession;
    const requestId = replies.promptId(session);
    occupancy.beginPrompt(); untouchedConversation = false;
    try {
      const waiting = replies.wait(requestId, "prompt", PROMPT_TIMEOUT_MS);
      child.stdin?.write(serializePromptFrame(requestId, { kind: "plain", body: text }));
      const response = requireRpcResponse(await waiting);
      if (session !== activeSession) {
        occupancy.rejectSend(child);
        return { ok: false, detail: "Runtime restarted during send." };
      }
      if (!response.success) {
        occupancy.rejectSend(child);
        return { ok: false, detail: "Prompt was rejected." };
      }
      return { ok: true };
    } catch {
      if (session === activeSession) {
        emit({kind:'runtime_error',session,detail:environment.process.describeFailure("prompt-ack")});
        await faultStop();
      }
      return { ok: false, detail: 'Prompt acknowledgement was lost; restart runtime before retrying.' };
    }
  };

  const preparePrompt: PiRuntimeLifecycle["preparePrompt"] = (input, expectedSession) => {
    if (replies.exhausted()) throw new Error("Runtime request identifiers exhausted. Restart required.");
    const requestId = replies.promptId(expectedSession);
    let frame = serializePromptFrame(requestId, input);
    const command = dispatchedExtensionCommand(input, commandNames);
    let consumed = false;
    return { send(onAttempt) {
      const owned = child;
      const stream = owned?.stdin;
      if (consumed || expectedSession !== activeSession || !activeSession || !gateReady || !occupancy.allowsSend() || !stream || stream.destroyed || stream.writableEnded) {
        frame = "";
        return Promise.resolve({ delivery: "not-sent", code: "runtime-lost" });
      }
      consumed = true; occupancy.beginSend({ command: command !== undefined });
      return new Promise(resolve => {
        let attempted = false; let finished = false; let callback = false; let drained = false; let returned = false;
        let reply: RpcReplyResult | undefined;
        const finish = (delivery: "rpc-accepted" | "rpc-rejected" | "not-sent" | "unknown", code?: "write-failed" | "ack-timeout" | "rpc-rejected" | "runtime-lost") => {
          if (finished) return; finished = true;
          occupancy.clearAck(expectedSession);
          clearTimeout(writeTimer); clearTimeout(ackTimer); replies.drop(requestId);
          stream.off("error", lost); stream.off("close", lost); stream.off("drain", drain); frame = "";
          if (delivery !== "rpc-accepted" && child === owned) occupancy.rejectSend(owned);
          if (command && child === owned) occupancy.finishCommand(owned);
          const response = reply?.kind === "response" ? reply.response : undefined;
          const rejection = delivery === "rpc-rejected" && typeof response?.error === "string" && isAuthenticationError(response.error)
            ? "authentication" as const : undefined;
          resolve({ delivery, ...(code ? { code } : {}), ...(rejection ? { rejection } : {}) });
          if (command && delivery === "rpc-accepted" && child === owned) emit({ kind: "command_handled", session: expectedSession, agentRunning: occupancy.agentRunning() });
          if (delivery === "unknown" && child === owned && reply?.kind !== "failure") {
            emit({ kind: "runtime_error", session: expectedSession, detail: environment.process.describeFailure("prompt-delivery") });
            void faultStop();
          }
        };
        const check = () => {
          if (reply?.kind === "failure") { finish(attempted ? "unknown" : "not-sent", "runtime-lost"); return; }
          if (!returned || !callback || !drained) return;
          clearTimeout(writeTimer);
          if (reply?.kind === "response") {
            if (activeSession !== expectedSession) finish("unknown", "runtime-lost");
            else finish(reply.response.success ? "rpc-accepted" : "rpc-rejected", reply.response.success ? undefined : "rpc-rejected");
          }
        };
        const lost = () => finish(attempted ? "unknown" : "not-sent", "write-failed");
        const drain = () => { drained = true; check(); };
        const writeTimer = setTimeout(lost, 5000);
        const ackTimer = command ? undefined : setTimeout(() => finish("unknown", "ack-timeout"), 30000);
        replies.watch(requestId, "prompt", value => { reply = value; check(); });
        stream.on("error", lost); stream.on("close", lost); stream.on("drain", drain);
        try {
          attempted = true; untouchedConversation = false; onAttempt();
          const accepted = stream.write(frame, error => { if (error) lost(); else { callback = true; check(); } });
          drained ||= accepted; returned = true; frame = ""; check();
        } catch { lost(); }
      });
    } };
  };

  return {
    start,
    checkpointRestart,
    stop,
    getOwnershipState: () => environment.process.inspect(),
    endOwnedRuntime: () => environment.process.end(),
    handoffRetainedRuntime: () => environment.process.handoff(),
    async recoverOwnedRuntime() {
      const result = await environment.process.recover();
      if (result.ok) executionProfile = { kind: "controlled" };
      return result;
    },
    preparePrompt,
    invalidateInteractions() {
      if (!child) return;
      const session = activeSession;
      void faultStop();
      emit({ kind: "runtime_error", session, detail: environment.process.describeFailure("interaction") });
    },
    setFeedbackHandler(handler) { feedbackHandler = handler; handler(feedback.snapshot()); },
    setInteractionHandler(handler) { interactionHandler = handler; },
    setApprovalHandler(handler) { approvalHandler = handler; },
    async abortTask() {
      const session = activeSession;
      const deadline = performance.now() + STOP_TIMEOUT_MS;
      const remaining = (): number => {
        const budget = deadline - performance.now();
        if (budget <= 0) throw new Error("Stop observation deadline expired.");
        return budget;
      };
      occupancy.beginStopping();
      for (const id of occupancy.approvalIds()) child?.stdin?.write(serializeJsonLine({type:'extension_ui_response',id,cancelled:true}));
      occupancy.clearApprovals();
      try {
        const clear = await invokeRpc({type:'clear_queue'}, remaining());
        if (!clear.success) throw new Error();
        const abort = await invokeRpc({type:'abort'}, remaining());
        if (!abort.success) throw new Error();
        if (occupancy.sending()) {
          await new Promise<void>(resolve => {
            const timer = setTimeout(() => { unsubscribe(); resolve(); }, remaining());
            const unsubscribe = (() => {
              const listener = (event: RuntimeEvent): void => { if (event.kind === 'runtime_error' || ((event.kind === 'agent_settled' || event.kind === 'command_handled') && !occupancy.sending())) { clearTimeout(timer); listeners.delete(listener); resolve(); } };
              listeners.add(listener);
              return () => listeners.delete(listener);
            })();
          });
        }
        if (!session || session !== activeSession) return { ok: false, detail: environment.process.describeFailure("stop-unconfirmed") };
        if (occupancy.sending()) {
          await faultStop();
          return {ok:false,detail:environment.process.describeFailure("stop-unconfirmed")};
        }
        remaining(); // A late response/event is not timely observation, even if its timer has not run.
        occupancy.clearStopping();
        return {ok:true};
      } catch {
        await faultStop();
        return {ok:false,detail:environment.process.describeFailure("stop-failed")};
      }
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
