import path from "node:path";
import { lstat, realpath } from "node:fs/promises";
import type { ExtensionSelection, ExtensionSelectionUi } from "./types.js";
const sensitive = (value: string): boolean => value.split(/[\\/]/).some(part => /^(?:\.local-env|\.ssh|\.env(?:\..*)?|auth\.json|credentials\.json|id_rsa|id_ed25519)$/i.test(part) || /\.(pem|key|p12|pfx)$/i.test(part));
export async function selectTrustedExtension(ui: ExtensionSelectionUi, current: () => boolean): Promise<ExtensionSelection> {
  if (!current()) return { kind: "stale" };
  try {
    const selected = await ui.pick();
    if (!current()) return { kind: "stale" };
    if (selected === undefined) return { kind: "cancelled" };
    if (!path.isAbsolute(selected) || sensitive(selected) || !/\.(?:ts|js|mjs|cjs)$/i.test(selected) || Buffer.byteLength(selected) > 32768) return { kind: "invalid-entry" };
    const canonical = await realpath(selected);
    if (!current()) return { kind: "stale" };
    if (sensitive(canonical) || !/\.(?:ts|js|mjs|cjs)$/i.test(canonical)) return { kind: "invalid-entry" };
    const before = await lstat(canonical);
    if (!before.isFile() || before.isSymbolicLink()) return { kind: "invalid-entry" };
    const allowed = await ui.confirm(canonical);
    if (!current()) return { kind: "stale" };
    if (!allowed) return { kind: "cancelled" };
    const after = await lstat(canonical);
    if (!current()) return { kind: "stale" };
    if (!after.isFile() || after.isSymbolicLink() || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) return { kind: "invalid-entry" };
    const finalPath = await realpath(selected);
    if (!current()) return { kind: "stale" };
    if (finalPath !== canonical) return { kind: "invalid-entry" };
    const basename = path.basename(canonical);
    let displayName = basename;
    if (Buffer.byteLength(basename, "utf8") > 512) {
      displayName = "";
      let bytes = 0;
      for (const character of basename) {
        const width = Buffer.byteLength(character, "utf8");
        if (bytes + width > 509) break; // Reserve the UTF-8 ellipsis without splitting a code point.
        displayName += character; bytes += width;
      }
      displayName += "…";
    }
    return { kind: "selected", entryPath: canonical, displayName };
  } catch { return { kind: current() ? "invalid-entry" : "stale" }; }
}
