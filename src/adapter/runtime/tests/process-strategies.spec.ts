import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { ChildProcess, spawn } from "node:child_process";
import { test } from "node:test";
import { createManagedProcess } from "../process/managed-process.js";
import { createDirectProcess } from "../process/direct-process.js";
import type { RuntimeOwner } from "../../ownership/types.js";
import type { RetainedRunHandoff } from "../../../extension/contracts/index.js";
import type { ProcessLaunch } from "../process/types.js";
import { createPiRpcRuntime } from "../pi-rpc-runtime.js";

const input: ProcessLaunch = { cwd: "/fixture", cliPath: "/fixture/pi.js", args: ["--mode", "rpc"], env: {} };
const nextTurn = () => new Promise<void>(resolve => setImmediate(resolve));

/** The only cast is at the external Node process boundary, not in RPC fixtures. */
function nativeChild() {
  const signals: (NodeJS.Signals | number | undefined)[] = [];
  let disconnects = 0;
  const child = Object.assign(new EventEmitter(), {
    stdin: new PassThrough(), stdout: new PassThrough(), stderr: new PassThrough(),
    exitCode: null as number | null, signalCode: null as NodeJS.Signals | null, connected: true,
    disconnect() { disconnects++; child.connected = false; },
    kill(signal?: NodeJS.Signals | number) { signals.push(signal); return true; },
  });
  return { child, process: child as unknown as ChildProcess, signals, get disconnects() { return disconnects; } };
}

function ownedFixture() {
  const native = nativeChild();
  const calls: string[] = [];
  let endOk = true; let recoverOk = true;
  let handoff: RetainedRunHandoff = { ok: true, outcome: "none" };
  const owner: RuntimeOwner = {
    async launch() { calls.push("launch"); return { ok: true, process: native.process, runId: "exact-run" }; },
    async inspect() { return { kind: "empty" }; },
    async end() { calls.push("end"); return endOk ? { ok: true } : { ok: false, code: "exit-unconfirmed" }; },
    async recover() { calls.push("recover"); return recoverOk ? { ok: true } : { ok: false, code: "exit-unconfirmed" }; },
    async handoff() { calls.push("handoff"); return handoff; },
  };
  return { ...native, owner, calls, strategy: createManagedProcess(owner),
    failEnd() { endOk = false; }, failRecovery() { recoverOk = false; },
    setHandoff(result: RetainedRunHandoff) { handoff = result; } };
}

test("managed handoff clears a verified uncertain block and stays idle-only", async () => {
  const f = ownedFixture();
  assert.equal((await f.strategy.launch(input)).ok, true);
  assert.deepEqual(await f.strategy.handoff(), { ok: false, code: "busy" });
  assert.deepEqual(f.calls, ["launch"]);
  await f.strategy.release("uncertain");
  f.setHandoff({ ok: false, code: "exit-unconfirmed" });
  assert.deepEqual(await f.strategy.handoff(), { ok: false, code: "exit-unconfirmed" });
  assert.equal((await f.strategy.launch(input)).ok, false);
  f.setHandoff({ ok: true, outcome: "retired" });
  assert.deepEqual(await f.strategy.handoff(), { ok: true, outcome: "retired" });
  assert.equal((await f.strategy.launch(input)).ok, true);
  await f.strategy.release("idle");
  assert.deepEqual(f.calls, ["launch", "handoff", "handoff", "launch", "end", "recover"]);
  assert.deepEqual(f.signals, []);
});

test("managed handoff refuses an in-flight launch without touching its owner", async () => {
  const f = ownedFixture();
  const launch = f.owner.launch;
  let finish!: () => void;
  f.owner.launch = input => new Promise(resolve => { finish = () => { void launch(input).then(resolve); }; });
  const starting = f.strategy.launch(input);
  await nextTurn();
  assert.deepEqual(await f.strategy.handoff(), { ok: false, code: "busy" });
  assert.deepEqual(f.calls, []);
  finish();
  assert.equal((await starting).ok, true);
  await f.strategy.release("idle");
});

