import assert from "node:assert/strict";
import { test } from "node:test";
import type { PiRuntimeLifecycle } from "../../contracts/runtimeLifecycle.js";
import { prepareTestPrompt, folder, harness, readySettings, tick } from "../../tests/harness.js";

test("setThinkingLevel and setChatModel update projection and reject stale or busy operations", async () => {
  const calls: string[] = [];
  const runtime: PiRuntimeLifecycle = {
    preparePrompt: prepareTestPrompt,
    async start() { return { ok: true, modelLabel: "A / one" }; },
    async stop() { /* noop */ },
    getSession() { return 3; },
    subscribe() { return () => undefined; },
    async prompt() { return { ok: true }; },
    async getModelProjection() {
      return {
        ok: true,
        modelLabel: "A / one",
        thinkingLevel: "medium",
        thinkingLevels: ["off", "medium", "high"],
        models: [{ provider: "A", modelId: "one", label: "One" }, { provider: "B", modelId: "two", label: "Two" }],
      };
    },
    async setThinkingLevel(level) {
      calls.push(`level:${level}`);
      return {
        ok: true,
        modelLabel: "A / one",
        thinkingLevel: level,
        thinkingLevels: ["off", "medium", "high"],
        models: [{ provider: "A", modelId: "one", label: "One" }, { provider: "B", modelId: "two", label: "Two" }],
      };
    },
    async setModel(provider, modelId) {
      calls.push(`model:${provider}/${modelId}`);
      return {
        ok: true,
        modelLabel: `${provider} / ${modelId}`,
        thinkingLevel: "off",
        thinkingLevels: ["off"],
        models: [{ provider: "A", modelId: "one", label: "One" }, { provider: "B", modelId: "two", label: "Two" }],
      };
    },
  };
  const h = harness([folder()], true, undefined, runtime);
  const v = h.createView();
  v.action("chooseResources", { choice: "allow" });
  await tick(); await tick(); await tick();
  assert.equal(v.state().thinkingLevel, "medium");
  v.action("setThinkingLevel", { level: "high" });
  await tick();
  assert.deepEqual(calls, ["level:high"]);
  assert.equal(v.state().thinkingLevel, "high");
  v.action("setChatModel", { provider: "B", modelId: "two" });
  await tick();
  assert.equal(v.state().chatModel, "B / two");
  v.action("sendChat", { text: "x" });
  v.action("setThinkingLevel", { level: "off" });
  await tick();
  assert.deepEqual(calls, ["level:high", "model:B/two"]);
  h.provider.dispose();
});

test("streaming selections replace pending intent without mutation; settled applies model then thinking", async () => {
  const { r, h, v } = await readySettings();
  v.action("sendChat", { text: "first" });
  v.action("setChatModel", { provider: "A", modelId: "one" });
  v.action("setThinkingLevel", { level: "medium" });
  v.action("setChatModel", { provider: "B", modelId: "two" });
  v.action("setThinkingLevel", { level: "high" });
  await tick();
  assert.deepEqual(r.calls, ["prompt"]);
  assert.equal(v.state().chatModel, "A / one");
  assert.equal(v.state().thinkingLevel, "medium");
  assert.equal(v.state().pendingModel?.modelId, "two");
  assert.equal(v.state().pendingThinkingLevel, "high");
  r.events.fire({ kind: "agent_settled", session: -1 });
  assert.equal(v.state().chatBusy, true);
  r.settled(); r.settled();
  v.action("sendChat", { text: "blocked" });
  assert.equal(v.state().modelBusy, true);
  await tick();
  assert.deepEqual(r.calls, ["prompt", "model:B/two", "level:high"]);
  assert.equal(v.state().chatModel, "B / two");
  assert.equal(v.state().thinkingLevel, "high");
  assert.equal(v.state().pendingModel, null);
  assert.equal(v.state().pendingThinkingLevel, null);
  assert.equal(v.state().modelBusy, false);
  h.provider.dispose();
});

test("unsupported pending thinking is explicitly rejected after refreshed model capabilities", async () => {
  const { r, h, v } = await readySettings();
  v.action("sendChat", { text: "first" });
  v.action("setThinkingLevel", { level: "high" });
  v.action("setChatModel", { provider: "B", modelId: "two" });
  r.setLevels(["off"]); r.settled(); await tick();
  assert.deepEqual(r.calls, ["prompt", "model:B/two", "read"]);
  assert.match(v.state().modelError ?? "", /not supported.*not applied/);
  assert.equal(v.state().chatModel, "B / two");
  assert.equal(v.state().pendingThinkingLevel, null);
  h.provider.dispose();
});

