import assert from "node:assert/strict";
import type { PassThrough } from "node:stream";
import { createMemoryConnection, createMemoryProcess } from "./memory-process.js";
import { createManagedProcess } from "../process/managed-process.js";
import { test } from "node:test";
import { createPiRpcRuntime } from "../index.js";

function fixture(initializationError = false, startupDialog = false) {
  let messages: unknown[] = [];
  let holdStats = false;
  let stallReplies = false;
  let stopRpcDelay = 0;
  let statsOverrides: Record<string, unknown> = {};
  let statsResponse: Record<string, unknown> = {};
  let afterStats: (() => void) | undefined;
  let stateOverrides: Record<string, unknown> = {};
  let faultTransport: () => void = () => undefined;
  const frames: Record<string, unknown>[] = [];
  let output: PassThrough;
  let args: string[] = [];
  let environment: NodeJS.ProcessEnv = {};
  const memory = createMemoryProcess(options => {
    args = [options.cliPath, ...options.args]; environment = options.env;
    const connection = createMemoryConnection((frame, done) => {
      const request = JSON.parse(frame) as Record<string, unknown>;
      frames.push(request);
      if (request.type === "extension_ui_response" && stallReplies) return false;
      if (request.type === "get_state") queueMicrotask(() => {
        if (initializationError) output.write(JSON.stringify({ type: "extension_error", extensionPath: "/reviewed/extension.mjs", event: "session_start", error: "synthetic initialization failure" }) + "\n");
        output.write(JSON.stringify({ type: "extension_ui_request", method: "notify", message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: options.cwd, ...(options.env.PI_VSCODE_EXTENSION_PROFILE === "trusted" ? { profile: "trusted", customTools: [] } : {}) }) }) + "\n");
        if (startupDialog) output.write(JSON.stringify({ type: "extension_ui_request", id: "startup-dialog", method: "input", title: "Startup input" }) + "\n");
        else output.write(JSON.stringify({ type: "response", id: request.id, command: "get_state", success: true, data: { sessionId: "test", sessionFile: "/owned/session.jsonl", isStreaming: false, isCompacting: false, pendingMessageCount: 0, messageCount: messages.length, ...stateOverrides } }) + "\n");
      });
      if (request.type === "get_messages") queueMicrotask(() => output.write(JSON.stringify({ type: "response", id: request.id, command: request.type, success: true, data: { messages } }) + "\n"));
      if (request.type === "get_session_stats" && !holdStats) queueMicrotask(() => {
        const assistantMessages = messages.filter(message => message && typeof message === "object" && "role" in message && message.role === "assistant").length;
        output.write(JSON.stringify({ type: "response", id: request.id, command: request.type, success: true, data: { sessionId: "test", sessionFile: "/owned/session.jsonl", assistantMessages, totalMessages: messages.length, ...statsOverrides }, ...statsResponse }) + "\n");
        afterStats?.();
      });
      if (request.type === "get_commands") queueMicrotask(() => output.write(JSON.stringify({ type: "response", id: request.id, command: request.type, success: true, data: { commands: [{ name: "sysprompt", source: "extension" }] } }) + "\n"));
      if (request.type === "clear_queue" || request.type === "abort") {
        const respond = () => output.write(JSON.stringify({ type: "response", id: request.id, command: request.type, success: true }) + "\n");
        if (stopRpcDelay) setTimeout(respond, stopRpcDelay);
        else queueMicrotask(respond);
      }
      done?.(); return true;
    });
    output = connection.stdout;
    faultTransport = connection.lose;
    return connection;
  });
  const runtime = createPiRpcRuntime({ process: memory.process, cliPath: () => "fixture", startupModel: () => undefined, gateAccess: async () => undefined });
  return { runtime, frames, releases: memory.releases, delayStopRpc(ms: number) { stopRpcDelay = ms; }, stallReplies() { stallReplies = true; }, setStats(value: Record<string, unknown>) { statsOverrides = value; }, holdStats() { holdStats = true; }, setStatsResponse(value: Record<string, unknown>) { statsResponse = value; }, afterStats(action: () => void) { afterStats = action; }, setMessages(value: unknown[]) { messages = value; }, setState(value: Record<string, unknown>) { stateOverrides = value; }, failTransport() { faultTransport(); }, get endCalls() { return memory.endCalls; }, get recoveryCalls() { return memory.recoveryCalls; }, get args() { return args; }, get environment() { return environment; }, frame(value: unknown) { output.write(JSON.stringify(value) + "\n"); } };
}

