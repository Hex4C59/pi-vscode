import { unavailableSessionBackend, type SessionBackend, type SavedSession, type SavedHistoryPage } from "./contracts/index.js";
import type { SessionStateMessage, SessionError } from "./contracts/index.js";
import type * as vscode from "vscode";
import { randomBytes } from "node:crypto";
import { getWebviewHtml, getWebviewResourceRoot, SettingsPanel } from "./bridge/index.js";
import { ModelSettings, ProviderConfig, createDefaultProviderConfigDeps, type ModelSettingsSnapshot } from "./models/index.js";
import type { PiRuntimeLifecycle, RetainedRunHandoff, RuntimeEvent } from "./contracts/index.js";
import { parseWebviewMessage } from "./bridge/index.js";
import type { WorkspaceStateMessage, ProviderConfigIntent } from "./contracts/index.js";

import { SavedHistory } from "./sessions/index.js";
import { EditorTools, type EditorToolOptions } from "./editor-tools/index.js";
import { selectTrustedExtension } from "./extension-loading/index.js";
import type { ExtensionExecutionProfile, ExecutionProfileProjection, ExtensionFeedback } from "./contracts/index.js";
import { createInteractionCoordinator } from "./interactions/index.js";
import { DraftSubmission } from "./draft/index.js";

const opaqueId = () => randomBytes(16).toString("hex");
// Display metadata is not a filesystem capability; keep the real local cwd unchanged.
const workspaceLabel = (value: string, limit: number): string => value.length <= limit ? value : value.slice(0, limit - 1).replace(/[\uD800-\uDBFF]$/, "") + "…";

export const PI_CHAT_VIEW_ID = "pi-vscode.chat";

/** Reveal the contributed container, then focus its existing view (never toggle). */
export async function focusPiChat(api: Pick<typeof vscode, "commands">): Promise<void> {
  const containerCommand = "workbench.view.extension.pi-vscode";
  const registeredCommands = await api.commands.getCommands(true);
  if (registeredCommands.includes(containerCommand)) {
    await api.commands.executeCommand(containerCommand);
  }
  await api.commands.executeCommand(`${PI_CHAT_VIEW_ID}.focus`);
}

