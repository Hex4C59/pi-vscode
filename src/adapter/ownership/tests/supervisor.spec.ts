import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { connect } from "node:net";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { createRecoveryStore } from "../index.js";
import { runtimeControlPath } from "../control-protocol.js";

const projectRoot = process.cwd();
const evidenceRoot = path.join(projectRoot, "dist", "delegated-completion-20260928", "wi013-supervisor");
const fixtureRoot = path.join(evidenceRoot, "fixture");
const workerPath = path.join(fixtureRoot, "supervisor.mjs");
const childPath = path.join(fixtureRoot, "synthetic-runtime.cjs");
const scratchRoot = path.join(projectRoot, "dist", "tests-fixtures", "runtime-supervisor");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
let fixtureReady: Promise<void> | undefined;

type InitializeMessage = { version: 1; type: "initialize"; runId: string; cliPath: string; args: string[]; cwd: string };
type SpawnedMessage = { version: 1; type: "spawned"; runId: string; childId: string; pid: number };
type WorkerHarness = {
  process: ChildProcess;
  readonly stdout: string;
  readonly stderr: string;
  waitForSpawn(): Promise<void>;
  sendInit(message: InitializeMessage): Promise<void>;
  waitForMessage(predicate: (value: unknown) => boolean): Promise<unknown>;
  waitForStdout(text: string): Promise<void>;
  waitForExit(): Promise<{ code: number | null; signal: NodeJS.Signals | null }>;
  readonly messages: readonly unknown[];
};
type RuntimeFixture = { directory: string; runId: string; childId: string; childPid: number; home: string; statePath: string; worker: WorkerHarness };
type SyntheticState = { tick: number; stdinEnded: boolean; lastInput: string | null; quiet: boolean; home: string; inheritedMarker: string | null };
type ControlResponse = { version: 1; runId: string; state: string; endRequested: boolean };

async function prepareFixture(): Promise<void> {
  fixtureReady ??= (async () => {
    await mkdir(fixtureRoot, { recursive: true });
    await writeFile(path.join(evidenceRoot, "OWNERSHIP.txt"),
      "Purpose: WI-013 delegated passive supervisor implementation and deterministic process/protocol test evidence. Owned by this task. Retain with the repository ignored dist evidence until maintainer review confirms it is no longer unique evidence and no process depends on its fixtures.\n",
      { encoding: "utf8", flag: "wx" }).catch(error => {
        if (!(error && typeof error === "object" && "code" in error && error.code === "EEXIST")) throw error;
      });
    const source = `const fs = require("node:fs");
const statePath = process.argv[2];
let tick = 0;
let stdinEnded = false;
let lastInput = null;
let quiet = false;
const writeState = () => fs.writeFileSync(statePath, JSON.stringify({ tick: ++tick, stdinEnded, lastInput, quiet, home: process.env.HOME, inheritedMarker: process.env.WI013_TEST_MARKER || null }));
process.stdout.write("synthetic-ready\\n");
process.stderr.write("synthetic stderr must be discarded\\n");
const timer = setInterval(() => { writeState(); if (!quiet) process.stdout.write("synthetic-tick\\n"); }, 25);
process.stdin.on("data", chunk => {
  lastInput = chunk.toString("utf8");
  writeState();
  if (lastInput.includes("quiet-probe")) { quiet = true; process.stdout.write("synthetic-quiet\\n"); }
  if (lastInput.includes("echo-probe")) process.stdout.write("synthetic-echo\\n");
  if (lastInput.includes("exit-probe")) { clearInterval(timer); process.exit(17); }
});
process.stdin.on("end", () => { stdinEnded = true; lastInput = "stdin-ended"; clearInterval(timer); writeState(); process.exit(79); });
process.on("SIGTERM", () => { clearInterval(timer); process.exit(0); });
`;
    await writeFile(childPath, source, "utf8");
    const buildOptions = { entryPoints: [path.join(projectRoot, "src", "adapter", "ownership", "supervisor.ts")],
      bundle: true, format: "esm", platform: "node", target: "node22", outfile: workerPath, logLevel: "error" };
    const result = spawnSync(process.execPath, ["--input-type=module", "-e",
      `import { build } from "esbuild"; await build(${JSON.stringify(buildOptions)});`],
    { windowsHide: true, cwd: projectRoot, encoding: "utf8", env: isolatedEnvironment(path.join(evidenceRoot, "build-home")) });
    if (result.error || result.status !== 0) {
      throw new Error(`esbuild supervisor fixture failed: ${result.error?.message ?? result.stderr ?? result.status}`);
    }
  })();
  return fixtureReady;
}

