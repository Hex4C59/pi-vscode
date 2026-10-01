import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PromptResult, RuntimeEvent } from "../../../../extension/contracts/index.js";
import { createPiRpcRuntime } from "../../pi-rpc-runtime.js";
import { createMemoryConnection, createMemoryProcess, type MemoryConnection } from "../../tests/memory-process.js";

function fixture() {
  let connection!: MemoryConnection;
  let override: ((command: string) => Record<string, unknown> | undefined) | undefined;
  const commands: Record<string, unknown>[] = [];
  const events: RuntimeEvent[] = [];
  const held = new Set<string>();
  let stallPromptWrite = false;
  let stalledCommand = "prompt";
  let completeWrite: (() => void) | undefined;
  let queueWriteFault: "throw" | "callback" | undefined;
  const memory = createMemoryProcess(options => {
    const transport = createMemoryConnection((line, done) => {
      const request = JSON.parse(line);
      commands.push(request);
      if (request.type === "steer" && queueWriteFault === "throw") throw new Error("PRIVATE_STREAM_ERROR");
      if (request.type === "steer" && queueWriteFault === "callback") { done(new Error("PRIVATE_STREAM_ERROR")); return false; }
      queueMicrotask(() => {
        if (held.has(request.type)) return;
        if (request.type === "get_state") transport.frame({
          type: "extension_ui_request", method: "notify",
          message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: options.cwd }),
        });
        const data = request.type === "get_state" ? { sessionId: "saved-id", sessionFile: "/private-store/saved.jsonl" }
          : request.type === "get_commands" ? { commands: [] }
          : request.type === "get_available_models" ? { models: [] }
          : request.type === "get_available_thinking_levels" ? { levels: [] }
          : request.type === "clear_queue" ? { steering: [], followUp: [] } : undefined;
        transport.frame({ type: "response", id: request.id, command: request.type, success: true, data, ...override?.(request.type) });
      });
      if (request.type === stalledCommand && stallPromptWrite) { completeWrite = done; return false; }
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
    stallQueue() { stalledCommand = "steer"; stallPromptWrite = true; },
    failQueue(kind: "throw" | "callback") { queueWriteFault = kind; },
    finishWrite() { completeWrite?.(); connection.stdin.emit("drain"); },
    start: () => runtime.start({ cwd: "/project", projectTrust: "no-approve" }),
  };
}

// Queue delivery seam failure modes: wrong public command, replay, changed literal
// text, idle fallback, ACK releasing task occupancy, incomplete write/drain, Stop
// clearing before a pending attempt, disconnect/timeout retry and stale session.
test("running task accepts distinct literal queue commands once without releasing task occupancy", async () => {
  const f = fixture();
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("running")).ok, true);
    f.connection.frame({ type: "agent_start" });
    let attempts = 0;
    for (const mode of ["steering", "follow-up"] as const) {
      const token = f.runtime.prepareQueuedText?.("  literal 中\nnext  ", mode, f.runtime.getSession());
      assert.ok(token);
      assert.equal((await token.send(() => { attempts++; })).delivery, "rpc-accepted");
      assert.equal((await token.send(() => { attempts++; })).delivery, "not-sent");
    }
    assert.equal(attempts, 2);
    assert.deepEqual(f.commands.slice(3).map(({ type, message }) => ({ type, message })), [
      { type: "steer", message: "  literal 中\nnext  " },
      { type: "follow_up", message: "  literal 中\nnext  " },
    ]);
    assert.equal((await f.runtime.prompt("still occupied")).ok, false);
    const output = path.resolve("dist/wi077-queued-send");
    await mkdir(output, { recursive: true });
    await writeFile(path.join(output, "report.json"), JSON.stringify({ schemaVersion: 1, status: "passed",
      evidence: "injected-memory-JSONL-transport", preserved: ["distinct modes", "literal Unicode", "one attempt", "task occupancy"],
      limits: ["no host ledger/draft/UI admission", "not real runtime or installed VSIX"],
    }, null, 2) + "\n");
  } finally { await f.runtime.stop(); }
});