test("mutation and recovery failures use fixed safe messages and always release busy", async () => {
  for (const operation of ["model", "thinking"]) for (const failure of ["result", "throw"]) {
    const { r, h, v } = await readySettings();
    const fail = async () => {
      if (failure === "throw") throw new Error("SECRET");
      return { ok: false as const, detail: "SECRET" };
    };
    if (operation === "model") r.runtime.setModel = fail;
    else r.runtime.setThinkingLevel = fail;
    r.runtime.getModelProjection = fail;
    v.action(operation === "model" ? "setChatModel" : "setThinkingLevel",
      operation === "model" ? { provider: "B", modelId: "two" } : { level: "high" });
    await tick();
    assert.equal(v.state().modelBusy, false);
    assert.equal(v.state().pendingModel, null);
    assert.equal(v.state().pendingThinkingLevel, null);
    assert.equal(v.state().chatModel, null);
    assert.match(v.state().modelError ?? "", /Select again/);
    assert.doesNotMatch(JSON.stringify(v.sent), /SECRET/);
    h.provider.dispose();
  }
});

test("pending configuration survives view recreation and ignores old page actions", async () => {
  const { r, h, v } = await readySettings();
  v.action("sendChat", { text: "first" });
  v.action("setThinkingLevel", { level: "high" });
  const generation = v.state().generation;
  const fresh = h.createView();
  v.send("setThinkingLevel", { generation, level: "off" });
  assert.equal(fresh.state().pendingThinkingLevel, "high");
  r.settled(); await tick();
  assert.equal(fresh.state().thinkingLevel, "high");
  assert.equal(fresh.state().modelBusy, false);
  h.provider.dispose();
});

test("in-flight settings completion cannot overwrite replacement runtime or workspace", async () => {
  for (const invalidation of ["workspace", "resources", "dispose", "view"]) {
    const { r, h, v } = await readySettings();
    let finish!: (value: Awaited<ReturnType<PiRuntimeLifecycle["setModel"]>>) => void;
    r.runtime.setModel = () => new Promise(resolve => { finish = resolve; });
    v.action("sendChat", { text: "first" });
    v.action("setChatModel", { provider: "B", modelId: "two" });
    v.action("setThinkingLevel", { level: "high" });
    r.settled(); await tick();
    let fresh = v;
    if (invalidation === "workspace") { h.api.workspace.workspaceFolders = [folder("/next")]; h.change.fire(); }
    if (invalidation === "resources") v.action("chooseResources", { choice: "decline" });
    if (invalidation === "dispose") h.provider.dispose();
    if (invalidation === "view") fresh = h.createView();
    await tick();
    finish({ ok: true, modelLabel: "Late", thinkingLevel: "off", thinkingLevels: ["off", "high"], models: [] });
    await tick();
    if (invalidation === "view") {
      assert.ok(r.calls.includes("level:high")); assert.equal(fresh.state().modelBusy, false);
    } else {
      assert.ok(!r.calls.includes("level:high"));
      if (invalidation !== "dispose") {
        assert.notEqual(fresh.state().chatModel, "Late");
        assert.equal(fresh.state().pendingModel, null); assert.equal(fresh.state().modelBusy, false);
      }
    }
    h.provider.dispose();
  }
});

test("queued configuration clears before resource and workspace replacements", async () => {
  for (const kind of ["workspace", "resources"]) {
    const { r, h, v } = await readySettings();
    v.action("sendChat", { text: "first" });
    v.action("setThinkingLevel", { level: "high" });
    if (kind === "workspace") { h.api.workspace.workspaceFolders = [folder("/new")]; h.change.fire(); }
    else v.action("chooseResources", { choice: "decline" });
    r.settled(); await tick();
    assert.equal(v.state().pendingThinkingLevel, null);
    assert.ok(!r.calls.includes("level:high"));
    h.provider.dispose();
  }
});

test("deferred thinking failure preserves confirmed model without exposing exception", async () => {
  const { r, h, v } = await readySettings();
  v.action("sendChat", { text: "first" });
  v.action("setChatModel", { provider: "B", modelId: "two" });
  v.action("setThinkingLevel", { level: "high" });
  r.runtime.setThinkingLevel = async () => { throw new Error("SECRET"); };
  r.settled(); await tick();
  assert.equal(v.state().chatModel, "B / two");
  assert.equal(v.state().thinkingLevel, "medium");
  assert.equal(v.state().modelBusy, false);
  assert.match(v.state().modelError ?? "", /Could not apply/);
  assert.doesNotMatch(JSON.stringify(v.sent), /SECRET/);
  h.provider.dispose();
});
