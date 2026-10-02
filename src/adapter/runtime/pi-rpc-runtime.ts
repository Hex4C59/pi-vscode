import { sessionUsageIdentity, sessionUsageNumbers } from "./session-usage.js";
import { renamedConversation, validRenameInput, type OpenedConversation } from "./rpc/session-rename.js";
import { createExtensionFeedback } from "./extension-feedback.js";
import { extensionCommandNames, dispatchedExtensionCommand, presentCommandCatalogue } from "./command-classification.js";
import { createInteractionWriter } from "./rpc/interaction-writer.js";
import { createRpcDialogs } from "./rpc/rpc-dialogs.js";
import { createRpcFrames, sameGateCwd } from "./rpc-frames.js";
import { createRpcOccupancy } from "./rpc/rpc-occupancy.js";
import { createRpcReplies, requireRpcResponse, RPC_PROTOCOL_ERROR, type RpcReplyResult, type RpcResponse } from "./rpc/rpc-replies.js";
import type { InteractionFormInput, InteractionReplyCallback } from "../../extension/interactions/index.js";
import type { RuntimeLink } from "./process/types.js";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { access } from "node:fs/promises";
import type { PiRpcRuntimeEnvironment } from "./types.js";
import { redactCredentialLikeText, type GateCall } from "../../extension/contracts/index.js";
import { sameNativePath, controlledEnvironment, CONTROLLED_TOOLS } from "../index.js";
import type { Readable } from "node:stream";

import { attachJsonlLineReader, serializeJsonLine, serializePromptFrame } from "./rpc/jsonl.js";
import { parseQueuedTextSnapshot } from "./rpc/queued-text.js";
import { prepareQueuedTextSend } from "./rpc/queued-text-send.js";
import { resolvePiCliPath } from "./rpc/pi-rpc-probe.js";
import { readPiStartupModelArg } from "./piStartupModel.js";
import type {
  AttachmentPromptResult,
  CommandCatalogue,
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
} from "./rpc/pi-rpc-model-parse.js";

const START_TIMEOUT_MS = 15_000;
const PROMPT_TIMEOUT_MS = 30_000;
const MODEL_RPC_TIMEOUT_MS = 15_000;
const STOP_TIMEOUT_MS = 5_000;
const RENAME_UNVERIFIED = "The conversation name could not be verified. The visible name was kept; pi may already have changed it. Explicit runtime recovery is required before retrying.";

type RpcFrame = ReturnType<ReturnType<typeof createRpcFrames>["interpret"]>;

type RpcLaunchArguments = {
  profile: ExtensionExecutionProfile;
  gatePath: string;
  trustArg: "--approve" | "--no-approve";
  resume?: Parameters<PiRuntimeLifecycle["start"]>[0]["resume"];
};

function rpcLaunchArguments({ profile, gatePath, trustArg, resume }: RpcLaunchArguments): string[] {
  // pi's --tools allowlist also filters registered extension tools out of getAllTools().
  // Trusted inventory is instead validated and activated by the bundled approval gate.
  const toolArgs = profile.kind === "controlled" ? ["--tools", CONTROLLED_TOOLS.join(',')] : [];
  const args = ["--mode", "rpc", ...toolArgs, '--no-extensions', '-e', gatePath, trustArg];
  if (profile.kind === "trusted") args.push("-e", profile.entryPath);
  if (resume) args.push("--session", resume.path);
  return args;
}

type PromptAttempt = Parameters<ReturnType<PiRuntimeLifecycle["preparePrompt"]>["send"]>[0];

type PreparedPrompt = {
  readonly requestId: string;
  readonly expectedSession: number;
  readonly command: ReturnType<typeof dispatchedExtensionCommand>;
  frame: string;
  consumed: boolean;
};

class RpcRuntime {
  private readonly environment: PiRpcRuntimeEnvironment;
  private child: RuntimeLink | null;
  private detachLost: (() => void) | undefined;
  private detachReader: (() => void) | null;
  private startToken: number;
  private activeSession: number;
  private usageConversation: { id: string; path: string } | undefined;
  private openedConversation: OpenedConversation | undefined;
  private renameOperation: { session: number; connection: RuntimeLink; mutationIssued: boolean } | undefined;
  private queueControlOperation: { session: number } | undefined;
  private queuedSend: { session: number; connection: RuntimeLink; pending: Promise<AttachmentPromptResult>; retire(): void } | undefined;
  private resumedConversation: boolean;
  private untouchedConversation: boolean;
  private commandNames: ReadonlySet<string>;
  private commandCatalogue: CommandCatalogue;
  private gateId: string;
  private cwd: string;
  private gateReady: boolean;
  private verifiedCustomTools: ReadonlySet<string>;
  private initializationFailed: boolean;
  private executionProfile: ExtensionExecutionProfile;
  private interactionHandler: ((form: InteractionFormInput, reply: InteractionReplyCallback) => void) | undefined;
  private dialogs: ReturnType<typeof createRpcDialogs> | undefined;
  private approvalHandler: ((call: GateCall) => Promise<boolean>) | undefined;
  private readonly feedback: ReturnType<typeof createExtensionFeedback>;
  private feedbackHandler: Parameters<NonNullable<PiRuntimeLifecycle["setFeedbackHandler"]>>[0] | undefined;
  private readonly frames: ReturnType<typeof createRpcFrames>;
  private readonly occupancy: ReturnType<typeof createRpcOccupancy>;
  private readonly replies: ReturnType<typeof createRpcReplies>;
  private readonly listeners: Set<(event: RuntimeEvent) => void>;

