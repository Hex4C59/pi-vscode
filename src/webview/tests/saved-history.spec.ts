import assert from "node:assert/strict";
import test from "node:test";
import type { SavedHistoryStateMessage, SessionStateMessage, WebviewMessage } from "../../extension/webviewProtocol.js";
import { WebviewClient } from "../client.js";
import { readyState, attachmentState, uiHarness } from "./react-harness.js";
import { parseHostMessage } from "../host-messages.js";
import { readySettings, tick } from "../../extension/tests/harness.js";
import { parseWebviewMessage } from "../../extension/webviewMessages.js";

const envelope = { version: 2, generation: 1, viewId: "view" } as const;
function historyState(patch: Partial<SavedHistoryStateMessage> = {}): SavedHistoryStateMessage {
  return { ...envelope, type: "savedHistoryState", available: true, phase: "idle", messages: [{ id: "retained-1", role: "user", text: "Retained question" }], page: 0, total: 1, error: null, ...patch };
}
function sessionPhase(phase: SessionStateMessage["phase"]): SessionStateMessage {
  return { ...envelope, type: "sessionState", phase, current: null, loaded: false, entries: [], page: 0, total: 0, error: null };
}

test("saved-history DTOs accept bounded literal rows and chunks, rejecting malformed fields and accessors without reading them", () => {
  const state = historyState();
  const preview = { ...envelope, type: "savedHistoryPreview", id: "retained-1", requestId: "retained-preview-1", text: "old text", offset: 0, nextOffset: 8, done: true, totalChars: 8 };
  assert.deepEqual(parseHostMessage(state), state);
  assert.deepEqual(parseHostMessage(preview), preview);
  const message = state.messages[0];
  assert.ok(parseHostMessage(historyState({ messages: [{ ...message, text: "界".repeat(1365) + "a" }] })));
  assert.ok(parseHostMessage({ ...preview, text: "a".repeat(8192), nextOffset: 8192, totalChars: 8192 }));
  // A host notice without an ID is display-only, never an actionable retained snapshot.
  assert.ok(parseHostMessage(historyState({ messages: [{ role: "assistant", text: "[Unsupported historical content]" }] })));
  for (const invalid of [
    { ...state, extra: true }, { ...state, available: 1 }, { ...state, phase: "ready" }, { ...state, error: "raw error" },
    { ...state, messages: new Array(1) }, { ...state, messages: [message, message] },
    historyState({ messages: Array.from({ length: 33 }, (_, i) => ({ ...message, id: "r-" + i })) }),
    historyState({ messages: [{ ...message, text: "界".repeat(1366) }] }),
    historyState({ messages: [{ ...message, text: "a".repeat(4097) }] }),
    { ...state, messages: [{ ...message, id: "../session" }] }, { ...state, messages: [{ ...message, path: "file.ts" }] },
    { ...state, messages: [{ ...message, id: undefined }] }, { ...state, messages: [{ ...message, role: "tool" }] },
    { ...preview, text: "a".repeat(8193) }, { ...preview, done: 1 }, { ...preview, id: "../session" },
    { ...preview, code: "stale" }, { ...preview, path: "file.ts" },
  ]) assert.equal(parseHostMessage(invalid), undefined);
  for (const value of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN, "0"]) {
    for (const field of ["page", "total", "generation"]) assert.equal(parseHostMessage({ ...state, [field]: value }), undefined);
    for (const field of ["offset", "nextOffset", "totalChars"]) assert.equal(parseHostMessage({ ...preview, [field]: value }), undefined);
  }
  for (const code of ["unavailable", "stale", "cancelled"]) {
    const error = { ...envelope, type: "savedHistoryPreview", id: "retained-1", requestId: "p", code };
    assert.deepEqual(parseHostMessage(error), error);
    assert.equal(parseHostMessage({ ...error, text: "not allowed" }), undefined);
  }
  let getters = 0;
  const accessor = (value: object, key: string) => Object.defineProperty({ ...value }, key, { enumerable: true, get() { getters++; throw Error("must not execute"); } });
  const arrayAccessor = Object.defineProperty([message], "0", { enumerable: true, get() { getters++; throw Error("must not execute"); } });
  for (const invalid of [accessor(state, "available"), { ...state, messages: [accessor(message, "text")] }, { ...state, messages: arrayAccessor }, accessor(preview, "text")]) {
    assert.doesNotThrow(() => parseHostMessage(invalid));
    assert.equal(parseHostMessage(invalid), undefined);
  }
  assert.equal(getters, 0);
});

