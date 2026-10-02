import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { flushSync } from "react-dom";
import { mkdir, writeFile } from "node:fs/promises";
import { uiHarness, readyState } from "../react-harness.js";

test("body replacement hides previous copy feedback in the synchronous production commit", async () => {
  const h = await uiHarness();
  const projection = { ...readyState, messages: [{ role: "assistant", id: "reply", text: "Original", bodyCopyEligible: true }] };
  const observed: string[] = [];
  try {
    Object.defineProperty(h.dom.window.navigator, "clipboard", { configurable: true,
      value: { writeText: async () => {} } });
    await h.receive(projection);
    await h.click('button[aria-label="Copy reply"]');
    assert.equal(h.get('.candidate__reply-copy [role="status"]').textContent, "Reply copied.");
    await act(async () => {
      flushSync(() => { for (const listener of h.listeners) listener({ ...projection,
        messages: [{ ...projection.messages[0], text: "Replacement" }] }); });
      observed.push(h.get('.candidate__reply-copy [role="status"]').textContent ?? "");
      assert.equal(observed[0], "");
    });
    await mkdir("dist/wi081-copy", { recursive: true });
    await writeFile("dist/wi081-copy/synchronous-feedback.json", JSON.stringify({ status: "passed", observed }, null, 2));
  } catch (error) {
    await mkdir("dist/wi081-copy", { recursive: true });
    await writeFile("dist/wi081-copy/synchronous-feedback-red.json", JSON.stringify({ status: "failed", observed,
      error: error instanceof Error ? error.message : "unknown" }, null, 2));
    throw error;
  } finally { await h.close(); }
});

test("a new conversation identity isolates pending copy even with the same message body and id", async () => {
  const h = await uiHarness();
  let finish = () => {};
  const workspace = { ...readyState, messages: [{ role: "assistant", id: "reply", text: "Same body", bodyCopyEligible: true }] };
  const sessions = { version: 3, type: "sessionState", viewId: "view", generation: 1, phase: "idle", current: { id: "session-a", name: "A" },
    loaded: true, entries: [], page: 0, total: 0, error: null };
  try {
    Object.defineProperty(h.dom.window.navigator, "clipboard", { configurable: true,
      value: { writeText: () => new Promise<void>(resolve => { finish = resolve; }) } });
    await h.receive(workspace); await h.receive(sessions);
    await h.click('button[aria-label="Copy reply"]');
    await act(async () => {
      for (const listener of h.listeners) {
        listener({ ...sessions, current: { id: "session-b", name: "B" } });
        listener(workspace);
      }
    });
    await act(async () => { finish(); });
    assert.equal(h.get('.candidate__reply-copy [role="status"]').textContent, "");
    await mkdir("dist/wi081-copy", { recursive: true });
    await writeFile("dist/wi081-copy/session-identity.json", JSON.stringify({ status: "passed", sameBody: true, sameMessageId: true, lateSuccess: false }, null, 2));
  } catch (error) {
    await mkdir("dist/wi081-copy", { recursive: true });
    await writeFile("dist/wi081-copy/session-identity-red.json", JSON.stringify({ status: "failed", error: error instanceof Error ? error.message : "unknown" }, null, 2));
    throw error;
  } finally { await h.close(); }
});
