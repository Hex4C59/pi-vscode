import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import { compactionFixture } from "./compaction-harness.js";
const turn = async () => { await new Promise<void>(resolve => setImmediate(resolve)); };

// Pre-code failures: compact aborts existing task; premature settlement; lost Stop order;
// requested cancel mistaken for aborted; duplicate/lost response replay; leaking summary.
test("public compact holds task occupancy through response and preserves literal instructions", async () => {
  const f = compactionFixture();
  try {
    assert.equal((await f.start()).ok, true);
    assert.ok(f.runtime.compactContext);
    const pending = f.runtime.compactContext("  preserve literal 中\nnext  ", f.runtime.getSession());
    await turn();
    assert.equal(f.requests.at(-1)?.customInstructions, "  preserve literal 中\nnext  ");
    assert.equal((await f.runtime.setModel("fixture", "one")).ok, false);
    assert.equal((await f.runtime.preparePrompt({ kind: "plain", body: "must not send" }, f.runtime.getSession()).send(() => {})).delivery, "not-sent");
    f.frame({ type: "agent_settled" });
    assert.equal((await f.runtime.setThinkingLevel("off")).ok, false);
    f.complete();
    assert.deepEqual(await pending, { outcome: "completed", agentRunning: false });
    assert.equal((await f.runtime.setThinkingLevel("off")).ok, true);
    await mkdir("dist/goal-eight/wi083", { recursive: true });
    await writeFile("dist/goal-eight/wi083/adapter-composition.json", JSON.stringify({ evidence: "real adapter, substituted byte transport", commands: f.requests.map(r => r.type), summaryProjected: false, limitations: ["not actual pi or native host"] }, null, 2));
  } finally { await f.runtime.stop(); }
});

test("Stop clears queues before abort and waits for actual compact cancellation", async () => {
  const f = compactionFixture();
  try {
    await f.start(); assert.ok(f.runtime.compactContext);
    const pending = f.runtime.compactContext(undefined, f.runtime.getSession()); await turn();
    f.onAbort(() => f.complete(false, true));
    assert.equal((await f.runtime.abortTask?.())?.ok, true);
    assert.deepEqual(await pending, { outcome: "cancelled", agentRunning: false });
    const types = f.requests.map(r => r.type);
    assert.ok(types.indexOf("clear_queue") < types.indexOf("abort"));
    assert.equal(types.filter(type => type === "compact").length, 1);
  } finally { await f.runtime.stop(); }
});

test("compaction failure, stale identity and continuation never fake success or idle", async () => {
  const f = compactionFixture();
  try {
    await f.start(); assert.ok(f.runtime.compactContext);
    assert.equal((await f.runtime.compactContext("x", f.runtime.getSession() + 1)).outcome, "unavailable");
    assert.equal((await f.runtime.compactContext("中".repeat(1500), f.runtime.getSession())).outcome, "unavailable");
    const failed = f.runtime.compactContext(undefined, f.runtime.getSession()); await turn(); f.complete(false);
    assert.equal((await failed).outcome, "failed");
    const continued = f.runtime.compactContext(undefined, f.runtime.getSession()); await turn();
    f.frame({ type: "agent_start" }); f.complete();
    assert.deepEqual(await continued, { outcome: "completed", agentRunning: true });
    assert.equal((await f.runtime.setModel("fixture", "one")).ok, false);
    f.frame({ type: "agent_settled" });
    const lost = f.runtime.compactContext(undefined, f.runtime.getSession()); await turn(); f.lose();
    assert.equal((await lost).outcome, "failed");
    assert.equal(f.requests.filter(r => r.type === "compact").length, 3);
  } finally { await f.runtime.stop(); }
});
