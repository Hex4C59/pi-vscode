import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { ChildProcess } from "node:child_process";
import { test } from "node:test";
import type { RuntimeOwner } from "../../ownership/index.js";
import { createPiRpcRuntime } from "../index.js";

function deferredOwnedLaunch() {
  let release!: (result: Awaited<ReturnType<RuntimeOwner["launch"]>>) => void;
  const launch = new Promise<Awaited<ReturnType<RuntimeOwner["launch"]>>>(resolve => { release = resolve; });
  let launches = 0;
  let ends = 0;
  let recoveries = 0;
  let disconnects = 0;
  let kills = 0;
  const stdin = new PassThrough();
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const writes: string[] = [];
  stdin.on("data", chunk => writes.push(String(chunk)));
  // A synthetic process is the injected owner's transport boundary, never a live child.
  const process = Object.assign(new EventEmitter(), {
    stdin, stdout, stderr, connected: true, exitCode: null, signalCode: null,
    disconnect() { disconnects++; process.connected = false; },
    kill() { kills++; return true; },
  });
  const runtime = createPiRpcRuntime({
    cliPath: () => "/fixture/cli.js", startupModel: () => undefined, gateAccess: async () => undefined,
    owner: {
      async launch() { launches++; return launch; },
      async inspect() { return { kind: "blocked", code: "invalid-record" }; },
      async end() { ends++; return { ok: true }; },
      async recover() { recoveries++; return { ok: true }; },
    },
  });
  return {
    runtime, writes, stdout, stderr,
    release() { release({ ok: true, process: process as unknown as ChildProcess, runId: "synthetic" }); },
    get launches() { return launches; }, get ends() { return ends; }, get recoveries() { return recoveries; },
    get disconnects() { return disconnects; }, get kills() { return kills; },
  };
}

const nextTurn = () => new Promise<void>(resolve => setImmediate(resolve));

test("a cancelled owned launch detaches its late transport without RPC, interactions, or automatic termination", async () => {
  const f = deferredOwnedLaunch();
  const events: unknown[] = [];
  const interactions: unknown[] = [];
  f.runtime.subscribe(event => events.push(event));
  f.runtime.setInteractionHandler?.(form => { interactions.push(form); });
  const starting = f.runtime.start({ cwd: "/old-workspace", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/fixture/extension.mjs" } });
  await nextTurn();
  assert.equal(f.launches, 1);
  await f.runtime.stop();
  f.release();
  try {
    await nextTurn();
    assert.deepEqual(f.writes, [], "cancelled startup must never send get_state to the arriving child");
    assert.equal((await starting).ok, false);
    f.stdout.write(JSON.stringify({ type: "extension_ui_request", id: "late", method: "input", title: "Old workspace" }) + "\n");
    await nextTurn();
    assert.deepEqual(events, []);
    assert.deepEqual(interactions, []);
    assert.equal(f.runtime.getSession(), 0);
    assert.equal(f.disconnects, 1);
    assert.equal(f.stdout.readableFlowing, true);
    assert.equal(f.stderr.readableFlowing, true);
    assert.equal(f.kills, 0);
    assert.equal(f.ends, 0);
    assert.equal(f.recoveries, 0);
    assert.equal((await f.runtime.start({ cwd: "/new-workspace", projectTrust: "no-approve" })).ok, false);
    assert.equal(f.launches, 1, "uncertain late launch must retain its recovery barrier");
  } finally { await f.runtime.stop(); await starting; }
});

test("pending owned launch cancellation blocks replacement and recovery until that launch has settled", async () => {
  const f = deferredOwnedLaunch();
  const starting = f.runtime.start({ cwd: "/old-workspace", projectTrust: "no-approve" });
  await nextTurn();
  await f.runtime.stop();
  const replacing = f.runtime.start({ cwd: "/new-workspace", projectTrust: "no-approve" });
  try {
    await nextTurn();
    assert.equal(f.launches, 1, "the in-flight ownership claim must exclude a newer launch");
    assert.equal((await replacing).ok, false);
    assert.equal((await f.runtime.recoverOwnedRuntime?.())?.ok, false);
    assert.equal(f.recoveries, 0, "a pending launch cannot have its fence retired underneath it");
    f.release();
    assert.equal((await starting).ok, false);
    assert.deepEqual(f.writes, []);
    assert.equal(f.ends, 0);
    assert.equal((await f.runtime.start({ cwd: "/new-workspace", projectTrust: "no-approve" })).ok, false);
    assert.equal(f.launches, 1);
    assert.equal((await f.runtime.recoverOwnedRuntime?.())?.ok, true);
    assert.equal(f.recoveries, 1, "only explicit post-launch recovery may retire matching exit evidence");
  } finally {
    f.release();
    await nextTurn();
    await f.runtime.stop();
    await Promise.all([starting, replacing]);
  }
});
