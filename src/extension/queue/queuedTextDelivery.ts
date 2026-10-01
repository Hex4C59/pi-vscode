import { randomBytes } from "node:crypto";
import type { AttachmentPromptResult, PiRuntimeLifecycle } from "../contracts/index.js";
import { containsCredentialLikeText } from "../contracts/index.js";

type QueueMode = Parameters<NonNullable<PiRuntimeLifecycle["prepareQueuedText"]>>[1];
type RecordDelivery = AttachmentPromptResult["delivery"] | "pending";
type RetainedRecord = { id: string; text: string; mode: QueueMode; delivery: RecordDelivery; bytes: number; attempted: boolean };
export type QueuedTextSendOutcome = { kind: "refused"; reason: "capacity" | "runtime-unavailable" | "invalid-text" }
  | { kind: "observed"; id: string; result: AttachmentPromptResult };
const RECORD_LIMIT = 32;
const UTF8_LIMIT = 256 * 1024;

/** Session-scoped, host-only local delivery retention; never a Webview projection.
 * DraftSubmission remains the owner of attachment/revision admission and its commit.
 * ACK is a receipt, not consumption. No clear, automatic eviction or storage here.
 */
export class QueuedTextDelivery {
  private readonly records = new Map<string, RetainedRecord>();
  private bytes = 0;
  constructor(private readonly runtime: Pick<PiRuntimeLifecycle, "getSession" | "prepareQueuedText">, private readonly session: number) {}

  async send(text: string, mode: QueueMode, onAttempt: () => void): Promise<QueuedTextSendOutcome> {
    if (!this.session || this.runtime.getSession() !== this.session || !this.runtime.prepareQueuedText) return { kind: "refused", reason: "runtime-unavailable" };
    if (typeof text !== "string" || !text.trim() || text.length > 8000 || text.trimStart().startsWith("/")
      || containsCredentialLikeText(text) || (mode !== "steering" && mode !== "follow-up")) return { kind: "refused", reason: "invalid-text" };
    const bytes = Buffer.byteLength(text, "utf8");
    if (this.records.size >= RECORD_LIMIT || this.bytes + bytes > UTF8_LIMIT) return { kind: "refused", reason: "capacity" };
    const record: RetainedRecord = { id: randomBytes(16).toString("hex"), text, mode, bytes, delivery: "pending", attempted: false };
    this.records.set(record.id, record); this.bytes += bytes;
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

  snapshot(): { count: number; utf8Bytes: number; records: ReadonlyArray<Readonly<Pick<RetainedRecord, "id" | "text" | "mode" | "delivery">>> } {
    return { count: this.records.size, utf8Bytes: this.bytes,
      records: [...this.records.values()].map(({ id, text, mode, delivery }) => ({ id, text, mode, delivery })) };
  }

  private refuseUnattempted(record: RetainedRecord): QueuedTextSendOutcome {
    this.records.delete(record.id); this.bytes -= record.bytes;
    return { kind: "refused", reason: "runtime-unavailable" };
  }
}
