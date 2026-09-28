import { opendir, unlink } from "node:fs/promises";
import path from "node:path";
import { isFence, isReceipt, readRecord } from "./records.js";

/** Prune only validated, terminal, retired runs. Unknown/partial/current evidence is never evicted. */
export async function pruneResolvedDiagnostics(directory: string, retiringRun?: string): Promise<void> {
  const resolved: { runId: string; observedAt: number }[] = [];
  const entries = await opendir(directory, { bufferSize: 32 });
  let seen = 0;
  for await (const entry of entries) {
    if (++seen > 128) throw new Error("Recovery directory exceeded its admission budget.");
    const match = /^receipt-([0-9a-f-]{36})\.json$/.exec(entry.name);
    if (!match || !entry.isFile() || entry.isSymbolicLink()) continue;
    const runId = match[1];
    const receipt = await readRecord(path.join(directory, entry.name));
    const claim = await readRecord(path.join(directory, `retire-${runId}.json`));
    if (receipt.kind !== "value" || !receipt.value || typeof receipt.value !== "object"
      || claim.kind !== "value" || !claim.value || typeof claim.value !== "object") continue;
    const claimed = claim.value as Record<string, unknown>;
    const syntheticFence = { version: 1, runId, childId: (receipt.value as Record<string, unknown>).childId, hostId: runId, createdAt: 0 };
    if (Object.keys(claimed).length !== 2 || claimed.version !== 1 || claimed.runId !== runId
      || !isFence(syntheticFence) || !isReceipt(receipt.value, syntheticFence)) continue;
    const active = await readRecord(path.join(directory, "fence.json"));
    if (active.kind !== "missing" && (active.kind !== "value" || !isFence(active.value) || (active.value.runId === runId && runId !== retiringRun))) continue;
    resolved.push({ runId, observedAt: receipt.value.observedAt });
  }
  resolved.sort((a, b) => b.observedAt - a.observedAt || a.runId.localeCompare(b.runId));
  for (const item of resolved.slice(16)) {
    if (item.runId === retiringRun) continue;
    // The records establish retirement; names only locate those already-validated records.
    for (const prefix of ["receipt", "retire"]) {
      const target = path.resolve(directory, `${prefix}-${item.runId}.json`);
      if (path.dirname(target) !== path.resolve(directory)) throw new Error("Invalid recovery cleanup boundary.");
      await unlink(target);
    }
  }
}
