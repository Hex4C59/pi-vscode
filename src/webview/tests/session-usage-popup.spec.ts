import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
import { uiHarness } from "./react-harness.js";

test("usage and model popovers exclude each other and Escape restores trigger without losing draft", async () => {
  const ui = await uiHarness();
  try {
    await ui.input("unsent text");
    await ui.click("#model-effort-trigger");
    assert.equal(ui.get("#model-popover").hidden, false);
    await ui.click('button[aria-label="Usage"]');
    assert.equal(ui.get("#model-popover").hidden, true);
    const panel = ui.get('[role="dialog"][aria-label="Usage"]');
    await act(async () => { panel.dispatchEvent(new ui.dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    assert.equal(ui.root.querySelector('[role="dialog"][aria-label="Usage"]'), null);
    assert.equal(ui.dom.window.document.activeElement, ui.get('button[aria-label="Usage"]'));
    assert.equal(ui.get<HTMLTextAreaElement>("textarea").value, "unsent text");
    await ui.click('button[aria-label="Usage"]'); await ui.click("#model-effort-trigger");
    assert.equal(ui.root.querySelector('[role="dialog"][aria-label="Usage"]'), null);
  } finally { await ui.close(); }
});
