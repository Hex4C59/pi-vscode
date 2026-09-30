import assert from "node:assert/strict";
import test from "node:test";
import { createRpcReplies } from "../rpc-replies.js";

test("replies resolve out of order and ignore unknown or duplicate ids", async () => {
  const replies = createRpcReplies();
  const first = replies.wait("one", "a", 30_000);
  const second = replies.wait("two", "b", 30_000);
  assert.equal(replies.receive({ type: "response", id: "missing", success: true }), "ignored");
  assert.equal(replies.receive({ type: "response", id: "two", success: true, command: "b" }), "received");
  assert.equal(replies.receive({ type: "response", id: "two", success: false, command: "b" }), "ignored");
  assert.deepEqual(await second, { kind: "response", response: { type: "response", id: "two", success: true, command: "b" } });
  assert.equal(replies.receive({ type: "response", id: "one", success: true, command: "a" }), "received");
  assert.deepEqual(await first, { kind: "response", response: { type: "response", id: "one", success: true, command: "a" } });
});

test("an unmatched wait times out without resolving later replies", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const replies = createRpcReplies();
  const waiting = replies.wait("late", "prompt", 1_000);
  context.mock.timers.tick(999);
  let settled = false;
  void waiting.then(() => { settled = true; }, () => { settled = true; });
  await Promise.resolve();
  assert.equal(settled, false);
  context.mock.timers.tick(1);
  assert.deepEqual(await waiting, { kind: "failure", reason: "timeout" });
  assert.equal(replies.receive({ type: "response", id: "late", success: true }), "ignored");
});

test("pauseable remaining budget resumes only after the last hold", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let now = 0;
  context.mock.method(performance, "now", () => now);
  const replies = createRpcReplies();
  let holds = 0;
  const waiting = replies.wait("startup", "get_state", 15_000, { pauseable: true, outstanding: () => holds });
  now = 5_000;
  holds = 1;
  replies.pauseRemaining();
  holds = 2;
  replies.pauseRemaining();
  now = 60_000;
  context.mock.timers.tick(60_000);
  let settled = false;
  void waiting.then(() => { settled = true; }, () => { settled = true; });
  await Promise.resolve();
  assert.equal(settled, false);
  holds = 1;
  replies.resumeRemaining(holds);
  context.mock.timers.tick(10_000);
  await Promise.resolve();
  assert.equal(settled, false);
  holds = 0;
  replies.resumeRemaining(holds);
  now = 70_000;
  context.mock.timers.tick(9_999);
  await Promise.resolve();
  assert.equal(settled, false);
  context.mock.timers.tick(1);
  assert.deepEqual(await waiting, { kind: "failure", reason: "timeout" });
});

test("failAll settles waiters without treating a later id as the same request", async () => {
  const replies = createRpcReplies();
  const waiting = replies.wait("old", "prompt", 30_000);
  replies.failAll();
  assert.deepEqual(await waiting, { kind: "failure", reason: "disconnected" });
  const next = replies.wait("new", "prompt", 30_000);
  assert.equal(replies.receive({ type: "response", id: "old", success: true }), "ignored");
  assert.equal(replies.receive({ type: "response", id: "new", command: "prompt", success: true }), "received");
  assert.deepEqual(await next, { kind: "response", response: { type: "response", id: "new", command: "prompt", success: true } });
});

test("drop forgets a watcher so a late response cannot complete it", () => {
  const replies = createRpcReplies();
  let received = false;
  replies.watch("prompt-1", "prompt", () => { received = true; });
  replies.drop("prompt-1");
  assert.equal(replies.receive({ type: "response", id: "prompt-1", success: true }), "ignored");
  assert.equal(received, false);
});

test("startup ids do not consume the rpc/prompt counter", () => {
  const replies = createRpcReplies();
  assert.equal(replies.startupId(3), "pi-vscode-get-state-3");
  assert.equal(replies.rpcId(4), "pi-vscode-rpc-4-1");
  assert.equal(replies.promptId(4), "pi-vscode-prompt-4-2");
  assert.equal(replies.exhausted(), false);
});

for (const fields of [{ command: "wrong" }, { command: undefined }, { success: "true" }, { success: null }, { success: 0 }, { success: undefined }]) {
  test(`a matched malformed reply completes once as a local failure: ${JSON.stringify(fields)}`, async context => {
    context.mock.timers.enable({ apis: ["setTimeout"] });
    const replies = createRpcReplies();
    const pending = replies.wait("state", "get_state", 1000);
    assert.equal(replies.receive({ type: "response", id: "state", command: "get_state", success: true, ...fields }), "protocol-error");
    assert.deepEqual(await pending, { kind: "failure", reason: "protocol-error" });
    context.mock.timers.tick(1000);
    assert.equal(replies.receive({ type: "response", id: "state", command: "get_state", success: true }), "ignored");
  });
}

test("a watcher distinguishes remote rejection from disconnect and consumes before reentrant cleanup", () => {
  const replies = createRpcReplies();
  const results: unknown[] = [];
  replies.watch("one", "prompt", result => {
    results.push(result);
    replies.failAll();
  });
  replies.watch("two", "prompt", result => { results.push(result); });
  const response = { type: "response", id: "one", command: "prompt", success: false, error: "rejected" };
  assert.equal(replies.receive(response), "received");
  assert.deepEqual(results, [{ kind: "response", response }, { kind: "failure", reason: "disconnected" }]);
  assert.equal(replies.receive(response), "ignored");
});

test("failure clears a paused deadline and watchers exactly once without contaminating a new wait", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const replies = createRpcReplies();
  const waiting = replies.wait("old", "get_state", 1000, { pauseable: true, outstanding: () => 1 });
  const failures: unknown[] = [];
  replies.watch("prompt", "prompt", result => { failures.push(result); });
  replies.failAll("protocol-error"); replies.failAll();
  assert.deepEqual(await waiting, { kind: "failure", reason: "protocol-error" });
  assert.deepEqual(failures, [{ kind: "failure", reason: "protocol-error" }]);
  const next = replies.wait("new", "get_state", 2000);
  replies.resumeRemaining(0);
  context.mock.timers.tick(1000);
  assert.equal(replies.receive({ type: "response", id: "old", command: "get_state", success: true }), "ignored");
  assert.equal(replies.receive({ type: "response", id: "new", command: "get_state", success: true }), "received");
  assert.equal((await next).kind, "response");
});
