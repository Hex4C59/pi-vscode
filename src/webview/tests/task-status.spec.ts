import assert from "node:assert/strict";
import test from "node:test";
import { uiHarness } from "./react-harness.js";

/** The status line distinguishes in-progress, waiting and terminal states by marker and text, not color alone. */
test("task status maps execution states to glance categories with distinct markers", async () => {
  const h = await uiHarness(true, true);
  try {
    assert.equal(h.root.querySelector(".candidate__progress"), null, "idle renders no status line");

    await h.render({ chatBusy: true, execution: "replying" });
    let status = h.get(".candidate__progress");
    assert.equal(status.getAttribute("role"), "status");
    assert.equal(status.getAttribute("data-state"), "active");
    assert.match(status.textContent ?? "", /Replying…/);
    assert.ok(status.querySelector(".candidate__pulse"), "in-progress keeps the pulse dot");
    assert.equal(status.querySelector(".candidate__status-icon"), null);

    await h.render({ chatBusy: true, execution: "awaiting-approval" });
    status = h.get(".candidate__progress");
    assert.equal(status.getAttribute("data-state"), "waiting");
    assert.match(status.textContent ?? "", /Waiting for approval…/);
    assert.equal(status.querySelector(".candidate__pulse"), null, "waiting is not pulsing work");
    assert.ok(status.querySelector(".candidate__status-icon"), "waiting carries its own marker");

    await h.render({ chatBusy: false, execution: "completed" });
    assert.equal(h.get(".candidate__progress").getAttribute("data-state"), "completed");
    assert.match(h.get(".candidate__progress").textContent ?? "", /Task completed/);

    await h.render({ chatBusy: false, execution: "stopped" });
    status = h.get(".candidate__progress");
    assert.equal(status.getAttribute("data-state"), "stopped");
    assert.match(status.textContent ?? "", /Task stopped · Side effects are not rolled back\./);

    await h.render({ chatBusy: false, execution: "failed" });
    status = h.get(".candidate__progress");
    assert.equal(status.getAttribute("data-state"), "failed");
    assert.match(status.textContent ?? "", /Task failed/);
    assert.ok(status.querySelector(".candidate__status-icon"));
  } finally { await h.close(); }
});

test("stopping wins over the underlying execution state and idle stays silent", async () => {
  const h = await uiHarness(true, true);
  try {
    await h.render({ chatBusy: true, execution: "stopping" });
    const status = h.get(".candidate__progress");
    assert.equal(status.getAttribute("data-state"), "active");
    assert.match(status.textContent ?? "", /Stopping…/);

    await h.render({ chatBusy: false, execution: "idle" });
    assert.equal(h.root.querySelector(".candidate__progress"), null);
  } finally { await h.close(); }
});

test("status updates in place so streaming transitions never replay entrance motion", async () => {
  const h = await uiHarness(true, true);
  try {
    await h.render({ chatBusy: true, execution: "thinking" });
    const before = h.get(".candidate__progress");
    await h.render({ chatBusy: true, execution: "replying" });
    await h.render({ chatBusy: true, execution: "executing" });
    assert.equal(h.get(".candidate__progress"), before, "the same node updates; no re-mount restarts the pulse");
    assert.equal(h.root.querySelectorAll(".candidate__progress").length, 1);
  } finally { await h.close(); }
});