async function makeRecoveryDirectory(): Promise<string> {
  await mkdir(scratchRoot, { recursive: true });
  const directory = await mkdtemp(path.join(scratchRoot, "fence-"));
  const relative = path.relative(path.resolve(scratchRoot), path.resolve(directory));
  assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "fixture must remain under its owned root");
  return directory;
}

function isolatedEnvironment(home: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of ["PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP"]) {
    const value = process.env[key];
    if (value !== undefined) env[key] = value;
  }
  env.HOME = home;
  env.USERPROFILE = home;
  env.WI013_TEST_MARKER = "inherited-from-clean-parent-environment";
  return env;
}

async function startWorker(directory: string, runId: string, home: string): Promise<WorkerHarness> {
  await prepareFixture();
  const child = spawn(process.execPath, [workerPath, "--owned-runtime", directory, runId], {
    cwd: projectRoot,
    env: isolatedEnvironment(home),
    detached: true,
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe", "ipc"],
  });
  let stdout = "";
  let stderr = "";
  const messages: unknown[] = [];
  const messageWaiters: { predicate: (value: unknown) => boolean; resolve(value: unknown): void; reject(error: Error): void; timer: NodeJS.Timeout | undefined }[] = [];
  const stdoutWaiters: { text: string; resolve(): void; reject(error: Error): void; timer: NodeJS.Timeout | undefined }[] = [];
  let exit: { code: number | null; signal: NodeJS.Signals | null } | undefined;
  let exitError: Error | undefined;
  const spawned = new Promise<void>((resolve, reject) => {
    child.once("spawn", resolve);
    child.once("error", reject);
  });
  const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
    child.once("exit", (code, signal) => {
      exit = { code, signal };
      resolve(exit);
    });
    child.once("error", error => {
      exitError = error;
      reject(error);
    });
  });
  child.stdout?.setEncoding("utf8");
  child.stdout?.on("data", chunk => {
    stdout += chunk;
    for (const waiter of [...stdoutWaiters]) {
      if (stdout.includes(waiter.text)) {
        stdoutWaiters.splice(stdoutWaiters.indexOf(waiter), 1);
        waiter.resolve();
      }
    }
  });
  child.stderr?.setEncoding("utf8");
  child.stderr?.on("data", chunk => { stderr += chunk; });
  child.on("message", (value: unknown) => {
    messages.push(value);
    for (const waiter of [...messageWaiters]) {
      if (waiter.predicate(value)) {
        messageWaiters.splice(messageWaiters.indexOf(waiter), 1);
        waiter.resolve(value);
      }
    }
  });
  child.on("exit", () => {
    for (const waiter of messageWaiters.splice(0)) waiter.reject(new Error(`Supervisor exited before expected IPC message: ${stdout}`));
    for (const waiter of stdoutWaiters.splice(0)) waiter.reject(new Error(`Supervisor exited before expected output ${waiter.text}: ${stdout}`));
  });
  return {
    process: child,
    get messages() { return messages; },
    get stdout() { return stdout; },
    get stderr() { return stderr; },
    waitForSpawn() { return spawned; },
    sendInit(message) {
      if (!child.connected) return Promise.reject(new Error("Supervisor IPC disconnected before initialize"));
      return new Promise((resolve, reject) => child.send(message, error => error ? reject(error) : resolve()));
    },
    waitForMessage(predicate) {
      const existing = messages.find(predicate);
      if (existing !== undefined) return Promise.resolve(existing);
      if (exit) return Promise.reject(exitError ?? new Error("Supervisor already exited"));
      return new Promise((resolve, reject) => {
        const waiter: (typeof messageWaiters)[number] = {
          predicate,
          timer: undefined,
          resolve(value) { clearTimeout(waiter.timer); resolve(value); },
          reject(error) { clearTimeout(waiter.timer); reject(error); },
        };
        waiter.timer = setTimeout(() => {
          const index = messageWaiters.indexOf(waiter);
          if (index >= 0) messageWaiters.splice(index, 1);
          waiter.reject(new Error(`Timed out waiting for supervisor IPC message; stdout=${stdout}`));
        }, 7000);
        messageWaiters.push(waiter);
      });
    },
    waitForStdout(text) {
      if (stdout.includes(text)) return Promise.resolve();
      if (exit) return Promise.reject(new Error(`Supervisor exited before output ${text}: ${stdout}`));
      return new Promise((resolve, reject) => {
        const waiter: (typeof stdoutWaiters)[number] = {
          text,
          timer: undefined,
          resolve() { clearTimeout(waiter.timer); resolve(); },
          reject(error) { clearTimeout(waiter.timer); reject(error); },
        };
        waiter.timer = setTimeout(() => {
          const index = stdoutWaiters.indexOf(waiter);
          if (index >= 0) stdoutWaiters.splice(index, 1);
          waiter.reject(new Error(`Timed out waiting for supervisor output ${text}; stdout=${stdout}`));
        }, 7000);
        stdoutWaiters.push(waiter);
      });
    },
    waitForExit() { return exited; },
  };
}

