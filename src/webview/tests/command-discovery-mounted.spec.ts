import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { uiHarness, attachmentState } from "./react-harness.js";
import type { CommandCatalogueStateMessage } from "../../extension/contracts/index.js";

const catalogue: CommandCatalogueStateMessage = {
  version: 3, type: "commandCatalogueState", generation: 1, viewId: "view", revision: 1,
  status: "ready", error: null, rows: [
    { name: "review", source: "extension", description: "Review current changes" },
    { name: "fix-tests", source: "prompt", location: "project" },
    { name: "skill:review", source: "skill", location: "user" },
  ],
};
async function report(name: string, checks: string[]): Promise<void> {
  const output = path.resolve("dist/wi078-command-catalogue"); await mkdir(output, { recursive: true });
  await writeFile(path.join(output, name + ".json"), JSON.stringify({ schemaVersion: 1, status: "passed",
    evidence: "mounted-production-command-input", checks,
    limits: ["synthetic host and jsdom", "not browser layout, real pi, F5 or installed VSIX"] }, null, 2) + "\n");
}
async function key(h: Awaited<ReturnType<typeof uiHarness>>, name: string, composing = false): Promise<void> {
  await act(async () => { h.get<HTMLTextAreaElement>('textarea[aria-label="Message"]').dispatchEvent(
    new h.dom.window.KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true, isComposing: composing })); });
}
async function acknowledge(h: Awaited<ReturnType<typeof uiHarness>>, text: string): Promise<void> {
  const edit = h.sent.at(-1); assert.equal(edit?.type, "updateDraft");
  if (edit?.type !== "updateDraft") throw new Error("Expected acknowledged edit");
  await h.receive(attachmentState({ draft: { revision: edit.draftRevision + 1, text,
    acceptedEditSequence: edit.editSequence, attachments: [] } }));
}

// Failure modes: absent menu, invented TUI names, completion sends, IME Enter selects,
// synchronizing draft still completes, model/command popovers overlap, Escape loses draft.
test("production slash menu lists snapshot sources, navigates and completes without sending", async () => {
  const h = await uiHarness();
  try {
    await h.receive(catalogue);
    await act(async () => h.get<HTMLTextAreaElement>("textarea").focus());
    await h.input("/"); await acknowledge(h, "/");
    assert.equal(h.root.querySelectorAll('[role="option"]').length, 3);
    assert.match(h.get('[role="listbox"]').textContent ?? "", /Extension/);
    assert.match(h.get('[role="listbox"]').textContent ?? "", /Prompt template/);
    assert.match(h.get('[role="listbox"]').textContent ?? "", /Skill/);
    const before = h.sent.length;
    await key(h, "Enter", true);
    assert.equal(h.sent.length, before, "IME must not complete or send");
    await key(h, "ArrowDown"); await key(h, "Enter");
    const completion = h.sent.at(-1);
    assert.equal(completion?.type, "completeCommand");
    if (completion?.type === "completeCommand") assert.equal(completion.name, "fix-tests");
    assert.equal(h.sent.slice(before).some(m => m.type === "sendChat" || m.type === "queueChat"), false);
    assert.equal(h.root.querySelector('[role="listbox"]'), null);
    await report("mounted-discovery", ["three sources", "keyboard completion", "IME no side effect", "no send"]);
  } finally { await h.close(); }
});

test("slash menu exposes empty/error/no-match states and remains exclusive with the model picker", async () => {
  const h = await uiHarness();
  try {
    await h.receive({ ...catalogue, status: "empty", rows: [] });
    await act(async () => h.get<HTMLTextAreaElement>("textarea").focus());
    await h.input("/");
    assert.match(h.root.textContent ?? "", /No commands loaded/);
    await h.receive({ ...catalogue, revision: 2, status: "unavailable", error: "unavailable", rows: [] });
    assert.match(h.root.textContent ?? "", /Commands unavailable/);
    await h.receive({ ...catalogue, revision: 3 });
    await h.input("/unknown");
    assert.match(h.root.textContent ?? "", /No matching commands/);
    const before = h.sent.length; await key(h, "Enter");
    assert.equal(h.sent.slice(before).some(m => m.type === "sendChat" || m.type === "completeCommand"), false);
    await h.input("/"); await acknowledge(h, "/");
    await key(h, "Escape"); assert.equal(h.root.querySelector('[role="listbox"]'), null);
    assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "/");
    await h.input("/r"); await acknowledge(h, "/r");
    await h.click("#model-effort-trigger");
    assert.equal(h.root.querySelector('[role="listbox"][aria-label="Commands"]'), null);
    assert.equal(h.get<HTMLDivElement>("#model-popover").hidden, false);
    await report("mounted-empty-exclusive", ["empty", "unavailable", "no match", "Escape", "model exclusive"]);
  } finally { await h.close(); }
});
