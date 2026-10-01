import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RuntimeEvent } from "../../../../extension/contracts/index.js";
import { createPiRpcRuntime } from "../../pi-rpc-runtime.js";
import { createMemoryConnection, createMemoryProcess, type MemoryConnection } from "../../tests/memory-process.js";

function fixture() {
  let connection!: MemoryConnection;
  let override: ((command: string) => Record<string, unknown> | undefined) | undefined;
  const commands: Record<string, unknown>[] = [];
  const events: RuntimeEvent[] = [];
  const held = new Set<string>();
  let stallPromptWrite = false;
  let completeWrite: (() => void) | undefined;
  const memory = createMemoryProcess(options => {
    const transport = createMemoryConnection((line, done) => {
      const request = JSON.parse(line);
      commands.push(request);
      queueMicrotask(() => {
        if (held.has(request.type)) return;
        if (request.type === "get_state") transport.frame({
          type: "extension_ui_request", method: "notify",
          message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: options.cwd }),
        });
        const data = request.type === "get_state" ? { sessionId: "saved-id", sessionFile: "/private-store/saved.jsonl" }
          : request.type === "get_available_models" ? { models: [] }
          : request.type === "get_available_thinking_levels" ? { levels: [] }
          : request.type === "clear_queue" ? { steering: [], followUp: [] } : undefined;
        transport.frame({ type: "response", id: request.id, command: request.type, success: true, data, ...override?.(request.type) });
      });
      if (request.type === "prompt" && stallPromptWrite) { completeWrite = done; return false; }
      done();
      return true;
    });
    connection = transport;
    return connection;
  });
  const runtime = createPiRpcRuntime({ process: memory.process, cliPath: () => "fixture", startupModel: () => undefined, gateAccess: async () => undefined });
  runtime.subscribe(event => events.push(event));
  return {
    runtime, memory, commands, events,
    get connection() { return connection; },
    override(value: typeof override) { override = value; },
    hold(command: string) { held.add(command); },
    resume(command: string) { held.delete(command); },
    stallPrompt() { stallPromptWrite = true; },
    finishWrite() { completeWrite?.(); connection.stdin.emit("drain"); },
    start: () => runtime.start({ cwd: "/project", projectTrust: "no-approve" }),
  };
}

// Stop/recall failure modes written before implementation: discarded clear data,
// callback after abort, failed abort erasing recall, malformed/oversized data,
// duplicate clear on concurrent Stop, expired observation and late retired ACK.
for (const abortFails of [false, true]) test(`Stop preserves confirmed clear text before abort, including abort failure=${abortFails}`, async () => {
  const f = fixture();
  const recalled: unknown[] = [];
  const queue = { steering: ["same 中", "same 中"], followUp: ["later"] };
  try {
    assert.equal((await f.start()).ok, true);
    f.override(command => command === "clear_queue" ? { data: queue }
      : command === "abort" && abortFails ? { success: false } : undefined);
    const result = await f.runtime.abortTask?.(snapshot => {
      assert.equal(f.commands.some(command => command.type === "abort"), false);
      recalled.push(snapshot);
    });
    assert.equal(result?.ok, !abortFails);
    assert.deepEqual(recalled, [queue]);
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "clear_queue", "abort"]);
    assert.equal(f.memory.endCalls, 0);
    const output = path.resolve("dist/wi077-stop-recall");
    await mkdir(output, { recursive: true });
    await writeFile(path.join(output, abortFails ? "abort-failure.json" : "success.json"), JSON.stringify({
      schemaVersion: 1, status: "passed", evidence: "injected-memory-JSONL-transport",
      beforeAbort: true, retainedAfterAbortFailure: abortFails, records: 3,
      limits: ["callback fixture only; host ledger and UI not integrated", "not real runtime or installed VSIX"],
    }, null, 2) + "\n");
  } finally { await f.runtime.stop(); }
});

for (const [name, data] of [
  ["missing data", undefined], ["null", null], ["missing queue", { steering: [] }],
  ["invalid text", { steering: [7], followUp: [] }],
  ["excess records", { steering: Array(33).fill("a"), followUp: [] }],
  ["excess bytes", { steering: ["中".repeat(87382)], followUp: [] }],
] as const) test(`Stop refuses ${name} clear result without callback, abort or fabricated recall`, async () => {
  const f = fixture();
  let saved = 0;
  try {
    assert.equal((await f.start()).ok, true);
    f.override(command => command === "clear_queue" ? { data } : undefined);
    assert.equal((await f.runtime.abortTask?.(() => { saved++; }))?.ok, false);
    assert.equal(saved, 0);
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "clear_queue"]);
    assert.equal(f.runtime.getSession(), 0);
    assert.deepEqual(f.memory.releases, ["uncertain"]);
    assert.equal(f.memory.endCalls, 0);
  } finally { await f.runtime.stop(); }
});

