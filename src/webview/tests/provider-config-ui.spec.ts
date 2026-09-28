import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
import { uiHarness } from "./react-harness.js";

const envelope = { version: 3, generation: 1, viewId: "view" };

test("interface settings selects a provider and opens API-key intent without secrets", async () => {
  const h = await uiHarness(true, false, true);
  try {
    await h.receive({
      ...envelope, type: "providerConfigState", busy: false, error: null,
      defaultProvider: null, defaultModelId: null,
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
    await h.click('button[aria-label="Interface settings"]');
    const settings = h.get(".candidate-settings");
    assert.match(settings.textContent ?? "", /Providers and models|供应商与模型/);
    assert.match(h.get('[data-testid="configured-providers"]').textContent ?? "", /OpenAI/);
    assert.doesNotMatch(settings.textContent ?? "", /sk-/);
    const select = h.get<HTMLSelectElement>('select[aria-label="Provider"]');
    assert.equal(select.value, "openai");
    assert.match(h.get('[data-testid="selected-provider"]').textContent ?? "", /Configured|已配置/);
    await act(async () => {
      select.value = "anthropic";
      select.dispatchEvent(new h.dom.window.Event("change", { bubbles: true }));
    });
    assert.equal(h.get<HTMLSelectElement>('select[aria-label="Provider"]').value, "anthropic");
    assert.match(h.get('[data-testid="selected-provider"]').textContent ?? "", /Not configured|未配置/);
    await h.click(".candidate-settings__provider-actions button");
    assert.ok(h.sent.some(message => message.type === "openProviderApiKey" && message.providerId === "anthropic"));
  } finally { await h.close(); }
});

test("interface settings keeps the global default-model catalogue", async () => {
  const h = await uiHarness(true, false, true);
  try {
    await h.receive({
      ...envelope, type: "providerConfigState", busy: false, error: null,
      defaultProvider: "openai", defaultModelId: "gpt",
      providers: [{
        providerId: "openai", displayName: "OpenAI", configured: true,
        authLabel: null, canAddApiKey: true, canLogout: true,
      }],
      catalog: [
        { provider: "openai", modelId: "gpt", label: "GPT" },
        { provider: "anthropic", modelId: "claude", label: "Claude" },
      ],
    });
    await h.click('button[aria-label="Interface settings"]');
    const modelSelect = h.get<HTMLSelectElement>('select[aria-label="Default model"]');
    assert.equal(modelSelect.options.length, 3);
    assert.ok([...modelSelect.options].some(option => option.textContent === "Claude"));
    await act(async () => {
      modelSelect.value = "anthropic\0claude";
      modelSelect.dispatchEvent(new h.dom.window.Event("change", { bubbles: true }));
    });
    assert.ok(h.sent.some(message =>
      message.type === "setDefaultModel" && message.provider === "anthropic" && message.modelId === "claude"));
  } finally { await h.close(); }
});
