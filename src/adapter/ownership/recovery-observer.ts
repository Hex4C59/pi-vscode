import path from "node:path";
import { rename } from "node:fs/promises";
import { createRecoveryStore } from "./recovery-store.js";
import { isReceipt, writeExclusive } from "./records.js";
import type { TerminalReceipt, RecoveryFence, RecoveryObserver } from "./types.js";

export function createRecoveryObserver(directory: string, fence: RecoveryFence): RecoveryObserver {
  const record = async (outcome: TerminalReceipt["outcome"], code: number | null, signal: string | null): ReturnType<RecoveryObserver["recordExit"]> => {
    const current = await createRecoveryStore(directory).inspect();
    if (current.kind !== "pending" || current.fence.runId !== fence.runId || current.fence.childId !== fence.childId) return { ok: false, code: "invalid-record" };
    const receipt: TerminalReceipt = { version: 1, runId: fence.runId, childId: fence.childId, outcome, code, signal, observedAt: Date.now() };
    if (!isReceipt(receipt, fence)) return { ok: false, code: "invalid-record" };
    const destination = path.join(directory, `receipt-${fence.runId}.json`);
    try {
      await writeExclusive(`${destination}.pending`, receipt);
      await rename(`${destination}.pending`, destination);
      return { ok: true };
    } catch { return { ok: false, code: "storage-unavailable" }; }
  };
  return {
    recordExit: (code, signal) => record("child-exited", code, signal),
    recordNeverSpawned: () => record("never-spawned", null, null),
  };
}