test("concurrent Stop cannot clear twice or deliver a callback to the losing request", async () => {
  const f = fixture();
  let first: Promise<unknown> | undefined;
  let second: Promise<unknown> | undefined;
  const saved: string[] = [];
  try {
    assert.equal((await f.start()).ok, true);
    f.hold("clear_queue");
    first = f.runtime.abortTask?.(() => { saved.push("first"); });
    f.connection.frame({ type: "agent_settled" }); // Settlement is not completion of an in-flight clear.
    assert.equal((await f.runtime.prompt("must not enter while Stop clears")).ok, false);
    second = f.runtime.abortTask?.(() => { saved.push("second"); });
    const clears = f.commands.filter(command => command.type === "clear_queue");
    assert.equal(clears.length, 1);
    assert.equal(((await second) as { ok: boolean }).ok, false);
    f.connection.frame({ type: "response", id: clears[0].id, command: "clear_queue", success: true, data: { steering: ["kept"], followUp: [] } });
    assert.equal(((await first) as { ok: boolean }).ok, true);
    assert.deepEqual(saved, ["first"]);
  } finally { await f.runtime.stop(); await Promise.allSettled([first, second]); }
});

test("clear callback failure preserves its saved text but prevents abort and replay", async () => {
  const f = fixture();
  const saved: unknown[] = [];
  try {
    assert.equal((await f.start()).ok, true);
    f.override(command => command === "clear_queue" ? { data: { steering: ["kept"], followUp: [] } } : undefined);
    assert.equal((await f.runtime.abortTask?.(snapshot => { saved.push(snapshot); throw new Error("synthetic private failure"); }))?.ok, false);
    assert.deepEqual(saved, [{ steering: ["kept"], followUp: [] }]);
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "clear_queue"]);
    assert.deepEqual(f.memory.releases, ["uncertain"]);
    assert.doesNotMatch(JSON.stringify(f.events), /private failure/);
  } finally { await f.runtime.stop(); }
});

test("expired clear ACK cannot save text or continue abort", async context => {
  const f = fixture();
  let time = 0;
  context.mock.method(performance, "now", () => time);
  let saved = 0;
  try {
    assert.equal((await f.start()).ok, true);
    f.hold("clear_queue");
    const stopping = f.runtime.abortTask?.(() => { saved++; });
    const request = f.commands.at(-1)!;
    time = 5001;
    f.connection.frame({ type: "response", id: request.id, command: "clear_queue", success: true, data: { steering: ["too late"], followUp: [] } });
    assert.equal((await stopping)?.ok, false);
    assert.equal(saved, 0);
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "clear_queue"]);
    assert.deepEqual(f.memory.releases, ["uncertain"]);
  } finally { await f.runtime.stop(); }
});

test("disconnected clear and old-session ACK cannot deliver recovery to replacement", async () => {
  const f = fixture();
  let saved = 0;
  try {
    assert.equal((await f.start()).ok, true);
    f.hold("clear_queue");
    const stopping = f.runtime.abortTask?.(() => { saved++; });
    const request = f.commands.at(-1)!;
    const old = f.connection;
    old.lose();
    assert.equal((await stopping)?.ok, false);
    assert.equal((await f.runtime.recoverOwnedRuntime?.())?.ok, true);
    assert.equal((await f.start()).ok, true);
    old.frame({ type: "response", id: request.id, command: "clear_queue", success: true, data: { steering: ["old"], followUp: [] } });
    assert.equal(saved, 0);
    assert.equal(f.commands.filter(command => command.type === "abort").length, 0);
    assert.notEqual(f.runtime.getSession(), 0);
  } finally { await f.runtime.stop(); }
});

