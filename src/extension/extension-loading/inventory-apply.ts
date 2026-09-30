import { loadPluginInventory } from "./plugin-inventory.js";

/** Pinned pi 0.86.1 accepts one extra `-e` besides the bundled gate. */
export const PINNED_TRUSTED_ENTRY_LIMIT = 1;

export type TrustedInventoryApply =
  | { kind: "empty" }
  | { kind: "single"; entryPath: string }
  | { kind: "too-many" }
  | { kind: "unusable" };

export async function trustedInventoryApply(globalStorage: string): Promise<TrustedInventoryApply> {
  if (!globalStorage) return { kind: "empty" };
  const loaded = await loadPluginInventory(globalStorage);
  if (!loaded.ok) return { kind: "unusable" };
  const enabled = loaded.entries.filter(entry => entry.enabled);
  if (enabled.length === 0) return { kind: "empty" };
  if (enabled.length > PINNED_TRUSTED_ENTRY_LIMIT) return { kind: "too-many" };
  const [entry] = enabled;
  return entry ? { kind: "single", entryPath: entry.path } : { kind: "empty" };
}
