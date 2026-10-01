import type { Writable } from "node:stream";
import type { AttachmentPromptResult } from "../../../extension/contracts/index.js";
import type { RpcReplyResult } from "./rpc-replies.js";

const WRITE_TIMEOUT_MS = 5000;
const ACK_TIMEOUT_MS = 30000;

type Delivery = AttachmentPromptResult["delivery"];
type Code = AttachmentPromptResult["code"];
type QueueSendContext = {
  requestId: string;
  command: "steer" | "follow_up";
  admit(): Writable | undefined;
  isCurrent(): boolean;
  canWrite(): boolean;
  watch(settle: (reply: RpcReplyResult) => void): void;
  drop(): void;
  track(pending: Promise<AttachmentPromptResult>): void;
  onUnknown(): void;
};

/** Owns one write/ACK observation, never ordinary prompt or agent occupancy. */
class QueuedWriteAttempt {
  private resolve!: (result: AttachmentPromptResult) => void;
  private reply: RpcReplyResult | undefined;
  private finished = false;
  private callback = false;
  private drained = false;
  private returned = false;
  private writeObserved = false;
  private writeDeadline = 0;
  private ackDeadline = 0;
  private writeTimer: ReturnType<typeof setTimeout> | undefined;
  private ackTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private context: QueueSendContext, private stream: Writable, private frame: string) {}

  send(onAttempt: () => void): Promise<AttachmentPromptResult> {
    const pending = new Promise<AttachmentPromptResult>(resolve => { this.resolve = resolve; });
    this.context.track(pending); // Publish ownership before the host admission callback can request Stop.
    this.start(onAttempt);
    return pending;
  }

  private start(onAttempt: () => void): void {
    const started = performance.now();
    this.writeDeadline = started + WRITE_TIMEOUT_MS;
    this.ackDeadline = started + ACK_TIMEOUT_MS;
    this.writeTimer = setTimeout(this.lost, WRITE_TIMEOUT_MS);
    this.ackTimer = setTimeout(() => this.finish("unknown", "ack-timeout"), ACK_TIMEOUT_MS);
    this.context.watch(reply => { this.reply = reply; this.check(); });
    this.stream.on("error", this.lost); this.stream.on("close", this.lost); this.stream.on("drain", this.drain);
    try {
      onAttempt();
      if (this.finished) return;
      if (!this.context.canWrite()) { this.finish("not-sent", "runtime-lost"); return; }
      const accepted = this.stream.write(this.frame, error => {
        if (error) this.lost(); else { this.callback = true; this.check(); }
      });
      this.drained ||= accepted;
      this.returned = true;
      this.frame = "";
      this.check();
    } catch { this.lost(); }
  }

  private lost = (): void => this.finish("unknown", "write-failed");
  private drain = (): void => { this.drained = true; this.check(); };

  private check(): void {
    if (this.finished) return;
    if (this.reply?.kind === "failure") { this.finish("unknown", "runtime-lost"); return; }
    const now = performance.now();
    if (now >= this.ackDeadline) { this.finish("unknown", "ack-timeout"); return; }
    if (!this.writeObserved) {
      if (now >= this.writeDeadline) { this.lost(); return; }
      if (!this.returned || !this.callback || !this.drained) return;
      this.writeObserved = true;
      clearTimeout(this.writeTimer);
    }
    if (this.reply?.kind !== "response") return;
    if (!this.context.isCurrent()) { this.finish("unknown", "runtime-lost"); return; }
    const accepted = this.reply.response.success;
    this.finish(accepted ? "rpc-accepted" : "rpc-rejected", accepted ? undefined : "rpc-rejected");
  }

  private finish(delivery: Delivery, code?: Code): void {
    if (this.finished) return;
    this.finished = true;
    clearTimeout(this.writeTimer); clearTimeout(this.ackTimer);
    this.context.drop();
    this.stream.off("error", this.lost); this.stream.off("close", this.lost); this.stream.off("drain", this.drain);
    this.frame = "";
    this.resolve({ delivery, ...(code ? { code } : {}) });
    if (delivery === "unknown" && this.reply?.kind !== "failure" && this.context.isCurrent()) this.context.onUnknown();
  }
}

/** A token is consumed even when admission fails; neither caller nor ACK can replay it. */
export function prepareQueuedTextSend(context: QueueSendContext, initialFrame: string): {
  send(onAttempt: () => void): Promise<AttachmentPromptResult>;
} {
  let consumed = false;
  let frame = initialFrame;
  return { send(onAttempt) {
    if (consumed) return Promise.resolve({ delivery: "not-sent", code: "runtime-lost" });
    consumed = true;
    const stream = context.admit();
    if (!stream) { frame = ""; return Promise.resolve({ delivery: "not-sent", code: "runtime-lost" }); }
    const attempt = new QueuedWriteAttempt(context, stream, frame);
    frame = "";
    return attempt.send(onAttempt);
  } };
}
