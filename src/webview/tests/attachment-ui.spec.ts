import assert from "node:assert/strict";
import test from "node:test";
import { attachmentState, uiHarness } from "./react-harness.js";

const attachment = { attachmentId: "a", snapshotId: "s", relativePath: "src/<script>.ts", kind: "file" as const, utf8Bytes: 9, unsaved: true, state: "attached" as const };
const envelope = { version: 2, generation: 1, viewId: "view" };

test("attachment preview correlates pages, stays literal, and history remains inspectable during streaming", async () => {
  const h = await uiHarness();
  try {
    await h.receive(attachmentState({ draft: { revision: 1, text: "task", acceptedEditSequence: 0, attachments: [attachment] } }));
    await h.click('#attachment-entry [data-attachment-action="preview"]');
    const request = h.sent.at(-1); assert.ok(request?.type === "getAttachmentPreview");
    await h.receive({ ...envelope, type: "attachmentPreview", requestId: "obsolete", snapshotId: "s", offset: 0, nextOffset: 4, done: true, text: "lost" });
    assert.equal(h.get("#attachment-preview-text").textContent, "");
    await h.receive({ ...envelope, type: "attachmentPreview", requestId: request.requestId, snapshotId: "s", offset: 0, nextOffset: 8, done: false, text: "<script>" });
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "getAttachmentPreview", requestId: request.requestId, snapshotId: "s", offset: 8 });
    await h.receive({ ...envelope, type: "attachmentPreview", requestId: request.requestId, snapshotId: "s", offset: 8, nextOffset: 9, done: true, text: "x" });
    assert.equal(h.get("#attachment-preview-text").textContent, "<script>x");
    assert.equal(h.root.querySelector("script"), null);
    await h.click("#close-preview");
    assert.equal(h.get("#attachment-preview-text").textContent, "");
    await h.click("#attachment-history");
    await h.receive({ ...envelope, type: "attachmentHistory", entries: Array.from({ length: 40 }, (_, i) => ({ relativePath: attachment.relativePath, kind: attachment.kind, utf8Bytes: attachment.utf8Bytes, unsaved: attachment.unsaved, snapshotId: `snapshot-${i}`, submissionId: `submission-${i}`, delivery: "unknown", outcome: "interrupted" })) });
    assert.equal(h.root.querySelectorAll("[data-submission-id]").length, 8);
    assert.match(h.get("#history-page-status").textContent ?? "", /Snapshots 33–40 of 40/);
    await h.render({ chatBusy: true, execution: "replying" });
    await h.click('#attachment-history-list [data-snapshot-id="snapshot-39"]');
    assert.equal(h.sent.at(-1)?.type, "getAttachmentPreview");
    assert.ok(h.get("#attachment-history-list").textContent?.includes("unknown / interrupted"));
  } finally { await h.close(); }
});

test("source changes and preparation cancellation preserve draft; removing closes preview", async () => {
  const h = await uiHarness();
  try {
    await h.input("task");
    await h.receive(attachmentState({ draft: { revision: 1, text: "task", acceptedEditSequence: 1, attachments: [attachment] } }));
    await h.click("#send-chat");
    await h.receive(attachmentState({ draft: { revision: 1, text: "task", acceptedEditSequence: 1, attachments: [attachment] }, preparation: "preparing" }));
    await h.click("#stop-chat"); assert.equal(h.sent.at(-1)?.type, "stopChat");
    await h.receive(attachmentState({ draft: { revision: 1, text: "task", acceptedEditSequence: 1, attachments: [attachment] }, result: { code: "preparation-cancelled" } }));
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "task");
    assert.equal(h.get<HTMLButtonElement>("#send-chat").disabled, false);
    await h.receive(attachmentState({ draft: { revision: 1, text: "task", acceptedEditSequence: 1, attachments: [{ ...attachment, state: "changed" }] }, result: { code: "source-changed" } }));
    assert.match(h.get("#attachment-status").textContent ?? "", /confirm Use latest contents/);
    await h.click('#attachment-entry [data-attachment-action="preview"]');
    await h.click('#attachment-entry [data-attachment-action="remove"]');
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "removeAttachment", draftRevision: 1, attachmentId: "a" });
    assert.equal(h.get("#attachment-preview").hidden, true);
    assert.equal(h.sent.filter(m => m.type === "sendChat").length, 1);
  } finally { await h.close(); }
});

