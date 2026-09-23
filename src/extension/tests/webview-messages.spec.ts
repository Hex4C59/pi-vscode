import assert from "node:assert/strict";
import { test } from "node:test";
import { handleWebviewMessage, isPingMessage, parseWebviewMessage } from "../webviewMessages.js";

test("v2 exact actions reject old pages, accessors, paths and invalid identities", () => {
  const envelope = { version: 2, generation: 1, viewId: "view" };
  const actions = [
    { type: "openFolder" }, { type: "manageTrust" }, { type: "stopChat" }, { type: "getAttachmentHistory" },
    { type: "chooseResources", choice: "allow" }, { type: "sendChat", draftRevision: 0 },
    { type: "addFileAttachment", draftRevision: 0 }, { type: "addSelectionAttachment", draftRevision: 0 }, { type: "removeAttachment", draftRevision: 0, attachmentId: "a" },
    { type: "confirmFileAttachment", draftRevision: 0, attachmentId: "a", snapshotId: "s" },
    { type: "confirmSelectionAttachment", draftRevision: 0, attachmentId: "a", snapshotId: "s" },
    { type: "getAttachmentPreview", requestId: "r", snapshotId: "s", offset: 0 },
    { type: "updateDraft", draftRevision: 0, editSequence: 1, text: "" },
    { type: "setThinkingLevel", level: "high" }, { type: "setChatModel", provider: "p", modelId: "m" },
  ];
  for (const action of actions) {
    const valid = { ...envelope, ...action };
    assert.ok(parseWebviewMessage(valid));
    for (const extra of [{ version: 1 }, { path: "/evil" }, { command: "run" }, { viewId: "../view" }, { generation: -1 }, { generation: NaN }]) assert.equal(parseWebviewMessage({ ...valid, ...extra }), undefined);
    assert.equal(parseWebviewMessage({ ...valid, get unexpected() { throw new Error("must not execute"); } }), undefined);
  }
  const draft = { ...envelope, type: "updateDraft", draftRevision: 0, editSequence: 1 };
  assert.ok(parseWebviewMessage({ ...draft, text: " ".repeat(8000) }));
  assert.equal(parseWebviewMessage({ ...draft, text: " ".repeat(8000) + "a" }), undefined);
  assert.equal(parseWebviewMessage({ ...draft, text: "x", draftRevision: Number.MAX_SAFE_INTEGER + 1 }), undefined);
  assert.equal(parseWebviewMessage(Object.create({ version: 2, type: "ping" })), undefined);
  assert.equal(parseWebviewMessage({ version: 2, type: "ping", [Symbol("extra")]: 1 }), undefined);
});

test("accepts only v2 bootstrap ping and returns pong", () => {
  assert.equal(isPingMessage({ version: 2, type: "ping" }), true);
  assert.deepEqual(handleWebviewMessage({ version: 2, type: "ping" }), { version: 2, type: "pong" });
  for (const message of [null, [], "ping", 1, {}, { version: 1, type: "ping" }, { version: 2, type: "prompt" }, { version: 2, type: "ping", command: "run" }]) assert.equal(handleWebviewMessage(message), undefined);
});


test("approval actions require opaque IDs and literal decisions without invoking conversion", () => {
  const envelope = { version: 2, generation: 1, viewId: "view" };
  for (const type of ["decideApproval", "revokeGrant"]) {
    const action = { ...envelope, type, ...(type === "decideApproval" ? { decision: "once" } : {}) };
    assert.ok(parseWebviewMessage({ ...action, id: "approval-1_A" }));
    for (const id of ["../x", "line\nbreak", " ", "a".repeat(101)]) assert.equal(parseWebviewMessage({ ...action, id }), undefined);
  }
  let conversions = 0;
  assert.equal(parseWebviewMessage({ ...envelope, type: "decideApproval", id: "approval-1", decision: { toString() { conversions++; return "once"; } } }), undefined);
  assert.equal(conversions, 0);
});

test("whole-file confirmation requires exact host snapshot identity, never supplied text or paths", () => {
  const action = { version: 2, type: "confirmFileAttachment", generation: 1, viewId: "v", draftRevision: 4, attachmentId: "a", snapshotId: "s" };
  assert.ok(parseWebviewMessage(action));
  for (const extra of [{ snapshotId: "../escape" }, { attachmentId: "" }, { text: "override" }, { path: "source.ts" }, { draftRevision: -1 }]) assert.equal(parseWebviewMessage({ ...action, ...extra }), undefined);
  const { snapshotId: omitted, ...incomplete } = action; void omitted;
  assert.equal(parseWebviewMessage(incomplete), undefined);
});

test("selection intents never admit UI text, ranges or source paths", () => {
  const envelope = { version: 2, generation: 1, viewId: "v", draftRevision: 4 };
  for (const action of [{ ...envelope, type: "addSelectionAttachment" }, { ...envelope, type: "confirmSelectionAttachment", attachmentId: "a", snapshotId: "s" }]) {
    assert.ok(parseWebviewMessage(action));
    for (const extra of [{ text: "override" }, { originalRange: { start: { line: 0, character: 0 }, end: { line: 1, character: 0 } } }, { uri: "file:///source.ts" }, { stale: false }]) assert.equal(parseWebviewMessage({ ...action, ...extra }), undefined);
  }
});
