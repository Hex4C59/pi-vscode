import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { createRecoveryObserver, createRecoveryStore, createRuntimeOwner } from "../index.js";
import { runtimeControlPath } from "../control-protocol.js";
import type { RecoveryFence, RetainedRunState } from "../types.js";

type Action = "observe" | "end";
async function fixture(t: TestContext) {
  const root = path.resolve("dist/tests-fixtures/runtime-handoff");
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, "run-"));
  const servers: ReturnType<typeof createServer>[] = [];
  t.after(async () => {
    for (const server of servers) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    assert.equal(path.dirname(path.resolve(directory)), root);
    await rm(directory, { recursive: true, force: true });
  });
  const store = createRecoveryStore(directory);
  const owner = createRuntimeOwner({ directory, workerPath: path.join(directory, "unused.mjs") }, { endMs: 100, receiptMs: 100 });
  const reserve = async () => {
    const result = await store.reserve();
    if (!result.ok) assert.fail("fixture reservation failed");
    return result.fence;
  };
  const control = async (fence: RecoveryFence, state: RetainedRunState, onRequest?: (action: Action) => Promise<void>, response?: object) => {
    const actions: Action[] = [];
    const server = createServer(socket => {
      let input = "";
      let handled = false;
      socket.on("error", () => undefined);
      socket.on("data", chunk => {
        input += chunk.toString();
        if (handled || !input.includes("\n")) return;
        handled = true;
        const request: unknown = JSON.parse(input.slice(0, input.indexOf("\n")));
        if (!request || typeof request !== "object" || !("action" in request) || (request.action !== "observe" && request.action !== "end")) {
          socket.destroy(); return;
        }
        const action = request.action;
        actions.push(action);
        void (async () => {
          await onRequest?.(action);
          socket.end(JSON.stringify(response ?? { version: 1, runId: fence.runId, state, endRequested: action === "end" }) + "\n");
        })().catch(() => socket.destroy());
      });
    });
    await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(runtimeControlPath(directory, fence.runId), resolve); });
    servers.push(server);
    return actions;
  };
  return { directory, store, owner, reserve, control };
}

test("startup handoff ends only an owner-lost run and retires its exact receipt", async t => {
  const f = await fixture(t); const fence = await f.reserve();
  const actions = await f.control(fence, "owner-lost", async action => {
    if (action === "end") await createRecoveryObserver(f.directory, fence).recordExit(null, "SIGTERM");
  });
  assert.deepEqual(await f.owner.handoff(), { ok: true, outcome: "retired" });
  assert.deepEqual(actions, ["observe", "end"]);
  assert.deepEqual(await f.owner.inspect(), { kind: "empty" });
  assert.deepEqual(await f.owner.handoff(), { ok: true, outcome: "none" });
});

test("startup handoff observes a live owner without ending or retiring it", async t => {
  const f = await fixture(t); const fence = await f.reserve();
  const actions = await f.control(fence, "owned");
  assert.deepEqual(await f.owner.handoff(), { ok: true, outcome: "live-owner" });
  assert.deepEqual(actions, ["observe"]);
  const retained = await f.owner.inspect();
  assert.equal(retained.kind, "pending");
  if (retained.kind === "pending") assert.deepEqual(retained.fence, fence);
});

for (const state of ["exited", "never-spawned"] as const) test(`startup handoff waits for the ${state} receipt without an end request`, async t => {
  const f = await fixture(t); const fence = await f.reserve();
  const actions = await f.control(fence, state, async () => {
    const observer = createRecoveryObserver(f.directory, fence);
    if (state === "exited") await observer.recordExit(0, null);
    else await observer.recordNeverSpawned();
  });
  assert.deepEqual(await f.owner.handoff(), { ok: true, outcome: "retired" });
  assert.deepEqual(actions, ["observe"]);
  assert.deepEqual(await f.owner.inspect(), { kind: "empty" });
});

for (const state of ["owner-lost", "exited", "never-spawned", "termination-unconfirmed"] as const) test(`startup ${state} without exit evidence never retires a fence`, async t => {
  const f = await fixture(t); const fence = await f.reserve();
  const actions = await f.control(fence, state);
  assert.deepEqual(await f.owner.handoff(), { ok: false, code: "exit-unconfirmed" });
  assert.deepEqual(actions, state === "owner-lost" ? ["observe", "end"] : ["observe"]);
  assert.equal((await f.owner.inspect()).kind, "pending");
});

test("startup handoff preserves an unreachable supervisor fence", async t => {
  const f = await fixture(t); await f.reserve();
  assert.deepEqual(await f.owner.handoff(), { ok: false, code: "owner-unavailable" });
  assert.equal((await f.owner.inspect()).kind, "pending");
});

test("startup handoff does not trust a foreign run control response", async t => {
  const f = await fixture(t); const fence = await f.reserve();
  const actions = await f.control(fence, "owner-lost", undefined, { version: 1, runId: "foreign", state: "owner-lost", endRequested: false });
  assert.deepEqual(await f.owner.handoff(), { ok: false, code: "owner-unavailable" });
  assert.deepEqual(actions, ["observe"]);
  assert.equal((await f.owner.inspect()).kind, "pending");
});

test("startup handoff rejects a receipt for another child", async t => {
  const f = await fixture(t); const fence = await f.reserve();
  await f.control(fence, "owner-lost", async action => {
    if (action === "end") await writeFile(path.join(f.directory, `receipt-${fence.runId}.json`), JSON.stringify({
      version: 1, runId: fence.runId, childId: "foreign", outcome: "child-exited", code: 0, signal: null, observedAt: Date.now(),
    }));
  });
  assert.deepEqual(await f.owner.handoff(), { ok: false, code: "exit-unconfirmed" });
  assert.deepEqual(await f.owner.inspect(), { kind: "blocked", code: "invalid-record" });
});

test("startup empty and corrupt domains stay distinct", async t => {
  const f = await fixture(t);
  assert.deepEqual(await f.owner.handoff(), { ok: true, outcome: "none" });
  await writeFile(path.join(f.directory, "fence.json"), "{}");
  assert.deepEqual(await f.owner.handoff(), { ok: false, code: "blocked", reason: "invalid-record" });
});

test("concurrent startup retirements do not unlink a replacement fence", async t => {
  const f = await fixture(t); const fence = await f.reserve();
  await createRecoveryObserver(f.directory, fence).recordExit(0, null);
  const second = createRuntimeOwner({ directory: f.directory, workerPath: "unused" });
  const results = await Promise.all([f.owner.handoff(), second.handoff()]);
  assert.ok(results.some(result => result.ok && result.outcome === "retired"));
  assert.deepEqual(await f.owner.inspect(), { kind: "empty" });
  const replacement = await f.reserve();
  assert.notEqual(replacement.runId, fence.runId);
  assert.equal((await f.store.retire(fence.runId)).ok, false);
  const retained = await f.owner.inspect();
  assert.equal(retained.kind, "pending");
  if (retained.kind === "pending") assert.equal(retained.fence.runId, replacement.runId);
});
