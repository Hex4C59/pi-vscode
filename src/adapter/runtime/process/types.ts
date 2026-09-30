import type { Readable, Writable } from "node:stream";
import type { RetainedRunHandoff } from "../../../extension/contracts/index.js";

/** RPC capabilities only; process termination is deliberately absent. */
export type RuntimeLink = {
  stdin: Writable;
  stdout: Readable;
  onLost(listener: () => void): () => void;
};
export type ProcessLaunch = { cwd: string; cliPath: string; args: string[]; env: NodeJS.ProcessEnv };
export type ProcessResult = { ok: true } | { ok: false; detail: string };
export type ProcessFailure = "prompt-ack" | "prompt-delivery" | "reply-delivery" | "interaction" | "stop-unconfirmed" | "stop-failed";
/** One instance owns one runtime's launches. Methods settle with bounded, safe results.
 * release invalidates a pending launch synchronously; late links never reach RPC.
 * Only recover may clear an uncertain managed run after matching exit evidence.
 */
export type RuntimeProcess = {
  launch(input: ProcessLaunch): Promise<{ ok: true; link: RuntimeLink } | { ok: false; detail: string }>;
  release(reason: "idle" | "uncertain"): Promise<void>;
  inspect(): Promise<"none" | "pending" | "terminal" | "blocked">;
  end(): Promise<ProcessResult>;
  recover(): Promise<ProcessResult>;
  /** Startup handoff for a retained run; never runs while a launch is in flight or a run is active here. */
  handoff(): Promise<RetainedRunHandoff>;
  describeFailure(reason: ProcessFailure): string;
};
