import assert from "node:assert/strict";
import test from "node:test";
import type { PromptInput } from "../../extension/runtimeLifecycle.js";
import { serializePromptFrame } from "../jsonl.js";
import { createPiRpcRuntime } from "../pi-rpc-runtime.js";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { ChildProcess, spawn } from "node:child_process";

async function transportFixture(writeFault?: "throw") {
  const stdout = new PassThrough(); const stdin = new EventEmitter();
  const child = new EventEmitter() as EventEmitter & { exitCode: number | null; signalCode: string | null; kill: () => boolean };
  child.exitCode = null; child.signalCode = null;
  child.kill = () => { child.exitCode = 0; queueMicrotask(() => child.emit("close")); return true; };
  let callback: ((error?: Error) => void) | undefined;
  let promptId = ""; let writes = 0; let lastPrompt = "";
  const fakeSpawn = ((_command: string, _args: string[], options: { cwd: string; env: Record<string, string> }) => {
    Object.assign(stdin, { destroyed: false, writableEnded: false, write(frame: string, done?: (error?: Error) => void) {
      const message = JSON.parse(frame);
      if (message.type === "get_state") queueMicrotask(() => {
        stdout.write(JSON.stringify({ type: "extension_ui_request", method: "notify", message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: options.cwd }) }) + "\n");
        stdout.write(JSON.stringify({ type: "response", id: message.id, command: "get_state", success: true, data: { sessionId: "fixture-session", sessionFile: "/private-store/fixture.jsonl" } }) + "\n");
      });
      if (message.type === "prompt") { lastPrompt = frame; writes++; callback = done; promptId = message.id; if (writeFault === "throw") throw new Error("synthetic write fault"); return false; }
      if (message.type === "clear_queue" || message.type === "abort") queueMicrotask(() => { if (message.type === "abort") stdout.write('{"type":"agent_settled"}\n'); stdout.write(JSON.stringify({ type: "response", id: message.id, command: message.type, success: true }) + "\n"); });
      done?.(); return true;
    } });
    return Object.assign(child, { stdin, stdout, stderr: new PassThrough() }) as unknown as ChildProcess;
  }) as unknown as typeof spawn;
  const runtime = createPiRpcRuntime({ spawn: fakeSpawn, startupModel: () => undefined, cliPath: () => "unused", gateAccess: async () => undefined });
  assert.equal((await runtime.start({ cwd: "/synthetic", projectTrust: "no-approve" })).ok, true);
  return { runtime, stdin, stdout, child, callback: (error?: Error) => callback?.(error), get writes() { return writes; }, get lastPrompt() { return lastPrompt; }, ack: () => stdout.write(JSON.stringify({ type: "response", id: promptId, command: "prompt", success: true }) + "\n") };
}

test("prompt ACK before callback/drain does not release admission; one-attempt token cannot replay", async () => {
  const h = await transportFixture();
  try {
    const prepared = h.runtime.preparePrompt({ kind: "plain", body: "literal" }, h.runtime.getSession());
    let resolved = false; const waiting = prepared.send(() => undefined).then(value => { resolved = true; return value; });
    h.ack(); await Promise.resolve(); assert.equal(resolved, false);
    h.stdout.write('{"type":"agent_settled"}\n');
    assert.equal((await h.runtime.preparePrompt({ kind: "plain", body: "second" }, h.runtime.getSession()).send(() => undefined)).delivery, "not-sent");
    h.callback(); await Promise.resolve(); assert.equal(resolved, false);
    h.stdin.emit("drain"); assert.equal((await waiting).delivery, "rpc-accepted");
    assert.equal((await prepared.send(() => undefined)).delivery, "not-sent"); assert.equal(h.writes, 1);
    assert.equal(h.stdin.listenerCount("drain"), 0);
  } finally { await h.runtime.stop(); }
});

test("stdin error terminates the owned live child after permanent loss invalidates session", async () => {
  const h = await transportFixture();
  let closes = 0; h.child.on("close", () => closes++);
  try {
    const waiting = h.runtime.preparePrompt({ kind: "plain", body: "task" }, h.runtime.getSession()).send(() => undefined);
    h.stdin.emit("error", new Error("synthetic broken pipe"));
    assert.equal((await waiting).delivery, "unknown"); await Promise.resolve();
    assert.equal(h.child.exitCode, 0); assert.equal(closes, 1);
    assert.equal(h.writes, 1); assert.equal(h.stdin.listenerCount("drain"), 0);
  } finally { await h.runtime.stop(); }
});

