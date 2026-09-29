import assert from "node:assert/strict";
import test from "node:test";
import { privateKeyText } from "../../../extension/contracts/tests/credential-samples.js";
import type { FrameContext } from "../rpc-frames.js";
import { createRpcFrames } from "../rpc-frames.js";

function context(overrides: Partial<FrameContext> = {}): FrameContext {
  return { session: 1, aborting: false, gateId: "gate", cwd: "/project", executionProfile: { kind: "controlled" }, ...overrides };
}

function interpret(frames: ReturnType<typeof createRpcFrames>, value: unknown, overrides: Partial<FrameContext> = {}) {
  return frames.interpret(typeof value === "string" ? value : JSON.stringify(value), context(overrides));
}

test("invalid or unknown frames are ignored and do not invent runtime events", () => {
  const frames = createRpcFrames();
  assert.equal(interpret(frames, "not-json").kind, "ignored");
  assert.equal(interpret(frames, "").kind, "ignored");
  assert.equal(interpret(frames, []).kind, "ignored");
  const unknown = interpret(frames, { type: "not_a_protocol_event" });
  assert.equal(unknown.kind, "runtime");
  if (unknown.kind === "runtime") {
    assert.deepEqual(unknown.events, []);
    assert.equal(unknown.agentSettled, undefined);
  }
  assert.equal(interpret(frames, { type: "compaction_start", reason: "invented" }).kind, "runtime");
  const invented = interpret(frames, { type: "compaction_start", reason: "invented" });
  if (invented.kind === "runtime") assert.deepEqual(invented.events, []);
});

test("event order keeps tool completion, activity, final text and error on one assistant frame", () => {
  const frames = createRpcFrames();
  interpret(frames, { type: "message_start", message: { role: "assistant" } });
  const result = interpret(frames, {
    type: "message_end",
    message: { role: "assistant", content: [{ type: "text", text: "done" }, { type: "thinking", thinking: "note" }], stopReason: "error", errorMessage: "Assistant request failed." },
  });
  assert.equal(result.kind, "runtime");
  if (result.kind !== "runtime") return;
  assert.deepEqual(result.events.map(event => event.kind), ["activity", "message_final", "stream_error"]);
  assert.equal(result.conversationTouched, true);
  const final = result.events.find(event => event.kind === "message_final");
  const thinking = result.events.find(event => event.kind === "activity");
  assert.ok(final?.kind === "message_final" && final.text === "done");
  assert.ok(thinking?.kind === "activity" && thinking.item.kind === "thinking");
});

test("tool_finished precedes activity for a bounded tool completion", () => {
  const frames = createRpcFrames();
  const result = interpret(frames, { type: "tool_execution_end", toolCallId: "call-1", toolName: "read", isError: false, result: { content: [{ type: "text", text: "ok" }] } });
  assert.equal(result.kind, "runtime");
  if (result.kind !== "runtime") return;
  assert.deepEqual(result.events.map(event => event.kind), ["tool_finished", "activity"]);
  assert.deepEqual(result.events[0], { kind: "tool_finished", session: 1, toolCallId: "call-1", failed: false });
});

test("compaction and retry never settle the agent task", () => {
  const frames = createRpcFrames();
  const compacting = interpret(frames, { type: "compaction_start", reason: "overflow" });
  const compacted = interpret(frames, { type: "compaction_end", reason: "overflow", aborted: false, willRetry: true, result: { summary: "synthetic" } });
  const retrying = interpret(frames, { type: "auto_retry_start", attempt: 1, maxAttempts: 3, delayMs: 100 });
  const retried = interpret(frames, { type: "auto_retry_end", success: true, attempt: 1 });
  for (const result of [compacting, compacted, retrying, retried]) {
    assert.equal(result.kind, "runtime");
    if (result.kind !== "runtime") return;
    assert.equal(result.agentSettled, undefined);
    assert.equal(result.events.some(event => event.kind === "agent_settled"), false);
  }
  assert.equal(compacting.kind === "runtime" && compacting.events[0]?.kind === "workflow" && compacting.events[0].phase === "compacting", true);
  const settled = interpret(frames, { type: "agent_settled" });
  assert.equal(settled.kind, "runtime");
  if (settled.kind === "runtime") {
    assert.equal(settled.agentSettled, true);
    assert.deepEqual(settled.events.at(-1), { kind: "agent_settled", session: 1 });
  }
});

test("final and delta text stay within the projection budget after redaction expands them", () => {
  const frames = createRpcFrames();
  interpret(frames, { type: "message_start", message: { role: "assistant" } });
  const final = interpret(frames, { type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "a".repeat(65_526) + "password=x" }] } });
  assert.equal(final.kind, "runtime");
  if (final.kind !== "runtime") return;
  const message = final.events.find(event => event.kind === "message_final");
  assert.ok(message?.kind === "message_final");
  assert.equal(message.text.length, 65_536);
  assert.equal(message.text, "a".repeat(65_526) + "password=[");
  const delta = interpret(frames, { type: "message_update", assistantMessageEvent: { type: "text_delta", delta: "b".repeat(65_526) + "password=x" } });
  assert.equal(delta.kind, "runtime");
  if (delta.kind !== "runtime") return;
  const text = delta.events.find(event => event.kind === "text_delta");
  assert.ok(text?.kind === "text_delta");
  assert.equal(text.delta.length, 65_536);
});

test("a private-key marker redacts the whole final answer", () => {
  const frames = createRpcFrames();
  interpret(frames, { type: "message_start", message: { role: "assistant" } });
  const final = interpret(frames, { type: "message_end", message: { role: "assistant", content: [{ type: "text", text: privateKeyText }] } });
  assert.equal(final.kind, "runtime");
  if (final.kind !== "runtime") return;
  const message = final.events.find(event => event.kind === "message_final");
  assert.ok(message?.kind === "message_final");
  assert.equal(message.text, "[redacted]");
  assert.equal(message.text.includes("MII-synthetic-body"), false);
});

test("provider failure paths redact untrusted bodies and Stop-cancelled retry is silent", () => {
  const frames = createRpcFrames();
  const raw = '401: {"message":"authorization=synthetic-marker"}';
  const assistant = interpret(frames, { type: "message_end", message: { role: "assistant", content: [], stopReason: "error", errorMessage: raw } });
  const compaction = interpret(frames, { type: "compaction_end", reason: "overflow", aborted: false, willRetry: false, errorMessage: raw });
  const retry = interpret(frames, { type: "auto_retry_end", success: false, attempt: 1, finalError: raw });
  for (const result of [assistant, compaction, retry]) {
    assert.equal(result.kind, "runtime");
    if (result.kind !== "runtime") return;
    const failure = result.events.find(event => event.kind === "stream_error");
    assert.equal(failure?.kind === "stream_error" && failure.detail, "Model authentication failed. Check pi credentials and provider access, then try again.");
    assert.doesNotMatch(JSON.stringify(result), /synthetic-marker|authorization=/);
  }
  const cancelled = interpret(frames, { type: "auto_retry_end", success: false, attempt: 1, finalError: "Retry cancelled" }, { aborting: true });
  assert.equal(cancelled.kind, "runtime");
  if (cancelled.kind === "runtime") assert.equal(cancelled.events.some(event => event.kind === "stream_error"), false);
});

test("session-less runtime frames are ignored while RPC replies still classify", () => {
  const frames = createRpcFrames();
  assert.equal(interpret(frames, { type: "agent_settled" }, { session: 0 }).kind, "ignored");
  const rpc = interpret(frames, { type: "response", id: "req-1", success: true }, { session: 0 });
  assert.equal(rpc.kind, "rpc");
});
