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
    if (this.snapshot.busy || this.snapshot.error === "existing-unusable") return;
    this.assign({ ...this.snapshot, busy: true, error: null }, current);
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

  private async append(entryPath: string, current: () => boolean): Promise<void> {
    const loaded = await loadPluginInventory(this.globalStorage);
    if (!current()) return;
    if (!loaded.ok) {
      this.assign({ busy: false, error: "existing-unusable", entries: [] }, current);
      return;
    }
    if (loaded.entries.some(entry => entry.path === entryPath)) {
      this.assign({ busy: false, error: "duplicate-path", entries: project(loaded.entries) }, current);
      return;
    }
    if (loaded.entries.length >= PLUGIN_INVENTORY_MAX_ENTRIES) {
      this.assign({ busy: false, error: "too-many", entries: project(loaded.entries) }, current);
      return;
    }
    const next = [...loaded.entries, { path: entryPath, enabled: true }];
    const written = await replacePluginInventory(this.globalStorage, next);
    if (!current()) return;
    if (!written.ok) {
      this.assign({ busy: false, error: WRITE_ERRORS[written.reason], entries: project(loaded.entries) }, current);
      return;
    }
    this.assign({ busy: false, error: null, entries: project(next) }, current);
  }

  private assign(snapshot: PluginInventoryProjection, current: () => boolean): void {
    if (!current()) return;
    this.snapshot = snapshot;
    this.publish();
  }
}

function project(entries: PluginInventoryEntry[]): PluginInventoryProjection["entries"] {
  return entries.map(entry => ({ displayName: extensionDisplayName(entry.path) }));
}