  constructor(environment: PiRpcRuntimeEnvironment) {
    this.environment = environment;
    this.child = null;
    this.detachLost = undefined;
    this.detachReader = null;
    this.startToken = 0;
    this.activeSession = 0;
    this.usageConversation = undefined;
    this.openedConversation = undefined;
    this.renameOperation = undefined;
    this.queueControlOperation = undefined;
    this.queuedSend = undefined;
    this.resumedConversation = false;
    this.untouchedConversation = false;
    this.commandNames = new Set();
    this.commandCatalogue = { status: "unavailable" };
    this.gateId = '';
    this.cwd = '';
    this.gateReady = false;
    this.verifiedCustomTools = new Set();
    this.initializationFailed = false;
    this.executionProfile = { kind: "controlled" };
    this.interactionHandler = undefined;
    this.dialogs = undefined;
    this.approvalHandler = undefined;
    this.feedback = createExtensionFeedback();
    this.feedbackHandler = undefined;
    this.frames = createRpcFrames();
    this.occupancy = createRpcOccupancy();
    this.replies = createRpcReplies();
    this.listeners = new Set<(event: RuntimeEvent) => void>();
  }

  private readonly emit = (event: RuntimeEvent): void => {
    for (const listener of this.listeners) listener(event);
  };

  private readonly applyRuntime = (result: Extract<ReturnType<ReturnType<typeof createRpcFrames>["interpret"]>, { kind: "runtime" }>): void => {
    if (result.conversationTouched) this.untouchedConversation = false;
    if (result.agentSettled) this.occupancy.noteAgentSettled();
    for (const event of result.events) this.emit(event);
    if (result.agentStarted) this.occupancy.noteAgentStarted();
  };

  private readonly handleLine = (line: string): void => {
    if (!this.child) return;
    const interpreted = this.frames.interpret(line, {
      session: this.activeSession,
      aborting: this.occupancy.isStopping(),
      gateId: this.gateId,
      cwd: this.cwd,
      executionProfile: this.executionProfile,
    });
    if (interpreted.kind === "rpc") {
      if (this.replies.receive(interpreted.parsed) === "protocol-error") this.protocolFault();
      return;
    }
    if (interpreted.kind === "protocol-error") { this.protocolFault(); return; }
    if (interpreted.kind === "ignored") return;
    if (interpreted.kind === "extension_error") {
      if (!this.activeSession) { this.initializationFailed = true; void this.faultStop(); }
      else this.emit({ kind: 'stream_error', session: this.activeSession, detail: 'A runtime extension reported an error. Its operation may have failed; no automatic retry was made.' });
      return;
    }
    if (interpreted.kind === "hello") {
      this.handleHello(interpreted);
      return;
    }
    if (interpreted.kind === "feedback") {
      this.handleFeedback(interpreted);
      return;
    }
    if (interpreted.kind === "interaction") {
      this.handleInteraction(interpreted);
      return;
    }
    if (interpreted.kind === "approval") {
      this.handleApproval(interpreted);
      return;
    }
    if (interpreted.kind === "runtime") this.applyRuntime(interpreted);
  };

  private readonly handleHello = (interpreted: Extract<RpcFrame, { kind: "hello" }>): void => {
    const hello = interpreted.envelope;
    this.gateReady = this.executionProfile.kind === 'controlled' ? hello.profile !== 'trusted' : hello.profile === 'trusted' && Array.isArray(hello.customTools);
    this.verifiedCustomTools = this.gateReady && hello.profile === 'trusted' ? new Set(hello.customTools) : new Set();
    return;
  };

  private readonly handleFeedback = (interpreted: Extract<RpcFrame, { kind: "feedback" }>): void => {
    this.feedback.accept(interpreted.parsed);
    const feedbackHandler = this.feedbackHandler;
    feedbackHandler?.(this.feedback.snapshot()); return;
  };

  private readonly handleInteraction = (interpreted: Extract<RpcFrame, { kind: "interaction" }>): void => {
    if (!this.dialogs) return; // A retired transport must not answer or retry.

    try {
      const interactionProcess = this.child;
      const interactionSession = this.activeSession;
      const opened = this.dialogs.open(interpreted.parsed);
      if (opened.kind === 'dialog') {
        this.occupancy.openDialog();
        let consumed = false;
        const answer: InteractionReplyCallback = async reply => {
          if (consumed) return;
          consumed = true;
          try { await opened.reply(reply); }
          finally {
            this.occupancy.closeDialog(interactionProcess);
            this.replies.resumeRemaining(this.occupancy.dialogs());
          }
        };
        if (this.executionProfile.kind !== 'trusted' || !this.interactionHandler || this.occupancy.isStopping()) {
          // Same replay registry, in-flight lease and bounded writer as a human reply.
          void Promise.resolve(answer({ kind: 'cancel', reason: this.occupancy.isStopping() ? 'stop' : 'unavailable' })).catch(() => undefined);
        } else {
          this.replies.pauseRemaining();
          const interactionHandler = this.interactionHandler;
          interactionHandler(opened.form, answer);
        }
      }
      else if (opened.kind === 'rejected') {
        if (opened.code === 'identity-budget') {
          void this.faultStop();
          this.emit({ kind: 'runtime_error', session: interactionSession, detail: 'Extension interaction identity budget exhausted. Explicit safe recovery is required.' });
          return;
        }
        if (opened.cancellation) {
          this.occupancy.openDialog();
          void opened.cancellation.catch(() => undefined).finally(() => {
            this.occupancy.closeDialog(interactionProcess);
            this.replies.resumeRemaining(this.occupancy.dialogs());
          });
        }
        this.emit({ kind: 'stream_error', session: this.activeSession, detail: 'An unsupported or unsafe extension interaction was rejected.' });
      }
    } catch {
      const session = this.activeSession;
      void this.faultStop();
      this.emit({ kind: 'runtime_error', session, detail: 'Extension interaction transport failed. Work status is uncertain; no reply was retried.' });
    }
    return;
  };

