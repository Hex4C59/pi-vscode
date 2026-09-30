import type { ChildProcess } from "node:child_process";
import type { RetainedRunHandoff, RetainedRunState } from "../../extension/contracts/index.js";

export type { RetainedRunState };

/** Host-only lifecycle metadata. Never contains prompts, credentials or session contents. */
export type RecoveryFence = { version: 1; runId: string; hostId: string; childId: string; createdAt: number };
export type TerminalReceipt = { version: 1; runId: string; childId: string; outcome: "child-exited" | "never-spawned"; code: number | null; signal: string | null; observedAt: number };
export type RecoveryState = { kind: "empty" } | { kind: "pending"; fence: RecoveryFence }
  | { kind: "terminal"; fence: RecoveryFence; receipt: TerminalReceipt }
  | { kind: "blocked"; code: "storage-unavailable" | "invalid-record" };
export type RecoveryStore = {
  inspect(): Promise<RecoveryState>;
  reserve(): Promise<{ ok: true; fence: RecoveryFence } | { ok: false; code: "occupied" | "storage-unavailable" }>;
  retire(runId: string): Promise<{ ok: true } | { ok: false; code: "exit-unconfirmed" | "retirement-unconfirmed" }>;
};
/** Only the direct spawning observer uses this writer capability. */
export type RecoveryObserver = {
  recordNeverSpawned(): Promise<{ ok: true } | { ok: false; code: "storage-unavailable" | "invalid-record" }>;
  recordExit(code: number | null, signal: string | null): Promise<{ ok: true } | { ok: false; code: "storage-unavailable" | "invalid-record" }>;
};

export type RuntimeOwnerLaunch = { cwd: string; cliPath: string; args: string[]; env: NodeJS.ProcessEnv };
export type RuntimeOwnerLaunchResult = { ok: true; process: ChildProcess; runId: string }
  | { ok: false; code: "worker-unavailable" | "occupied" | "storage-unavailable" | "startup-unconfirmed" };
export type RuntimeOwner = {
  launch(input: RuntimeOwnerLaunch): Promise<RuntimeOwnerLaunchResult>;
  inspect(): Promise<RecoveryState>;
  end(): Promise<{ ok: true } | { ok: false; code: "owner-unavailable" | "exit-unconfirmed" }>;
  recover(): ReturnType<RecoveryStore["retire"]>;
  /** Startup handoff for a retained run: only an owner-lost run is ended, never a live owner. */
  handoff(): Promise<RetainedRunHandoff>;
};
export type RuntimeOwnerOptions = { directory: string; workerPath: string };
