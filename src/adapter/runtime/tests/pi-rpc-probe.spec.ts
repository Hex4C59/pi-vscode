import assert from "node:assert/strict";
import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { test } from "node:test";
import { serializeJsonLine } from "../jsonl.js";
import { runPiRuntimeProbe } from "../pi-rpc-probe.js";

const nextTurn = () => new Promise<void>((resolve) => setImmediate(resolve));

type FakeKill = (child: FakeChild, signal?: NodeJS.Signals | number) => boolean;

type FakeChild = EventEmitter & {
  stdin: PassThrough;
  stdout: PassThrough;
  stderr: PassThrough;
  exitCode: number | null;
  signalCode: NodeJS.Signals | null;
  kill: (signal?: NodeJS.Signals | number) => boolean;
};

function fakeChild(t: { after: (fn: () => void) => void }, kill: FakeKill): FakeChild {
  const child = Object.assign(new EventEmitter(), {
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    exitCode: null as number | null,
    signalCode: null as NodeJS.Signals | null,
    kill(signal?: NodeJS.Signals | number) {
      return kill(child, signal);
    },
  });
  child.stdin.resume();
  t.after(() => {
    child.stdin.destroy();
    child.stdout.destroy();
    child.stderr.destroy();
  });
  return child;
}

function asProcess(child: FakeChild): ChildProcess {
  return child as unknown as ChildProcess;
}

function replyGetState(child: FakeChild, success: unknown): void {
  child.stdout.write(
    serializeJsonLine({
      id: "pi-vscode-probe-1",
      type: "response",
      command: "get_state",
      success,
    }),
  );
}

function exitChild(child: FakeChild, code = 0): void {
  child.exitCode = code;
  child.emit("exit", code, null);
  child.emit("close", code, null);
}

test("asynchronous spawn ENOENT returns a failed probe result", { timeout: 2000 }, async (t) => {
  const child = fakeChild(t, () => false);
  const result = runPiRuntimeProbe({
    cliPath: "/missing-pi-cli",
    stopTimeoutMs: 20,
    spawn: () => {
      setImmediate(() => {
        child.emit("error", Object.assign(new Error("spawn ENOENT"), { code: "ENOENT" }));
      });
      return asProcess(child);
    },
  });
  await nextTurn();
  const settled = await result;
  assert.equal(settled.ok, false);
  assert.match(settled.detail, /ENOENT/);
  assert.doesNotMatch(settled.detail, /exited within timeout/);
});

test("stdout pipe errors settle the diagnostic once as failure", { timeout: 2000 }, async (t) => {
  const child = fakeChild(t, () => false);
  const result = runPiRuntimeProbe({
    cliPath: "/missing-pi-cli",
    stopTimeoutMs: 20,
    spawn: () => {
      setImmediate(() => {
        child.stdout.emit("error", Object.assign(new Error("write EPIPE"), { code: "EPIPE" }));
      });
      return asProcess(child);
    },
  });
  await nextTurn();
  const settled = await result;
  assert.equal(settled.ok, false);
  assert.match(settled.detail, /EPIPE/);
});

test("string success false is not a successful diagnostic round-trip", { timeout: 2000 }, async (t) => {
  const child = fakeChild(t, (_target, signal) => {
    exitChild(child, signal === "SIGKILL" ? 1 : 0);
    return true;
  });
  child.stdin.on("data", () => replyGetState(child, "false"));
  const settled = await runPiRuntimeProbe({
    cliPath: "/fixture/cli.js",
    stopTimeoutMs: 20,
    spawn: () => asProcess(child),
  });
  assert.equal(settled.ok, false);
  assert.match(settled.detail, /get_state failed/);
  assert.doesNotMatch(settled.detail, /exited within timeout/);
});

test("refused kill without observed exit does not report bounded shutdown success", { timeout: 2000 }, async (t) => {
  const child = fakeChild(t, () => false);
  child.stdin.on("data", () => replyGetState(child, true));
  const settled = await runPiRuntimeProbe({
    cliPath: "/fixture/cli.js",
    stopTimeoutMs: 15,
    spawn: () => asProcess(child),
  });
  assert.equal(settled.ok, false);
  assert.match(settled.detail, /termination was refused/);
  assert.match(settled.detail, /exit was not observed/);
  assert.doesNotMatch(settled.detail, /exited within timeout/);
  assert.equal(child.exitCode, null);
});

test("boolean success plus observed exit is the only successful diagnostic", { timeout: 2000 }, async (t) => {
  const child = fakeChild(t, () => {
    exitChild(child, 0);
    return true;
  });
  child.stdin.on("data", () => replyGetState(child, true));
  const settled = await runPiRuntimeProbe({
    cliPath: "/fixture/cli.js",
    stopTimeoutMs: 20,
    spawn: () => asProcess(child),
  });
  assert.equal(settled.ok, true);
  assert.equal(settled.detail, "get_state succeeded; process exited within timeout");
  assert.equal(settled.stateSummary, "get_state ok");
});
