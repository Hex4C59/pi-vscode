import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { attachmentState, uiHarness } from "./react-harness.js";
import type { AttachmentHistoryEntry } from "../../extension/webviewProtocol.js";

const envelope = { version: 2, generation: 1, viewId: "view" };
function entries(count: number): AttachmentHistoryEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    submissionId: `submission-${Math.floor(index / 20) + 1}`, snapshotId: `history-${index}`,
    relativePath: `src/context-${index}.ts`, utf8Bytes: 9, unsaved: true,
    ...(index % 2 ? { kind: "selection" as const, stale: true, originalRange: { start: { line: index, character: 0 }, end: { line: index, character: 9 } } } : { kind: "file" as const }),
    delivery: "rpc-accepted", outcome: "settled",
  }));
}

test("history starts at its latest bounded page and navigates every retained mixed snapshot without changing the draft", async () => {
  for (const count of [17, 33, 128]) {
    const h = await uiHarness(false);
    try {
      await h.receive(attachmentState({ historyCount: count, draft: { revision: 1, acceptedEditSequence: 0, text: "keep draft", attachments: [] } })); await h.render();
      await h.click("#attachment-history"); await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(count) });
      assert.equal(h.root.querySelectorAll("[data-submission-id]").length, (count - 1) % 16 + 1);
      assert.match(h.get("#history-page-status").textContent ?? "", new RegExp(`of ${count}`));
      assert.equal(h.get<HTMLButtonElement>("#history-latest").disabled, true);
      await h.click("#history-first"); assert.equal(h.root.querySelectorAll("[data-submission-id]").length, 16);
      assert.equal(h.get<HTMLButtonElement>("#history-previous").disabled, true);
      assert.ok(h.root.querySelector('[data-snapshot-id="history-0"]'));
      if (count > 32) {
        await h.click("#history-next"); assert.equal(h.root.querySelectorAll("[data-submission-id]").length, 16);
        assert.match(h.get("#attachment-history-list").textContent ?? "", /Submission 1.*continued/s);
        assert.match(h.get("#attachment-history-list").textContent ?? "", /Submission 2/);
      }
      await h.click("#history-latest"); assert.ok(h.root.querySelector(`[data-snapshot-id="history-${count - 1}"]`));
      assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "keep draft");
      assert.equal(h.sent.filter(m => m.type === "sendChat" || m.type === "updateDraft").length, 0);
    } finally { await h.close(); }
  }
});

test("changing pages or closing history discards its pending preview, but does not cancel a draft preview", async () => {
  for (const action of ["page", "close"] as const) {
    const h = await uiHarness();
    try {
      await h.click("#attachment-history"); await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(33) });
      await h.click('[data-snapshot-id="history-32"]');
      const request = h.sent.at(-1); assert.ok(request?.type === "getAttachmentPreview");
      if (action === "page") await h.click("#history-first"); else await h.click("#attachment-history");
      await h.receive({ ...envelope, type: "attachmentPreview", requestId: request.requestId, snapshotId: request.snapshotId, offset: 0, nextOffset: 9, done: true, text: "old reply" });
      assert.equal(h.get("#attachment-preview").hidden, true); assert.equal(h.get("#attachment-preview-text").textContent, "");
      if (action === "close") { await h.click("#attachment-history"); await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(33) }); }
      await h.receive(attachmentState({ historyCount: 33, draft: { revision: 2, acceptedEditSequence: 0, text: "", attachments: [{ attachmentId: "draft-item", snapshotId: "draft-snapshot", relativePath: "draft.ts", kind: "file", utf8Bytes: 9, unsaved: false, state: "attached" }] } }));
      await h.click('#attachment-entry [data-attachment-action="preview"]');
      const draftRequest = h.sent.at(-1); assert.ok(draftRequest?.type === "getAttachmentPreview");
      await h.click("#history-latest"); await h.click("#attachment-history");
      await h.receive({ ...envelope, type: "attachmentPreview", requestId: draftRequest.requestId, snapshotId: draftRequest.snapshotId, offset: 0, nextOffset: 9, done: true, text: "draft raw" });
      assert.equal(h.get("#attachment-preview-text").textContent, "draft raw");
      assert.equal(h.sent.filter(m => m.type === "sendChat").length, 0);
    } finally { await h.close(); }
  }
});