test("a launch waits for an already running handoff before reserving", async () => {
  const f = ownedFixture();
  let finish!: () => void;
  f.owner.handoff = () => new Promise(resolve => { f.calls.push("handoff"); finish = () => resolve({ ok: true, outcome: "retired" }); });
  const handingOff = f.strategy.handoff();
  await nextTurn();
  const starting = f.strategy.launch(input);
  await nextTurn();
  assert.deepEqual(f.calls, ["handoff"]);
  finish();
  assert.deepEqual(await handingOff, { ok: true, outcome: "retired" });
  assert.equal((await starting).ok, true);
  await f.strategy.release("idle");
});

test("managed idle release observes end then recovery once; repeated release shares cleanup", async () => {
  const f = ownedFixture();
  assert.equal((await f.strategy.launch(input)).ok, true);
  await Promise.all([f.strategy.release("idle"), f.strategy.release("idle")]);
  assert.deepEqual(f.calls, ["launch", "end", "recover"]);
  assert.deepEqual(f.signals, []);
  assert.equal((await f.strategy.launch(input)).ok, true);
  await f.strategy.release("idle");
});

test("managed uncertainty drains both outputs without closing input, ending, or retiring", async () => {
  const f = ownedFixture();
  assert.equal((await f.strategy.launch(input)).ok, true);
  await f.strategy.release("uncertain");
  assert.equal(f.child.connected, false);
  assert.equal(f.child.stdin.writableEnded, false);
  assert.equal(f.child.stdout.readableFlowing, true);
  assert.equal(f.child.stderr.readableFlowing, true);
  assert.deepEqual(f.calls, ["launch"]);
  assert.deepEqual(f.signals, []);
  assert.equal((await f.strategy.launch(input)).ok, false);
  assert.equal((await f.strategy.end()).ok, true);
  assert.equal((await f.strategy.launch(input)).ok, false, "End alone cannot retire uncertainty");
  f.failRecovery();
  assert.equal((await f.strategy.recover()).ok, false);
  assert.equal((await f.strategy.launch(input)).ok, false);
});

for (const failure of ["end", "recovery"] as const) test(`managed failed idle ${failure} blocks replacement`, async () => {
  const f = ownedFixture();
  await f.strategy.launch(input);
  if (failure === "end") f.failEnd(); else f.failRecovery();
  await f.strategy.release("idle");
  assert.equal((await f.strategy.launch(input)).ok, false);
  assert.deepEqual(f.calls, failure === "end" ? ["launch", "end"] : ["launch", "end", "recover"]);
});

test("managed replacement waits for prior cleanup and does not overlap an owner launch", async () => {
  const f = ownedFixture();
  let finish!: () => void;
  f.owner.end = () => new Promise(resolve => { f.calls.push("end"); finish = () => resolve({ ok: true }); });
  await f.strategy.launch(input);
  const releasing = f.strategy.release("idle");
  const starting = f.strategy.launch(input);
  await nextTurn();
  assert.deepEqual(f.calls, ["launch", "end"]);
  assert.equal((await f.strategy.launch(input)).ok, false);
  finish(); await releasing;
  assert.equal((await starting).ok, true);
  await f.strategy.release("uncertain");
});

test("owner exceptions become fixed errors and retain launch admission barrier", async () => {
  const f = ownedFixture();
  let launchAttempts = 0;
  f.owner.launch = async () => { launchAttempts++; throw new Error("private synthetic credentials"); };
  const started = await f.strategy.launch(input);
  assert.equal(started.ok, false);
  assert.doesNotMatch(JSON.stringify(started), /private synthetic/);
  assert.equal((await f.strategy.launch(input)).ok, false);
  assert.equal(launchAttempts, 1, "a failed owner launch retains the admission barrier");
  f.owner.inspect = async () => { throw new Error("unavailable"); };
  assert.equal(await f.strategy.inspect(), "blocked");
});

