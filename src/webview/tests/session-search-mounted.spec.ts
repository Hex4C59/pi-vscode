import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import type { SessionStateMessage } from "../../extension/contracts/index.js";
import { uiHarness } from "./react-harness.js";
const state: SessionStateMessage = { version: 3, type: "sessionState", viewId: "view", generation: 1, phase: "idle", current: null,
  loaded: true, entries: [], page: 0, total: 0, error: null, search: { query: "", namedOnly: false, sort: "recent" } };

// Before code: no requests while typing, explicit applied metadata search,
// clear and pagination must not restore, send chat or retain hidden full bodies.
test("mounted production catalogue explicitly applies metadata search and clear without restoring", async () => {
  const h = await uiHarness(true, true);
  try {
    await h.receive(state); await h.click('[aria-label="Browse saved conversations"]');
    const input = h.get<HTMLInputElement>('[aria-label="Search names and first-message previews"]');
    const before = h.sent.length;
    await act(async () => {
      Object.getOwnPropertyDescriptor(h.dom.window.HTMLInputElement.prototype, "value")!.set!.call(input, "needle");
      input.dispatchEvent(new h.dom.window.Event("input", { bubbles: true }));
    });
    assert.equal(h.sent.length, before);
    await h.click('[aria-label="Apply session search"]');
    assert.deepEqual(h.sent.at(-1), { version: 3, type: "searchSavedSessions", generation: 1, viewId: "view", query: "needle", namedOnly: false, sort: "recent" });
    await h.receive({ ...state, search: { query: "needle", namedOnly: false, sort: "recent" } });
    assert.match(h.root.textContent ?? "", /No saved conversations match/);
    await h.click('[aria-label="Clear session search"]');
    assert.equal(h.sent.at(-1)?.type, "searchSavedSessions");
    assert.equal(h.sent.some(message => message.type === "resumeConversation" || message.type === "sendChat"), false);
  } finally { await h.close(); }
});
