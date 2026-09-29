import assert from "node:assert/strict";
import test from "node:test";
import { createRpcReplies } from "../rpc-replies.js";

test("replies resolve out of order and ignore unknown or duplicate ids", async () => {
  const replies = createRpcReplies();
  const first = replies.wait("one", 30_000);
  const second = replies.wait("two", 30_000);
  assert.equal(replies.receive({ type: "response", id: "missing", success: true }), false);
  assert.equal(replies.receive({ type: "response", id: "two", success: true, command: "b" }), true);
  assert.equal(replies.receive({ type: "response", id: "two", success: false, command: "b" }), false);
  assert.deepEqual(await second, { type: "response", id: "two", success: true, command: "b" });
  assert.equal(replies.receive({ type: "response", id: "one", success: true, command: "a" }), true);
  assert.deepEqual(await first, { type: "response", id: "one", success: true, command: "a" });
});

test("an unmatched wait times out without resolving later replies", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const replies = createRpcReplies();
  const waiting = replies.wait("late", 1_000);
  context.mock.timers.tick(999);
  let settled = false;
  void waiting.then(() => { settled = true; }, () => { settled = true; });
  await Promise.resolve();
  assert.equal(settled, false);
  context.mock.timers.tick(1);
  await assert.rejects(waiting, /Timed out waiting for RPC response/);
  assert.equal(replies.receive({ type: "response", id: "late", success: true }), false);
});

test("pauseable remaining budget resumes only after the last hold", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let now = 0;
  context.mock.method(performance, "now", () => now);
  const replies = createRpcReplies();
  let holds = 0;
  const waiting = replies.wait("startup", 15_000, { pauseable: true, outstanding: () => holds });
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
  await assert.rejects(waiting, /Timed out waiting for RPC response/);
});

test("failAll settles waiters without treating a later id as the same request", async () => {
  const replies = createRpcReplies();
  const waiting = replies.wait("old", 30_000);
  replies.failAll();
  assert.deepEqual(await waiting, { success: false });
  const next = replies.wait("new", 30_000);
  assert.equal(replies.receive({ type: "response", id: "old", success: true }), false);
  assert.equal(replies.receive({ type: "response", id: "new", success: true }), true);
  assert.deepEqual(await next, { type: "response", id: "new", success: true });
});

test("drop forgets a watcher so a late response cannot complete it", () => {
  const replies = createRpcReplies();
  let received = false;
  replies.watch("prompt-1", () => { received = true; });
  replies.drop("prompt-1");
  assert.equal(replies.receive({ type: "response", id: "prompt-1", success: true }), false);
  assert.equal(received, false);
});

test("startup ids do not consume the rpc/prompt counter", () => {
  const replies = createRpcReplies();
  assert.equal(replies.startupId(3), "pi-vscode-get-state-3");
  assert.equal(replies.rpcId(4), "pi-vscode-rpc-4-1");
  assert.equal(replies.promptId(4), "pi-vscode-prompt-4-2");
  assert.equal(replies.exhausted(), false);
});