function clientHarness() {
  const sent: WebviewMessage[] = [];
  let receive: (value: unknown) => void = () => undefined;
  const client = new WebviewClient({ postMessage: message => { sent.push(message); }, subscribe: listener => { receive = listener; return () => { receive = () => undefined; }; } });
  client.start();
  receive(readyState); receive(attachmentState());
  return { client, sent, receive: (message: unknown) => receive(message) };
}

test("saved history replaces one page, correlates one literal preview chunk and invalidates old row IDs independently of attachments", () => {
  const h = clientHarness();
  try {
    h.receive(historyState({ total: 65 }));
    const before = h.sent.length;
    h.client.requestSavedHistoryPreview("missing");
    assert.equal(h.sent.length, before);
    h.client.requestPreview("attachment-snapshot");
    const attachmentPreview = h.client.getSnapshot().preview;
    h.client.requestSavedHistoryPreview("retained-1");
    const first = h.sent.at(-1); assert.ok(first?.type === "getSavedHistoryPreview");
    assert.deepEqual(first, { ...envelope, type: "getSavedHistoryPreview", requestId: first.requestId, id: "retained-1", offset: 0 });
    const response = { ...envelope, type: "savedHistoryPreview", requestId: first.requestId, id: first.id, offset: 0, nextOffset: 5, totalChars: 10, text: "first", done: false };
    h.receive({ ...response, requestId: "old" }); h.receive({ ...response, id: "other" });
    h.receive({ ...response, offset: 1 }); h.receive({ ...response, nextOffset: 4 });
    h.receive({ ...response, totalChars: 4 }); h.receive({ ...response, done: true });
    assert.equal(h.client.getSnapshot().savedHistoryPreview?.phase, "loading");
    h.receive(response);
    assert.equal(h.client.getSnapshot().savedHistoryPreview?.text, "first");
    assert.equal(h.sent.at(-1), first, "no automatic unbounded chunk drain");
    h.client.navigateSavedHistoryPreview("next");
    const next = h.sent.at(-1); assert.ok(next?.type === "getSavedHistoryPreview");
    assert.equal(next.offset, 5); assert.notEqual(next.requestId, first.requestId);
    assert.equal(h.client.getSnapshot().savedHistoryPreview?.text, "", "do not keep previous chunk text while loading");
    h.receive({ ...response, requestId: next.requestId, offset: 5, nextOffset: 10, text: "later", done: true, totalChars: 11 });
    assert.equal(h.client.getSnapshot().savedHistoryPreview?.phase, "loading", "immutable total must match");
    h.receive({ ...response, requestId: next.requestId, offset: 5, nextOffset: 10, text: "later", done: true });
    assert.equal(h.client.getSnapshot().savedHistoryPreview?.text, "later");
    h.client.navigateSavedHistoryPreview("previous");
    const previous = h.sent.at(-1); assert.ok(previous?.type === "getSavedHistoryPreview");
    assert.equal(previous.offset, 0);
    h.receive({ ...response, requestId: previous.requestId });
    assert.equal(h.client.getSnapshot().savedHistoryPreview?.text, "first");
    h.client.getSavedHistory(1);
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "getSavedHistory", page: 1 });
    assert.equal(h.client.getSnapshot().savedHistoryPreview, null, "page request closes preview immediately");
    h.receive({ ...response, requestId: previous.requestId });
    h.receive(historyState({ page: 1, total: 65, messages: [{ id: "earlier-1", role: "assistant", text: "Older entry" }] }));
    assert.deepEqual(h.client.getSnapshot().savedHistory?.messages.map(line => line.id), ["earlier-1"]);
    const count = h.sent.length;
    h.client.requestSavedHistoryPreview("retained-1"); h.client.getSavedHistory(-1); h.client.getSavedHistory(3);
    assert.equal(h.sent.length, count);
    assert.equal(h.client.getSnapshot().preview, attachmentPreview, "saved history never changes attachment previews");
    h.receive({ ...historyState(), viewId: "old-view" }); h.receive(historyState({ generation: 0 }));
    assert.equal(h.client.getSnapshot().savedHistory?.page, 1);
    h.client.requestSavedHistoryPreview("earlier-1");
    const obsolete = h.sent.at(-1); assert.ok(obsolete?.type === "getSavedHistoryPreview");
    h.receive({ ...readyState, generation: 2 });
    assert.equal(h.client.getSnapshot().savedHistory, null);
    assert.equal(h.client.getSnapshot().savedHistoryPreview, null);
    h.receive({ ...response, id: obsolete.id, requestId: obsolete.requestId });
    assert.equal(h.client.getSnapshot().savedHistoryPreview, null);
  } finally { h.client.dispose(); }
});

