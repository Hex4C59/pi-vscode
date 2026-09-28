import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { runtimeControlPath } from "../control-protocol.js";
import { test } from "node:test";
import { createRecoveryObserver, createRecoveryStore, createRuntimeOwner } from "../index.js";

test("ending an already exited owned runtime does not retire its recovery fence", async (t) => {
  const root = path.resolve("dist/tests-fixtures/runtime-ownership");
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, "owner-"));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(directory)), root);
    await rm(directory, { recursive: true, force: true });
  });
  const reservation = await createRecoveryStore(directory).reserve();
  if (!reservation.ok) assert.fail("fixture reservation failed");
  await createRecoveryObserver(directory, reservation.fence).recordExit(0, null);
  const owner = createRuntimeOwner({ directory, workerPath: path.join(directory, "unused-worker.mjs") });
  assert.deepEqual(await owner.end(), { ok: true });
  assert.equal((await owner.inspect()).kind, "terminal");
  assert.deepEqual(await owner.recover(), { ok: true });
  assert.deepEqual(await owner.inspect(), { kind: "empty" });
});

test("manual end waits for exact exit evidence rather than treating a control ACK as exit", async (t) => {
  const root = path.resolve("dist/tests-fixtures/runtime-ownership");
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, "manual-"));
  const reservation = await createRecoveryStore(directory).reserve();
  if (!reservation.ok) assert.fail("fixture reservation failed");
  const { createServer } = await import("node:net");
  const address = runtimeControlPath(directory, reservation.fence.runId);
  let requested = false;
  const server = createServer(socket => {
    socket.once("data", chunk => {
      assert.deepEqual(JSON.parse(chunk.toString()), { version: 1, runId: reservation.fence.runId, action: "end" });
      requested = true;
      socket.end(JSON.stringify({ version: 1, runId: reservation.fence.runId, state: "owner-lost", endRequested: true }) + "\n");
    });
  });
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(address, resolve); });
  t.after(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
    assert.equal(path.dirname(path.resolve(directory)), root);
    await rm(directory, { recursive: true, force: true });
  });
  const owner = createRuntimeOwner({ directory, workerPath: path.join(directory, "unused-worker.mjs") });
  let resolved = false;
  const ending = owner.end().then(result => { resolved = true; return result; });
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(requested, true);
  assert.equal(resolved, false);
  assert.equal((await owner.inspect()).kind, "pending");
  await createRecoveryObserver(directory, reservation.fence).recordExit(null, "SIGTERM");
  assert.deepEqual(await ending, { ok: true });
  assert.equal((await owner.inspect()).kind, "terminal");
});

test("a missing packaged supervisor fails before creating an unresolved fence", async (t) => {
  const root = path.resolve("dist/tests-fixtures/runtime-ownership");
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, "missing-"));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(directory)), root);
    await rm(directory, { recursive: true, force: true });
  });
  const owner = createRuntimeOwner({ directory, workerPath: path.join(directory, "missing.mjs") });
  assert.deepEqual(await owner.launch({ cwd: directory, cliPath: path.join(directory, "unused-cli.js"), args: [], env: {} }), { ok: false, code: "worker-unavailable" });
  assert.deepEqual(await owner.inspect(), { kind: "empty" });
});

test("launch durably reserves first and validates the supervisor identity before exposing RPC streams", async (t) => {
  const { writeFile } = await import("node:fs/promises");
  const root = path.resolve("dist/tests-fixtures/runtime-ownership");
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, "launch-"));
  const workerPath = path.join(directory, "fake-supervisor.cjs");
  await writeFile(workerPath, `const fs=require('fs'),path=require('path');process.on('message',m=>{const f=JSON.parse(fs.readFileSync(path.join(process.argv[3],'fence.json'),'utf8'));if(m.type!=='initialize'||m.runId!==f.runId)process.exit(2);process.send({version:1,type:'spawned',runId:f.runId,childId:f.childId,pid:process.pid});process.stdout.write('reserved-before-launch\\n');});process.on('disconnect',()=>process.exit(0));`);
  const env: NodeJS.ProcessEnv = { HOME: directory, USERPROFILE: directory, TEMP: directory, TMP: directory };
  for (const key of ["SystemRoot", "WINDIR", "COMSPEC"]) if (process.env[key]) env[key] = process.env[key];
  const owner = createRuntimeOwner({ directory, workerPath });
  const launched = await owner.launch({ cwd: directory, cliPath: path.join(directory, "not-executed.js"), args: [], env });
  t.after(async () => {
    if (launched.ok && launched.process.exitCode === null && launched.process.signalCode === null) {
      launched.process.ref();
      launched.process.stdout?.resume();
      launched.process.stderr?.resume();
      const closed = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Synthetic supervisor cleanup timeout exit="+launched.process.exitCode+" signal="+launched.process.signalCode+" connected="+launched.process.connected+" stdout="+launched.process.stdout?.destroyed+" stderr="+launched.process.stderr?.destroyed)), 3000);
        launched.process.once("exit", () => {
          clearTimeout(timer);
          launched.process.stdout?.destroy(); launched.process.stderr?.destroy();
          resolve();
        });
      });
      if (launched.process.connected) launched.process.disconnect();
      launched.process.stdin?.destroy();
      await closed;
    }
    assert.equal(path.dirname(path.resolve(directory)), root);
    await rm(directory, { recursive: true, force: true });
  });
  assert.equal(launched.ok, true);
  if (!launched.ok) return;
  const state = await owner.inspect();
  assert.equal(state.kind, "pending");
  if (state.kind === "pending") assert.equal(state.fence.runId, launched.runId);
  const text = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("No synthetic RPC stream output; exit=" + launched.process.exitCode + ", signal=" + launched.process.signalCode)), 2000);
    launched.process.stdout!.once("data", chunk => { clearTimeout(timer); resolve(String(chunk)); });
  });
  assert.equal(text, "reserved-before-launch\n");
  assert.deepEqual(await owner.launch({ cwd: directory, cliPath: path.join(directory, "not-executed.js"), args: [], env }), { ok: false, code: "occupied" });
});


test("control endpoints remain bounded and isolate long recovery directories and runs", () => {
  const run = "11111111-1111-4111-8111-111111111111";
  const otherRun = "22222222-2222-4222-8222-222222222222";
  const directory = path.resolve("dist", "长".repeat(100));
  const endpoint = runtimeControlPath(directory, run);
  assert.equal(runtimeControlPath(directory, run), endpoint);
  assert.notEqual(runtimeControlPath(directory, otherRun), endpoint);
  assert.throws(() => runtimeControlPath(directory, "../invalid"));
  if (process.platform !== "win32") {
    assert.ok(Buffer.byteLength(endpoint, "utf8") <= 103);
    assert.notEqual(runtimeControlPath(`${directory}-other`, run), endpoint);
    assert.equal(runtimeControlPath("/tmp/pi", run), path.join("/tmp/pi", `control-${run}.sock`));
  }
});
