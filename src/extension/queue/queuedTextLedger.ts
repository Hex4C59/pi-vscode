import { randomBytes } from "node:crypto";
import type { AttachmentPromptResult, PiRuntimeLifecycle, QueuedTextSnapshot } from "../contracts/index.js";
import { containsCredentialLikeText } from "../contracts/index.js";

type QueueMode = Parameters<NonNullable<PiRuntimeLifecycle["prepareQueuedText"]>>[1];
type RecordDelivery = AttachmentPromptResult["delivery"] | "pending";
type Attribution = "local" | "external" | "unknown";
type Reuse = "reusable" | "unavailable";

type LocalRecord = {
  id: string;
  text: string;
  mode: QueueMode;
  delivery: RecordDelivery;
  attribution: Attribution;
  bytes: number;
  attempted: boolean;
};

type RecoveredRecord = {
  id: string;
  text: string;
  mode: QueueMode;
  reuse: Reuse;
  bytes: number;
};

type PendingEntry =
  | { attribution: Attribution; reusable: true; text: string }
  | { attribution: Attribution; reusable: false };

export type QueuedTextSendOutcome =
  | { kind: "refused"; reason: "capacity" | "runtime-unavailable" | "invalid-text" }
  | { kind: "observed"; id: string; result: AttachmentPromptResult };

export type ClearReserveResult = { ok: true } | { ok: false; reason: "capacity" };

const RECORD_LIMIT = 32;
const UTF8_LIMIT = 256 * 1024;

/** Session-scoped host ledger: local retention, upstream pending attribution and clear recovery.
 * Shares one 32-record/256 KiB budget. DraftSubmission remains the draft owner.
 * Sensitive upstream text stays host-only and is never offered for reuse or projected raw.
 */
export class QueuedTextLedger {
  private readonly locals = new Map<string, LocalRecord>();
  private readonly recovered: RecoveredRecord[] = [];
  private bytes = 0;
  private pending: QueuedTextSnapshot = { steering: [], followUp: [] };
  private clearReservation: { count: number; bytes: number } | undefined;
  private queueRevision = 0;

  constructor(
    private readonly runtime: Pick<PiRuntimeLifecycle, "getSession" | "prepareQueuedText">,
    private readonly session: number,
  ) {}

  get revision(): number { return this.queueRevision; }

  async send(text: string, mode: QueueMode, onAttempt: () => void): Promise<QueuedTextSendOutcome> {
    if (!this.session || this.runtime.getSession() !== this.session || !this.runtime.prepareQueuedText) {
      return { kind: "refused", reason: "runtime-unavailable" };
    }
    if (typeof text !== "string" || !text.trim() || text.length > 8000 || text.trimStart().startsWith("/")
      || containsCredentialLikeText(text) || (mode !== "steering" && mode !== "follow-up")) {
      return { kind: "refused", reason: "invalid-text" };
    }
    const bytes = Buffer.byteLength(text, "utf8");
    if (!this.canReserve(1, bytes)) return { kind: "refused", reason: "capacity" };
    const record: LocalRecord = {
      id: randomBytes(16).toString("hex"), text, mode, bytes, delivery: "pending", attribution: "local", attempted: false,
    };
    this.locals.set(record.id, record); this.bytes += bytes; this.bumpRevision();
    try {
      const token = this.runtime.prepareQueuedText(text, mode, this.session);
      const result = await token.send(() => { record.attempted = true; onAttempt(); });
      if (!record.attempted && result.delivery === "not-sent") return this.refuseUnattempted(record);
      record.delivery = result.delivery;
      this.bumpRevision();
      return { kind: "observed", id: record.id, result };
    } catch {
      if (!record.attempted) return this.refuseUnattempted(record);
      record.delivery = "unknown";
      this.bumpRevision();
      return { kind: "observed", id: record.id, result: { delivery: "unknown", code: "runtime-lost" } };
    }
  }

  observeQueueUpdated(session: number, snapshot: QueuedTextSnapshot): void {
    if (session !== this.session) return;
    this.pending = { steering: [...snapshot.steering], followUp: [...snapshot.followUp] };
    this.bumpRevision();
  }

  observeUserStarted(session: number, text: string | null): void {
    if (session !== this.session || text === null) return;
    const steeringHits = this.pending.steering.filter(entry => entry === text).length;
    const followUpHits = this.pending.followUp.filter(entry => entry === text).length;
    if (steeringHits + followUpHits === 0) return;
    const ambiguous = (steeringHits > 0 && followUpHits > 0)
      || [...this.locals.values()].filter(record => record.text === text).length > 1;
    let changed = false;
    for (const record of this.locals.values()) {
      if (record.text !== text) continue;
      const next = ambiguous ? "unknown" : "local";
      if (record.attribution !== next) { record.attribution = next; changed = true; }
    }
    if (changed) this.bumpRevision();
  }

  reserveClear(snapshot: QueuedTextSnapshot): ClearReserveResult {
    this.clearReservation = undefined;
    const needed = this.clearCapacityNeed(snapshot);
    if (!this.canReserve(needed.count, needed.bytes)) return { ok: false, reason: "capacity" };
    this.clearReservation = needed;
    return { ok: true };
  }

