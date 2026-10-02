import type { PiRuntimeLifecycle, SessionUsageStateMessage } from "../contracts/index.js";

type Context = { generation: number; session: number; ready: boolean; busy: boolean; disposed: boolean };
type Projection = Omit<SessionUsageStateMessage, "version" | "type" | "generation" | "viewId">;

/** One host-owned read flight; replacement invalidates both snapshot and late reply. */
export class SessionUsageOwner {
  private identity = "";
  private epoch = 0;
  private flight: Promise<void> | undefined;
  private value: Projection = { revision: 0, status: "no-session", usage: null };
  constructor(private readonly runtime: () => PiRuntimeLifecycle, private readonly context: () => Context,
    private readonly changed: () => void) {}
  snapshot(): Projection {
    this.synchronize();
    return this.value;
  }
  private synchronize(): Context {
    const context = this.context();
    const identity = `${context.generation}:${context.session}:${context.ready && !context.disposed}`;
    if (identity !== this.identity) {
      this.identity = identity; this.epoch++; this.flight = undefined; this.pending = false;
      this.value = { revision: this.value.revision + 1, status: context.ready ? "unavailable" : "no-session", usage: null };
    }
    return context;
  }
  private pending = false;
  refreshWhenIdle(): void { this.synchronize(); this.pending = true; this.flushPending(); }
  flushPending(): void { if (this.pending) void this.refresh(); }
  refresh(): Promise<void> {
    const context = this.synchronize();
    if (context.disposed || !context.ready || context.busy) return Promise.resolve();
    if (this.flight) return this.flight;
    this.pending = false;
    const epoch = this.epoch;
    this.value = { revision: this.value.revision + 1, status: "loading", usage: null };
    this.changed();
    const flight = this.read(context.session, epoch);
    this.flight = flight;
    void flight.finally(() => {
      if (this.flight !== flight) return;
      this.flight = undefined;
      const context = this.synchronize();
      if (epoch === this.epoch && !context.disposed) this.flushPending();
    });
    return flight;
  }
  private async read(session: number, epoch: number): Promise<void> {
    try {
      const result = await this.runtime().getSessionUsage?.(session);
      this.synchronize();
      if (epoch !== this.epoch || this.context().disposed) return;
      this.value = result?.ok
        ? { revision: this.value.revision + 1, status: "ready", usage: result.usage }
        : { revision: this.value.revision + 1, status: "unavailable", usage: null };
    } catch {
      this.synchronize();
      if (epoch !== this.epoch || this.context().disposed) return;
      this.value = { revision: this.value.revision + 1, status: "unavailable", usage: null };
    }
    this.changed();
  }
  dispose(): void { this.epoch++; this.flight = undefined; this.pending = false; }
}