test("trusted loading passes only an explicit entry and requires the trusted gate profile", async () => {
  const f = fixture();
  try {
    const result = await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } });
    assert.equal(result.ok, true);
    assert.equal(f.environment.PI_VSCODE_EXTENSION_PROFILE, "trusted");
    assert.ok(f.args.includes("--no-extensions"));
    assert.equal(f.args.filter(arg => arg === "-e").length, 2);
    assert.equal(f.args[f.args.length - 1], "/reviewed/extension.mjs");
  } finally { await f.runtime.stop(); }
});


  test("trusted launch exposes registered custom tools while controlled retains its exact CLI allowlist", async () => {
    const f = fixture();
    try {
      assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
      assert.equal(f.args.filter(arg => arg === "--tools").length, 1);
      assert.equal(f.args[f.args.indexOf("--tools") + 1], "read,write,edit,bash,powershell,grep,find,ls");
      await f.runtime.stop();
      assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
      assert.equal(f.args.includes("--tools"), false, "pi's CLI allowlist must not filter registered extension tools out of the public gate inventory");
      assert.equal(f.args.includes("-t"), false);
      assert.ok(f.args.includes("--no-extensions"));
      assert.ok(f.args.includes("--no-approve"));
      assert.equal(f.args.filter(arg => arg === "-e").length, 2);
      assert.equal(f.args.at(-1), "/reviewed/extension.mjs");
      assert.equal(f.environment.PI_VSCODE_EXTENSION_PROFILE, "trusted");
    } finally { await f.runtime.stop(); }
  });

test("extension initialization error blocks readiness despite a successful state response", async () => {
  const f = fixture(true);
  try {
    const result = await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" });
    assert.equal(result.ok, false);
    assert.equal(f.runtime.getSession(), 0);
  } finally { await f.runtime.stop(); }
});

test("trusted runtime routes standard dialogs separately from tool authorization", async () => {
  const f = fixture();
  const offered: string[] = [];
  f.runtime.setInteractionHandler?.((form, reply) => {
    offered.push(form.method);
    reply({ kind: "cancel", reason: "user" });
  });
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
    f.frame({ type: "extension_ui_request", id: "standard", method: "input", title: "Question", placeholder: "Nonsecret text" });
    assert.deepEqual(offered, ["input"]);
    assert.deepEqual(f.frames.filter(frame => frame.type === "extension_ui_response"), [{ type: "extension_ui_response", id: "standard", cancelled: true }]);
  } finally { await f.runtime.stop(); }
});

test("an occupied durable recovery domain does not launch a replacement runtime", async () => {
  let launches = 0;
  const runtime = createPiRpcRuntime({
    cliPath: () => "/public/cli.js", startupModel: () => undefined, gateAccess: async () => undefined,
    process: createManagedProcess({
      async launch() { launches += 1; return { ok: false, code: "occupied" }; },
      async inspect() { return { kind: "blocked", code: "invalid-record" }; },
      async end() { assert.fail("startup must not terminate an unrelated/unknown old runtime"); },
      async recover() { assert.fail("startup must not silently clear a recovery fence"); },
      async handoff() { assert.fail("startup must not hand off an unreadable record"); },
    }),
  });
  const result = await runtime.start({ cwd: "/project", projectTrust: "no-approve" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.detail, /recovery|occupied/i);
  assert.equal(launches, 1);
  assert.equal(runtime.getSession(), 0);
});


test("deliberate normal replacement requests idle process release", async () => {
  const f = fixture();
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
  await f.runtime.stop();

  assert.deepEqual(f.releases, ["idle"]);
});


test("managed transport loss preserves the durable barrier without terminating or silently recovering", async () => {
  const f = fixture();
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
  f.failTransport();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(f.endCalls, 0);
  assert.equal(f.recoveryCalls, 0);
  const replacement = await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" });
  assert.equal(replacement.ok, false);
  await f.runtime.stop();
  assert.equal(f.endCalls, 0);
});

test("explicit owned-runtime termination and recovery are separate from loss and re-enable only deliberate startup", async () => {
  const f = fixture();
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
  f.failTransport();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal((await f.runtime.endOwnedRuntime?.())?.ok, true);
  assert.equal(f.endCalls, 1);
  assert.equal(f.recoveryCalls, 0);
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, false);
  assert.equal((await f.runtime.recoverOwnedRuntime?.())?.ok, true);
  assert.equal(f.recoveryCalls, 1);
  assert.equal(f.runtime.getSession(), 0);
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
  await f.runtime.stop();
});


