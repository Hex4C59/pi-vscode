import assert from "node:assert/strict";
import test from "node:test";
import type { ChangeReviewEntry, ChangeReviewStateMessage, WebviewMessage } from "../../extension/webviewProtocol.js";
import { parseHostMessage } from "../host-messages.js";
import { WebviewClient } from "../client.js";
import { attachmentState, uiHarness } from "./react-harness.js";

const envelope = { version: 2, generation: 1, viewId: "view" } as const;

function entry(index: number, patch: Partial<ChangeReviewEntry> = {}): ChangeReviewEntry {
  return {
    id: `review-${index}`,
    taskId: `task-${index}`,
    path: `src/file-${index}.ts`,
    source: "tool",
    tool: "write",
    status: "complete",
    diff: "ready",
    reason: null,
    sourceChanged: false,
    overlap: false,
    ...patch,
  };
}

function reviewState(patch: Partial<ChangeReviewStateMessage> = {}): ChangeReviewStateMessage {
  return {
    ...envelope,
    type: "changeReviewState",
    entries: [entry(1)],
    retainedBytes: 128,
    limited: false,
    reset: false,
    error: null,
    ...patch,
  };
}

function clientHarness() {
  const sent: WebviewMessage[] = [];
  let listener: ((value: unknown) => void) | undefined;
  const client = new WebviewClient({
    postMessage: message => { sent.push(message); },
    subscribe: next => { listener = next; return () => { listener = undefined; }; },
  });
  client.start();
  return { client, sent, receive: (value: unknown) => listener?.(value) };
}

test("change review parser accepts bounded metadata and rejects malformed host projections", () => {
  const valid = reviewState({
    entries: [
      entry(1),
      entry(2, { source: "observed", tool: null, status: "observed", diff: "unchanged", path: null }),
    ],
    retainedBytes: 8_388_608,
    limited: true,
    reset: true,
    error: "stale",
  });
  assert.deepEqual(parseHostMessage(valid), valid);

  assert.equal(parseHostMessage({ ...valid, extra: true }), undefined);
  assert.equal(parseHostMessage({ ...valid, retainedBytes: 8_388_609 }), undefined);
  assert.equal(parseHostMessage({ ...valid, error: "bad" }), undefined);
  assert.equal(parseHostMessage({ ...valid, entries: [entry(1), entry(1)] }), undefined);
  assert.equal(parseHostMessage({ ...valid, entries: Array.from({ length: 129 }, (_, index) => entry(index)) }), undefined);
  assert.equal(parseHostMessage({ ...valid, entries: [entry(1, { path: "😀".repeat(257) })] }), undefined);

  const sparse = new Array(2) as unknown[];
  sparse[1] = entry(1);
  assert.equal(parseHostMessage({ ...valid, entries: sparse }), undefined, "review entries must be dense own-data arrays");

  const customFields = [entry(1)] as unknown as (ChangeReviewEntry[] & { extra?: boolean });
  customFields.extra = true;
  assert.equal(parseHostMessage({ ...valid, entries: customFields }), undefined, "review arrays reject custom enumerable fields");

  const accessorEntry = { ...entry(1) };
  Object.defineProperty(accessorEntry, "path", {
    enumerable: true,
    get() { throw new Error("path accessor must not run"); },
  });
  assert.equal(parseHostMessage({ ...valid, entries: [accessorEntry] }), undefined, "review entries reject accessors");
});

test("client reconciles only the current review identity and sends opaque review intents", () => {
  const h = clientHarness();
  try {
    h.receive(reviewState());
    assert.deepEqual(h.client.getSnapshot().changeReview, reviewState());

    h.receive({ ...reviewState(), generation: 0 });
    h.receive({ ...reviewState(), viewId: "other" });
    assert.deepEqual(h.client.getSnapshot().changeReview, reviewState());

    h.client.toggleChangeReview();
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "getChangeReview" });
    h.client.openReviewDiff("review-1");
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "openReviewDiff", id: "review-1" });
    h.client.openReviewSource("review-1");
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "openReviewSource", id: "review-1" });

    const sentCount = h.sent.length;
    h.client.openReviewDiff("unknown");
    h.client.openReviewSource("unknown");
    h.receive(reviewState({ entries: [entry(1, { path: null, diff: "unavailable" })] }));
    h.client.openReviewDiff("review-1");
    h.client.openReviewSource("review-1");
    assert.equal(h.sent.length, sentCount, "unknown or unavailable review actions must not cross the bridge");
  } finally {
    h.client.dispose();
  }
});

