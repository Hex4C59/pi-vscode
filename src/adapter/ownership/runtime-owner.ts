import path from "node:path";
import { launchSupervisor } from "./launch-supervisor.js";
import { access } from "node:fs/promises";
import { requestOwnedEnd, requestOwnedObservation } from "./control-client.js";
import { setTimeout as delay } from "node:timers/promises";
import { createRecoveryStore } from "./recovery-store.js";
import type { RetainedRunHandoff } from "../../extension/contracts/index.js";
import type { RuntimeOwner, RuntimeOwnerOptions } from "./types.js";

/** Longest a deliberate end may take: five seconds of SIGTERM grace plus five of SIGKILL. */
const END_DEADLINE_MS = 10_500;
/** A terminal receipt follows observed exit; allow for the write to land before retiring. */
const RECEIPT_FLUSH_DEADLINE_MS = 1_000;

export function createRuntimeOwner(
  options: RuntimeOwnerOptions,
  // Injectable so tests can exercise the deadline branches without real ten-second waits;
  // production always uses the ADR 0002 bounds.
  budgets: { endMs?: number; receiptMs?: number } = {},
): RuntimeOwner {
  const store = createRecoveryStore(options.directory);
  const endMs = budgets.endMs ?? END_DEADLINE_MS;
  const receiptMs = budgets.receiptMs ?? RECEIPT_FLUSH_DEADLINE_MS;

  /** Wait for the durable terminal receipt of exactly this run. */
  const awaitReceipt = async (runId: string, budgetMs: number): Promise<boolean> => {
    const deadline = performance.now() + budgetMs;
    while (performance.now() < deadline) {
      const observed = await store.inspect();
      if (observed.kind === "terminal" && observed.fence.runId === runId) return true;
      if (observed.kind !== "pending" || observed.fence.runId !== runId) return false;
      await delay(25);
    }
    return false;
  };

  /** Retire exactly the observed run; a failed retirement keeps the fence. */
  const retire = async (runId: string): Promise<RetainedRunHandoff> => {
    const result = await store.retire(runId);
    return result.ok ? { ok: true, outcome: "retired" } : { ok: false, code: "exit-unconfirmed" };
  };

  return {
    async launch(input) {
      try { await access(options.workerPath); } catch { return { ok: false, code: "worker-unavailable" }; }
      if (!path.isAbsolute(input.cwd) || !path.isAbsolute(input.cliPath) || !Array.isArray(input.args)
        || input.args.some(arg => typeof arg !== "string" || arg.includes("\0"))
        || Buffer.byteLength(JSON.stringify({ cliPath: input.cliPath, args: input.args, cwd: input.cwd })) > 60_000) {
        return { ok: false, code: "startup-unconfirmed" };
      }
      const reservation = await store.reserve();
      if (!reservation.ok) return reservation;
      return launchSupervisor(options, input, reservation.fence);
    },
    inspect: store.inspect,
    async end() {
      const state = await store.inspect();
      if (state.kind === "terminal") return { ok: true };
      if (state.kind !== "pending") return { ok: false, code: "exit-unconfirmed" };
      if (!await requestOwnedEnd(options.directory, state.fence.runId)) return { ok: false, code: "owner-unavailable" };
      return await awaitReceipt(state.fence.runId, endMs) ? { ok: true } : { ok: false, code: "exit-unconfirmed" };
    },
    async recover() {
      const state = await store.inspect();
      if (state.kind !== "terminal") return { ok: false, code: "exit-unconfirmed" };
      return store.retire(state.fence.runId);
    },
    async handoff() {
      const state = await store.inspect();
      if (state.kind === "empty") return { ok: true, outcome: "none" };
      if (state.kind === "blocked") return { ok: false, code: "blocked", reason: state.code };
      const runId = state.fence.runId;
      // A run this host already observed exiting is retired without asking anyone to end it.
      if (state.kind === "terminal") return retire(runId);

      // Only a run whose owner is gone is a leftover. A live owner belongs to another host,
      // and ending it here would destroy work that host is still running.
      const observed = await requestOwnedObservation(options.directory, runId);
      if (observed === undefined) return { ok: false, code: "owner-unavailable" };
      if (observed === "owned") return { ok: true, outcome: "live-owner" };
      if (observed === "termination-unconfirmed") return { ok: false, code: "exit-unconfirmed" };
      if (observed === "exited" || observed === "never-spawned") {
        return await awaitReceipt(runId, receiptMs)
          ? retire(runId) : { ok: false, code: "exit-unconfirmed" };
      }
      if (!await requestOwnedEnd(options.directory, runId)) return { ok: false, code: "owner-unavailable" };
      return await awaitReceipt(runId, endMs) ? retire(runId) : { ok: false, code: "exit-unconfirmed" };
    },
  };
}