test("unconfirmed managed Stop blocks without automatically terminating the owned child", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
  const sending = f.runtime.preparePrompt({ kind: "plain", body: "task" }, f.runtime.getSession()).send(() => undefined);
  const prompt = f.frames.find(frame => frame.type === "prompt");
  assert.ok(prompt);
  f.frame({ type: "response", id: prompt.id, command: "prompt", success: true });
  assert.equal((await sending).delivery, "rpc-accepted");
  const stopping = f.runtime.abortTask!();
  await new Promise(resolve => setImmediate(resolve));
  context.mock.timers.tick(5000);
  assert.equal((await stopping).ok, false);
  assert.equal(f.endCalls, 0);
  assert.equal(f.recoveryCalls, 0);

  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, false);
});


test("an awaited extension command has no human-response ACK deadline and releases only its handler lease", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  const events: string[] = [];
  f.runtime.subscribe(event => events.push(event.kind));
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
    const sending = f.runtime.preparePrompt({ kind: "plain", body: "/sysprompt" }, f.runtime.getSession()).send(() => undefined);
    let settled = false; void sending.then(() => { settled = true; });
    context.mock.timers.tick(60_000);
    await Promise.resolve();
    assert.equal(settled, false);
    const request = f.frames.find(frame => frame.type === "prompt");
    assert.ok(request);
    f.frame({ type: "response", command: "prompt", id: request.id, success: true });
    assert.equal((await sending).delivery, "rpc-accepted");
    assert.equal(events.includes("agent_settled"), false);
    assert.equal(events.includes("command_handled"), true);
    const next = f.runtime.preparePrompt({ kind: "plain", body: "/sysprompt list" }, f.runtime.getSession()).send(() => undefined);
    const nextRequest = f.frames.filter(frame => frame.type === "prompt").at(-1);
    assert.notEqual(nextRequest?.id, request.id);
    f.frame({ type: "response", command: "prompt", id: nextRequest?.id, success: true });
    assert.equal((await next).delivery, "rpc-accepted");
  } finally { await f.runtime.stop(); }
});

test("trusted custom approval cannot name a tool absent from the verified startup inventory", async () => {
  const f = fixture();
  let approvals = 0;
  f.runtime.setApprovalHandler?.(async () => { approvals += 1; return true; });
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
    f.frame({ type: "extension_ui_request", id: "unregistered", method: "confirm", message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "call", runtime: f.environment.PI_VSCODE_GATE_ID, cwd: "/project", request: "request", toolCallId: "tool", tool: "not_registered", category: "custom", input: {} }) });
    await Promise.resolve();
    assert.equal(approvals, 0);
    assert.equal(f.frames.filter(frame => frame.type === "extension_ui_response").at(-1)?.confirmed, false);
  } finally { await f.runtime.stop(); }
});

test("managed startup incompatibility preserves the exact child until explicit termination", async () => {
  const f = fixture(true);
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, false);
  assert.equal(f.endCalls, 0); assert.equal(f.recoveryCalls, 0);
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, false);
  await f.runtime.stop(); assert.equal(f.endCalls, 0);
});

test("managed uncertain prompt delivery cannot implicitly end or retire the runtime", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
  const sending = f.runtime.preparePrompt({ kind: "plain", body: "task" }, f.runtime.getSession()).send(() => undefined);
  context.mock.timers.tick(30000);
  assert.equal((await sending).delivery, "unknown");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.endCalls, 0); assert.equal(f.recoveryCalls, 0);
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, false);
});

