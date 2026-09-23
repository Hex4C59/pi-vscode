import { unavailableSessionBackend, type SessionBackend, type SavedSession, type SavedHistoryPage } from "./sessionBackend.js";
import type { SessionStateMessage, SessionError } from "./webviewProtocol.js";
import type * as vscode from "vscode";
import { randomBytes } from "node:crypto";
import { getWebviewHtml, getWebviewResourceRoot } from "./webviewHtml.js";
import { findCatalogEntry } from "./modelCatalog.js";
import type { PiRuntimeLifecycle, RuntimeEvent } from "./runtimeLifecycle.js";
import { parseWebviewMessage, type WorkspaceStateMessage, type AttachmentStateMessage, type AttachmentHistoryEntry, type AttachmentDetails, type SelectionRange } from "./webviewMessages.js";

import { SavedHistory } from "./savedHistory.js";
import { ChangeReview } from "./changeReview.js";
import { checkWriteTarget } from "./writeProtection.js";
import { ToolApprovals } from "./toolApproval.js";
import { AttachmentFailure, captureFile, captureSelection, revalidateFile, validateEditorSnapshot, selectionSourceRevision, sameSelectionSource, validateSelectionDocument, type SelectionSourceRevision, type AttachmentCode, type FileSnapshot } from "./fileAttachment.js";

