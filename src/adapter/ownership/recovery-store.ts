import { randomUUID } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { errorCode, isFence, isReceipt, readRecord, writeExclusive } from "./records.js";
import { pruneResolvedDiagnostics } from "./retention.js";
import type { RecoveryFence, RecoveryState, RecoveryStore } from "./types.js";

/** The fence precedes launch. Absence of a receipt never implies absence of a process. */
export function createRecoveryStore(directory: string): RecoveryStore {
  const fencePath = path.join(directory, "fence.json");
  const inspect = async (): Promise<RecoveryState> => {
    const record = await readRecord(fencePath);
    if (record.kind === "missing") return { kind: "empty" };
    if (record.kind === "unavailable") return { kind: "blocked", code: "storage-unavailable" };
    if (record.kind !== "value" || !isFence(record.value)) return { kind: "blocked", code: "invalid-record" };
    const fence = record.value;
    const receipt = await readRecord(path.join(directory, `receipt-${fence.runId}.json`));
    if (receipt.kind === "missing") return { kind: "pending", fence };
    if (receipt.kind === "unavailable") return { kind: "blocked", code: "storage-unavailable" };
    if (receipt.kind !== "value" || !isReceipt(receipt.value, fence)) return { kind: "blocked", code: "invalid-record" };
    return { kind: "terminal", fence, receipt: receipt.value };
  };
  return {
    inspect,
    async reserve() {
      const fence: RecoveryFence = { version: 1, runId: randomUUID(), hostId: randomUUID(), childId: randomUUID(), createdAt: Date.now() };
      try {
        await mkdir(directory, { recursive: true });
        await pruneResolvedDiagnostics(directory);
        await writeExclusive(fencePath, fence);
        return { ok: true, fence };
      } catch (error) {
        return { ok: false, code: errorCode(error) === "EEXIST" ? "occupied" : "storage-unavailable" };
      }
    },
    async retire(runId) {
      const before = await inspect();
      if (before.kind !== "terminal" || before.fence.runId !== runId) return { ok: false, code: "exit-unconfirmed" };
      try {
        // Exactly one retirement writer per run, including separate extension hosts.
        // A crashed writer leaves a conservative barrier rather than a guessed lock expiry.
        await writeExclusive(path.join(directory, `retire-${runId}.json`), { version: 1, runId });
        const current = await inspect();
        if (current.kind !== "terminal" || current.fence.runId !== runId) return { ok: false, code: "retirement-unconfirmed" };
        await pruneResolvedDiagnostics(directory, runId);
        await unlink(fencePath);
        return { ok: true };
      } catch { return { ok: false, code: "retirement-unconfirmed" }; }
    },
  };
}