test("Stop fences queue sends and waits for ACK plus callback/drain before destructive clear", async () => {
  const f = fixture();
  let pending: Promise<unknown> | undefined;
  let stopping: Promise<unknown> | undefined;
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("running")).ok, true);
    f.connection.frame({ type: "agent_start" });
    f.hold("steer"); f.stallQueue();
    const token = f.runtime.prepareQueuedText?.("queued", "steering", f.runtime.getSession());
    assert.ok(token);
    let delivered = false;
    pending = token.send(() => undefined).then(result => { delivered = true; return result; });
    const request = f.commands.at(-1)!;
    f.connection.frame({ type: "response", id: request.id, command: "steer", success: true });
    await Promise.resolve();
    assert.equal(delivered, false);
    f.override(command => { if (command === "abort") f.connection.frame({ type: "agent_settled" }); return undefined; });
    stopping = f.runtime.abortTask?.();
    assert.equal(f.commands.some(command => command.type === "clear_queue"), false);
    const refused = f.runtime.prepareQueuedText?.("too late", "follow-up", f.runtime.getSession());
    assert.equal((await refused?.send(() => undefined))?.delivery, "not-sent");
    f.finishWrite();
    assert.deepEqual(await pending, { delivery: "rpc-accepted" });
    assert.deepEqual(await stopping, { ok: true });
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "prompt", "steer", "clear_queue", "abort"]);
    assert.equal(f.connection.stdin.listenerCount("drain"), 0);
  } finally { await f.runtime.stop(); await Promise.allSettled([pending, stopping]); }
});

test("Stop requested inside queue attempt admission still waits before clear", async () => {
  const f = fixture();
  let stopping: Promise<unknown> | undefined;
  let clearedInsideAdmission = false;
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("running")).ok, true);
    f.connection.frame({ type: "agent_start" });
    f.override(command => { if (command === "abort") f.connection.frame({ type: "agent_settled" }); return undefined; });
    const token = f.runtime.prepareQueuedText?.("queued", "steering", f.runtime.getSession());
    assert.ok(token);
    const result = await token.send(() => {
      stopping = f.runtime.abortTask?.();
      clearedInsideAdmission = f.commands.some(command => command.type === "clear_queue");
    });
    assert.equal(clearedInsideAdmission, false);
    assert.equal(result.delivery, "rpc-accepted");
    assert.deepEqual(await stopping, { ok: true });
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "prompt", "steer", "clear_queue", "abort"]);
  } finally { await f.runtime.stop(); await stopping; }
});

for (const phase of ["write", "ack"] as const) test(`queue ${phase} observations after budget fail even before the timer runs`, async context => {
  const f = fixture();
  let time = 0;
  context.mock.method(performance, "now", () => time);
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("running")).ok, true);
    f.connection.frame({ type: "agent_start" });
    if (phase === "write") f.stallQueue(); else f.hold("steer");
    const token = f.runtime.prepareQueuedText?.("queued", "steering", f.runtime.getSession());
    assert.ok(token);
    const pending = token.send(() => undefined);
    await Promise.resolve();
    time = phase === "write" ? 5001 : 30001;
    if (phase === "write") f.finishWrite();
    else {
      const request = f.commands.at(-1)!;
      f.connection.frame({ type: "response", id: request.id, command: "steer", success: true });
    }
    assert.deepEqual(await pending, { delivery: "unknown", code: phase === "write" ? "write-failed" : "ack-timeout" });
    assert.equal((await token.send(() => undefined)).delivery, "not-sent");
    assert.deepEqual(f.memory.releases, ["uncertain"]);
    assert.equal(f.memory.endCalls, 0);
    assert.equal(f.connection.stdin.listenerCount("drain"), 0);
  } finally { await f.runtime.stop(); }
});

for (const change of ["settlement", "revocation"] as const) test(`queue admission callback ${change} prevents a later physical write`, async context => {
  const f = fixture();
  let revoked: Promise<void> | undefined;
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("running")).ok, true);
    f.connection.frame({ type: "agent_start" });
    const write = context.mock.method(f.connection.stdin, "write");
    const token = f.runtime.prepareQueuedText?.("must not enter", "steering", f.runtime.getSession());
    assert.ok(token);
    const result = await token.send(() => {
      if (change === "settlement") f.connection.frame({ type: "agent_settled" });
      else revoked = f.runtime.stop();
    });
    assert.equal(write.mock.callCount(), 0);
    assert.deepEqual(result, { delivery: change === "settlement" ? "not-sent" : "unknown", code: "runtime-lost" });
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "prompt"]);
    assert.equal((await token.send(() => undefined)).delivery, "not-sent");
    assert.equal(f.connection.stdin.listenerCount("drain"), 0);
    assert.equal(f.memory.endCalls, 0);
  } finally { await f.runtime.stop(); await revoked; }
});

