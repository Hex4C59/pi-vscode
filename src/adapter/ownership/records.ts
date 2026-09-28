import { lstat, open } from "node:fs/promises";
import type { TerminalReceipt, RecoveryFence } from "./types.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function errorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : undefined;
}
export function isFence(value: unknown): value is RecoveryFence {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 5 && record.version === 1
    && [record.runId, record.hostId, record.childId].every(id => typeof id === "string" && UUID.test(id))
    && Number.isSafeInteger(record.createdAt) && (record.createdAt as number) >= 0;
}
export function isReceipt(value: unknown, fence: RecoveryFence): value is TerminalReceipt {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 7 && record.version === 1 && record.runId === fence.runId
    && record.childId === fence.childId && (record.outcome === "child-exited" || (record.outcome === "never-spawned" && record.code === null && record.signal === null))
    && (record.code === null || (Number.isSafeInteger(record.code) && (record.code as number) >= -2147483648 && (record.code as number) <= 4294967295))
    && (record.signal === null || (typeof record.signal === "string" && /^SIG[A-Z0-9]{1,16}$/.test(record.signal)))
    && Number.isSafeInteger(record.observedAt) && (record.observedAt as number) >= 0;
}
export async function readRecord(filePath: string): Promise<{ kind: "value"; value: unknown } | { kind: "missing" | "invalid" | "unavailable" }> {
  try {
    const stat = await lstat(filePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4096) return { kind: "invalid" };
    const file = await open(filePath, "r");
    try {
      const buffer = Buffer.alloc(4097);
      const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
      if (bytesRead > 4096) return { kind: "invalid" };
      try { return { kind: "value", value: JSON.parse(buffer.subarray(0, bytesRead).toString("utf8")) as unknown }; }
      catch { return { kind: "invalid" }; }
    } finally { await file.close(); }
  } catch (error) { return { kind: errorCode(error) === "ENOENT" ? "missing" : "unavailable" }; }
}
export async function writeExclusive(filePath: string, value: unknown): Promise<void> {
  const text = JSON.stringify(value);
  if (Buffer.byteLength(text) > 4096) throw new Error("Recovery metadata exceeded its bound.");
  const file = await open(filePath, "wx", 0o600);
  try { await file.writeFile(text, "utf8"); await file.sync(); }
  finally { await file.close(); }
}