type DraftAttachment = { attachmentId: string; snapshotId: string; source: FileSnapshot; state: "attached" | "changed" | "confirmation-required" | "unavailable" } & (
  { kind: "file" } | { kind: "selection"; originalRange: SelectionRange; stale: boolean; authorized: SelectionSourceRevision; observed?: SelectionSourceRevision }
);
type Submission = AttachmentHistoryEntry & { text: string; body: string; draftRevision: number };
function attachmentDetails(attachment: AttachmentDetails): AttachmentDetails {
  return attachment.kind === "selection" ? { kind: "selection", originalRange: attachment.originalRange, stale: attachment.stale } : { kind: "file" };
}
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
  private catalogToken = 0;
  private runtimeSession = 0;
  private promptToken = 0;
  private stoppingTask = false;
  private draftRevision = 0;
  private draftText = "";
  private acceptedEditSequence = 0;
  private attachments: DraftAttachment[] = [];
  private preparation: "idle" | "picking" | "preparing" = "idle";
  private attachmentToken: object = {};
  private attachmentResult: AttachmentCode | null = null;
  private history: Submission[] = [];
  private retainedBytes = 0;
  private lastSubmission: { submissionId: string; draftRevision: number; delivery: string; outcome: string } | null = null;
  private awaitingAck = false;
  private previewOperation: object | undefined;
  private readonly review: ChangeReview;
  private readonly savedHistory: SavedHistory;
  private sessionOperation: AbortController | undefined;
  private sessionCommit: AbortController | undefined;
  private sessionBackendSettlement: Promise<void> = Promise.resolve();
  private stopOperation: Promise<{ ok: boolean; preparationRevision?: number }> | undefined;
  private sessionCatalog = new Map<string, SavedSession>();
  private sessionProjection: Omit<SessionStateMessage, "version" | "generation" | "viewId" | "type"> = { phase: "idle", current: null, loaded: false, entries: [], page: 0, total: 0, error: null };
  private readonly unsubscribeRuntime: () => void;
  private readonly toolApprovals = new ToolApprovals(() => {
    if (!this.state) return;
    const approvals = this.toolApprovals.cards();
    this.state = {...this.state, approvals, grants:this.toolApprovals.scopes(), execution: approvals.length ? 'awaiting-approval' : this.state.execution === 'awaiting-approval' ? 'waiting' : this.state.execution};
    this.publish();
  }, undefined, async (call, phase) => {
    const generation = this.state.generation;
    const session = this.runtimeSession;
    let blocked = await checkWriteTarget(call, this.api.workspace);
    if (!blocked && phase === "final" && !this.disposed && generation === this.state.generation && session === this.runtimeSession && this.state.execution !== "stopping") {
      await this.review.beforeWrite(call);
      blocked = await checkWriteTarget(call, this.api.workspace);
    }
    if (this.disposed || generation !== this.state.generation || session !== this.runtimeSession || this.state.execution === "stopping") return false;
    if (blocked) {
      this.state = { ...this.state, chatError: blocked === "dirty" ? "Write blocked: the target has unsaved editor changes. Handle those changes first, then explicitly retry the task. Nothing was auto-saved." : "Write blocked: the editor safety check could not finish reliably. Check the target and open documents, then explicitly retry. Nothing was auto-saved." };
      this.publish();
      return false;
    }
    return true;
  }, (call, allowed) => { if (!allowed) this.review.discardWrite(call.toolCallId); });
  private state: WorkspaceStateMessage = {
    version: 2, type: "workspaceState", viewId: opaqueId(), generation: 0, status: "no-folder",
    folder: null, choice: null, busy: false, error: null, runtime: "not-started", runtimeDetail: null,
    messages: [], chatBusy: false, chatError: null, chatModel: null,
    thinkingLevel: null, thinkingLevels: [], availableModels: [], modelBusy: false, modelError: null,
    pendingModel: null, pendingThinkingLevel: null,
    activities: [], approvals: [], grants: [], execution:'idle', controlledExecution:true,
  };

  private emptyModelFields(): Pick<
    WorkspaceStateMessage,
    "chatModel" | "thinkingLevel" | "thinkingLevels" | "availableModels" | "modelBusy" | "modelError" | "pendingModel" | "pendingThinkingLevel"
  > {
    return {
      chatModel: null,
      thinkingLevel: null,
      thinkingLevels: [],
      availableModels: [],
      modelBusy: false,
      modelError: null,
      pendingModel: null,
      pendingThinkingLevel: null,
    };
  }

  private canChangeModelSettings(): boolean {
    return !this.sessionTransitionBusy() && this.state.runtime === "ready" && !this.state.busy && !this.state.modelBusy;
  }

  /** Serialize next-turn intent only after the session-level settled event. */
  private async applyPendingSettings(): Promise<void> {
    if (this.disposed || this.stoppingTask || !this.canChangeModelSettings() || this.state.chatBusy) return;
    const model = this.state.pendingModel;
    const level = this.state.pendingThinkingLevel;
    if (!model && !level) return;
    const token = ++this.catalogToken;
    const generation = this.state.generation;
    const session = this.runtimeSession;
    const current = (): boolean => {
      if (this.disposed) return false;
      this.refresh();
      return token === this.catalogToken && generation === this.state.generation
        && session === this.runtimeSession && this.state.runtime === "ready";
    };
    this.state = { ...this.state, modelBusy: true, modelError: null };
    this.publish();
    let error = "Could not apply model settings. Select again to retry.";
    const accept = (result: Awaited<ReturnType<PiRuntimeLifecycle["getModelProjection"]>>): boolean => {
      if (!result.ok) return false;
      this.state = { ...this.state, chatModel: result.modelLabel, thinkingLevel: result.thinkingLevel,
        thinkingLevels: result.thinkingLevels, availableModels: result.models };
      return true;
    };
    try {
      if (model) {
        const result = await this.runtime.setModel(model.provider, model.modelId);
        if (!current()) return;
        if (!accept(result)) throw new Error();
        // setModel returns a fresh get_state + available-levels projection.
      }
      if (level) {
        if (!this.state.thinkingLevels.includes(level)) {
          error = "Requested thinking level is not supported by the selected model. It was not applied.";
          throw new Error();
        }
        const result = await this.runtime.setThinkingLevel(level);
        if (!current()) return;
        if (!accept(result)) throw new Error();
        if (this.state.thinkingLevel !== level) {
          error = "Requested thinking level was not applied by the runtime. Select again to retry.";
          throw new Error();
        }
      }
    } catch {
      if (!current()) return;
      // A failed mutation/refresh may have changed upstream state; read back,
      // never retry a mutation or claim that the requested value was applied.
      try {
        const result = await this.runtime.getModelProjection();
        if (!current()) return;
        if (!accept(result)) this.state = { ...this.state, chatModel: null, thinkingLevel: null, thinkingLevels: [] };
      } catch {
        if (!current()) return;
        this.state = { ...this.state, chatModel: null, thinkingLevel: null, thinkingLevels: [] };
      }
      this.state = { ...this.state, modelError: error };
    } finally {
      if (current()) {
        this.state = { ...this.state, modelBusy: false, pendingModel: null, pendingThinkingLevel: null };
        this.publish();
      }
    }
  }

  private async syncModelCatalog(): Promise<void> {
    const token = ++this.catalogToken;
    if (this.state.runtime !== "ready" || this.disposed) return;
    if (!this.state.modelBusy) {
      this.state = { ...this.state, modelBusy: true, modelError: null };
      this.publish();
    }
    const generation = this.state.generation;
    const session = this.runtimeSession;
    const result = await this.runtime.getModelProjection().catch(() => ({ ok: false as const, detail: "Could not load model settings." }));
    if (token !== this.catalogToken || this.disposed) return;
    if (this.state.generation !== generation || this.runtimeSession !== session || this.state.runtime !== "ready") {
      this.state = { ...this.state, modelBusy: false };
      this.publish();
      return;
    }
    if (!result.ok) {
      this.state = {
        ...this.state,
        modelBusy: false,
        modelError: "Could not load model settings. Restart runtime to retry.",
      };
      this.publish();
      return;
    }
    this.state = {
      ...this.state,
      modelBusy: false,
      modelError: null,
      chatModel: result.modelLabel,
      thinkingLevel: result.thinkingLevel,
      thinkingLevels: result.thinkingLevels,
      availableModels: result.models,
    };
    this.publish();
  }

  constructor(
    private readonly api: Pick<typeof vscode, "workspace" | "env" | "window" | "commands" | "Uri" | "RelativePattern" | "EventEmitter">,
    private readonly runtime: PiRuntimeLifecycle,
    private readonly extensionUri: vscode.Uri,
    private readonly sessionBackend: SessionBackend = unavailableSessionBackend,
  ) {
    this.savedHistory = new SavedHistory(sessionBackend, () => ({
      cwd: this.state.folder?.path,
      key: this.state.generation + ":" + this.state.viewId,
      settled: this.sessionBackendSettlement,
      enabled: !this.disposed && this.sessionEligible() && !this.sessionTransitionBusy(),
      startable: !this.disposed && this.sessionEligible() && !this.sessionTransitionBusy() && !this.sessionOperation,
    }), message => { if (this.view && !this.disposed) this.post(this.view, { ...this.attachmentEnvelope(message.type), ...message }); });
    this.review = new ChangeReview(this.api, () => this.publishReview());
    this.refresh();
    this.runtime.setApprovalHandler?.(call => this.state.runtime === 'ready' && this.state.chatBusy && this.state.execution !== 'stopping' && call.cwd === this.state.folder?.path ? this.toolApprovals.request(call) : Promise.resolve(false));
    this.unsubscribeRuntime = this.runtime.subscribe((event) => { this.handleRuntimeEvent(event); });
    this.subscriptions = [
      api.workspace.onDidChangeWorkspaceFolders(() => { this.refresh(true); this.publish(); this.publishAttachments(); }),
      api.workspace.onDidGrantWorkspaceTrust(() => { this.refresh(); this.publish(); this.publishAttachments(); }),
      api.workspace.onDidChangeTextDocument(event => {
        const matching = this.attachments.filter(a => a.source.document === event.document);
        for (const a of matching) { a.state = "changed"; if (a.kind === "selection") { a.stale = true; a.observed = undefined; } }
        if (matching.length) this.publishAttachments();
      }),
      api.workspace.onDidCloseTextDocument(document => {
        const matching = this.attachments.filter(a => a.source.document === document);
        for (const a of matching) a.state = "unavailable";
        if (matching.length) this.publishAttachments();
      }),
    ];
  }

  private clearChat(preserveSessionTransition = false): void {
    this.savedHistory.reset();
    if (!preserveSessionTransition) this.resetSavedSessions();
    this.stopOperation = undefined;
    this.review.clear();
    this.attachmentToken = {}; this.preparation = "idle";
    if (preserveSessionTransition) this.attachmentResult = null;
    else if (this.attachments.length || this.history.length) this.attachmentResult = "runtime-lost";
    this.attachments = []; this.history = []; this.retainedBytes = 0; this.lastSubmission = null;
    this.awaitingAck = false; this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1);
    this.catalogToken += 1;
    this.toolApprovals.cancel(true);
    this.stoppingTask = false;
    this.state = { ...this.state, messages: [], activities:[], execution:'idle', chatBusy: false, chatError: null, ...this.emptyModelFields() };
    this.runtimeSession = 0;
  }

  private handleRuntimeEvent(event: RuntimeEvent): void {
    if (this.disposed) return;
    this.refresh();
    if (event.session !== this.runtimeSession || this.state.runtime !== "ready") return;
    if (event.kind === 'runtime_error') {
      this.resetSavedSessions(); this.publishSessions();
      this.review.clear();
      this.attachmentToken = {}; this.preparation = "idle"; this.attachments = []; this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1);
      this.history = []; this.retainedBytes = 0; this.awaitingAck = false; this.attachmentResult = "runtime-lost";
      if (this.lastSubmission) { this.lastSubmission.delivery = "unknown"; this.lastSubmission.outcome = "interrupted"; }
      this.publishAttachments();
      this.stoppingTask=false;
      this.toolApprovals.cancel(true); this.catalogToken++; this.promptToken++;
      this.state={...this.state,runtime:'error',runtimeDetail:event.detail,chatBusy:false,execution:'failed',pendingModel:null,pendingThinkingLevel:null,modelBusy:false,activities:this.state.activities.map(i=>i.status==='complete'||i.status==='failed'?i:{...i,status:'interrupted'})};this.publish();return;
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
    if (event.kind === "tool_finished") { void this.review.finishTool(event.toolCallId, event.failed); return; }
    if (event.kind === "agent_settled" && this.state.chatBusy) {
      this.review.endTask();
      if (this.lastSubmission) {
        this.lastSubmission.outcome = this.stoppingTask ? "interrupted" : "settled";
        for (const record of this.history.filter(item => item.submissionId === this.lastSubmission?.submissionId)) record.outcome = this.lastSubmission.outcome;
        this.publishAttachments();
      }
      if (this.awaitingAck) return;
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
    void this.applyPendingSettings();
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
      runtime: "not-started", runtimeDetail: null, ...this.emptyModelFields(),
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
        chatModel: result.modelLabel,
        messages: [],
        thinkingLevel: null,
        thinkingLevels: [],
        availableModels: [],
        modelBusy: true,
        modelError: null,
      };
      void this.syncModelCatalog();
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
    if (this.view && !this.disposed) this.post(this.view, { ...this.attachmentEnvelope("sessionState"), ...this.sessionProjection });
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
    let preparationRevision: number | undefined;
    if (this.preparation !== "idle") { this.attachmentToken = {}; this.preparation = "idle"; this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1); preparationRevision = this.draftRevision; this.attachmentResult = "preparation-cancelled"; this.publishAttachments(); }
    if (!this.state.chatBusy && !this.awaitingAck) { this.publish(); return { ok: true, preparationRevision }; }
    const session = this.runtimeSession; const generation = this.state.generation;
    this.stoppingTask = true; this.state = { ...this.state, execution: "stopping" }; this.toolApprovals.cancel(); this.publish();
    const operation = (async () => {
      const result = await this.runtime.abortTask?.().catch(() => ({ ok: false as const, detail: "Could not stop task." }));
      if (session !== this.runtimeSession || generation !== this.state.generation || this.disposed) return { ok: false, preparationRevision };
      this.stoppingTask = false;
      if (result?.ok) { this.state = { ...this.state, execution: "idle", chatBusy: false }; if (!this.sessionTransitionBusy()) void this.applyPendingSettings(); }
      else { this.toolApprovals.cancel(true); this.state = { ...this.state, runtime: "error", execution: "failed", chatBusy: false, chatError: result?.detail ?? "Stop is unavailable.", pendingModel: null, pendingThinkingLevel: null }; }
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
    let generation = this.state.generation; const folder = this.state.folder?.path; const choice = this.state.choice; let revision = this.draftRevision;
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
      if (answer !== button || revision !== this.draftRevision) { fail("cancelled"); return; }
      this.sessionProjection = { ...this.sessionProjection, phase: "switching", error: null }; this.publishSessions();
      const stopped = await this.stopCurrentTask();
      if (!stopped.ok) { if (current()) fail("stop-failed"); return; }
      if (!current()) return;
      if (stopped.preparationRevision !== undefined) {
        if (this.draftRevision !== stopped.preparationRevision) { fail("cancelled"); return; }
        revision = stopped.preparationRevision;
      }
      let resume: SavedSession | undefined; let history: SavedHistoryPage | undefined; let anchor: string | null = null;
      if (selected) {
        const backend = this.beginSessionBackendOperation();
        try {
          await backend.previous;
          await this.savedHistory.cancel();
          if (!current()) return;
          if (revision !== this.draftRevision) { fail("cancelled"); return; }
          const result = await this.sessionBackend.inspect(folder, selected.id, operation.signal);
          if (!current()) return;
          if (!result.ok) { fail(result.code); return; }
          if (result.session.id !== selected.id) { fail("stale"); return; }
          if (!result.anchor && (result.history.total > 0 || result.history.messages.length > 0)) { fail("restore-failed"); return; }
          resume = result.session; history = result.history; anchor = result.anchor;
        } finally { backend.settle(); }
      }
      if (revision !== this.draftRevision) { fail("cancelled"); return; }
      if (this.state.generation >= Number.MAX_SAFE_INTEGER) { fail("unavailable"); return; }
      committed = true; this.sessionCommit = operation; this.clearChat(true); this.draftText = ""; this.sessionCatalog.clear();
      this.state = { ...this.state, generation: this.state.generation + 1 }; generation = this.state.generation;
      this.sessionProjection = { phase: "switching", current: null, loaded: false, entries: [], page: 0, total: 0, error: null };
      this.publishSessions(); this.publishAttachments(); this.publish();
      await this.reconcileRuntime(resume); if (!current()) return;
      if (this.state.runtime !== "ready" || (resume && this.sessionProjection.current?.id !== resume.id)) { fail("restore-failed"); return; }
      this.sessionProjection = { ...this.sessionProjection, phase: "idle", error: null };
      if (resume && history) this.savedHistory.restore(resume.id, anchor, history);
    } catch { if (current()) fail("unavailable"); }
    finally { if (this.sessionOperation === operation) { if (this.sessionCommit === operation) this.sessionCommit = undefined; if (!committed && (this.sessionProjection.phase === "confirming" || this.sessionProjection.phase === "switching")) fail("cancelled"); this.sessionOperation = undefined; this.publishSessions(); } }
  }

  private attachmentEnvelope<T extends string>(type: T) { return { version: 2 as const, type, generation: this.state.generation, viewId: this.state.viewId }; }

  private publishAttachments(): void {
    if (!this.view || this.disposed) return;
    this.post(this.view, { ...this.attachmentEnvelope("attachmentState"),
      draft: { revision: this.draftRevision, text: this.draftText, acceptedEditSequence: this.acceptedEditSequence,
        attachments: this.attachments.map(a => ({ attachmentId: a.attachmentId, snapshotId: a.snapshotId, relativePath: a.source.relativePath, ...attachmentDetails(a), utf8Bytes: a.source.utf8Bytes, unsaved: a.source.unsaved, state: a.state })) },
      preparation: this.preparation, result: this.attachmentResult ? { code: this.attachmentResult } : null,
      historyCount: this.history.length, retainedBytes: this.retainedBytes, lastSubmission: this.lastSubmission } satisfies AttachmentStateMessage);
  }

  private checkAttachmentBounds(attachments: DraftAttachment[]): void {
    if (attachments.length > 20) throw new AttachmentFailure("attachment-limit");
    if (attachments.reduce((bytes, a) => bytes + a.source.utf8Bytes, 0) > 1048576) throw new AttachmentFailure("total-too-large");
  }

  private async addAttachment(view: vscode.WebviewView, kind: "file" | "selection" = "file"): Promise<void> {
    if (this.attachments.length >= 20) { this.attachmentResult = "attachment-limit"; this.publishAttachments(); return; }
    if (this.preparation !== "idle") { this.attachmentResult = "busy"; this.publishAttachments(); return; }
    if (!this.attachmentEligible()) { this.attachmentResult = "ineligible"; this.publishAttachments(); return; }
    const token = this.attachmentToken = {}; const revision = this.draftRevision;
    const generation = this.state.generation; const session = this.runtimeSession;
    const current = () => { this.refresh(); return !this.disposed && this.view === view && token === this.attachmentToken && revision === this.draftRevision && generation === this.state.generation && session === this.runtimeSession && this.attachmentEligible(); };
    this.preparation = kind === "file" ? "picking" : "preparing"; this.attachmentResult = null; this.publishAttachments();
    try {
      const added: DraftAttachment[] = [];
      if (kind === "selection") {
        const { source, originalRange } = await captureSelection(this.api.workspace, this.state.folder!.path, this.api.window.activeTextEditor, current);
        if (!current()) return;
        added.push({ attachmentId: opaqueId(), snapshotId: opaqueId(), kind, originalRange, stale: false, authorized: source, source, state: "attached" });
      } else {
        const selected = await this.api.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: true, defaultUri: this.api.workspace.workspaceFolders?.[0]?.uri, openLabel: "Attach nonsecret text files" });
        if (!current()) return;
        if (!selected?.length) throw new AttachmentFailure("cancelled");
        if (this.attachments.length + selected.length > 20) throw new AttachmentFailure("attachment-limit");
        this.preparation = "preparing"; this.publishAttachments();
        for (const uri of selected) {
          const source = await captureFile(this.api.workspace, this.state.folder!.path, uri, current);
          if (!current()) return;
          added.push({ attachmentId: opaqueId(), snapshotId: opaqueId(), kind, source, state: "attached" });
          this.checkAttachmentBounds([...this.attachments, ...added]);
        }
      }
      for (const a of added) {
        if (a.kind === "file") await revalidateFile(a.source, this.api.workspace, this.state.folder!.path, current);
        else {
          const actual = await selectionSourceRevision(a.source, this.api.workspace, this.state.folder!.path, current);
          if (!sameSelectionSource(actual, a.authorized)) throw new AttachmentFailure("source-changed");
        }
        if (!current()) return;
      }
      for (const a of added) {
        if (a.kind === "file") validateEditorSnapshot(a.source, this.api.workspace);
        else validateSelectionDocument(a.source, this.api.workspace, a.authorized);
      }
      const next = [...this.attachments, ...added]; this.checkAttachmentBounds(next);
      if (!current()) return;
      this.attachments = next;
      this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1);
    } catch (error) { if (token === this.attachmentToken) this.attachmentResult = error instanceof AttachmentFailure ? error.code : "unavailable"; }
    finally { if (token === this.attachmentToken) { this.preparation = "idle"; this.publishAttachments(); } }
  }

  private attachmentEligible(): boolean { return !this.sessionTransitionBusy() && this.state.status === "eligible" && this.state.runtime === "ready" && !this.state.busy && !this.state.chatBusy && !this.state.modelBusy && !this.stoppingTask && !this.awaitingAck; }

  private async confirmAttachment(view: vscode.WebviewView, attachmentId: string, snapshotId: string, kind: "file" | "selection"): Promise<void> {
    const a = this.attachments.find(item => item.attachmentId === attachmentId);
    if (!a || a.kind !== kind || a.attachmentId !== attachmentId || a.snapshotId !== snapshotId || a.state !== "confirmation-required") {
      this.attachmentResult = "stale"; this.publishAttachments(); return;
    }
    if (!this.attachmentEligible() || this.preparation !== "idle") { this.attachmentResult = "busy"; this.publishAttachments(); return; }
    const token = this.attachmentToken = {}; const revision = this.draftRevision;
    const generation = this.state.generation; const session = this.runtimeSession;
    const current = () => { this.refresh(); return !this.disposed && this.view === view && token === this.attachmentToken && revision === this.draftRevision && generation === this.state.generation && session === this.runtimeSession && this.attachmentEligible(); };
    this.preparation = "preparing"; this.attachmentResult = null; this.publishAttachments();
    try {
      if (a.kind === "selection") {
        const observed = a.observed;
        if (!observed) throw new AttachmentFailure("stale");
        const actual = await selectionSourceRevision(a.source, this.api.workspace, this.state.folder!.path, current);
        if (!current()) return;
        if (!sameSelectionSource(actual, observed) || a.state !== "confirmation-required") throw new AttachmentFailure("source-changed");
        validateSelectionDocument(a.source, this.api.workspace, actual);
        a.authorized = actual; a.observed = undefined;
      } else {
        await revalidateFile(a.source, this.api.workspace, this.state.folder!.path, current);
        if (!current()) return;
        validateEditorSnapshot(a.source, this.api.workspace);
      }
      a.state = "attached"; this.attachmentResult = null;
      this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1);
    } catch (error) {
      if (token === this.attachmentToken) {
        this.attachmentResult = error instanceof AttachmentFailure ? error.code : "unavailable";
        a.state = this.attachmentResult === "unavailable" ? "unavailable" : "changed";
      }
    } finally { if (token === this.attachmentToken) { this.preparation = "idle"; this.publishAttachments(); } }
  }

  private async submitDraft(view: vscode.WebviewView): Promise<void> {
    if (!this.attachmentEligible() || this.preparation !== "idle" || !this.draftText.trim()) { this.attachmentResult = "busy"; this.publishAttachments(); return; }
    const token = this.attachmentToken = {}; const revision = this.draftRevision;
    const generation = this.state.generation; const session = this.runtimeSession;
    const current = () => { this.refresh(); return !this.disposed && this.view === view && token === this.attachmentToken && revision === this.draftRevision && generation === this.state.generation && session === this.runtimeSession && this.attachmentEligible(); };
    let checking: DraftAttachment | undefined;
    this.preparation = "preparing"; this.attachmentResult = null; this.publishAttachments();
    try {
      const candidates: DraftAttachment[] = [];
      const selectionRevisions = new Map<string, SelectionSourceRevision>();
      for (const a of this.attachments) {
        checking = a;
        if (a.kind === "file") {
          if (a.source.document.isClosed || !this.api.workspace.textDocuments.includes(a.source.document)) throw new AttachmentFailure("unavailable");
          const latest = await captureFile(this.api.workspace, this.state.folder!.path, a.source.uri, current);
          if (!current()) return;
          if (latest.root !== a.source.root || latest.target !== a.source.target || latest.document !== a.source.document) throw new AttachmentFailure("unavailable");
          const changed = latest.identity !== a.source.identity || latest.version !== a.source.version || latest.unsaved !== a.source.unsaved || latest.text !== a.source.text;
          candidates.push(changed || a.state !== "attached" ? { ...a, source: latest, snapshotId: opaqueId(), state: "confirmation-required" } : a);
        } else {
          const actual = await selectionSourceRevision(a.source, this.api.workspace, this.state.folder!.path, current);
          if (!current()) return;
          selectionRevisions.set(a.attachmentId, actual);
          candidates.push(!sameSelectionSource(actual, a.authorized) || a.state !== "attached"
            ? { ...a, observed: actual, stale: true, state: "confirmation-required" } : a);
        }
      }
      if (!current()) return;
      // Later captures may outlive an earlier source: recheck the complete set.
      for (const a of candidates) {
        checking = this.attachments.find(item => item.attachmentId === a.attachmentId);
        if (a.kind === "file") await revalidateFile(a.source, this.api.workspace, this.state.folder!.path, current);
        else {
          const actual = await selectionSourceRevision(a.source, this.api.workspace, this.state.folder!.path, current);
          if (!sameSelectionSource(actual, selectionRevisions.get(a.attachmentId)!)) throw new AttachmentFailure("source-changed");
        }
        if (!current()) return;
      }
      // No await after this document-version barrier before atomic admission.
      for (const a of candidates) {
        checking = this.attachments.find(item => item.attachmentId === a.attachmentId);
        if (a.kind === "file") validateEditorSnapshot(a.source, this.api.workspace);
        else validateSelectionDocument(a.source, this.api.workspace, selectionRevisions.get(a.attachmentId)!);
      }
      checking = undefined;
      this.checkAttachmentBounds(candidates);
      if (candidates.some(a => a.state !== "attached")) {
        this.attachments = candidates;
        this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1);
        this.attachmentResult = "source-changed"; return;
      }
      const body = this.draftText;
      const input = candidates.length ? { kind: "enriched" as const, body, attachments: candidates.map(a => ({ path: a.source.relativePath, ...attachmentDetails(a), unsaved: a.source.unsaved, text: a.source.text })) } : { kind: "plain" as const, body };
      const prepared = this.runtime.preparePrompt(input, session);
      if (!current()) return;
      const submissionId = opaqueId();
      const records: Submission[] = candidates.map(a => ({ submissionId, snapshotId: a.snapshotId, relativePath: a.source.relativePath, ...attachmentDetails(a), utf8Bytes: a.source.utf8Bytes, unsaved: a.source.unsaved, text: a.source.text, body, draftRevision: revision, delivery: "host-accepted", outcome: "pending" }));
      let charge = records.length ? Buffer.byteLength(body, "utf8") : 0;
      for (const record of records) {
        const metadata = { submissionId: record.submissionId, snapshotId: record.snapshotId, relativePath: record.relativePath, ...attachmentDetails(record), utf8Bytes: record.utf8Bytes, unsaved: record.unsaved };
        const metadataBytes = Buffer.byteLength(JSON.stringify(metadata), "utf8");
        if (metadataBytes > 2048) throw new AttachmentFailure("metadata-too-large");
        charge += record.utf8Bytes + metadataBytes;
      }
      if (records.length && (this.history.length + records.length > 128 || this.retainedBytes + charge > 8388608)) throw new AttachmentFailure("history-full");
      this.history.push(...records); this.retainedBytes += charge;
      this.lastSubmission = { submissionId, draftRevision: revision, delivery: "host-accepted", outcome: "pending" };
      this.draftText = ""; this.attachments = []; this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1); this.preparation = "idle"; this.awaitingAck = true;
      this.state = { ...this.state, messages: [...this.state.messages, { role: "user" as const, text: body.trim() }].slice(-32), chatBusy: true, execution: "waiting", chatError: null };
      const updateDelivery = (delivery: string) => { for (const record of records) record.delivery = delivery; if (this.lastSubmission?.submissionId === submissionId) this.lastSubmission.delivery = delivery; this.publishAttachments(); };
      const waiting = prepared.send(() => { if (this.state.folder) this.review.beginTask(this.state.folder.path, submissionId); updateDelivery("write-attempted"); });
      this.publish(); this.publishAttachments();
      const result = await waiting;
      if (this.disposed || generation !== this.state.generation || session !== this.runtimeSession || this.state.runtime !== "ready") return;
      this.awaitingAck = false; updateDelivery(result.delivery);
      if (result.code) this.attachmentResult = result.code;
      if (result.delivery !== "rpc-accepted") {
        for (const record of records) if (record.outcome === "pending") record.outcome = "failed";
        if (this.lastSubmission?.outcome === "pending") this.lastSubmission.outcome = "failed";
        const chatError = result.delivery === "rpc-rejected"
          ? "Runtime rejected the prompt. Check model/provider configuration before deliberately sending again; no retry was made."
          : "Prompt delivery was not confirmed. Inspect delivery status and restart the runtime before retrying; no retry was made.";
        this.review.endTask();
        this.state = { ...this.state, chatBusy: false, execution: "failed", chatError, pendingModel: null, pendingThinkingLevel: null };
      } else if (this.lastSubmission && ["settled", "interrupted"].includes(this.lastSubmission.outcome)) { this.finishSettledTask(); }
      this.publish(); this.publishAttachments();
    } catch (error) {
      if (token === this.attachmentToken) {
        this.attachmentResult = error instanceof AttachmentFailure ? error.code : "frame-too-large";
        if (checking && ["source-changed", "unavailable"].includes(this.attachmentResult)) checking.state = this.attachmentResult === "unavailable" ? "unavailable" : "changed";
      }
    } finally { if (token === this.attachmentToken) { this.preparation = "idle"; this.publishAttachments(); } }
  }

  private historyMetadata(record: Submission): AttachmentHistoryEntry {
    return { submissionId: record.submissionId, snapshotId: record.snapshotId, relativePath: record.relativePath, ...attachmentDetails(record), utf8Bytes: record.utf8Bytes, unsaved: record.unsaved, delivery: record.delivery, outcome: record.outcome };
  }

  private publishReview(): void {
    if (this.view) this.post(this.view, { ...this.attachmentEnvelope("changeReviewState"), ...this.review.snapshot() });
  }

  private publish(): void {
    if (this.view && !this.disposed) this.post(this.view, { ...this.state });
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
    this.view = undefined; this.previewOperation = undefined;
    this.attachmentToken = {}; this.preparation = "idle";
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
    this.state = { ...this.state, viewId: opaqueId() }; this.acceptedEditSequence = 0;
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
    if (message.type === "ping") { this.post(view, this.attachmentEnvelope("pong")); return; }
    if (message.type === "getWorkspaceState") { this.publishAttachments(); this.publishReview(); this.publishSessions(); this.savedHistory.publish(); this.publish(); return; }
    if (message.generation !== this.state.generation || message.viewId !== this.state.viewId || this.state.busy) { this.attachmentResult = "stale"; this.publishAttachments(); this.publish(); return; }
    if ("draftRevision" in message && (this.draftRevision === Number.MAX_SAFE_INTEGER || message.draftRevision !== this.draftRevision)) { this.attachmentResult = "stale"; this.publishAttachments(); return; }
    if (message.type === "getSavedHistory") { await this.savedHistory.page(message.page); return; }
    if (message.type === "getSavedHistoryPreview") { await this.savedHistory.preview(message.id, message.requestId, message.offset); return; }
    if (message.type === "getChangeReview") { this.publishReview(); return; }
    if (message.type === "openReviewDiff" || message.type === "openReviewSource") {
      const generation = this.state.generation; const session = this.runtimeSession;
      await this.review.open(message.id, message.type === "openReviewDiff" ? "diff" : "source", () => !this.disposed && this.view === view && generation === this.state.generation && session === this.runtimeSession); return;
    }
    if (message.type === "updateDraft") {
      if (message.editSequence <= this.acceptedEditSequence || this.draftRevision >= Number.MAX_SAFE_INTEGER) { this.attachmentResult = "stale"; this.publishAttachments(); return; }
      this.attachmentToken = {}; this.preparation = "idle"; this.draftText = message.text; this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1); this.acceptedEditSequence = message.editSequence; this.attachmentResult = null; this.publishAttachments(); return;
    }
    if (message.type === "confirmSelectionAttachment") { await this.confirmAttachment(view, message.attachmentId, message.snapshotId, "selection"); return; }
    if (message.type === "confirmFileAttachment") { await this.confirmAttachment(view, message.attachmentId, message.snapshotId, "file"); return; }
    if (message.type === "addSelectionAttachment") { await this.addAttachment(view, "selection"); return; }
    if (message.type === "addFileAttachment") { await this.addAttachment(view); return; }
    if (message.type === "removeAttachment") {
      if (!this.attachments.some(a => a.attachmentId === message.attachmentId)) this.attachmentResult = "stale";
      else { this.attachmentToken = {}; this.preparation = "idle"; this.attachments = this.attachments.filter(a => a.attachmentId !== message.attachmentId); this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1); this.attachmentResult = null; }
      this.publishAttachments(); return;
    }
    if (message.type === "getAttachmentHistory") { this.post(view, { ...this.attachmentEnvelope("attachmentHistory"), entries: this.history.map(record => this.historyMetadata(record)) }); return; }
    if (message.type === "getAttachmentPreview") {
      if (this.previewOperation) { this.post(view, { ...this.attachmentEnvelope("attachmentPreview"), requestId: message.requestId, code: "busy" }); return; }
      const snapshot = this.attachments.find(a => a.snapshotId === message.snapshotId)?.source ?? this.history.find(record => record.snapshotId === message.snapshotId);
      const text = snapshot?.text; const offset = message.offset;
      if (text === undefined || offset > text.length || (offset > 0 && /[\uDC00-\uDFFF]/.test(text[offset] ?? "") && /[\uD800-\uDBFF]/.test(text[offset - 1]))) {
        this.post(view, { ...this.attachmentEnvelope("attachmentPreview"), requestId: message.requestId, code: "stale" }); return;
      }
      let end = Math.min(text.length, offset + 16384);
      if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1]) && /[\uDC00-\uDFFF]/.test(text[end])) end--;
      const response = { ...this.attachmentEnvelope("attachmentPreview"), requestId: message.requestId, snapshotId: message.snapshotId, offset, nextOffset: end, done: end === text.length, text: text.slice(offset, end) };
      if (Buffer.byteLength(JSON.stringify(response), "utf8") <= 131072) {
        const operation = {}; this.previewOperation = operation;
        try { await view.webview.postMessage(response); } catch { /* View teardown; never log text. */ }
        finally { if (this.previewOperation === operation) this.previewOperation = undefined; }
      }
      return;
    }
    if (message.type === "sendChat") { await this.submitDraft(view); return; }
    if (message.type === 'decideApproval') {this.toolApprovals.decide(message.id,message.decision);return;}
    if (message.type === 'revokeGrant') {this.toolApprovals.revoke(message.id);return;}
    if (message.type === "getSavedSessions") { await this.listSavedSessions(message.page); return; }
    if (message.type === "newConversation" || message.type === "resumeConversation") { await this.changeConversation(view, message.type === "resumeConversation" ? message.id : undefined); return; }
    if (message.type === "stopChat") { await this.stopCurrentTask(); return; }
    if (message.type === "chooseResources") {
      if (this.state.status === "eligible") {
        this.clearChat();
        this.state = { ...this.state, choice: message.choice, error: null };
        this.publishAttachments();
        void this.reconcileRuntime();
      }
      this.publish();
      return;
    }
    if (message.type === "setThinkingLevel" || message.type === "setChatModel") {
      if (!this.canChangeModelSettings()) {
        this.publish();
        return;
      }
      if (message.type === "setThinkingLevel" && !this.state.thinkingLevels.includes(message.level)) {
        this.publish();
        return;
      }
      if (message.type === "setChatModel" && !findCatalogEntry(this.state.availableModels, message.provider, message.modelId)) {
        this.publish();
        return;
      }
      this.state = message.type === "setThinkingLevel"
        ? { ...this.state, pendingThinkingLevel: message.level, modelError: null }
        : { ...this.state, pendingModel: findCatalogEntry(this.state.availableModels, message.provider, message.modelId) ?? null, modelError: null };
      void this.applyPendingSettings();
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
    this.clearChat(); this.review.dispose(); this.draftText = "";
    void this.runtime.stop();
    this.clearView();
    for (const subscription of this.subscriptions) subscription.dispose();
  }
}
