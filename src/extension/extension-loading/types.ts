export type ExtensionSelection = { kind: "selected"; entryPath: string; displayName: string } | { kind: "cancelled" | "stale" | "invalid-entry" };
export type ExtensionSelectionUi = { pick(): Promise<string | undefined>; confirm(canonicalPath: string): Promise<boolean> };
export type PluginInventoryEntry = { path: string; enabled: boolean };
export type PluginInventoryLoad =
  | { ok: true; entries: PluginInventoryEntry[]; source: "missing" | "file" }
  | { ok: false; reason: "damaged" | "too-large" | "unsupported-schema" };
export type PluginInventoryWrite =
  | { ok: true }
  | { ok: false; reason: "invalid-entry" | "duplicate-path" | "too-many" | "too-large" | "write-failed" | "existing-unusable" };