// WI-077 failure modes before implementation: lost multiplicity/Unicode, ACK or
// queue removal treated as settlement, malformed or excessive text made empty,
// partial projection, old-session pollution, and oversized ordinary user input
// retained for correlation. This is the actual JSONL -> runtime subscription seam.
test("queue snapshot and consumption travel independently through a live task without settling it", async () => {
  const f = fixture();
  try {
    assert.equal((await f.start()).ok, true);
    const session = f.runtime.getSession();
    assert.equal((await f.runtime.prompt("base task")).ok, true);
    f.connection.frame({ type: "agent_start" });
    const text = "same literal 中\u2028text";
    f.connection.frame({ type: "queue_update", steering: [text, text], followUp: ["later"], upstreamMetadata: "not projected" });
    f.connection.frame({ type: "queue_update", steering: [text], followUp: ["later"] });
    f.connection.frame({ type: "message_start", message: { role: "user", content: [{ type: "text", text: "same literal " }, { type: "text", text: "中\u2028text" }], timestamp: 0 } });
    f.connection.frame({ type: "queue_update", steering: [], followUp: [] });
    assert.deepEqual(f.events, [
      { kind: "queue_updated", session, steering: [text, text], followUp: ["later"] },
      { kind: "queue_updated", session, steering: [text], followUp: ["later"] },
      { kind: "user_message_started", session, text },
      { kind: "queue_updated", session, steering: [], followUp: [] },
    ]);
    assert.equal((await f.runtime.prompt("must remain busy")).ok, false);
    assert.equal(f.commands.filter(command => command.type === "prompt").length, 1);
    f.connection.frame({ type: "agent_settled" });
    assert.equal((await f.runtime.prompt("next ordinary task")).ok, true);
    const output = path.resolve("dist/wi077-queue-transport");
    await mkdir(output, { recursive: true });
    await writeFile(path.join(output, "report.json"), JSON.stringify({
      schemaVersion: 1, status: "passed", evidence: "injected-memory-JSONL-transport",
      events: f.events.map(event => event.kind), preserved: ["multiplicity", "Unicode", "event order", "task occupancy"],
      limits: ["no queue send/recall API", "no host recovery/UI", "not real runtime, F5 or installed VSIX"],
    }, null, 2) + "\n");
  } finally { await f.runtime.stop(); }
});

for (const [name, queue] of [
  ["missing follow-up", { steering: [] }],
  ["invalid follow-up", { steering: ["must not partially emit"], followUp: [null] }],
  ["invalid steering", { steering: [7], followUp: [] }],
  ["non-array", { steering: "text", followUp: [] }],
  ["combined count", { steering: Array(17).fill("a"), followUp: Array(16).fill("b") }],
  ["UTF-8 aggregate", { steering: Array(32).fill("中".repeat(2731)), followUp: [] }],
] as const) test(`queue transport fails closed on ${name} without a fabricated empty queue`, async () => {
  const f = fixture();
  try {
    assert.equal((await f.start()).ok, true);
    const session = f.runtime.getSession();
    const old = f.connection;
    old.stdout.write([
      { type: "queue_update", ...queue },
      { type: "queue_update", steering: [], followUp: [] },
      { type: "message_start", message: { role: "user", content: "late consumed text" } },
    ].map(frame => JSON.stringify(frame) + "\n").join(""));
    assert.equal(f.runtime.getSession(), 0);
    assert.deepEqual(f.events.map(event => event.kind), ["runtime_error"]);
    assert.equal(f.events[0].session, session);
    assert.doesNotMatch(JSON.stringify(f.events), /partially emit|late consumed/);
    assert.deepEqual(f.memory.releases, ["uncertain"]);
    assert.equal(f.memory.endCalls, 0);
    assert.equal(old.stdout.listenerCount("data"), 0);
  } finally { await f.runtime.stop(); }
});

test("bounded queue text preserves the exact UTF-8 boundary, duplicates and empty entries", async () => {
  const f = fixture();
  try {
    assert.equal((await f.start()).ok, true);
    const texts = Array(32).fill("é".repeat(4096));
    f.connection.frame({ type: "queue_update", steering: texts, followUp: [] });
    f.connection.frame({ type: "queue_update", steering: ["", " "], followUp: [""] });
    assert.deepEqual(f.events, [
      { kind: "queue_updated", session: f.runtime.getSession(), steering: texts, followUp: [] },
      { kind: "queue_updated", session: f.runtime.getSession(), steering: ["", " "], followUp: [""] },
    ]);
    assert.deepEqual(f.memory.releases, []);
  } finally { await f.runtime.stop(); }
});

test("user consumption is host-only, bounded and never truncates oversized or mixed attachment text", async () => {
  const f = fixture();
  try {
    assert.equal((await f.start()).ok, true);
    const session = f.runtime.getSession();
    for (const content of [" literal ", [{ type: "text", text: "api_key=synthetic-marker" }], "x".repeat(8001), [{ type: "text", text: "short" }, { type: "image", data: "not correlated" }]]) {
      f.connection.frame({ type: "message_start", message: { role: "user", content } });
      f.connection.frame({ type: "message_end", message: { role: "user", content } });
    }
    assert.deepEqual(f.events, [
      { kind: "user_message_started", session, text: " literal " },
      { kind: "user_message_started", session, text: "api_key=synthetic-marker" },
      { kind: "user_message_started", session, text: null },
      { kind: "user_message_started", session, text: null },
    ]);
    assert.notEqual(f.runtime.getSession(), 0);
  } finally { await f.runtime.stop(); }
});

