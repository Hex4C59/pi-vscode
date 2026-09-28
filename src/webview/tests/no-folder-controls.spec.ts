import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import type { WorkspaceStateMessage } from "../../extension/contracts/index.js";
import { productionHarness } from "./react-harness.js";

const noFolder: Partial<WorkspaceStateMessage> = { status: "no-folder", folder: null, choice: null, runtime: "not-started", chatModel: null, availableModels: [], thinkingLevel: null, thinkingLevels: [] };

test("no-folder context menu opens and offers folder recovery without attaching or sending", async () => {
  const h = await productionHarness(false);
  try {
    await h.render(noFolder);
    await h.input("Keep this draft", "textarea");
    await h.click('button[aria-label="Add context"]');
    await h.click('button[aria-label="Add file"]');
    await h.click("#open-folder");
    assert.equal(h.sent.at(-1)?.type, "openFolder");
    assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep this draft");
    assert.ok(!h.sent.some(m => ["addFileAttachment", "addSelectionAttachment", "sendChat"].includes(m.type)));
  } finally { await h.close(); }
});

test("no-folder model picker selects the global default without a running session", async () => {
  const h = await productionHarness(false);
  try {
    await h.render(noFolder);
    await h.receive({ version: 3, type: "providerConfigState", viewId: "view", generation: 1,
      busy: false, error: null, defaultProvider: "A", defaultModelId: "one", providers: [],
      catalog: [{ provider: "A", modelId: "one", label: "One" }, { provider: "B", modelId: "two", label: "Two" }] });
    await h.click("#model-effort-trigger");
    await h.click('button[role="menuitemradio"][aria-checked="false"]');
    assert.deepEqual(h.sent.at(-1), { version: 3, viewId: "view", generation: 1, type: "setDefaultModel", provider: "B", modelId: "two" });
    assert.ok(!h.sent.some(m => m.type === "setChatModel"));
  } finally { await h.close(); }
});

test("no-folder model loading, errors and empty catalogue keep settings reachable", async () => {
  const h = await productionHarness(false);
  try {
    await h.render(noFolder);
    await h.click("#model-effort-trigger");
    assert.match(h.get("#model-popover").textContent ?? "", /Loading model settings/);
    await h.receive({ version: 3, type: "providerConfigState", viewId: "view", generation: 1,
      busy: false, error: "Could not load provider configuration.", defaultProvider: null, defaultModelId: null, providers: [], catalog: [] });
    assert.match(h.get("#model-popover").textContent ?? "", /Could not load provider configuration/);
    await h.click("#model-popover > button");
    assert.ok(h.get<HTMLDialogElement>(".candidate-settings").open);
    await h.click('button[aria-label="Close settings"]');
    await h.click("#model-effort-trigger");
    await act(async () => { h.get("#model-effort-trigger").dispatchEvent(new h.dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    assert.equal(h.root.querySelector("#model-popover"), null);
    assert.equal(h.dom.window.document.activeElement, h.get("#model-effort-trigger"));
  } finally { await h.close(); }
});

test("no-folder context cancellation retains draft and other blocked workspaces stay guarded", async () => {
  const h = await productionHarness(false);
  try {
    await h.render(noFolder);
    await h.input("Retain on cancel", "textarea");
    await h.click('button[aria-label="Add context"]');
    await h.click('button[aria-label="Add selection"]');
    await h.click('button[aria-label="Keep editing"]');
    assert.equal(h.root.querySelector(".candidate-folder-prompt"), null);
    assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Retain on cancel");
    for (const status of ["untrusted", "multi-root", "remote"] as const) {
      await h.render({ ...noFolder, status });
      assert.ok(h.get<HTMLButtonElement>('button[aria-label="Add context"]').disabled);
      assert.ok(h.get<HTMLButtonElement>("#model-effort-trigger").disabled);
    }
  } finally { await h.close(); }
});