test("mounted restored history shows one recent window, pages earlier/newer and previews retained text without touching live chat or drafts", async () => {
  const h = await uiHarness(false);
  try {
    assert.equal(h.root.querySelector("#saved-history"), null);
    await h.receive(attachmentState({ draft: { revision: 1, text: "Unsent new task", acceptedEditSequence: 0, attachments: [] } }));
    await h.render({ messages: [{ role: "assistant", text: "Live response" }] });
    const rows = Array.from({ length: 32 }, (_, i) => ({ id: "saved-row-" + i, role: "user" as const, text: i === 0 ? "<img src=x onerror=alert(1)> historical attachment" : "Retained entry " + i }));
    await h.receive(historyState({ messages: rows, total: 65 }));
    assert.equal(h.root.querySelectorAll("#saved-history [data-saved-history-row]").length, 32);
    assert.equal(h.root.querySelectorAll("#chat .msg-user").length, 0, "restored history never becomes live conversation rows");
    assert.match(h.get("#saved-history-page-status").textContent ?? "", /34–65 of 65.*Page 1 of 3/);
    assert.match(h.get("#saved-history-disclosure").textContent ?? "", /model context.*pi/i);
    assert.match(h.get("#saved-history-disclosure").textContent ?? "", /Historical tool names.*loaded.*available/);
    assert.match(h.get("#saved-history-disclosure").textContent ?? "", /earlier.*not shown/i);
    assert.equal(h.root.querySelector("#saved-history img"), null);
    assert.equal(h.get<HTMLButtonElement>("#saved-history-newer").disabled, true);
    const input = h.get<HTMLTextAreaElement>("#chat-input"); input.focus();
    await h.receive(historyState({ messages: rows, total: 65 }));
    assert.equal(h.dom.window.document.activeElement, input, "history metadata does not steal composer focus");
    assert.equal(input.value, "Unsent new task");
    await h.click('[data-saved-history-preview="saved-row-0"]');
    const request = h.sent.at(-1); assert.ok(request?.type === "getSavedHistoryPreview");
    await h.receive({ ...envelope, type: "savedHistoryPreview", requestId: request.requestId, id: request.id,
      offset: 0, nextOffset: 12, totalChars: 24, text: "<b>old</b>  ", done: false });
    assert.equal(h.get("#saved-history-preview-text").textContent, "<b>old</b>  ");
    assert.equal(h.root.querySelector("#saved-history-preview b"), null);
    assert.match(h.get("#saved-history-preview-disclosure").textContent ?? "", /retained.*snapshot.*not.*current file/i);
    await h.click("#saved-history-preview-next");
    const next = h.sent.at(-1); assert.ok(next?.type === "getSavedHistoryPreview"); assert.equal(next.offset, 12);
    assert.equal(h.get("#saved-history-preview-text").textContent, "");
    await h.receive({ ...envelope, type: "savedHistoryPreview", requestId: next.requestId, id: next.id,
      offset: 12, nextOffset: 24, totalChars: 24, text: "last chunk!!", done: true });
    assert.equal(h.get("#saved-history-preview-text").textContent, "last chunk!!");
    assert.equal(h.get<HTMLButtonElement>("#saved-history-preview-next").disabled, true);
    assert.equal(h.get<HTMLButtonElement>("#saved-history-preview-previous").disabled, false);
    await h.click("#saved-history-earlier");
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "getSavedHistory", page: 1 });
    assert.equal(h.get("#saved-history-preview").hidden, true);
    assert.equal(h.get<HTMLButtonElement>("#saved-history-earlier").disabled, true, "one page request at a time");
    await h.receive(historyState({ page: 1, messages: [{ id: "older", role: "assistant", text: "[Unsupported historical content]" }], total: 65 }));
    assert.equal(h.root.querySelectorAll("#saved-history [data-saved-history-row]").length, 1);
    assert.equal(h.root.querySelector('[data-saved-history-row="saved-row-0"]'), null);
    await h.click("#saved-history-newer");
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "getSavedHistory", page: 0 });
    assert.equal(input.value, "Unsent new task");
    assert.match(h.get("#chat").textContent ?? "", /Live response/);
    assert.equal(h.sent.some(message => ["sendChat", "updateDraft", "openReviewSource"].includes(message.type)), false);
  } finally { await h.close(); }
});

