import assert from "node:assert/strict";
import test from "node:test";
import { PreviewBridge, type PreviewScenario } from "../preview/fixtures.js";
import { parseHostMessage } from "../host-messages.js";
import { parseWebviewMessage, type HostMessage, type AttachmentStateMessage } from "../../extension/webviewMessages.js";

function fixture(scenario: PreviewScenario) {
  const bridge = new PreviewBridge(scenario); const messages: HostMessage[] = [];
  bridge.subscribe(value => { const parsed = parseHostMessage(value); assert.ok(parsed); messages.push(parsed); });
  bridge.postMessage({ version: 2, type: "getWorkspaceState" });
  const state = (): AttachmentStateMessage => { const found = [...messages].reverse().find(m => m.type === "attachmentState"); assert.ok(found?.type === "attachmentState"); return found; };
  const send = (action: Record<string, unknown>) => {
    const current = state(); const parsed = parseWebviewMessage({ version: 2, viewId: current.viewId, generation: current.generation, ...action });
    assert.ok(parsed); bridge.postMessage(parsed);
  };
  const body = () => send({ type: "updateDraft", draftRevision: state().draft.revision, editSequence: state().draft.acceptedEditSequence + 1, text: "literal preview request" });
  return { bridge, messages, state, send, body };
}

test("synthetic latest-file choice progresses only after exact confirmation and deliberate Send", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture("source-changed");
  try {
    f.body(); const original = f.state().draft.attachments[0]!;
    f.send({ type: "sendChat", draftRevision: f.state().draft.revision });
    assert.equal(f.state().draft.attachments[0]?.state, "confirmation-required");
    assert.notEqual(f.state().draft.attachments[0]?.snapshotId, original.snapshotId);
    const draft = f.state().draft; const answer = { type: "confirmFileAttachment", draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId, snapshotId: draft.attachments[0]!.snapshotId };
    f.send({ ...answer, snapshotId: "wrong" }); t.mock.timers.tick(420);
    assert.equal(f.state().draft.attachments[0]?.state, "confirmation-required");
    f.send(answer); t.mock.timers.tick(420);
    assert.equal(f.state().draft.attachments[0]?.state, "attached"); assert.equal(f.state().historyCount, 2); assert.equal(f.state().draft.text, "literal preview request");
    f.send({ type: "sendChat", draftRevision: f.state().draft.revision });
    assert.equal(f.state().historyCount, 3); assert.equal(f.state().draft.text, "");
  } finally { f.bridge.dispose(); }
});

test("synthetic fixed selection supports preview and cancelled old-snapshot confirmation without replay", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture("source-changed");
  try {
    f.send({ type: "removeAttachment", draftRevision: f.state().draft.revision, attachmentId: f.state().draft.attachments[0]!.attachmentId });
    f.send({ type: "addSelectionAttachment", draftRevision: f.state().draft.revision }); t.mock.timers.tick(420);
    const attachment = f.state().draft.attachments[0]; assert.equal(attachment?.kind, "selection");
    f.send({ type: "getAttachmentPreview", requestId: "preview", snapshotId: attachment!.snapshotId, offset: 0 }); t.mock.timers.tick(80);
    const preview = f.messages.at(-1); assert.ok(preview?.type === "attachmentPreview" && "text" in preview); assert.equal(preview.text, "return `Hello, ${name}`;");
    f.body(); f.send({ type: "sendChat", draftRevision: f.state().draft.revision });
    const draft = f.state().draft; assert.equal(draft.attachments[0]?.state, "confirmation-required"); assert.equal(draft.attachments[0]?.snapshotId, attachment?.snapshotId);
    const answer = { type: "confirmSelectionAttachment", draftRevision: draft.revision, attachmentId: attachment!.attachmentId, snapshotId: attachment!.snapshotId };
    f.send(answer); f.send({ type: "stopChat" }); t.mock.timers.tick(420);
    assert.equal(f.state().draft.attachments[0]?.state, "confirmation-required");
    f.send(answer); t.mock.timers.tick(420); assert.equal(f.state().result?.code, "stale");
    f.send({ ...answer, draftRevision: f.state().draft.revision }); t.mock.timers.tick(420);
    assert.equal(f.state().draft.attachments[0]?.state, "attached"); assert.equal(f.state().historyCount, 2);
    f.send({ type: "sendChat", draftRevision: f.state().draft.revision }); assert.equal(f.state().historyCount, 3);
  } finally { f.bridge.dispose(); }
});