test("task settlement does not admit ordinary sends or runtime mutations while queue ACK is pending", async () => {
  const f = fixture();
  let pending: Promise<unknown> | undefined;
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("running")).ok, true);
    f.connection.frame({ type: "agent_start" }); f.hold("steer");
    const token = f.runtime.prepareQueuedText?.("queued", "steering", f.runtime.getSession());
    assert.ok(token);
    pending = token.send(() => undefined);
    const request = f.commands.at(-1)!;
    f.connection.frame({ type: "agent_settled" });
    const direct = await f.runtime.prompt("must wait");
    const prepared = await f.runtime.preparePrompt({ kind: "plain", body: "must also wait" }, f.runtime.getSession()).send(() => undefined);
    const mutation = await f.runtime.setThinkingLevel("off");
    const checkpoint = await f.runtime.checkpointRestart?.({ id: "saved-id", path: "/private-store/saved.jsonl" });
    assert.equal(direct.ok, false);
    assert.equal(prepared.delivery, "not-sent");
    assert.equal(mutation.ok, false);
    assert.deepEqual(checkpoint, { kind: "unavailable" });
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "prompt", "steer"]);
    f.connection.frame({ type: "response", id: request.id, command: "steer", success: true });
    assert.deepEqual(await pending, { delivery: "rpc-accepted" });
    assert.equal((await f.runtime.prompt("available after observation")).ok, true);
    const output = path.resolve("dist/wi077-queued-send");
    await mkdir(output, { recursive: true });
    await writeFile(path.join(output, "fence-report.json"), JSON.stringify({ schemaVersion: 1, status: "passed",
      evidence: "injected-memory-JSONL-transport", pendingQueueAckFences: ["direct prompt", "prepared prompt", "thinking mutation", "checkpoint restart"],
      limits: ["no host ledger/UI admission", "not real runtime or installed VSIX"],
    }, null, 2) + "\n");
  } finally { await f.runtime.stop(); await pending; }
});

test("releasing a settled task with queue ACK pending retains uncertain ownership", async () => {
  const f = fixture();
  let pending: Promise<unknown> | undefined;
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("running")).ok, true);
    f.connection.frame({ type: "agent_start" }); f.hold("steer");
    const token = f.runtime.prepareQueuedText?.("queued", "steering", f.runtime.getSession());
    assert.ok(token);
    pending = token.send(() => undefined);
    f.connection.frame({ type: "agent_settled" });
    await f.runtime.stop();
    assert.deepEqual(await pending, { delivery: "unknown", code: "runtime-lost" });
    assert.deepEqual(f.memory.releases, ["uncertain"]);
    assert.equal(f.memory.endCalls, 0);
    assert.equal(f.connection.stdin.listenerCount("drain"), 0);
  } finally { await f.runtime.stop(); await pending; }
});

// Failure modes: reply watch consumed by early ACK leaves write observer alive;
// disconnect then waits five seconds, leaks drain listeners or faults replacement.
for (const phase of ["before-ack", "after-ack"] as const) test(`queue disconnect ${phase} immediately retires write observation without harming replacement`, async context => {
  const f = fixture();
  let pending: Promise<unknown> | undefined;
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("running")).ok, true);
    f.connection.frame({ type: "agent_start" }); f.hold("steer"); f.stallQueue();
    context.mock.timers.enable({ apis: ["setTimeout"] });
    const token = f.runtime.prepareQueuedText?.("queued", "steering", f.runtime.getSession());
    assert.ok(token);
    let observed: unknown;
    pending = token.send(() => undefined).then(result => { observed = result; return result; });
    const request = f.commands.at(-1)!;
    const ack = { type: "response", id: request.id, command: "steer", success: true };
    const retired = f.connection;
    if (phase === "after-ack") retired.frame(ack);
    retired.lose();
    await Promise.resolve();
    assert.deepEqual(observed, { delivery: "unknown", code: "runtime-lost" });
    assert.equal(retired.stdin.listenerCount("drain"), 0);
    assert.deepEqual(f.memory.releases, ["uncertain"]);
    assert.equal((await f.runtime.recoverOwnedRuntime?.())?.ok, true);
    assert.equal((await f.start()).ok, true);
    const session = f.runtime.getSession(); const eventCount = f.events.length;
    retired.frame(ack); f.finishWrite(); context.mock.timers.tick(30000);
    assert.equal(f.runtime.getSession(), session);
    assert.equal(f.events.length, eventCount);
    assert.equal(f.memory.endCalls, 0);
    const output = path.resolve("dist/wi077-queued-send");
    await mkdir(output, { recursive: true });
    await writeFile(path.join(output, `disconnect-${phase}.json`), JSON.stringify({ schemaVersion: 1, status: "passed", phase,
      evidence: "injected-memory-JSONL-transport", immediateRetirement: true, replacementPreserved: true,
      limits: ["mock setTimeout scheduler", "not host recovery/UI or real runtime"],
    }, null, 2) + "\n");
  } finally { await f.runtime.stop(); context.mock.timers.tick(30000); await pending; }
});

