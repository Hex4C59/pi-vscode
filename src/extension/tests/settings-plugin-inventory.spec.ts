import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { parseHostMessage } from "../../webview/parse-host-message.js";
import { PLUGIN_INVENTORY_FILE, inventoryEntryId } from "../extension-loading/index.js";
import { folder, harness, settingsRuntime, tick } from "./harness.js";

async function inventorySettings(t: TestContext) {
  const root = path.resolve("dist/tests-fixtures/plugin-inventory-settings");
  await mkdir(root, { recursive: true });
  const globalStorage = await mkdtemp(path.join(root, "store-"));
  const plugins = await mkdtemp(path.join(root, "plugin-"));
  t.after(async () => {
    assert.equal(path.dirname(globalStorage), root);
    assert.equal(path.dirname(plugins), root);
    await rm(globalStorage, { recursive: true, force: true });
    await rm(plugins, { recursive: true, force: true });
  });
  const r = settingsRuntime();
  const h = harness([folder()], true, undefined, r.runtime, undefined, undefined, { globalStorage });
  const v = h.createView();
  v.action("chooseResources", { choice: "allow" });
  await tick();
  if (v.state().runtime !== "ready") {
    h.provider.dispose();
    throw new Error("Inventory settings fixture did not reach a ready runtime.");
  }
  r.calls.length = 0;
  return { h, v, r, globalStorage, plugins };
}

function inventoryMessage(sent: unknown[]) {
  return [...sent].reverse().map(parseHostMessage).find(message => message?.type === "pluginInventoryState");
}

async function settle(panel: { sent: unknown[] }, check: (inventory: NonNullable<ReturnType<typeof inventoryMessage>>) => boolean) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const inventory = inventoryMessage(panel.sent);
    if (inventory && check(inventory)) return inventory;
    await tick();
  }
  throw new Error("plugin inventory did not settle");
}

async function openSettings(h: Awaited<ReturnType<typeof inventorySettings>>["h"], v: Awaited<ReturnType<typeof inventorySettings>>["v"]) {
  v.action("openSettings");
  const panel = h.panels[0];
  assert.ok(panel);
  await tick();
  panel.receive.fire({ version: 3, type: "getWorkspaceState" });
  const state = parseHostMessage(panel.sent[0]);
  assert.ok(state);
  return { panel, envelope: { version: 3 as const, viewId: state.viewId, generation: state.generation } };
}

test("settings plugins starts empty and does not create the inventory file", async t => {
  const { h, v, globalStorage } = await inventorySettings(t);
  try {
    const { panel } = await openSettings(h, v);
    const inventory = inventoryMessage(panel.sent);
    assert.deepEqual(inventory && "entries" in inventory ? inventory.entries : undefined, []);
    assert.equal(inventory && "error" in inventory ? inventory.error : "missing", null);
    await assert.rejects(readFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE)));
  } finally { h.provider.dispose(); }
});

test("adding from disk remembers the basename, writes the store, and does not ask for load consent", async t => {
  const { h, v, r, globalStorage, plugins } = await inventorySettings(t);
  try {
    const entry = path.join(plugins, "hello.ts");
    await writeFile(entry, "export default {}\n");
    let warnings = 0;
    h.api.window.showWarningMessage = async () => { warnings += 1; return undefined; };
    h.api.window.showOpenDialog = async () => [{ scheme: "file", fsPath: entry }];
    const session = r.runtime.getSession();
    const { panel, envelope } = await openSettings(h, v);
    panel.receive.fire({ ...envelope, type: "addPluginInventoryEntry" });
    const inventory = await settle(panel, item => "entries" in item && item.entries.length === 1);
    assert.deepEqual(inventory.entries, [{ id: inventoryEntryId(entry), displayName: "hello.ts" }]);
    assert.equal(JSON.stringify(inventory).includes(entry), false);
    const stored = JSON.parse(await readFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE), "utf8")) as {
      entries: { path: string; enabled: boolean }[];
    };
    assert.equal(stored.entries.length, 1);
    assert.equal(stored.entries[0]?.enabled, true);
    assert.ok(stored.entries[0]?.path.endsWith(`${path.sep}hello.ts`));
    assert.equal(warnings, 0);
    assert.equal(r.runtime.getSession(), session);
    assert.equal(v.state().runtime, "ready");
    assert.deepEqual(r.calls, []);
  } finally { h.provider.dispose(); }
});

