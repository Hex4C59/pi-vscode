import path from "node:path";
import { launchSupervisor } from "./launch-supervisor.js";
import { access } from "node:fs/promises";
import { requestOwnedEnd } from "./control-client.js";
import { setTimeout as delay } from "node:timers/promises";
import { createRecoveryStore } from "./recovery-store.js";
import type { RuntimeOwner, RuntimeOwnerOptions } from "./types.js";
export function createRuntimeOwner(options: RuntimeOwnerOptions): RuntimeOwner {
  const store = createRecoveryStore(options.directory);
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
      const deadline = performance.now() + 10_500;
      while (performance.now() < deadline) {
        const observed = await store.inspect();
        if (observed.kind === "terminal" && observed.fence.runId === state.fence.runId) return { ok: true };
        if (observed.kind !== "pending" || observed.fence.runId !== state.fence.runId) return { ok: false, code: "exit-unconfirmed" };
        await delay(25);
      }
      return { ok: false, code: "exit-unconfirmed" };
    },
    async recover() {
      const state = await store.inspect();
      if (state.kind !== "terminal") return { ok: false, code: "exit-unconfirmed" };
      return store.retire(state.fence.runId);
    },
  };
}
