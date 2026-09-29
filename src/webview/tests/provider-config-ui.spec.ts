import assert from "node:assert/strict";
import { test } from "node:test";
import { settingsHarness } from "./react-harness.js";

const envelope = { version: 3, generation: 1, viewId: "view" };

test("editor settings selects a provider and opens API-key intent without secrets", async () => {
  const h = await settingsHarness();
  try {
    await h.receive({
      ...envelope, type: "providerConfigState", busy: false, error: null,
      defaultProvider: null, defaultModelId: null, defaultThinkingLevel: null, thinkingLevels: [],
      providers: [
        {
          providerId: "anthropic", displayName: "Anthropic", configured: false,
          authLabel: null, canAddApiKey: true, canLogout: false,
        },
        {
          providerId: "openai", displayName: "OpenAI", configured: true,
          authLabel: "api_key", canAddApiKey: true, canLogout: true,
        },
      ],
      catalog: [
        { provider: "openai", modelId: "gpt", label: "GPT" },
        { provider: "anthropic", modelId: "claude", label: "Claude" },
      ],
    });

    assert.equal(h.root.querySelector('input[type="password"]'), null);
    assert.equal(h.root.querySelector(".settings-page__actions"), null);
    await h.click(".settings-page__nav button:last-child");
    await h.click(".settings-page__providers button:last-child");
    assert.match(h.get(".settings-page__actions").textContent ?? "", /Update API key/);
    assert.equal(h.get(".settings-page__actions").querySelectorAll("button").length, 2);
    await h.click('button[aria-label="Back to providers"]');
    await h.click(".settings-page__providers button:first-child");
    assert.equal(h.get(".settings-page__actions").querySelectorAll("button").length, 1);
    await h.click(".settings-page__actions button");
    assert.ok(h.sent.some(message => message.type === "openProviderApiKey" && message.providerId === "anthropic"));
  } finally { await h.close(); }
});

test("editor settings keeps the global default-model catalogue", async () => {
  const h = await settingsHarness();
  try {
    await h.receive({
      ...envelope, type: "providerConfigState", busy: false, error: null,
      defaultProvider: "openai", defaultModelId: "gpt", defaultThinkingLevel: null, thinkingLevels: [],
      providers: [{
        providerId: "openai", displayName: "OpenAI", configured: true,
        authLabel: null, canAddApiKey: true, canLogout: true,
      }],
      catalog: [
        { provider: "openai", modelId: "gpt", label: "GPT" },
        { provider: "anthropic", modelId: "claude", label: "Claude" },
      ],
    });

    assert.equal(h.root.querySelectorAll(".settings-page__model").length, 2);
    assert.equal(h.get('.settings-page__model[aria-pressed="true"]').textContent, "GPTopenai");
    await h.input("claude", "#settings-model-search");
    assert.equal(h.root.querySelectorAll(".settings-page__model").length, 1);
    await h.click(".settings-page__model");
    assert.ok(h.sent.some(message =>
      message.type === "setDefaultModel" && message.provider === "anthropic" && message.modelId === "claude"));
  } finally { await h.close(); }
});