test("managed disposal during a command lease is ownership loss, not an implicit End", async () => {
  const f = fixture();
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
  const sending = f.runtime.preparePrompt({ kind: "plain", body: "/sysprompt" }, f.runtime.getSession()).send(() => undefined);
  await f.runtime.stop(); await sending;
  assert.equal(f.endCalls, 0); assert.equal(f.recoveryCalls, 0);
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, false);
});

test("startup readiness budget excludes an explicit indefinite human dialog wait", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture(false, true);
  let reply!: import("../../../extension/interactions/index.js").InteractionReplyCallback;
  f.runtime.setInteractionHandler?.((_form, answer) => { reply = answer; });
  const starting = f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } });
  let settled = false; void starting.then(() => { settled = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(typeof reply, "function");
  context.mock.timers.tick(60000); await new Promise(resolve => setImmediate(resolve));
  assert.equal(settled, false);
  await reply({ kind: "cancel", reason: "user" });
  const state = f.frames.find(frame => frame.type === "get_state");
  f.frame({ type: "response", id: state?.id, command: "get_state", success: true, data: { sessionId: "test", sessionFile: "/owned/session.jsonl" } });
  assert.equal((await starting).ok, true);
  await f.runtime.stop(); assert.deepEqual(f.releases, ["idle"]);
});

test("startup transport deadline resumes after a dialog reply and does not terminate unconfirmed work", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture(false, true);
  let reply!: import("../../../extension/interactions/index.js").InteractionReplyCallback;
  f.runtime.setInteractionHandler?.((_form, answer) => { reply = answer; });
  const starting = f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } });
  await new Promise(resolve => setImmediate(resolve));
  context.mock.timers.tick(60000); await reply({ kind: "cancel", reason: "user" });
  context.mock.timers.tick(15000);
  assert.equal((await starting).ok, false);
  assert.equal(f.endCalls, 0); assert.equal(f.recoveryCalls, 0);
});

test("disposal while a startup dialog waits retains owned-runtime uncertainty", async () => {
  const f = fixture(false, true);
  f.runtime.setInteractionHandler?.(() => undefined);
  const starting = f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } });
  await new Promise(resolve => setImmediate(resolve));
  await f.runtime.stop(); assert.equal((await starting).ok, false);
  assert.equal(f.endCalls, 0); assert.equal(f.recoveryCalls, 0);
});

test("trusted standard feedback is bounded and never becomes a command or prompt mutation", async () => {
  const f = fixture();
  const snapshots: { feedback: { kind: string; text: string }[]; omittedFeedback: number }[] = [];
  f.runtime.setFeedbackHandler?.(snapshot => snapshots.push(snapshot));
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
    for (let n = 0; n < 20; n++) f.frame({ type: "extension_ui_request", id: "notify-" + n, method: "notify", message: "Literal <notice> " + n, notifyType: "info" });
    assert.equal(snapshots.at(-1)?.feedback.length, 16); assert.equal(snapshots.at(-1)?.omittedFeedback, 4);
    f.frame({ type: "extension_ui_request", id: "editor-feedback", method: "set_editor_text", text: "Not a draft replacement" });
    assert.deepEqual(snapshots.at(-1)?.feedback.at(-1)?.kind, "editor-text");
    assert.equal(f.frames.some(frame => frame.type === "prompt"), false);
    assert.equal(JSON.stringify(snapshots).includes("editor-feedback"), false);
  } finally { await f.runtime.stop(); }
  assert.deepEqual(snapshots.at(-1), { feedback: [], omittedFeedback: 0 });
});

test("explicit interaction invalidation preserves an idle owned child for deliberate recovery", async () => {
  const f = fixture(); const errors: string[] = [];
  f.runtime.subscribe(event => { if (event.kind === "runtime_error") errors.push(event.detail); });
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
  f.runtime.invalidateInteractions?.(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.runtime.getSession(), 0); assert.equal(errors.length, 1);
  assert.equal(f.endCalls, 0); assert.equal(f.recoveryCalls, 0);
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, false);
});


