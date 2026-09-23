import type { HostMessage, SavedHistoryStateMessage, WebviewMessage } from "../extension/webviewProtocol.js";

export const SAVED_HISTORY_PAGE_SIZE = 32;
const SAVED_PREVIEW_BACK_LIMIT = 128;
export type SavedHistoryPreview = {
  id: string; requestId: string; offset: number; nextOffset: number; totalChars: number | null;
  text: string; done: boolean; phase: "loading" | "idle" | "error";
  error: SavedHistoryStateMessage["error"]; previousOffsets: number[];
};

export type SavedHistorySnapshot = {
  savedHistory: SavedHistoryStateMessage | null;
  savedHistoryPendingPage: number | null;
  savedHistoryPreview: SavedHistoryPreview | null;
};
type HistoryMessage = Extract<HostMessage, { type: "savedHistoryState" | "savedHistoryPreview" }>;
type HistoryIntent = (Omit<Extract<WebviewMessage, { type: "getSavedSessions" | "getSavedHistory" }>, "version" | "generation" | "viewId"> & { type: "getSavedHistory" })
  | Omit<Extract<WebviewMessage, { type: "getSavedHistoryPreview" }>, "version" | "generation" | "viewId">;
const empty = (): SavedHistorySnapshot => ({ savedHistory: null, savedHistoryPendingPage: null, savedHistoryPreview: null });

/** Owns the retained-history reading window and one correlated chunk preview. */
export class SavedHistoryClient {
  private value = empty();
  private previewCounter = 0;
  constructor(
    private readonly enabled: () => boolean,
    private readonly send: (intent: HistoryIntent) => void,
    private readonly changed: (snapshot: Readonly<SavedHistorySnapshot>) => void,
    private readonly fail: (message: string) => void,
  ) {}
  get snapshot(): Readonly<SavedHistorySnapshot> { return this.value; }
  // Reset is composed into the client's single identity-change notification.
  reset(): Readonly<SavedHistorySnapshot> { this.value = empty(); return this.value; }
  private update(patch: Partial<SavedHistorySnapshot>): void {
    this.value = { ...this.value, ...patch };
    this.changed(this.value);
  }
  private blocked(): boolean {
    return !this.enabled() || !this.value.savedHistory?.available
      || this.value.savedHistory.phase === "loading" || this.value.savedHistoryPendingPage !== null;
  }
  page = (page: number): void => {
    const history = this.value.savedHistory;
    const last = Math.max(0, Math.ceil((history?.total ?? 0) / SAVED_HISTORY_PAGE_SIZE) - 1);
    if (this.blocked() || !Number.isSafeInteger(page) || page < 0 || page > last) return;
    this.update({ savedHistoryPendingPage: page, savedHistoryPreview: null });
    this.send({ type: "getSavedHistory", page });
  };
  preview = (id: string): void => {
    const history = this.value.savedHistory;
    if (this.blocked() || history?.phase !== "idle" || history.error !== null || !history.messages.some(line => line.id === id)) return;
    this.loadSavedHistoryPreview(id, 0, [], null);
  };
  private loadSavedHistoryPreview(id: string, offset: number, previousOffsets: number[], totalChars: number | null): void {
    if (this.previewCounter >= Number.MAX_SAFE_INTEGER) { this.fail("Preview identifiers exhausted. Reopen the view."); return; }
    const requestId = `saved-preview-${++this.previewCounter}`;
    this.update({ savedHistoryPreview: { id, requestId, offset, nextOffset: offset, previousOffsets, totalChars, text: "", done: false, phase: "loading", error: null } });
    this.send({ type: "getSavedHistoryPreview", id, requestId, offset });
  }
  navigatePreview = (direction: "first" | "previous" | "next" | "retry"): void => {
    const preview = this.value.savedHistoryPreview;
    if (this.blocked() || !preview || preview.phase === "loading") return;
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
  invalidatePreview(): Readonly<SavedHistorySnapshot> {
    this.value = { ...this.value, savedHistoryPreview: null };
    return this.value;
  }
  closePreview = (): void => { this.changed(this.invalidatePreview()); };
  receive(message: HistoryMessage): void {
    if (message.type === "savedHistoryState") {
      const preview = this.value.savedHistoryPreview;
      const keepPreview = message.available && message.phase === "idle" && message.error === null
        && message.page === this.value.savedHistory?.page && preview && message.messages.some(line => line.id === preview.id);
      this.update({ savedHistory: message, savedHistoryPreview: keepPreview ? preview : null,
        savedHistoryPendingPage: message.phase === "loading" ? this.value.savedHistoryPendingPage : null });
      return;
    }
    if (message.type === "savedHistoryPreview") {
      const preview = this.value.savedHistoryPreview;
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
  }
}
