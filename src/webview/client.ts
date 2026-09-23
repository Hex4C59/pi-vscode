import type { AttachmentHistoryEntry, AttachmentStateMessage, ChangeReviewStateMessage, SavedHistoryStateMessage, SessionStateMessage, WebviewMessage, WorkspaceStateMessage } from "../extension/webviewProtocol.js";
import type { WebviewBridge } from "./bridge.js";
import { parseHostMessage } from "./host-messages.js";

type WithoutEnvelope<T> = T extends { generation: number; viewId: string } ? Omit<T, "generation" | "viewId" | "version"> : never;
export type Intent = WithoutEnvelope<WebviewMessage>;
export const ATTACHMENT_HISTORY_PAGE_SIZE = 16;
export const CHANGE_REVIEW_PAGE_SIZE = 16;
export const SESSION_PAGE_SIZE = 16;
export const SAVED_HISTORY_PAGE_SIZE = 32;
const SAVED_PREVIEW_BACK_LIMIT = 128;
export type Preview = { snapshotId: string; requestId: string; offset: number; text: string; error: string | null };
export type SavedHistoryPreview = {
  id: string; requestId: string; offset: number; nextOffset: number; totalChars: number | null;
  text: string; done: boolean; phase: "loading" | "idle" | "error";
  error: SavedHistoryStateMessage["error"]; previousOffsets: number[];
};
export type ClientSnapshot = {
  workspace: WorkspaceStateMessage | null;
  attachments: AttachmentStateMessage | null;
  sessions: SessionStateMessage | null;
  savedHistory: SavedHistoryStateMessage | null;
  savedHistoryPendingPage: number | null;
  savedHistoryPreview: SavedHistoryPreview | null;
  changeReview: ChangeReviewStateMessage | null;
  changeReviewOpen: boolean;
  changeReviewPage: number;
  text: string;
  synchronizing: boolean;
  submitting: boolean;
  stopRequested: boolean;
  history: AttachmentHistoryEntry[];
  historyOpen: boolean;
  historyPage: number | null;
  preview: Preview | null;
  error: string | null;
};
export function attachmentError(code: string, kind?: "file" | "selection"): string {
  if (code === "source-changed" && kind === undefined) return "Sources changed. Send checks all attachments; confirm each marked snapshot or remove and reattach.";
  if (code === "source-changed" && kind === "selection") return "Source changed. Selection text stays fixed; Send checks the source before you choose Use old snapshot, or remove and reattach.";
  const messages: Record<string, string> = {
    "no-editor": "Open a workspace text editor and select code first.", "empty-selection": "Select a nonempty range of code first.", "multiple-selections": "Select one range at a time, then attach it.",
    cancelled: "Selection cancelled. Draft retained.", busy: "Wait for the current operation.", stale: "Draft changed; synchronized with the host.",
    ineligible: "A trusted local workspace and ready runtime are required.", "attachment-limit": "At most 20 attachments. Remove an item before attaching more.", "total-too-large": "Attachment text exceeds 1 MiB. Reduce or remove attachments before sending.",
    "sensitive-source": "Credential-like source blocked. Attach only nonsecret code.",
    "history-full": "Attachment history is full. Inspect history, or use Developer: Reload Window to restart (current chat, attachment snapshots and unsent draft will be lost). Plain chat remains available.",
    "source-changed": "Source changed. Send refreshes the snapshot; confirm Use latest contents before sending. Remove and reattach if unavailable.", "preparation-cancelled": "Preparation cancelled. Draft retained.",
    "runtime-lost": "Runtime/session ended. In-memory attachment history ended; reattach for the new session.",
    "write-failed": "Delivery uncertain. No retry was made. Stop or restart before retrying.",
    "ack-timeout": "Acknowledgement timed out. No retry was made. Stop or restart.",
    "rpc-rejected": "Runtime rejected this submission. Inspect history before trying again.",
  };
  return messages[code] ?? "File could not be attached or sent. Remove and reattach a smaller eligible workspace text file.";
}
export function availability(s: ClientSnapshot) {
  const w = s.workspace;
  const stopping = s.stopRequested || w?.execution === "stopping" || w?.runtime === "stopping";
  const ready = !!w && w.runtime === "ready" && !w.busy;
  const sessionTransitioning = s.sessions?.phase === "confirming" || s.sessions?.phase === "switching";
  const chatDisabled = !ready || !!w?.chatBusy || !!w?.modelBusy || stopping || !!s.error || sessionTransitioning;
  return {
    stopping,
    sessionTransitioning,
    settingsDisabled: !ready || !!w?.modelBusy || stopping || !!s.error || sessionTransitioning,
    sendDisabled: chatDisabled || !w?.chatModel || !!s.attachments?.draft.attachments.some(a => ["unavailable", "confirmation-required"].includes(a.state)) || s.synchronizing || s.submitting || s.attachments?.preparation !== "idle" || !s.text.trim(),
    attachmentDisabled: chatDisabled || s.synchronizing || s.submitting || s.attachments?.preparation !== "idle",
    showStop: !!w?.chatBusy || stopping || (!!s.attachments && s.attachments.preparation !== "idle"),
  };
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
  private snapshot: ClientSnapshot = { workspace: null, attachments: null, sessions: null, text: "", synchronizing: true, submitting: false,
    savedHistory: null, savedHistoryPendingPage: null, savedHistoryPreview: null,
    changeReview: null, changeReviewOpen: false, changeReviewPage: 0, stopRequested: false, history: [], historyOpen: false, historyPage: 0, preview: null, error: null };
  private listeners = new Set<() => void>();
  private unsubscribe: (() => void) | undefined;
  private identity: { generation: number; viewId: string } | undefined;
  private sequence = 0;
  private pending: number | null = null;
  private submitted: { revision: number; sequence: number; text: string } | null = null;
  private previewCounter = 0;
  private disposed = false;
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
  private savedHistoryBlocked(): boolean {
    const { workspace, savedHistory, savedHistoryPendingPage, error } = this.snapshot;
    return this.disposed || !!error || !workspace || workspace.status !== "eligible" || workspace.choice === null
      || workspace.busy || availability(this.snapshot).sessionTransitioning || !savedHistory?.available
      || savedHistory.phase === "loading" || savedHistoryPendingPage !== null;
  }
  getSavedHistory = (page: number): void => {
    const history = this.snapshot.savedHistory;
    const last = Math.max(0, Math.ceil((history?.total ?? 0) / SAVED_HISTORY_PAGE_SIZE) - 1);
    if (this.savedHistoryBlocked() || !Number.isSafeInteger(page) || page < 0 || page > last) return;
    this.update({ savedHistoryPendingPage: page, savedHistoryPreview: null });
    this.action({ type: "getSavedHistory", page });
  };
  requestSavedHistoryPreview = (id: string): void => {
    const history = this.snapshot.savedHistory;
    if (this.savedHistoryBlocked() || history?.phase !== "idle" || history.error !== null || !history.messages.some(line => line.id === id)) return;
    this.loadSavedHistoryPreview(id, 0, [], null);
  };
  private loadSavedHistoryPreview(id: string, offset: number, previousOffsets: number[], totalChars: number | null): void {
    if (this.previewCounter >= Number.MAX_SAFE_INTEGER) { this.update({ error: "Preview identifiers exhausted. Reopen the view." }); return; }
    const requestId = `saved-preview-${++this.previewCounter}`;
    this.update({ savedHistoryPreview: { id, requestId, offset, nextOffset: offset, previousOffsets, totalChars, text: "", done: false, phase: "loading", error: null } });
    this.action({ type: "getSavedHistoryPreview", id, requestId, offset });
  }
  navigateSavedHistoryPreview = (direction: "first" | "previous" | "next" | "retry"): void => {
    const preview = this.snapshot.savedHistoryPreview;
    if (this.savedHistoryBlocked() || !preview || preview.phase === "loading") return;
    if (direction === "retry") {
      if (preview.phase === "error") this.loadSavedHistoryPreview(preview.id, preview.offset, preview.previousOffsets, preview.totalChars);
    } else if (direction === "first") {
      if (preview.offset > 0) this.loadSavedHistoryPreview(preview.id, 0, [], preview.totalChars);
    } else if (direction === "previous") {
      const previous = preview.previousOffsets.at(-1);
      if (previous !== undefined) this.loadSavedHistoryPreview(preview.id, previous, preview.previousOffsets.slice(0, -1), preview.totalChars);
    } else if (preview.phase === "idle" && !preview.done) {
      // Retain positions, never prior text. First chunk remains available beyond this bounded back history.
      this.loadSavedHistoryPreview(preview.id, preview.nextOffset, [...preview.previousOffsets, preview.offset].slice(-SAVED_PREVIEW_BACK_LIMIT), preview.totalChars);
    }
  };
  closeSavedHistoryPreview = (): void => this.update({ savedHistoryPreview: null });
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
      this.update({ workspace: null, attachments: null, sessions: null, savedHistory: null, savedHistoryPendingPage: null, savedHistoryPreview: null,
        changeReview: null, changeReviewPage: 0, synchronizing: true, submitting: false, stopRequested: false, history: [], historyOpen: false, preview: null,
        ...(committedHandoff ? { text: "" } : {}) });
    }
    this.identity = { generation: message.generation, viewId: message.viewId };
    if (message.type === "pong") return;
    if (message.type === "sessionState") {
      // The host cancels retained-history reads before its native modal and suppresses their replies.
      const cancelsHistoryRead = message.phase === "confirming" || message.phase === "switching";
      this.update({ sessions: message, ...(cancelsHistoryRead ? { savedHistoryPreview: null } : {}) });
      return;
    }
    if (message.type === "savedHistoryState") {
      const preview = this.snapshot.savedHistoryPreview;
      const keepPreview = message.available && message.phase === "idle" && message.error === null
        && message.page === this.snapshot.savedHistory?.page && preview && message.messages.some(line => line.id === preview.id);
      this.update({ savedHistory: message, savedHistoryPreview: keepPreview ? preview : null,
        savedHistoryPendingPage: message.phase === "loading" ? this.snapshot.savedHistoryPendingPage : null });
      return;
    }
    if (message.type === "savedHistoryPreview") {
      const preview = this.snapshot.savedHistoryPreview;
      if (!preview || preview.phase !== "loading" || message.requestId !== preview.requestId || message.id !== preview.id) return;
      if ("code" in message) {
        this.update({ savedHistoryPreview: { ...preview, phase: "error", error: message.code } });
        return;
      }
      if (message.offset !== preview.offset || message.nextOffset !== message.offset + message.text.length
        || message.nextOffset > message.totalChars || message.done !== (message.nextOffset === message.totalChars)
        || (!message.done && message.nextOffset <= message.offset) || (preview.totalChars !== null && preview.totalChars !== message.totalChars)) return;
      this.update({ savedHistoryPreview: { ...preview, text: message.text, nextOffset: message.nextOffset,
        totalChars: message.totalChars, done: message.done, phase: "idle", error: null } });
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
