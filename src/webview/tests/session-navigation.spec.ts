import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import type { SessionStateMessage } from "../../extension/contracts/index.js";
import { productionHarness } from "./react-harness.js";

test("production history keeps complete titles, independent current identity and focus through refresh and return", async () => {
  const h = await productionHarness();
  try {
    const title = "优化会话导航 — a very long conversation title ".repeat(3);
    const sessions: SessionStateMessage = {
      version: 3, type: "sessionState", viewId: "view", generation: 1,
      phase: "idle", loaded: true, error: null, page: 0, total: 2,
      current: { id: "current", name: title },
      entries: [
        { id: "other", title, excerpt: "Literal preview", modified: "2026-09-29T01:00:00Z" },
        { id: "current", title: "Current session", excerpt: "", modified: "2026-09-28T01:00:00Z" },
      ],
    };
    await h.receive(sessions);
    const browse = 'button[aria-label="Browse saved conversations"]';
    await h.click(browse);
    assert.equal(h.get(browse).getAttribute("aria-expanded"), "true");
    assert.equal(h.dom.window.document.activeElement, h.get('button[aria-label="Back to conversation"]'));
    const rows = h.root.querySelectorAll<HTMLButtonElement>(".candidate__session");
    assert.equal(rows[0].getAttribute("aria-label"), `Restore ${title}`);
    assert.ok(rows[0].title.startsWith(title));
    assert.match(rows[0].title, /Modified: 2026-09-29/);
    assert.equal(rows[0].getAttribute("aria-current"), null);
    assert.equal(rows[1].getAttribute("aria-current"), "true");
    assert.equal(h.get(".candidate__current").title, title);
    await h.receive({ ...sessions, phase: "listing" });
    assert.equal(rows[0].disabled, true);
    assert.equal(h.get<HTMLButtonElement>('button[aria-label="Refresh saved conversations"]').disabled, true);
    assert.equal(h.get<HTMLButtonElement>('button[aria-label="Back to conversation"]').disabled, false);
    await act(async () => h.get('button[aria-label="Back to conversation"]').dispatchEvent(new h.dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    assert.equal(h.get(".candidate__history").hidden, true);
    assert.equal(h.dom.window.document.activeElement, h.get(browse));
    await h.receive({ ...sessions, current: { id: "other", name: title } });
    await h.click(browse);
    assert.equal(h.root.querySelectorAll('[aria-current="true"]').length, 1);
    assert.equal(rows[0].getAttribute("aria-current"), "true");
    assert.equal(rows[1].getAttribute("aria-current"), null);
  } finally { await h.close(); }
});
