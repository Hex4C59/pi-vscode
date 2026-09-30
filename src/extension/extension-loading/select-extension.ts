import path from "node:path";
import { lstat, realpath } from "node:fs/promises";
import type { ExtensionSelection, ExtensionSelectionUi } from "./types.js";

const ENTRY_SUFFIX = /\.(?:ts|js|mjs|cjs)$/i;
const sensitive = (value: string): boolean => value.split(/[\\/]/).some(part => /^(?:\.local-env|\.ssh|\.env(?:\..*)?|auth\.json|credentials\.json|id_rsa|id_ed25519)$/i.test(part) || /\.(pem|key|p12|pfx)$/i.test(part));

export function extensionDisplayName(canonicalPath: string): string {
  const basename = path.basename(canonicalPath);
  if (Buffer.byteLength(basename, "utf8") <= 512) return basename;
  let displayName = "";
  let bytes = 0;
  for (const character of basename) {
    const width = Buffer.byteLength(character, "utf8");
    if (bytes + width > 509) break; // Reserve the UTF-8 ellipsis without splitting a code point.
    displayName += character; bytes += width;
  }
  return `${displayName}…`;
}

export async function inspectPickedExtension(
  pick: () => Promise<string | undefined>,
  current: () => boolean,
): Promise<ExtensionSelection> {
  if (!current()) return { kind: "stale" };
  try {
    const selected = await pick();
    if (!current()) return { kind: "stale" };
    if (selected === undefined) return { kind: "cancelled" };
    if (!path.isAbsolute(selected) || sensitive(selected) || !ENTRY_SUFFIX.test(selected) || Buffer.byteLength(selected) > 32768) {
      return { kind: "invalid-entry" };
    }
    const canonical = await realpath(selected);
    if (!current()) return { kind: "stale" };
    if (sensitive(canonical) || !ENTRY_SUFFIX.test(canonical)) return { kind: "invalid-entry" };
    const info = await lstat(canonical);
    if (!info.isFile() || info.isSymbolicLink()) return { kind: "invalid-entry" };
    return { kind: "selected", entryPath: canonical, displayName: extensionDisplayName(canonical) };
  } catch { return { kind: current() ? "invalid-entry" : "stale" }; }
}

export async function selectTrustedExtension(ui: ExtensionSelectionUi, current: () => boolean): Promise<ExtensionSelection> {
  const picked = await inspectPickedExtension(() => ui.pick(), current);
  if (picked.kind !== "selected") return picked;
  try {
    const before = await lstat(picked.entryPath);
    if (!current()) return { kind: "stale" };
    const allowed = await ui.confirm(picked.entryPath);
    if (!current()) return { kind: "stale" };
    if (!allowed) return { kind: "cancelled" };
    const after = await lstat(picked.entryPath);
    if (!current()) return { kind: "stale" };
    if (!after.isFile() || after.isSymbolicLink() || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
      return { kind: "invalid-entry" };
    }
    const finalPath = await realpath(picked.entryPath);
    if (!current()) return { kind: "stale" };
    if (finalPath !== picked.entryPath) return { kind: "invalid-entry" };
    return picked;
  } catch { return { kind: current() ? "invalid-entry" : "stale" }; }
}
