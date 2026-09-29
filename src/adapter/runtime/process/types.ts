import type { Readable, Writable } from "node:stream";

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
  describeFailure(reason: ProcessFailure): string;
};
