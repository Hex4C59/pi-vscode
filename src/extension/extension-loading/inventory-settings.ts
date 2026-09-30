import { createHash } from "node:crypto";
import type { PluginInventoryError, PluginInventoryProjection } from "../contracts/index.js";
import {
  PLUGIN_INVENTORY_MAX_ENTRIES,
  loadPluginInventory,
  replacePluginInventory,
} from "./plugin-inventory.js";
import { extensionDisplayName, inspectPickedExtension } from "./select-extension.js";
import type { PluginInventoryEntry, PluginInventoryWrite } from "./types.js";

const WRITE_ERRORS: Record<Extract<PluginInventoryWrite, { ok: false }>["reason"], PluginInventoryError> = {
  "invalid-entry": "invalid-entry",
  "duplicate-path": "duplicate-path",
  "too-many": "too-many",
  "too-large": "too-large",
  "write-failed": "write-failed",
  "existing-unusable": "existing-unusable",
};

export function inventoryEntryId(entryPath: string): string {
  return createHash("sha256").update(entryPath).digest("hex").slice(0, 16);
}

export class PluginInventorySettings {
  snapshot: PluginInventoryProjection = { busy: false, error: null, entries: [] };
  constructor(
    private readonly globalStorage: string,
    private readonly pick: () => Promise<string | undefined>,
    private readonly publish: () => void,
  ) {}

  async reload(current: () => boolean): Promise<void> {
    if (!this.globalStorage) {
      this.assign({ busy: false, error: null, entries: [] }, current);
      return;
    }
    const loaded = await loadPluginInventory(this.globalStorage);
    if (!current()) return;
    if (!loaded.ok) this.assign({ busy: false, error: "existing-unusable", entries: [] }, current);
    else this.assign({ busy: false, error: null, entries: project(loaded.entries) }, current);
  }

  async add(current: () => boolean): Promise<void> {
    if (!this.begin(current)) return;
    if (!this.globalStorage) {
      this.assign({ busy: false, error: "write-failed", entries: this.snapshot.entries }, current);
      return;
    }
    const picked = await inspectPickedExtension(this.pick, current);
    if (!current()) return;
    if (picked.kind === "cancelled" || picked.kind === "stale") { await this.reload(current); return; }
    if (picked.kind !== "selected") {
      this.assign({ ...this.snapshot, busy: false, error: "invalid-entry" }, current);
      return;
    }
    await this.append(picked.entryPath, current);
  }

  async setEnabled(id: string, enabled: boolean, current: () => boolean): Promise<void> {
    if (!this.begin(current)) return;
    await this.mutate(current, loaded => {
      const match = loaded.find(entry => inventoryEntryId(entry.path) === id);
      if (!match) return { error: "unknown-entry" as const, entries: loaded };
      return { entries: loaded.map(entry => entry === match ? { ...entry, enabled } : entry) };
    });
  }

  async remove(id: string, current: () => boolean): Promise<void> {
    if (!this.begin(current)) return;
    await this.mutate(current, loaded => {
      const next = loaded.filter(entry => inventoryEntryId(entry.path) !== id);
      if (next.length === loaded.length) return { error: "unknown-entry" as const, entries: loaded };
      return { entries: next };
    });
  }

  private async append(entryPath: string, current: () => boolean): Promise<void> {
    await this.mutate(current, loaded => {
      if (loaded.some(entry => entry.path === entryPath)) return { error: "duplicate-path" as const, entries: loaded };
      if (loaded.length >= PLUGIN_INVENTORY_MAX_ENTRIES) return { error: "too-many" as const, entries: loaded };
      return { entries: [...loaded, { path: entryPath, enabled: true }] };
    });
  }

  private async mutate(
    current: () => boolean,
    change: (loaded: PluginInventoryEntry[]) => { error: PluginInventoryError; entries: PluginInventoryEntry[] } | { entries: PluginInventoryEntry[] },
  ): Promise<void> {
    if (!this.globalStorage) {
      this.assign({ busy: false, error: "write-failed", entries: this.snapshot.entries }, current);
      return;
    }
    const loaded = await loadPluginInventory(this.globalStorage);
    if (!current()) return;
    if (!loaded.ok) {
      this.assign({ busy: false, error: "existing-unusable", entries: [] }, current);
      return;
    }
    const next = change(loaded.entries);
    if ("error" in next) {
      this.assign({ busy: false, error: next.error, entries: project(next.entries) }, current);
      return;
    }
    const written = await replacePluginInventory(this.globalStorage, next.entries);
    if (!current()) return;
    if (!written.ok) {
      this.assign({ busy: false, error: WRITE_ERRORS[written.reason], entries: project(loaded.entries) }, current);
      return;
    }
    this.assign({ busy: false, error: null, entries: project(next.entries) }, current);
  }

  private begin(current: () => boolean): boolean {
    if (this.snapshot.busy || this.snapshot.error === "existing-unusable") return false;
    this.assign({ ...this.snapshot, busy: true, error: null }, current);
    return true;
  }

  private assign(snapshot: PluginInventoryProjection, current: () => boolean): void {
    if (!current()) return;
    this.snapshot = snapshot;
    this.publish();
  }
}

function project(entries: PluginInventoryEntry[]): PluginInventoryProjection["entries"] {
  return entries.map(entry => ({
    id: inventoryEntryId(entry.path),
    displayName: extensionDisplayName(entry.path),
    enabled: entry.enabled,
  }));
}