  commitClear(snapshot: QueuedTextSnapshot): void {
    this.clearReservation = undefined;
    for (const [mode, texts] of [["steering", snapshot.steering], ["follow-up", snapshot.followUp]] as const) {
      for (const text of texts) {
        const bytes = Buffer.byteLength(text, "utf8");
        const sensitive = containsCredentialLikeText(text);
        this.recovered.push({
          id: randomBytes(16).toString("hex"),
          text,
          mode,
          reuse: sensitive ? "unavailable" : "reusable",
          bytes,
        });
        this.bytes += bytes;
      }
    }
    this.pending = { steering: [], followUp: [] };
    this.bumpRevision();
  }

  abandonClearReservation(): void {
    this.clearReservation = undefined;
  }

  takeRecovered(id: string): { kind: "ok"; text: string; mode: QueueMode } | { kind: "refused"; reason: "stale" | "unavailable" } {
    const peeked = this.peekRecovered(id);
    if (peeked.kind === "refused") return peeked;
    return this.discardRecovered(id).kind === "ok"
      ? { kind: "ok", text: peeked.text, mode: peeked.mode }
      : { kind: "refused", reason: "stale" };
  }

  peekRecovered(id: string): { kind: "ok"; text: string; mode: QueueMode } | { kind: "refused"; reason: "stale" | "unavailable" } {
    const record = this.recovered.find(item => item.id === id);
    if (!record) return { kind: "refused", reason: "stale" };
    if (record.reuse !== "reusable") return { kind: "refused", reason: "unavailable" };
    return { kind: "ok", text: record.text, mode: record.mode };
  }

  discardRecovered(id: string): { kind: "ok" } | { kind: "refused"; reason: "stale" } {
    const index = this.recovered.findIndex(record => record.id === id);
    if (index < 0) return { kind: "refused", reason: "stale" };
    const [record] = this.recovered.splice(index, 1);
    this.bytes -= record.bytes;
    this.bumpRevision();
    return { kind: "ok" };
  }

  capacitySnapshot(): {
    count: number;
    utf8Bytes: number;
    records: ReadonlyArray<Readonly<Pick<LocalRecord, "id" | "text" | "mode" | "delivery" | "attribution">>>;
  } {
    return {
      count: this.locals.size + this.recovered.length,
      utf8Bytes: this.bytes,
      records: [...this.locals.values()].map(({ id, text, mode, delivery, attribution }) => (
        { id, text, mode, delivery, attribution }
      )),
    };
  }

  pendingProjection(): { steering: PendingEntry[]; followUp: PendingEntry[] } {
    return {
      steering: this.pending.steering.map(text => this.projectPending(text, "steering")),
      followUp: this.pending.followUp.map(text => this.projectPending(text, "follow-up")),
    };
  }

  /** Host-only observed upstream snapshot used for clear reservation; not a Webview DTO. */
  observedPending(): QueuedTextSnapshot {
    return { steering: [...this.pending.steering], followUp: [...this.pending.followUp] };
  }

  recoveryProjection(): ReadonlyArray<{ id: string; mode: QueueMode; reuse: Reuse; text?: string }> {
    return this.recovered.map(({ id, mode, reuse, text }) => (
      reuse === "reusable" ? { id, mode, reuse, text } : { id, mode, reuse }
    ));
  }

  private projectPending(text: string, mode: QueueMode): PendingEntry {
    const reusable = !containsCredentialLikeText(text);
    const attribution = this.pendingAttribution(text, mode);
    return reusable ? { attribution, reusable: true, text } : { attribution, reusable: false };
  }

  private pendingAttribution(text: string, mode: QueueMode): Attribution {
    const localMatch = [...this.locals.values()].filter(record => record.text === text);
    if (localMatch.length === 0) return "external";
    if (localMatch.some(record => record.attribution === "unknown")) return "unknown";
    return localMatch.some(record => record.mode === mode) ? "local" : "unknown";
  }

  private clearCapacityNeed(snapshot: QueuedTextSnapshot): { count: number; bytes: number } {
    let count = 0;
    let bytes = 0;
    for (const text of [...snapshot.steering, ...snapshot.followUp]) {
      count += 1;
      bytes += Buffer.byteLength(text, "utf8");
    }
    return { count, bytes };
  }

  private canReserve(count: number, bytes: number): boolean {
    const reservedCount = this.clearReservation?.count ?? 0;
    const reservedBytes = this.clearReservation?.bytes ?? 0;
    return this.locals.size + this.recovered.length + reservedCount + count <= RECORD_LIMIT
      && this.bytes + reservedBytes + bytes <= UTF8_LIMIT;
  }

  private refuseUnattempted(record: LocalRecord): QueuedTextSendOutcome {
    this.locals.delete(record.id); this.bytes -= record.bytes;
    this.bumpRevision();
    return { kind: "refused", reason: "runtime-unavailable" };
  }

  private bumpRevision(): void {
    this.queueRevision = Math.min(Number.MAX_SAFE_INTEGER, this.queueRevision + 1);
  }
}