test("production RPC plus managed process preserves uncertainty on transport loss and recovers deliberately", async () => {
  const f = ownedFixture();
  f.owner.launch = async options => {
    f.calls.push("launch");
    f.child.stdin.on("data", bytes => {
      const request = JSON.parse(String(bytes)) as { id: string; type: string };
      if (request.type !== "get_state" && request.type !== "get_commands") return;
      if (request.type === "get_state") f.child.stdout.write(JSON.stringify({ type: "extension_ui_request", method: "notify", message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: options.cwd }) }) + "\n");
      f.child.stdout.write(JSON.stringify({ type: "response", id: request.id, command: request.type, success: true, data: request.type === "get_state" ? { sessionId: "fixture", sessionFile: "/fixture/session.jsonl" } : { commands: [] } }) + "\n");
    });
    return { ok: true, process: f.process, runId: "exact-run" };
  };
  const runtime = createPiRpcRuntime({ process: f.strategy, cliPath: () => input.cliPath, startupModel: () => undefined, gateAccess: async () => undefined });
  assert.equal((await runtime.start({ cwd: input.cwd, projectTrust: "no-approve" })).ok, true);
  f.child.stdin.emit("error", new Error("lost"));
  await nextTurn();
  assert.equal(runtime.getSession(), 0);
  assert.deepEqual(f.calls, ["launch"]);
  assert.deepEqual(f.signals, []);
  assert.equal((await runtime.start({ cwd: input.cwd, projectTrust: "no-approve" })).ok, false);
  assert.equal((await runtime.endOwnedRuntime?.())?.ok, true);
  assert.equal((await runtime.recoverOwnedRuntime?.())?.ok, true);
  assert.deepEqual(f.calls, ["launch", "end", "recover"]);
  await runtime.stop();
});

function directFixture() {
  const native = nativeChild();
  let launches = 0;
  const spawnProcess = ((_command: string, args: string[], options: { windowsHide: boolean }) => {
    launches++; assert.deepEqual(args, [input.cliPath, ...input.args]);
    assert.equal(options.windowsHide, true);
    return native.process;
  }) as typeof spawn;
  return { ...native, strategy: createDirectProcess(spawnProcess), get launches() { return launches; } };
}

test("direct release waits for close, escalates once, and blocks replacement after final deadline", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const f = directFixture();
  await f.strategy.launch(input);
  const releasing = f.strategy.release("uncertain");
  await nextTurn();
  assert.deepEqual(f.signals, ["SIGTERM"]);
  context.mock.timers.tick(5000);
  assert.deepEqual(f.signals, ["SIGTERM", "SIGKILL"]);
  context.mock.timers.tick(5000); await releasing;
  assert.equal((await f.strategy.launch(input)).ok, false);
  assert.equal(f.launches, 1);
  assert.equal((await f.strategy.recover()).ok, false);
});

test("direct close settles cleanup without escalation and repeated release does not signal twice", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const f = directFixture();
  await f.strategy.launch(input);
  const releasing = f.strategy.release("idle");
  const repeated = f.strategy.release("idle");
  await nextTurn();
  f.child.exitCode = 0; f.child.emit("close");
  await Promise.all([releasing, repeated]);
  context.mock.timers.tick(10000);
  assert.deepEqual(f.signals, ["SIGTERM"]);
  assert.equal(await f.strategy.inspect(), "none");
});

test("missing supervisor permits a deliberate retry without a fictitious recovery barrier", async () => {
  const f = ownedFixture();
  const launch = f.owner.launch;
  f.owner.launch = async () => ({ ok: false, code: "worker-unavailable" });
  assert.equal((await f.strategy.launch(input)).ok, false);
  f.owner.launch = launch;
  assert.equal((await f.strategy.launch(input)).ok, true);
  await f.strategy.release("idle");
});

test("stop after process launch resolves but before RPC attaches still releases as uncertain", async () => {
  const f = ownedFixture();
  const launch = f.strategy.launch;
  f.strategy.launch = async options => {
    const result = await launch(options);
    // Return a ready transport, then stop in the microtask gap before RPC attaches it.
    queueMicrotask(() => { void runtime.stop(); });
    return result;
  };
  const runtime = createPiRpcRuntime({ process: f.strategy, cliPath: () => input.cliPath, startupModel: () => undefined, gateAccess: async () => undefined });
  const result = await runtime.start({ cwd: input.cwd, projectTrust: "no-approve" });
  assert.equal(result.ok, false);
  assert.deepEqual(f.calls, ["launch"]);
  assert.deepEqual(f.signals, []);
  assert.equal(f.child.connected, false);
  assert.equal(f.child.stdin.writableLength, 0, "no readiness RPC may reach the superseded link");
  await runtime.stop();
});
