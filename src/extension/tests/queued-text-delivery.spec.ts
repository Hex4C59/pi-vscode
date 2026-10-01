import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPiRpcRuntime } from "../../adapter/runtime/pi-rpc-runtime.js";
import { createMemoryConnection, createMemoryProcess, type MemoryConnection } from "../../adapter/runtime/tests/memory-process.js";
import { QueuedTextDelivery } from "../queue/queuedTextDelivery.js";

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
          data: request.type === "get_state" ? { sessionId: "fixture-session", sessionFile: "/private-store/fixture.jsonl" }
            : request.type === "get_commands" ? { commands: [] } : undefined });
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
      return new QueuedTextDelivery(runtime, runtime.getSession());
    } };
}

// Failure modes: host retains or sends recognizable credentials / leading slash
// resources, relying on a plain-text adapter which deliberately accepts either.
for (const input of ["credential", "slash"] as const) test(`host queue refuses ${input} before reserve, callback or RPC`, async () => {
  const f = fixture();
  try {
    const host = await f.start();
    const text = input === "credential" ? "password = synthetic-marker" : "  /skill expand";
    let committed = false;
    assert.deepEqual(await host.send(text, "steering", () => { committed = true; }), { kind: "refused", reason: "invalid-text" });
    assert.equal(committed, false); assert.equal(f.commands.length, 3);
    assert.deepEqual(host.snapshot(), { count: 0, utf8Bytes: 0, records: [] });
    const output = path.resolve("dist/wi077-host-delivery"); await mkdir(output, { recursive: true });
    await writeFile(path.join(output, `refused-${input}.json`), JSON.stringify({ schemaVersion: 1, status: "passed", input,
      evidence: "host-delivery-to-real-adapter-with-injected-memory-transport", refusedBeforeReserveCallbackOrWrite: true,
      limits: ["recognizable credentials only", "not upstream clear text or provider/draft/UI integration"],
    }, null, 2) + "\n");
  } finally { await f.runtime.stop(); }
});

test("host rejected recovery candidates share UTF-8 budget and cannot evict earlier text", async () => {
  const f = fixture();
  try {
    const host = await f.start(); f.reject(); const text = "界".repeat(8000);
    for (let i = 0; i < 10; i++) {
      const result = await host.send(text, "steering", () => undefined);
      assert.equal(result.kind, "observed");
    }
    let committed = false;
    assert.deepEqual(await host.send(text, "steering", () => { committed = true; }), { kind: "refused", reason: "capacity" });
    assert.equal(committed, false); assert.equal(f.commands.length, 13);
    const snapshot = host.snapshot(); assert.equal(snapshot.count, 10); assert.equal(snapshot.utf8Bytes, 240000);
    assert.equal(snapshot.records.every(record => record.text === text && record.delivery === "rpc-rejected"), true);
    const output = path.resolve("dist/wi077-host-delivery"); await mkdir(output, { recursive: true });
    await writeFile(path.join(output, "byte-budget.json"), JSON.stringify({ schemaVersion: 1, status: "passed", retainedBytes: snapshot.utf8Bytes,
      evidence: "host-delivery-to-real-adapter-with-injected-memory-transport", rejectedTextSharesQuota: true,
      limits: ["no clear/external queue reservation or explicit recovery UI", "not real pi or installed VSIX"],
    }, null, 2) + "\n");
  } finally { await f.runtime.stop(); }
});

for (const settlement of ["before", "inside"] as const) test(`host queue settlement ${settlement} admission retains only committed draft text`, async () => {
  const f = fixture();
  try {
    const host = await f.start(); const text = "keep committed text";
    if (settlement === "before") f.connection.frame({ type: "agent_settled" });
    let committed = false;
    const result = await host.send(text, "steering", () => { committed = true; f.connection.frame({ type: "agent_settled" }); });
    assert.equal(committed, settlement === "inside"); assert.equal(f.commands.length, 3);
    if (settlement === "before") {
      assert.deepEqual(result, { kind: "refused", reason: "runtime-unavailable" });
      assert.deepEqual(host.snapshot(), { count: 0, utf8Bytes: 0, records: [] });
    } else {
      assert.equal(result.kind, "observed"); const snapshot = host.snapshot(); assert.equal(snapshot.count, 1);
      assert.equal(snapshot.records[0].text, text); assert.equal(snapshot.records[0].delivery, "not-sent");
    }
    const output = path.resolve("dist/wi077-host-delivery"); await mkdir(output, { recursive: true });
    await writeFile(path.join(output, `settlement-${settlement}.json`), JSON.stringify({ schemaVersion: 1, status: "passed", settlement,
      evidence: "host-delivery-to-real-adapter-with-injected-memory-transport", committed, retainedRecords: host.snapshot().count,
      limits: ["callback models draft commit, not actual DraftSubmission integration", "not real pi or installed VSIX"],
    }, null, 2) + "\n");
  } finally { await f.runtime.stop(); }
});

// Failure modes: capacity reserved after callback/write; ACK frees a still-live
// text record; duplicates collapse; thirty-third input evicts retained text.
test("host queue reserves before callback/write and retains 32 duplicate ACKed records without eviction", async () => {
  const f = fixture();
  try {
    const host = await f.start(); const text = "literal 🙂\n同じ";
    for (let i = 0; i < 32; i++) {
      const result = await host.send(text, i % 2 ? "follow-up" : "steering", () => {
        assert.equal(host.snapshot().count, i + 1);
        assert.equal(f.commands.length, i + 3);
      });
      assert.equal(result.kind, "observed");
    }
    let draftCommitted = false;
    assert.deepEqual(await host.send("keep draft", "steering", () => { draftCommitted = true; }), { kind: "refused", reason: "capacity" });
    assert.equal(draftCommitted, false); assert.equal(f.commands.length, 35);
    const snapshot = host.snapshot(); assert.equal(snapshot.count, 32);
    assert.equal(new Set(snapshot.records.map(record => record.id)).size, 32);
    assert.equal(snapshot.records.every(record => record.text === text && record.delivery === "rpc-accepted"), true);
    const output = path.resolve("dist/wi077-host-delivery"); await mkdir(output, { recursive: true });
    await writeFile(path.join(output, "record-budget.json"), JSON.stringify({ schemaVersion: 1, status: "passed", records: snapshot.count,
      evidence: "host-delivery-to-real-adapter-with-injected-memory-transport", ackDoesNotRelease: true, refusedBeforeCallbackOrWrite: true,
      limits: ["not provider/draft/UI integration", "clear reservation and consumption attribution still pending", "not real pi or installed VSIX"],
    }, null, 2) + "\n");
  } finally { await f.runtime.stop(); }
});
