import { SavedHistoryClient } from "./saved-history-client.js";
import { attachmentError, availability, ATTACHMENT_HISTORY_PAGE_SIZE, CHANGE_REVIEW_PAGE_SIZE, SESSION_PAGE_SIZE, type ClientSnapshot, type Intent } from "./client-state.js";
import type { WebviewBridge } from "./bridge.js";
import { parseHostMessage } from "./parse-host-message.js";

function sessionActionsBlocked(snapshot: ClientSnapshot): boolean {
  const phase = snapshot.sessions?.phase;
  return phase === "listing" || phase === "confirming" || phase === "switching";
}

function blockedDuringSessionSwitch(intent: Intent): boolean {
  switch (intent.type) {
    case "getSavedSessions":
    case "newConversation":
    case "resumeConversation":
    case "getSavedHistory":
    case "getSavedHistoryPreview":
    case "sendChat":
    case "addFileAttachment":
    case "addSelectionAttachment":
    case "removeAttachment":
    case "confirmFileAttachment":
    case "confirmSelectionAttachment":
    case "setThinkingLevel":
    case "setChatModel":
      return true;
    default:
      return false;
  }
}

/** Owns view-local reconciliation only. The host decides all business transitions. */
export class WebviewClient {
  private listeners = new Set<() => void>();
  private unsubscribe: (() => void) | undefined;
  private identity: { generation: number; viewId: string } | undefined;
  private sequence = 0;
  private pending: number | null = null;
  private submitted: { revision: number; sequence: number; text: string } | null = null;
  private previewCounter = 0;
  private disposed = false;
  readonly savedHistory = new SavedHistoryClient(
    () => {
      const { workspace, error } = this.snapshot;
      return !this.disposed && !error && !!workspace && workspace.status === "eligible" && workspace.choice !== null
        && !workspace.busy && !availability(this.snapshot).sessionTransitioning;
    },
    intent => this.action(intent), snapshot => this.update(snapshot), error => this.update({ error }),
  );
  private snapshot: ClientSnapshot = { workspace: null, attachments: null, sessions: null, text: "", synchronizing: true, submitting: false,
    ...this.savedHistory.snapshot,
    changeReview: null, changeReviewOpen: false, changeReviewPage: 0, stopRequested: false, history: [], historyOpen: false, historyPage: 0, preview: null, error: null };
  constructor(private readonly bridge: WebviewBridge) {}
  getSnapshot = (): ClientSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  start(): void {
    if (this.unsubscribe || this.disposed) return;
    try {
      this.unsubscribe = this.bridge.subscribe(value => this.receive(value));
      this.bridge.postMessage({ version: 2, type: "ping" });
      this.bridge.postMessage({ version: 2, type: "getWorkspaceState" });
    } catch { this.update({ error: "Could not connect to the extension host. Reopen the view to retry." }); }
  }
  dispose(): void { this.disposed = true; this.unsubscribe?.(); this.unsubscribe = undefined; this.listeners.clear(); }
  private update(patch: Partial<ClientSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }
  action = (intent: Intent): void => {
    if (!this.identity || this.disposed || this.snapshot.error || (availability(this.snapshot).sessionTransitioning && blockedDuringSessionSwitch(intent))) return;
    try { this.bridge.postMessage({ version: 2, ...this.identity, ...intent }); }
    catch { this.pending = null; this.update({ error: "Connection to the extension host was lost. Reopen the view; no automatic retry was made." }); }
  };
  private syncDraft(): void {
    const d = this.snapshot.attachments?.draft;
    const blocked = !d || !!this.snapshot.workspace?.busy || !!this.snapshot.error || this.pending !== null || this.sequence >= Number.MAX_SAFE_INTEGER || d.revision >= Number.MAX_SAFE_INTEGER || this.snapshot.text.length > 8000;
    if (!blocked && d && this.snapshot.text !== d.text) {
      this.pending = ++this.sequence;
      this.update({ synchronizing: true });
      this.action({ type: "updateDraft", draftRevision: d.revision, editSequence: this.pending, text: this.snapshot.text });
    }
    const current = this.snapshot.attachments?.draft;
    this.update({ synchronizing: !current || this.pending !== null || this.snapshot.text !== current.text || this.sequence >= Number.MAX_SAFE_INTEGER || current.revision >= Number.MAX_SAFE_INTEGER });
  }
  edit = (text: string): void => { this.update({ text }); this.syncDraft(); };
  submit = (): void => {
    const d = this.snapshot.attachments?.draft;
    if (!d || availability(this.snapshot).sendDisabled) return;
    this.submitted = { revision: d.revision, sequence: this.sequence, text: this.snapshot.text };
    this.update({ submitting: true });
    this.action({ type: "sendChat", draftRevision: d.revision });
  };
  stop = (): void => {
    const a = availability(this.snapshot);
    if (!a.showStop || a.stopping) return;
    this.update({ stopRequested: true }); this.action({ type: "stopChat" });
  };
  addAttachment = (): void => {
    const d = this.snapshot.attachments?.draft;
    if (!d || d.attachments.length >= 20 || availability(this.snapshot).attachmentDisabled) return;
    this.action({ type: "addFileAttachment", draftRevision: d.revision });
  };
  addSelection = (): void => {
    const d = this.snapshot.attachments?.draft;
    if (!d || d.attachments.length >= 20 || availability(this.snapshot).attachmentDisabled) return;
    this.action({ type: "addSelectionAttachment", draftRevision: d.revision });
  };
  confirmAttachment = (attachmentId: string): void => {
    const d = this.snapshot.attachments?.draft; const a = d?.attachments.find(item => item.attachmentId === attachmentId);
    if (!d || !a || a.state !== "confirmation-required" || availability(this.snapshot).attachmentDisabled) return;
    this.action({ type: a.kind === "selection" ? "confirmSelectionAttachment" : "confirmFileAttachment", draftRevision: d.revision, attachmentId: a.attachmentId, snapshotId: a.snapshotId });
  };
  removeAttachment = (attachmentId: string): void => {
    const d = this.snapshot.attachments?.draft; const a = d?.attachments.find(item => item.attachmentId === attachmentId);
    if (!d || !a || availability(this.snapshot).attachmentDisabled) return;
    if (this.snapshot.preview?.snapshotId === a.snapshotId) this.closePreview();
    this.action({ type: "removeAttachment", draftRevision: d.revision, attachmentId: a.attachmentId });
  };
  openSessions = (): void => {
    if (!this.snapshot.sessions?.loaded) this.getSavedSessions(0);
  };
  getSavedSessions = (page: number): void => {
    if (!Number.isSafeInteger(page) || page < 0 || sessionActionsBlocked(this.snapshot)) return;
    this.action({ type: "getSavedSessions", page });
  };
  navigateSessions = (page: number): void => {
    const sessions = this.snapshot.sessions;
    const last = Math.max(0, Math.ceil((sessions?.total ?? 0) / SESSION_PAGE_SIZE) - 1);
    if (!sessions?.loaded || sessionActionsBlocked(this.snapshot) || !Number.isSafeInteger(page) || page < 0 || page > last || page === sessions.page) return;
    this.getSavedSessions(page);
  };
  newConversation = (): void => {
    if (sessionActionsBlocked(this.snapshot)) return;
    this.action({ type: "newConversation" });
  };
  resumeConversation = (id: string): void => {
    const sessions = this.snapshot.sessions;
    if (!sessions || !sessions.loaded || sessions.error === "stale" || sessionActionsBlocked(this.snapshot) || !sessions.entries.some(entry => entry.id === id)) return;
    this.action({ type: "resumeConversation", id });
  };
  toggleHistory = (): void => {
    const open = !this.snapshot.historyOpen;
    this.update({ historyOpen: open, ...(open ? { historyPage: null } : this.historyPreviewReset()) });
    if (open) this.action({ type: "getAttachmentHistory" });
  };
  navigateHistory = (page: number): void => {
    const last = Math.max(0, Math.ceil(this.snapshot.history.length / ATTACHMENT_HISTORY_PAGE_SIZE) - 1);
    if (!this.snapshot.historyOpen || this.snapshot.historyPage === null || !Number.isSafeInteger(page) || page < 0 || page > last || page === this.snapshot.historyPage) return;
    this.update({ historyPage: page, ...this.historyPreviewReset() });
  };
  toggleChangeReview = (): void => {
    const open = !this.snapshot.changeReviewOpen;
    this.update({ changeReviewOpen: open });
    if (open) this.action({ type: "getChangeReview" });
  };
  navigateChangeReview = (page: number): void => {
    const count = this.snapshot.changeReview?.entries.length ?? 0;
    const last = Math.max(0, Math.ceil(count / CHANGE_REVIEW_PAGE_SIZE) - 1);
    if (!this.snapshot.changeReviewOpen || !Number.isSafeInteger(page) || page < 0 || page > last || page === this.snapshot.changeReviewPage) return;
    this.update({ changeReviewPage: page });
  };
  openReviewDiff = (id: string): void => {
    const entry = this.snapshot.changeReview?.entries.find(item => item.id === id);
    if (!entry || (entry.diff !== "ready" && entry.diff !== "unchanged")) return;
    this.action({ type: "openReviewDiff", id });
  };
  openReviewSource = (id: string): void => {
    const entry = this.snapshot.changeReview?.entries.find(item => item.id === id);
    if (!entry || entry.path === null) return;
    this.action({ type: "openReviewSource", id });
  };
  private historyPreviewReset(): Partial<ClientSnapshot> {
    const id = this.snapshot.preview?.snapshotId;
    return id && this.snapshot.history.some(entry => entry.snapshotId === id) ? { preview: null } : {};
  }
  requestPreview = (snapshotId: string): void => {
    if (this.previewCounter >= Number.MAX_SAFE_INTEGER) { this.update({ error: "Preview identifiers exhausted. Reopen the view." }); return; }
    const requestId = `preview-${++this.previewCounter}`;
    this.update({ preview: { snapshotId, requestId, offset: 0, text: "", error: null } });
    this.action({ type: "getAttachmentPreview", snapshotId, requestId, offset: 0 });
  };
  closePreview = (): void => this.update({ preview: null });
  private receive(value: unknown): void {
    if (this.disposed) return;
    const message = parseHostMessage(value);
    if (!message || (this.identity && (message.viewId !== this.identity.viewId || message.generation < this.identity.generation))) return;
    if (this.identity && message.generation > this.identity.generation) {
      // Only new-generation switching commits the host's confirmed draft loss.
      // Old-generation switching may still fail Stop/inspection; unrelated generations retain local text.
      const committedHandoff = message.type === "sessionState" && message.phase === "switching";
      this.pending = null; this.submitted = null;
      this.update({ workspace: null, attachments: null, sessions: null, ...this.savedHistory.reset(),
        changeReview: null, changeReviewPage: 0, synchronizing: true, submitting: false, stopRequested: false, history: [], historyOpen: false, preview: null,
        ...(committedHandoff ? { text: "" } : {}) });
    }
    this.identity = { generation: message.generation, viewId: message.viewId };
    if (message.type === "pong") return;
    if (message.type === "sessionState") {
      // The host cancels retained-history reads before its native modal and suppresses their replies.
      const cancelsHistoryRead = message.phase === "confirming" || message.phase === "switching";
      this.update({ sessions: message, ...(cancelsHistoryRead ? this.savedHistory.invalidatePreview() : {}) });
      return;
    }
    if (message.type === "savedHistoryState" || message.type === "savedHistoryPreview") {
      this.savedHistory.receive(message);
      return;
    }
    if (message.type === "workspaceState") {
      const settled = !message.chatBusy && message.execution !== "stopping";
      this.update({ workspace: message, stopRequested: settled ? false : this.snapshot.stopRequested });
      this.syncDraft(); return;
    }
    if (message.type === "attachmentState") {
      const old = this.snapshot.attachments;
      if (old && message.draft.revision < old.draft.revision) return;
      let text = this.snapshot.text;
      if (!old && !text) text = message.draft.text;
      if (this.submitted && message.lastSubmission?.draftRevision === this.submitted.revision) {
        if (text === this.submitted.text && this.sequence === this.submitted.sequence) text = "";
        this.submitted = null;
      } else if (message.preparation === "idle" && (message.result || (this.submitted && message.draft.revision > this.submitted.revision))) this.submitted = null;
      if (this.pending !== null && (message.draft.acceptedEditSequence >= this.pending || message.result?.code === "stale")) this.pending = null;
      this.sequence = Math.max(this.sequence, message.draft.acceptedEditSequence);
      const lost = message.result?.code === "runtime-lost";
      const previewId = this.snapshot.preview?.snapshotId;
      const replacedPreview = !!previewId && !!old?.draft.attachments.some(a => a.snapshotId === previewId) && !message.draft.attachments.some(a => a.snapshotId === previewId);
      this.update({ attachments: message, text, submitting: this.submitted !== null,
        ...(lost ? { history: [], historyPage: 0, preview: null } : replacedPreview ? { preview: null } : {}),
        ...(message.preparation === "idle" && !this.snapshot.workspace?.chatBusy ? { stopRequested: false } : {}),
      });
      this.syncDraft();
      if (this.snapshot.historyOpen) this.action({ type: "getAttachmentHistory" });
      return;
    }
    if (message.type === "attachmentHistory") {
      if (this.snapshot.historyOpen) {
        const last = Math.max(0, Math.ceil(message.entries.length / ATTACHMENT_HISTORY_PAGE_SIZE) - 1);
        this.update({ history: message.entries, historyPage: this.snapshot.historyPage === null ? last : Math.min(this.snapshot.historyPage, last) });
      }
      return;
    }
    if (message.type === "changeReviewState") {
      const last = Math.max(0, Math.ceil(message.entries.length / CHANGE_REVIEW_PAGE_SIZE) - 1);
      this.update({ changeReview: message, changeReviewPage: Math.min(this.snapshot.changeReviewPage, last) });
      return;
    }
    const preview = this.snapshot.preview;
    if (!preview || preview.requestId !== message.requestId) return;
    if ("code" in message) { this.update({ preview: { ...preview, error: attachmentError(message.code) } }); return; }
    if (message.snapshotId !== preview.snapshotId || message.offset !== preview.offset || message.nextOffset !== message.offset + message.text.length
      || (!message.done && message.nextOffset <= message.offset) || preview.text.length + message.text.length > 262144) return;
    this.update({ preview: { ...preview, offset: message.nextOffset, text: preview.text + message.text } });
    if (!message.done) this.action({ type: "getAttachmentPreview", requestId: preview.requestId, snapshotId: preview.snapshotId, offset: message.nextOffset });
  }
}