for (const phase of ["write", "ack"] as const) test(`queue ${phase} scheduled timer retires once without retry or process end`, async context => {
  const f = fixture();
  let pending: Promise<unknown> | undefined;
  let time = 0;
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("running")).ok, true);
    f.connection.frame({ type: "agent_start" }); f.hold("steer");
    if (phase === "write") f.stallQueue();
    context.mock.method(performance, "now", () => time);
    context.mock.timers.enable({ apis: ["setTimeout"] });
    const token = f.runtime.prepareQueuedText?.("queued", "steering", f.runtime.getSession()); assert.ok(token);
    let observed: unknown;
    pending = token.send(() => undefined).then(result => { observed = result; return result; });
    const budget = phase === "write" ? 5000 : 30000;
    time = budget - 1; context.mock.timers.tick(budget - 1); await Promise.resolve();
    assert.equal(observed, undefined);
    time = budget; context.mock.timers.tick(1);
    assert.deepEqual(await pending, { delivery: "unknown", code: phase === "write" ? "write-failed" : "ack-timeout" });
    assert.equal((await token.send(() => undefined)).delivery, "not-sent");
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "prompt", "steer"]);
    assert.deepEqual(f.memory.releases, ["uncertain"]);
    assert.equal(f.memory.endCalls, 0);
    assert.equal(f.connection.stdin.listenerCount("drain"), 0);
  } finally { await f.runtime.stop(); context.mock.timers.tick(30000); await pending; }
});

test("Stop queue-wait timer expires within its control budget without destructive clear or abort", async context => {
  const f = fixture();
  let pending: Promise<unknown> | undefined; let stopping: Promise<PromptResult> | undefined;
  let time = 0;
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("running")).ok, true);
    f.connection.frame({ type: "agent_start" }); f.hold("steer");
    context.mock.method(performance, "now", () => time);
    context.mock.timers.enable({ apis: ["setTimeout"] });
    const token = f.runtime.prepareQueuedText?.("queued", "steering", f.runtime.getSession()); assert.ok(token);
    pending = token.send(() => undefined);
    let callbacks = 0;
    stopping = f.runtime.abortTask?.(() => { callbacks++; });
    time = 4999; context.mock.timers.tick(4999); await Promise.resolve();
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "prompt", "steer"]);
    time = 5000; context.mock.timers.tick(1);
    const stopped = await stopping; assert.ok(stopped);
    assert.equal(stopped.ok, false);
    assert.deepEqual(await pending, { delivery: "unknown", code: "runtime-lost" });
    assert.equal(callbacks, 0);
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "prompt", "steer"]);
    assert.deepEqual(f.memory.releases, ["uncertain"]); assert.equal(f.memory.endCalls, 0);
    const output = path.resolve("dist/wi077-queued-send"); await mkdir(output, { recursive: true });
    await writeFile(path.join(output, "stop-budget.json"), JSON.stringify({ schemaVersion: 1, status: "passed",
      evidence: "injected-memory-JSONL-transport", controlBudgetMs: 5000, clearOrAbortWrites: 0, recoveryCallbacks: 0,
      limits: ["mock monotonic clock and setTimeout scheduler", "not wall-clock/host recovery/UI or real runtime"],
    }, null, 2) + "\n");
  } finally { await f.runtime.stop(); context.mock.timers.tick(30000); await Promise.allSettled([pending, stopping]); }
});

