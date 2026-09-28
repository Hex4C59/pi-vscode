import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { createRecoveryStore } from "../index.js";

const root = path.resolve("dist/tests-fixtures/runtime-ownership");
async function fixture(t: { after(callback: () => Promise<void>): void }): Promise<string> {
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, "fence-"));
  t.after(async () => {
    const relative = path.relative(root, path.resolve(directory));
    assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
    await rm(directory, { recursive: true, force: true });
  });
  return directory;
}

test("a persisted runtime reservation blocks a fresh owner without inferring process exit", async (t) => {
  const directory = await fixture(t);
  const owner = createRecoveryStore(directory);
  assert.deepEqual(await owner.inspect(), { kind: "empty" });
  const admitted = await owner.reserve();
  assert.equal(admitted.ok, true);
  if (!admitted.ok) return;
  const replacement = createRecoveryStore(directory);
  assert.deepEqual(await replacement.inspect(), { kind: "pending", fence: admitted.fence });
  assert.deepEqual(await replacement.reserve(), { ok: false, code: "occupied" });
  assert.deepEqual(await replacement.retire(admitted.fence.runId), { ok: false, code: "exit-unconfirmed" });
  assert.equal((await replacement.inspect()).kind, "pending");
});

test("an exact-child exit receipt permits deliberate retirement, not automatic restart", async (t) => {
  const directory = await fixture(t);
  const owner = createRecoveryStore(directory);
  const admitted = await owner.reserve();
  assert.equal(admitted.ok, true);
  if (!admitted.ok) return;
  const { createRecoveryObserver } = await import("../index.js");
  const observer = createRecoveryObserver(directory, admitted.fence);
  assert.deepEqual(await observer.recordExit(0, null), { ok: true });
  const state = await owner.inspect();
  assert.equal(state.kind, "terminal");
  assert.deepEqual(await owner.reserve(), { ok: false, code: "occupied" });
  assert.deepEqual(await owner.retire(admitted.fence.runId), { ok: true });
  assert.deepEqual(await owner.inspect(), { kind: "empty" });
  const next = await owner.reserve();
  assert.equal(next.ok, true);
  if (next.ok) assert.notEqual(next.fence.runId, admitted.fence.runId);
});

test("concurrent owners admit once and stale recovery cannot retire the replacement", async (t) => {
  const directory = await fixture(t);
  const owners = [createRecoveryStore(directory), createRecoveryStore(directory)];
  const reservations = await Promise.all(owners.map(owner => owner.reserve()));
  const admitted = reservations.filter(result => result.ok);
  assert.equal(admitted.length, 1);
  const first = admitted[0];
  if (!first.ok) return;
  const { createRecoveryObserver } = await import("../index.js");
  assert.deepEqual(await createRecoveryObserver(directory, first.fence).recordExit(null, "SIGTERM"), { ok: true });
  const retirements = await Promise.all(owners.map(owner => owner.retire(first.fence.runId)));
  assert.equal(retirements.filter(result => result.ok).length, 1);
  const next = await owners[0].reserve();
  assert.equal(next.ok, true);
  if (!next.ok) return;
  assert.deepEqual(await owners[1].retire(first.fence.runId), { ok: false, code: "exit-unconfirmed" });
  assert.deepEqual(await owners[0].inspect(), { kind: "pending", fence: next.fence });
});

test("positively observed never-spawned initialization can be recovered without pretending child exit", async (t) => {
  const directory = await fixture(t);
  const store = createRecoveryStore(directory);
  const admitted = await store.reserve();
  if (!admitted.ok) assert.fail("fixture reservation failed");
  const { createRecoveryObserver } = await import("../index.js");
  assert.deepEqual(await createRecoveryObserver(directory, admitted.fence).recordNeverSpawned(), { ok: true });
  const state = await store.inspect();
  assert.equal(state.kind, "terminal");
  if (state.kind === "terminal") assert.equal(state.receipt.outcome, "never-spawned");
  assert.deepEqual(await store.retire(admitted.fence.runId), { ok: true });
});