test("mounted change review panel is expandable, paged, explanatory, and stable across updates", async () => {
  const h = await uiHarness(false);
  const entries = [
    entry(1),
    entry(2, { path: null, source: "observed", tool: null, status: "observed", diff: "unchanged", overlap: true, sourceChanged: true }),
    entry(3, { status: "failed", diff: "unavailable", reason: "changed-during-capture" }),
    ...Array.from({ length: 14 }, (_, index) => entry(index + 4)),
  ];
  try {
    await h.receive(attachmentState());
    await h.render();
    await h.click("#change-review-toggle");
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "getChangeReview" });

    await h.receive(reviewState({ entries, retainedBytes: 4096, limited: true, reset: true, error: "stale" }));
    const panel = h.get("#change-review-panel");
    assert.match(panel.textContent ?? "", /Already-applied review/);
    assert.match(panel.textContent ?? "", /not patch approval/i);
    assert.match(panel.textContent ?? "", /capacity/i);
    assert.match(panel.textContent ?? "", /reset/i);
    assert.equal(h.root.querySelector("#change-review-reset-notice"), null, "ready review panel owns its reset notice");
    assert.match(panel.textContent ?? "", /stale/i);
    assert.equal(panel.querySelectorAll("[data-review-entry-id]").length, 16);
    assert.match(panel.textContent ?? "", /Tool-reported/);
    assert.match(panel.textContent ?? "", /Observed workspace change/);
    assert.match(panel.textContent ?? "", /failed/i);
    assert.match(panel.textContent ?? "", /Text difference/i);
    assert.match(panel.textContent ?? "", /Concurrent changes overlapped/);
    assert.match(panel.textContent ?? "", /Source changed after capture/);

    await h.click("#change-review-next");
    assert.match(h.get("#change-review-page-status").textContent ?? "", /Page 2 of 2/);
    const focused = h.get<HTMLButtonElement>('[data-review-entry-id="review-17"] [data-review-action="diff"]');
    focused.focus();
    await h.receive(reviewState({ entries, retainedBytes: 4097 }));
    assert.equal(h.dom.window.document.activeElement, focused, "metadata updates must preserve the focused action");
    assert.match(h.get("#change-review-page-status").textContent ?? "", /Page 2 of 2/);

    await h.click("#change-review-previous");
    await h.click('[data-review-entry-id="review-1"] [data-review-action="diff"]');
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "openReviewDiff", id: "review-1" });
    await h.click('[data-review-entry-id="review-1"] [data-review-action="source"]');
    assert.deepEqual(h.sent.at(-1), { ...envelope, type: "openReviewSource", id: "review-1" });
    assert.equal(h.root.querySelector('[data-review-entry-id="review-2"] [data-review-action="source"]'), null, "null paths have no source capability");
  } finally {
    await h.close();
  }
});
test("runtime-disconnected state exposes the review reset notice without enabling the review panel", async () => {
  const h = await uiHarness(false);
  try {
    await h.receive(attachmentState());
    await h.render({ runtime: "error", runtimeDetail: "Runtime disconnected" });
    await h.receive(reviewState({ entries: [], reset: true }));
    const notice = h.get("#change-review-reset-notice");
    assert.match(notice.textContent ?? "", /Captured change reviews were cleared/i);
    assert.match(notice.textContent ?? "", /No previous review data is available/i);
    assert.equal(notice.getAttribute("role"), "status");
    assert.equal(h.root.querySelector("#change-review-panel"), null, "the unavailable runtime must not expose review actions");
  } finally {
    await h.close();
  }
});