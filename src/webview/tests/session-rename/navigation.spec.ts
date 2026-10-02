import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { uiHarness } from "../react-harness.js";

const artifact = (result: object) => {
  mkdirSync("dist/wi080", { recursive: true });
  writeFileSync("dist/wi080/navigation.json", JSON.stringify(result, null, 2));
};

test("opened conversation title offers an accessible payload-free rename without changing the draft", async () => {
  const h = await uiHarness();
  try {
    await h.receive({ version: 3, type: "sessionState", viewId: "view", generation: 1,
      phase: "idle", loaded: true, error: null, page: 0, total: 1,
      current: { id: "current", name: "Current work" },
      entries: [{ id: "catalogue-entry", title: "Current work", excerpt: "Earlier body", modified: "2026-10-02" }] });
    await h.receive({ version: 3, type: "sessionRenameState", viewId: "view", generation: 1, revision: 1, status: "ready" });
    await h.input("Keep this draft");
    const selector = 'button[aria-label="Rename current conversation"]';
    const trigger = h.root.querySelector<HTMLButtonElement>(selector);
    artifact({ phase: "observed", accessibleTrigger: trigger !== null, displayedTitle: h.get(".candidate__current").textContent });
    assert.ok(trigger, "the current opened title must expose a keyboard-operable rename action");
    assert.equal(trigger.textContent, "Current work");
    await h.click(selector);
    assert.deepEqual(h.sent.at(-1), { version: 3, type: "renameSession", viewId: "view", generation: 1 });
    assert.equal(h.get<HTMLTextAreaElement>('textarea[aria-label="Message"]').value, "Keep this draft");
    artifact({ phase: "green", accessibleTrigger: true, intent: h.sent.at(-1), draftPreserved: true });
  } finally { await h.close(); }
});