test("close without drain marks uncertain delivery and never retries", async () => {
  const h = await transportFixture();
  try {
    const waiting = h.runtime.preparePrompt({ kind: "plain", body: "literal" }, h.runtime.getSession()).send(() => undefined);
    h.callback(); h.stdin.emit("close");
    assert.equal((await waiting).delivery, "unknown"); assert.equal(h.writes, 1); assert.equal(h.stdin.listenerCount("drain"), 0);
  } finally { await h.runtime.stop(); }
});

test("shutdown without observed close is bounded and blocks a replacement runtime", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const h = await transportFixture(); let kills = 0;
  h.child.kill = () => { kills++; return true; };
  const stopping = h.runtime.stop(); context.mock.timers.tick(10000); await stopping;
  assert.equal(kills, 2);
  const result = await h.runtime.start({ cwd: "/replacement", projectTrust: "no-approve" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.detail, /shutdown was not confirmed/);
  assert.equal(h.runtime.getSession(), 0);
});

test("local write and total ACK deadlines clean pending transport without real waits", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  for (const phase of ["write", "ack"] as const) {
    const h = await transportFixture();
    const waiting = h.runtime.preparePrompt({ kind: "plain", body: "task" }, h.runtime.getSession()).send(() => undefined);
    if (phase === "ack") { context.mock.timers.tick(4000); h.callback(); h.stdin.emit("drain"); context.mock.timers.tick(25999); }
    else context.mock.timers.tick(4999);
    let finished = false; void waiting.then(() => { finished = true; }); await Promise.resolve(); assert.equal(finished, false);
    context.mock.timers.tick(1);
    const result = await waiting;
    assert.equal(result.delivery, "unknown"); assert.equal(result.code, phase === "write" ? "write-failed" : "ack-timeout");
    assert.equal(h.stdin.listenerCount("drain"), 0); assert.equal(h.writes, 1);
    await h.runtime.stop();
  }
});

test("write throws and callback errors are uncertain, never replayed", async () => {
  for (const phase of ["throw", "callback"] as const) {
    const h = await transportFixture(phase === "throw" ? "throw" : undefined);
    const prepared = h.runtime.preparePrompt({ kind: "plain", body: "task" }, h.runtime.getSession());
    const waiting = prepared.send(() => undefined);
    if (phase === "callback") h.callback(new Error("synthetic callback error"));
    assert.equal((await waiting).delivery, "unknown");
    assert.equal((await prepared.send(() => undefined)).delivery, "not-sent");
    assert.equal(h.writes, 1); assert.equal(h.stdin.listenerCount("drain"), 0);
    await h.runtime.stop();
  }
});

test("Stop control bypasses pending prompt drain and stopped prepared frames cannot write", async () => {
  const h = await transportFixture();
  const unused = h.runtime.preparePrompt({ kind: "plain", body: "unsent" }, h.runtime.getSession());
  const waiting = h.runtime.preparePrompt({ kind: "plain", body: "task" }, h.runtime.getSession()).send(() => undefined);
  assert.equal((await h.runtime.abortTask?.())?.ok, true);
  h.callback(); h.stdin.emit("drain"); h.ack(); assert.equal((await waiting).delivery, "rpc-accepted");
  await h.runtime.stop();
  assert.equal((await unused.send(() => undefined)).delivery, "not-sent"); assert.equal(h.writes, 1);
});

test("enriched prompt preserves literal context and independently bounds raw body and UTF-8 text", () => {
  const frame = serializePromptFrame("request", { kind: "enriched", body: " /skill:literal ", attachments: [{ path: "src/a.ts", kind: "file", unsaved: true, text: '\u0000'.repeat(262144) }] });
  assert.ok(Buffer.byteLength(frame) <= 4194304);
  assert.equal(frame.split("\n").length, 2);
  const rpc = JSON.parse(frame);
  assert.equal(rpc.type, "prompt");
  assert.ok(rpc.message.startsWith("User task with explicit untrusted file context. JSON data follows:\n"));
  const data = JSON.parse(rpc.message.slice(rpc.message.indexOf("\n") + 1));
  assert.equal(data.body, " /skill:literal ");
  assert.equal(data.attachments[0].text, '\u0000'.repeat(262144));
  assert.throws(() => serializePromptFrame("r", { kind: "plain", body: " ".repeat(8000) + "x" }));
  assert.equal(JSON.parse(serializePromptFrame("r", { kind: "plain", body: " /template " })).message, "/template");
});

