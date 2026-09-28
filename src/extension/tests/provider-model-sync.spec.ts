import assert from "node:assert/strict";
import { test } from "node:test";
import { harness, settingsRuntime, tick, folder } from "./harness.js";

test("ready runtime with empty session models applies settings default after provider sync", async () => {
  const r = settingsRuntime();
  r.runtime.getModelProjection = async () => ({
    ok: true, modelLabel: null, thinkingLevel: null, thinkingLevels: [], models: [],
  });
  let currentLabel: string | null = null;
  r.runtime.setModel = async (provider, modelId) => {
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
  const v = h.createView();
  v.action("chooseResources", { choice: "allow" });
  await tick();
  // Force empty projection after start load settles.
  r.runtime.getModelProjection = async () => ({
    ok: true, modelLabel: null, thinkingLevel: null, thinkingLevels: [], models: [],
  });
  await tick();
  v.action("setDefaultModel", { provider: "hellocode", modelId: "gpt-6-sol" });
  await tick();
  await tick();
  const state = v.state();
  assert.equal(state.runtime, "ready");
  assert.ok(state.chatModel, `expected chatModel after setDefaultModel, got ${state.chatModel}`);
  assert.match(state.chatModel ?? "", /hellocode|gpt-6-sol|GPT/i);
});

test("a provider refresh that never settles cannot hold a conversation switch or the composer", async () => {
  const r = settingsRuntime();
  const h = harness([folder()], true, undefined, r.runtime);
  (h.provider as unknown as { providerConfig: { refresh(): Promise<void> } }).providerConfig.refresh = () => new Promise(() => {});
  h.api.window.showWarningMessage = async (_message, _options, ...buttons) => buttons[0];
  try {
    const v = h.createView();
    v.action("chooseResources", { choice: "allow" });
    await tick(); await tick();
    v.action("newConversation");
    await tick(); await tick();
    const sessions = [...v.sent].reverse().find(message => (message as { type: string }).type === "sessionState") as { phase: string };
    assert.equal(sessions.phase, "idle");
    const state = v.state();
    assert.equal(state.runtime, "ready");
    assert.equal(state.modelBusy, false);
    assert.equal(state.chatModel, "A / one");
  } finally { h.provider.dispose(); }
});

test("refresh providers re-applies the saved default into the live session", async () => {
  const r = settingsRuntime();
  let projection = {
    ok: true as const, modelLabel: null as string | null, thinkingLevel: null as string | null,
    thinkingLevels: [] as string[], models: [] as { provider: string; modelId: string; label: string }[],
  };
  r.runtime.getModelProjection = async () => projection;
  r.runtime.setModel = async (provider, modelId) => {
    projection = {
      ok: true, modelLabel: `${provider} / ${modelId}`, thinkingLevel: "off", thinkingLevels: ["off"],
      models: [{ provider, modelId, label: `${provider} / ${modelId}` }],
    };
    return projection;
  };
  const h = harness([folder()], true, undefined, r.runtime);
  const v = h.createView();
  v.action("chooseResources", { choice: "allow" });
  await tick();
  v.action("setDefaultModel", { provider: "hellocode", modelId: "gpt-6-sol" });
  await tick();
  // Simulate a stale empty session while settings still hold the default.
  projection = { ok: true, modelLabel: null, thinkingLevel: null, thinkingLevels: [], models: [] };
  await r.runtime.getModelProjection(); // keep types warm
  v.action("refreshProviderConfig");
  await tick();
  await tick();
  const state = v.state();
  assert.ok(state.chatModel, `refresh should restore chatModel, got ${JSON.stringify({ chatModel: state.chatModel, modelError: state.modelError })}`);
});