test("restart checkpoint identifies an empty fresh conversation without treating its path as durable", async () => {
  const f = fixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    assert.deepEqual(await f.runtime.checkpointRestart?.({ id: "test", path: "/owned/session.jsonl" }), { kind: "empty" });

  } finally { await f.runtime.stop(); }
});

for (const messages of [[{ role: "user", content: "not persisted" }], [{ role: "custom", content: "extension state" }]]) test(`restart checkpoint retains nonempty unpersisted ${messages[0]?.role} messages`, async () => {
  const f = fixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    f.setMessages(messages);
    assert.deepEqual(await f.runtime.checkpointRestart?.({ id: "test", path: "/owned/session.jsonl" }), { kind: "unavailable" });
    assert.notEqual(f.runtime.getSession(), 0);
  } finally { await f.runtime.stop(); }
});

test("restart checkpoint resumes assistant-backed conversation and keeps exact saved identity checks", async () => {
  const f = fixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    f.setMessages([{ role: "user", content: "hello" }, { role: "assistant", content: [] }]);
    const conversation = { id: "test", path: "/owned/session.jsonl" };
    assert.deepEqual(await f.runtime.checkpointRestart?.(conversation), { kind: "resume", conversation });
    assert.deepEqual(await f.runtime.checkpointRestart?.({ ...conversation, id: "different" }), { kind: "unavailable" });
    assert.deepEqual(await f.runtime.checkpointRestart?.({ ...conversation, path: "/different/session.jsonl" }), { kind: "unavailable" });
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", resume: { ...conversation, id: "different" } })).ok, false);
  } finally { await f.runtime.stop(); }
});

test("an empty saved conversation is never relabeled as a new fresh conversation", async () => {
  const f = fixture(); const conversation = { id: "test", path: "/owned/session.jsonl" };
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", resume: conversation })).ok, true);
    assert.deepEqual(await f.runtime.checkpointRestart?.(conversation), { kind: "resume", conversation });
  } finally { await f.runtime.stop(); }
});

for (const state of [{ isStreaming: true }, { isCompacting: true }, { pendingMessageCount: 1 }, { messageCount: 1 }, { isStreaming: null }, { messageCount: -1 }]) test(`restart checkpoint fails closed for ${JSON.stringify(state)}`, async () => {
  const f = fixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true); f.setState(state);
    assert.deepEqual(await f.runtime.checkpointRestart?.({ id: "test", path: "/owned/session.jsonl" }), { kind: "unavailable" });
    assert.notEqual(f.runtime.getSession(), 0);
  } finally { await f.runtime.stop(); }
});


test("restart checkpoint times out without stopping the old ready runtime", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true); f.holdStats();
    const checkpoint = f.runtime.checkpointRestart?.({ id: "test", path: "/owned/session.jsonl" });
    await new Promise(resolve => setImmediate(resolve));
    context.mock.timers.tick(5000);
    assert.deepEqual(await checkpoint, { kind: "unavailable" });
    assert.notEqual(f.runtime.getSession(), 0);
  } finally { await f.runtime.stop(); }
});

for (const response of [{ success: false }, { command: "get_state" }, { data: null }]) test("restart checkpoint rejects unavailable or malformed statistics: " + JSON.stringify(response), async () => {
  const f = fixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true); f.setStatsResponse(response);
    assert.deepEqual(await f.runtime.checkpointRestart?.({ id: "test", path: "/owned/session.jsonl" }), { kind: "unavailable" });

  } finally { await f.runtime.stop(); }
});

test("restart checkpoint rejects state that changes while reading statistics", async () => {
  const f = fixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    f.afterStats(() => f.setState({ messageCount: 1 }));
    assert.deepEqual(await f.runtime.checkpointRestart?.({ id: "test", path: "/owned/session.jsonl" }), { kind: "unavailable" });

  } finally { await f.runtime.stop(); }
});

test("observed conversation activity cannot later be discarded as an untouched fresh conversation", async () => {
  const f = fixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    f.frame({ type: "message_start", message: { role: "user", content: "earlier content" } });
    assert.deepEqual(await f.runtime.checkpointRestart?.({ id: "test", path: "/owned/session.jsonl" }), { kind: "unavailable" });

  } finally { await f.runtime.stop(); }
});