for (const content of [null, {}, [null], [{ type: "text", text: 4 }]]) test("malformed user message cannot produce consumption evidence", async () => {
  const f = fixture();
  try {
    assert.equal((await f.start()).ok, true);
    f.connection.frame({ type: "message_start", message: { role: "user", content } });
    assert.equal(f.runtime.getSession(), 0);
    assert.deepEqual(f.events.map(event => event.kind), ["runtime_error"]);
    assert.deepEqual(f.memory.releases, ["uncertain"]);
  } finally { await f.runtime.stop(); }
});

test("retired transports cannot publish queue or consumption into the replacement session", async () => {
  const f = fixture();
  try {
    assert.equal((await f.start()).ok, true);
    const old = f.connection;
    await f.runtime.stop();
    assert.equal((await f.start()).ok, true);
    const session = f.runtime.getSession();
    old.frame({ type: "queue_update", steering: ["old"], followUp: [] });
    old.frame({ type: "message_start", message: { role: "user", content: "old" } });
    f.connection.frame({ type: "queue_update", steering: [], followUp: ["new"] });
    assert.deepEqual(f.events, [{ kind: "queue_updated", session, steering: [], followUp: ["new"] }]);
  } finally { await f.runtime.stop(); }
});

for (const event of [
  { type: "message_end", message: { role: "assistant", content: [null] } },
  { type: "tool_execution_end", toolCallId: "one", toolName: "read", isError: false, result: { content: [null] } },
]) test(`${event.type} with null content fails the connection without throwing or partial completion`, async () => {
  const f = fixture();
  try {
    assert.equal((await f.start()).ok, true);
    const session = f.runtime.getSession();
    assert.doesNotThrow(() => f.connection.frame(event));
    assert.equal(f.runtime.getSession(), 0);
    assert.deepEqual(f.memory.releases, ["uncertain"]);
    assert.equal(f.events.length, 1);
    assert.equal(f.events[0].kind, "runtime_error");
    assert.equal(f.events[0].session, session);
    assert.equal(f.memory.endCalls, 0);
  } finally { await f.runtime.stop(); }
});

// rpc-replies.spec.ts owns the full malformed-field matrix. Here each caller
// must handle a wrong command and an invalid success flag without retrying.
const invalidReplies = [{ command: "unrelated_command" }, { success: "false" }];
for (const operation of ["projection", "model", "thinking", "prompt", "prepared-prompt", "clear_queue", "abort"] as const) {
  for (const bad of invalidReplies) test(`${operation} rejects malformed acknowledgement ${JSON.stringify(bad)}`, async () => {
    const f = fixture();
    try {
      assert.equal((await f.start()).ok, true);
      const session = f.runtime.getSession();
      f.override(command => operation === "abort" && command === "clear_queue" ? undefined : bad);
      const result = operation === "projection" ? await f.runtime.getModelProjection()
        : operation === "model" ? await f.runtime.setModel("provider", "model")
        : operation === "thinking" ? await f.runtime.setThinkingLevel("medium")
        : operation === "prompt" ? await f.runtime.prompt("test")
        : operation === "prepared-prompt" ? await f.runtime.preparePrompt({ kind: "plain", body: "test" }, session).send(() => undefined)
        : await f.runtime.abortTask?.();
      assert.ok(result);
      if ("delivery" in result) assert.equal(result.delivery, "unknown");
      else assert.equal(result.ok, false);
      assert.equal(f.runtime.getSession(), 0);
      assert.deepEqual(f.memory.releases, ["uncertain"]);
      assert.equal(f.events.filter(event => event.kind === "runtime_error").length, 1);
      assert.equal(f.connection.stdout.listenerCount("data"), 0);
      assert.equal(f.connection.stdout.listenerCount("end"), 0);
      assert.equal(f.connection.stdin.listenerCount("drain"), 0);
      assert.equal(f.commands.length, operation === "abort" ? 3 : 2);
      assert.equal(f.memory.endCalls, 0);
    } finally { await f.runtime.stop(); }
  });
}

