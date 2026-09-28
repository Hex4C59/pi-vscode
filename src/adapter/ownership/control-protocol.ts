import path from "node:path";
import { createHash } from "node:crypto";

/** Host-only endpoint; browsers never choose addresses, run IDs or process identities. */
export function runtimeControlPath(directory: string, runId: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(runId)) throw new Error("Invalid owned-runtime identity.");
  if (process.platform === "win32") return `\\\\.\\pipe\\pi-vscode-runtime-${runId}`;
  const local = path.join(directory, `control-${runId}.sock`);
  // Darwin permits only 103 pathname bytes. Keep existing short endpoints stable;
  // a long recovery directory must not prevent the supervisor from listening.
  if (Buffer.byteLength(local, "utf8") <= 103) return local;
  const identity = createHash("sha256").update(path.resolve(directory)).update("\0").update(runId).digest("hex");
  // /tmp is intentionally bounded, unlike user TMPDIR. The supervisor still owns
  // bind, mode 0600 and cleanup; no existing endpoint is removed before bind.
  return path.join("/tmp", `pi-vscode-${identity}.sock`);
}