// Failure mode: agent_settled makes prompt idle while clear still owns the
// control fence; model/thinking RPC mutates the session during destructive clear.
for (const control of ["stop", "recall"] as const) test(`${control} clear observation fences model mutations after natural task settlement`, async () => {
  const f = fixture();
  let controlling: Promise<PromptResult> | undefined;
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("running")).ok, true);
    f.connection.frame({ type: "agent_start" }); f.hold("clear_queue");
    let callbacks = 0;
    controlling = control === "stop" ? f.runtime.abortTask?.(() => { callbacks++; })
      : f.runtime.recallQueuedText?.(f.runtime.getSession(), () => { callbacks++; });
    const clear = f.commands.at(-1)!;
    assert.equal(clear.type, "clear_queue");
    f.connection.frame({ type: "agent_settled" });
    const thinking = await f.runtime.setThinkingLevel("off");
    const model = await f.runtime.setModel("fixture", "model");
    assert.equal(thinking.ok, false); assert.equal(model.ok, false);
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "prompt", "clear_queue"]);
    assert.equal(callbacks, 0);
    f.connection.frame({ type: "response", id: clear.id, command: "clear_queue", success: true, data: { steering: [], followUp: [] } });
    assert.deepEqual(await controlling, { ok: true }); assert.equal(callbacks, 1);
    assert.equal((await f.runtime.setThinkingLevel("off")).ok, true);
    assert.equal((await f.runtime.setModel("fixture", "model")).ok, true);
    const output = path.resolve("dist/wi077-queued-send"); await mkdir(output, { recursive: true });
    await writeFile(path.join(output, `${control}-model-fence.json`), JSON.stringify({ schemaVersion: 1, status: "passed", control,
      evidence: "injected-memory-JSONL-transport", mutationsFencedDuringClear: true, admissionRestoredAfterControl: true,
      limits: ["no provider/host ledger/UI integration", "not real runtime or installed VSIX"],
    }, null, 2) + "\n");
  } finally { await f.runtime.stop(); await controlling; }
});

for (const scenario of ["idle", "settled-token", "stale-session", "blank", "oversized", "invalid-mode", "at-limit"] as const)
  test(`queue admission boundary ${scenario} preserves one-attempt literal delivery`, async () => {
    const f = fixture();
    try {
      assert.equal((await f.start()).ok, true);
      if (scenario !== "idle") { assert.equal((await f.runtime.prompt("running")).ok, true); f.connection.frame({ type: "agent_start" }); }
      const prepare = f.runtime.prepareQueuedText; assert.ok(prepare);
      const session = f.runtime.getSession();
      const text = scenario === "blank" ? " \t\n" : scenario === "at-limit" ? "🙂".repeat(4000)
        : scenario === "oversized" ? "🙂".repeat(4000) + "x" : "literal";
      let token: ReturnType<typeof prepare>;
      if (scenario === "invalid-mode") {
        // @ts-expect-error Deliberately corrupt the JS-callable enum to verify its defensive runtime check.
        token = prepare(text, "invalid-mode", session);
      } else token = prepare(text, "steering", scenario === "stale-session" ? session + 1 : session);
      if (scenario === "settled-token") f.connection.frame({ type: "agent_settled" });
      let attempts = 0;
      const result = await token.send(() => { attempts++; });
      assert.equal(result.delivery, scenario === "at-limit" ? "rpc-accepted" : "not-sent");
      assert.equal(attempts, scenario === "at-limit" ? 1 : 0);
      assert.equal((await token.send(() => { attempts++; })).delivery, "not-sent");
      assert.equal(attempts, scenario === "at-limit" ? 1 : 0);
      assert.equal(f.commands.filter(command => command.type === "steer").length, scenario === "at-limit" ? 1 : 0);
      assert.equal(f.commands.filter(command => command.type === "follow_up").length, 0);
      assert.equal(f.commands.filter(command => command.type === "prompt").length, scenario === "idle" ? 0 : 1);
      if (scenario === "at-limit") assert.equal(f.commands.at(-1)?.message, text);
      assert.equal(f.runtime.getSession(), session); assert.deepEqual(f.memory.releases, []);
      const output = path.resolve("dist/wi077-queued-send"); await mkdir(output, { recursive: true });
      await writeFile(path.join(output, `admission-${scenario}.json`), JSON.stringify({ schemaVersion: 1, status: "passed", scenario,
        evidence: "injected-memory-JSONL-transport", delivery: result.delivery, attemptCallbacks: attempts, inputUtf16Units: text.length,
        limits: ["not host draft/capacity/UI admission", "not real runtime or installed VSIX"],
      }, null, 2) + "\n");
    } finally { await f.runtime.stop(); }
  });

