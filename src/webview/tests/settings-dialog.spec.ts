import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
import { productionHarness, uiHarness } from "./react-harness.js";

const envelope = { version: 3, generation: 1, viewId: "view" };

test("settings keep default-model choice distinct from the live session model", async () => {
  const h = await uiHarness(true, false, true);
  try {
    await h.render({ chatModel: "GPT-5" });
    await h.receive({
      ...envelope, type: "providerConfigState", busy: false, error: null,
      defaultProvider: "openai", defaultModelId: "gpt", defaultThinkingLevel: null, thinkingLevels: [],
      providers: [{ providerId: "openai", displayName: "OpenAI", configured: true, authLabel: "stored", canAddApiKey: true, canLogout: true }],
      catalog: [{ provider: "openai", modelId: "gpt", label: "GPT" }],
    });
    await h.click('button[aria-label="Interface settings"]');
    const settings = h.get(".candidate-settings");
    assert.match(settings.textContent ?? "", /Saved default\. This is not a connection test/);
    assert.match(h.get('[data-testid="session-model"]').textContent ?? "", /This session: GPT-5/);
    assert.match(settings.textContent ?? "", /Changing the default does not replace the current session model/);
    assert.match(settings.textContent ?? "", /not that a connection test succeeded/);
  } finally { await h.close(); }
});

test("provider errors stay beside provider actions and refresh keeps the selected provider", async () => {
  const h = await uiHarness(true, false, true);
  try {
    await h.receive({
      ...envelope, type: "providerConfigState", busy: false, error: null,
      defaultProvider: "openai", defaultModelId: "gpt", defaultThinkingLevel: null, thinkingLevels: [],
      providers: [
        { providerId: "openai", displayName: "OpenAI", configured: true, authLabel: "stored", canAddApiKey: true, canLogout: true },
        { providerId: "anthropic", displayName: "Anthropic", configured: false, authLabel: null, canAddApiKey: true, canLogout: false },
      ],
      catalog: [{ provider: "openai", modelId: "gpt", label: "GPT" }],
    });
    await h.click('button[aria-label="Interface settings"]');
    const select = h.get<HTMLSelectElement>('select[aria-label="Provider"]');
    await act(async () => {
      select.value = "anthropic";
      select.dispatchEvent(new h.dom.window.Event("change", { bubbles: true }));
    });
    await h.receive({
      ...envelope, type: "providerConfigState", busy: true, error: null,
      defaultProvider: "openai", defaultModelId: "gpt", defaultThinkingLevel: null, thinkingLevels: [],
      providers: [
        { providerId: "openai", displayName: "OpenAI", configured: true, authLabel: "stored", canAddApiKey: true, canLogout: true },
        { providerId: "anthropic", displayName: "Anthropic", configured: false, authLabel: null, canAddApiKey: true, canLogout: false },
      ],
      catalog: [{ provider: "openai", modelId: "gpt", label: "GPT" }],
    });
    assert.equal(h.get<HTMLSelectElement>('select[aria-label="Provider"]').value, "anthropic");
    assert.equal(h.get('[data-provider-status]').getAttribute("data-provider-status"), "busy");
    await h.receive({
      ...envelope, type: "providerConfigState", busy: false, error: "Could not refresh provider configuration.",
      defaultProvider: "openai", defaultModelId: "gpt", defaultThinkingLevel: null, thinkingLevels: [],
      providers: [
        { providerId: "openai", displayName: "OpenAI", configured: true, authLabel: "stored", canAddApiKey: true, canLogout: true },
        { providerId: "anthropic", displayName: "Anthropic", configured: false, authLabel: null, canAddApiKey: true, canLogout: false },
      ],
      catalog: [{ provider: "openai", modelId: "gpt", label: "GPT" }],
    });
    assert.equal(h.get<HTMLSelectElement>('select[aria-label="Provider"]').value, "anthropic");
    const error = h.get(".candidate-settings__error");
    assert.equal(h.get('[data-testid="selected-provider"]').contains(error), true);
    const defaultModel = h.get('select[aria-label="Default model"]');
    assert.equal(defaultModel.compareDocumentPosition(error) & h.dom.window.Node.DOCUMENT_POSITION_FOLLOWING, h.dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
    assert.doesNotMatch(h.get(".candidate-settings").textContent ?? "", /sk-/);
  } finally { await h.close(); }
});

test("no-folder keep-editing retains the draft and does not open a folder", async () => {
  const h = await productionHarness(false);
  try {
    await h.render({ status: "no-folder", folder: null, choice: null, runtime: "not-started", chatModel: null, availableModels: [] });
    await h.input("Keep this draft", "textarea");
    await h.click('button[aria-label="Send message"]');
    assert.match(h.get(".candidate-folder-prompt").textContent ?? "", /A folder is required to send a message or add context/);
    assert.match(h.get(".candidate-folder-prompt").textContent ?? "", /Cancel keeps this draft/);
    await h.click('button[aria-label="Keep editing"]');
    assert.equal(h.root.querySelector(".candidate-folder-prompt"), null);
    assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep this draft");
    assert.ok(!h.sent.some(message => message.type === "openFolder" || message.type === "sendChat"));
  } finally { await h.close(); }
});

test("project-resource cancel keeps the draft and never grants consent", async () => {
  const h = await productionHarness();
  try {
    await h.render({ choice: null, runtime: "not-started" });
    await h.input("Keep on cancel", "textarea");
    await h.click('button[aria-label="Send message"]');
    assert.match(h.get(".candidate-folder-prompt").textContent ?? "", /does not grant consent or start a runtime/);
    await h.click('.candidate-dialog__action.is-quiet');
    assert.equal(h.root.querySelector("dialog"), null);
    assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep on cancel");
    assert.ok(!h.sent.some(message => message.type === "chooseResources"));
  } finally { await h.close(); }
});
