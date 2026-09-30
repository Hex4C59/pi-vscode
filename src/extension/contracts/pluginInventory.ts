/** Secret-free Settings projection of the local pi-extension inventory. */
export type PluginInventoryError =
  | "duplicate-path"
  | "invalid-entry"
  | "existing-unusable"
  | "unknown-entry"
  | "too-many"
  | "too-large"
  | "write-failed";

export type PluginInventoryItem = { id: string; displayName: string };

export type PluginInventoryProjection = {
  busy: boolean;
  error: PluginInventoryError | null;
  entries: PluginInventoryItem[];
};

export type PluginInventoryIntent =
  | { type: "addPluginInventoryEntry" }
  | { type: "removePluginInventoryEntry"; id: string };