for (const response of ["rejected", "wrong-command", "invalid-success"] as const)
  test(`queue response boundary ${response} is fixed, one-attempt and never exposes upstream error`, async () => {
    const f = fixture();
    try {
      assert.equal((await f.start()).ok, true);
      assert.equal((await f.runtime.prompt("running")).ok, true); f.connection.frame({ type: "agent_start" });
      f.override(command => command !== "steer" ? undefined : response === "rejected" ? { success: false, error: "PRIVATE_RPC_ERROR" }
        : response === "wrong-command" ? { command: "abort", error: "PRIVATE_RPC_ERROR" } : { success: "yes", error: "PRIVATE_RPC_ERROR" });
      const token = f.runtime.prepareQueuedText?.("queued", "steering", f.runtime.getSession()); assert.ok(token);
      const result = await token.send(() => undefined);
      assert.deepEqual(result, response === "rejected" ? { delivery: "rpc-rejected", code: "rpc-rejected" } : { delivery: "unknown", code: "runtime-lost" });
      assert.equal((await token.send(() => undefined)).delivery, "not-sent");
      assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "prompt", "steer"]);
      assert.deepEqual(f.memory.releases, response === "rejected" ? [] : ["uncertain"]);
      assert.equal(f.events.filter(event => event.kind === "runtime_error").length, response === "rejected" ? 0 : 1);
      assert.equal(JSON.stringify({ result, events: f.events }).includes("PRIVATE_RPC_ERROR"), false);
      assert.equal(f.memory.endCalls, 0); assert.equal(f.connection.stdin.listenerCount("drain"), 0);
      const output = path.resolve("dist/wi077-queued-send"); await mkdir(output, { recursive: true });
      await writeFile(path.join(output, `protocol-${response}.json`), JSON.stringify({ schemaVersion: 1, status: "passed", response,
        evidence: "injected-memory-JSONL-transport", delivery: result.delivery, releases: f.memory.releases,
        limits: ["not host ledger/UI recovery", "not real runtime or installed VSIX"],
      }, null, 2) + "\n");
    } finally { await f.runtime.stop(); }
  });

// Public stream failures must not retry, kill the child or expose error content.
for (const fault of ["throw", "callback", "event"] as const)
  test(`queue stream failure ${fault} retires exactly one uncertain observation`, async () => {
    const f = fixture();
    try {
      assert.equal((await f.start()).ok, true);
      assert.equal((await f.runtime.prompt("running")).ok, true); f.connection.frame({ type: "agent_start" });
      if (fault === "event") { f.stallQueue(); f.hold("steer"); } else f.failQueue(fault);
      const token = f.runtime.prepareQueuedText?.("queued", "steering", f.runtime.getSession()); assert.ok(token);
      const pending = token.send(() => undefined);
      if (fault === "event") f.connection.stdin.emit("error", new Error("PRIVATE_STREAM_ERROR"));
      const result = await pending;
      assert.deepEqual(result, { delivery: "unknown", code: fault === "event" ? "runtime-lost" : "write-failed" });
      assert.equal((await token.send(() => undefined)).delivery, "not-sent");
      assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "prompt", "steer"]);
      assert.deepEqual(f.memory.releases, ["uncertain"]);
      assert.equal(f.events.filter(event => event.kind === "runtime_error").length, 1);
      assert.equal(JSON.stringify({ result, events: f.events }).includes("PRIVATE_STREAM_ERROR"), false);
      assert.equal(f.memory.endCalls, 0); assert.equal(f.connection.stdin.listenerCount("drain"), 0);
      const output = path.resolve("dist/wi077-queued-send"); await mkdir(output, { recursive: true });
      await writeFile(path.join(output, `stream-${fault}.json`), JSON.stringify({ schemaVersion: 1, status: "passed", fault,
        evidence: "injected-memory-JSONL-transport", delivery: result.delivery, releases: f.memory.releases,
        limits: ["not host ledger/UI recovery", "not real runtime or installed VSIX"],
      }, null, 2) + "\n");
    } finally { await f.runtime.stop(); }
  });

