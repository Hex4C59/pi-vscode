import assert from "node:assert/strict";
import { test } from "node:test";
import { SavedDefaultApply, type SavedDefaultApplyConfig, type SavedDefaultApplyModels } from "../savedDefaultApply.js";

function fakeModels(initial: string | null = null, applySetsModel = true): SavedDefaultApplyModels & {
  loads: (string | null)[];
  applied: string[];
  snapshot: { chatModel: string | null };
} {
  const state = { chatModel: initial };
  const loads: (string | null)[] = [];
  const applied: string[] = [];
  return {
    snapshot: state,
    loads,
    applied,
    async load(modelLabel) {
      loads.push(modelLabel);
      state.chatModel = modelLabel;
    },
    async applyConfiguredModel(provider, modelId) {
      applied.push(`${provider}/${modelId}`);
      if (applySetsModel) state.chatModel = `${provider} / ${modelId}`;
    },
  };
}

function fakeConfig(
  defaultProvider: string | null = "hellocode",
  defaultModelId: string | null = "gpt-6-sol",
): SavedDefaultApplyConfig & { refreshes: number } {
  return {
    snapshot: { defaultProvider, defaultModelId },
    refreshes: 0,
    async refresh() { this.refreshes += 1; },
  };
}

test("ready load applies the Saved default and never restarts", async () => {
  const models = fakeModels(null);
  const providerConfig = fakeConfig();
  const restarts: number[] = [];
  const apply = new SavedDefaultApply({
    models, providerConfig, requestRestart: async () => { restarts.push(1); },
  }, () => ({ ready: true, disposed: false }));
  await apply.loadAfterReady(1, () => 1, null);
  assert.deepEqual(models.loads, [null]);
  assert.equal(providerConfig.refreshes, 1);
  assert.deepEqual(models.applied, ["hellocode/gpt-6-sol"]);
  assert.deepEqual(restarts, []);
});

test("ready load skips apply when the Live session already has a model", async () => {
  const models = fakeModels("A / one");
  const apply = new SavedDefaultApply({
    models, providerConfig: fakeConfig(), requestRestart: async () => { throw new Error("must not restart"); },
  }, () => ({ ready: true, disposed: false }));
  await apply.loadAfterReady(1, () => 1, "A / one");
  assert.deepEqual(models.applied, []);
});

test("ready load skips apply after a stale generation, dispose, or unreadiness", async () => {
  const models = fakeModels(null);
  const apply = new SavedDefaultApply({
    models, providerConfig: fakeConfig(), requestRestart: async () => { throw new Error("must not restart"); },
  }, () => ({ ready: true, disposed: false }));
  await apply.loadAfterReady(1, () => 2, null);
  assert.deepEqual(models.applied, []);
  const disposed = fakeModels(null);
  const afterDispose = new SavedDefaultApply({
    models: disposed, providerConfig: fakeConfig(), requestRestart: async () => { throw new Error("must not restart"); },
  }, () => ({ ready: true, disposed: true }));
  await afterDispose.loadAfterReady(1, () => 1, null);
  assert.deepEqual(disposed.applied, []);
  const idle = fakeModels(null);
  const notReady = new SavedDefaultApply({
    models: idle, providerConfig: fakeConfig(), requestRestart: async () => { throw new Error("must not restart"); },
  }, () => ({ ready: false, disposed: false }));
  await notReady.loadAfterReady(1, () => 1, null);
  assert.deepEqual(idle.applied, []);
});

test("sync after write applies then restarts once when the session still has no model", async () => {
  const models = fakeModels(null, false);
  const restarts: number[] = [];
  const apply = new SavedDefaultApply({
    models, providerConfig: fakeConfig("fixture", "old-model"),
    requestRestart: async () => { restarts.push(1); },
  }, () => ({ ready: true, disposed: false }));
  await apply.syncAfterWrite("hellocode", "gpt-6-sol");
  assert.deepEqual(models.applied, ["hellocode/gpt-6-sol"]);
  assert.deepEqual(restarts, [1]);
});

test("sync after write does not restart when apply leaves a Live session model", async () => {
  const models = fakeModels(null, true);
  const restarts: number[] = [];
  const apply = new SavedDefaultApply({
    models, providerConfig: fakeConfig(), requestRestart: async () => { restarts.push(1); },
  }, () => ({ ready: true, disposed: false }));
  await apply.syncAfterWrite();
  assert.deepEqual(models.applied, ["hellocode/gpt-6-sol"]);
  assert.deepEqual(restarts, []);
});

test("sync after write is a no-op when the runtime is not ready", async () => {
  const models = fakeModels(null);
  const apply = new SavedDefaultApply({
    models, providerConfig: fakeConfig(), requestRestart: async () => { throw new Error("must not restart"); },
  }, () => ({ ready: false, disposed: false }));
  await apply.syncAfterWrite("hellocode", "gpt-6-sol");
  assert.deepEqual(models.loads, []);
  assert.deepEqual(models.applied, []);
});