test("duplicate and invalid picks leave the inventory file unchanged", async t => {
  const { h, v, globalStorage, plugins } = await inventorySettings(t);
  try {
    const entry = path.join(plugins, "hello.ts");
    await writeFile(entry, "export default {}\n");
    h.api.window.showOpenDialog = async () => [{ scheme: "file", fsPath: entry }];
    const { panel, envelope } = await openSettings(h, v);
    panel.receive.fire({ ...envelope, type: "addPluginInventoryEntry" });
    await settle(panel, item => "entries" in item && item.entries.length === 1);
    const before = await readFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE), "utf8");
    panel.receive.fire({ ...envelope, type: "addPluginInventoryEntry" });
    const duplicate = await settle(panel, item => "error" in item && item.error === "duplicate-path");
    assert.equal(await readFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE), "utf8"), before);
    assert.equal(duplicate.error, "duplicate-path");
    const invalid = path.join(plugins, "notes.txt");
    await writeFile(invalid, "not an extension\n");
    h.api.window.showOpenDialog = async () => [{ scheme: "file", fsPath: invalid }];
    panel.receive.fire({ ...envelope, type: "addPluginInventoryEntry" });
    const rejected = await settle(panel, item => "error" in item && item.error === "invalid-entry");
    assert.equal(await readFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE), "utf8"), before);
    assert.equal(rejected.error, "invalid-entry");
  } finally { h.provider.dispose(); }
});

test("cancelling the native picker does not write an inventory file", async t => {
  const { h, v, globalStorage } = await inventorySettings(t);
  try {
    let picked = 0;
    h.api.window.showOpenDialog = async () => { picked += 1; return undefined; };
    const { panel, envelope } = await openSettings(h, v);
    panel.receive.fire({ ...envelope, type: "addPluginInventoryEntry" });
    const inventory = await settle(panel, item => picked > 0 && item.busy === false && item.error === null);
    await assert.rejects(readFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE)));
    assert.deepEqual(inventory.entries, []);
  } finally { h.provider.dispose(); }
});

test("removing an entry drops the path and leaves the disk file", async t => {
  const { h, v, r, globalStorage, plugins } = await inventorySettings(t);
  try {
    const keep = path.join(plugins, "keep.ts");
    const drop = path.join(plugins, "drop.ts");
    await writeFile(keep, "export default {}\n");
    await writeFile(drop, "export default {}\n");
    const session = r.runtime.getSession();
    const { panel, envelope } = await openSettings(h, v);
    h.api.window.showOpenDialog = async () => [{ scheme: "file", fsPath: keep }];
    panel.receive.fire({ ...envelope, type: "addPluginInventoryEntry" });
    await settle(panel, item => "entries" in item && item.entries.length === 1);
    h.api.window.showOpenDialog = async () => [{ scheme: "file", fsPath: drop }];
    panel.receive.fire({ ...envelope, type: "addPluginInventoryEntry" });
    await settle(panel, item => "entries" in item && item.entries.length === 2);
    r.calls.length = 0;
    panel.receive.fire({ ...envelope, type: "removePluginInventoryEntry", id: inventoryEntryId(drop) });
    const inventory = await settle(panel, item => "entries" in item && item.entries.length === 1 && item.error === null);
    assert.deepEqual(inventory.entries, [{ id: inventoryEntryId(keep), displayName: "keep.ts" }]);
    assert.equal(JSON.stringify(inventory).includes(drop), false);
    const stored = JSON.parse(await readFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE), "utf8")) as {
      entries: { path: string }[];
    };
    assert.deepEqual(stored.entries.map(entry => entry.path), [keep]);
    assert.equal(await readFile(drop, "utf8"), "export default {}\n");
    assert.equal(r.runtime.getSession(), session);
    assert.equal(v.state().runtime, "ready");
    assert.deepEqual(r.calls, []);
  } finally { h.provider.dispose(); }
});

test("unknown inventory ids and a damaged file leave the store unchanged", async t => {
  const { h, v, globalStorage, plugins } = await inventorySettings(t);
  try {
    const entry = path.join(plugins, "hello.ts");
    await writeFile(entry, "export default {}\n");
    h.api.window.showOpenDialog = async () => [{ scheme: "file", fsPath: entry }];
    const { panel, envelope } = await openSettings(h, v);
    panel.receive.fire({ ...envelope, type: "addPluginInventoryEntry" });
    await settle(panel, item => "entries" in item && item.entries.length === 1);
    const before = await readFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE), "utf8");
    panel.receive.fire({ ...envelope, type: "removePluginInventoryEntry", id: "missing-entry-id" });
    const missing = await settle(panel, item => "error" in item && item.error === "unknown-entry");
    assert.equal(await readFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE), "utf8"), before);
    assert.equal(missing.error, "unknown-entry");
    await writeFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE), "{not json");
    panel.receive.fire({ ...envelope, type: "removePluginInventoryEntry", id: inventoryEntryId(entry) });
    const damaged = await settle(panel, item => "error" in item && item.error === "existing-unusable");
    assert.equal(await readFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE), "utf8"), "{not json");
    assert.equal(damaged.error, "existing-unusable");
    assert.deepEqual(damaged.entries, []);
  } finally { h.provider.dispose(); }
});
