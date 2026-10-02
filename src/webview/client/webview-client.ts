import { SavedHistoryClient } from "./saved-history-client.js";
import { availability, ATTACHMENT_HISTORY_PAGE_SIZE, CHANGE_REVIEW_PAGE_SIZE, SESSION_PAGE_SIZE, type ClientSnapshot, type Intent } from "./client-state.js";
import type { WebviewBridge } from "./bridge.js";
import { parseHostMessage } from "./parse-host-message.js";

const MAX_DRAFT_CHARACTERS = 8000;
const MAX_ATTACHMENTS = 20;
const MAX_PREVIEW_CHARACTERS = 262144;

type HostMessage = NonNullable<ReturnType<typeof parseHostMessage>>;

function lastPage(count: number, pageSize: number): number {
  return Math.max(0, Math.ceil(count / pageSize) - 1);
}

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
    case "completeCommand":
    case "queueChat":
    case "recallQueuedText":
    case "useRecoveredText":
    case "discardRecoveredText":
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

function identifiersExhausted(sequence: number, revision: number): boolean {
  return sequence >= Number.MAX_SAFE_INTEGER || revision >= Number.MAX_SAFE_INTEGER;
}

/** Owns view-local reconciliation only. The host decides all business transitions. */
export class WebviewClient {
  private listeners = new Set<() => void>();
  private unsubscribe: (() => void) | undefined;
  private identity: { generation: number; viewId: string } | undefined;
  private sequence = 0;
  private pending: number | null = null;
  private commandCompletion: { revision: number; sequence: number; before: string; after: string } | null = null;
  private submitted: { revision: number; sequence: number; text: string } | null = null;
  private queuedSubmit: { revision: number; text: string } | null = null;
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
  private snapshot: ClientSnapshot = { workspace: null, interactions: null, executionProfile: null, providerConfig: null, attachments: null, queuedText: null, commandCatalogue: null, sessionUsage: null, sessions: null, text: "", synchronizing: true, submitting: false,
    ...this.savedHistory.snapshot,
    changeReview: null, changeReviewOpen: false, changeReviewPage: 0, stopRequested: false, history: [], historyOpen: false, historyPage: 0, preview: null, error: null };
  constructor(private readonly bridge: WebviewBridge) {}
  getSnapshot = (): ClientSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  start(): void {
    if (this.unsubscribe || this.disposed) return;
    try {
      this.unsubscribe = this.bridge.subscribe(value => this.receive(value));
      this.bridge.postMessage({ version: 3, type: "ping" });
      this.bridge.postMessage({ version: 3, type: "getWorkspaceState" });
    } catch { this.update({ error: "Could not connect to the extension host. Reopen the view to retry." }); }
  }
  dispose(): void { this.disposed = true; this.unsubscribe?.(); this.unsubscribe = undefined; this.listeners.clear(); }
  private update(patch: Partial<ClientSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }
  action = (intent: Intent): void => {
    const blockedByHandoff = availability(this.snapshot).sessionTransitioning && blockedDuringSessionSwitch(intent);
    if (!this.identity || this.disposed || this.snapshot.error || blockedByHandoff) return;
    try { this.bridge.postMessage({ version: 3, ...this.identity, ...intent }); }
    catch { this.pending = null; this.update({ error: "Connection to the extension host was lost. Reopen the view; no automatic retry was made." }); }
  };
  private syncDraft(): void {
    const draft = this.snapshot.attachments?.draft;
    if (draft && !this.draftSyncBlocked(draft) && this.snapshot.text !== draft.text) {
      this.pending = ++this.sequence;
      this.update({ synchronizing: true });
      this.action({ type: "updateDraft", draftRevision: draft.revision, editSequence: this.pending, text: this.snapshot.text });
    }
    const current = this.snapshot.attachments?.draft;
    this.update({
      synchronizing: !current
        || this.pending !== null
        || this.snapshot.text !== current.text
        || identifiersExhausted(this.sequence, current?.revision ?? 0),
    });
  }
  private draftSyncBlocked(draft: { revision: number }): boolean {
    return !!this.snapshot.workspace?.busy
      || !!this.snapshot.error
      || this.pending !== null
      || identifiersExhausted(this.sequence, draft.revision)
      || this.snapshot.text.length > MAX_DRAFT_CHARACTERS;
  }
  edit = (text: string): void => { this.update({ text }); this.syncDraft(); };
  submit = (): void => {
    const draft = this.snapshot.attachments?.draft;
    if (!draft || availability(this.snapshot).sendDisabled) return;
    this.submitted = { revision: draft.revision, sequence: this.sequence, text: this.snapshot.text };
    this.update({ submitting: true });
    this.action({ type: "sendChat", draftRevision: draft.revision });
  };
  stop = (): void => {
    const controls = availability(this.snapshot);
    if (!controls.showStop || controls.stopping) return;
    this.update({ stopRequested: true });
    this.action({ type: "stopChat" });
  };
  queueChat = (mode: "steering" | "follow-up"): void => {
    const draft = this.snapshot.attachments?.draft;
    if (!draft || availability(this.snapshot).queueDisabled) return;
    this.queuedSubmit = { revision: draft.revision, text: this.snapshot.text };
    this.action({ type: "queueChat", draftRevision: draft.revision, mode });
  };
  completeCommand = (name: string): void => {
    const snapshot = this.snapshot;
    const draft = snapshot.attachments?.draft;
    const catalogue = snapshot.commandCatalogue;
    const controls = availability(snapshot);
    if (!draft || catalogue?.status !== "ready" || !catalogue.rows.some(row => row.name === name)
      || this.commandCompletion || snapshot.synchronizing || snapshot.submitting || snapshot.error
      || snapshot.attachments?.preparation !== "idle" || snapshot.workspace?.runtime !== "ready"
      || controls.stopping || controls.sessionTransitioning || snapshot.workspace.busy
      || (snapshot.executionProfile && snapshot.executionProfile.phase !== "idle") || snapshot.interactions?.active) return;
    const leading = /^\/[^\s/]*(?=\s|$)/.exec(snapshot.text);
    if (!leading) return;
    const after = `/${name}${snapshot.text.slice(leading[0].length) || " "}`;
    if (after === snapshot.text || after.length > MAX_DRAFT_CHARACTERS) return;
    this.commandCompletion = { revision: draft.revision, sequence: this.sequence, before: snapshot.text, after };
    this.action({ type: "completeCommand", draftRevision: draft.revision, name });
  };
  recallQueuedText = (): void => {
    const queue = this.snapshot.queuedText;
    if (!queue || availability(this.snapshot).recallDisabled) return;
    this.action({ type: "recallQueuedText", queueRevision: queue.revision });
  };
  useRecoveredText = (id: string): void => {
    const draft = this.snapshot.attachments?.draft;
    const entry = this.snapshot.queuedText?.recovery.find(item => item.id === id);
    if (!draft || !entry || entry.status !== "recalled" || this.snapshot.text.trim() || draft.attachments.length
      || availability(this.snapshot).sessionTransitioning || this.snapshot.error) return;
    this.action({ type: "useRecoveredText", id, draftRevision: draft.revision });
  };
  discardRecoveredText = (id: string): void => {
    if (!this.snapshot.queuedText?.recovery.some(item => item.id === id) || this.snapshot.error) return;
    this.action({ type: "discardRecoveredText", id });
  };
  addAttachment = (): void => { this.beginAttachment("file"); };
  addSelection = (): void => { this.beginAttachment("selection"); };
  private beginAttachment(kind: "file" | "selection"): void {
    const draft = this.snapshot.attachments?.draft;
    if (!draft || draft.attachments.length >= MAX_ATTACHMENTS || availability(this.snapshot).attachmentDisabled) return;
    this.action({
      type: kind === "file" ? "addFileAttachment" : "addSelectionAttachment",
      draftRevision: draft.revision,
    });
  }
  confirmAttachment = (attachmentId: string): void => {
    const draft = this.snapshot.attachments?.draft;
    const attachment = draft?.attachments.find(item => item.attachmentId === attachmentId);
    if (!draft || !attachment || attachment.state !== "confirmation-required" || availability(this.snapshot).attachmentDisabled) return;
    this.action({
      type: attachment.kind === "selection" ? "confirmSelectionAttachment" : "confirmFileAttachment",
      draftRevision: draft.revision,
      attachmentId: attachment.attachmentId,
      snapshotId: attachment.snapshotId,
    });
  };
  removeAttachment = (attachmentId: string): void => {
    const draft = this.snapshot.attachments?.draft;
    const attachment = draft?.attachments.find(item => item.attachmentId === attachmentId);
    if (!draft || !attachment || availability(this.snapshot).attachmentDisabled) return;
    if (this.snapshot.preview?.snapshotId === attachment.snapshotId) this.closePreview();
    this.action({ type: "removeAttachment", draftRevision: draft.revision, attachmentId: attachment.attachmentId });
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
    const last = lastPage(sessions?.total ?? 0, SESSION_PAGE_SIZE);
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
    const last = lastPage(this.snapshot.history.length, ATTACHMENT_HISTORY_PAGE_SIZE);
    if (!this.snapshot.historyOpen || this.snapshot.historyPage === null || !Number.isSafeInteger(page) || page < 0 || page > last || page === this.snapshot.historyPage) return;
    this.update({ historyPage: page, ...this.historyPreviewReset() });
  };
  toggleChangeReview = (): void => {
    const open = !this.snapshot.changeReviewOpen;
    this.update({ changeReviewOpen: open });
    if (open) this.action({ type: "getChangeReview" });
  };
  navigateChangeReview = (page: number): void => {
    const last = lastPage(this.snapshot.changeReview?.entries.length ?? 0, CHANGE_REVIEW_PAGE_SIZE);
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
    if (!message || this.isStale(message)) return;
    this.adoptGeneration(message);
    switch (message.type) {
      case "pong":
        return;
      case "uiLanguageState":
        this.update({ uiLocale: message.locale });
        return;
      case "interactionState":
        this.update({ interactions: message });
        return;
      case "executionProfileState":
        this.update({ executionProfile: message });
        return;
      case "providerConfigState":
        this.update({ providerConfig: message });
        return;
      case "sessionState":
        this.applySessionState(message);
        return;
      case "savedHistoryState":
      case "savedHistoryPreview":
        this.savedHistory.receive(message);
        return;
      case "workspaceState":
        this.applyWorkspaceState(message);
        return;
      case "attachmentState":
        this.applyAttachmentState(message);
        return;
      case "sessionUsageState":
        if (this.snapshot.sessionUsage && message.revision < this.snapshot.sessionUsage.revision) return;
        this.update({ sessionUsage: message }); return;
      case "commandCatalogueState": return this.applyCommandCatalogue(message);
      case "queuedTextState":
        if (message.error && this.queuedSubmit) this.queuedSubmit = null;
        this.update({ queuedText: message });
        return;
      case "attachmentHistory":
        this.applyAttachmentHistory(message);
        return;
      case "changeReviewState":
        this.applyChangeReview(message);
        return;
      case "attachmentPreview":
        this.applyAttachmentPreview(message);
        return;
    }
  }
  private applyCommandCatalogue(message: Extract<HostMessage, { type: "commandCatalogueState" }>): void {
    if (this.snapshot.commandCatalogue && message.revision < this.snapshot.commandCatalogue.revision) return;
    this.update({ commandCatalogue: message });
  }
  private isStale(message: HostMessage): boolean {
    return !!this.identity && (message.viewId !== this.identity.viewId || message.generation < this.identity.generation);
  }
  private adoptGeneration(message: HostMessage): void {
    if (!this.identity || message.generation <= this.identity.generation) {
      this.identity = { generation: message.generation, viewId: message.viewId };
      return;
    }
    // Only new-generation switching commits the host's confirmed draft loss.
    // Old-generation switching may still fail Stop/inspection; unrelated generations retain local text.
    const committedHandoff = message.type === "sessionState" && message.phase === "switching";
    this.pending = null;
    this.commandCompletion = null;
    this.submitted = null;
    this.queuedSubmit = null;
    this.update({
      workspace: null, interactions: null, executionProfile: null, providerConfig: null, attachments: null, queuedText: null, commandCatalogue: null, sessionUsage: null, sessions: null,
      ...this.savedHistory.reset(),
      changeReview: null, changeReviewPage: 0, synchronizing: true, submitting: false, stopRequested: false, history: [], historyOpen: false, preview: null,
      ...(committedHandoff ? { text: "" } : {}),
    });
    this.identity = { generation: message.generation, viewId: message.viewId };
  }
  private applySessionState(message: Extract<HostMessage, { type: "sessionState" }>): void {
    // The host cancels retained-history reads before its native modal and suppresses their replies.
    const cancelsHistoryRead = message.phase === "confirming" || message.phase === "switching";
    this.update({ sessions: message, ...(cancelsHistoryRead ? this.savedHistory.invalidatePreview() : {}) });
  }
  private applyWorkspaceState(message: Extract<HostMessage, { type: "workspaceState" }>): void {
    const settled = !message.chatBusy && message.execution !== "stopping";
    this.update({ workspace: message, stopRequested: settled ? false : this.snapshot.stopRequested });
    this.syncDraft();
  }
  private applyAttachmentState(message: Extract<HostMessage, { type: "attachmentState" }>): void {
    const previous = this.snapshot.attachments;
    if (previous && message.draft.revision < previous.draft.revision) return;
    let text = this.snapshot.text;
    const completion = this.commandCompletion;
    if (completion && (message.draft.revision > completion.revision || message.result)) {
      if (!message.result && message.draft.revision === completion.revision + 1
        && message.draft.text === completion.after && text === completion.before
        && this.sequence === completion.sequence) text = completion.after;
      this.commandCompletion = null;
    }
    if (!previous && !text) text = message.draft.text;
    else if (!text && message.draft.text && (!previous || message.draft.revision > previous.draft.revision)) {
      // Host-authored restores (e.g. useRecoveredText) land in draft.text; adopt when the composer is empty.
      text = message.draft.text;
    }
    if (this.submitted && message.lastSubmission?.draftRevision === this.submitted.revision) {
      if (text === this.submitted.text && this.sequence === this.submitted.sequence) text = "";
      this.submitted = null;
    } else if (message.preparation === "idle" && (message.result || (this.submitted && message.draft.revision > this.submitted.revision))) {
      this.submitted = null;
    }
    if (this.queuedSubmit && message.draft.revision > this.queuedSubmit.revision && message.draft.text === "") {
      if (text === this.queuedSubmit.text) text = "";
      this.queuedSubmit = null;
    } else if (this.queuedSubmit && message.draft.revision > this.queuedSubmit.revision) {
      this.queuedSubmit = null;
    }
    if (this.pending !== null && (message.draft.acceptedEditSequence >= this.pending || message.result?.code === "stale")) this.pending = null;
    this.sequence = Math.max(this.sequence, message.draft.acceptedEditSequence);
    const lost = message.result?.code === "runtime-lost";
    const previewId = this.snapshot.preview?.snapshotId;
    const replacedPreview = !!previewId
      && !!previous?.draft.attachments.some(attachment => attachment.snapshotId === previewId)
      && !message.draft.attachments.some(attachment => attachment.snapshotId === previewId);
    const clearStop = message.preparation === "idle" && !this.snapshot.workspace?.chatBusy;
    this.update({
      attachments: message,
      text,
      submitting: this.submitted !== null,
      ...(lost ? { history: [], historyPage: 0, preview: null } : replacedPreview ? { preview: null } : {}),
      ...(clearStop ? { stopRequested: false } : {}),
    });
    this.syncDraft();
    if (this.snapshot.historyOpen) this.action({ type: "getAttachmentHistory" });
  }
  private applyAttachmentHistory(message: Extract<HostMessage, { type: "attachmentHistory" }>): void {
    if (!this.snapshot.historyOpen) return;
    const last = lastPage(message.entries.length, ATTACHMENT_HISTORY_PAGE_SIZE);
    this.update({
      history: message.entries,
      historyPage: this.snapshot.historyPage === null ? last : Math.min(this.snapshot.historyPage, last),
    });
  }
  private applyChangeReview(message: Extract<HostMessage, { type: "changeReviewState" }>): void {
    const last = lastPage(message.entries.length, CHANGE_REVIEW_PAGE_SIZE);
    this.update({ changeReview: message, changeReviewPage: Math.min(this.snapshot.changeReviewPage, last) });
  }
  private applyAttachmentPreview(message: Extract<HostMessage, { type: "attachmentPreview" }>): void {
    const preview = this.snapshot.preview;
    if (!preview || preview.requestId !== message.requestId) return;
    if ("code" in message) {
      this.update({ preview: { ...preview, error: message.code } });
      return;
    }
    const chunkContinues = message.snapshotId === preview.snapshotId
      && message.offset === preview.offset
      && message.nextOffset === message.offset + message.text.length
      && (message.done || message.nextOffset > message.offset)
      && preview.text.length + message.text.length <= MAX_PREVIEW_CHARACTERS;
    if (!chunkContinues) return;
    this.update({ preview: { ...preview, offset: message.nextOffset, text: preview.text + message.text } });
    if (!message.done) this.action({ type: "getAttachmentPreview", requestId: preview.requestId, snapshotId: preview.snapshotId, offset: message.nextOffset });
  }
}
