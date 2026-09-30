import assert from "node:assert/strict";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test, type TestContext } from "node:test";
import type { PiRuntimeLifecycle, ExecutionProfileProjection } from "../contracts/index.js";
import { PLUGIN_INVENTORY_FILE, replacePluginInventory } from "../extension-loading/index.js";
import { folder, harness, settingsRuntime, tick } from "./harness.js";

async function applyFixture(t: TestContext) {
  const root = path.resolve("dist/tests-fixtures/inventory-runtime-apply");
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
  const starts: Parameters<PiRuntimeLifecycle["start"]>[0][] = [];
  const original = r.runtime.start;
  r.runtime.start = async options => {
    starts.push(options);
    await original(options);
    return { ok: true, modelLabel: null, conversation: { id: "session-id", path: "/owned-session", name: "Live" } };
  };
  r.runtime.checkpointRestart = async conversation => ({ kind: "resume", conversation });
  const h = harness([folder()], true, undefined, r.runtime, undefined, undefined, { globalStorage });
  const v = h.createView();
  v.action("chooseResources", { choice: "allow" });
  await tick();
  if (v.state().runtime !== "ready") {
    h.provider.dispose();
    throw new Error("Inventory apply fixture did not reach a ready runtime.");
  }
  return { h, v, starts, globalStorage, plugins };
}

async function plugin(directory: string, name: string): Promise<string> {
  const file = path.join(directory, name);
  await writeFile(file, "export default {}\n");
  return file;
}

async function waitStarts(starts: unknown[], count: number): Promise<void> {
  for (let i = 0; i < 100 && starts.length < count; i++) await new Promise(resolve => setTimeout(resolve, 5));
}

function profileState(view: ReturnType<ReturnType<typeof harness>["createView"]>): ExecutionProfileProjection {
  view.state();
  return [...view.sent].reverse().find(value => (value as { type: string }).type === "executionProfileState") as ExecutionProfileProjection;
}

test("controlled start ignores enabled inventory entries", async t => {
  const { h, v, starts, globalStorage, plugins } = await applyFixture(t);
  try {
    const enabled = await plugin(plugins, "ignored.ts");
    assert.equal((await replacePluginInventory(globalStorage, [{ path: enabled, enabled: true }])).ok, true);
    assert.equal(starts.length, 1);
    assert.equal(starts[0]?.profile, undefined);
    assert.equal(v.state().controlledExecution, true);
  } finally { h.provider.dispose(); }
});

test("one enabled inventory entry loads after coverage warning without a picker", async t => {
  const { h, v, starts, globalStorage, plugins } = await applyFixture(t);
  try {
    const enabled = await plugin(plugins, "listed.ts");
    const canonical = await realpath(enabled);
    assert.equal((await replacePluginInventory(globalStorage, [{ path: enabled, enabled: true }])).ok, true);
    let picks = 0;
    let warning = "";
    h.api.window.showOpenDialog = async () => { picks += 1; return undefined; };
    h.api.window.showWarningMessage = async (message, options, ...items) => {
      warning = String(message);
      assert.equal(options.modal, true);
      return items[0];
    };
    v.action("chooseExecutionProfile", { profile: "trusted" });
    await waitStarts(starts, 2);
    await tick();
    assert.equal(picks, 0);
    assert.ok(warning.includes(canonical));
    assert.equal(starts.length, 2);
    assert.deepEqual(starts[1]?.profile, { kind: "trusted", entryPath: canonical });
    const profile = profileState(v);
    assert.equal(profile.profile, "trusted");
    assert.equal(profile.phase, "idle");
    assert.equal(profile.displayName, "listed.ts");
    assert.equal(profile.errorCode, null);
  } finally { h.provider.dispose(); }
});

test("extra enabled inventory entries fail visibly and do not start Trusted", async t => {
  const { h, v, starts, globalStorage, plugins } = await applyFixture(t);
  try {
    const first = await plugin(plugins, "one.ts");
    const second = await plugin(plugins, "two.ts");
    assert.equal((await replacePluginInventory(globalStorage, [
      { path: first, enabled: true },
      { path: second, enabled: true },
    ])).ok, true);
    let picks = 0;
    let warnings = 0;
    h.api.window.showOpenDialog = async () => { picks += 1; return undefined; };
    h.api.window.showWarningMessage = async () => { warnings += 1; return undefined; };
    v.action("chooseExecutionProfile", { profile: "trusted" });
    for (let i = 0; i < 40; i++) await tick();
    assert.equal(picks, 0);
    assert.equal(warnings, 0);
    assert.equal(starts.length, 1);
    const profile = profileState(v);
    assert.equal(profile.profile, "controlled");
    assert.equal(profile.phase, "error");
    assert.equal(profile.errorCode, "too-many-enabled");
    assert.equal(v.state().controlledExecution, true);
  } finally { h.provider.dispose(); }
});

test("a damaged inventory fails visibly instead of opening the picker", async t => {
  const { h, v, starts, globalStorage } = await applyFixture(t);
  try {
    await writeFile(path.join(globalStorage, PLUGIN_INVENTORY_FILE), "{", "utf8");
    let picks = 0;
    h.api.window.showOpenDialog = async () => { picks += 1; return undefined; };
    v.action("chooseExecutionProfile", { profile: "trusted" });
    for (let i = 0; i < 40; i++) await tick();
    assert.equal(picks, 0);
    assert.equal(starts.length, 1);
    const profile = profileState(v);
    assert.equal(profile.profile, "controlled");
    assert.equal(profile.errorCode, "inventory-unusable");
  } finally { h.provider.dispose(); }
});