test("session confirmation and switching block all named history actions but listing still allows ordinary chat", () => {
  const h = clientHarness();
  try {
    h.receive(historyState());
    for (const phase of ["confirming", "switching"] as const) {
      h.receive(sessionPhase(phase));
      const before = h.sent.length;
      h.client.getSavedHistory(0);
      h.client.requestSavedHistoryPreview("retained-1");
      h.client.action({ type: "getSavedHistory", page: 0 });
      h.client.action({ type: "getSavedHistoryPreview", id: "retained-1", requestId: "manual", offset: 0 });
      assert.equal(h.sent.length, before, phase);
      assert.equal(h.client.getSnapshot().savedHistoryPreview, null);
    }
    h.receive(sessionPhase("listing"));
    h.client.action({ type: "sendChat", draftRevision: 0 });
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "sendChat", draftRevision: 0 }, "listing must not silently discard send");
    h.client.requestSavedHistoryPreview("retained-1");
    assert.equal(h.sent.at(-1)?.type, "getSavedHistoryPreview");
  } finally { h.client.dispose(); }
});

test("mounted history handles empty/loading/errors and preserves reading focus and scroll during streaming and session handoff", async () => {
  const h = await uiHarness();
  try {
    await h.receive(historyState({ messages: [], total: 0 }));
    assert.match(h.get("#saved-history").textContent ?? "", /No retained history entries/);
    assert.equal(h.get<HTMLButtonElement>("#saved-history-earlier").disabled, true);
    assert.equal(h.get<HTMLButtonElement>("#saved-history-newer").disabled, true);
    assert.equal(h.sent.filter(m => m.type === "getSavedHistory").length, 0, "initial recent metadata comes from host bootstrap");
    await h.receive(historyState({ phase: "loading" }));
    assert.match(h.get("#saved-history").textContent ?? "", /Loading retained history/);
    assert.equal(h.get<HTMLButtonElement>("#saved-history-refresh").disabled, true);
    assert.equal(h.get<HTMLButtonElement>("[data-saved-history-preview]").disabled, true);
    for (const code of ["unavailable", "stale", "cancelled"] as const) {
      await h.receive(historyState({ phase: "error", error: code }));
      assert.match(h.get("#saved-history [role=alert]").textContent ?? "", /unavailable|no longer current|cancelled/);
      assert.equal(h.get<HTMLButtonElement>("[data-saved-history-preview]").disabled, true);
      await h.click("#saved-history-refresh");
      assert.deepEqual(h.sent.at(-1), { ...envelope, type: "getSavedHistory", page: 0 });
    }
    await h.receive(historyState({ messages: [{ role: "assistant", text: "[Unsupported historical content]" }] }));
    assert.equal(h.root.querySelector("[data-saved-history-preview]"), null, "no opaque ID means no preview action");
    await h.receive(historyState({ total: 64 }));
    await h.click("[data-saved-history-preview]");
    const request = h.sent.at(-1); assert.ok(request?.type === "getSavedHistoryPreview");
    await h.receive({ ...envelope, type: "savedHistoryPreview", requestId: request.requestId, id: request.id, text: "old", offset: 0, nextOffset: 3, totalChars: 6, done: false });

    const main = h.get("#main"), entries = h.get("#saved-history-entries"), previewText = h.get("#saved-history-preview-text");
    Object.defineProperty(main, "scrollHeight", { configurable: true, value: 1000 });
    Object.defineProperty(main, "clientHeight", { configurable: true, value: 100 });
    main.scrollTop = 900;
    main.dispatchEvent(new h.dom.window.Event("scroll"));
    entries.scrollTop = 21; previewText.scrollTop = 11; previewText.focus();
    Object.defineProperty(main, "scrollHeight", { configurable: true, value: 2000 });
    await h.render({ messages: [{ role: "assistant", text: "Streaming response" }], chatBusy: true, execution: "replying" });
    assert.equal(h.dom.window.document.activeElement, previewText);
    assert.equal(main.scrollTop, 900, "reading historical content disables live auto-follow");
    assert.equal(entries.scrollTop, 21);
    assert.equal(previewText.scrollTop, 11, "streaming does not reset retained-text scroll");
    for (const phase of ["confirming", "switching"] as const) {
      await h.receive(sessionPhase(phase));
      for (const selector of ["#saved-history-refresh", "#saved-history-earlier", "[data-saved-history-preview]", "#saved-history-preview-next"])
        assert.equal(h.get<HTMLButtonElement>(selector).disabled, true, selector + " during " + phase);
      assert.equal(h.get<HTMLButtonElement>("#stop-chat").disabled, false);
      assert.equal(h.get<HTMLButtonElement>("#add-file").disabled, true);
      assert.equal(h.get<HTMLButtonElement>("#model-effort-trigger").disabled, true);
    }
    await h.click("#stop-chat");
    assert.equal(h.sent.at(-1)?.type, "stopChat");
    await h.receive(historyState({ available: false, messages: [], total: 0 }));
    assert.equal(h.root.querySelector("#saved-history"), null);
    await h.receive({ ...readyState, generation: 2 });
    await h.receive(historyState());
    assert.equal(h.root.querySelector("#saved-history"), null, "stale generation cannot restore historical IDs");
  } finally { await h.close(); }
});

