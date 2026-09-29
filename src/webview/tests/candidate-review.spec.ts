import assert from "node:assert/strict";
import test from "node:test";
import type { ChangeReviewEntry, ChangeReviewStateMessage } from "../../extension/contracts/webviewProtocol.js";
import { uiHarness } from "./react-harness.js";

const envelope = { version: 3, generation: 1, viewId: "view" } as const;

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
    entries: [
      entry(1),
      entry(2, { path: null, source: "observed", tool: null, status: "observed", diff: "unavailable", reason: "no-before-snapshot" }),
      entry(3, { status: "failed", diff: "unavailable", reason: "unavailable" }),
    ],
    retainedBytes: 128,
    limited: false,
    reset: false,
    error: null,
    ...patch,
  };
}

test("candidate reveals a compact change-review entry only when review data exists", async () => {
  const h = await uiHarness(true, true);
  try {
    assert.equal(h.root.querySelector("[data-candidate-review]") === null, true);

    await h.receive(reviewState());

    const review = h.get("[data-candidate-review]");
    assert.match(review.textContent ?? "", /Review changes/);
    assert.equal(review.querySelector(".candidate-review__summary") === null, true, "collapsed review stays a single compact entry");

    await h.click("#change-review-toggle");
    const summary = h.get(".candidate-review__summary");
    assert.match(summary.textContent ?? "", /1 captured/);
    assert.match(summary.textContent ?? "", /2 reported/);
    assert.match(summary.textContent ?? "", /1 observed/);
    assert.match(summary.textContent ?? "", /2 unavailable/);

    await h.receive(reviewState({ entries: [] }));
    assert.equal(h.root.querySelector("[data-candidate-review]") === null, true);
  } finally {
    await h.close();
  }
});

test("candidate expands, pages, and opens only opaque review intents without changing the draft", async () => {
  const h = await uiHarness(true, true);
  const entries = Array.from({ length: 17 }, (_, index) => entry(index + 1));
  try {
    await h.receive(reviewState({ entries }));
    await h.input("Keep this draft while reviewing", 'textarea[aria-label="Message"]');
    await h.click("#change-review-toggle");

    assert.match(h.get("[data-candidate-review]").textContent ?? "", /Preview only: diff and source opening are simulated/);
    assert.equal(h.get<HTMLTextAreaElement>('textarea[aria-label="Message"]').value, "Keep this draft while reviewing");
    await h.click("#change-review-next");
    assert.match(h.get("#change-review-page-status").textContent ?? "", /Page 2 of 2/);
    assert.equal(h.get('[data-review-entry-id="review-17"] .change-review__path').getAttribute("title"), "src/file-17.ts");

    await h.click("#change-review-toggle");
    await h.click("#change-review-toggle");
    assert.match(h.get("#change-review-page-status").textContent ?? "", /Page 2 of 2/);
    assert.equal(h.get<HTMLTextAreaElement>('textarea[aria-label="Message"]').value, "Keep this draft while reviewing");

    await h.click('[data-review-entry-id="review-17"] [data-review-action="diff"]');
    assert.deepEqual(h.sent.at(-1), { version: 3, type: "openReviewDiff", viewId: "view", generation: 1, id: "review-17" });
    await h.click('[data-review-entry-id="review-17"] [data-review-action="source"]');
    assert.deepEqual(h.sent.at(-1), { version: 3, type: "openReviewSource", viewId: "view", generation: 1, id: "review-17" });
  } finally {
    await h.close();
  }
});

test("the review toggle carries the shared Lucide chevron instead of literal arrows", async () => {
  const h = await uiHarness(true, true);
  try {
    await h.receive(reviewState());
    const toggle = h.get("#change-review-toggle");
    const chevron = toggle.querySelector("svg.change-review__chevron");
    assert.ok(chevron, "the toggle uses the chevron icon");
    assert.equal(chevron.getAttribute("aria-hidden"), "true");
    assert.doesNotMatch(toggle.textContent ?? "", /[▾▸]/, "no text arrows remain");
    await h.click("#change-review-toggle");
    assert.equal(toggle.getAttribute("aria-expanded"), "true");
    assert.ok(toggle.querySelector("svg.change-review__chevron"), "the icon survives expansion");
  } finally {
    await h.close();
  }
});
