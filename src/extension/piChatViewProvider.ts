import { unavailableSessionBackend, type SessionBackend, type SavedSession, type SavedHistoryPage } from "./contracts/sessionBackend.js";
import type { SessionStateMessage, SessionError } from "./contracts/webviewProtocol.js";
import type * as vscode from "vscode";
import { randomBytes } from "node:crypto";
import { getWebviewHtml, getWebviewResourceRoot } from "./bridge/webviewHtml.js";
import { ModelSettings, type ModelSettingsSnapshot } from "./models/modelSettings.js";
import type { PiRuntimeLifecycle, RuntimeEvent } from "./contracts/runtimeLifecycle.js";
import { parseWebviewMessage, type WorkspaceStateMessage } from "./bridge/webviewMessages.js";

import { SavedHistory } from "./sessions/savedHistory.js";
import { EditorTools, type EditorToolOptions } from "./editor-tools/editorTools.js";
import { DraftSubmission } from "./draft/draftSubmission.js";

const opaqueId = () => randomBytes(16).toString("hex");

export const PI_CHAT_VIEW_ID = "pi-vscode.chat";

/** Reveal the contributed container, then focus its existing view (never toggle). */
export async function focusPiChat(api: Pick<typeof vscode, "commands">): Promise<void> {
  await api.commands.executeCommand("workbench.view.extension.pi-vscode");
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
    version: 2, type: "workspaceState", viewId: opaqueId(), generation: 0, status: "no-folder",
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
        disposed: this.disposed, blocked: this.state.busy || this.sessionTransitionBusy(),
        chatBusy: this.state.chatBusy, stopping: this.stoppingTask };
    }, () => this.publish());
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
        eligible: !this.sessionTransitionBusy() && this.state.status === "eligible" && this.state.runtime === "ready"
          && !this.state.busy && !this.state.chatBusy && !this.models.snapshot.modelBusy && !this.stoppingTask };
    }, message => { if (this.view && !this.disposed) this.post(this.view, message); }, {
      accepted: body => {
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
    this.refresh();
    this.runtime.setApprovalHandler?.(this.tools.requestApproval);
    this.unsubscribeRuntime = this.runtime.subscribe((event) => { this.handleRuntimeEvent(event); });
    this.subscriptions = [
      api.workspace.onDidChangeWorkspaceFolders(() => { this.refresh(true); this.publish(); this.draft.publish(); }),
      api.workspace.onDidGrantWorkspaceTrust(() => { this.refresh(); this.publish(); this.draft.publish(); }),
    ];
  }

  private clearChat(preserveSessionTransition = false): void {
    this.savedHistory.reset();
    if (!preserveSessionTransition) this.resetSavedSessions();
    this.stopOperation = undefined;
    this.tools.reset();
    this.draft.reset(preserveSessionTransition);
    this.models.reset();
    this.stoppingTask = false;
    this.state = { ...this.state, messages: [], activities:[], execution:'idle', chatBusy: false, chatError: null };
    this.runtimeSession = 0;
  }

  private handleRuntimeEvent(event: RuntimeEvent): void {
    if (this.disposed) return;
    this.refresh();
    if (event.session !== this.runtimeSession || this.state.runtime !== "ready") return;
    if (event.kind === 'runtime_error') {
      this.resetSavedSessions(); this.publishSessions();
      this.tools.reset();
      this.draft.runtimeLost();
      this.stoppingTask=false;
      this.models.cancelPending(); this.promptToken++;
      this.state={...this.state,runtime:'error',runtimeDetail:event.detail,chatBusy:false,execution:'failed',activities:this.state.activities.map(i=>i.status==='complete'||i.status==='failed'?i:{...i,status:'interrupted'})};this.publish();return;
    }
    if (event.kind === 'activity') {
      const activities=[...this.state.activities];const index=activities.findIndex(i=>i.id===event.item.id);
      if(index>=0)activities[index]=event.item;else if(activities.length<64)activities.push(event.item);
      this.state={...this.state,activities,execution:this.state.execution==='stopping'?'stopping':this.state.approvals.length?'awaiting-approval':event.item.kind==='thinking'?'thinking':event.item.status==='executing'?'executing':'waiting'};this.publish();return;
    }
    if(event.kind==='message_final') {
      const messages=[...this.state.messages];const index=messages.findIndex(m=>m.id===event.messageId);
      if(index>=0)messages[index]={role:'assistant',id:event.messageId,text:event.text};else if(event.text)messages.push({role:'assistant',id:event.messageId,text:event.text});
      this.state={...this.state,messages:messages.slice(-32)};this.publish();return;
    }
    if (event.kind === "text_delta") {
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
      this.state = { ...this.state, chatError: event.detail };
      this.publish();
      return;
    }
    if (event.kind === "tool_finished") { this.tools.finishTool(event.toolCallId, event.failed); return; }
    if (event.kind === "agent_settled" && this.state.chatBusy) {
      this.tools.endTask();
      if (!this.draft.settle(this.stoppingTask)) return;
      this.finishSettledTask();
    }
  }

  private finishSettledTask(): void {
    this.promptToken += 1;
    const hasAssistant = this.state.messages.some((entry) => entry.role === "assistant" && entry.text.length > 0);
    this.state = {
      ...this.state,
      chatBusy: false,
      execution: this.stoppingTask ? 'stopping' : 'idle',
      chatError: hasAssistant || this.state.activities.length || this.stoppingTask || this.state.chatError
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
    this.identity = identity;
    this.operation = undefined;
    this.workspaceUpdatePending = false;
    this.clearChat();
    const prevChoice = this.state.choice;
    const prevStatus = this.state.status;
    this.state = {
      ...this.state, generation: this.state.generation + 1, choice: null, busy: false, error: null,
      runtime: "not-started", runtimeDetail: null,
      status: remote ? "remote" : folders.length === 0 ? "no-folder" : folders.length > 1 ? "multi-root"
        : folder?.uri.scheme !== "file" ? "non-file" : !trusted ? "untrusted" : "eligible",
      folder: folder ? { name: folder.name, path: folder.uri.scheme === "file" ? folder.uri.fsPath : folder.uri.toString() } : null,
    };
    if (prevChoice !== this.state.choice || prevStatus !== this.state.status) {
      void this.reconcileRuntime();
    }
  }

  private async reconcileRuntime(resume?: SavedSession): Promise<void> {
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
    const result = await this.runtime.start({ cwd: folderPath, projectTrust, ...(resume ? { resume: { id: resume.id, path: resume.path } } : {}) });
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
      this.runtimeSession = this.runtime.getSession();
      this.sessionProjection = { ...this.sessionProjection, current: result.conversation ? { id: result.conversation.id, name: result.conversation.name } : null };
      this.state = {
        ...this.state,
        runtime: "ready",
        runtimeDetail: null,
        messages: [],
      };
      void this.models.load(result.modelLabel);
    }
    this.publishSessions(); this.publish();
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
    if (!this.state.chatBusy && !this.draft.awaitingAcknowledgement) { this.publish(); return { ok: true, preparationRevision }; }
    const session = this.runtimeSession; const generation = this.state.generation;
    this.stoppingTask = true; this.state = { ...this.state, execution: "stopping" }; this.tools.cancelApprovals(); this.publish();
    const operation = (async () => {
      const result = await this.runtime.abortTask?.().catch(() => ({ ok: false as const, detail: "Could not stop task." }));
      if (session !== this.runtimeSession || generation !== this.state.generation || this.disposed) return { ok: false, preparationRevision };
      this.stoppingTask = false;
      if (result?.ok) { this.state = { ...this.state, execution: "idle", chatBusy: false }; if (!this.sessionTransitionBusy()) void this.models.applyPending(); }
      else { this.tools.cancelApprovals(true); this.models.cancelPending(); this.state = { ...this.state, runtime: "error", execution: "failed", chatBusy: false, chatError: result?.detail ?? "Stop is unavailable." }; }
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
      const message = (selected ? "Close any terminal or other editor driving this saved pi session before restoring. Confirmation does not enforce exclusive ownership. Historical extensions will not be automatically loaded. " : "Start a new pi conversation without deleting saved sessions. ") + "The current task will be stopped. Unsent draft text/attachments and temporary grants/review snapshots will be cleared.";
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
      this.state = { ...this.state, generation: this.state.generation + 1 }; generation = this.state.generation;
      this.sessionProjection = { phase: "switching", current: null, loaded: false, entries: [], page: 0, total: 0, error: null };
      this.publishSessions(); this.draft.publish(); this.publish();
      await this.reconcileRuntime(resume); if (!current()) return;
      if (this.state.runtime !== "ready" || (resume && this.sessionProjection.current?.id !== resume.id)) { fail("restore-failed"); return; }
      this.sessionProjection = { ...this.sessionProjection, phase: "idle", error: null };
      if (resume && history) this.savedHistory.restore(resume.id, anchor, history);
    } catch { if (current()) fail("unavailable"); }
    finally { if (this.sessionOperation === operation) { if (this.sessionCommit === operation) this.sessionCommit = undefined; if (!committed && (this.sessionProjection.phase === "confirming" || this.sessionProjection.phase === "switching")) fail("cancelled"); this.sessionOperation = undefined; this.publishSessions(); } }
  }

  private envelope<T extends string>(type: T) { return { version: 2 as const, type, generation: this.state.generation, viewId: this.state.viewId }; }

  private publish(): void {
    if (this.view && !this.disposed) this.post(this.view, { ...this.state, ...this.models.snapshot });
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
  }

  private async receive(view: vscode.WebviewView, value: unknown): Promise<void> {
    if (this.disposed || view !== this.view) return;
    const message = parseWebviewMessage(value);
    if (!message) return;
    this.refresh();
    if (message.type === "ping") { this.post(view, this.envelope("pong")); return; }
    if (message.type === "getWorkspaceState") { this.draft.publish(); this.tools.publishReview(); this.publishSessions(); this.savedHistory.publish(); this.publish(); return; }
    if (message.generation !== this.state.generation || message.viewId !== this.state.viewId || this.state.busy) { this.draft.rejectStale(); this.publish(); return; }
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

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.reconcileToken += 1;
    this.unsubscribeRuntime();
    this.clearChat(); this.tools.dispose(); this.draft.dispose();
    void this.runtime.stop();
    this.clearView();
    for (const subscription of this.subscriptions) subscription.dispose();
  }
}