test("generation and runtime loss clear previews/history; a recreated view restores only host-acknowledged text", async () => {
  const h = await uiHarness();
  try {
    await h.input("unacknowledged local draft");
    await h.render({ generation: 2 });
    await h.receive(attachmentState({ generation: 2, draft: { revision: 5, text: "host draft", acceptedEditSequence: 1, attachments: [] } }));
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "unacknowledged local draft");
    const count = h.sent.length;
    await h.receive(attachmentState({ draft: { revision: 99, text: "stale", acceptedEditSequence: 99, attachments: [attachment] } }));
    await h.render({ viewId: "wrong-view", generation: 8 });
    assert.equal(h.sent.length, count);
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "unacknowledged local draft");
  } finally { await h.close(); }
  const next = await uiHarness(false);
  try {
    await next.receive(attachmentState({ draft: { revision: 5, text: "host draft", acceptedEditSequence: 1, attachments: [attachment] } }));
    await next.render();
    assert.equal(next.get<HTMLTextAreaElement>("#chat-input").value, "host draft");
    await next.click('#attachment-entry [data-attachment-action="preview"]');
    await next.click("#attachment-history");
    await next.receive(attachmentState({ draft: { revision: 6, text: "host draft", acceptedEditSequence: 1, attachments: [] }, result: { code: "runtime-lost" } }));
    assert.equal(next.get("#attachment-preview").hidden, true);
    assert.equal(next.root.querySelectorAll("[data-submission-id]").length, 0);
    assert.match(next.get("#attachment-status").textContent ?? "", /reattach/);
  } finally { await next.close(); }
});

test("changed file Send stages a latest snapshot; explicit confirmation names that version and never auto-sends", async () => {
  const h = await uiHarness(false);
  try {
    await h.receive(attachmentState({ draft: { revision: 1, text: "task", acceptedEditSequence: 0, attachments: [attachment] } })); await h.render();
    await h.click('#attachment-entry [data-attachment-action="preview"]');
    const preview = h.sent.at(-1); assert.ok(preview?.type === "getAttachmentPreview");
    await h.receive({ ...envelope, type: "attachmentPreview", requestId: preview.requestId, snapshotId: "s", offset: 0, nextOffset: 3, done: true, text: "old" });
    await h.receive(attachmentState({ draft: { revision: 1, text: "task", acceptedEditSequence: 0, attachments: [{ ...attachment, state: "changed" }] } }));
    assert.equal(h.get<HTMLButtonElement>("#send-chat").disabled, false);
    await h.click("#send-chat");
    const latest = { ...attachment, snapshotId: "latest", utf8Bytes: 19, state: "confirmation-required" as const };
    await h.receive(attachmentState({ draft: { revision: 2, text: "task", acceptedEditSequence: 0, attachments: [latest] }, result: { code: "source-changed" } }));
    assert.equal(h.get("#attachment-preview").hidden, true, "old draft bytes must not appear as latest");
    assert.equal(h.get<HTMLButtonElement>("#send-chat").disabled, true);
    assert.match(h.get("#attachment-entry").textContent ?? "", /Use latest contents/);
    await h.click('[data-attachment-action="confirm"]');
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "confirmFileAttachment", draftRevision: 2, attachmentId: "a", snapshotId: "latest" });
    await h.receive(attachmentState({ draft: { revision: 3, text: "task", acceptedEditSequence: 0, attachments: [{ ...latest, state: "attached" }] } }));
    assert.equal(h.sent.filter(m => m.type === "sendChat").length, 1);
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "task");
    assert.equal(h.get<HTMLButtonElement>("#send-chat").disabled, false);
    await h.click("#send-chat"); assert.equal(h.sent.filter(m => m.type === "sendChat").length, 2);
  } finally { await h.close(); }
});

test("confirmation waits for current text acknowledgment and preparation, while unrelated history preview survives", async () => {
  const h = await uiHarness(false);
  try {
    const staged = { ...attachment, state: "confirmation-required" as const };
    await h.receive(attachmentState({ draft: { revision: 1, text: "task", acceptedEditSequence: 0, attachments: [staged] } })); await h.render();
    await h.click("#attachment-history");
    await h.receive({ ...envelope, type: "attachmentHistory", entries: [{ snapshotId: "historical", submissionId: "previous", relativePath: "old.ts", kind: "file", utf8Bytes: 3, unsaved: false, delivery: "rpc-accepted", outcome: "settled" }] });
    await h.click('[data-snapshot-id="historical"]');
    const preview = h.sent.at(-1); assert.ok(preview?.type === "getAttachmentPreview");
    await h.receive({ ...envelope, type: "attachmentPreview", requestId: preview.requestId, snapshotId: "historical", offset: 0, nextOffset: 3, done: true, text: "old" });
    await h.input("new task");
    assert.equal(h.get<HTMLButtonElement>('[data-attachment-action="confirm"]').disabled, true);
    await h.click('[data-attachment-action="confirm"]'); assert.equal(h.sent.filter(m => m.type === "confirmFileAttachment").length, 0);
    const update = [...h.sent].reverse().find(m => m.type === "updateDraft"); assert.ok(update?.type === "updateDraft");
    const state = attachmentState({ draft: { revision: 2, text: "new task", acceptedEditSequence: update.editSequence, attachments: [{ ...staged, snapshotId: "latest" }] } });
    await h.receive(state); await h.receive(state);
    assert.equal(h.get("#attachment-preview").hidden, false);
    assert.equal(h.get("#attachment-preview-text").textContent, "old");
    assert.equal(h.sent.filter(m => m.type === "confirmFileAttachment").length, 0);
    assert.equal(h.get<HTMLButtonElement>('[data-attachment-action="confirm"]').disabled, false);
    await h.receive({ ...state, preparation: "preparing" });
    assert.equal(h.get<HTMLButtonElement>('[data-attachment-action="confirm"]').disabled, true);
    await h.receive(state); await h.click('[data-attachment-action="confirm"]');
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "confirmFileAttachment", draftRevision: 2, attachmentId: "a", snapshotId: "latest" });
    assert.equal(h.sent.filter(m => m.type === "sendChat").length, 0);
  } finally { await h.close(); }
});

