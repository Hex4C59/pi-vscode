import assert from "node:assert/strict";
import test from "node:test";
import type * as vscode from "vscode";
import { readySettings, tick } from "./harness.js";

// Pre-code failures: missing commands, identity/pretty-label confusion, unavailable
// cycles, lost subset on cancel, wrong pending anchor, stale picker and false success.
async function fixture() {
  const f = await readySettings(); const notices: string[] = [];
  const selections: vscode.QuickPickItem[][] = [];
  let pick: ((items: vscode.QuickPickItem[]) => Promise<vscode.QuickPickItem[] | undefined>) = async items => items;
  Object.assign(f.h.api.window, {
    showQuickPick: async (items: vscode.QuickPickItem[], options: vscode.QuickPickOptions) => {
      assert.equal(options.canPickMany, true); selections.push(items); return pick(items);
    },
    showInformationMessage: async (message: string) => { notices.push(message); return undefined; },
  });
  return { ...f, notices, selections, setPick(value: typeof pick) { pick = value; } };
}

test("confirmed available subset cycles exact identities and wraps without changing the existing selector", async () => {
  const f = await fixture(); const { h, r, v } = f;
  try {
    await h.provider.configureModelCycling();
    assert.deepEqual(f.selections[0]?.map(item => item.description), ["A / one", "B / two"]);
    await h.provider.cycleModel(1); assert.equal(v.state().chatModel, "B / two");
    await h.provider.cycleModel(1); assert.equal(v.state().chatModel, "A / one");
    await h.provider.cycleModel(-1); assert.equal(v.state().chatModel, "B / two");
    assert.deepEqual(r.calls.filter(c => c.startsWith("model:")), ["model:B/two", "model:A/one", "model:B/two"]);
    v.action("setChatModel", { provider: "A", modelId: "one" }); await tick();
    assert.equal(v.state().chatModel, "A / one");
  } finally { h.provider.dispose(); }
});

test("initial empty, cancel, confirmed empty and singleton never silently mutate a model", async () => {
  const f = await fixture();
  try {
    await f.h.provider.cycleModel(1); assert.equal(f.r.calls.length, 0);
    assert.ok(f.notices.some(message => /choose.*subset/i.test(message)));
    f.setPick(async items => items.slice(0, 1)); await f.h.provider.configureModelCycling();
    await f.h.provider.cycleModel(1); assert.equal(f.r.calls.length, 0);
    f.setPick(async () => undefined); await f.h.provider.configureModelCycling();
    f.v.action("setChatModel", { provider: "B", modelId: "two" }); await tick(); f.r.calls.length = 0;
    await f.h.provider.cycleModel(-1); assert.ok(f.r.calls.includes("model:A/one"));
    f.setPick(async () => []); await f.h.provider.configureModelCycling(); f.r.calls.length = 0;
    await f.h.provider.cycleModel(1); assert.equal(f.r.calls.length, 0);
  } finally { f.h.provider.dispose(); }
});

test("running task rotates pending next-turn intent and applies only after observed settlement", async () => {
  const f = await fixture();
  try {
    await f.h.provider.configureModelCycling();
    f.v.action("sendChat", { text: "isolated task" }); await tick(); f.r.calls.length = 0;
    await f.h.provider.cycleModel(1); assert.equal(f.v.state().pendingModel?.provider, "B");
    await f.h.provider.cycleModel(1); assert.equal(f.v.state().pendingModel?.provider, "A");
    await f.h.provider.cycleThinkingLevel(1); assert.equal(f.v.state().pendingThinkingLevel, "high");
    await f.h.provider.cycleThinkingLevel(1); assert.equal(f.v.state().pendingThinkingLevel, "off");
    assert.equal(f.r.calls.length, 0);
    f.r.settled(); await tick(); await tick();
    assert.ok(f.r.calls.includes("model:A/one")); assert.ok(f.r.calls.includes("level:off"));
    assert.equal(f.v.state().pendingModel, null); assert.equal(f.v.state().pendingThinkingLevel, null);
  } finally { f.h.provider.dispose(); }
});

test("thinking cycles actual levels and empty levels are explicit without mutation", async () => {
  const f = await fixture();
  try {
    await f.h.provider.cycleThinkingLevel(-1); assert.equal(f.v.state().thinkingLevel, "off");
    await f.h.provider.cycleThinkingLevel(-1); assert.equal(f.v.state().thinkingLevel, "high");
    f.r.setLevels([]);
    f.v.action("setChatModel", { provider: "A", modelId: "one" }); await tick(); f.r.calls.length = 0;
    await f.h.provider.cycleThinkingLevel(1); assert.equal(f.r.calls.length, 0);
    assert.ok(f.notices.some(message => /no.*thinking.*available/i.test(message)));
  } finally { f.h.provider.dispose(); }
});

test("failure keeps actual projection/error and stale subset is intersected with the fresh catalogue", async () => {
  const f = await fixture();
  try {
    await f.h.provider.configureModelCycling();
    f.r.runtime.setModel = async () => ({ ok: false, detail: "fixture failure" });
    await f.h.provider.cycleModel(1);
    assert.equal(f.v.state().chatModel, "A / one"); assert.ok(f.v.state().modelError);
    const previous = f.r.runtime.getModelProjection;
    f.r.runtime.getModelProjection = async () => {
      const value = await previous(); return value.ok ? { ...value, models: [] } : value;
    };
    await f.h.provider.cycleModel(1); f.r.calls.length = 0;
    await f.h.provider.cycleModel(1); assert.equal(f.r.calls.length, 0);
    assert.ok(f.notices.some(message => /no.*subset.*available/i.test(message)));
  } finally { f.h.provider.dispose(); }
});

test("stale or disposed native subset result and overlapping cycle cannot mutate a replacement", async () => {
  const f = await fixture();
  let finish!: (value: vscode.QuickPickItem[]) => void; let items: vscode.QuickPickItem[] = [];
  f.setPick(async value => { items = value; return await new Promise(resolve => { finish = resolve; }); });
  try {
    const choosing = f.h.provider.configureModelCycling(); await tick();
    await f.h.provider.cycleModel(1); assert.equal(f.r.calls.length, 0);
    f.v.action("setChatModel", { provider: "B", modelId: "two" }); await tick();
    finish(items); await choosing; f.r.calls.length = 0;
    await f.h.provider.cycleModel(1); assert.equal(f.r.calls.length, 0);
    const pending = f.h.provider.configureModelCycling(); await tick(); f.h.provider.dispose();
    await pending; finish(items); await tick();
    assert.equal(f.r.calls.length, 0);
  } finally { f.h.provider.dispose(); }
});

test("subset does not survive runtime session replacement and native picker failure preserves it", async () => {
  const f = await fixture();
  try {
    await f.h.provider.configureModelCycling();
    f.setPick(async () => { throw new Error("synthetic picker failure"); });
    await f.h.provider.configureModelCycling(); await f.h.provider.cycleModel(1);
    assert.equal(f.v.state().chatModel, "B / two");
    f.v.action("chooseResources", { choice: "decline" }); await tick();
    f.v.action("chooseResources", { choice: "allow" }); await tick(); await tick(); f.r.calls.length = 0;
    await f.h.provider.cycleModel(1); assert.equal(f.r.calls.length, 0);
    assert.ok(f.notices.some(message => /choose.*subset/i.test(message)));
  } finally { f.h.provider.dispose(); }
});