test("restart checkpoint never requests huge message content that would overflow the transport", async () => {
  const f = fixture(); const conversation = { id: "test", path: "/owned/session.jsonl" };
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    f.setMessages([{ role: "assistant", content: "x".repeat(9 * 1024 * 1024) }]);
    const checkpoint = await f.runtime.checkpointRestart?.(conversation);
    assert.equal(f.frames.some(frame => frame.type === "get_messages"), false);
    assert.deepEqual(checkpoint, { kind: "resume", conversation });
    assert.notEqual(f.runtime.getSession(), 0);
  } finally { await f.runtime.stop(); }
});

for (const messageCount of [0, 1, 4]) test(`checkpoint resumes compacted history with ${messageCount} active messages and distinct all-entry statistics`, async () => {
  const f = fixture(); const conversation = { id: "test", path: "/owned/session.jsonl" };
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    f.setState({ messageCount }); f.setStats({ assistantMessages: 12, totalMessages: 30 });
    assert.deepEqual(await f.runtime.checkpointRestart?.(conversation), { kind: "resume", conversation });
    assert.equal(f.frames.some(frame => frame.type === "get_messages"), false);

  } finally { await f.runtime.stop(); }
});

test("zero active context cannot discard nonempty custom entries without an assistant", async () => {
  const f = fixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    f.setState({ messageCount: 0 }); f.setStats({ assistantMessages: 0, totalMessages: 1 });
    assert.deepEqual(await f.runtime.checkpointRestart?.({ id: "test", path: "/owned/session.jsonl" }), { kind: "unavailable" });
    assert.notEqual(f.runtime.getSession(), 0);
    assert.equal(f.frames.some(frame => frame.type === "get_messages"), false);
  } finally { await f.runtime.stop(); }
});

for (const stats of [
  { assistantMessages: -1 }, { totalMessages: -1 }, { assistantMessages: 0.5 },
  { totalMessages: 0.5 }, { assistantMessages: 1, totalMessages: 0 },
  { assistantMessages: "1" }, { totalMessages: null },
  { assistantMessages: Number.MAX_SAFE_INTEGER + 1 }, { totalMessages: Number.MAX_SAFE_INTEGER + 1 },
  { sessionId: "different" }, { sessionFile: "/different/session.jsonl" },
]) test("checkpoint rejects invalid statistics without replacing the runtime: " + JSON.stringify(stats), async () => {
  const f = fixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true); f.setStats(stats);
    assert.deepEqual(await f.runtime.checkpointRestart?.({ id: "test", path: "/owned/session.jsonl" }), { kind: "unavailable" });
    assert.notEqual(f.runtime.getSession(), 0);
  } finally { await f.runtime.stop(); }
});

for (const state of [{ sessionId: "different" }, { sessionFile: "/different/session.jsonl" }]) test("checkpoint rejects identity changes after statistics: " + JSON.stringify(state), async () => {
  const f = fixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    f.afterStats(() => f.setState(state));
    assert.deepEqual(await f.runtime.checkpointRestart?.({ id: "test", path: "/owned/session.jsonl" }), { kind: "unavailable" });

  } finally { await f.runtime.stop(); }
});

for (const failure of ["handler-throws", "extension-error"] as const) test(`startup dialog ${failure} settles readiness and fences the owned child without End`, async () => {
  const f = fixture(false, true);
  f.runtime.setInteractionHandler?.(() => { if (failure === "handler-throws") throw new Error("synthetic host handler failure"); });
  let settled = false;
  const starting = f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } });
  void starting.then(() => { settled = true; });
  try {
    await new Promise(resolve => setImmediate(resolve));
    if (failure === "extension-error") f.frame({ type: "extension_error", event: "session_start", error: "synthetic initialization error" });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(settled, true);
    assert.equal((await starting).ok, false);
    assert.equal(f.runtime.getSession(), 0);
    assert.equal(f.endCalls, 0); assert.equal(f.recoveryCalls, 0);
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, false);
  } finally { await f.runtime.stop(); await starting; }
});