function initialize(runId: string, home: string, statePath: string): InitializeMessage {
  return { version: 1, type: "initialize", runId, cliPath: childPath, args: [statePath], cwd: home };
}

function isSpawned(value: unknown, runId: string, childId: string): value is SpawnedMessage {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 5 && record.version === 1 && record.type === "spawned"
    && record.runId === runId && record.childId === childId && Number.isSafeInteger(record.pid) && (record.pid as number) > 0;
}

async function waitForWorkerExit(worker: WorkerHarness, timeoutMs: number): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), timeoutMs); });
  try { return await Promise.race([worker.waitForExit().then(() => true, () => true), timeout]); }
  finally { clearTimeout(timer); }
}

function announcedChildPid(worker: WorkerHarness): number {
  for (const value of worker.messages) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const record = value as Record<string, unknown>;
    if (record.version === 1 && record.type === "spawned" && Number.isSafeInteger(record.pid) && (record.pid as number) > 0) return record.pid as number;
  }
  return 0;
}

function registerWorkerCleanup(t: TestContext, directory: string, getWorker: () => WorkerHarness | undefined): void {
  t.after(async () => {
    try {
      const worker = getWorker();
      if (!worker) return;
      const recovery = await createRecoveryStore(directory).inspect().catch(() => undefined);
      if (recovery?.kind === "pending") {
        try { await sendControl(directory, recovery.fence.runId, { version: 1, runId: recovery.fence.runId, action: "end" }); }
        catch { /* Cleanup is limited to this synthetic worker. */ }
      }
      const childPid = announcedChildPid(worker);
      const isRunning = () => worker.process.exitCode === null && worker.process.signalCode === null;
      if (isRunning()) await waitForWorkerExit(worker, 1_500);
      if (isRunning() && childPid > 0) {
        try { process.kill(childPid, "SIGKILL"); } catch { /* The direct synthetic child may already be gone. */ }
        await waitForWorkerExit(worker, 1_500);
      }
      if (isRunning()) {
        worker.process.kill();
        await waitForWorkerExit(worker, 1_000);
      }
      if (isRunning() && childPid > 0) {
        try { process.kill(childPid, "SIGKILL"); } catch { /* The direct synthetic child may already be gone. */ }
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}

async function runtimeFixture(t: TestContext): Promise<RuntimeFixture> {
  await prepareFixture();
  const directory = await makeRecoveryDirectory();
  const workerRef: { current?: WorkerHarness } = {};
  registerWorkerCleanup(t, directory, () => workerRef.current);
  const home = path.join(directory, "home");
  await mkdir(home, { recursive: true });
  const statePath = path.join(directory, "synthetic-state.json");
  const reservation = await createRecoveryStore(directory).reserve();
  assert.equal(reservation.ok, true);
  if (!reservation.ok) throw new Error("could not reserve recovery fence for synthetic runtime");
  const activeWorker = await startWorker(directory, reservation.fence.runId, home);
  workerRef.current = activeWorker;
  const fixture: RuntimeFixture = { directory, runId: reservation.fence.runId, childId: reservation.fence.childId, childPid: 0, home, statePath, worker: activeWorker };
  await activeWorker.waitForSpawn();
  await activeWorker.sendInit(initialize(fixture.runId, home, statePath));
  const spawned = await activeWorker.waitForMessage(value => isSpawned(value, fixture.runId, fixture.childId)) as SpawnedMessage;
  fixture.childPid = spawned.pid;
  await activeWorker.waitForStdout("synthetic-ready\n");
  return fixture;
}
async function sendControl(directory: string, runId: string, request: unknown): Promise<string> {
  const text = typeof request === "string" ? request : `${JSON.stringify(request)}\n`;
  return new Promise((resolve, reject) => {
    const socket = connect(runtimeControlPath(directory, runId));
    let output = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(new Error("Timed out waiting for supervisor control response"));
    }, 3000);
    socket.setTimeout(2500, () => socket.destroy());
    socket.once("connect", () => socket.write(text));
    socket.on("data", chunk => {
      output += chunk.toString("utf8");
      if (output.includes("\n") && !settled) {
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        resolve(output);
      }
    });
    socket.once("close", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(output);
    });
    socket.once("error", error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function waitForState(statePath: string, predicate: (state: SyntheticState) => boolean, timeoutMs = 3000): Promise<SyntheticState> {
  const deadline = Date.now() + timeoutMs;
  let latest: SyntheticState | undefined;
  while (Date.now() < deadline) {
    try { latest = JSON.parse(await readFile(statePath, "utf8")) as SyntheticState; } catch { /* Child has not written its first heartbeat. */ }
    if (latest && predicate(latest)) return latest;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for synthetic child state: ${JSON.stringify(latest)}`);
}

async function waitForTerminal(directory: string, runId: string, timeoutMs = 2500) {
  const deadline = Date.now() + timeoutMs;
  let latest = await createRecoveryStore(directory).inspect();
  while (Date.now() < deadline) {
    if (latest.kind === "terminal" && latest.fence.runId === runId) return latest;
    await new Promise(resolve => setTimeout(resolve, 10));
    latest = await createRecoveryStore(directory).inspect();
  }
  throw new Error(`Timed out waiting for matching terminal receipt: ${JSON.stringify(latest)}`);
}
test("the supervisor relays child pipes and records the exact observed child exit", async t => {
  const fixture = await runtimeFixture(t);
  const { worker, directory, runId, childId, statePath } = fixture;
  worker.process.stdin?.write("echo-probe\n");
  await worker.waitForStdout("synthetic-echo\n");
  const exitRequestedAt = Date.now();
  worker.process.stdin?.write("exit-probe\n");
  const exit = await worker.waitForExit();
  assert.deepEqual(exit, { code: 0, signal: null }, "supervisor exits independently of a possible close event");
  assert.equal(worker.stderr, "", "child stderr is drained and never forwarded");
  const observed = await createRecoveryStore(directory).inspect();
  assert.equal(observed.kind, "terminal");
  if (observed.kind !== "terminal") return;
  assert.deepEqual(observed.receipt, { version: 1, runId, childId, outcome: "child-exited", code: 17, signal: null, observedAt: observed.receipt.observedAt });
  assert.ok(observed.receipt.observedAt >= exitRequestedAt && observed.receipt.observedAt <= Date.now(), "receipt timestamp must be recorded when the child exits");
  const state = JSON.parse(await readFile(statePath, "utf8")) as SyntheticState;
  assert.equal(state.lastInput, "exit-probe\n");
  assert.equal(state.home, fixture.home, "runtime inherited the isolated HOME without serializing env in initialize");
  assert.equal(state.inheritedMarker, "inherited-from-clean-parent-environment");
  assert.ok(UUID.test(runId));
});

async function loseOwnerAndAwaitExactChildExit(
  t: TestContext,
  lose: (fixture: RuntimeFixture) => void,
): Promise<{ fixture: RuntimeFixture; forwardedOutputLength: number }> {
  const fixture = await runtimeFixture(t);
  const { directory, runId, worker, statePath } = fixture;
  worker.process.stdin?.write("quiet-probe\n");
  await worker.waitForStdout("synthetic-quiet\n");
  await waitForState(statePath, state => state.quiet);
  const forwardedOutputLength = worker.stdout.length;
  lose(fixture);
  const terminal = await waitForTerminal(directory, runId);
  assert.equal(terminal.receipt.outcome, "child-exited");
  assert.ok(terminal.receipt.code === null || Number.isSafeInteger(terminal.receipt.code));
  assert.ok(terminal.receipt.signal === null || terminal.receipt.signal === "SIGTERM" || terminal.receipt.signal === "SIGKILL");
  assert.equal(await waitForWorkerExit(worker, 2500), true);
  const after = JSON.parse(await readFile(statePath, "utf8")) as SyntheticState;
  assert.equal(after.stdinEnded, false, "owner loss must not close the direct child's stdin");
  assert.equal(after.lastInput, "quiet-probe\n", "the supervisor no longer accepts parent writes after owner loss");
  assert.equal(worker.stdout.length, forwardedOutputLength, "runtime output is drained and discarded after owner loss");
  assert.equal(worker.stderr, "", "runtime stderr remains discarded");
  return { fixture, forwardedOutputLength };
}

test("IPC disconnect ends the exact owned child without closing its stdin", async t => {
  await loseOwnerAndAwaitExactChildExit(t, fixture => { fixture.worker.process.disconnect(); });
});

test("observation leaves a live owner's child running and accepting input", async t => {
  const fixture = await runtimeFixture(t);
  const before = await waitForState(fixture.statePath, state => state.tick >= 2);
  const response: unknown = JSON.parse(await sendControl(fixture.directory, fixture.runId, { version: 1, runId: fixture.runId, action: "observe" }));
  assert.deepEqual(response, { version: 1, runId: fixture.runId, state: "owned", endRequested: false });
  fixture.worker.process.stdin?.write("echo-probe\n");
  await fixture.worker.waitForStdout("synthetic-echo\n");
  const after = await waitForState(fixture.statePath, state => state.tick > before.tick);
  assert.equal(after.stdinEnded, false);
  assert.equal(fixture.worker.process.exitCode, null);
  assert.equal((await createRecoveryStore(fixture.directory).inspect()).kind, "pending");
});

test("an explicit control end is acknowledged and records actual child exit", async t => {
  const fixture = await runtimeFixture(t);
  const { directory, runId, worker } = fixture;
  const acknowledgement = JSON.parse(await sendControl(directory, runId, { version: 1, runId, action: "end" })) as ControlResponse;
  assert.deepEqual(acknowledgement, { version: 1, runId, state: "owned", endRequested: true });
  const terminal = await waitForTerminal(directory, runId);
  assert.equal(terminal.receipt.outcome, "child-exited");
  assert.ok(terminal.receipt.code === null || Number.isSafeInteger(terminal.receipt.code));
  assert.ok(terminal.receipt.signal === null || terminal.receipt.signal === "SIGTERM" || terminal.receipt.signal === "SIGKILL");
  assert.equal(await waitForWorkerExit(worker, 2500), true, "supervisor did not exit after child exit and durable receipt");
  const exit = await worker.waitForExit();
  assert.deepEqual(exit, { code: 0, signal: null });
});

test("malformed and wrong-run control requests close without disturbing the owned runtime", async t => {
  const fixture = await runtimeFixture(t);
  const wrongRunId = randomUUID();
  assert.equal(await sendControl(fixture.directory, fixture.runId, "{not-json\n"), "");
  assert.equal(await sendControl(fixture.directory, fixture.runId, { version: 1, runId: wrongRunId, action: "observe" }), "");
  const response = JSON.parse(await sendControl(fixture.directory, fixture.runId, { version: 1, runId: fixture.runId, action: "observe" })) as ControlResponse;
  assert.deepEqual(response, { version: 1, runId: fixture.runId, state: "owned", endRequested: false });
  assert.equal((await createRecoveryStore(fixture.directory).inspect()).kind, "pending");
});

test("parent stdin end ends the exact owned child without closing its stdin", async t => {
  await loseOwnerAndAwaitExactChildExit(t, fixture => { fixture.worker.process.stdin?.end(); });
});

test("loss of the parent output pipe ends the exact owned child without closing its stdin", async t => {
  const fixture = await runtimeFixture(t);
  const { directory, runId, worker, statePath } = fixture;
  await waitForState(statePath, state => state.tick >= 2);
  const forwardedOutputLength = worker.stdout.length;
  worker.process.stdout?.destroy();
  const terminal = await waitForTerminal(directory, runId);
  assert.equal(terminal.receipt.outcome, "child-exited");
  assert.ok(terminal.receipt.code === null || Number.isSafeInteger(terminal.receipt.code));
  assert.ok(terminal.receipt.signal === null || terminal.receipt.signal === "SIGTERM" || terminal.receipt.signal === "SIGKILL");
  assert.equal(await waitForWorkerExit(worker, 2500), true);
  const after = JSON.parse(await readFile(statePath, "utf8")) as SyntheticState;
  assert.equal(after.stdinEnded, false, "owner loss must not close the direct child's stdin");
  assert.ok(worker.stdout.length >= forwardedOutputLength);
  assert.equal(worker.stderr, "", "runtime stderr remains discarded");
});

test("a child spawn error records never-spawned and never reports spawned", async t => {
  const directory = await makeRecoveryDirectory();
  const workerRef: { current?: WorkerHarness } = {};
  registerWorkerCleanup(t, directory, () => workerRef.current);
  const home = path.join(directory, "home");
  await mkdir(home, { recursive: true });
  const reservation = await createRecoveryStore(directory).reserve();
  assert.equal(reservation.ok, true);
  if (!reservation.ok) throw new Error("could not reserve recovery fence");
  const activeWorker = await startWorker(directory, reservation.fence.runId, home);
  workerRef.current = activeWorker;

  await activeWorker.waitForSpawn();
  const launchRequestedAt = Date.now();
  await activeWorker.sendInit({ version: 1, type: "initialize", runId: reservation.fence.runId, cliPath: childPath, args: [path.join(directory, "synthetic-state.json")], cwd: path.join(directory, "missing-cwd") });
  const exit = await activeWorker.waitForExit();
  assert.deepEqual(exit, { code: 0, signal: null });
  assert.equal(activeWorker.stdout, "");
  const observed = await createRecoveryStore(directory).inspect();
  assert.equal(observed.kind, "terminal");
  if (observed.kind !== "terminal") return;
  assert.deepEqual(observed.receipt, { version: 1, runId: reservation.fence.runId, childId: reservation.fence.childId, outcome: "never-spawned", code: null, signal: null, observedAt: observed.receipt.observedAt });
  assert.ok(observed.receipt.observedAt >= launchRequestedAt && observed.receipt.observedAt <= Date.now(), "receipt timestamp must be recorded after the failed launch");
});

test("IPC disconnect before initialize seals startup and records never-spawned", async t => {
  const directory = await makeRecoveryDirectory();
  const workerRef: { current?: WorkerHarness } = {};
  registerWorkerCleanup(t, directory, () => workerRef.current);
  const home = path.join(directory, "home");
  await mkdir(home, { recursive: true });
  const reservation = await createRecoveryStore(directory).reserve();
  assert.equal(reservation.ok, true);
  if (!reservation.ok) throw new Error("could not reserve recovery fence");
  const activeWorker = await startWorker(directory, reservation.fence.runId, home);
  workerRef.current = activeWorker;

  await activeWorker.waitForSpawn();
  activeWorker.process.disconnect();
  const exit = await activeWorker.waitForExit();
  assert.deepEqual(exit, { code: 0, signal: null });
  const observed = await createRecoveryStore(directory).inspect();
  assert.equal(observed.kind, "terminal");
  if (observed.kind !== "terminal") return;
  assert.equal(observed.receipt.outcome, "never-spawned");
  assert.equal(observed.receipt.code, null);
  assert.equal(observed.receipt.signal, null);
});

test("a wrong invocation run ID cannot observe or retire another pending fence", async t => {
  const directory = await makeRecoveryDirectory();
  const workerRef: { current?: WorkerHarness } = {};
  registerWorkerCleanup(t, directory, () => workerRef.current);
  const home = path.join(directory, "home");
  await mkdir(home, { recursive: true });
  const reservation = await createRecoveryStore(directory).reserve();
  assert.equal(reservation.ok, true);
  if (!reservation.ok) throw new Error("could not reserve recovery fence");
  const activeWorker = await startWorker(directory, randomUUID(), home);
  workerRef.current = activeWorker;

  await activeWorker.waitForSpawn();
  const exit = await activeWorker.waitForExit();
  assert.deepEqual(exit, { code: 1, signal: null });
  assert.deepEqual(await createRecoveryStore(directory).inspect(), { kind: "pending", fence: reservation.fence });
});
