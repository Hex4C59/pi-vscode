import type { QueuedDraftAdmission, QueuedDraftRetention } from "../draft/index.js";
import type { PiRuntimeLifecycle, QueuedTextSnapshot, QueuedTextStateMessage, QueuedTextErrorCode, QueuedRecoveryEntry } from "../contracts/index.js";
import { QueuedTextLedger, type QueuedTextSendOutcome } from "./queuedTextLedger.js";

type QueueMode = "steering" | "follow-up";
type Phase = "idle" | "submitting" | "recalling" | "stopping";
export type DraftQueueAdmission = {
  prepareQueuedInput?(expectedRevision: number): Promise<QueuedDraftAdmission>;
  admitQueuedText(expectedRevision: number):
    | { kind: "ok"; text: string; commitAttempt: () => void }
    | { kind: "refused"; reason: "stale" | "busy" | "invalid-text" | "attachments" };
  applyRecoveredText(expectedRevision: number, text: string):
    | { kind: "ok" }
    | { kind: "refused"; reason: "stale" | "busy" | "draft-not-empty" | "invalid-text" };
};

export type QueueChatResult = QueuedTextSendOutcome | { kind: "refused"; reason: "busy" | "stale" | "invalid-text" | "attachments" | "capacity" | "runtime-unavailable" | "source-changed" | "command-unavailable" | "command-not-queueable" };
export type QueueControlResult =
  | { kind: "recalled"; snapshot: QueuedTextSnapshot }
  | { kind: "stopped"; snapshot: QueuedTextSnapshot | null; abortOk: boolean }
  | { kind: "refused"; reason: "busy" | "stale" | "capacity" | "runtime-unavailable" | "unconfirmed" };
export type RecoveredTextResult =
  | { kind: "ok" }
  | { kind: "refused"; reason: "busy" | "stale" | "unavailable" | "draft-not-empty" | "invalid-text" };

/** Serializes draft-backed queue send with one clear owner for recall/Stop. Not a Webview handler. */
export class QueuedTextCoordinator {
  private mutation: Phase = "idle";
  private lastError: QueuedTextErrorCode | null = null;

  constructor(
    private readonly draft: DraftQueueAdmission,
    private readonly ledger: QueuedTextLedger,
    private readonly runtime: Pick<PiRuntimeLifecycle, "getSession" | "prepareQueuedText" | "recallQueuedText" | "abortTask">,
  ) {}

  phase(): Phase { return this.mutation; }

  stateProjection(envelope: { version: 3; generation: number; viewId: string }): QueuedTextStateMessage {
    const recovery: QueuedRecoveryEntry[] = this.ledger.recoveryProjection().map(item => (
      item.reuse === "reusable" && item.text !== undefined
        ? { id: item.id, mode: item.mode, status: item.uncertain ? "uncertain" : "recalled", text: item.text, ...(item.attachmentCount ? { attachmentCount: item.attachmentCount } : {}) }
        : { id: item.id, mode: item.mode, status: "unavailable" }
    ));
    return {
      ...envelope,
      type: "queuedTextState",
      revision: this.ledger.revision,
      phase: this.mutation,
      error: this.lastError,
      pending: this.ledger.pendingProjection(),
      recovery,
    };
  }

  async queueChat(draftRevision: number, mode: QueueMode): Promise<QueueChatResult> {
    if (this.mutation !== "idle") return this.refuseChat("busy");
    this.mutation = "submitting";
    this.lastError = null;
    try {
      const admitted: Extract<QueuedDraftAdmission, { kind: "refused" }> | { kind: "ok"; text: string; commitAttempt(): void; isCurrent?: () => boolean; retention?: QueuedDraftRetention } = this.draft.prepareQueuedInput ? await this.draft.prepareQueuedInput(draftRevision) : this.draft.admitQueuedText(draftRevision);
      if (admitted.kind === "refused") return this.refuseChat(admitted.reason);
      if (admitted.isCurrent && !admitted.isCurrent()) return this.refuseChat("stale");
      const retention = admitted.retention;
      const result = await this.ledger.send(admitted.text, mode, () => admitted.commitAttempt(), retention);
      if (result.kind === "refused") this.lastError = result.reason;
      return result;
    } finally {
      if (this.mutation === "submitting") this.mutation = "idle";
    }
  }

