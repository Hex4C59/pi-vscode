import assert from "node:assert/strict";
import test from "node:test";
import { attachmentState, uiHarness } from "./react-harness.js";
import type { AttachmentHistoryEntry } from "../../extension/contracts/webviewProtocol.js";

const envelope = { version: 3, generation: 1, viewId: "view" };
const message = 'textarea[aria-label="Message"]';
const historyTrigger = 'button.candidate-context__history-trigger[aria-label="Attachment history"]';
const historySection = 'section[aria-label="Retained attachment history"]';
const previewSection = 'section[aria-label="Attachment preview"]';
const previewText = 'pre[aria-label="Literal attachment text"]';
const previewBtn = 'button[aria-label="Preview complete snapshot"]';
const firstPage = 'button[aria-label="First page"]';
const previousPage = 'button[aria-label="Previous page"]';
const nextPage = 'button[aria-label="Next page"]';
const latestPage = 'button[aria-label="Latest page"]';
const draft = ".candidate-context__draft";

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
      await h.click(historyTrigger); await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(count) });
      const latestVisible = (count - 1) % 16 + 1;
      assert.equal(h.get(historySection).querySelectorAll("li").length, latestVisible);
      assert.match(h.get(historySection).textContent ?? "", new RegExp(`of ${count}`));
      assert.equal(h.get<HTMLButtonElement>(latestPage).disabled, true);
      await h.click(firstPage); assert.equal(h.get(historySection).querySelectorAll("li").length, 16);
      assert.equal(h.get<HTMLButtonElement>(previousPage).disabled, true);
      assert.match(h.get(historySection).textContent ?? "", /src\/context-0\.ts/);
      if (count > 32) {
        await h.click(nextPage); assert.equal(h.get(historySection).querySelectorAll("li").length, 16);
        assert.match(h.get(historySection).textContent ?? "", /src\/context-16\.ts/);
      }
      await h.click(latestPage); assert.match(h.get(historySection).textContent ?? "", new RegExp(`src/context-${count - 1}\\.ts`));
      assert.equal(h.get<HTMLTextAreaElement>(message).value, "keep draft");
      assert.equal(h.sent.filter(m => m.type === "sendChat" || m.type === "updateDraft").length, 0);
    } finally { await h.close(); }
  }
});

test("changing pages or closing history discards its pending preview, but does not cancel a draft preview", async () => {
  for (const action of ["page", "close"] as const) {
    const h = await uiHarness();
    try {
      await h.receive(attachmentState({ historyCount: 33 }));
      await h.click(historyTrigger); await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(33) });
      await h.click(`${historySection} li:last-child ${previewBtn}`);
      const request = h.sent.at(-1); assert.ok(request?.type === "getAttachmentPreview");
      if (action === "page") await h.click(firstPage); else await h.click(historyTrigger);
      await h.receive({ ...envelope, type: "attachmentPreview", requestId: request.requestId, snapshotId: request.snapshotId, offset: 0, nextOffset: 9, done: true, text: "old reply" });
      assert.equal(h.root.querySelector(previewSection) === null, true);
      if (action === "close") { await h.click(historyTrigger); await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(33) }); }
      await h.receive(attachmentState({ historyCount: 33, draft: { revision: 2, acceptedEditSequence: 0, text: "", attachments: [{ attachmentId: "draft-item", snapshotId: "draft-snapshot", relativePath: "draft.ts", kind: "file", utf8Bytes: 9, unsaved: false, state: "attached" }] } }));
      await h.click(`${draft} ${previewBtn}`);
      const draftRequest = h.sent.at(-1); assert.ok(draftRequest?.type === "getAttachmentPreview");
      if (h.root.querySelector(historySection)) {
        await h.click(latestPage);
        await h.click(historyTrigger);
      } else {
        await h.click(historyTrigger);
        await h.click(historyTrigger);
      }
      await h.receive({ ...envelope, type: "attachmentPreview", requestId: draftRequest.requestId, snapshotId: draftRequest.snapshotId, offset: 0, nextOffset: 9, done: true, text: "draft raw" });
      assert.equal(h.get(previewText).textContent, "draft raw");
      assert.equal(h.sent.filter(m => m.type === "sendChat").length, 0);
    } finally { await h.close(); }
  }
});

test("history page and focus survive stream and metadata updates; reopening chooses latest and loss resets honestly (fixture scroll sibling retired)", async () => {
  const h = await uiHarness(false);
  try {
    await h.receive(attachmentState({ historyCount: 33, draft: { revision: 1, text: "retained draft", acceptedEditSequence: 0, attachments: [] } })); await h.render();
    await h.click(historyTrigger); assert.match(h.get(historySection).textContent ?? "", /Loading/);
    await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(33) }); await h.click(firstPage);
    const input = h.get<HTMLTextAreaElement>(message); input.focus();
    const firstPath = h.get(historySection).querySelector("li summary span")?.textContent;
    await h.render({ chatBusy: true, execution: "replying", messages: [{ role: "assistant", text: "stream delta" }] });
    await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(34).map(e => ({ ...e, outcome: "pending" })) });
    assert.match(h.get(historySection).textContent ?? "", /Snapshots 1–16 of 34/);
    // Outcome labels may refresh; the retained relative path stays on the first row.
    assert.equal(h.get(historySection).querySelector("li summary span")?.textContent, firstPath);
    assert.equal(h.dom.window.document.activeElement === input, true);
    assert.equal(input.value, "retained draft");
    await h.click(historyTrigger); await h.click(historyTrigger);
    await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(34) });
    assert.match(h.get(historySection).textContent ?? "", /Snapshots 33–34 of 34/);
    await h.receive(attachmentState({ historyCount: 0, result: { code: "runtime-lost" }, draft: { revision: 2, text: "retained draft", acceptedEditSequence: 0, attachments: [] } }));
    await h.receive({ ...envelope, type: "attachmentHistory", entries: [] });
    // Production drops the history trigger when count is 0; an already-open reader can remain until dismissed.
    assert.equal(h.root.querySelector(historyTrigger) === null, true);
    assert.match(h.get(historySection).textContent ?? "", /No retained/);
    assert.match(h.get(".candidate-context__status").textContent ?? "", /runtime|cleared|reattach/i);
    assert.equal(input.value, "retained draft"); assert.equal(h.sent.filter(m => m.type === "sendChat" || m.type === "updateDraft").length, 0);
  } finally { await h.close(); }
});

test("history exhaustion names capacity without resetting the draft (fixture Developer Reload copy retired)", async () => {
  const h = await uiHarness(false);
  try {
    await h.receive(attachmentState({ historyCount: 128, result: { code: "history-full" }, draft: { revision: 1, text: "unsent request", acceptedEditSequence: 0, attachments: [] } })); await h.render();
    const status = h.get(".candidate-context__status").textContent ?? "";
    assert.match(status, /full|128/i);
    assert.equal(h.get<HTMLTextAreaElement>(message).value, "unsent request");
    assert.equal(h.sent.filter(m => !["ping", "getWorkspaceState"].includes(m.type)).length, 0);
  } finally { await h.close(); }
});

test("attachment history list fixture flex-shrink assertion retired", async () => {
  const h = await uiHarness();
  try {
    await h.receive(attachmentState({ historyCount: 128 }));
    await h.click(historyTrigger); await h.receive({ ...envelope, type: "attachmentHistory", entries: entries(128) });
    assert.ok(h.get(historySection).querySelectorAll("li").length > 0);
    assert.match(h.get(historySection).textContent ?? "", /Snapshots/);
  } finally { await h.close(); }
});
