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

test("unrecognized frames are ignored and recognized malformed frames fail", () => {
  const frames = createRpcFrames();
  assert.equal(interpret(frames, "not-json").kind, "ignored");
  assert.equal(interpret(frames, "").kind, "ignored");
  assert.equal(interpret(frames, []).kind, "ignored");
  assert.equal(interpret(frames, { type: "not_a_protocol_event" }).kind, "ignored");
  assert.equal(interpret(frames, { type: "compaction_start", reason: "invented" }).kind, "protocol-error");
});

test("assistant completion orders activity, final text and error", () => {
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
  assert.equal(text.delta, "b".repeat(65_526) + "password=[");
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

for (const bad of [null, false, 1, "text", [], {}, { type: "text", text: 1 }, { type: "thinking", thinking: null }]) {
  for (const event of [
    { type: "message_end", message: { role: "assistant", content: [{ type: "thinking", thinking: "must not mutate" }, bad] } },
    { type: "tool_execution_update", toolCallId: "tool", partialResult: { content: [{ type: "text", text: "must not project" }, bad] } },
    { type: "tool_execution_end", toolCallId: "tool", isError: false, result: { content: [bad] } },
  ]) test(`${event.type} rejects mixed malformed content ${JSON.stringify(bad)} atomically`, () => {
    const frames = createRpcFrames();
    assert.deepEqual(interpret(frames, event), { kind: "protocol-error" });
    const valid = interpret(frames, { type: "message_update", assistantMessageEvent: { type: "thinking_delta", contentIndex: 0, delta: "first" } });
    assert.equal(valid.kind, "runtime");
    if (valid.kind !== "runtime") return;
    const activity = valid.events.find(event => event.kind === "activity");
    assert.equal(activity?.kind === "activity" && activity.item.text, "first");
  });
}

for (const event of [
  { type: "message_start", message: null },
  { type: "message_start", message: { role: "assistant", content: [null] } },
  { type: "message_end", message: [] },
  { type: "message_end", message: { role: "assistant", content: null } },
  { type: "message_end", message: { role: "assistant", content: [], errorMessage: {} } },
  { type: "message_update", assistantMessageEvent: [] },
  { type: "message_update", assistantMessageEvent: { type: "text_delta", delta: {} } },
  { type: "message_update", assistantMessageEvent: { type: "thinking_delta", contentIndex: -1, delta: "text" } },
  { type: "message_update", assistantMessageEvent: { type: "thinking_end", contentIndex: 0, content: null } },
  { type: "tool_execution_start", toolCallId: "" },
  { type: "tool_execution_start", toolCallId: "x".repeat(201) },
  { type: "tool_execution_start", toolCallId: "tool", toolName: {} },
  { type: "tool_execution_update", toolCallId: "tool", partialResult: null },
  { type: "tool_execution_end", toolCallId: "tool", isError: "false", result: { content: [] } },
  { type: "tool_execution_end", toolCallId: "tool", isError: false, result: [] },
  { type: "compaction_end", reason: "overflow", aborted: "false", willRetry: true },
  { type: "auto_retry_start", attempt: -1, maxAttempts: 3, delayMs: 100 },
  { type: "auto_retry_start", attempt: 1, maxAttempts: 0, delayMs: 100 },
  { type: "auto_retry_end", success: "true" },
]) test(`recognized malformed event is a protocol failure: ${JSON.stringify(event)}`, () => {
  const frames = createRpcFrames();
  assert.deepEqual(interpret(frames, event), { kind: "protocol-error" });
  interpret(frames, { type: "message_start", message: { role: "assistant" } });
  const delta = interpret(frames, { type: "message_update", assistantMessageEvent: { type: "text_delta", delta: "valid" } });
  assert.equal(delta.kind, "runtime");
  if (delta.kind === "runtime") assert.deepEqual(delta.events, [{ kind: "text_delta", delta: "valid", session: 1, messageId: "message-1" }]);
});

test("empty and undisplayed content preserve text, thinking indexes, extra fields and event order", () => {
  const frames = createRpcFrames();
  interpret(frames, { type: "message_start", message: { role: "assistant", content: [] } });
  for (const content of [[], [{ type: "image", data: "opaque" }, { type: "toolCall", id: "opaque" }, { type: "thinking", thinking: "thought", signature: "not-projected" }, { type: "text", text: "answer", extra: true }]]) {
    const result = interpret(frames, { type: "message_end", message: { role: "assistant", content, extra: true }, extra: true });
    assert.equal(result.kind, "runtime");
    if (result.kind !== "runtime") return;
    const final = result.events.at(-1);
    assert.ok(final?.kind === "message_final");
    assert.equal(final.text, content.length ? "answer" : "");
    assert.doesNotMatch(JSON.stringify(result), /opaque|signature|not-projected|extra/);
    if (content.length) {
      const activity = result.events[0];
      assert.ok(activity.kind === "activity");
      assert.equal(activity.item.contentIndex, 2);
      assert.equal(activity.item.text, "thought");
    }
  }
});

test("deep tool arguments either project within bounds or fail explicitly without throwing", () => {
  const frames = createRpcFrames();
  const line = '{"type":"tool_execution_start","toolCallId":"deep","args":' + '['.repeat(20000) + '0' + ']'.repeat(20000) + '}';
  const result = interpret(frames, line);
  // Newer V8 can stringify deeply nested JSON iteratively; older engines can reject it.
  assert.ok(result.kind === "protocol-error" || result.kind === "runtime");
  if (result.kind === "runtime") {
    assert.equal(result.events.length, 1);
    const event = result.events[0];
    assert.ok(event.kind === "activity");
    assert.equal(event.item.input?.length, 16_384);
    assert.equal(event.item.truncated, true);
  }
});