// Explicit recall failure modes before implementation: aborting the task,
// releasing prompt occupancy, duplicate clear with Stop, stale session writes,
// malformed clear fabricating recovery, and unbounded failed observation.
test("explicit recall clears text without aborting or releasing the running task", async () => {
  const f = fixture();
  const saved: unknown[] = [];
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.prompt("running")).ok, true);
    f.connection.frame({ type: "agent_start" });
    const snapshot = { steering: ["same", "same"], followUp: ["next 中"] };
    f.override(command => command === "clear_queue" ? { data: snapshot } : undefined);
    assert.equal((await f.runtime.recallQueuedText?.(f.runtime.getSession(), value => { saved.push(value); }))?.ok, true);
    assert.deepEqual(saved, [snapshot]);
    assert.equal((await f.runtime.prompt("still occupied")).ok, false);
    assert.equal(f.commands.filter(command => command.type === "abort").length, 0);
    f.connection.frame({ type: "agent_settled" });
    assert.equal((await f.runtime.prompt("now available")).ok, true);
    const output = path.resolve("dist/wi077-explicit-recall");
    await mkdir(output, { recursive: true });
    await writeFile(path.join(output, "report.json"), JSON.stringify({ schemaVersion: 1,
      status: "passed", evidence: "injected-memory-JSONL-transport", noAbort: true,
      taskOccupancyPreserved: true, multiplicityPreserved: true,
      limits: ["no host capacity reservation or recovery UI", "not real runtime or installed VSIX"],
    }, null, 2) + "\n");
  } finally { await f.runtime.stop(); }
});

test("explicit recall rejects stale session before destructive clear", async () => {
  const f = fixture();
  let calls = 0;
  try {
    assert.equal((await f.start()).ok, true);
    assert.equal((await f.runtime.recallQueuedText?.(f.runtime.getSession() + 1, () => { calls++; }))?.ok, false);
    assert.equal(calls, 0);
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands"]);
  } finally { await f.runtime.stop(); }
});

test("recall and Stop share one clear owner without duplicate destructive requests", async () => {
  const f = fixture();
  let pending: Promise<unknown> | undefined;
  const saved: unknown[] = [];
  try {
    assert.equal((await f.start()).ok, true);
    f.hold("clear_queue");
    pending = f.runtime.recallQueuedText?.(f.runtime.getSession(), value => { saved.push(value); });
    assert.equal((await f.runtime.abortTask?.())?.ok, false);
    assert.equal((await f.runtime.recallQueuedText?.(f.runtime.getSession(), () => undefined))?.ok, false);
    const request = f.commands.at(-1)!;
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "clear_queue"]);
    f.connection.frame({ type: "response", id: request.id, command: "clear_queue", success: true, data: { steering: [], followUp: ["kept"] } });
    assert.deepEqual(await pending, { ok: true });
    assert.deepEqual(saved, [{ steering: [], followUp: ["kept"] }]);
    f.resume("clear_queue");
    assert.equal((await f.runtime.abortTask?.())?.ok, true);
  } finally { await f.runtime.stop(); await pending; }
});

for (const data of [undefined, { steering: ["x"], followUp: [false] }]) test("explicit recall rejects malformed clear without fabricating an empty recovery", async () => {
  const f = fixture();
  let saved = 0;
  try {
    assert.equal((await f.start()).ok, true);
    f.override(command => command === "clear_queue" ? { data } : undefined);
    assert.equal((await f.runtime.recallQueuedText?.(f.runtime.getSession(), () => { saved++; }))?.ok, false);
    assert.equal(saved, 0);
    assert.equal(f.runtime.getSession(), 0);
    assert.equal(f.commands.filter(command => command.type === "abort").length, 0);
    assert.deepEqual(f.memory.releases, ["uncertain"]);
  } finally { await f.runtime.stop(); }
});

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
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "clear_queue", "abort"]);
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
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "clear_queue"]);
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
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "clear_queue"]);
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
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "clear_queue"]);
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
      limits: ["scenario does not exercise queue send/recall APIs", "no host recovery/UI", "not real runtime, F5 or installed VSIX"],
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
      assert.equal(f.commands.length, operation === "abort" ? 4 : 3);
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
    assert.equal(f.commands.length, 4, "no response is written for the same-chunk retired dialog");
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
    assert.deepEqual(f.commands.map(command => command.type), ["get_state", "get_commands", "prompt", "clear_queue", "abort"]);
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
