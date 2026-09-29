import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
import { settingsHarness } from "./react-harness.js";

const envelope = { version: 3, generation: 1, viewId: "view" };
const config = { ...envelope, type: "providerConfigState", busy: false, error: null,
  defaultProvider: "openai", defaultModelId: "gpt", defaultThinkingLevel: null, thinkingLevels: [],
  providers: [
    { providerId: "openai", displayName: "OpenAI", configured: true, authLabel: "stored", canAddApiKey: true, canLogout: true, canSignIn: false, canRemoveEndpoint: false },
    { providerId: "anthropic", displayName: "Anthropic", configured: false, authLabel: null, canAddApiKey: true, canLogout: false, canSignIn: false, canRemoveEndpoint: false },
  ], catalog: [{ provider: "openai", modelId: "gpt", label: "GPT" }],
};

test("settings separate tasks without routine explanation paragraphs and language waits for host", async () => {
  const h = await settingsHarness();
  try {
    assert.match(h.root.textContent ?? "", /Loading providers/);
    await h.receive(config);
    assert.equal(h.root.querySelectorAll(".settings-page__actions").length, 0);
    assert.doesNotMatch(h.root.textContent ?? "", /This session:|connection test|Configured providers:|Runtime is idle/);
    await h.click(".settings-page__nav button:first-of-type");
    assert.equal(h.dom.window.document.activeElement === h.get("h2"), true);
    const language = h.get<HTMLSelectElement>("select");
    await act(async () => { language.value = "zh-CN"; language.dispatchEvent(new h.dom.window.Event("change", { bubbles: true })); });
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "setUiLanguage", locale: "zh-CN" });
    await h.receive({ ...envelope, type: "uiLanguageState", locale: "zh-CN" });
    assert.equal(h.get("h2").textContent, "通用");
    assert.equal(h.get<HTMLSelectElement>("select").value, "zh-CN");
    assert.doesNotMatch(h.root.textContent ?? "", /仅用于本视图|当前会话：|已配置：|运行时空闲/);
  } finally { await h.close(); }
});

test("provider detail survives refresh and keeps busy guards and errors visible", async () => {
  const h = await settingsHarness();
  try {
    await h.receive(config);
    await h.click(".settings-page__nav button:last-child");
    await h.click(".settings-page__providers button:last-child");
    await h.receive({ ...config, busy: true });
    assert.equal(h.get("h2").textContent, "Anthropic");
    assert.equal(h.get<HTMLButtonElement>(".settings-page__actions button").disabled, true);
    assert.equal(h.get('[aria-label="Refreshing providers…"]').getAttribute("aria-busy"), "true");
    await h.receive({ ...config, error: "Could not refresh provider configuration." });
    assert.equal(h.get("h2").textContent, "Anthropic");
    assert.match(h.get('[role="alert"]').textContent ?? "", /Could not refresh/);
  } finally { await h.close(); }
});

test("settings rejects obsolete and foreign projections, and handles empty search results", async () => {
  const h = await settingsHarness();
  try {
    await h.receive(config);
    await h.receive({ ...config, generation: 2, catalog: [{ provider: "anthropic", modelId: "claude", label: "Claude" }] });
    assert.equal(h.get(".settings-page__model").textContent, "Claudeanthropic");
    await h.receive({ ...config, catalog: [] });
    assert.equal(h.get(".settings-page__model").textContent, "Claudeanthropic");
    await h.receive({ ...config, generation: 2, viewId: "foreign", catalog: [] });
    assert.equal(h.get(".settings-page__model").textContent, "Claudeanthropic");
    await h.receive({ ...envelope, type: "uiLanguageState", locale: "fr" });
    assert.equal(h.get(".settings-page").getAttribute("lang"), "en");
    await h.input("missing", "#settings-model-search");
    assert.match(h.get('[role="status"]').textContent ?? "", /No matching models/);
    await h.receive({ ...config, generation: 3, catalog: [] });
    assert.match(h.get('[role="status"]').textContent ?? "", /No models available/);
    await h.unmount();
    assert.equal(h.listeners.size, 0);
  } finally { await h.close(); }
});
