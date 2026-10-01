import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPiRpcRuntime } from "../../adapter/runtime/pi-rpc-runtime.js";
import { createMemoryConnection, createMemoryProcess, type MemoryConnection } from "../../adapter/runtime/tests/memory-process.js";
import { QueuedTextLedger } from "../queue/queuedTextLedger.js";

function fixture() {
  let connection!: MemoryConnection;
  let rejected = false;
  const commands: Record<string, unknown>[] = [];
  const memory = createMemoryProcess(options => {
    const transport = createMemoryConnection((line, done) => {
      const request = JSON.parse(line); commands.push(request);
      queueMicrotask(() => {
        if (request.type === "get_state") transport.frame({ type: "extension_ui_request", method: "notify",
          message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: options.cwd }) });
        transport.frame({ type: "response", id: request.id, command: request.type, success: !(rejected && request.type === "steer"),
          data: request.type === "get_state" ? { sessionId: "fixture-session", sessionFile: "/private-store/fixture.jsonl" } : undefined });
      });
      done(); return true;
    });
    connection = transport; return connection;
  });
  const runtime = createPiRpcRuntime({ process: memory.process, cliPath: () => "fixture", startupModel: () => undefined, gateAccess: async () => undefined });
  return { runtime, commands, get connection() { return connection; }, reject() { rejected = true; },
    async start() {
      assert.equal((await runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
      assert.equal((await runtime.prompt("running")).ok, true); connection.frame({ type: "agent_start" });
      return new QueuedTextLedger(runtime, runtime.getSession());
    } };
}

async function report(name: string, body: Record<string, unknown>): Promise<void> {
  const output = path.resolve("dist/wi077-host-ledger");
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, `${name}.json`), JSON.stringify({
    schemaVersion: 1, status: "passed", evidence: "host-ledger-composition-with-injected-memory-transport",
    limits: ["not DraftSubmission/provider wiring or production UI", "not real pi, F5 or installed VSIX"],
    ...body,
  }, null, 2) + "\n");
}

// Failure modes: clear reserve counted separately from local retention; capacity
// failure still clears/writes; pending recovery double-counts or evicts locals.
test("clear recovery shares the local 32/256KiB budget and refuses without clear or eviction", async () => {
  const f = fixture();
  try {
    const ledger = await f.start();
    const text = "界".repeat(8000);
    for (let i = 0; i < 10; i++) {
      assert.equal((await ledger.send(text, "steering", () => undefined)).kind, "observed");
    }
    ledger.observeQueueUpdated(f.runtime.getSession(), { steering: [text, text], followUp: [] });
    const reserve = ledger.reserveClear({ steering: [text, text], followUp: [] });
    assert.deepEqual(reserve, { ok: false, reason: "capacity" });
    // Host refuses before clear; adapter clear is not attempted when reserve fails.
    assert.equal(f.commands.filter(command => command.type === "clear_queue").length, 0);
    const snap = ledger.capacitySnapshot();
    assert.equal(snap.count, 10);
    assert.equal(snap.utf8Bytes, 240000);
    assert.equal(snap.records.every(record => record.text === text), true);
    await report("clear-capacity", { refusedReason: "capacity", retained: snap.count, clearCommands: 0 });
  } finally { await f.runtime.stop(); }
});

// Failure modes: equal texts across queues attributed as local; duplicate
// multiplicity collapsed; external upstream claimed as UI-sent.
test("ambiguous equal texts stay unknown and duplicate multiplicity is preserved", async () => {
  const f = fixture();
  try {
    const ledger = await f.start();
    const text = "same literal 中";
    assert.equal((await ledger.send(text, "steering", () => undefined)).kind, "observed");
    assert.equal((await ledger.send(text, "follow-up", () => undefined)).kind, "observed");
    ledger.observeQueueUpdated(f.runtime.getSession(), { steering: [text], followUp: [text] });
    ledger.observeUserStarted(f.runtime.getSession(), text);
    const pending = ledger.pendingProjection();
    assert.deepEqual(pending.steering.map(item => item.attribution), ["unknown"]);
    assert.deepEqual(pending.followUp.map(item => item.attribution), ["unknown"]);
    ledger.observeQueueUpdated(f.runtime.getSession(), { steering: [], followUp: [text] });
    ledger.observeQueueUpdated(f.runtime.getSession(), { steering: [], followUp: [] });
    const locals = ledger.capacitySnapshot().records;
    assert.equal(locals.length, 2);
    assert.equal(locals.filter(record => record.attribution === "unknown").length, 2);
    assert.equal(locals.every(record => record.text === text), true);
    ledger.observeQueueUpdated(f.runtime.getSession(), { steering: ["external only"], followUp: [] });
    const external = ledger.pendingProjection().steering;
    assert.equal(external.length, 1);
    assert.equal(external[0].attribution, "external");
    assert.equal(external[0].text, "external only");
    await report("attribution-multiplicity", {
      ambiguousMarkedUnknown: true, preservedLocalRecords: 2, externalAttribution: "external",
    });
  } finally { await f.runtime.stop(); }
});

// Failure modes: sensitive upstream recovered as reusable redacted/altered text;
// capacity not reserved for unavailable host-only retention; raw secret in projection.
test("sensitive upstream recovery is unavailable for reuse and never projected raw", async () => {
  const f = fixture();
  try {
    const ledger = await f.start();
    const secret = "api_key=synthetic-marker";
    const ordinary = "safe follow-up text";
    ledger.observeQueueUpdated(f.runtime.getSession(), { steering: [secret], followUp: [ordinary] });
    const reserve = ledger.reserveClear({ steering: [secret], followUp: [ordinary] });
    assert.deepEqual(reserve, { ok: true });
    ledger.commitClear({ steering: [secret], followUp: [ordinary] });
    const recovered = ledger.recoveryProjection();
    assert.equal(recovered.length, 2);
    const sensitive = recovered.find(item => item.mode === "steering");
    const reusable = recovered.find(item => item.mode === "follow-up");
    assert.equal(sensitive?.reuse, "unavailable");
    assert.equal(sensitive?.text, undefined);
    assert.equal(reusable?.reuse, "reusable");
    assert.equal(reusable?.text, ordinary);
    const encoded = JSON.stringify(ledger.recoveryProjection());
    assert.equal(encoded.includes("synthetic-marker"), false);
    assert.equal(encoded.includes(secret), false);
    assert.equal(ledger.capacitySnapshot().count, 2);
    assert.ok(ledger.capacitySnapshot().utf8Bytes >= Buffer.byteLength(secret, "utf8") + Buffer.byteLength(ordinary, "utf8"));
    await report("sensitive-recovery", { sensitiveReuse: "unavailable", reusablePresent: true, rawSecretProjected: false });
  } finally { await f.runtime.stop(); }
});
