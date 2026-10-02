import type { PackageVersions } from "./packageVersions.js";
export type DiagnosticState = { locale?: "en" | "zh-CN"; workspace?: string; runtime?: string;
  chatBusy?: boolean; modelBusy?: boolean; sessionBusy?: boolean; controlled?: boolean; hostError?: boolean; runtimeError?: boolean };
const workspace = ["no-folder", "multi-root", "remote", "non-file", "untrusted", "eligible"];
const runtime = ["not-started", "starting", "ready", "stopping", "error"];
/** Copy individual safe fields; input extras never cross the export boundary. */
export function diagnosticSnapshot(versions: PackageVersions, state: DiagnosticState): string {
  const flag = (value: unknown): boolean | null => typeof value === "boolean" ? value : null;
  const bytes = JSON.stringify({ schema: "pi-vscode-local-diagnostic", schemaVersion: 1,
    scope: "local metadata only; no source, sessions, credentials, identifiers, paths, environment or error/log bodies",
    versions: { extension: versions.extension, piRuntime: versions.piRuntime, vscode: versions.vscode },
    host: { platform: process.platform, architecture: process.arch },
    state: { workspace: workspace.includes(state.workspace ?? "") ? state.workspace : null,
      runtime: runtime.includes(state.runtime ?? "") ? state.runtime : null, chatBusy: flag(state.chatBusy), modelBusy: flag(state.modelBusy),
      sessionBusy: flag(state.sessionBusy), controlled: flag(state.controlled), hostError: flag(state.hostError), runtimeError: flag(state.runtimeError) },
  }, null, 2) + "\n";
  if (Buffer.byteLength(bytes) > 4096) throw new Error("Diagnostic budget");
  return bytes;
}
