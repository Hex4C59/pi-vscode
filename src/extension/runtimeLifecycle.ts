export type RuntimePhase = "not-started" | "starting" | "ready" | "stopping" | "error";

export type ProjectTrustFlag = "approve" | "no-approve";

export type RuntimeStartResult =
  | { ok: true; modelLabel: string | null }
  | { ok: false; detail: string };

export type PromptResult = { ok: true } | { ok: false; detail: string };

export type RuntimeEvent =
  | { kind: "text_delta"; session: number; delta: string }
  | { kind: "stream_error"; session: number; detail: string }
  | { kind: "agent_settled"; session: number };

/** Host-owned pi subprocess lifecycle; implemented in adapter, injected from extension entry. */
export interface PiRuntimeLifecycle {
  start(options: { cwd: string; projectTrust: ProjectTrustFlag }): Promise<RuntimeStartResult>;
  stop(): Promise<void>;
  /** Increments when a new subprocess session becomes active; used to drop stale RPC events. */
  getSession(): number;
  subscribe(listener: (event: RuntimeEvent) => void): () => void;
  prompt(text: string): Promise<PromptResult>;
}

export const noopPiRuntimeLifecycle: PiRuntimeLifecycle = {
  async start() {
    return { ok: true, modelLabel: null };
  },
  async stop() {
    /* WI-006 tests: no subprocess */
  },
  getSession() {
    return 0;
  },
  subscribe() {
    return () => undefined;
  },
  async prompt() {
    return { ok: false, detail: "Runtime not available." };
  },
};