  private readonly handleApproval = (interpreted: Extract<RpcFrame, { kind: "approval" }>): void => {
    const { id, envelope } = interpreted;
    const session = this.activeSession; const process = this.child;
    const reply = (allow: boolean): void => { this.occupancy.removeApproval(id); if (process === this.child) process?.stdin?.write(serializeJsonLine({type:'extension_ui_response',id,confirmed:allow && session===this.activeSession && !this.occupancy.isStopping()})); };
    if (!this.gateReady || !session || this.occupancy.isStopping() || envelope?.kind !== 'call' || envelope.runtime !== this.gateId || !sameGateCwd(envelope.cwd, this.cwd) || (envelope.category === 'custom' && (this.executionProfile.kind !== 'trusted' || !this.verifiedCustomTools.has(envelope.tool))) || !this.approvalHandler) { reply(false); return; }
    this.occupancy.addApproval(id);
    const approvalHandler = this.approvalHandler;
    void approvalHandler({ ...envelope, cwd: this.cwd }).then(reply,()=>reply(false));
    return;
  };

  private readonly attachReader = (stdout: Readable): void => {
    if (this.detachReader) {
      const detachReader = this.detachReader;
      detachReader();
    }
    this.detachReader = attachJsonlLineReader(stdout, this.handleLine, () => {
      const session=this.activeSession;
      this.emit({kind:'runtime_error',session,detail:'Runtime frame exceeded the safety limit. Explicit recovery is required.'});
      void this.faultStop();
    });
  };

  private readonly release = async (uncertain = false, failure: "disconnected" | "protocol-error" = "disconnected"): Promise<void> => {
    const owned = this.child;
    const reason = this.occupancy.classifyRelease({ forcedUncertain: uncertain, sessionActive: this.activeSession !== 0 });
    const queuedObserver = this.queuedSend?.connection === owned ? this.queuedSend : undefined;
    const cancelling = [...this.occupancy.approvalIds()];
    this.dialogs?.invalidate(); this.dialogs = undefined;
    this.occupancy.reset();
    this.feedback.reset();
    const feedbackHandler = this.feedbackHandler;
    feedbackHandler?.(this.feedback.snapshot());
    this.child = null; // Detach synchronously: late loss/close cannot affect a replacement.
    if (this.startToken < Number.MAX_SAFE_INTEGER) this.startToken += 1;
    this.activeSession = 0;
    this.openedConversation = undefined; this.renameOperation = undefined;
    this.commandNames = new Set();
    this.commandCatalogue = { status: "unavailable" };
    this.gateReady = false; this.verifiedCustomTools = new Set();
    this.frames.reset();
    if (this.detachReader) {
      const detachReader = this.detachReader;
      detachReader();
      this.detachReader = null;
    }
    const detachLost = this.detachLost;
    detachLost?.(); this.detachLost = undefined;
    for (const id of cancelling) { try { owned?.stdin?.write(serializeJsonLine({type:'extension_ui_response',id,cancelled:true})); } catch { /* Release the transport even if cancellation cannot be written. */ } }
    queuedObserver?.retire(); // Detach first; an early ACK may already have consumed its reply watch.
    this.replies.failAll(failure);
    await this.environment.process.release(reason);
  };

  private readonly stop = (): Promise<void> => this.release();

  private readonly faultStop = (failure: "disconnected" | "protocol-error" = "disconnected"): Promise<void> => this.release(true, failure);

  private readonly protocolFault = (): void => {
    if (!this.child) return;
    const session = this.activeSession;
    // release revokes the connection synchronously before pending callers or UI observe failure.
    void this.faultStop("protocol-error").catch(() => undefined);
    this.emit({ kind: "runtime_error", session, detail: RPC_PROTOCOL_ERROR });
  };

  private readonly attachStartupTransport = (owned: RuntimeLink, token: number): ReturnType<typeof this.replies.wait> => {
    this.child = owned;
    this.occupancy.bind({ connection: owned, session: 0 });
    if (!owned.stdin) throw new Error('Extension interaction input is unavailable.');
    const writeInteraction = createInteractionWriter(owned.stdin, () => this.child === owned);
    this.dialogs = createRpcDialogs(async frame => {
      try { await writeInteraction(frame); }
      catch {
        if (this.child === owned) {
          const session = this.activeSession;
          void this.faultStop();
          this.emit({ kind: 'runtime_error', session, detail: this.environment.process.describeFailure("reply-delivery") });
        }
        throw new Error('Extension reply delivery is unconfirmed.');
      }
    });
    const lost = (): void => {
      if (owned !== this.child) return;
      const session = this.activeSession;
      const operation = this.renameOperation;
      const detail = operation?.connection === owned && operation.session === session && operation.mutationIssued
        ? RENAME_UNVERIFIED : 'Runtime disconnected. Work may be interrupted; no task was retried.';
      this.activeSession = 0; this.gateReady = false; this.occupancy.disconnectSend();
      this.replies.failAll();
      if (session) this.emit({kind:'runtime_error',session,detail});
      if (this.child === owned) {
        void this.faultStop();
      }
    };
    this.detachLost = this.child.onLost(lost);

    this.attachReader(this.child.stdout);

    const requestId = this.replies.startupId(token);
    const waiting = this.replies.wait(requestId, "get_state", START_TIMEOUT_MS, { pauseable: this.executionProfile.kind === "trusted", outstanding: () => this.occupancy.dialogs() });
    this.child.stdin?.write(serializeJsonLine({ id: requestId, type: "get_state" }));
    return waiting;
  };