test("synthetic pending attachment acquisition cannot overwrite a newer draft", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture("ready");
  try {
    f.send({ type: "addSelectionAttachment", draftRevision: f.state().draft.revision }); f.body(); t.mock.timers.tick(420);
    assert.equal(f.state().draft.attachments[0], undefined); assert.equal(f.state().preparation, "idle"); assert.equal(f.state().draft.text, "literal preview request");
  } finally { f.bridge.dispose(); }
});

test("synthetic mixed attachment collection keeps order and admits every item with one submission identity", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture("ready");
  try {
    f.send({ type: "addFileAttachment", draftRevision: f.state().draft.revision }); t.mock.timers.tick(420);
    f.send({ type: "addSelectionAttachment", draftRevision: f.state().draft.revision }); t.mock.timers.tick(420);
    assert.deepEqual(f.state().draft.attachments.map(a => a.kind), ["file", "selection"]);
    f.body(); const count = f.state().historyCount;
    f.send({ type: "sendChat", draftRevision: f.state().draft.revision });
    assert.equal(f.state().historyCount, count + 2); assert.deepEqual(f.state().draft.attachments, []);
    f.send({ type: "getAttachmentHistory" });
    const message = f.messages.at(-1); assert.ok(message?.type === "attachmentHistory");
    const entries = message.entries.slice(-2); assert.equal(entries.length, 2); assert.equal(entries[0].submissionId, entries[1].submissionId);
  } finally { f.bridge.dispose(); }
});

test("long-history preview exposes 128 immutable mixed metadata records and bounded exact chunked text", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture("long-history" as PreviewScenario);
  try {
    assert.equal(f.state().historyCount, 128); const draft = f.state().draft;
    f.send({ type: "getAttachmentHistory" });
    const history = f.messages.at(-1); assert.ok(history?.type === "attachmentHistory");
    assert.equal(history.entries.length, 128); assert.equal(history.entries[0].submissionId, history.entries[19].submissionId);
    assert.notEqual(history.entries[19].submissionId, history.entries[20].submissionId);
    assert.ok(history.entries.some(e => e.kind === "selection"));
    const snapshotId = history.entries[0].snapshotId; let offset = 0; let text = ""; let chunks = 0;
    for (;;) {
      f.send({ type: "getAttachmentPreview", requestId: "history-preview", snapshotId, offset }); t.mock.timers.tick(80);
      const message = f.messages.at(-1); assert.ok(message?.type === "attachmentPreview" && "text" in message);
      assert.ok(message.text.length <= 16384); text += message.text; chunks++; offset = message.nextOffset;
      if (message.done) break;
    }
    assert.equal(chunks, 2, "long fixture uses production-sized bounded chunks"); assert.equal(text, "// retained history 1\n" + "中🐱".repeat(6000) + "\n");
    assert.deepEqual(f.state().draft, draft);
    f.send({ type: "addFileAttachment", draftRevision: draft.revision }); t.mock.timers.tick(420);
    const attached = f.state().draft; f.send({ type: "sendChat", draftRevision: attached.revision });
    assert.equal(f.state().result?.code, "history-full"); assert.deepEqual(f.state().draft, attached); assert.equal(f.state().historyCount, 128);
  } finally { f.bridge.dispose(); }
});

test("long-history synthetic plain chat remains within the real message projection bound while streaming", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture("long-history");
  try {
    f.send({ type: "sendChat", draftRevision: f.state().draft.revision });
    const current = [...f.messages].reverse().find(m => m.type === "workspaceState");
    assert.ok(current?.type === "workspaceState"); assert.equal(current.chatBusy, true); assert.equal(current.messages.length, 32);
    assert.equal(f.state().draft.text, ""); assert.equal(f.state().historyCount, 128);
    t.mock.timers.tick(400); f.body(); f.send({ type: "stopChat" }); t.mock.timers.tick(4000);
    assert.equal(f.state().draft.text, "literal preview request"); assert.equal(f.state().historyCount, 128);
  } finally { f.bridge.dispose(); }
});
