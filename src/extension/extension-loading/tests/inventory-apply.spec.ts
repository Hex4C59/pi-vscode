import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { PLUGIN_INVENTORY_FILE, replacePluginInventory, trustedInventoryApply } from "../index.js";

async function store(t: TestContext) {
  const root = path.resolve("dist/tests-fixtures/inventory-apply");
  await mkdir(root, { recursive: true });
  const globalStorage = await mkdtemp(path.join(root, "store-"));
  const plugins = await mkdtemp(path.join(root, "plugin-"));
  t.after(async () => {
    assert.equal(path.dirname(globalStorage), root);
    assert.equal(path.dirname(plugins), root);
    await rm(globalStorage, { recursive: true, force: true });
    await rm(plugins, { recursive: true, force: true });
  });
  return { globalStorage, plugins };
}

async function entry(directory: string, name: string): Promise<string> {
  const file = path.join(directory, name);
  await writeFile(file, "export default {}\n");
  return file;
}

test("missing storage and an empty list are not a trusted apply set", async t => {
  const { globalStorage } = await store(t);
  assert.deepEqual(await trustedInventoryApply(""), { kind: "empty" });
  assert.deepEqual(await trustedInventoryApply(globalStorage), { kind: "empty" });
});

test("one enabled path is the single idle Trusted apply candidate", async t => {
  const { globalStorage, plugins } = await store(t);
  const enabled = await entry(plugins, "on.ts");
  const off = await entry(plugins, "off.ts");
  assert.equal((await replacePluginInventory(globalStorage, [
    { path: enabled, enabled: true },
    { path: off, enabled: false },
  ])).ok, true);
  assert.deepEqual(await trustedInventoryApply(globalStorage), { kind: "single", entryPath: path.resolve(enabled) });
});

test("extra enabled paths fail visibly instead of dropping extras", async t => {
  const { globalStorage, plugins } = await store(t);
  const first = await entry(plugins, "one.ts");
  const second = await entry(plugins, "two.ts");
  assert.equal((await replacePluginInventory(globalStorage, [
    { path: first, enabled: true },
    { path: second, enabled: true },
  ])).ok, true);
  assert.deepEqual(await trustedInventoryApply(globalStorage), { kind: "too-many" });
});

test("a damaged inventory is unusable and is not treated as empty", async t => {
  const { globalStorage } = await store(t);
  await writeFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE), "{", "utf8");
  assert.deepEqual(await trustedInventoryApply(globalStorage), { kind: "unusable" });
});
