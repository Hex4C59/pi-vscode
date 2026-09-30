import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
import { parseHostMessage } from "../parse-host-message.js";
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
    await h.click(".settings-page__nav button:nth-of-type(3)");
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

const inventory = { ...envelope, type: "pluginInventoryState", busy: false, error: null as null, entries: [] as { id: string; displayName: string; enabled: boolean }[] };

test("plugins category shows an empty inventory and asks the host to add from disk", async () => {
  const h = await settingsHarness();
  try {
    await h.receive(config);
    await h.receive(inventory);
    await h.click(".settings-page__nav button:last-child");
    assert.equal(h.get(".settings-page__nav button[aria-current='page']").textContent, "Plugins");
    assert.match(h.get('[role="status"]').textContent ?? "", /No plugins in this inventory/);
    assert.equal(h.root.querySelector('[aria-label="Refresh providers"]'), null);
    await h.click(".settings-page__actions button");
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "addPluginInventoryEntry" });
    await h.receive({ ...inventory, error: "duplicate-path", entries: [{ id: "hello", displayName: "hello.ts", enabled: true }] });
    assert.match(h.get('[role="alert"]').textContent ?? "", /already in the inventory/);
    assert.match(h.get(".settings-page__plugins").textContent ?? "", /hello\.ts/);
  } finally { await h.close(); }
});

test("plugins remove sends the opaque id and discloses that disk files stay", async () => {
  const h = await settingsHarness();
  try {
    await h.receive(config);
    await h.receive({ ...inventory, entries: [{ id: "keep1", displayName: "keep.ts", enabled: true }, { id: "drop1", displayName: "drop.ts", enabled: true }] });
    await h.click(".settings-page__nav button:last-child");
    assert.match(h.root.textContent ?? "", /Files on disk stay/);
    await h.click(".settings-page__plugins .settings-page__row:last-child .settings-page__button");
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "removePluginInventoryEntry", id: "drop1" });
    await h.receive({ ...inventory, entries: [{ id: "keep1", displayName: "keep.ts", enabled: true }] });
    assert.doesNotMatch(h.get(".settings-page__plugins").textContent ?? "", /drop\.ts/);
    await h.receive({ ...inventory, error: "unknown-entry", entries: [{ id: "keep1", displayName: "keep.ts", enabled: true }] });
    assert.match(h.get('[role="alert"]').textContent ?? "", /no longer in the inventory/);
  } finally { await h.close(); }
});

test("plugins enable switch persists the next-apply meaning without loading", async () => {
  const h = await settingsHarness();
  try {
    await h.receive(config);
    await h.receive({ ...inventory, entries: [{ id: "keep1", displayName: "keep.ts", enabled: true }] });
    await h.click(".settings-page__nav button:last-child");
    assert.match(h.root.textContent ?? "", /next idle Trusted apply/);
    assert.equal(h.get('[role="switch"]').getAttribute("aria-checked"), "true");
    await h.click('[role="switch"]');
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "setPluginInventoryEnabled", id: "keep1", enabled: false });
    await h.receive({ ...inventory, entries: [{ id: "keep1", displayName: "keep.ts", enabled: false }] });
    assert.equal(h.get('[role="switch"]').getAttribute("aria-checked"), "false");
  } finally { await h.close(); }
});

test("plugin inventory projections reject paths and extra fields", () => {
  const valid = { version: 3, generation: 1, viewId: "view", type: "pluginInventoryState", busy: false, error: null, entries: [{ id: "a1", displayName: "a.ts", enabled: true }] };
  assert.deepEqual(parseHostMessage(valid), valid);
  assert.equal(parseHostMessage({ ...valid, path: "/secret.ts" }), undefined);
  assert.equal(parseHostMessage({ ...valid, entries: [{ id: "a1", displayName: "a.ts", enabled: true, path: "/a.ts" }] }), undefined);
  assert.equal(parseHostMessage({ ...valid, entries: [{ displayName: "a.ts" }] }), undefined);
  assert.equal(parseHostMessage({ ...valid, entries: [{ id: "a1", displayName: "a.ts" }] }), undefined);
  assert.equal(parseHostMessage({ ...valid, error: "cancelled" }), undefined);
  assert.equal(parseHostMessage({ ...valid, entries: [{ id: "a1", displayName: "a.ts", enabled: true }, { id: "a1", displayName: "b.ts", enabled: false }] }), undefined);
});
