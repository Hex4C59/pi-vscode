import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { attachmentState, uiHarness } from "./react-harness.js";

test("mounted React model controls keep applied and pending settings distinct during a stream", async () => {
  const h = await uiHarness();
  try {
    await h.render({
      chatBusy: true,
      pendingThinkingLevel: "high",
      pendingModel: { provider: "B", modelId: "two", label: "Two" },
    });
    assert.equal(h.get<HTMLButtonElement>("#model-effort-trigger").disabled, false);
    assert.equal(h.get<HTMLInputElement>("#thinking-slider").disabled, false);
    assert.equal(h.root.querySelector("#send-chat"), null);
    assert.equal(h.get("#model-effort-trigger").textContent, "A / one · medium");
    assert.match(h.get("#pending-settings").textContent ?? "", /Next turn \(pending\): B \/ Two · thinking: high/);
    assert.match(h.get("#thinking-level-label").textContent ?? "", /Applied: medium.*pending.*high/);

    await h.click("#model-effort-trigger");
    await h.click("#model-current");
    const modelList = h.get("#model-list");
    assert.equal(modelList.hidden, false);
    const modelItem = modelList.querySelectorAll<HTMLButtonElement>("button")[1];
    assert.ok(modelItem);
    await act(async () => modelItem.click());
    assert.equal((h.sent.at(-1) as { type: string }).type, "setChatModel");
    assert.equal(modelList.hidden, true);

    await h.click("#model-effort-trigger");
    const slider = h.get<HTMLInputElement>("#thinking-slider");
    const beforeDrag = h.sent.length;
    slider.value = "0";
    await act(async () => slider.dispatchEvent(new h.dom.window.Event("input", { bubbles: true })));
    assert.equal(h.sent.length, beforeDrag, "drag inputs must not submit settings until commit");
    await act(async () => slider.dispatchEvent(new h.dom.window.Event("change", { bubbles: true })));
    assert.equal((h.sent.at(-1) as { level: string }).level, "off");

    await h.render({ chatBusy: false, modelBusy: true, pendingThinkingLevel: "off", pendingModel: { provider: "B", modelId: "two", label: "Two" } });
    assert.equal(h.get<HTMLButtonElement>("#model-effort-trigger").disabled, true);
    assert.equal(h.get<HTMLInputElement>("#thinking-slider").disabled, true);
    assert.ok([...h.root.querySelectorAll<HTMLButtonElement>("#model-list button")].every(button => button.disabled));
    assert.match(h.get("#pending-settings").textContent ?? "", /Applying next turn/);

    await h.input("keep draft");
    await h.render({
      chatBusy: false,
      modelBusy: false,
      pendingModel: null,
      pendingThinkingLevel: null,
      modelError: "Requested thinking level is not supported.",
    });
    assert.equal(h.get("#pending-settings").hidden, true);
    assert.equal(h.get("#model-status-error").hidden, false);
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "keep draft");

    await h.click("#model-effort-trigger");
    await act(async () => h.dom.window.dispatchEvent(new h.dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    assert.equal(h.get("#model-popover").hidden, true);

    await h.click("#model-effort-trigger");
    await h.render({ generation: 2 });
    assert.equal(h.get("#model-popover").hidden, true);
  } finally {
    await h.close();
  }
});

test("mounted React model controls expose a disabled single-level slider and preserve draft state", async () => {
  const h = await uiHarness();
  try {
    await h.render({ thinkingLevel: "off", thinkingLevels: ["off"], chatBusy: false });
    assert.equal(h.get<HTMLInputElement>("#thinking-slider").disabled, true);
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "");
    await h.input("draft");
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "draft");
    assert.equal(h.get<HTMLButtonElement>("#send-chat").disabled, true);
    await h.receive(attachmentState({ draft: { revision: 1, text: "draft", acceptedEditSequence: 1, attachments: [] } }));
    assert.equal(h.get<HTMLButtonElement>("#send-chat").disabled, false);
  } finally {
    await h.close();
  }
});