test("both saved-history host DTOs pass the browser inventory and named native intents expose no file or confirmation capabilities", async () => {
  const { h, v } = await readySettings();
  try {
    v.action("getSavedHistoryPreview", { id: "missing", requestId: "preview-inventory", offset: 0 });
    await tick();
    const observed = new Set<string>();
    for (const message of v.sent) {
      const parsed = parseHostMessage(message);
      assert.ok(parsed, "all real host projections pass the browser parser");
      if (parsed.type === "savedHistoryState" || parsed.type === "savedHistoryPreview") {
        observed.add(parsed.type);
        assert.equal(parseHostMessage({ ...parsed, path: "file.ts" }), undefined);
      }
    }
    assert.deepEqual([...observed].sort(), ["savedHistoryPreview", "savedHistoryState"]);
    for (const intent of [{ ...envelope, type: "getSavedHistory", page: 0 }, { ...envelope, type: "getSavedHistoryPreview", id: "opaque", requestId: "request", offset: 0 }]) {
      assert.ok(parseWebviewMessage(intent));
      for (const extra of [{ path: "file.ts" }, { confirmed: true }, { html: "<script>" }])
        assert.equal(parseWebviewMessage({ ...intent, ...extra }), undefined);
    }
  } finally { h.provider.dispose(); }
});

