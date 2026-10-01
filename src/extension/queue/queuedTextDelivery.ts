import type { PiRuntimeLifecycle } from "../contracts/index.js";
import { QueuedTextLedger, type QueuedTextSendOutcome } from "./queuedTextLedger.js";

export type { QueuedTextSendOutcome };

/** Session-scoped local delivery retention backed by the shared host ledger budget. */
export class QueuedTextDelivery {
  private readonly ledger: QueuedTextLedger;
  constructor(runtime: Pick<PiRuntimeLifecycle, "getSession" | "prepareQueuedText">, session: number) {
    this.ledger = new QueuedTextLedger(runtime, session);
  }

  send(text: string, mode: Parameters<NonNullable<PiRuntimeLifecycle["prepareQueuedText"]>>[1], onAttempt: () => void): Promise<QueuedTextSendOutcome> {
    return this.ledger.send(text, mode, onAttempt);
  }

  snapshot(): {
    count: number;
    utf8Bytes: number;
    records: ReadonlyArray<Readonly<{ id: string; text: string; mode: "steering" | "follow-up"; delivery: string }>>;
  } {
    const snap = this.ledger.capacitySnapshot();
    return {
      count: snap.count,
      utf8Bytes: snap.utf8Bytes,
      records: snap.records.map(({ id, text, mode, delivery }) => ({ id, text, mode, delivery })),
    };
  }
}
