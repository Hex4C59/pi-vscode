import path from "node:path";

/** Host-only endpoint; browsers never choose addresses, run IDs or process identities. */
export function runtimeControlPath(directory: string, runId: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(runId)) throw new Error("Invalid owned-runtime identity.");
  return process.platform === "win32" ? `\\\\.\\pipe\\pi-vscode-runtime-${runId}` : path.join(directory, `control-${runId}.sock`);
}
