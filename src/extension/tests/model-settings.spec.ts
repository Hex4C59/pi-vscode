import assert from "node:assert/strict";
import { test } from "node:test";
import { ModelSettings } from "../modelSettings.js";
import type { ModelProjectionResult } from "../runtimeLifecycle.js";

const projection = (modelLabel = "A / one", thinkingLevel = "off"): ModelProjectionResult => ({
  ok: true, modelLabel, thinkingLevel, thinkingLevels: ["off", "high"],
  models: [{ provider: "A", modelId: "one", label: "One" }, { provider: "B", modelId: "two", label: "Two" }],
});
const context = () => ({ generation: 1, session: 1, ready: true, disposed: false, blocked: false, chatBusy: false, stopping: false });

test("model settings defer during execution and Stop, then apply the latest intent in order", async () => {
  const current = context();
  const calls: string[] = [];
  let label = "A / one";
  const settings = new ModelSettings({
    async getModelProjection() { return projection(label); },
    async setModel(provider, id) { label = `${provider} / ${id}`; calls.push(label); return projection(label); },
    async setThinkingLevel(level) { calls.push(level); return projection(label, level); },
  }, () => current, () => {});
  await settings.load(label);
  current.chatBusy = true;
  await settings.select({ type: "setChatModel", provider: "A", modelId: "one" });
  await settings.select({ type: "setChatModel", provider: "B", modelId: "two" });
  await settings.select({ type: "setThinkingLevel", level: "high" });
  assert.deepEqual(calls, []);
  assert.equal(settings.snapshot.chatModel, "A / one");
  current.chatBusy = false;
  current.stopping = true;
  await settings.applyPending();
  assert.deepEqual(calls, []);
  current.stopping = false;
  await settings.applyPending();
  assert.deepEqual(calls, ["B / two", "high"]);
  assert.equal(settings.snapshot.thinkingLevel, "high");
  assert.equal(settings.snapshot.pendingModel, null);
  assert.equal(settings.snapshot.modelBusy, false);
});

test("reset and replacement make a late model mutation unable to overwrite the new projection", async () => {
  const current = context();
  let finish!: (result: ModelProjectionResult) => void;
  const settings = new ModelSettings({
    async getModelProjection() { return projection(current.session === 1 ? "A / one" : "Replacement"); },
    setModel() { return new Promise(resolve => { finish = resolve; }); },
    async setThinkingLevel() { throw new Error("Unexpected thinking mutation"); },
  }, () => current, () => {});
  await settings.load("A / one");
  const pending = settings.select({ type: "setChatModel", provider: "B", modelId: "two" });
  assert.equal(settings.snapshot.modelBusy, true);
  settings.reset();
  current.session++;
  await settings.load("Replacement");
  finish(projection("B / two"));
  await pending;
  assert.equal(settings.snapshot.chatModel, "Replacement");
  assert.equal(settings.snapshot.pendingModel, null);
  assert.equal(settings.snapshot.modelBusy, false);
});

test("a failed mutation reads back once without retrying or exposing the thrown error", async () => {
  let reads = 0;
  let mutations = 0;
  const settings = new ModelSettings({
    async getModelProjection() { reads++; return projection(reads === 1 ? "A / one" : "Actual model"); },
    async setModel() { mutations++; throw new Error("private provider detail"); },
    async setThinkingLevel() { throw new Error("Unexpected thinking mutation"); },
  }, context, () => {});
  await settings.load("A / one");
  await settings.select({ type: "setChatModel", provider: "B", modelId: "two" });
  assert.equal(reads, 2);
  assert.equal(mutations, 1);
  assert.equal(settings.snapshot.chatModel, "Actual model");
  assert.equal(settings.snapshot.modelBusy, false);
  assert.equal(settings.snapshot.pendingModel, null);
  assert.equal(settings.snapshot.modelError, "Could not apply model settings. Select again to retry.");
});
