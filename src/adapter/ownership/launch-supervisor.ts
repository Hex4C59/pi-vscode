import { spawn } from "node:child_process";
import { createRecoveryObserver } from "./recovery-observer.js";
import type { RecoveryFence, RuntimeOwnerLaunch, RuntimeOwnerLaunchResult, RuntimeOwnerOptions } from "./types.js";

/** Parent-private startup channel; public RPC travels only on the resulting standard streams. */
export function launchSupervisor(options: RuntimeOwnerOptions, input: RuntimeOwnerLaunch, fence: RecoveryFence): Promise<RuntimeOwnerLaunchResult> {
  return new Promise(resolve => {
    let worker;
    try {
      worker = spawn(process.execPath, [options.workerPath, "--owned-runtime", options.directory, fence.runId], {
        cwd: input.cwd, env: input.env, detached: true, windowsHide: true,
        stdio: ["pipe", "pipe", "pipe", "ipc"],
      });
    } catch {
      void createRecoveryObserver(options.directory, fence).recordNeverSpawned().then(
        () => resolve({ ok: false, code: "startup-unconfirmed" }),
        () => resolve({ ok: false, code: "startup-unconfirmed" }),
      );
      return;
    }
    const child = worker;
    let done = false;
    let spawned = false;
    const finish = (ok: boolean): void => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      child.off("message", message);
      child.off("close", closed);
      if (ok) resolve({ ok: true, process: child, runId: fence.runId });
      else {
        // Losing the product transport is not permission to terminate unknown child work.
        if (child.connected) { try { child.disconnect(); } catch { /* Receipt remains authoritative. */ } }
        child.stdin?.end();
        child.stdout?.resume();
        resolve({ ok: false, code: "startup-unconfirmed" });
      }
    };
    const message = (value: unknown): void => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return;
      const record = value as Record<string, unknown>;
      if (Object.keys(record).length === 5 && record.version === 1 && record.type === "spawned"
        && record.runId === fence.runId && record.childId === fence.childId
        && Number.isSafeInteger(record.pid) && (record.pid as number) > 0) finish(true);
    };
    const closed = (): void => finish(false);
    const timer = setTimeout(() => finish(false), 15_000);
    child.once("spawn", () => { spawned = true; });
    child.on("message", message);
    child.once("close", closed);
    child.on("error", () => {
      if (!spawned && !done) {
        void createRecoveryObserver(options.directory, fence).recordNeverSpawned().then(() => finish(false), () => finish(false));
      } else finish(false);
    });
    child.stdin?.on("error", () => finish(false));
    child.stderr?.resume();
    child.send({ version: 1, type: "initialize", runId: fence.runId, cliPath: input.cliPath, args: input.args, cwd: input.cwd }, error => { if (error) finish(false); });
  });
}