test("a corrupt ACK before write completion ends the send immediately and late completion cannot replay it", async () => {
  const f = fixture();
  try {
    assert.equal((await f.start()).ok, true);
    f.stallPrompt();
    f.override(() => ({ success: "invalid", error: "private-synthetic-body" }));
    const prepared = f.runtime.preparePrompt({ kind: "plain", body: "test" }, f.runtime.getSession());
    assert.equal((await prepared.send(() => undefined)).delivery, "unknown");
    f.finishWrite();
    assert.equal((await prepared.send(() => undefined)).delivery, "not-sent");
    assert.equal(f.commands.filter(command => command.type === "prompt").length, 1);
    assert.equal(f.connection.stdin.listenerCount("drain"), 0);
    assert.doesNotMatch(JSON.stringify(f.events), /private-synthetic-body|invalid/);
  } finally { await f.runtime.stop(); }
});

test("invalid event revokes every pending operation and drops later lines in the same stdout chunk", async () => {
  const f = fixture();
  try {
    assert.equal((await f.start()).ok, true);
    f.hold("get_state"); f.hold("prompt");
    const projection = f.runtime.getModelProjection();
    const prompt = f.runtime.preparePrompt({ kind: "plain", body: "test" }, f.runtime.getSession()).send(() => undefined);
    const oldConnection = f.connection;
    const request = f.commands.at(-1)!;
    oldConnection.stdout.write([
      { type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "not projected" }, null] } },
      { type: "response", id: request.id, command: "prompt", success: true },
      { type: "agent_settled" },
      { type: "extension_ui_request", method: "confirm", id: "late-dialog", title: "late" },
    ].map(value => JSON.stringify(value) + "\n").join(""));
    assert.equal((await projection).ok, false);
    assert.equal((await prompt).delivery, "unknown");
    assert.deepEqual(f.events.map(event => event.kind), ["runtime_error"]);
    assert.equal(f.commands.length, 3, "no response is written for the same-chunk retired dialog");
    assert.equal((await f.start()).ok, false, "uncertain owner requires explicit recovery");
    assert.equal((await f.runtime.recoverOwnedRuntime?.())?.ok, true);
    // Restore normal readiness responses for the new connection.
    // A separate fixture would not prove that the old reader is detached from this runtime.
    f.override(undefined);
    // get_state was held only for the failed projection.
    f.resume("get_state");
    assert.equal((await f.start()).ok, true);
    const newSession = f.runtime.getSession();
    const before = f.events.length;
    oldConnection.frame({ type: "message_end", message: { role: "assistant", content: [null] } });
    oldConnection.frame({ type: "agent_settled" });
    assert.equal(f.runtime.getSession(), newSession);
    assert.equal(f.events.length, before);
    assert.equal((await f.runtime.getModelProjection()).ok, true);
  } finally { await f.runtime.stop(); }
});

test("malformed event during Stop settlement cannot become successful Stop after occupancy resets", async () => {
  const f = fixture();
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("test")).ok, true);
    const stopping = f.runtime.abortTask?.();
    // Let the scripted ACKs finish so Stop is observing agent settlement.
    await new Promise<void>(resolve => setImmediate(resolve));
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "prompt", "clear_queue", "abort"]);
    f.connection.frame({ type: "message_update", assistantMessageEvent: { type: "text_delta", delta: null } });
    assert.equal((await stopping)?.ok, false);
    assert.deepEqual(f.memory.releases, ["uncertain"]);
    assert.equal(f.events.filter(event => event.kind === "runtime_error").length, 1);
  } finally { await f.runtime.stop(); }
});

test("a valid remote rejection stays distinct from a protocol error and keeps the runtime usable", async () => {
  const f = fixture();
  try {
    assert.equal((await f.start()).ok, true);
    f.override(() => ({ success: false, error: "synthetic failure" }));
    assert.equal((await f.runtime.prompt("test")).ok, false);
    assert.equal((await f.runtime.preparePrompt({ kind: "plain", body: "test" }, f.runtime.getSession()).send(() => undefined)).delivery, "rpc-rejected");
    assert.equal((await f.runtime.setModel("provider", "model")).ok, false);
    assert.notEqual(f.runtime.getSession(), 0);
    assert.deepEqual(f.events, []);
    assert.deepEqual(f.memory.releases, []);
    f.override(undefined);
    assert.equal((await f.runtime.getModelProjection()).ok, true);
  } finally { await f.runtime.stop(); }
});

for (const response of [
  { command: "set_model", success: true },
  { command: "get_state", success: "not-a-boolean" },
  { command: "set_model", success: "not-a-boolean" },
]) test(`startup rejects ${JSON.stringify(response)}`, async () => {
  const f = fixture();
  f.override(() => response);
  try {
    assert.equal((await f.start()).ok, false);
    assert.equal(f.runtime.getSession(), 0);
    assert.deepEqual(f.memory.releases, ["uncertain"]);
    assert.equal(f.commands.length, 1);
    assert.equal(f.memory.endCalls, 0);
  } finally { await f.runtime.stop(); }
});