test("history page, focus and context scroll survive stream and metadata updates; reopening chooses latest and loss resets honestly", async () => {
  const h = await uiHarness(false);
  try {
    await h.receive(attachmentState({ historyCount: 33, draft: { revision: 1, text: "retained draft", acceptedEditSequence: 0, attachments: [] } })); await h.render();
    await h.click("#attachment-history"); assert.match(h.get("#history-page-status").textContent ?? "", /Loading/);
    await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(33) }); await h.click("#history-first");
    const input = h.get<HTMLTextAreaElement>("#chat-input"); input.focus(); const context = h.get("#composer-context"); context.scrollTop = 120;
    const firstPreviewButton = h.get('[data-snapshot-id="history-0"]');
    await h.render({ chatBusy: true, execution: "replying", messages: [{ role: "assistant", text: "stream delta" }] });
    await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(34).map(e => ({ ...e, outcome: "pending" })) });
    assert.match(h.get("#history-page-status").textContent ?? "", /Snapshots 1–16 of 34/);
    assert.equal(h.get('[data-snapshot-id="history-0"]'), firstPreviewButton); assert.equal(h.dom.window.document.activeElement, input);
    assert.equal(context.scrollTop, 120); assert.equal(input.value, "retained draft");
    await h.click("#attachment-history"); await h.click("#attachment-history");
    await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(34) });
    assert.match(h.get("#history-page-status").textContent ?? "", /Snapshots 33–34 of 34/);
    await h.receive(attachmentState({ historyCount: 0, result: { code: "runtime-lost" }, draft: { revision: 2, text: "retained draft", acceptedEditSequence: 0, attachments: [] } }));
    await h.receive({ ...envelope, type: "attachmentHistory", entries: [] });
    assert.equal(h.root.querySelectorAll("[data-submission-id]").length, 0); assert.match(h.get("#history-page-status").textContent ?? "", /No retained/);
    for (const id of ["history-first", "history-previous", "history-next", "history-latest"]) assert.equal(h.get<HTMLButtonElement>("#" + id).disabled, true);
    assert.equal(input.value, "retained draft"); assert.equal(h.sent.filter(m => m.type === "sendChat" || m.type === "updateDraft").length, 0);
  } finally { await h.close(); }
});

test("history exhaustion gives a concrete optional recovery action and names all lost state without resetting", async () => {
  const h = await uiHarness(false);
  try {
    await h.receive(attachmentState({ historyCount: 128, result: { code: "history-full" }, draft: { revision: 1, text: "unsent request", acceptedEditSequence: 0, attachments: [] } })); await h.render();
    const status = h.get("#attachment-status").textContent ?? "";
    assert.match(status, /Developer: Reload Window/); assert.match(status, /chat.*snapshots.*unsent draft.*lost/);
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "unsent request");
    assert.equal(h.sent.filter(m => !["ping", "getWorkspaceState"].includes(m.type)).length, 0);
  } finally { await h.close(); }
});

test("scrollable history preserves natural card and navigation height instead of flex-clipping controls", async () => {
  const h = await uiHarness();
  try {
    const style = h.dom.window.document.createElement("style"); style.textContent = readFileSync("src/webview/styles.css", "utf8"); h.dom.window.document.head.append(style);
    await h.click("#attachment-history"); await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(128) });
    for (const child of h.get("#attachment-history-list").children) assert.equal(h.dom.window.getComputedStyle(child).flexShrink, "0");
    // Browser geometry separately verifies complete cards and controls are scroll-reachable.
  } finally { await h.close(); }
});
