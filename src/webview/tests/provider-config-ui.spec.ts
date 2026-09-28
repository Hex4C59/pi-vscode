import assert from "node:assert/strict";
import { test } from "node:test";
import { uiHarness } from "./react-harness.js";

test("interface settings lists providers and opens API-key intent without secrets", async () => {
  const h = await uiHarness(true, false, true);
  try {
    const envelope = { version: 3, generation: 1, viewId: "view" };
    await h.receive({
      ...envelope, type: "providerConfigState", busy: false, error: null,
      defaultProvider: null, defaultModelId: null,
      providers: [{
        providerId: "anthropic", displayName: "Anthropic", configured: false,
        authLabel: null, canAddApiKey: true, canLogout: false,
      }],
      catalog: [{ provider: "anthropic", modelId: "claude", label: "Claude" }],
    });
    await h.click('button[aria-label="Interface settings"]');
    assert.match(h.get(".candidate-settings").textContent ?? "", /Providers and models|供应商与模型/);
    assert.match(h.get(".candidate-settings").textContent ?? "", /Anthropic/);
    assert.doesNotMatch(h.get(".candidate-settings").textContent ?? "", /sk-/);
    await h.click(".candidate-settings__provider-actions button");
    assert.ok(h.sent.some(message => message.type === "openProviderApiKey" && message.providerId === "anthropic"));
  } finally { await h.close(); }
});