test("dialog identity exhaustion revokes adapter capabilities and retains the owned recovery fence", async () => {
  const f = fixture();
  f.runtime.setInteractionHandler?.(() => undefined);
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
    const session = f.runtime.getSession();
    for (let i = 0; i <= 65_536; i++) f.frame({ type: "extension_ui_request", id: "budget-" + i, method: "input", title: "Input" });
    assert.equal(f.runtime.getSession(), 0);
    const prepared = f.runtime.preparePrompt({ kind: "plain", body: "must not send" }, session);
    assert.equal((await prepared.send(() => assert.fail("revoked transport must not send"))).delivery, "not-sent");
    assert.equal(f.endCalls, 0); assert.equal(f.recoveryCalls, 0);
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, false);
  } finally { await f.runtime.stop(); }
});

test("standard dialogs without a host handler cancel only once per remote identity", async () => {
  const f = fixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
    const request = { type: "extension_ui_request", id: "unhandled", method: "input", title: "Input" };
    f.frame(request); f.frame(request); await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.frames.filter(frame => frame.type === "extension_ui_response" && frame.id === "unhandled").length, 1);
    assert.notEqual(f.runtime.getSession(), 0);
  } finally { await f.runtime.stop(); }
});

for (const mode of ["no-handler", "aborting", "controlled"] as const) test(`unavailable dialog cancellation is replay-safe and bounded while ${mode}`, async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  let offered = 0;
  if (mode === "aborting") f.runtime.setInteractionHandler?.(() => { offered++; });
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", ...(mode !== "controlled" ? { profile: { kind: "trusted" as const, entryPath: "/reviewed/extension.mjs" } } : {}) })).ok, true);
    f.stallReplies();
    const stopping = mode === "aborting" ? f.runtime.abortTask?.() : undefined;
    const request = { type: "extension_ui_request", id: "stalled", method: "input", title: "Input" };
    f.frame(request); f.frame(request);
    await stopping;
    assert.equal(offered, 0);
    assert.equal(f.frames.filter(frame => frame.type === "extension_ui_response").length, 1);
    context.mock.timers.tick(5000); await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.runtime.getSession(), 0);
    assert.equal(f.endCalls, 0); assert.equal(f.recoveryCalls, 0);
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, false);
  } finally { await f.runtime.stop(); }
});

test("Stop cancellation chain can drain a late dialog without reoffering or retiring healthy transport", async () => {
  const f = fixture();
  let offered = 0;
  let reply!: import("../../../extension/interactions/index.js").InteractionReplyCallback;
  f.runtime.setInteractionHandler?.((_form, answer) => { offered++; reply = answer; });
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
    f.frame({ type: "extension_ui_request", id: "first", method: "input", title: "Input" });
    await reply({ kind: "cancel", reason: "stop" });
    const stopping = f.runtime.abortTask?.();
    const late = { type: "extension_ui_request", id: "late", method: "input", title: "Input" };
    f.frame(late); f.frame(late);
    assert.equal((await stopping)?.ok, true);
    assert.equal(offered, 1);
    assert.deepEqual(f.frames.filter(frame => frame.type === "extension_ui_response").map(frame => frame.id), ["first", "late"]);
    assert.notEqual(f.runtime.getSession(), 0); assert.equal(f.endCalls, 0);
  } finally { await f.runtime.stop(); }
});

for (const title of ["Input", null]) test(`disposal during automatic cancellation of ${title === null ? "malformed" : "valid"} dialog preserves owned uncertainty`, async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
  f.stallReplies();
  f.frame({ type: "extension_ui_request", id: "disposing", method: "input", title });
  await f.runtime.stop();
  context.mock.timers.tick(5000); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.endCalls, 0); assert.equal(f.recoveryCalls, 0);
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, false);
});

