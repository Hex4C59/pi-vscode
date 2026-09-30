import assert from "node:assert/strict";
import test from "node:test";
import type { SessionStateMessage, WebviewMessage } from "../../extension/contracts/webviewProtocol.js";
import { WebviewClient } from "../client/webview-client.js";
import { parseHostMessage } from "../client/parse-host-message.js";
import { attachmentState, readyState, uiHarness } from "./react-harness.js";

const sessionEntry = (index: number) => ({
  id: `saved-${index}`,
  title: `Saved task ${index}`,
  excerpt: `Earlier question ${index}`,
  modified: `2026-09-22T00:00:${String(index).padStart(2, "0")}.000Z`,
});

function sessionState(patch: Partial<SessionStateMessage> = {}): SessionStateMessage {
  return {
    version: 3,
    type: "sessionState",
    viewId: "view",
    generation: 1,
    phase: "idle",
    current: null,
    loaded: false,
    entries: [],
    page: 0,
    total: 0,
    error: null,
    ...patch,
  };
}

function clientHarness() {
  const sent: WebviewMessage[] = [];
  let listener: ((value: unknown) => void) | undefined;
  const client = new WebviewClient({
    postMessage: message => sent.push(message),
    subscribe: next => {
      listener = next;
      return () => { listener = undefined; };
    },
  });
  client.start();
  return { client, sent, receive: (message: unknown) => listener?.(message) };
}

test("sessionState accepts only the bounded exact DTO and rejects malformed or accessor-backed envelopes", () => {
  const valid = sessionState({
    current: { id: "current-1", name: "Current task" },
    loaded: true,
    entries: [sessionEntry(1)],
    total: 1,
  });
  assert.deepEqual(parseHostMessage(valid), valid);
  assert.equal(parseHostMessage({ ...valid, unexpected: true }), undefined);
  assert.equal(parseHostMessage({ ...valid, entries: [{ ...valid.entries[0], path: "session.jsonl" }] }), undefined);
  assert.equal(parseHostMessage({ ...valid, entries: Array.from({ length: 17 }, (_, index) => sessionEntry(index)) }), undefined);
  assert.equal(parseHostMessage({ ...valid, entries: [{ ...valid.entries[0], title: "x".repeat(161) }] }), undefined);
  assert.equal(parseHostMessage({ ...valid, entries: [{ ...valid.entries[0], excerpt: "x".repeat(257) }] }), undefined);
  assert.equal(parseHostMessage({ ...valid, entries: [{ ...valid.entries[0], modified: "x".repeat(41) }] }), undefined);
  for (const page of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, "0"]) {
    assert.equal(parseHostMessage({ ...valid, page }), undefined);
  }
  for (const total of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, "1"]) {
    assert.equal(parseHostMessage({ ...valid, total }), undefined);
  }
  assert.equal(parseHostMessage({ ...valid, current: { id: "../session.jsonl", name: null } }), undefined);

  let getterCalls = 0;
  const entryWithGetter = Object.defineProperty({ ...valid.entries[0] }, "title", {
    enumerable: true,
    get() { getterCalls++; throw new Error("session title accessor must not run"); },
  });
  const accessorMessage = { ...valid, entries: [entryWithGetter] };
  assert.doesNotThrow(() => parseHostMessage(accessorMessage));
  assert.equal(parseHostMessage(accessorMessage), undefined);
  assert.equal(getterCalls, 0);
});

test("session intents use only the current catalogue IDs and reset stale IDs with a new generation", () => {
  const ui = clientHarness();
  try {
    ui.receive(readyState);
    ui.receive(sessionState({ loaded: true, entries: [sessionEntry(1)], total: 1 }));
    const bootstrapCount = ui.sent.length;

    ui.client.newConversation();
    ui.client.getSavedSessions(0);
    ui.client.resumeConversation("saved-1");
    assert.deepEqual(ui.sent.slice(bootstrapCount).map(message => message.type), ["newConversation", "getSavedSessions", "resumeConversation"]);
    assert.equal("path" in (ui.sent.at(-1) ?? {}), false);
    assert.equal("confirmed" in (ui.sent.at(-1) ?? {}), false);

    const beforeStale = ui.sent.length;
    ui.client.resumeConversation("stale-id");
    assert.equal(ui.sent.length, beforeStale);

    ui.receive(sessionState({ generation: 2, entries: [sessionEntry(2)], loaded: true, total: 1 }));
    ui.receive(sessionState({ generation: 1, entries: [sessionEntry(1)], loaded: true, total: 1 }));
    assert.equal(ui.client.getSnapshot().sessions?.entries[0]?.id, "saved-2");
    ui.client.resumeConversation("saved-1");
    assert.equal(ui.sent.length, beforeStale);
    ui.client.resumeConversation("saved-2");
    assert.equal(ui.sent.at(-1)?.type, "resumeConversation");
    assert.equal((ui.sent.at(-1) as { generation: number }).generation, 2);
  } finally {
    ui.client.dispose();
  }
});