  async recall(queueRevision: number): Promise<QueueControlResult> {
    if (this.mutation !== "idle") return this.refuseControl("busy");
    if (queueRevision !== this.ledger.revision) return this.refuseControl("stale");
    if (!this.runtime.recallQueuedText) return this.refuseControl("runtime-unavailable");
    const reserved = this.ledger.reserveClear(this.ledger.observedPending());
    if (!reserved.ok) return this.refuseControl("capacity");
    this.mutation = "recalling";
    this.lastError = null;
    let confirmed: QueuedTextSnapshot | undefined;
    try {
      const result = await this.runtime.recallQueuedText(this.runtime.getSession(), cleared => {
        this.ledger.commitClear(cleared);
        confirmed = cleared;
      });
      if (!result.ok || !confirmed) {
        this.ledger.abandonClearReservation();
        return this.refuseControl("unconfirmed");
      }
      return { kind: "recalled", snapshot: confirmed };
    } catch {
      this.ledger.abandonClearReservation();
      return this.refuseControl("unconfirmed");
    } finally {
      this.mutation = "idle";
    }
  }

  async stopWithRecall(): Promise<QueueControlResult> {
    if (this.mutation !== "idle" && !(this.mutation === "submitting" && this.draft.prepareQueuedInput)) return this.refuseControl("busy");
    if (!this.runtime.abortTask) return this.refuseControl("runtime-unavailable");
    const reserved = this.ledger.reserveClear(this.ledger.observedPending());
    if (!reserved.ok) return this.refuseControl("capacity");
    this.mutation = "stopping";
    this.lastError = null;
    let confirmed: QueuedTextSnapshot | null = null;
    try {
      const result = await this.runtime.abortTask(cleared => {
        this.ledger.commitClear(cleared);
        confirmed = cleared;
      });
      if (!confirmed) this.ledger.abandonClearReservation();
      if (!result.ok && !confirmed) return this.refuseControl("unconfirmed");
      return { kind: "stopped", snapshot: confirmed, abortOk: result.ok };
    } catch {
      if (!confirmed) this.ledger.abandonClearReservation();
      return confirmed
        ? { kind: "stopped", snapshot: confirmed, abortOk: false }
        : this.refuseControl("unconfirmed");
    } finally {
      this.mutation = "idle";
    }
  }

  useRecovered(id: string, draftRevision: number): RecoveredTextResult {
    if (this.mutation !== "idle") return this.refuseRecovered("busy");
    const peeked = this.ledger.peekRecovered(id);
    if (peeked.kind === "refused") return this.refuseRecovered(peeked.reason);
    const applied = peeked.retention ? peeked.retention.restore(draftRevision) : this.draft.applyRecoveredText(draftRevision, peeked.text);
    if (applied.kind === "refused") return this.refuseRecovered(applied.reason);
    this.ledger.discardRecovered(id);
    this.lastError = null;
    return { kind: "ok" };
  }

  discardRecovered(id: string): RecoveredTextResult {
    if (this.mutation !== "idle") return this.refuseRecovered("busy");
    const result = this.ledger.discardRecovered(id);
    if (result.kind === "refused") return this.refuseRecovered("stale");
    this.lastError = null;
    return { kind: "ok" };
  }

  private refuseChat(reason: Extract<QueueChatResult, { kind: "refused" }>["reason"]): QueueChatResult {
    this.lastError = reason;
    return { kind: "refused", reason };
  }

  private refuseControl(reason: Extract<QueueControlResult, { kind: "refused" }>["reason"]): QueueControlResult {
    this.lastError = reason;
    return { kind: "refused", reason };
  }

  private refuseRecovered(reason: Extract<RecoveredTextResult, { kind: "refused" }>["reason"]): RecoveredTextResult {
    this.lastError = reason;
    return { kind: "refused", reason };
  }
}
