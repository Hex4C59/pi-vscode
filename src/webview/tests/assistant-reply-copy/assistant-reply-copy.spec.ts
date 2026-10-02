import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { mkdir, writeFile } from "node:fs/promises";
import { uiHarness, readyState } from "../react-harness.js";

const body = "# Exact reply\n\n  Original **Markdown**.\n\n```ts\nconst value = 42;\n```\n";
const projection = { ...readyState, execution: "completed", messages: [
  { role: "user", text: "Question" },
  { role: "assistant", id: "reply-one", text: body, bodyCopyEligible: true },
], activities: [{ id: "thinking-one", messageId: "reply-one", kind: "thinking", text: "Thinking excluded", status: "complete", truncated: false }] };

async function record(status: string, observed: unknown, name = "exact-body"): Promise<void> {
  await mkdir("dist/wi081-copy", { recursive: true });
  await writeFile(`dist/wi081-copy/${name}.json`, JSON.stringify({ schemaVersion: 1, status,
    seam: "validated projection → production mountChat → browser clipboard", observed,
    limits: ["synthetic host/jsdom", "not real browser, F5 or installed VSIX"] }, null, 2) + "\n");
}

// Failure modes: DOM extraction includes thinking/labels; Markdown/fences/whitespace lost;
// absent action; clipboard writes report false success; code-block copy regresses.
test("completed production reply copies exact projected Markdown and preserves code copy", async () => {
  const h = await uiHarness();
  const writes: string[] = [];
  try {
    Object.defineProperty(h.dom.window.navigator, "clipboard", { configurable: true,
      value: { writeText: async (text: string) => { writes.push(text); } } });
    await h.receive(projection);
    assert.equal(h.get("h1").textContent, "Exact reply");
    await h.click('button[aria-label="Copy reply"]');
    assert.deepEqual(writes, [body]);
    assert.match(h.root.textContent ?? "", /Reply copied\./);
    await h.click('button[aria-label="Copy code"]');
    assert.deepEqual(writes, [body, "const value = 42;"]);
    await record("passed", { writes, replyFeedback: "Reply copied.", codeCopy: true });
  } catch (error) {
    await record("failed", { writes, error: error instanceof Error ? error.message : "unknown" });
    throw error;
  } finally { await h.close(); }
});

test("reply copy reports unavailable and rejected browser clipboard without success", async () => {
  const h = await uiHarness();
  try {
    await h.receive(projection);
    Object.defineProperty(h.dom.window.navigator, "clipboard", { configurable: true, value: undefined });
    await h.click('button[aria-label="Copy reply"]');
    assert.match(h.get('.candidate__reply-copy [role="status"]').textContent ?? "", /Clipboard unavailable/);
    Object.defineProperty(h.dom.window.navigator, "clipboard", { configurable: true,
      value: { writeText: async () => { throw new Error("permission denied"); } } });
    await h.click('button[aria-label="Copy reply"]');
    assert.match(h.get('.candidate__reply-copy [role="status"]').textContent ?? "", /Copy failed/);
    assert.doesNotMatch(h.get('.candidate__reply-copy [role="status"]').textContent ?? "", /Reply copied/);
    await record("passed", { unavailable: true, denied: true, falseSuccess: false }, "failure-feedback");
  } finally { await h.close(); }
});

test("reply copy bounds pending observation and ignores completion after timeout", async t => {
  const h = await uiHarness();
  let writes = 0;
  let finish = () => {};
  try {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    Object.defineProperty(h.dom.window.navigator, "clipboard", { configurable: true,
      value: { writeText: () => { writes++; return new Promise<void>(resolve => { finish = resolve; }); } } });
    await h.receive(projection);
    await h.click('button[aria-label="Copy reply"]');
    assert.equal(h.get('button[aria-label="Copy reply"]').getAttribute("aria-disabled"), "true");
    await h.click('button[aria-label="Copy reply"]');
    assert.equal(writes, 1);
    await act(async () => { t.mock.timers.tick(5001); });
    assert.match(h.get('.candidate__reply-copy [role="status"]').textContent ?? "", /Copy timed out.*unknown/);
    assert.equal(h.get('button[aria-label="Copy reply"]').getAttribute("aria-disabled"), "false");
    await act(async () => { finish(); });
    assert.doesNotMatch(h.get('.candidate__reply-copy [role="status"]').textContent ?? "", /Reply copied/);
    await record("passed", { timeoutMs: 5000, outcome: "unknown", lateSuccess: false }, "timeout");
  } catch (error) {
    await record("failed", { error: error instanceof Error ? error.message : "unknown" }, "timeout-red");
    throw error;
  } finally { await h.close(); t.mock.timers.reset(); }
});

test("changed body and view identity isolate pending copy and unmount clears observation", async t => {
  const h = await uiHarness();
  let finish = () => {};
  try {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    Object.defineProperty(h.dom.window.navigator, "clipboard", { configurable: true,
      value: { writeText: () => new Promise<void>(resolve => { finish = resolve; }) } });
    await h.receive(projection);
    await h.click('button[aria-label="Copy reply"]');
    const changed = { ...projection, messages: [{ role: "assistant", id: "reply-one", text: "Replacement body", bodyCopyEligible: true }] };
    await h.receive(changed);
    assert.equal(h.get('button[aria-label="Copy reply"]').getAttribute("aria-disabled"), "false");
    await act(async () => { finish(); });
    assert.equal(h.get('.candidate__reply-copy [role="status"]').textContent, "");
    await h.click('button[aria-label="Copy reply"]');
    await h.receive({ ...changed, generation: 2 });
    await act(async () => { finish(); });
    assert.equal(h.get('.candidate__reply-copy [role="status"]').textContent, "");
    await h.click('button[aria-label="Copy reply"]');
    await h.unmount();
    await act(async () => { finish(); t.mock.timers.tick(6000); });
    assert.equal(h.root.textContent, "");
    await record("passed", { changedBody: true, changedView: true, unmount: true, lateSuccess: false }, "replacement");
  } catch (error) {
    await record("failed", { error: error instanceof Error ? error.message : "unknown" }, "replacement-red");
    throw error;
  } finally { await h.close(); t.mock.timers.reset(); }
});