test("resolved recovery diagnostics stay bounded across repeated deliberate renewals", async (t) => {
  const directory = await fixture(t);
  const store = createRecoveryStore(directory);
  const { createRecoveryObserver } = await import("../index.js");
  for (let i = 0; i < 19; i += 1) {
    const reservation = await store.reserve();
    if (!reservation.ok) assert.fail("renewal unexpectedly blocked");
    assert.deepEqual(await createRecoveryObserver(directory, reservation.fence).recordExit(0, null), { ok: true });
    assert.deepEqual(await store.retire(reservation.fence.runId), { ok: true });
  }
  const { readdir } = await import("node:fs/promises");
  const names = await readdir(directory);
  assert.equal(names.filter(name => name.startsWith("receipt-")).length, 16);
  assert.equal(names.filter(name => name.startsWith("retire-")).length, 16);
});

test("malformed, oversized and foreign-child records block rather than clearing uncertainty", async (t) => {
  const { writeFile } = await import("node:fs/promises");
  for (const input of ["{broken", "x".repeat(4097), JSON.stringify({ version: 3, runId: "unknown" })]) {
    const directory = await fixture(t);
    await writeFile(path.join(directory, "fence.json"), input);
    assert.deepEqual(await createRecoveryStore(directory).inspect(), { kind: "blocked", code: "invalid-record" });
    assert.deepEqual(await createRecoveryStore(directory).reserve(), { ok: false, code: "occupied" });
  }
  const directory = await fixture(t);
  const store = createRecoveryStore(directory);
  const reserved = await store.reserve();
  if (!reserved.ok) assert.fail("fixture reservation failed");
  const { createRecoveryObserver } = await import("../index.js");
  const other = { ...reserved.fence, childId: "00000000-0000-0000-0000-000000000000" };
  assert.deepEqual(await createRecoveryObserver(directory, other).recordExit(0, null), { ok: false, code: "invalid-record" });
  assert.deepEqual(await store.inspect(), { kind: "pending", fence: reserved.fence });
  await writeFile(path.join(directory, `receipt-${reserved.fence.runId}.json`), JSON.stringify({
    version: 1, runId: reserved.fence.runId, childId: other.childId,
    outcome: "child-exited", code: 0, signal: null, observedAt: 0,
  }));
  assert.deepEqual(await store.inspect(), { kind: "blocked", code: "invalid-record" });
  assert.deepEqual(await store.retire(reserved.fence.runId), { ok: false, code: "exit-unconfirmed" });
});

test("a crashed retirement writer cannot be bypassed and partial evidence is retained", async (t) => {
  const { writeFile, readFile } = await import("node:fs/promises");
  const directory = await fixture(t);
  const store = createRecoveryStore(directory);
  const reserved = await store.reserve();
  if (!reserved.ok) assert.fail("fixture reservation failed");
  const { createRecoveryObserver } = await import("../index.js");
  await createRecoveryObserver(directory, reserved.fence).recordExit(0, null);
  const claim = path.join(directory, `retire-${reserved.fence.runId}.json`);
  await writeFile(claim, "partial retirement writer");
  assert.deepEqual(await store.retire(reserved.fence.runId), { ok: false, code: "retirement-unconfirmed" });
  assert.deepEqual(await store.reserve(), { ok: false, code: "occupied" });
  assert.equal(await readFile(claim, "utf8"), "partial retirement writer");
  assert.equal((await store.inspect()).kind, "terminal");
});

test("diagnostic cleanup failure cannot remove an uncertain retirement barrier", async (t) => {
  const { writeFile } = await import("node:fs/promises");
  const directory = await fixture(t);
  const store = createRecoveryStore(directory);
  const reservation = await store.reserve();
  if (!reservation.ok) assert.fail("fixture reservation failed");
  const { createRecoveryObserver } = await import("../index.js");
  await createRecoveryObserver(directory, reservation.fence).recordExit(0, null);
  for (let i = 0; i < 129; i += 1) await writeFile(path.join(directory, `unknown-${i}.txt`), "retained evidence");
  assert.deepEqual(await store.retire(reservation.fence.runId), { ok: false, code: "retirement-unconfirmed" });
  assert.equal((await store.inspect()).kind, "terminal");
});