test("retained-text paging has bounded backward metadata, replaces chunks and rejects late closed or superseded replies", () => {
  const h = clientHarness();
  try {
    h.receive(historyState());
    h.client.requestSavedHistoryPreview("retained-1");
    for (let offset = 0; offset < 130; offset++) {
      const request = h.sent.at(-1); assert.ok(request?.type === "getSavedHistoryPreview");
      assert.equal(request.offset, offset);
      h.receive({ ...envelope, type: "savedHistoryPreview", id: request.id, requestId: request.requestId, text: "x", offset, nextOffset: offset + 1, totalChars: 130, done: offset === 129 });
      assert.equal(h.client.getSnapshot().savedHistoryPreview?.text, "x", "chunks are replaced, never accumulated");
      assert.ok((h.client.getSnapshot().savedHistoryPreview?.previousOffsets.length ?? 0) <= 128);
      if (offset < 129) h.client.navigateSavedHistoryPreview("next");
    }
    const beforeDone = h.sent.length;
    h.client.navigateSavedHistoryPreview("next");
    assert.equal(h.sent.length, beforeDone);
    for (let offset = 128; offset >= 1; offset--) {
      h.client.navigateSavedHistoryPreview("previous");
      const request = h.sent.at(-1); assert.ok(request?.type === "getSavedHistoryPreview");
      assert.equal(request.offset, offset);
      h.receive({ ...envelope, type: "savedHistoryPreview", id: request.id, requestId: request.requestId, text: "x", offset, nextOffset: offset + 1, totalChars: 130, done: false });
    }
    assert.deepEqual(h.client.getSnapshot().savedHistoryPreview?.previousOffsets, []);
    const beforePrevious = h.sent.length;
    h.client.navigateSavedHistoryPreview("previous");
    assert.equal(h.sent.length, beforePrevious);
    h.client.navigateSavedHistoryPreview("first");
    const first = h.sent.at(-1); assert.ok(first?.type === "getSavedHistoryPreview");
    assert.equal(first.offset, 0, "First chunk recovers older positions beyond the bounded back stack");
    h.receive({ ...envelope, type: "savedHistoryPreview", id: first.id, requestId: first.requestId, code: "cancelled" });
    assert.equal(h.client.getSnapshot().savedHistoryPreview?.error, "cancelled");
    h.client.navigateSavedHistoryPreview("retry");
    const retry = h.sent.at(-1); assert.ok(retry?.type === "getSavedHistoryPreview");
    assert.equal(retry.offset, 0); assert.notEqual(retry.requestId, first.requestId);
    h.receive({ ...envelope, type: "savedHistoryPreview", id: first.id, requestId: first.requestId, code: "unavailable" });
    assert.equal(h.client.getSnapshot().savedHistoryPreview?.phase, "loading");
    h.client.closeSavedHistoryPreview();
    h.receive({ ...envelope, type: "savedHistoryPreview", id: retry.id, requestId: retry.requestId, text: "x", offset: 0, nextOffset: 1, totalChars: 130, done: false });
    assert.equal(h.client.getSnapshot().savedHistoryPreview, null);
    h.client.requestSavedHistoryPreview("retained-1");
    h.receive(historyState({ messages: [{ id: "replacement", role: "user", text: "New metadata ID" }] }));
    assert.equal(h.client.getSnapshot().savedHistoryPreview, null, "same page with replaced IDs invalidates the old preview");
    const beforeOldId = h.sent.length;
    h.client.requestSavedHistoryPreview("retained-1");
    assert.equal(h.sent.length, beforeOldId);
  } finally { h.client.dispose(); }
});

test("mounted preview reports retryable errors and closes explicitly without letting late replies steal focus", async () => {
  const h = await uiHarness();
  try {
    await h.receive(historyState());
    await h.click("[data-saved-history-preview]");
    const request = h.sent.at(-1); assert.ok(request?.type === "getSavedHistoryPreview");
    await h.receive({ ...envelope, type: "savedHistoryPreview", id: request.id, requestId: request.requestId, code: "unavailable" });
    assert.match(h.get("#saved-history-preview [role=alert]").textContent ?? "", /Retained history is unavailable/);
    await h.click("#saved-history-preview-retry");
    const retry = h.sent.at(-1); assert.ok(retry?.type === "getSavedHistoryPreview");
    assert.notEqual(retry.requestId, request.requestId);
    await h.click("#saved-history-preview-close");
    const trigger = h.get("[data-saved-history-preview]");
    assert.equal(h.dom.window.document.activeElement, trigger, "explicit Close returns focus to the row action");
    assert.equal(h.get("#saved-history-preview").hidden, true);
    await h.receive({ ...envelope, type: "savedHistoryPreview", id: retry.id, requestId: retry.requestId, code: "stale" });
    assert.equal(h.get("#saved-history-preview").hidden, true);
    assert.equal(h.dom.window.document.activeElement, trigger);
  } finally { await h.close(); }
});

test("an unavailable restored-history projection is visible without advertising retained rows", async()=>{
 const h=await uiHarness();try{await h.receive(historyState({available:false,phase:"error",messages:[],total:0,error:"unavailable"}));assert.match(h.get("#saved-history").textContent??"",/unavailable/i);assert.equal(h.root.querySelectorAll("[data-saved-history-row]").length,0);assert.equal(h.get<HTMLButtonElement>("#saved-history-refresh").disabled,true);}finally{await h.close();}
});
