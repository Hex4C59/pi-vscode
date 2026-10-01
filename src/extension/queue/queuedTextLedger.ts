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

type PendingEntry = { text: string; attribution: Attribution; reusable: boolean };

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

  constructor(
    private readonly runtime: Pick<PiRuntimeLifecycle, "getSession" | "prepareQueuedText">,
    private readonly session: number,
  ) {}

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
    this.locals.set(record.id, record); this.bytes += bytes;
    try {
      const token = this.runtime.prepareQueuedText(text, mode, this.session);
      const result = await token.send(() => { record.attempted = true; onAttempt(); });
      if (!record.attempted && result.delivery === "not-sent") return this.refuseUnattempted(record);
      record.delivery = result.delivery;
      return { kind: "observed", id: record.id, result };
    } catch {
      if (!record.attempted) return this.refuseUnattempted(record);
      record.delivery = "unknown";
      return { kind: "observed", id: record.id, result: { delivery: "unknown", code: "runtime-lost" } };
    }
  }

  observeQueueUpdated(session: number, snapshot: QueuedTextSnapshot): void {
    if (session !== this.session) return;
    this.pending = { steering: [...snapshot.steering], followUp: [...snapshot.followUp] };
  }

  observeUserStarted(session: number, text: string | null): void {
    if (session !== this.session || text === null) return;
    const steeringHits = this.pending.steering.filter(entry => entry === text).length;
    const followUpHits = this.pending.followUp.filter(entry => entry === text).length;
    if (steeringHits + followUpHits === 0) return;
    const ambiguous = (steeringHits > 0 && followUpHits > 0)
      || [...this.locals.values()].filter(record => record.text === text).length > 1;
    for (const record of this.locals.values()) {
      if (record.text !== text) continue;
      record.attribution = ambiguous ? "unknown" : "local";
    }
  }

  reserveClear(snapshot: QueuedTextSnapshot): ClearReserveResult {
    this.clearReservation = undefined;
    const needed = this.clearCapacityNeed(snapshot);
    if (!this.canReserve(needed.count, needed.bytes)) return { ok: false, reason: "capacity" };
    this.clearReservation = needed;
    return { ok: true };
  }

  commitClear(snapshot: QueuedTextSnapshot): void {
    const needed = this.clearReservation ?? this.clearCapacityNeed(snapshot);
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
    void needed;
  }

  abandonClearReservation(): void {
    this.clearReservation = undefined;
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
    const localMatch = [...this.locals.values()].filter(record => record.text === text);
    if (localMatch.length === 0) return { text, attribution: "external", reusable };
    if (localMatch.some(record => record.attribution === "unknown")) {
      return { text, attribution: "unknown", reusable };
    }
    const sameMode = localMatch.filter(record => record.mode === mode);
    if (sameMode.length === 0) return { text, attribution: "unknown", reusable };
    return { text, attribution: "local", reusable };
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
    return { kind: "refused", reason: "runtime-unavailable" };
  }
}
