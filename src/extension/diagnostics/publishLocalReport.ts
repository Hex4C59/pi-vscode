import path from "node:path";
import { link, mkdtemp, open, rm } from "node:fs/promises";
export class DiagnosticCleanupError extends Error {
  constructor(readonly published: boolean) { super("Diagnostic temporary cleanup incomplete"); }
}
/** Private temporary write then exclusive publication; never overwrite user data. */
export async function publishLocalReport(destination: string, bytes: string, current: () => boolean): Promise<boolean> {
  if (!current() || Buffer.byteLength(bytes) > 4096) return false;
  const temporary = await mkdtemp(path.join(path.dirname(destination), ".pi-diagnostic-"));
  let handle; let published = false; let cleanupFailed = false;
  try {
    const staged = path.join(temporary, "report.json");
    handle = await open(staged, "wx", 0o600); await handle.writeFile(bytes, "utf8"); await handle.sync(); await handle.close(); handle = undefined;
    if (current()) { await link(staged, destination); published = true; }
  } finally {
    await handle?.close().catch(() => undefined);
    try { await rm(temporary, { recursive: true, force: true }); } catch { cleanupFailed = true; }
  }
  if (cleanupFailed) throw new DiagnosticCleanupError(published);
  return published;
}
