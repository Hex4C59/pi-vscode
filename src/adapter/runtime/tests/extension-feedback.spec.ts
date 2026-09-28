import assert from "node:assert/strict";
import { test } from "node:test";
import { createExtensionFeedback } from "../extension-feedback.js";

function frame(method: string, fields: Record<string, unknown> = {}): Record<string, unknown> {
  return { type: "extension_ui_request", id: "remote-private-id", method, ...fields };
}

test("public RPC feedback becomes literal local metadata, never remote identity or draft commands", () => {
  const store = createExtensionFeedback();
  assert.equal(store.accept(frame("notify", { message: "Hello", notifyType: "warning" })), true);
  assert.equal(store.accept(frame("setTitle", { title: "Requested title" })), true);
  assert.equal(store.accept(frame("set_editor_text", { text: "Requested draft" })), true);
  const snapshot = store.snapshot();
  assert.deepEqual(snapshot.feedback.map(({ kind, level, text }) => ({ kind, level, text })), [
    { kind: "notify", level: "warning", text: "Hello" },
    { kind: "title", level: "info", text: "Requested title" },
    { kind: "editor-text", level: "info", text: "Requested draft" },
  ]);
  assert.equal(snapshot.omittedFeedback, 0);
  assert.equal(JSON.stringify(snapshot).includes("remote-private-id"), false);
  assert.equal(new Set(snapshot.feedback.map(item => item.id)).size, 3);
  assert.deepEqual(Object.keys(snapshot.feedback[0]).sort(), ["id", "kind", "level", "text"]);
});

test("keyed replacement and clears follow public APIs without retaining remote keys", () => {
  const store = createExtensionFeedback();
  assert.equal(store.accept(frame("setStatus", { statusKey: "private-key", statusText: "first" })), true);
  const firstId = store.snapshot().feedback[0].id;
  store.accept(frame("setStatus", { statusKey: "private-key", statusText: "second" }));
  assert.equal(store.snapshot().feedback.length, 1);
  assert.equal(store.snapshot().feedback[0].text, "second");
  assert.notEqual(store.snapshot().feedback[0].id, firstId);
  store.accept(frame("setWidget", { widgetKey: "private-key", widgetLines: ["one", "two"], widgetPlacement: "belowEditor" }));
  assert.equal(store.snapshot().feedback[1].text, "one\ntwo");
  assert.equal(JSON.stringify(store.snapshot()).includes("private-key"), false);
  store.accept(frame("setStatus", { statusKey: "private-key", statusText: "" }));
  assert.equal(store.snapshot().feedback[1].text, "");
  store.accept(frame("setStatus", { statusKey: "private-key" }));
  store.accept(frame("setWidget", { widgetKey: "private-key", widgetLines: [] }));
  assert.equal(store.snapshot().feedback.length, 1);
  assert.equal(store.snapshot().feedback[0].text, "");
  store.accept(frame("setWidget", { widgetKey: "private-key", widgetLines: undefined }));
  assert.deepEqual(store.snapshot(), { feedback: [], omittedFeedback: 0 });
});

test("capacity evicts oldest entries, bounds keyed retention and counts omissions", () => {
  const store = createExtensionFeedback();
  for (let index = 0; index < 20; index++) store.accept(frame("notify", { message: `${index}` }));
  assert.equal(store.snapshot().feedback.length, 16);
  assert.equal(store.snapshot().feedback[0].text, "4");
  assert.equal(store.snapshot().omittedFeedback, 4);
  store.reset();
  for (let index = 0; index < 9; index++) store.accept(frame("setStatus", { statusKey: `${index}`, statusText: `s${index}` }));
  for (let index = 0; index < 5; index++) store.accept(frame("setWidget", { widgetKey: `${index}`, widgetLines: [`w${index}`] }));
  assert.equal(store.snapshot().feedback.filter(item => item.kind === "status").length, 8);
  assert.equal(store.snapshot().feedback.filter(item => item.kind === "widget").length, 4);
  assert.equal(store.snapshot().omittedFeedback, 2);
  assert.equal(store.snapshot().feedback[0].text, "s1");
  store.accept(frame("setStatus", { statusKey: "0" }));
  assert.equal(store.snapshot().feedback.length, 12);
  store.reset();
  store.accept(frame("notify", { message: "é".repeat(16384) }));
  store.accept(frame("notify", { message: "x".repeat(32768) }));
  assert.equal(store.snapshot().feedback.length, 2);
  store.accept(frame("notify", { message: "z" }));
  assert.equal(store.snapshot().feedback.length, 2);
  assert.equal(store.snapshot().feedback[0].text.length, 32768);
  assert.equal(store.snapshot().omittedFeedback, 1);
});

test("malformed frames are rejected and unsafe or oversized content becomes only a fixed warning", () => {
  const store = createExtensionFeedback();
  for (const value of [null, [], {}, frame("setEditorText", { text: "alias" }),
    frame("notify", { message: "ok", extra: "path" }), frame("notify", { message: "ok", notifyType: "fatal" }),
    frame("setStatus", { statusKey: "é".repeat(51), statusText: "ok" }),
    frame("setWidget", { widgetKey: "w", widgetLines: [12] }),
    frame("setWidget", { widgetKey: "w", widgetLines: [], widgetPlacement: "side" }),
    frame("setStatus", { statusKey: "s", statusText: null }),
    frame("notify", { id: "", message: "ok" }),
  ]) assert.equal(store.accept(value), false);
  assert.deepEqual(store.snapshot(), { feedback: [], omittedFeedback: 0 });
  for (const message of ["password=synthetic", "Bearer synthetic-token", "-----BEGIN PRIVATE KEY-----", "é".repeat(16385), "x".repeat(65537), "\t".repeat(32768)]) {
    assert.equal(store.accept(frame("notify", { message })), false);
    const warning = store.snapshot().feedback.at(-1);
    assert.equal(warning?.level, "warning");
    assert.equal(warning?.text, "Extension feedback omitted: unsafe or oversized content.");
  }
  assert.equal(store.snapshot().omittedFeedback, 6);
});

