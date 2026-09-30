import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { test, type TestContext } from "node:test";
import {
  PLUGIN_INVENTORY_FILE,
  PLUGIN_INVENTORY_MAX_BYTES,
  loadPluginInventory,
  pluginInventoryPath,
  replacePluginInventory,
} from "../plugin-inventory.js";

async function storage(t: TestContext): Promise<string> {
  const root = path.resolve("dist/tests-fixtures/plugin-inventory");
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, "store-"));
  t.after(async () => { assert.equal(path.dirname(directory), root); await rm(directory, { recursive: true, force: true }); });
  return directory;
}

test("a missing inventory file loads as empty and does not create the file", async t => {
  const globalStorage = await storage(t);
  const loaded = await loadPluginInventory(globalStorage);
  assert.deepEqual(loaded, { ok: true, entries: [], source: "missing" });
  await assert.rejects(stat(pluginInventoryPath(globalStorage)));
});

test("replace then load round-trips absolute paths and enabled flags without extra fields", async t => {
  const globalStorage = await storage(t);
  const first = path.join(globalStorage, "one.ts");
  const second = path.join(globalStorage, "two.mjs");
  const written = await replacePluginInventory(globalStorage, [
    { path: first, enabled: true },
    { path: second, enabled: false },
  ]);
  assert.deepEqual(written, { ok: true });
  const loaded = await loadPluginInventory(globalStorage);
  assert.equal(loaded.ok, true);
  if (loaded.ok) {
    assert.equal(loaded.source, "file");
    assert.deepEqual(loaded.entries, [
      { path: path.resolve(first), enabled: true },
      { path: path.resolve(second), enabled: false },
    ]);
  }
  const raw = JSON.parse(await readFile(pluginInventoryPath(globalStorage), "utf8")) as Record<string, unknown>;
  assert.deepEqual(Object.keys(raw).sort(), ["entries", "schemaVersion"]);
  assert.equal(raw.schemaVersion, 1);
  const entries = raw.entries as Record<string, unknown>[];
  assert.deepEqual(Object.keys(entries[0] ?? {}).sort(), ["enabled", "path"]);
  assert.equal(PLUGIN_INVENTORY_FILE, "plugin-inventory-v1.json");
});

test("duplicate paths are rejected and leave an existing file unchanged", async t => {
  const globalStorage = await storage(t);
  const entry = path.join(globalStorage, "entry.ts");
  assert.deepEqual(await replacePluginInventory(globalStorage, [{ path: entry, enabled: true }]), { ok: true });
  const before = await readFile(pluginInventoryPath(globalStorage), "utf8");
  const duplicate = await replacePluginInventory(globalStorage, [
    { path: entry, enabled: true },
    { path: path.join(globalStorage, "..", path.basename(globalStorage), "entry.ts"), enabled: false },
  ]);
  assert.deepEqual(duplicate, { ok: false, reason: "duplicate-path" });
  assert.equal(await readFile(pluginInventoryPath(globalStorage), "utf8"), before);
});

test("a damaged inventory file is left unchanged on load and replace", async t => {
  const globalStorage = await storage(t);
  const file = pluginInventoryPath(globalStorage);
  await writeFile(file, "{ entries: oops }\n", "utf8");
  assert.deepEqual(await loadPluginInventory(globalStorage), { ok: false, reason: "damaged" });
  assert.equal(await readFile(file, "utf8"), "{ entries: oops }\n");
  const replaced = await replacePluginInventory(globalStorage, [{ path: path.join(globalStorage, "ok.ts"), enabled: true }]);
  assert.deepEqual(replaced, { ok: false, reason: "existing-unusable" });
  assert.equal(await readFile(file, "utf8"), "{ entries: oops }\n");
});

test("an oversized inventory file is left unread as a rewrite", async t => {
  const globalStorage = await storage(t);
  const file = pluginInventoryPath(globalStorage);
  const oversized = "x".repeat(PLUGIN_INVENTORY_MAX_BYTES + 1);
  await writeFile(file, oversized, "utf8");
  assert.deepEqual(await loadPluginInventory(globalStorage), { ok: false, reason: "too-large" });
  assert.equal(await readFile(file, "utf8"), oversized);
  assert.deepEqual(
    await replacePluginInventory(globalStorage, [{ path: path.join(globalStorage, "ok.ts"), enabled: true }]),
    { ok: false, reason: "existing-unusable" },
  );
  assert.equal(await readFile(file, "utf8"), oversized);
});

test("relative, sensitive and extra-field entries cannot be stored", async t => {
  const globalStorage = await storage(t);
  assert.deepEqual(
    await replacePluginInventory(globalStorage, [{ path: "entry.ts", enabled: true }]),
    { ok: false, reason: "invalid-entry" },
  );
  assert.deepEqual(
    await replacePluginInventory(globalStorage, [{ path: path.join(globalStorage, ".ssh", "id_rsa.ts"), enabled: true }]),
    { ok: false, reason: "invalid-entry" },
  );
  await assert.rejects(stat(pluginInventoryPath(globalStorage)));
});
