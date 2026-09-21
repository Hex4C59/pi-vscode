export type RuntimePhase = "not-started" | "starting" | "ready" | "stopping" | "error";

export type ProjectTrustFlag = "approve" | "no-approve";

export type RuntimeStartResult = { ok: true } | { ok: false; detail: string };

/** Host-owned pi subprocess lifecycle; implemented in adapter, injected from extension entry. */
export interface PiRuntimeLifecycle {
  start(options: { cwd: string; projectTrust: ProjectTrustFlag }): Promise<RuntimeStartResult>;
  stop(): Promise<void>;
}

export const noopPiRuntimeLifecycle: PiRuntimeLifecycle = {
  async start() {
    return { ok: true };
  },
  async stop() {
    /* WI-006 tests: no subprocess */
  },
};