test("validation cannot clear existing keys; snapshots are detached and reset does not reuse IDs", () => {
  const store = createExtensionFeedback();
  store.accept(frame("setStatus", { statusKey: "s", statusText: "original" }));
  assert.equal(store.accept(frame("setStatus", { statusKey: "s", statusText: 3 })), false);
  assert.equal(store.snapshot().feedback[0].text, "original");
  const snapshot = store.snapshot();
  const id = snapshot.feedback[0].id;
  snapshot.feedback[0].text = "mutation";
  snapshot.feedback.length = 0;
  assert.equal(store.snapshot().feedback[0].text, "original");
  store.reset();
  assert.deepEqual(store.snapshot(), { feedback: [], omittedFeedback: 0 });
  store.accept(frame("notify", { message: "fresh", notifyType: "error" }));
  assert.notEqual(store.snapshot().feedback[0].id, id);
  assert.equal(store.snapshot().feedback[0].level, "error");
  let getterCalled = false;
  assert.equal(store.accept({ get method() { getterCalled = true; return "notify"; } }), false);
  assert.equal(getterCalled, false);
  assert.equal(store.accept(frame("notify", { message: "ok", toJSON() { throw new Error("must not call"); } })), false);
});

test("exact UTF-8 key and serialized frame boundaries are enforced", () => {
  const store = createExtensionFeedback();
  assert.equal(store.accept(frame("setStatus", { statusKey: "é".repeat(50), statusText: "ok" })), true);
  assert.equal(store.accept(frame("setWidget", { widgetKey: "é".repeat(50), widgetLines: ["a", "", "b"] })), true);
  assert.equal(store.snapshot().feedback[1].text, "a\n\nb");
  const base = frame("notify", { message: "" });
  const overhead = Buffer.byteLength(JSON.stringify(base));
  const remaining = 65536 - overhead;
  // Tabs serialize to two bytes; the source text remains under the per-entry limit.
  const message = "\t".repeat(Math.floor(remaining / 2)) + (remaining % 2 ? "x" : "");
  assert.equal(Buffer.byteLength(JSON.stringify(frame("notify", { message }))), 65536);
  assert.equal(store.accept(frame("notify", { message })), true);
  assert.equal(store.accept(frame("notify", { message: message + "x" })), false);
  assert.equal(store.snapshot().feedback.at(-1)?.level, "warning");
});

test("credential-like metadata and array tricks never escape or mutate keyed state", () => {
  const store = createExtensionFeedback();
  store.accept(frame("setWidget", { widgetKey: "w", widgetLines: ["original"] }));
  assert.equal(store.accept(frame("setWidget", { widgetKey: "w", widgetLines: ["authorization:", "Bearer synthetic"] })), false);
  assert.equal(store.snapshot().feedback[0].text, "original");
  assert.equal(store.accept(frame("setStatus", { statusKey: "secret=synthetic", statusText: "ok" })), false);
  assert.equal(JSON.stringify(store.snapshot()).includes("synthetic"), false);
  let invoked = false;
  const lines = ["ok"];
  Object.defineProperty(lines, "0", { get() { invoked = true; return "secret"; } });
  assert.equal(store.accept(frame("setWidget", { widgetKey: "w", widgetLines: lines })), false);
  assert.equal(invoked, false);
  assert.equal(store.accept(frame("setWidget", { widgetKey: "w", widgetLines: new Array(3) })), false);
  const extra = ["ok"];
  Object.defineProperty(extra, "extra", { value: "hidden" });
  assert.equal(store.accept(frame("setWidget", { widgetKey: "w", widgetLines: extra })), false);
  assert.equal(store.accept(frame("setWidget", { widgetKey: "w", widgetLines: ["x".repeat(32768), ""] })), false);
});

test("long-lived key churn and replacement stay bounded; reset clears omissions without ID reuse", () => {
  const store = createExtensionFeedback();
  for (let index = 0; index < 2000; index++) {
    store.accept(frame("setStatus", { statusKey: `s${index}`, statusText: "status" }));
    store.accept(frame("setWidget", { widgetKey: `w${index}`, widgetLines: ["widget"] }));
  }
  assert.equal(store.snapshot().feedback.length, 12);
  assert.equal(store.snapshot().omittedFeedback, 3988);
  const lastId = store.snapshot().feedback.at(-1)?.id;
  for (let index = 0; index < 100; index++) store.accept(frame("setStatus", { statusKey: "s1999", statusText: "updated" }));
  assert.equal(store.snapshot().feedback.length, 12);
  assert.equal(store.snapshot().omittedFeedback, 3988);
  store.reset();
  store.accept(frame("notify", { message: "new lifecycle" }));
  assert.equal(store.snapshot().omittedFeedback, 0);
  assert.notEqual(store.snapshot().feedback[0].id, lastId);
});