test("selection context stays literal and retains original range and stale choice in the real prompt frame", () => {
  const attachment = { path: "code.ts", kind: "selection" as const, originalRange: { start: { line: 1, character: 1 }, end: { line: 2, character: 4 } }, stale: true, unsaved: true, text: "/skill:not-a-command\n中🐱" };
  const frame = serializePromptFrame("selection-1", { kind: "enriched", body: "inspect", attachments: [attachment] });
  const envelope = JSON.parse(frame) as { id: string; type: string; message: string };
  assert.equal(envelope.type, "prompt"); assert.equal(envelope.id, "selection-1");
  assert.ok(envelope.message.startsWith("User task with explicit untrusted file context. JSON data follows:\n"));
  assert.deepEqual(JSON.parse(envelope.message.slice(envelope.message.indexOf("\n") + 1)), { body: "inspect", attachments: [attachment] });
  assert.equal(frame.split("\n").length, 2, "only frame terminator is a literal LF");
});

test("a mixed attachment vector remains one literal JSONL prompt with ordered complete context", () => {
  const attachments: Extract<PromptInput, { kind: "enriched" }>["attachments"] = [
    { path: "whole.ts", kind: "file", unsaved: true, text: "whole 中\nbody" },
    { path: "part.ts", kind: "selection", unsaved: false, text: "\\\"selected\"", stale: true, originalRange: { start: { line: 2, character: 1 }, end: { line: 2, character: 12 } } },
  ];
  const frame = serializePromptFrame("mixed", { kind: "enriched", body: "/skill:literal", attachments });
  assert.equal(frame.split("\n").length, 2);
  const outer = JSON.parse(frame) as { type: string; message: string };
  assert.equal(outer.type, "prompt");
  assert.deepEqual(JSON.parse(outer.message.slice(outer.message.indexOf("\n") + 1)), { body: "/skill:literal", attachments });
});

test("the adapter bounds the complete vector and preserves one MiB under worst-case nested escaping", async () => {
  const h = await transportFixture();
  const item = { path: "context.ts", kind: "file" as const, unsaved: true, text: "\u0000".repeat(262144) };
  try {
    for (const attachments of [[], Array.from({ length: 21 }, () => ({ ...item, text: "x" })), [...Array.from({ length: 4 }, () => item), { ...item, text: "x" }], [{ ...item, text: "é".repeat(131073) }]]) {
      assert.throws(() => h.runtime.preparePrompt({ kind: "enriched", body: "task", attachments }, h.runtime.getSession()), /attachment-limit|total-too-large|text-too-large/);
      assert.equal(h.writes, 0);
    }
    const attachments = Array.from({ length: 4 }, () => ({ ...item }));
    const frame = serializePromptFrame("largest-vector", { kind: "enriched", body: "literal", attachments });
    assert.ok(Buffer.byteLength(frame, "utf8") > 7 * 1048576, "outer JSON escapes each inner control escape");
    assert.ok(Buffer.byteLength(frame, "utf8") < 8 * 1048576); assert.equal(frame.split("\n").length, 2);
    const outer = JSON.parse(frame) as { message: string };
    assert.deepEqual(JSON.parse(outer.message.slice(outer.message.indexOf("\n") + 1)), { body: "literal", attachments });
    const prepared = h.runtime.preparePrompt({ kind: "enriched", body: "literal", attachments }, h.runtime.getSession());
    attachments[0].text = "mutated"; attachments.pop();
    const result = prepared.send(() => undefined); h.ack(); h.callback(); h.stdin.emit("drain");
    assert.equal((await result).delivery, "rpc-accepted"); assert.equal(h.writes, 1);
    const written = JSON.parse(h.lastPrompt) as { message: string };
    assert.equal(written.message, outer.message, "prepared frame is immutable after caller mutates the vector");
    assert.equal((await prepared.send(() => undefined)).delivery, "not-sent"); assert.equal(h.writes, 1);
  } finally { await h.runtime.stop(); }
});
