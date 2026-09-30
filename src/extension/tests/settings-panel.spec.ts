import assert from "node:assert/strict";
import { test } from "node:test";
import { harness, readySettings, tick } from "./harness.js";
import { parseHostMessage } from "../../webview/client/parse-host-message.js";
import { parseWebviewMessage } from "../bridge/webviewMessages.js";

test("settings reuses one editor panel, projects no chat, and closing retains runtime and draft", async () => {
  const { h, v, r } = await readySettings();
  try {
    const draft = v.attachments().draft;
    v.action("updateDraft", { draftRevision: draft.revision, editSequence: draft.acceptedEditSequence + 1, text: "Keep this draft" });
    v.action("openSettings");
    const panel = h.panels[0]; assert.ok(panel);
    assert.equal(panel.column, 1);
    assert.match(panel.webview.html, /data-pi-surface="settings"/);
    panel.receive.fire({ version: 3, type: "getWorkspaceState" });
    const states = panel.sent.map(parseHostMessage);
    assert.ok(states.every(state => state?.type === "uiLanguageState" || state?.type === "providerConfigState" || state?.type === "pluginInventoryState"));
    assert.ok(states.some(state => state?.type === "pluginInventoryState"));
    assert.ok(states[0]);
    assert.notEqual(states[0].viewId, v.state().viewId);
    v.action("openSettings"); assert.equal(h.panels.length, 1); assert.equal(panel.reveals, 1);
    const session = r.runtime.getSession();
    panel.dispose(); await tick();
    assert.equal(v.attachments().draft.text, "Keep this draft");
    assert.equal(r.runtime.getSession(), session);
    assert.equal(v.state().runtime, "ready");
    assert.deepEqual(r.calls, []);
    assert.equal(panel.receive.listeners.size, 0);
    v.action("openSettings");
    h.panels[1].receive.fire({ version: 3, type: "getWorkspaceState" });
    assert.notEqual(parseHostMessage(h.panels[1].sent[0])?.viewId, states[0].viewId);
  } finally { h.provider.dispose(); }
});

test("settings identity and capability allowlist block chat, execution and foreign mutations", async () => {
  const { h, v, r } = await readySettings();
  try {
    const draft = v.attachments().draft;
    v.action("updateDraft", { draftRevision: draft.revision, editSequence: draft.acceptedEditSequence + 1, text: "Keep this draft" });
    v.action("openSettings"); const panel = h.panels[0];
    panel.receive.fire({ version: 3, type: "getWorkspaceState" });
    const state = parseHostMessage(panel.sent[0]); assert.ok(state);
    const envelope = { version: 3, viewId: state.viewId, generation: state.generation };
    const currentDraft = v.attachments().draft;
    for (const intent of [
      { type: "chooseResources", choice: "decline" }, { type: "chooseExecutionProfile", profile: "trusted" },
      { type: "sendChat", draftRevision: currentDraft.revision },
      { type: "updateDraft", draftRevision: currentDraft.revision, editSequence: currentDraft.acceptedEditSequence + 1, text: "bad" },
      { type: "setChatModel", provider: "B", modelId: "two" },
      { type: "openFolder" }, { type: "openSettings" }, { type: "newConversation" },
      { type: "decideApproval", id: "a", decision: "session" },
    ]) {
      const message = { ...envelope, ...intent };
      assert.ok(parseWebviewMessage(message), `${intent.type} must be a valid protocol message`);
      panel.receive.fire(message);
    }
    panel.receive.fire({ ...envelope, type: "setUiLanguage", locale: "fr" });
    panel.receive.fire({ ...envelope, type: "setUiLanguage", locale: "zh-CN", viewId: v.state().viewId });
    panel.receive.fire({ ...envelope, type: "setUiLanguage", locale: "zh-CN", generation: state.generation + 1 });
    await tick();
    assert.equal(v.state().choice, "allow");
    assert.equal(v.state().runtime, "ready");
    assert.equal(v.state().chatModel, "A / one");
    assert.equal(v.attachments().draft.text, "Keep this draft");
    assert.deepEqual(r.calls, []);
    assert.equal(h.panels.length, 1);
    assert.equal(panel.title, "Pi · Settings");
    assert.deepEqual(h.commands, []);
  } finally { h.provider.dispose(); }
});

test("settings language synchronizes both views and survives panel/chat recreation only in host memory", async () => {
  const h = harness(); const v = h.createView();
  try {
    v.action("openSettings"); const panel = h.panels[0];
    panel.receive.fire({ version: 3, type: "getWorkspaceState" });
    const state = parseHostMessage(panel.sent[0]); assert.ok(state);
    panel.receive.fire({ version: 3, type: "setUiLanguage", viewId: state.viewId, generation: state.generation, locale: "zh-CN" });
    await tick();
    assert.equal(panel.title, "Pi · 设置");
    assert.ok(v.sent.map(parseHostMessage).some(message => message?.type === "uiLanguageState" && message.locale === "zh-CN"));
    panel.dispose(); v.dispose.fire();
    const next = h.createView(); next.state();
    assert.ok(next.sent.map(parseHostMessage).some(message => message?.type === "uiLanguageState" && message.locale === "zh-CN"));
    next.action("openSettings"); h.panels[1].receive.fire({ version: 3, type: "getWorkspaceState" });
    assert.equal(h.panels[1].title, "Pi · 设置");
    h.provider.dispose(); assert.equal(h.panels[1].disposed, true);
  } finally { h.provider.dispose(); }
});
