import assert from "node:assert/strict";
import test from "node:test";
import type { RuntimeEvent } from "../../../extension/contracts/index.js";
import { createPiRpcRuntime } from "../pi-rpc-runtime.js";
import { createMemoryConnection, createMemoryProcess, type MemoryConnection } from "./memory-process.js";

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
          : request.type === "get_available_thinking_levels" ? { levels: [] } : undefined;
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
