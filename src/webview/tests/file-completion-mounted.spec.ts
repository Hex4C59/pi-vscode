import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { uiHarness, attachmentState } from "./react-harness.js";

async function acknowledge(h: Awaited<ReturnType<typeof uiHarness>>, text: string): Promise<void> {
  const edit = h.sent.at(-1);
  if (edit?.type !== "updateDraft") throw new Error("Expected draft edit");
  await h.receive(attachmentState({ draft: { revision: edit.draftRevision + 1, text,
    acceptedEditSequence: edit.editSequence, attachments: [] } }));
}
async function tab(h: Awaited<ReturnType<typeof uiHarness>>, composing = false): Promise<void> {
  await act(async () => {
    const input = h.get<HTMLTextAreaElement>("textarea"); input.selectionStart = input.value.length; input.selectionEnd = input.value.length;
    input.dispatchEvent(new h.dom.window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true, isComposing: composing }));
  });
}

// Before code: completion must be explicit, acknowledged, caret-bound, non-sending,
// and must not interpret email/IME input as a filesystem intent.
test("production @ Tab requests named host discovery without sending or passing a path", async () => {
  const h = await uiHarness();
  try {
    await h.input("inspect @src/main"); await acknowledge(h, "inspect @src/main");
    const before = h.sent.length; await tab(h);
    const message = h.sent.at(-1);
    assert.equal(message?.type, "completeFileReference");
    assert.ok(message && "caret" in message);
    assert.equal(Reflect.get(message, "caret"), "inspect @src/main".length);
    assert.equal(Reflect.has(message, "path"), false);
    assert.equal(Reflect.has(message, "query"), false);
    assert.equal(h.sent.slice(before).some(value => value.type === "sendChat" || value.type === "queueChat"), false);
    assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "inspect @src/main");
  } finally { await h.close(); }
});

test("@ completion ignores unsynchronized edits, email and IME while preserving input", async () => {
  const h = await uiHarness();
  try {
    await h.input("@src"); let before = h.sent.length; await tab(h);
    assert.equal(h.sent.length, before);
    await acknowledge(h, "@src"); before = h.sent.length; await tab(h, true);
    assert.equal(h.sent.length, before);
    await h.input("name@example.test"); await acknowledge(h, "name@example.test"); before = h.sent.length; await tab(h);
    assert.equal(h.sent.length, before);
    assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "name@example.test");
  } finally { await h.close(); }
});