for (const rpcDelay of [2000, 4000]) test(`Stop has one five-second observation deadline with ${rpcDelay}ms RPCs and an unresolved handler`, async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let now = 0;
  context.mock.method(performance, "now", () => now);
  const f = fixture();
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
  // A registered extension command retains its handler lease until its prompt response.
  const sending = f.runtime.preparePrompt({ kind: "plain", body: "/sysprompt" }, f.runtime.getSession()).send(() => undefined);
  const command = f.frames.find(frame => frame.type === "prompt");
  assert.ok(command);
  f.delayStopRpc(rpcDelay);
  const outcomes: { ok: boolean }[] = [];
  const stopping = f.runtime.abortTask!().then(result => { outcomes.push(result); return result; });
  try {
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.frames.filter(frame => frame.type === "clear_queue").length, 1);
    now = rpcDelay; context.mock.timers.tick(rpcDelay);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.frames.filter(frame => frame.type === "abort").length, 1);
    assert.equal(outcomes.length, 0);
    if (rpcDelay === 2000) {
      now = 4000; context.mock.timers.tick(2000);
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(outcomes.length, 0, "handler settlement still has the remaining one second");
    }
    now = 4999; context.mock.timers.tick(999);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(outcomes.length, 0);
    now = 5000; context.mock.timers.tick(1);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(outcomes.at(-1)?.ok, false, "Stop must settle by its total deadline, not grant abort another five seconds");
    assert.equal(f.runtime.getSession(), 0);
    assert.equal(f.endCalls, 0);
    assert.equal(f.recoveryCalls, 0);

    now = 8000; context.mock.timers.tick(3000);
    f.frame({ type: "response", id: command.id, command: "prompt", success: true });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.runtime.getSession(), 0, "late ACKs must not revive a timed-out task");
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, false);
  } finally {
    await f.runtime.stop();
    now = 20_000; context.mock.timers.tick(20_000);
    await Promise.all([stopping, sending]);
  }
});

test("Stop cannot accept late success after its absolute deadline when timer delivery is delayed", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let now = 0;
  context.mock.method(performance, "now", () => now);
  const f = fixture();
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
  const sending = f.runtime.preparePrompt({ kind: "plain", body: "/sysprompt" }, f.runtime.getSession()).send(() => undefined);
  const command = f.frames.find(frame => frame.type === "prompt");
  assert.ok(command);
  f.delayStopRpc(4000);
  const stopping = f.runtime.abortTask!();
  try {
    now = 4000; context.mock.timers.tick(4000);
    await new Promise(resolve => setImmediate(resolve));
    const abort = f.frames.find(frame => frame.type === "abort");
    assert.ok(abort);
    // An event-loop delay can expose a buffered response before the due timer runs.
    now = 5001;
    f.frame({ type: "response", id: command.id, command: "prompt", success: true });
    f.frame({ type: "response", id: abort.id, command: "abort", success: true });
    assert.equal((await stopping).ok, false);
    assert.equal(f.endCalls, 0);
    assert.equal(f.recoveryCalls, 0);

    assert.equal(f.runtime.getSession(), 0);
  } finally { await f.runtime.stop(); await Promise.all([stopping, sending]); }
});

test("Stop can confirm handler settlement within the remaining shared budget without terminating the owner", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let now = 0;
  context.mock.method(performance, "now", () => now);
  const f = fixture();
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", profile: { kind: "trusted", entryPath: "/reviewed/extension.mjs" } })).ok, true);
  const session = f.runtime.getSession();
  const sending = f.runtime.preparePrompt({ kind: "plain", body: "/sysprompt" }, session).send(() => undefined);
  const command = f.frames.find(frame => frame.type === "prompt");
  assert.ok(command);
  f.delayStopRpc(2000);
  const stopping = f.runtime.abortTask!();
  try {
    now = 2000; context.mock.timers.tick(2000);
    await new Promise(resolve => setImmediate(resolve));
    now = 4000; context.mock.timers.tick(2000);
    await new Promise(resolve => setImmediate(resolve));
    now = 4999; context.mock.timers.tick(999);
    f.frame({ type: "response", id: command.id, command: "prompt", success: true });
    assert.equal((await stopping).ok, true);
    assert.equal((await sending).delivery, "rpc-accepted");
    assert.equal(f.runtime.getSession(), session);
    assert.equal(f.endCalls, 0);
    assert.equal(f.recoveryCalls, 0);

    now = 5001; context.mock.timers.tick(2);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.runtime.getSession(), session, "successful Stop must release its observation timer");
  } finally { await f.runtime.stop(); await Promise.all([stopping, sending]); }
});