test("mounted session history pages, recovers from errors, keeps draft text, and gates only switching mutations", async () => {
  const h = await uiHarness(false);
  const browse = 'button[aria-label="Browse saved conversations"]';
  const draft = 'textarea[aria-label="Message"]';
  const send = 'button[aria-label="Send message"]';
  const stop = 'button[aria-label="Stop current task"]';
  try {
    await h.receive(attachmentState({ draft: { revision: 3, text: "unsent draft", acceptedEditSequence: 2, attachments: [] } }));
    await h.render();
    await h.receive(sessionState({ current: { id: "current-1", name: null } }));
    assert.equal(h.get(".candidate__history").hidden, true, "the unopened history must not invent sample rows");
    assert.equal(h.root.querySelectorAll(".candidate__session").length, 0);

    await h.click(browse);
    assert.equal(h.sent.at(-1)?.type, "getSavedSessions");
    assert.equal((h.sent.at(-1) as { page: number }).page, 0);
    assert.equal(h.get<HTMLTextAreaElement>(draft).value, "unsent draft");
    assert.equal(h.get(".candidate__current").textContent, "");

    await h.receive(sessionState({ current: { id: "current-1", name: "Current task" }, loaded: true, entries: Array.from({ length: 16 }, (_, index) => sessionEntry(index)), total: 33 }));
    assert.match(h.get(".candidate__current").textContent ?? "", /Current task/);
    assert.equal(h.get<HTMLTextAreaElement>(draft).value, "unsent draft");
    assert.equal(h.get<HTMLButtonElement>('button[aria-label="Previous conversations"]').disabled, true);
    assert.equal(h.get<HTMLButtonElement>('button[aria-label="Next conversations"]').disabled, false);
    await h.click('button[aria-label="Next conversations"]');
    assert.equal(h.sent.at(-1)?.type, "getSavedSessions");
    assert.equal((h.sent.at(-1) as { page: number }).page, 1);

    await h.receive(sessionState({ loaded: true, page: 1, entries: [sessionEntry(16)], total: 33 }));
    await h.click('button[aria-label="Restore Saved task 16"]');
    assert.equal(h.sent.at(-1)?.type, "resumeConversation");
    assert.equal((h.sent.at(-1) as { id: string }).id, "saved-16");

    await h.receive(sessionState({ phase: "error", loaded: true, entries: [], total: 0, error: "unavailable" }));
    assert.match(h.root.textContent ?? "", /unavailable/i);
    assert.equal(h.get<HTMLButtonElement>('button[aria-label="Refresh saved conversations"]').disabled, false);
    await h.click('button[aria-label="Refresh saved conversations"]');
    assert.equal(h.sent.at(-1)?.type, "getSavedSessions");

    await h.receive(sessionState({ phase: "idle", loaded: true, entries: [], total: 0, error: null }));
    assert.match(h.get(".candidate__catalogue").textContent ?? "", /No saved conversations/);

    await h.receive(sessionState({ phase: "confirming", loaded: true, entries: [sessionEntry(1)], total: 1 }));
    assert.equal(h.get<HTMLButtonElement>('button[aria-label="New conversation"]').disabled, true);
    assert.equal(h.get<HTMLButtonElement>('button[aria-label="Refresh saved conversations"]').disabled, true);
    assert.equal(h.get<HTMLButtonElement>('button[aria-label="Restore Saved task 1"]').disabled, true);
    assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
    assert.equal(h.get<HTMLButtonElement>("#model-effort-trigger").disabled, true);
    // Session confirming disables Add context; the menu stays closed instead of opening disabled items.
    assert.equal(h.get<HTMLButtonElement>('button[aria-label="Add context"]').disabled, true);
    assert.equal(h.root.querySelector('button[aria-label="Add file"]') === null, true);

    await h.receive({ ...readyState, chatBusy: true, execution: "replying" });
    await h.receive(sessionState({ phase: "idle", loaded: true, entries: [sessionEntry(1)], total: 1 }));
    assert.equal(h.get<HTMLButtonElement>('button[aria-label="New conversation"]').disabled, false, "new conversation remains available for the host Stop flow");
    assert.equal(h.get<HTMLButtonElement>(stop).disabled, false);

    await h.receive({ ...readyState, chatBusy: false, execution: "idle" });
    await h.receive(sessionState({ phase: "listing", loaded: true, entries: [], total: 0 }));
    assert.equal(h.get<HTMLButtonElement>(send).disabled, false, "listing does not block ordinary chat");
  } finally {
    await h.close();
  }
});
