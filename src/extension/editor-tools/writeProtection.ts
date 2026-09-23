import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import type * as vscode from "vscode";
import type { GateCall } from "../contracts/index.js";

/** pi 0.86.1 write/edit use these spellings before node:path resolution.
 * Local policy mapping only; no private SDK import or replacement tool implementation.
 */
export function resolveWriteTargetPath(input: string, cwd: string): string {
  let value = input.replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " ").replace(/^@/, "");
  if (process.platform === "win32" && !value.includes("\\")) {
    const shell = /^\/(?:mnt\/|cygdrive\/)?([a-z])(?:\/(.*))?$/i.exec(value);
    if (shell) value = shell[1].toUpperCase() + ":\\" + (shell[2] ?? "").replaceAll("/", "\\");
  }
  if (value === "~") value = homedir();
  else if (value.startsWith("~/") || (process.platform === "win32" && value.startsWith("~\\"))) value = path.join(homedir(), value.slice(2));
  if (value.startsWith("file://")) value = fileURLToPath(value);
  return path.resolve(cwd, value);
}

type Target = { path: string; identity?: string };
const comparable = (value: string) => process.platform === "win32" ? value.toLowerCase() : value;
async function physicalTarget(value: string): Promise<Target> {
  let ancestor = value;
  const suffix: string[] = [];
  for (;;) {
    try {
      const canonical = await realpath(ancestor);
      if (suffix.length) return { path: comparable(path.join(canonical, ...suffix)) };
      const info = await stat(canonical, { bigint: true });
      return { path: comparable(canonical), ...(info.ino !== 0n ? { identity: info.dev + ":" + info.ino } : {}) };
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT" || path.dirname(ancestor) === ancestor) throw error;
      suffix.unshift(path.basename(ancestor)); ancestor = path.dirname(ancestor);
    }
  }
}

/** Editor metadata only: never saves or reads a buffer's text. */
export async function checkWriteTarget(call: GateCall, workspace: Pick<typeof vscode.workspace, "textDocuments">): Promise<"dirty" | "unavailable" | undefined> {
  if (call.tool !== "write" && call.tool !== "edit") return;
  if (typeof call.input.path !== "string") return "unavailable";
  try {
    const resolved = resolveWriteTargetPath(call.input.path, call.cwd);
    const dirtyDocuments = () => workspace.textDocuments.filter(document => !document.isClosed && document.isDirty && document.uri.scheme === "file");
    // Recheck the live document set after all filesystem awaits, including newly opened buffers.
    // Continuous editor churn fails closed instead of creating an unbounded retry loop.
    for (let attempt = 0; attempt < 3; attempt++) {
      const documents = dirtyDocuments();
      const target = await physicalTarget(resolved);
      const paths = await Promise.all(documents.map(document => physicalTarget(document.uri.fsPath)));
      const current = dirtyDocuments();
      if (current.length !== documents.length || current.some((document, i) => document !== documents[i])) continue;
      return paths.some(candidate => candidate.path === target.path || (target.identity !== undefined && candidate.identity === target.identity)) ? "dirty" : undefined;
    }
  } catch { /* An uncheckable write is denied, without projecting paths or raw errors. */ }
  return "unavailable";
}
