import type { PiRuntimeLifecycle, QueuedTextSnapshot } from "../contracts/index.js";
import { QueuedTextLedger, type QueuedTextSendOutcome } from "./queuedTextLedger.js";

type QueueMode = "steering" | "follow-up";
type Phase = "idle" | "submitting" | "recalling" | "stopping";
type DraftQueueAdmission = {
  admitQueuedText(expectedRevision: number):
    | { kind: "ok"; text: string; commitAttempt: () => void }
    | { kind: "refused"; reason: "stale" | "busy" | "invalid-text" | "attachments" };
};

export type QueueChatResult = QueuedTextSendOutcome | { kind: "refused"; reason: "busy" | "stale" | "invalid-text" | "attachments" | "capacity" | "runtime-unavailable" };
export type QueueControlResult =
  | { kind: "recalled"; snapshot: QueuedTextSnapshot }
  | { kind: "stopped"; snapshot: QueuedTextSnapshot | null; abortOk: boolean }
  | { kind: "refused"; reason: "busy" | "capacity" | "runtime-unavailable" | "unconfirmed" };

/** Serializes draft-backed queue send with one clear owner for recall/Stop. Not a Webview handler. */
export class QueuedTextCoordinator {
  private mutation: Phase = "idle";

  constructor(
    private readonly draft: DraftQueueAdmission,
    private readonly ledger: QueuedTextLedger,
    private readonly runtime: Pick<PiRuntimeLifecycle, "getSession" | "prepareQueuedText" | "recallQueuedText" | "abortTask">,
  ) {}

  phase(): Phase { return this.mutation; }

  async queueChat(draftRevision: number, mode: QueueMode): Promise<QueueChatResult> {
    if (this.mutation !== "idle") return { kind: "refused", reason: "busy" };
    const admitted = this.draft.admitQueuedText(draftRevision);
    if (admitted.kind === "refused") return admitted;
    this.mutation = "submitting";
    try {
      return await this.ledger.send(admitted.text, mode, () => admitted.commitAttempt());
    } finally {
      this.mutation = "idle";
    }
  }

  async recall(): Promise<QueueControlResult> {
    if (this.mutation !== "idle") return { kind: "refused", reason: "busy" };
    if (!this.runtime.recallQueuedText) return { kind: "refused", reason: "runtime-unavailable" };
    const reserved = this.ledger.reserveClear(this.ledger.observedPending());
    if (!reserved.ok) return { kind: "refused", reason: "capacity" };
    this.mutation = "recalling";
    let confirmed: QueuedTextSnapshot | undefined;
    try {
      const result = await this.runtime.recallQueuedText(this.runtime.getSession(), cleared => {
        this.ledger.commitClear(cleared);
        confirmed = cleared;
      });
      if (!result.ok || !confirmed) {
        this.ledger.abandonClearReservation();
        return { kind: "refused", reason: "unconfirmed" };
      }
      return { kind: "recalled", snapshot: confirmed };
    } catch {
      this.ledger.abandonClearReservation();
      return { kind: "refused", reason: "unconfirmed" };
    } finally {
      this.mutation = "idle";
    }
  }

  async stopWithRecall(): Promise<QueueControlResult> {
    if (this.mutation !== "idle") return { kind: "refused", reason: "busy" };
    if (!this.runtime.abortTask) return { kind: "refused", reason: "runtime-unavailable" };
    const reserved = this.ledger.reserveClear(this.ledger.observedPending());
    if (!reserved.ok) return { kind: "refused", reason: "capacity" };
    this.mutation = "stopping";
    let confirmed: QueuedTextSnapshot | null = null;
    try {
      const result = await this.runtime.abortTask(cleared => {
        this.ledger.commitClear(cleared);
        confirmed = cleared;
      });
      if (!confirmed) this.ledger.abandonClearReservation();
      if (!result.ok && !confirmed) return { kind: "refused", reason: "unconfirmed" };
      return { kind: "stopped", snapshot: confirmed, abortOk: result.ok };
    } catch {
      if (!confirmed) this.ledger.abandonClearReservation();
      return confirmed
        ? { kind: "stopped", snapshot: confirmed, abortOk: false }
        : { kind: "refused", reason: "unconfirmed" };
    } finally {
      this.mutation = "idle";
    }
  }
}
