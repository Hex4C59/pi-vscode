import assert from "node:assert/strict";
import { test } from "node:test";
import { harness, settingsRuntime, tick, folder } from "./harness.js";

function savedDefaultFixture(host: ReturnType<typeof harness>): void {
  const owner = host.provider as unknown as { providerConfig: {
    snapshot: { defaultProvider: string | null; defaultModelId: string | null; busy: boolean; error: string | null };
    refresh(): Promise<void>;
    setDefaultModel(provider: string, modelId: string): Promise<void>;
  } };
  owner.providerConfig.refresh = async () => {};
  owner.providerConfig.setDefaultModel = async (provider, modelId) => {
    Object.assign(owner.providerConfig.snapshot, { defaultProvider: provider, defaultModelId: modelId, busy: false, error: null });
  };
}

test("ready runtime with empty session models applies settings default after provider sync", async () => {
  const r = settingsRuntime();
  const applied: string[] = [];
  r.runtime.getModelProjection = async () => ({
    ok: true, modelLabel: null, thinkingLevel: null, thinkingLevels: [], models: [],
  });
  let currentLabel: string | null = null;
  r.runtime.setModel = async (provider, modelId) => {
    applied.push(`${provider}/${modelId}`);
    currentLabel = `${provider} / ${modelId}`;
    return {
      ok: true, modelLabel: currentLabel, thinkingLevel: "off", thinkingLevels: ["off"],
      models: [{ provider, modelId, label: currentLabel }],
    };
  };
  r.runtime.start = async () => {
    // Simulate a child that already knows settings defaults once restarted.
    currentLabel = "hellocode / gpt-6-sol";
    return { ok: true, modelLabel: currentLabel };
  };
  const h = harness([folder()], true, undefined, r.runtime);
  savedDefaultFixture(h);
  try {
    const v = h.createView();
    v.action("chooseResources", { choice: "allow" });
    await tick(); await tick();
    assert.equal(v.state().chatModel, null, "the session starts without a model projection");
    v.action("setDefaultModel", { provider: "hellocode", modelId: "gpt-6-sol" });
    await tick(); await tick();
    assert.deepEqual(applied, ["hellocode/gpt-6-sol"]);
    const state = v.state();
    assert.equal(state.runtime, "ready");
    assert.equal(state.chatModel, "hellocode / gpt-6-sol");
  } finally { h.provider.dispose(); }
});

test("a provider refresh that never settles cannot hold a conversation switch or the composer", async () => {
  const r = settingsRuntime();
  let starts = 0;
  const start = r.runtime.start;
  r.runtime.start = async options => { starts++; return start(options); };
  const h = harness([folder()], true, undefined, r.runtime);
  (h.provider as unknown as { providerConfig: { refresh(): Promise<void> } }).providerConfig.refresh = () => new Promise(() => {});
  h.api.window.showWarningMessage = async (_message, _options, ...buttons) => buttons[0];
  try {
    const v = h.createView();
    v.action("chooseResources", { choice: "allow" });
    await tick(); await tick();
    assert.equal(starts, 1);
    v.action("newConversation");
    await tick(); await tick();
    assert.equal(starts, 2);
    const sessions = [...v.sent].reverse().find(message => (message as { type: string }).type === "sessionState") as { phase: string };
    assert.equal(sessions.phase, "idle");
    const state = v.state();
    assert.equal(state.runtime, "ready");
    assert.equal(state.modelBusy, false);
    assert.equal(state.chatModel, "A / one");
    v.action("sendChat", { text: "after switch" });
    await tick();
    assert.equal(r.calls.filter(call => call === "prompt").length, 1);
  } finally { h.provider.dispose(); }
});

test("refresh providers re-applies the saved default into the live session", async () => {
  const r = settingsRuntime();
  const applied: string[] = [];
  let projection = {
    ok: true as const, modelLabel: null as string | null, thinkingLevel: null as string | null,
    thinkingLevels: [] as string[], models: [] as { provider: string; modelId: string; label: string }[],
  };
  r.runtime.getModelProjection = async () => projection;
  r.runtime.setModel = async (provider, modelId) => {
    applied.push(`${provider}/${modelId}`);
    projection = {
      ok: true, modelLabel: `${provider} / ${modelId}`, thinkingLevel: "off", thinkingLevels: ["off"],
      models: [{ provider, modelId, label: `${provider} / ${modelId}` }],
    };
    return projection;
  };
  const h = harness([folder()], true, undefined, r.runtime);
  savedDefaultFixture(h);
  try {
    const v = h.createView();
    v.action("chooseResources", { choice: "allow" });
    await tick();
    v.action("setDefaultModel", { provider: "hellocode", modelId: "gpt-6-sol" });
    await tick(); await tick();
    assert.equal(v.state().chatModel, "hellocode / gpt-6-sol");
    const beforeRefresh = applied.length;
    // Simulate a stale empty session while settings still hold the default.
    projection = { ok: true, modelLabel: null, thinkingLevel: null, thinkingLevels: [], models: [] };
    v.action("refreshProviderConfig");
    await tick(); await tick();
    assert.equal(applied.length, beforeRefresh + 1, "refresh must apply the saved default again");
    assert.equal(applied.at(-1), "hellocode/gpt-6-sol");
    assert.equal(v.state().chatModel, "hellocode / gpt-6-sol");
  } finally { h.provider.dispose(); }
});
