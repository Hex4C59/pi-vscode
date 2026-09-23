import { randomBytes } from "node:crypto";
import type { SessionBackend, SavedHistoryPage } from "./sessionBackend.js";
import type { HostEnvelope, SavedHistoryStateMessage, SavedHistoryPreviewMessage } from "./webviewProtocol.js";

type State = Omit<SavedHistoryStateMessage, keyof HostEnvelope>;
type Preview = Omit<Extract<SavedHistoryPreviewMessage, { code: string }>, keyof HostEnvelope> | Omit<Extract<SavedHistoryPreviewMessage, { text: string }>, keyof HostEnvelope>;
type Context = { cwd: string | undefined; key: string; enabled: boolean; startable: boolean; settled: Promise<void> };
const empty = (): State => ({ type: "savedHistoryState", available: false, phase: "idle", messages: [], page: 0, total: 0, error: null });

/** One render window and one owned public-SDK read; never stores or opens original workspace files. */
export class SavedHistory {
  private state = empty();
  private reference: { id: string; anchor: string | null } | undefined;
  private rows = new Map<string, number>();
  private operation: AbortController | undefined;
  private running = false;
  private queued: { action: (operation: AbortController) => Promise<void>; finish: () => void; settled: Promise<void> } | undefined;
  private activeWork: Promise<void> | undefined;
  constructor(private readonly backend: SessionBackend, private readonly context: () => Context, private readonly post: (message: State | Preview) => void) {}
  publish(): void { this.post(this.state); }
  // Capture only work already admitted; later reads must not extend this barrier into a cycle.
  async waitForSettlement(): Promise<void> { await Promise.all([this.activeWork, this.queued?.settled]); }
  cancel(): Promise<void> {
    this.operation?.abort(); this.queued?.finish(); this.queued = undefined;
    if (this.state.phase === "loading") { this.state = { ...this.state, phase: "idle" }; this.publish(); }
    return this.waitForSettlement();
  }
  reset(): void { void this.cancel(); this.reference = undefined; this.rows.clear(); this.state = empty(); this.publish(); }
  restore(id: string, anchor: string | null, history: SavedHistoryPage): void {
    this.reset();
    if (!anchor && (history.total > 0 || history.messages.length > 0)) { this.state = { ...empty(), phase: "error", error: "unavailable" }; this.publish(); return; }
    this.reference = { id, anchor }; this.accept(history); this.publish();
  }
  private accept(history: SavedHistoryPage): void {
    this.rows.clear(); const start = Math.max(0, history.total - (history.page + 1) * 32);
    const messages = history.messages.map((line, index) => { const id = randomBytes(16).toString("hex"); this.rows.set(id, start + index); return { ...line, id }; });
    this.state = { type: "savedHistoryState", available: true, phase: "idle", messages, page: history.page, total: history.total, error: null };
  }
  private schedule(action: (operation: AbortController) => Promise<void>): Promise<void> {
    let finish!: () => void;
    const settled = new Promise<void>(resolve => { finish = resolve; });
    this.queued = { action, finish, settled };
    if (!this.running) { this.running = true; void this.drain(); }
    return settled;
  }
  private async drain(): Promise<void> {
    try {
      while (this.queued) {
        const work = this.queued; this.queued = undefined; this.activeWork = work.settled;
        const operation = new AbortController(); this.operation = operation;
        try { await work.action(operation); }
        finally { if (this.operation === operation) this.operation = undefined; this.activeWork = undefined; work.finish(); }
      }
    } finally { this.running = false; }
  }
  async page(page: number): Promise<void> {
    const reference = this.reference; const before = this.context();
    if (!before.enabled || !before.cwd || !reference?.anchor || !Number.isSafeInteger(page) || page < 0 || page > Math.max(0, Math.ceil(this.state.total / 32) - 1)) return;
    if (!before.startable) { this.state = { ...this.state, phase: "error", error: "unavailable" }; this.publish(); return; }
    this.cancel(); this.state = { ...this.state, phase: "loading", error: null }; this.publish();
    const cwd = before.cwd, anchor = reference.anchor;
    await this.schedule(async operation => {
      const current = () => this.operation === operation && !operation.signal.aborted && this.reference === reference && this.context().enabled && this.context().key === before.key;
      await before.settled;
      if (!current()) return;
      try {
        const result = await this.backend.history(cwd, reference.id, anchor, page, operation.signal);
        if (!current()) return;
        if (result.ok) this.accept(result.history);
        else this.state = { ...this.state, phase: "error", error: result.code === "wrong-project" ? "stale" : result.code };
      } catch { if (current()) this.state = { ...this.state, phase: "error", error: "unavailable" }; }
      finally { if (current()) this.publish(); }
    });
  }
  async preview(id: string, requestId: string, offset: number): Promise<void> {
    const before = this.context(); const reference = this.reference; const index = this.rows.get(id);
    if (!before.enabled || !before.cwd) return;
    const envelope = { type: "savedHistoryPreview" as const, id, requestId };
    if (!before.startable) { this.post({ ...envelope, code: "unavailable" }); return; }
    if (!reference?.anchor || index === undefined) { this.post({ ...envelope, code: "stale" }); return; }
    this.cancel(); const cwd = before.cwd, anchor = reference.anchor;
    await this.schedule(async operation => {
      const current = () => this.operation === operation && !operation.signal.aborted && this.reference === reference && this.context().enabled && this.context().key === before.key;
      await before.settled;
      if (!current()) return;
      try {
        const result = await this.backend.preview(cwd, reference.id, anchor, index, offset, operation.signal);
        if (current()) this.post(result.ok ? { ...envelope, ...result.preview } : { ...envelope, code: result.code === "wrong-project" ? "stale" : result.code });
      } catch { if (current()) this.post({ ...envelope, code: "unavailable" }); }
    });
  }
}
