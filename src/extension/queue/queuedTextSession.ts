import type { PiRuntimeLifecycle, RuntimeEvent, QueuedTextStateMessage, WebviewMessage } from "../contracts/index.js";
import { QueuedTextLedger } from "./queuedTextLedger.js";
import { QueuedTextCoordinator, type QueueControlResult } from "./queuedTextCoordinator.js";

type DraftQueueOwner = {
  admitQueuedText(expectedRevision: number):
    | { kind: "ok"; text: string; commitAttempt: () => void }
    | { kind: "refused"; reason: "stale" | "busy" | "invalid-text" | "attachments" };
  applyRecoveredText(expectedRevision: number, text: string):
    | { kind: "ok" }
    | { kind: "refused"; reason: "stale" | "busy" | "draft-not-empty" | "invalid-text" };
};

/** Session-scoped host owner for Living queue intents; provider recreates on runtime session change. */
export class QueuedTextSession {
  private readonly ledger: QueuedTextLedger;
  private readonly coordinator: QueuedTextCoordinator;

  constructor(
    runtime: PiRuntimeLifecycle,
    draft: DraftQueueOwner,
    private readonly session: number,
  ) {
    this.ledger = new QueuedTextLedger(runtime, session);
    this.coordinator = new QueuedTextCoordinator(draft, this.ledger, runtime);
  }

  get runtimeSession(): number { return this.session; }

  observe(event: RuntimeEvent): boolean {
    if (event.session !== this.session) return false;
    if (event.kind === "queue_updated") {
      this.ledger.observeQueueUpdated(event.session, { steering: event.steering, followUp: event.followUp });
      return true;
    }
    if (event.kind === "user_message_started") {
      this.ledger.observeUserStarted(event.session, event.text);
      return true;
    }
    return false;
  }

  projection(envelope: { version: 3; generation: number; viewId: string }): QueuedTextStateMessage {
    return this.coordinator.stateProjection(envelope);
  }

  /** Sync undefined for non-queue intents so Stop and other handlers do not await a microtask. */
  handle(message: WebviewMessage): Promise<boolean> | undefined {
    switch (message.type) {
      case "queueChat":
        return this.coordinator.queueChat(message.draftRevision, message.mode).then(() => true);
      case "recallQueuedText":
        return this.coordinator.recall(message.queueRevision).then(() => true);
      case "useRecoveredText":
        this.coordinator.useRecovered(message.id, message.draftRevision);
        return Promise.resolve(true);
      case "discardRecoveredText":
        this.coordinator.discardRecovered(message.id);
        return Promise.resolve(true);
      default:
        return undefined;
    }
  }

  stopWithRecall(): Promise<QueueControlResult> {
    return this.coordinator.stopWithRecall();
  }
}