  private readonly start = async (options: {
    cwd: string;
    projectTrust: ProjectTrustFlag;
    profile?: ExtensionExecutionProfile;
    resume?: { id: string; path: string };
  }): Promise<RuntimeStartResult> => {
    await this.stop();
    if (this.startToken >= Number.MAX_SAFE_INTEGER) return { ok: false, detail: "Runtime identity exhausted. Reload the extension host." };
    const token = ++this.startToken;
    const cliPath = (this.environment.cliPath ?? resolvePiCliPath)();
    const trustArg = options.projectTrust === "approve" ? "--approve" : "--no-approve";
    this.initializationFailed = false;
    this.executionProfile = options.profile ?? { kind: "controlled" };
    if (this.executionProfile.kind === "trusted" && (!path.isAbsolute(this.executionProfile.entryPath) || this.executionProfile.entryPath.includes("\0"))) return { ok: false, detail: "Extension entry is invalid." };
    this.gateId = randomUUID();
    this.cwd = options.cwd;
    const gatePath = path.join(__dirname, 'approval-gate.mjs');
    try { await (this.environment.gateAccess ?? access)(gatePath); } catch { return {ok:false,detail:'Bundled approval extension is missing. Tools remain disabled.'}; }
    if (token !== this.startToken) return { ok: false, detail: "Runtime start superseded" };
    if (options.resume && (!/^[A-Za-z0-9_-]{1,100}$/.test(options.resume.id) || !path.isAbsolute(options.resume.path))) return { ok: false, detail: "Saved session identity is invalid." };
    const args = rpcLaunchArguments({ profile: this.executionProfile, gatePath, trustArg, resume: options.resume });
    const startupModel = (this.environment.startupModel ?? readPiStartupModelArg)();
    if (startupModel) args.push("--model", startupModel);

    // Raw stderr may contain provider credentials; never project or accumulate it.
    try {
      const runtimeEnv = { ...controlledEnvironment(process.env, this.gateId), PI_VSCODE_EXTENSION_PROFILE: this.executionProfile.kind };
      const launched = await this.environment.process.launch({ cwd: options.cwd, cliPath, args, env: runtimeEnv });
      if (!launched.ok) return launched;
      if (token !== this.startToken) return { ok: false, detail: "Runtime start superseded" };
      const waiting = this.attachStartupTransport(launched.link, token);
      const response = requireRpcResponse(await waiting);

      if (token !== this.startToken) {
        return { ok: false, detail: "Runtime start superseded" };
      }
      if (!response.success || !this.gateReady || this.initializationFailed) {
        await this.faultStop();
        return {
          ok: false,
          detail: 'Runtime readiness or approval extension verification failed.',
        };
      }
      return await this.activateSession(token, response.data as Record<string, unknown> | undefined, options.resume);
    } catch (error) {
      if (token === this.startToken) await this.faultStop();
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        detail: boundUserFacingDetail(message),
      };
    }
  };

  private readonly invokeRpc = async (
    body: { type: string; [key: string]: unknown },
    timeoutMs: number,
  ): Promise<RpcResponse> => {
    if (!this.child || !this.activeSession) {
      throw new Error("Runtime not ready.");
    }
    const session = this.activeSession;
    const requestId = this.replies.rpcId(session);
    const waiting = this.replies.wait(requestId, body.type, timeoutMs);
    if (body.type === "set_session_name" && this.renameOperation?.session === session && this.renameOperation.connection === this.child) this.renameOperation.mutationIssued = true;
    this.child.stdin?.write(serializeJsonLine({ id: requestId, ...body }));
    const response = requireRpcResponse(await waiting);
    if (session !== this.activeSession) {
      throw new Error("Runtime restarted during request.");
    }
    return response;
  };

  private readonly loadCommandCatalogue = async (token: number, trusted: boolean): Promise<boolean> => {
    let reply: RpcResponse;
    try {
      reply = await this.invokeRpc({ type: "get_commands" }, START_TIMEOUT_MS);
    } catch {
      if (token !== this.startToken || token !== this.activeSession) return false;
      this.commandCatalogue = { status: "unavailable" };
      return !trusted;
    }
    if (token !== this.startToken || token !== this.activeSession) return false;
    if (trusted) {
      const names = reply.success ? extensionCommandNames(reply.data) : undefined;
      if (!names) {
        this.commandCatalogue = { status: "unavailable" };
        return false;
      }
      this.commandNames = names;
    }
    this.commandCatalogue = reply.success ? presentCommandCatalogue(reply.data) : { status: "unavailable" };
    return true;
  };

  private readonly activateSession = async (
    token: number,
    data: Record<string, unknown> | undefined,
    resume: { id: string; path: string } | undefined,
  ): Promise<RuntimeStartResult> => {
    const identityValid = data && typeof data === "object" && typeof data.sessionId === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(data.sessionId) && typeof data.sessionFile === "string" && data.sessionFile.length <= 32768 && path.isAbsolute(data.sessionFile) && (data.sessionName == null || typeof data.sessionName === "string");
    if (!data || !identityValid || (resume && (data.sessionId !== resume.id || !sameNativePath(data.sessionFile as string, resume.path)))) {
      await this.faultStop();
      return { ok: false, detail: "Saved session identity could not be verified. No conversation is ready." };
    }
    this.activeSession = token;
    this.usageConversation = sessionUsageIdentity(data);
    this.openedConversation = { id: data.sessionId as string, path: data.sessionFile as string };
    this.occupancy.setSession(token);
    this.resumedConversation = resume !== undefined;
    this.untouchedConversation = !this.resumedConversation;
    if (!await this.loadCommandCatalogue(token, this.executionProfile.kind === "trusted")) {
      if (token !== this.startToken) return { ok: false, detail: "Runtime start superseded" };
      await this.faultStop();
      return { ok: false, detail: "Extension command catalogue could not be verified." };
    }
    if (token !== this.startToken) return { ok: false, detail: "Runtime start superseded" };
    return {
      ok: true,
      modelLabel: formatModelLabel(data),
      conversation: {
        id: data.sessionId as string,
        path: data.sessionFile as string,
        name: typeof data.sessionName === "string" ? redactCredentialLikeText(data.sessionName).slice(0, 200) : null,
      },
    };
  };

  private readonly getSessionUsage: NonNullable<PiRuntimeLifecycle["getSessionUsage"]> = async expectedSession => {
    const unavailable = { ok: false as const, detail: "Session usage is unavailable." };
    const current = () => expectedSession !== 0 && expectedSession === this.activeSession && this.gateReady && this.occupancy.allowsRestart();
    const deadline = performance.now() + 5000;
    const read = (type: "get_state" | "get_session_stats") => {
      const remaining = deadline - performance.now();
      if (remaining <= 0) throw new Error("Usage deadline expired.");
      return this.invokeRpc({ type }, remaining);
    };
    try {
      if (!current()) return unavailable;
      const before = await read("get_state");
      const identity = sessionUsageIdentity(before.data);
      if (!current() || !before.success || !identity || !this.usageConversation || identity.id !== this.usageConversation.id
        || !sameNativePath(identity.path, this.usageConversation.path)) return unavailable;
      const response = await read("get_session_stats");
      const statsIdentity = sessionUsageIdentity(response.data);
      if (!current() || !response.success || !statsIdentity || statsIdentity.id !== identity.id
        || !sameNativePath(statsIdentity.path, identity.path)) return unavailable;
      const after = await read("get_state");
      const afterIdentity = sessionUsageIdentity(after.data);
      if (!current() || !after.success || !afterIdentity || afterIdentity.id !== identity.id
        || !sameNativePath(afterIdentity.path, identity.path)) return unavailable;
      const usage = sessionUsageNumbers(response.data, before.data);
      return usage ? { ok: true, usage } : unavailable;
    } catch { return unavailable; }
  };

  private readonly renameSession: NonNullable<PiRuntimeLifecycle["renameSession"]> = async (name, expectedSession) => {
    const owned = this.child; const expected = this.openedConversation;
    if (!validRenameInput(name) || !expectedSession || expectedSession !== this.activeSession || !owned || !expected || !this.gateReady
      || this.renameOperation || !this.occupancy.allowsRestart()) return { ok: false, detail: "Current conversation rename is unavailable." };
    const operation = { session: expectedSession, connection: owned, mutationIssued: false }; this.renameOperation = operation; this.occupancy.beginStopping();
    const current = () => this.renameOperation === operation && this.child === owned && this.activeSession === expectedSession && this.gateReady
      && !this.occupancy.agentRunning() && this.occupancy.dialogs() === 0 && [...this.occupancy.approvalIds()].length === 0;
    const deadline = performance.now() + STOP_TIMEOUT_MS;
    const remaining = () => { const budget = deadline - performance.now(); if (budget <= 0) throw new Error("Rename deadline expired."); return budget; };
    try {
      const before = await this.invokeRpc({ type: "get_state" }, remaining()); remaining();
      if (!current()) return { ok: false, detail: "Current conversation changed during rename." };
      if (!before.success || !renamedConversation(before.data, expected)) throw new Error("Opened identity is unverified.");
      const acknowledged = await this.invokeRpc({ type: "set_session_name", name }, remaining()); remaining();
      if (!current()) return { ok: false, detail: "Current conversation changed during rename." };
      if (!acknowledged.success) return { ok: false, detail: "Current conversation rename was rejected." };
      this.untouchedConversation = false;
      const after = await this.invokeRpc({ type: "get_state" }, remaining()); remaining();
      if (!current()) return { ok: false, detail: "Current conversation changed during rename." };
      const conversation = after.success ? renamedConversation(after.data, expected, name) : undefined;
      if (!conversation) throw new Error("Rename readback is unverified.");
      return { ok: true, conversation };
    } catch {
      if (this.activeSession === expectedSession && this.child === owned) {
        this.emit({ kind: "runtime_error", session: expectedSession, detail: RENAME_UNVERIFIED });
        await this.faultStop();
      }
      return { ok: false, detail: "Current conversation rename could not be verified. Do not retry automatically." };
    } finally {
      if (this.renameOperation === operation) { this.renameOperation = undefined; if (this.activeSession === expectedSession && this.child === owned) this.occupancy.clearStopping(); }
    }
  };

  private readonly checkpointRestart: NonNullable<PiRuntimeLifecycle["checkpointRestart"]> = async expected => {
    const session = this.activeSession;
    const idle = () => session !== 0 && session === this.activeSession && this.gateReady && this.occupancy.allowsRestart();
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
      const before = await this.invokeRpc({ type: "get_state" }, 5000);
      if (!idle() || !stateMatches(before)) return { kind: "unavailable" };
      const response = await this.invokeRpc({ type: "get_session_stats" }, 5000);
      if (!idle() || !response.success || !response.data || typeof response.data !== "object") return { kind: "unavailable" };
      const stats = response.data as Record<string, unknown>;
      if (stats.sessionId !== expected.id || typeof stats.sessionFile !== "string" || !sameNativePath(stats.sessionFile, expected.path)
        || !Number.isSafeInteger(stats.assistantMessages) || !Number.isSafeInteger(stats.totalMessages)
        || (stats.assistantMessages as number) < 0 || (stats.totalMessages as number) < (stats.assistantMessages as number)) return { kind: "unavailable" };
      const messageCount = (before.data as Record<string, unknown>).messageCount as number;
      const after = await this.invokeRpc({ type: "get_state" }, 5000);
      if (!idle() || !stateMatches(after, messageCount)) return { kind: "unavailable" };
      if (messageCount === 0 && stats.totalMessages === 0 && this.untouchedConversation) return { kind: "empty" };
      // pi 0.86.1 flushes fresh session entries only once an assistant exists.
      // Stats count all entries, unlike active-branch messageCount after compaction.
      // A verified saved-session start is already durable, even with empty context.
      if (this.resumedConversation || (stats.assistantMessages as number) > 0) {
        return { kind: "resume", conversation: { ...expected } };
      }
      return { kind: "unavailable" };
    } catch { return { kind: "unavailable" }; }
  };

  private readonly loadModelProjection = async (expectedSession = this.activeSession): Promise<ModelProjectionResult> => {
    const current = (): void => {
      if (!expectedSession || expectedSession !== this.activeSession) throw new Error("Runtime changed.");
    };
    try {
      current();
      const stateResponse = await this.invokeRpc({ type: "get_state" }, MODEL_RPC_TIMEOUT_MS);
      if (!stateResponse.success) {
        return { ok: false, detail: "Could not read runtime state." };
      }
      current();
      const modelsResponse = await this.invokeRpc({ type: "get_available_models" }, MODEL_RPC_TIMEOUT_MS);
      if (!modelsResponse.success) {
        return { ok: false, detail: "Could not list available models." };
      }
      current();
      const levelsResponse = await this.invokeRpc({ type: "get_available_thinking_levels" }, MODEL_RPC_TIMEOUT_MS);
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

  private readonly setThinkingLevel = async (level: string): Promise<ModelMutationResult> => {
    const session = this.activeSession;
    if (!this.occupancy.allowsModelMutation()) return { ok: false, detail: "Wait until the agent has settled." };
    try {
      const response = await this.invokeRpc({ type: "set_thinking_level", level }, MODEL_RPC_TIMEOUT_MS);
      if (!response.success) {
        return { ok: false, detail: "Could not change thinking level." };
      }
      return await this.loadModelProjection(session);
    } catch {
      return { ok: false, detail: "Could not apply model settings." };
    }
  };

  private readonly setModel = async (provider: string, modelId: string): Promise<ModelMutationResult> => {
    const session = this.activeSession;
    if (!this.occupancy.allowsModelMutation()) return { ok: false, detail: "Wait until the agent has settled." };
    try {
      const response = await this.invokeRpc({ type: "set_model", provider, modelId }, MODEL_RPC_TIMEOUT_MS);
      if (!response.success) {
        return { ok: false, detail: "Could not switch model." };
      }
      return await this.loadModelProjection(session);
    } catch {
      return { ok: false, detail: "Could not apply model settings." };
    }
  };

  private readonly prompt = async (text: string): Promise<{ ok: true } | { ok: false; detail: string }> => {
    if (!this.child || !this.activeSession || !this.gateReady || this.occupancy.isStopping()) {
      return { ok: false, detail: "Runtime not ready." };
    }
    if (!this.occupancy.allowsSend() || this.replies.exhausted()) {
      return { ok: false, detail: "A message is already in progress or request identities are exhausted." };
    }
    const session = this.activeSession;
    const requestId = this.replies.promptId(session);
    this.occupancy.beginPrompt(); this.untouchedConversation = false;
    try {
      const waiting = this.replies.wait(requestId, "prompt", PROMPT_TIMEOUT_MS);
      this.child.stdin?.write(serializePromptFrame(requestId, { kind: "plain", body: text }));
      const response = requireRpcResponse(await waiting);
      if (session !== this.activeSession) {
        this.occupancy.rejectSend(this.child);
        return { ok: false, detail: "Runtime restarted during send." };
      }
      if (!response.success) {
        this.occupancy.rejectSend(this.child);
        return { ok: false, detail: "Prompt was rejected." };
      }
      return { ok: true };
    } catch {
      if (session === this.activeSession) {
        this.emit({kind:'runtime_error',session,detail:this.environment.process.describeFailure("prompt-ack")});
        await this.faultStop();
      }
      return { ok: false, detail: 'Prompt acknowledgement was lost; restart runtime before retrying.' };
    }
  };

  private readonly preparePrompt: PiRuntimeLifecycle["preparePrompt"] = (input, expectedSession) => {
    if (this.replies.exhausted()) throw new Error("Runtime request identifiers exhausted. Restart required.");
    const requestId = this.replies.promptId(expectedSession);
    const prepared: PreparedPrompt = {
      requestId, expectedSession, frame: serializePromptFrame(requestId, input),
      command: dispatchedExtensionCommand(input, this.commandNames), consumed: false,
    };
    return { send: onAttempt => this.sendPreparedPrompt(prepared, onAttempt) };
  };

  private readonly sendPreparedPrompt = (prepared: PreparedPrompt, onAttempt: PromptAttempt): Promise<AttachmentPromptResult> => {
    const owned = this.child;
    const stream = owned?.stdin;
    if (prepared.consumed || prepared.expectedSession !== this.activeSession || !this.activeSession || !this.gateReady || !this.occupancy.allowsSend() || !stream || stream.destroyed || stream.writableEnded) {
      prepared.frame = "";
      return Promise.resolve({ delivery: "not-sent", code: "runtime-lost" });
    }
    prepared.consumed = true; this.occupancy.beginSend({ command: prepared.command !== undefined });
    return this.writePreparedPrompt(prepared, owned, stream, onAttempt);
  };

  private readonly writePreparedPrompt = (prepared: PreparedPrompt, owned: RuntimeLink | null, stream: RuntimeLink["stdin"], onAttempt: PromptAttempt): Promise<AttachmentPromptResult> => {
    const { expectedSession, requestId, command } = prepared;
    return new Promise(resolve => {
      let attempted = false; let finished = false; let callback = false; let drained = false; let returned = false;
      let reply: RpcReplyResult | undefined;
      const finish = (delivery: "rpc-accepted" | "rpc-rejected" | "not-sent" | "unknown", code?: "write-failed" | "ack-timeout" | "rpc-rejected" | "runtime-lost") => {
        if (finished) return; finished = true;
        this.occupancy.clearAck(expectedSession);
        clearTimeout(writeTimer); clearTimeout(ackTimer); this.replies.drop(requestId);
        stream.off("error", lost); stream.off("close", lost); stream.off("drain", drain); prepared.frame = "";
        if (delivery !== "rpc-accepted" && this.child === owned) this.occupancy.rejectSend(owned);
        if (command && this.child === owned) this.occupancy.finishCommand(owned);
        const response = reply?.kind === "response" ? reply.response : undefined;
        const rejection = delivery === "rpc-rejected" && typeof response?.error === "string" && isAuthenticationError(response.error)
          ? "authentication" as const : undefined;
        resolve({ delivery, ...(code ? { code } : {}), ...(rejection ? { rejection } : {}) });
        if (command && delivery === "rpc-accepted" && this.child === owned) this.emit({ kind: "command_handled", session: expectedSession, agentRunning: this.occupancy.agentRunning() });
        if (delivery === "unknown" && this.child === owned && reply?.kind !== "failure") {
          this.emit({ kind: "runtime_error", session: expectedSession, detail: this.environment.process.describeFailure("prompt-delivery") });
          void this.faultStop();
        }
      };
      const check = () => {
        if (reply?.kind === "failure") { finish(attempted ? "unknown" : "not-sent", "runtime-lost"); return; }
        if (!returned || !callback || !drained) return;
        clearTimeout(writeTimer);
        if (reply?.kind === "response") {
          if (this.activeSession !== expectedSession) finish("unknown", "runtime-lost");
          else finish(reply.response.success ? "rpc-accepted" : "rpc-rejected", reply.response.success ? undefined : "rpc-rejected");
        }
      };
      const lost = () => finish(attempted ? "unknown" : "not-sent", "write-failed");
      const drain = () => { drained = true; check(); };
      const writeTimer = setTimeout(lost, 5000);
      const ackTimer = command ? undefined : setTimeout(() => finish("unknown", "ack-timeout"), 30000);
      this.replies.watch(requestId, "prompt", value => { reply = value; check(); });
      stream.on("error", lost); stream.on("close", lost); stream.on("drain", drain);
      try {
        attempted = true; this.untouchedConversation = false; onAttempt();
        const accepted = stream.write(prepared.frame, error => { if (error) lost(); else { callback = true; check(); } });
        drained ||= accepted; returned = true; prepared.frame = ""; check();
      } catch { lost(); }
    });
  };

  private readonly prepareQueuedText: NonNullable<PiRuntimeLifecycle["prepareQueuedText"]> = (text, mode, session) => {
    if (this.replies.exhausted()) throw new Error("Runtime request identifiers exhausted. Restart required.");
    const requestId = this.replies.rpcId(session);
    const command = mode === "steering" ? "steer" : "follow_up";
    const valid = typeof text === "string" && text.trim().length > 0 && text.length <= 8000
      && (mode === "steering" || mode === "follow-up");
    let owned: RuntimeLink | null = null;
    return prepareQueuedTextSend({ requestId, command,
      admit: () => {
        if (!valid || session !== this.activeSession || !session || !this.gateReady || !this.occupancy.agentRunning()
          || this.occupancy.isStopping() || this.queueControlOperation?.session === session || this.queuedSend?.session === session
          || !this.child?.stdin || this.child.stdin.destroyed || this.child.stdin.writableEnded) return undefined;
        owned = this.child;
        return owned.stdin;
      },
      isCurrent: () => this.child === owned && session === this.activeSession,
      canWrite: () => this.child === owned && session === this.activeSession && this.occupancy.agentRunning(),
      watch: settle => this.replies.watch(requestId, command, settle),
      drop: () => this.replies.drop(requestId),
      track: (pending, retire) => {
        if (!owned || this.child !== owned || session !== this.activeSession) return;
        const attempt = this.queuedSend = { session, connection: owned, pending, retire };
        this.occupancy.beginQueuedWrite();
        void pending.then(() => {
          if (this.queuedSend !== attempt) return;
          this.queuedSend = undefined;
          this.occupancy.finishQueuedWrite(owned, session);
        });
      },
      onUnknown: () => {
        this.emit({ kind: "runtime_error", session, detail: this.environment.process.describeFailure("prompt-delivery") });
        void this.faultStop();
      },
    }, valid ? serializeJsonLine({ id: requestId, type: command, message: text }) : "");
  };

  private readonly waitForQueuedSend = (pending: Promise<AttachmentPromptResult>, remaining: () => number): Promise<void> => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Queue send was not observed before clear.")), remaining());
    void pending.then(result => {
      clearTimeout(timer);
      if (result.delivery === "unknown") reject(new Error("Queue send outcome is unknown."));
      else resolve();
    });
  });

  private readonly clearQueuedText = async (session: number, remaining: () => number,
    onQueueCleared: Parameters<NonNullable<PiRuntimeLifecycle["abortTask"]>>[0]): Promise<void> => {
    if (this.queuedSend?.session === session) await this.waitForQueuedSend(this.queuedSend.pending, remaining);
    if (session !== this.activeSession) throw new Error("Runtime changed before clear.");
    const clear = await this.invokeRpc({ type: "clear_queue" }, remaining());
    remaining(); // Late ACK is not timely recovery evidence, even if its timer has not run.
    const recalled = clear.success ? parseQueuedTextSnapshot(clear.data) : undefined;
    if (!recalled || session !== this.activeSession) throw new Error("Clear was not confirmed.");
    onQueueCleared?.(recalled);
    if (session !== this.activeSession) throw new Error("Runtime changed during recall.");
  };

  private readonly recallQueuedText: NonNullable<PiRuntimeLifecycle["recallQueuedText"]> = async (session, onQueueCleared) => {
    if (!session || session !== this.activeSession || !this.gateReady || this.queueControlOperation?.session === session
      || typeof onQueueCleared !== "function") return { ok: false, detail: this.environment.process.describeFailure("stop-unconfirmed") };
    const operation = this.queueControlOperation = { session };
    const deadline = performance.now() + STOP_TIMEOUT_MS;
    const remaining = (): number => {
      const budget = deadline - performance.now();
      if (budget <= 0) throw new Error("Recall observation deadline expired.");
      return budget;
    };
    this.occupancy.beginStopping(); // Admission fence only: never changes live-task occupancy or sends abort.
    try {
      await this.clearQueuedText(session, remaining, onQueueCleared);
      remaining();
      return { ok: true };
    } catch {
      if (session === this.activeSession) await this.faultStop();
      return { ok: false, detail: this.environment.process.describeFailure("stop-failed") };
    } finally {
      if (this.queueControlOperation === operation) {
        this.queueControlOperation = undefined;
        if (session === this.activeSession) this.occupancy.clearStopping();
      }
    }
  };

  private readonly waitForTaskSettlement = (remaining: () => number): Promise<void> => new Promise(resolve => {
    const timer = setTimeout(() => { this.listeners.delete(listener); resolve(); }, remaining());
    const listener = (event: RuntimeEvent): void => {
      if (event.kind !== "runtime_error"
        && !((event.kind === "agent_settled" || event.kind === "command_handled") && !this.occupancy.sending())) return;
      clearTimeout(timer);
      this.listeners.delete(listener);
      resolve();
    };
    this.listeners.add(listener);
  });

  private readonly recoverOwnedRuntime: NonNullable<PiRuntimeLifecycle["recoverOwnedRuntime"]> = async () => {
    const result = await this.environment.process.recover();
    if (result.ok) this.executionProfile = { kind: "controlled" };
    return result;
  };

  private readonly invalidateInteractions: NonNullable<PiRuntimeLifecycle["invalidateInteractions"]> = () => {
    if (!this.child) return;
    const session = this.activeSession;
    void this.faultStop();
    this.emit({ kind: "runtime_error", session, detail: this.environment.process.describeFailure("interaction") });
  };

  private readonly setFeedbackHandler: NonNullable<PiRuntimeLifecycle["setFeedbackHandler"]> = (handler) => { this.feedbackHandler = handler; handler(this.feedback.snapshot()); };

  private readonly setInteractionHandler: NonNullable<PiRuntimeLifecycle["setInteractionHandler"]> = (handler) => { this.interactionHandler = handler; };

  private readonly setApprovalHandler: NonNullable<PiRuntimeLifecycle["setApprovalHandler"]> = (handler) => { this.approvalHandler = handler; };

  private readonly abortTask: NonNullable<PiRuntimeLifecycle["abortTask"]> = async (onQueueCleared) => {
    const session = this.activeSession;
    if (!session || this.queueControlOperation?.session === session) return { ok: false, detail: this.environment.process.describeFailure("stop-unconfirmed") };
    const operation = this.queueControlOperation = { session };
    const deadline = performance.now() + STOP_TIMEOUT_MS;
    const remaining = (): number => {
      const budget = deadline - performance.now();
      if (budget <= 0) throw new Error("Stop observation deadline expired.");
      return budget;
    };
    this.occupancy.beginStopping();
    try {
      for (const id of this.occupancy.approvalIds()) this.child?.stdin?.write(serializeJsonLine({type:'extension_ui_response',id,cancelled:true}));
      this.occupancy.clearApprovals();
      await this.clearQueuedText(session, remaining, onQueueCleared); // Retain recalled text before abort.
      const abort = await this.invokeRpc({type:'abort'}, remaining());
      if (!abort.success) throw new Error();
      if (this.occupancy.sending()) await this.waitForTaskSettlement(remaining);
      if (!session || session !== this.activeSession) return { ok: false, detail: this.environment.process.describeFailure("stop-unconfirmed") };
      if (this.occupancy.sending()) {
        await this.faultStop();
        return {ok:false,detail:this.environment.process.describeFailure("stop-unconfirmed")};
      }
      remaining(); // A late response/event is not timely observation, even if its timer has not run.
      this.occupancy.clearStopping();
      return {ok:true};
    } catch {
      if (session === this.activeSession) await this.faultStop();
      return {ok:false,detail:this.environment.process.describeFailure("stop-failed")};
    } finally {
      if (this.queueControlOperation === operation) this.queueControlOperation = undefined;
    }
  };

  private readonly subscribe: NonNullable<PiRuntimeLifecycle["subscribe"]> = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  lifecycle(): PiRuntimeLifecycle {
    return {
      start: this.start,
      checkpointRestart: this.checkpointRestart,
      renameSession: this.renameSession,
      stop: this.stop,
      getOwnershipState: () => this.environment.process.inspect(),
      endOwnedRuntime: () => this.environment.process.end(),
      handoffRetainedRuntime: () => this.environment.process.handoff(),
      recoverOwnedRuntime: this.recoverOwnedRuntime,
      preparePrompt: this.preparePrompt,
      prepareQueuedText: this.prepareQueuedText,
      recallQueuedText: this.recallQueuedText,
      invalidateInteractions: this.invalidateInteractions,
      setFeedbackHandler: this.setFeedbackHandler,
      setInteractionHandler: this.setInteractionHandler,
      setApprovalHandler: this.setApprovalHandler,
      abortTask: this.abortTask,
      getSession: () => this.activeSession,
      getSessionUsage: this.getSessionUsage,
      getCommandCatalogue: () => this.commandCatalogue,
      subscribe: this.subscribe,
      prompt: this.prompt,
      getModelProjection: this.loadModelProjection,
      setThinkingLevel: this.setThinkingLevel,
      setModel: this.setModel,
    };
  }
}

export function createPiRpcRuntime(environment: PiRpcRuntimeEnvironment): PiRuntimeLifecycle {
  return new RpcRuntime(environment).lifecycle();
}