/** Host-owned, memory-only pre-runtime state. No adapter/runtime dependency. */
export class PiChatViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  public static readonly viewType = PI_CHAT_VIEW_ID;
  private readonly subscriptions: vscode.Disposable[];
  private view: vscode.WebviewView | undefined;
  private viewSubscriptions: vscode.Disposable[] = [];
  private disposed = false;
  private identity = "";
  private operation: object | undefined;
  private workspaceUpdatePending = false;
  private reconcileToken = 0;
  private readonly models: ModelSettings;
  private runtimeSession = 0;
  private promptToken = 0;
  private stoppingTask = false;
  private taskFailed = false;
  private commandHandled = false;
  private settledOutcome: "completed" | "stopped" | "failed" | undefined;
  private executionProfile: ExtensionExecutionProfile = { kind: "controlled" };
  private profileDisplayName: string | null = null;
  private profilePhase: ExecutionProfileProjection["phase"] = "idle";
  private profileError: string | null = null;
  private profileOperation: object | undefined;
  private ownershipState: "none" | "pending" | "terminal" | "blocked" = "none";
  private ownershipQuery = 0;
  private recoveryBusy = false;
  /** Another live host owns the retained run, so this window never ends it. */
  private retainedRunElsewhere = false;
  private retainedHandoff: Promise<void> | undefined;
  private extensionFeedback: { feedback: ExtensionFeedback[]; omittedFeedback: number } = { feedback: [], omittedFeedback: 0 };
  private lastInteractionProjection = "";
  private lastProfileProjection = "";
  private lastProviderConfigProjection = "";
  private readonly providerConfig: ProviderConfig;
  private readonly settingsPanel: SettingsPanel;
  private uiLocale: "en" | "zh-CN" = "en";
  private liveConversation: { id: string; path: string } | undefined;
  private untouchedControlledConversation = false;
  private interactionFailureReported = false;
  private readonly interactions = createInteractionCoordinator();
  private interactionReset: Promise<boolean> = Promise.resolve(true);
  private readonly draft: DraftSubmission;
  private readonly tools: EditorTools;
  private readonly savedHistory: SavedHistory;
  private sessionOperation: AbortController | undefined;
  private sessionCommit: AbortController | undefined;
  private sessionBackendSettlement: Promise<void> = Promise.resolve();
  private stopOperation: Promise<{ ok: boolean; preparationRevision?: number }> | undefined;
  private sessionCatalog = new Map<string, SavedSession>();
  private sessionProjection: Omit<SessionStateMessage, "version" | "generation" | "viewId" | "type"> = { phase: "idle", current: null, loaded: false, entries: [], page: 0, total: 0, error: null };
  private readonly unsubscribeRuntime: () => void;
  private state: Omit<WorkspaceStateMessage, keyof ModelSettingsSnapshot> = {
    version: 3, type: "workspaceState", viewId: opaqueId(), generation: 0, status: "no-folder",
    folder: null, choice: null, busy: false, error: null, runtime: "not-started", runtimeDetail: null,
    messages: [], chatBusy: false, chatError: null,
    activities: [], approvals: [], grants: [], execution:'idle', controlledExecution:true,
  };

  constructor(
    private readonly api: Pick<typeof vscode, "workspace" | "env" | "window" | "commands" | "Uri" | "RelativePattern" | "EventEmitter">,
    private readonly runtime: PiRuntimeLifecycle,
    private readonly extensionUri: vscode.Uri,
    private readonly sessionBackend: SessionBackend = unavailableSessionBackend,
    toolOptions: EditorToolOptions = {},
  ) {
    this.models = new ModelSettings(runtime, () => {
      if (!this.disposed) this.refresh();
      return { generation: this.state.generation, session: this.runtimeSession, ready: this.state.runtime === "ready",
        disposed: this.disposed, blocked: this.state.busy || this.sessionTransitionBusy() || this.interactions.snapshot().phase !== "idle" || this.profilePhase !== "idle",
        chatBusy: this.state.chatBusy, stopping: this.stoppingTask };
    }, () => this.publish());
    this.providerConfig = new ProviderConfig(createDefaultProviderConfigDeps({
      showInputBox: options => this.api.window.showInputBox(options),
      showQuickPick: (items, options) => this.api.window.showQuickPick(items, options),
      showInformationMessage: message => this.api.window.showInformationMessage(message),
      openExternal: url => this.api.env.openExternal(this.api.Uri.parse(url)),
    }), () => this.publish());
    this.settingsPanel = new SettingsPanel(this.api.window, this.extensionUri, () => {
      if (!this.disposed) this.refresh();
      return { generation: this.state.generation, locale: this.uiLocale, config: this.providerConfig.snapshot };
    }, intent => this.configureProvider(intent), locale => this.setUiLanguage(locale));
    this.savedHistory = new SavedHistory(sessionBackend, () => ({
      cwd: this.state.folder?.path,
      key: this.state.generation + ":" + this.state.viewId,
      settled: this.sessionBackendSettlement,
      enabled: !this.disposed && this.sessionEligible() && !this.sessionTransitionBusy(),
      startable: !this.disposed && this.sessionEligible() && !this.sessionTransitionBusy() && !this.sessionOperation,
    }), message => { if (this.view && !this.disposed) this.post(this.view, { ...this.envelope(message.type), ...message }); });
    this.tools = new EditorTools(this.api, () => ({
      generation: this.state.generation, session: this.runtimeSession, cwd: this.state.folder?.path,
      ready: this.state.runtime === "ready", chatBusy: this.state.chatBusy,
      stopping: this.state.execution === "stopping", disposed: this.disposed,
    }), ({ approvals, grants }) => {
      this.state = { ...this.state, approvals, grants, execution: approvals.length ? "awaiting-approval"
        : this.state.execution === "awaiting-approval" ? "waiting" : this.state.execution };
      this.publish();
    }, projection => {
      if (this.view && !this.disposed) this.post(this.view, { ...this.envelope("changeReviewState"), ...projection });
    }, chatError => { this.state = { ...this.state, chatError }; this.publish(); }, toolOptions);
    this.draft = new DraftSubmission(this.api, this.runtime, refresh => {
      if (refresh && !this.disposed) this.refresh();
      return { generation: this.state.generation, session: this.runtimeSession, viewId: this.state.viewId,
        view: this.view, cwd: this.state.folder?.path, disposed: this.disposed, ready: this.state.runtime === "ready",
        eligible: this.profilePhase === "idle" && this.interactions.snapshot().phase === "idle" && !this.sessionTransitionBusy() && this.state.status === "eligible" && this.state.runtime === "ready"
          && !this.state.busy && !this.state.chatBusy && !this.models.snapshot.modelBusy && !this.stoppingTask };
    }, message => { if (this.view && !this.disposed) this.post(this.view, message); }, {
      accepted: body => {
        this.untouchedControlledConversation = false;
        this.taskFailed = false;
        this.commandHandled = false;
        this.settledOutcome = undefined;
        this.state = { ...this.state, messages: [...this.state.messages, { role: "user" as const, text: body.trim() }].slice(-32), chatBusy: true, execution: "waiting", chatError: null };
      },
      attempted: submissionId => this.tools.beginTask(submissionId),
      failed: chatError => {
        this.tools.endTask(); this.models.cancelPending();
        this.state = { ...this.state, chatBusy: false, execution: "failed", chatError };
      },
      settled: () => this.finishSettledTask(),
      changed: () => this.publish(),
    });
    this.interactions.subscribe(snapshot => {
      this.publish();
      if (snapshot.errorCode && !this.interactionFailureReported && !this.disposed) {
        this.interactionFailureReported = true;
        this.runtime.invalidateInteractions?.();
      }
    });
    this.refresh();
    this.runtime.setFeedbackHandler?.(snapshot => { if (!this.disposed) { this.extensionFeedback = snapshot; this.publish(); } });
    this.runtime.setInteractionHandler?.((form, reply) => {
      if (this.disposed || this.state.status !== "eligible" || this.state.choice === null) {
        try { void Promise.resolve(reply({ kind: "cancel", reason: "unavailable" })).catch(() => undefined); } catch { /* No live receiver. */ }
        return;
      }
      this.interactions.admit(form, reply);
    });
    this.runtime.setApprovalHandler?.(this.tools.requestApproval);
    this.unsubscribeRuntime = this.runtime.subscribe((event) => { this.handleRuntimeEvent(event); });
    this.subscriptions = [
      api.workspace.onDidChangeWorkspaceFolders(() => { this.refresh(true); this.publish(); this.draft.publish(); }),
      api.workspace.onDidGrantWorkspaceTrust(() => { this.refresh(); this.publish(); this.draft.publish(); }),
    ];
    this.startRetainedHandoff();
  }

  private clearChat(preserveSessionTransition = false): void {
    this.interactionFailureReported = false;
    this.interactionReset = this.interactions.reset({ generation: this.state.generation, viewId: this.state.viewId });
    this.extensionFeedback = { feedback: [], omittedFeedback: 0 };
    this.savedHistory.reset();
    if (!preserveSessionTransition) this.resetSavedSessions();
    this.stopOperation = undefined;
    this.tools.reset();
    this.draft.reset(preserveSessionTransition);
    this.models.reset();
    this.stoppingTask = false;
    this.taskFailed = false;
    this.commandHandled = false;
    this.settledOutcome = undefined;
    this.state = { ...this.state, messages: [], activities:[], execution:'idle', chatBusy: false, chatError: null };
    this.runtimeSession = 0;
  }

  private handleRuntimeEvent(event: RuntimeEvent): void {
    if (this.disposed) return;
    this.refresh();
    if (event.session !== this.runtimeSession || this.state.runtime !== "ready") return;
    if (event.kind === 'runtime_error') {
      void this.interactions.stop();
      void this.refreshOwnership();
      this.resetSavedSessions(); this.publishSessions();
      this.tools.reset();
      this.draft.runtimeLost();
      this.stoppingTask=false;
      this.models.cancelPending(); this.promptToken++;
      this.state={...this.state,runtime:'error',runtimeDetail:event.detail,chatBusy:false,execution:this.settledOutcome ?? 'failed',activities:this.state.activities.map(i=>i.status==='complete'||i.status==='failed'?i:{...i,status:'interrupted'})};this.publish();return;
    }
    if (event.kind === "workflow") {
      if (!this.state.chatBusy || this.stoppingTask || this.settledOutcome) return;
      if (event.phase === "retrying" || event.phase === "compacting") {
        this.taskFailed = false;
        this.commandHandled = false;
        this.state = { ...this.state, chatError: null };
      }
      this.state = { ...this.state, execution: this.state.approvals.length ? "awaiting-approval" : event.phase };
      this.publish(); return;
    }
    if (event.kind === 'activity') {
      if (!this.state.chatBusy || this.settledOutcome) return;
      const activities=[...this.state.activities];const index=activities.findIndex(i=>i.id===event.item.id);
      if(index>=0)activities[index]=event.item;else if(activities.length<64)activities.push(event.item);
      this.state={...this.state,activities,execution:this.state.execution==='stopping'?'stopping':this.state.approvals.length?'awaiting-approval':event.item.kind==='thinking'?'thinking':event.item.status==='executing'?'executing':'waiting'};this.publish();return;
    }
    if(event.kind==='message_final') {
      if (!this.state.chatBusy || this.settledOutcome) return;
      const messages=[...this.state.messages];const index=messages.findIndex(m=>m.id===event.messageId);
      if(index>=0)messages[index]={role:'assistant',id:event.messageId,text:event.text};else if(event.text)messages.push({role:'assistant',id:event.messageId,text:event.text});
      this.state={...this.state,messages:messages.slice(-32)};this.publish();return;
    }
    if (event.kind === "text_delta") {
      if (!this.state.chatBusy || this.settledOutcome) return;
      const messages = [...this.state.messages];
      const last = messages.at(-1);
      if (last?.role === "assistant" && (!event.messageId || last.id===event.messageId)) {
        messages[messages.length - 1] = { ...last, text: (last.text + event.delta).slice(0,65536) };
      } else {
        messages.push({ role: "assistant", text: event.delta.slice(0,65536), ...(event.messageId?{id:event.messageId}:{}) });
      }
      this.state = { ...this.state, messages:messages.slice(-32), execution:this.state.execution==='stopping'?'stopping':'replying' };
      this.publish();
      return;
    }
    if (event.kind === "stream_error") {
      if (!this.state.chatBusy || this.settledOutcome) return;
      this.taskFailed = true;
      this.state = { ...this.state, chatError: event.detail };
      this.publish();
      return;
    }
    if (event.kind === "tool_finished") { this.tools.finishTool(event.toolCallId, event.failed); return; }
    if (event.kind === "command_handled" && this.state.chatBusy) {
      this.commandHandled = true;
      if (event.agentRunning) return;
    }
    if ((event.kind === "agent_settled" || (event.kind === "command_handled" && !event.agentRunning)) && this.state.chatBusy) {
      this.settledOutcome ??= this.taskFailed ? "failed" : this.stoppingTask ? "stopped" : "completed";
      this.tools.endTask();
      if (!this.draft.settle(this.stoppingTask, this.taskFailed)) return;
      this.finishSettledTask();
    }
  }

  private finishSettledTask(): void {
    this.promptToken += 1;
    const hasAssistant = this.state.messages.some((entry) => entry.role === "assistant" && entry.text.length > 0);
    this.state = {
      ...this.state,
      chatBusy: false,
      execution: this.stoppingTask ? 'stopping' : this.settledOutcome ?? (this.taskFailed ? 'failed' : 'completed'),
      chatError: this.commandHandled || hasAssistant || this.state.activities.length || this.stoppingTask || this.state.chatError
        ? this.state.chatError
        : "No assistant response. In pi, use /model and Ctrl+S to save a startup model, then restart runtime here.",
    };
    void this.models.applyPending();
    this.publish();
  }

  private refresh(workspaceChanged = false): void {
    const folders = this.api.workspace.workspaceFolders ?? [];
    const remote = this.api.env.remoteName;
    const trusted = this.api.workspace.isTrusted;
    const folder = folders.length === 1 ? folders[0] : undefined;
    const identity = JSON.stringify([remote ?? null, trusted, folders.map((entry) => [entry.uri.toString(), entry.name])]);
    if (!workspaceChanged && identity === this.identity) return;
    if (this.state.generation >= Number.MAX_SAFE_INTEGER) {
      this.clearChat();
      this.state = { ...this.state, runtime: "error", runtimeDetail: "Workspace identities exhausted. Reload the extension host.", busy: true };
      void this.runtime.stop();
      return;
    }
    this.executionProfile = { kind: "controlled" };
    this.profileDisplayName = null; this.profilePhase = "idle"; this.profileError = null; this.profileOperation = undefined;
    this.liveConversation = undefined;
    this.identity = identity;
    this.operation = undefined;
    this.workspaceUpdatePending = false;
    this.clearChat();
    const prevChoice = this.state.choice;
    const prevStatus = this.state.status;
    this.state = {
      ...this.state, generation: this.state.generation + 1, choice: null, busy: false, error: null,
      runtime: "not-started", runtimeDetail: null, controlledExecution: true,
      status: remote ? "remote" : folders.length === 0 ? "no-folder" : folders.length > 1 ? "multi-root"
        : folder?.uri.scheme !== "file" ? "non-file" : !trusted ? "untrusted" : "eligible",
      folder: folder ? { name: workspaceLabel(folder.name, 512), path: folder.uri.scheme === "file" ? folder.uri.fsPath : workspaceLabel(folder.uri.toString(), 65_536) } : null,
    };
    if (prevChoice !== this.state.choice || prevStatus !== this.state.status) {
      void this.reconcileRuntime();
    }
  }

  private async reconcileRuntime(resume?: { id: string; path: string }, preserveMessages = false): Promise<void> {
    const token = ++this.reconcileToken;
    this.publishSessions();
    const folderPath = this.state.folder?.path;
    const choice = this.state.choice;
    const shouldRun = this.state.status === "eligible" && folderPath && choice !== null && !this.disposed;
    if (!shouldRun) {
      if (this.state.runtime !== "not-started") {
        this.state = { ...this.state, runtime: "stopping", runtimeDetail: null };
        this.publish();
      }
      await this.runtime.stop();
      if (token !== this.reconcileToken || this.disposed) return;
      this.state = { ...this.state, runtime: "not-started", runtimeDetail: null };
      this.publish();
      return;
    }
    const projectTrust = choice === "allow" ? "approve" : "no-approve";
    this.state = { ...this.state, runtime: "starting", runtimeDetail: null };
    this.publish();
    // Never race the startup handoff: a launch must not reserve a domain whose leftover
    // run is still being ended and retired.
    if (this.retainedHandoff) await this.retainedHandoff;
    if (token !== this.reconcileToken || this.disposed) return;
    this.refresh();
    if (this.state.status !== "eligible" || this.state.choice !== choice || this.state.folder?.path !== folderPath) return;
    if (this.profilePhase === "recovery-required") {
      this.state = { ...this.state, runtime: "not-started", runtimeDetail: null };
      this.publish();
      return;
    }
    const interactionReady = await this.interactionReset;
    if (token !== this.reconcileToken || this.disposed) return;
    if (!interactionReady) { this.state = { ...this.state, runtime: "error", runtimeDetail: "Extension interaction reset could not be confirmed." }; this.publish(); return; }
    this.interactions.bindView({ generation: this.state.generation, viewId: this.state.viewId });
    this.interactionFailureReported = false;
    this.untouchedControlledConversation = false;
    const result = await this.runtime.start({ cwd: folderPath, projectTrust, ...(this.executionProfile.kind === "trusted" ? { profile: this.executionProfile } : {}), ...(resume ? { resume: { id: resume.id, path: resume.path } } : {}) });
    if (token !== this.reconcileToken || this.disposed) return;
    this.refresh();
    if (this.state.status !== "eligible" || this.state.choice !== choice || this.state.folder?.path !== folderPath) {
      void this.reconcileRuntime();
      return;
    }
    if (resume && result.ok && result.conversation?.id !== resume.id) {
      await this.runtime.stop();
      if (token !== this.reconcileToken || this.disposed) return;
      this.sessionProjection = { ...this.sessionProjection, current: null };
      this.state = { ...this.state, runtime: "error", runtimeDetail: "Saved session identity could not be verified. No conversation is ready.", messages: [] };
      this.publishSessions(); this.publish(); return;
    }
    if (!result.ok) {
      this.state = {
        ...this.state,
        runtime: "error",
        runtimeDetail: result.detail.length > 300 ? `${result.detail.slice(0, 297)}...` : result.detail,
      };
    } else {
      this.retainedRunElsewhere = false;
      this.ownershipState = "none";
      this.runtimeSession = this.runtime.getSession();
      this.untouchedControlledConversation = !resume && this.executionProfile.kind === "controlled";
      this.liveConversation = result.conversation ? { id: result.conversation.id, path: result.conversation.path } : undefined;
      this.sessionProjection = { ...this.sessionProjection, current: result.conversation ? { id: result.conversation.id, name: result.conversation.name } : null };
      this.state = {
        ...this.state,
        runtime: "ready",
        runtimeDetail: null,
        messages: preserveMessages ? this.state.messages : [],
      };
      void this.loadStartupModels(token, result.modelLabel);
    }
    if (!result.ok) await this.refreshOwnership();
    this.publishSessions(); this.publish();
  }

  /**
   * Runs after the ready state is published: provider refresh uses the in-process SDK
   * and may be slow, so it must never hold the runtime transition or a session switch.
   */
  private async loadStartupModels(token: number, modelLabel: string | null): Promise<void> {
    await Promise.all([this.models.load(modelLabel), this.providerConfig.refresh()]);
    if (token !== this.reconcileToken || this.disposed || this.state.runtime !== "ready" || this.models.snapshot.chatModel) return;
    const { defaultProvider, defaultModelId } = this.providerConfig.snapshot;
    if (defaultProvider && defaultModelId) await this.models.applyConfiguredModel(defaultProvider, defaultModelId);
  }

  /**
   * Settings/auth write through the in-process SDK; the composer reads the RPC session.
   * After credentials or defaults change, push the default into the live session, and
   * restart once when the child still has no model (auth/--model only loaded at start).
   */
  private async syncSessionModelsAfterProviderConfig(provider?: string, modelId?: string): Promise<void> {
    if (this.state.runtime !== "ready") return;
    await this.models.load(this.models.snapshot.chatModel);
    const targetProvider = provider ?? this.providerConfig.snapshot.defaultProvider;
    const targetModelId = modelId ?? this.providerConfig.snapshot.defaultModelId;
    if (targetProvider && targetModelId) {
      await this.models.applyConfiguredModel(targetProvider, targetModelId);
    }
    if (this.models.snapshot.chatModel) return;
    // The restarted child applies the persisted default through loadStartupModels.
    await this.reconcileRuntime(this.liveConversation, true);
  }

  /** Resolve previous-owner leftovers once, before admitting a runtime launch. */
  private startRetainedHandoff(): void {
    const handoff = this.runtime.handoffRetainedRuntime?.bind(this.runtime);
    if (!handoff) { this.retainedHandoff = this.refreshOwnership(); return; }
    this.retainedHandoff = (async () => {
      let result: RetainedRunHandoff;
      try { result = await handoff(); }
      catch { result = { ok: false, code: "owner-unavailable" }; }
      if (this.disposed) return;
      if (result.ok && (result.outcome === "none" || result.outcome === "retired")) {
        this.ownershipQuery++;
        this.ownershipState = "none";
        this.retainedRunElsewhere = false;
        if (this.profilePhase === "recovery-required") { this.profilePhase = "idle"; this.profileError = null; }
        this.publish();
        return;
      }
      if (result.ok) {
        // A live owner elsewhere is not uncertainty this window can act on, and ADR 0006
        // forbids ending it. The blocked launch reports the occupied domain where it happens.
        this.ownershipQuery++;
        this.ownershipState = "pending";
        this.retainedRunElsewhere = true;
        this.publish();
        return;
      }
      await this.refreshOwnership();
    })();
  }

  private async refreshOwnership(): Promise<void> {
    if (!this.runtime.getOwnershipState || this.disposed) return;
    const query = ++this.ownershipQuery;
    let observed: "none" | "pending" | "terminal" | "blocked";
    try { observed = await this.runtime.getOwnershipState(); } catch { observed = "blocked"; }
    if (this.disposed || query !== this.ownershipQuery || this.state.runtime === "ready") return;
    this.ownershipState = observed;
    if (observed === "none") {
      // Another window may have completed the handoff or recovery; never stay on a banner
      // whose actions no longer have a retained run behind them.
      if (this.profilePhase === "recovery-required") { this.profilePhase = "idle"; this.profileError = null; }
      this.retainedRunElsewhere = false;
    } else if (!(this.retainedRunElsewhere && observed === "pending")) {
      this.profilePhase = "recovery-required";
      this.profileError = observed === "blocked" ? "owner-unavailable" : "exit-evidence-required";
    }
    this.publish();
  }
  private async recoverRuntime(view: vscode.WebviewView, action: "endOwnedRuntime" | "recoverControlledRuntime"): Promise<void> {
    // Ending/recovering an already owned run is cleanup, not workspace execution consent.
    // reconcileRuntime still requires eligibility and a fresh resource choice before starting.
    if (this.recoveryBusy || this.profileOperation || this.profilePhase !== "recovery-required") return;
    if (action === "endOwnedRuntime" && this.ownershipState !== "pending") return;
    if (action === "recoverControlledRuntime" && this.ownershipState !== "terminal") return;
    this.recoveryBusy = true;
    const generation = this.state.generation;
    let committed = false;
    const current = () => !this.disposed && (committed || this.view === view) && this.state.generation === generation;
    this.publish();
    try {
      if (action === "endOwnedRuntime") {
        const answer = await this.api.window.showWarningMessage("End the runtime owned by this recovery domain? This may interrupt irreversible work. It does not roll back changes or prove descendant processes have stopped. Recovery remains a separate action after observed exit.", { modal: true }, "End owned runtime");
        if (!current() || answer !== "End owned runtime") return;
        committed = true;
        const result = await this.runtime.endOwnedRuntime?.();
        if (!current()) return;
        if (!result?.ok) this.profileError = "termination-unconfirmed";
        await this.refreshOwnership();
      } else {
        committed = true;
        const result = await this.runtime.recoverOwnedRuntime?.();
        if (!current()) return;
        if (!result?.ok) { this.profileError = "recovery-unconfirmed"; await this.refreshOwnership(); return; }
        this.ownershipQuery++; this.ownershipState = "none";
        this.executionProfile = { kind: "controlled" }; this.profileDisplayName = null;
        this.profilePhase = "idle"; this.profileError = null;
        this.state = { ...this.state, controlledExecution: true };
        this.tools.reset(); this.draft.runtimeLost(); this.models.reset(); this.savedHistory.reset();
        this.interactionReset = this.interactions.reset({ generation: this.state.generation, viewId: this.state.viewId });
        // A fresh controlled session has no persisted file until an assistant entry.
        // Never treat its path as saved; uncertain/submitted/resumed cases stay strict.
        await this.reconcileRuntime(this.untouchedControlledConversation ? undefined : this.liveConversation, true);
      }
    } catch { if (current()) { this.profileError = "recovery-unconfirmed"; await this.refreshOwnership(); } }
    finally { this.recoveryBusy = false; this.publish(); }
  }

  private canSwitchProfile(): boolean {
    return !this.disposed && this.state.status === "eligible" && this.state.runtime === "ready"
      && !this.state.busy && !this.state.chatBusy && !this.stoppingTask && !this.draft.awaitingAcknowledgement
      && !this.models.snapshot.modelBusy && !this.sessionTransitionBusy() && !this.sessionOperation
      && this.interactions.snapshot().phase === "idle" && (this.profilePhase === "idle" || this.profilePhase === "error");
  }
  private async chooseExecutionProfile(view: vscode.WebviewView, profile: "controlled" | "trusted"): Promise<void> {
    if (!this.canSwitchProfile() || this.profileOperation || (profile === "controlled" && this.executionProfile.kind === "controlled")) return;
    const operation = {}; this.profileOperation = operation;
    let checkpointRejected = false;
    const generation = this.state.generation; const session = this.runtimeSession;
    const current = () => !this.disposed && this.view === view && this.profileOperation === operation && this.state.generation === generation;
    this.profilePhase = profile === "trusted" ? "selecting" : "switching"; this.profileError = null; this.publish();
    try {
      let selected: ExtensionExecutionProfile = { kind: "controlled" };
      let displayName: string | null = null;
      if (profile === "trusted") {
        const result = await selectTrustedExtension({
          pick: async () => {
            const files = await this.api.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, filters: { "pi extension": ["ts", "js", "mjs", "cjs"] }, openLabel: "Select trusted pi extension" });
            return files?.length === 1 && files[0]?.scheme === "file" ? files[0].fsPath : undefined;
          },
          confirm: async entryPath => await this.api.window.showWarningMessage(
            "Run this pi extension as trusted local code?\n\n" + entryPath + "\n\nIt can access files, network and processes outside tool approvals. Switching restarts the runtime, clears grants and captured review/attachments, retains unsent text and resumes the current conversation. This is not a sandbox.",
            { modal: true }, "Load trusted extension") === "Load trusted extension",
        }, current);
        if (!current()) return;
        if (result.kind !== "selected") { if (result.kind === "invalid-entry") this.profileError = "invalid-entry"; return; }
        selected = { kind: "trusted", entryPath: result.entryPath }; displayName = result.displayName;
      }
      if (!current()) return;
      if (this.state.runtime !== "ready" || session !== this.runtimeSession || this.state.chatBusy || this.interactions.snapshot().phase !== "idle") { this.profileError = "state-changed"; return; }
      this.profilePhase = "switching"; this.publish();
      checkpointRejected = true;
      const checkpoint = this.liveConversation && this.runtime.checkpointRestart
        ? await this.runtime.checkpointRestart(this.liveConversation) : { kind: "unavailable" as const };
      if (!current()) return;
      if (checkpoint.kind === "unavailable" || this.state.runtime !== "ready" || session !== this.runtimeSession || this.state.chatBusy || this.interactions.snapshot().phase !== "idle") {
        this.profileError = "state-changed"; return;
      }
      checkpointRejected = false;
      this.executionProfile = selected; this.profileDisplayName = displayName;
      this.state = { ...this.state, controlledExecution: selected.kind === "controlled" };
      this.tools.reset(); this.draft.runtimeLost(); this.models.reset(); this.savedHistory.reset();
      this.interactionReset = this.interactions.reset({ generation: this.state.generation, viewId: this.state.viewId });
      await this.reconcileRuntime(checkpoint.kind === "resume" ? checkpoint.conversation : undefined, true);
      if (!current()) return;
      if (this.state.runtime !== "ready") this.profileError = "startup-failed";
    } catch { if (current()) this.profileError = checkpointRejected ? "state-changed" : "startup-failed"; }
    finally {
      if (this.profileOperation === operation) {
        this.profileOperation = undefined;
        if (this.ownershipState !== "none" && !this.retainedRunElsewhere) this.profilePhase = "recovery-required";
        else this.profilePhase = this.profileError && !checkpointRejected ? "error" : "idle";
        this.publish();
      }
    }
  }

  private sessionTransitionBusy(): boolean { return this.sessionProjection.phase === "confirming" || this.sessionProjection.phase === "switching"; }
  private beginSessionBackendOperation(): { previous: Promise<void>; settle: () => void } {
    const previous = this.sessionBackendSettlement;
    let resolve!: () => void;
    const settled = new Promise<void>(done => { resolve = done; });
    this.sessionBackendSettlement = previous.then(() => settled);
    let complete = false;
    return { previous, settle: () => { if (!complete) { complete = true; resolve(); } } };
  }
  private resetSavedSessions(): void {
    this.sessionOperation?.abort(); this.sessionOperation = undefined; this.sessionCommit = undefined; this.sessionCatalog.clear();
    this.savedHistory.reset();
    this.sessionProjection = { phase: "idle", current: null, loaded: false, entries: [], page: 0, total: 0, error: null };
  }
  private publishSessions(): void {
    if (this.view && !this.disposed) this.post(this.view, { ...this.envelope("sessionState"), ...this.sessionProjection });
  }
  private sessionEligible(): boolean { return !this.disposed && this.state.status === "eligible" && this.state.choice !== null && !this.state.busy; }
  private async listSavedSessions(page: number): Promise<void> {
    if (!this.sessionEligible() || this.sessionOperation) return;
    const operation = new AbortController(); this.sessionOperation = operation;
    const generation = this.state.generation; const folder = this.state.folder?.path; if (!folder) { this.sessionOperation = undefined; return; }
    const current = () => !this.disposed && this.sessionOperation === operation && !operation.signal.aborted && generation === this.state.generation && folder === this.state.folder?.path;
    this.sessionProjection = { ...this.sessionProjection, phase: "listing", error: null }; this.publishSessions();
    const backend = this.beginSessionBackendOperation();
    try {
      await backend.previous;
      await this.savedHistory.waitForSettlement();
      if (!current()) return;
      const result = await this.sessionBackend.list(folder, page, operation.signal); if (!current()) return;
      if (!result.ok) { this.sessionProjection = { ...this.sessionProjection, phase: "error", error: result.code }; return; }
      this.sessionCatalog.clear();
      const entries = result.entries.map(entry => { const id = opaqueId(); this.sessionCatalog.set(id, entry); return { id, title: (entry.name?.trim() || entry.firstMessage || "Untitled conversation").slice(0, 160), excerpt: entry.firstMessage.slice(0, 256), modified: entry.modified.slice(0, 40) }; });
      this.sessionProjection = { ...this.sessionProjection, phase: "idle", loaded: true, entries, page: result.page, total: result.total, error: null };
    } catch { if (current()) this.sessionProjection = { ...this.sessionProjection, phase: "error", error: "unavailable" }; }
    finally { backend.settle(); if (this.sessionOperation === operation) { this.sessionOperation = undefined; this.publishSessions(); } }
  }
  private async stopCurrentTask(): Promise<{ ok: boolean; preparationRevision?: number }> {
    if (this.stopOperation) return this.stopOperation;
    const preparationRevision = this.draft.cancelPreparation();
    if (!this.state.chatBusy && !this.draft.awaitingAcknowledgement && !this.interactions.snapshot().active) { this.publish(); return { ok: true, preparationRevision }; }
    const session = this.runtimeSession; const generation = this.state.generation;
    this.stoppingTask = true; this.state = { ...this.state, execution: "stopping" }; this.tools.cancelApprovals(); this.publish();
    const interactionStop = this.interactions.stop();
    const operation = (async () => {
      const result = await this.runtime.abortTask?.().catch(() => ({ ok: false as const, detail: "Could not stop task." }));
      if (session !== this.runtimeSession || generation !== this.state.generation || this.disposed) return { ok: false, preparationRevision };
      await interactionStop;
      if (session !== this.runtimeSession || generation !== this.state.generation || this.disposed) return { ok: false, preparationRevision };
      this.stoppingTask = false;
      if (result?.ok) await this.interactions.reset({ generation: this.state.generation, viewId: this.state.viewId });
      if (session !== this.runtimeSession || generation !== this.state.generation || this.disposed) return { ok: false, preparationRevision };
      if (result?.ok) { this.settledOutcome ??= this.taskFailed ? "failed" : "stopped"; this.state = { ...this.state, execution: this.settledOutcome, chatBusy: false }; if (!this.sessionTransitionBusy()) void this.models.applyPending(); }
      else {
        this.settledOutcome ??= "failed";
        this.draft.settle(false, this.settledOutcome === "failed");
        this.draft.runtimeLost();
        this.tools.reset(); this.models.cancelPending();
        this.state = { ...this.state, runtime: "error", execution: this.settledOutcome, chatBusy: false, chatError: result?.detail ?? "Stop is unavailable." };
        void this.refreshOwnership();
      }
      this.publish(); return { ok: result?.ok === true, preparationRevision };
    })();
    this.stopOperation = operation;
    try { return await operation; } finally { if (this.stopOperation === operation) this.stopOperation = undefined; }
  }
  private async changeConversation(view: vscode.WebviewView, id?: string): Promise<void> {
    if (!this.sessionEligible() || this.sessionOperation) return;
    const selected = id === undefined ? undefined : this.sessionCatalog.get(id);
    if (id !== undefined && !selected) { this.sessionProjection = { ...this.sessionProjection, phase: "error", error: "stale" }; this.publishSessions(); return; }
    const operation = new AbortController(); this.sessionOperation = operation;
    let committed = false;
    let generation = this.state.generation; const folder = this.state.folder?.path; const choice = this.state.choice; let revision = this.draft.revision;
    if (!folder) { this.sessionOperation = undefined; return; }
    const current = () => !this.disposed && (committed || this.view === view) && this.sessionOperation === operation && !operation.signal.aborted && this.state.generation === generation && this.state.folder?.path === folder && this.state.choice === choice;
    const fail = (error: SessionError) => { this.sessionProjection = { ...this.sessionProjection, phase: error === "cancelled" ? "idle" : "error", error }; };
    this.savedHistory.cancel();
    this.sessionProjection = { ...this.sessionProjection, phase: "confirming", error: null }; this.publishSessions();
    try {
      const button = selected ? "Other entry point is closed — restore" : "Start new conversation";
      const message = (selected ? "Close any terminal or other editor driving this saved pi session before restoring. Confirmation does not enforce exclusive ownership. Historical extensions will not be automatically loaded. " : "Start a new pi conversation without deleting saved sessions. ") + "The current task will be stopped. Unsent draft text/attachments, memory-only attachment history, and temporary grants/review snapshots will be cleared.";
      const answer = await this.api.window.showWarningMessage(message, { modal: true }, button);
      if (!current()) return;
      if (answer !== button || revision !== this.draft.revision) { fail("cancelled"); return; }
      this.sessionProjection = { ...this.sessionProjection, phase: "switching", error: null }; this.publishSessions();
      const stopped = await this.stopCurrentTask();
      if (!stopped.ok) { if (current()) fail("stop-failed"); return; }
      if (!current()) return;
      if (stopped.preparationRevision !== undefined) {
        if (this.draft.revision !== stopped.preparationRevision) { fail("cancelled"); return; }
        revision = stopped.preparationRevision;
      }
      let resume: SavedSession | undefined; let history: SavedHistoryPage | undefined; let anchor: string | null = null;
      if (selected) {
        const backend = this.beginSessionBackendOperation();
        try {
          await backend.previous;
          await this.savedHistory.cancel();
          if (!current()) return;
          if (revision !== this.draft.revision) { fail("cancelled"); return; }
          const result = await this.sessionBackend.inspect(folder, selected.id, operation.signal);
          if (!current()) return;
          if (!result.ok) { fail(result.code); return; }
          if (result.session.id !== selected.id) { fail("stale"); return; }
          if (!result.anchor && (result.history.total > 0 || result.history.messages.length > 0)) { fail("restore-failed"); return; }
          resume = result.session; history = result.history; anchor = result.anchor;
        } finally { backend.settle(); }
      }
      if (revision !== this.draft.revision) { fail("cancelled"); return; }
      if (this.state.generation >= Number.MAX_SAFE_INTEGER) { fail("unavailable"); return; }
      committed = true; this.sessionCommit = operation; this.clearChat(true); this.draft.clearText(); this.sessionCatalog.clear();
      // Execution consent belongs to the old live runtime, never a new or restored conversation.
      this.executionProfile = { kind: "controlled" }; this.profileDisplayName = null; this.profileError = null;
      this.state = { ...this.state, generation: this.state.generation + 1, controlledExecution: true }; generation = this.state.generation;
      this.sessionProjection = { phase: "switching", current: null, loaded: false, entries: [], page: 0, total: 0, error: null };
      this.publishSessions(); this.draft.publish(); this.publish();
      await this.reconcileRuntime(resume); if (!current()) return;
      if (this.state.runtime !== "ready" || (resume && this.sessionProjection.current?.id !== resume.id)) { fail("restore-failed"); return; }
      this.sessionProjection = { ...this.sessionProjection, phase: "idle", error: null };
      if (resume && history) this.savedHistory.restore(resume.id, anchor, history);
    } catch { if (current()) fail("unavailable"); }
    finally { if (this.sessionOperation === operation) { if (this.sessionCommit === operation) this.sessionCommit = undefined; if (!committed && (this.sessionProjection.phase === "confirming" || this.sessionProjection.phase === "switching")) fail("cancelled"); this.sessionOperation = undefined; this.publishSessions(); } }
  }

  private envelope<T extends string>(type: T) { return { version: 3 as const, type, generation: this.state.generation, viewId: this.state.viewId }; }

  private publish(forceExtensions = false): void {
    if (!this.disposed) this.settingsPanel?.publish(forceExtensions);
    if (!this.view || this.disposed) return;
    const interactions = { ...this.envelope("interactionState"), ...this.interactions.snapshot(), ...this.extensionFeedback };
    const interactionKey = JSON.stringify(interactions);
    if (forceExtensions || interactionKey !== this.lastInteractionProjection) { this.lastInteractionProjection = interactionKey; this.post(this.view, interactions); }
    const profile = { ...this.envelope("executionProfileState"), profile: this.executionProfile.kind, displayName: this.profileDisplayName, phase: this.profilePhase, errorCode: this.profileError, canSwitch: this.canSwitchProfile(), canEnd: !this.recoveryBusy && this.profilePhase === "recovery-required" && this.ownershipState === "pending", canRecover: !this.recoveryBusy && this.profilePhase === "recovery-required" && this.ownershipState === "terminal" };
    const profileKey = JSON.stringify(profile);
    if (forceExtensions || profileKey !== this.lastProfileProjection) { this.lastProfileProjection = profileKey; this.post(this.view, profile); }
    const providers = { ...this.envelope("providerConfigState"), ...this.providerConfig.snapshot };
    const providerKey = JSON.stringify(providers);
    if (forceExtensions || providerKey !== this.lastProviderConfigProjection) { this.lastProviderConfigProjection = providerKey; this.post(this.view, providers); }
    this.post(this.view, { ...this.state, ...this.models.snapshot });
  }

  private post(view: vscode.WebviewView, message: unknown): void {
    // A disposed/unloaded renderer may reject delivery; reopening resynchronizes.
    try { void Promise.resolve(view.webview.postMessage(message)).catch(() => undefined); }
    catch { /* Synchronous teardown race: no payload or exception is logged. */ }
  }

  private clearView(): void {
    this.savedHistory.cancel();
    if (this.sessionOperation && this.sessionCommit !== this.sessionOperation) {
      this.sessionOperation.abort(); this.sessionOperation = undefined;
      if (this.sessionProjection.phase === "listing" || this.sessionTransitionBusy()) this.sessionProjection = { ...this.sessionProjection, phase: "idle", error: "cancelled" };
    }
    this.view = undefined;
    this.draft.closeView();
    this.operation = undefined;
    this.state = { ...this.state, busy: this.workspaceUpdatePending, error: null };
    for (const subscription of this.viewSubscriptions) subscription.dispose();
    this.viewSubscriptions = [];
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    if (this.disposed) return;
    this.clearView();
    this.refresh();
    this.view = webviewView;
    this.state = { ...this.state, viewId: opaqueId() }; this.draft.openView();
    this.interactions.bindView({ generation: this.state.generation, viewId: this.state.viewId });
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [getWebviewResourceRoot(this.extensionUri)],
    };
    this.viewSubscriptions = [
      webviewView.webview.onDidReceiveMessage((message: unknown) => { void this.receive(webviewView, message); }),
      webviewView.onDidDispose(() => { if (this.view === webviewView) this.clearView(); }),
    ];
    const nonce = randomBytes(16).toString("base64");
    webviewView.webview.html = getWebviewHtml(webviewView.webview, this.extensionUri, nonce);
    void this.providerConfig.refresh();
  }

  private async receive(view: vscode.WebviewView, value: unknown): Promise<void> {
    if (this.disposed || view !== this.view) return;
    const message = parseWebviewMessage(value);
    if (!message) return;
    this.refresh();
    if (message.type === "ping") { this.post(view, this.envelope("pong")); return; }
    if (message.type === "getWorkspaceState") {
      if (this.profilePhase === "recovery-required" && !this.recoveryBusy) void this.refreshOwnership();
      this.draft.publish(); this.tools.publishReview(); this.publishSessions(); this.savedHistory.publish();
      this.post(view, { ...this.envelope("uiLanguageState"), locale: this.uiLocale });
      this.publish(true);
      return;
    }
    if (message.generation !== this.state.generation || message.viewId !== this.state.viewId) { this.draft.rejectStale(); this.publish(); return; }
    if (message.type === "openSettings") { this.settingsPanel.open(); return; }
    if (message.type === "setUiLanguage") { this.setUiLanguage(message.locale); return; }
    if (message.type === "answerInteraction") { this.interactions.answer(message, message.id, message.answer); return; }
    if (message.type === "cancelInteraction") { this.interactions.cancel(message, message.id); return; }
    if (message.type === "chooseExecutionProfile") { await this.chooseExecutionProfile(view, message.profile); return; }
    if (message.type === "endOwnedRuntime" || message.type === "recoverControlledRuntime") { await this.recoverRuntime(view, message.type); return; }
    if (message.type === "refreshProviderConfig" || message.type === "openProviderApiKey" || message.type === "openProviderOAuth"
      || message.type === "addCustomEndpoint" || message.type === "removeCustomEndpoint" || message.type === "logoutProvider"
      || message.type === "setDefaultThinkingLevel" || message.type === "setDefaultModel") {
      await this.configureProvider(message);
      return;
    }
    if (this.profilePhase !== "idle" && message.type !== "stopChat") { this.publish(); return; }
    if (this.state.busy) { this.draft.rejectStale(); this.publish(); return; }
    if (message.type === "getSavedHistory") { await this.savedHistory.page(message.page); return; }
    if (message.type === "getSavedHistoryPreview") { await this.savedHistory.preview(message.id, message.requestId, message.offset); return; }
    const toolGeneration = this.state.generation; const session = this.runtimeSession;
    const toolOperation = this.tools.handle(message, () => !this.disposed && this.view === view && toolGeneration === this.state.generation && session === this.runtimeSession);
    if (toolOperation) { await toolOperation; return; }
    const draftOperation = this.draft.handle(view, message);
    if (draftOperation) { await draftOperation; return; }
    if (message.type === "getSavedSessions") { await this.listSavedSessions(message.page); return; }
    if (message.type === "newConversation" || message.type === "resumeConversation") { await this.changeConversation(view, message.type === "resumeConversation" ? message.id : undefined); return; }
    if (message.type === "stopChat") { await this.stopCurrentTask(); return; }
    if (message.type === "chooseResources") {
      if (this.state.status === "eligible") {
        this.clearChat();
        this.state = { ...this.state, choice: message.choice, error: null };
        this.draft.publish();
        void this.reconcileRuntime();
      }
      this.publish();
      return;
    }
    if (message.type === "setThinkingLevel" || message.type === "setChatModel") {
      await this.models.select(message);
      this.publish();
      return;
    }
    if ((message.type === "openFolder" && this.state.status !== "no-folder")
      || (message.type === "manageTrust" && this.state.status !== "untrusted")) { this.publish(); return; }
    const operation = {};
    this.operation = operation;
    const generation = this.state.generation;
    const current = (): boolean => {
      if (this.disposed || view !== this.view || this.operation !== operation) return false;
      this.refresh();
      return this.operation === operation && this.state.generation === generation;
    };
    this.state = { ...this.state, busy: true, error: null };
    this.publish();
    try {
      if (message.type === "openFolder") {
        const selected = await this.api.window.showOpenDialog({
          canSelectFiles: false, canSelectFolders: true, canSelectMany: false, openLabel: "Open folder for pi",
        });
        if (current() && this.state.status === "no-folder" && selected?.length === 1 && selected[0]?.scheme === "file") {
          // Adding the first folder can restart this host without a folder event.
          // The next provider reads authoritative workspace state in its constructor;
          // a true return only accepts the request, not proof the folder is open.
          if (!this.api.workspace.updateWorkspaceFolders(0, 0, { uri: selected[0] })) {
            throw new Error("Workspace folder update rejected");
          }
          if (current()) this.workspaceUpdatePending = true;
        }
      } else {
        await this.api.commands.executeCommand("workbench.trust.manage");
      }
    } catch {
      if (current()) this.state = { ...this.state, error: message.type === "openFolder"
        ? "Could not add the folder. Try Open folder again or use File > Open Folder."
        : "Could not open workspace trust settings. Try Manage workspace trust again." };
    } finally {
      if (current()) {
        this.operation = undefined;
        this.state = { ...this.state, busy: this.workspaceUpdatePending };
      }
      if (!this.disposed && view === this.view) this.publish();
    }
  }

  private setUiLanguage(locale: "en" | "zh-CN"): void {
    this.uiLocale = locale;
    if (this.view) this.post(this.view, { ...this.envelope("uiLanguageState"), locale });
    this.settingsPanel.publish(true);
  }

  private async configureProvider(message: ProviderConfigIntent): Promise<void> {
    if (this.disposed) return;
    switch (message.type) {
      case "refreshProviderConfig": await this.providerConfig.refresh(); break;
      case "openProviderApiKey": await this.providerConfig.openApiKey(message.providerId); break;
      case "openProviderOAuth": await this.providerConfig.openOAuth(message.providerId); break;
      case "addCustomEndpoint": {
        const saved = await this.providerConfig.addCustomEndpoint(message);
        if (saved && this.state.runtime === "ready") await this.syncSessionModelsAfterProviderConfig(saved.providerId, saved.modelId);
        else await this.syncSessionModelsAfterProviderConfig();
        this.publish();
        return;
      }
      case "removeCustomEndpoint": await this.providerConfig.removeCustomEndpoint(message.providerId); break;
      case "logoutProvider": await this.providerConfig.logout(message.providerId); break;
      case "setDefaultModel": await this.providerConfig.setDefaultModel(message.provider, message.modelId); break;
      case "setDefaultThinkingLevel":
        await this.providerConfig.setDefaultThinkingLevel(message.provider, message.modelId, message.level);
        this.publish(); return;
    }
    if (message.type === "setDefaultModel") await this.syncSessionModelsAfterProviderConfig(message.provider, message.modelId);
    else await this.syncSessionModelsAfterProviderConfig();
    this.publish();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.settingsPanel.dispose();
    this.reconcileToken += 1;
    this.unsubscribeRuntime();
    void this.interactions.dispose();
    this.clearChat(); this.tools.dispose(); this.draft.dispose();
    void this.runtime.stop();
    this.clearView();
    for (const subscription of this.subscriptions) subscription.dispose();
  }
}