test("selection UI names host intent, original positions and explicit old-snapshot confirmation without auto-send", async () => {
  const h = await uiHarness(false);
  try {
    await h.receive(attachmentState({ draft: { revision: 0, text: "task", acceptedEditSequence: 0, attachments: [] } })); await h.render();
    await h.click("#add-selection");
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "addSelectionAttachment", draftRevision: 0 });
    const selected = { ...attachment, kind: "selection" as const, originalRange: { start: { line: 1, character: 1 }, end: { line: 2, character: 4 } }, stale: false };
    await h.receive(attachmentState({ draft: { revision: 1, text: "task", acceptedEditSequence: 0, attachments: [selected] } }));
    assert.match(h.get("#attachment-entry").textContent ?? "", /selection.*original L2:2.*L3:5.*end exclusive/);
    assert.equal(h.get<HTMLButtonElement>("#add-selection").disabled, false, "one selection does not occupy the entire mixed-list capacity");
    await h.receive(attachmentState({ draft: { revision: 1, text: "task", acceptedEditSequence: 0, attachments: [{ ...selected, stale: true, state: "changed" }] } }));
    await h.click("#send-chat");
    await h.receive(attachmentState({ draft: { revision: 2, text: "task", acceptedEditSequence: 0, attachments: [{ ...selected, stale: true, state: "confirmation-required" }] }, result: { code: "source-changed" } }));
    assert.match(h.get("#attachment-status").textContent ?? "", /old snapshot/);
    assert.equal(h.get('[data-attachment-action="confirm"]').textContent, "Use old snapshot");
    await h.click('[data-attachment-action="confirm"]');
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "confirmSelectionAttachment", draftRevision: 2, attachmentId: "a", snapshotId: "s" });
    await h.receive(attachmentState({ draft: { revision: 3, text: "task", acceptedEditSequence: 0, attachments: [{ ...selected, stale: true }] } }));
    assert.match(h.get("#attachment-entry").textContent ?? "", /old snapshot/);
    assert.equal(h.sent.filter(m => m.type === "sendChat").length, 1);
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "task");
  } finally { await h.close(); }
});

test("a mixed list previews and mutates only the explicitly chosen attachment", async () => {
  const h = await uiHarness(false);
  const selected = { ...attachment, attachmentId: "selection", snapshotId: "selection-snapshot", kind: "selection" as const, originalRange: { start: { line: 0, character: 1 }, end: { line: 1, character: 2 } }, stale: true, state: "confirmation-required" as const };
  try {
    await h.receive(attachmentState({ draft: { revision: 4, text: "mixed task", acceptedEditSequence: 0, attachments: [attachment, selected] } })); await h.render();
    assert.equal(h.root.querySelectorAll("#attachment-entry [data-attachment-id]").length, 2);
    assert.equal(h.get<HTMLButtonElement>("#add-file").disabled, false); assert.equal(h.get<HTMLButtonElement>("#add-selection").disabled, false);
    assert.equal(h.get<HTMLButtonElement>("#send-chat").disabled, true);
    await h.click('[data-attachment-id="selection"] [data-attachment-action="preview"]');
    const preview = h.sent.at(-1); assert.ok(preview?.type === "getAttachmentPreview");
    assert.equal(preview.snapshotId, "selection-snapshot");
    await h.click('[data-attachment-id="selection"] [data-attachment-action="confirm"]');
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "confirmSelectionAttachment", draftRevision: 4, attachmentId: "selection", snapshotId: "selection-snapshot" });
    await h.click('[data-attachment-id="a"] [data-attachment-action="remove"]');
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "removeAttachment", draftRevision: 4, attachmentId: "a" });
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "mixed task");
    assert.equal(h.sent.some(m => m.type === "sendChat"), false);
  } finally { await h.close(); }
});
