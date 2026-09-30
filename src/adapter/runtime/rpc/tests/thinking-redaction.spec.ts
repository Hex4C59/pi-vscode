import assert from "node:assert/strict";
import { test } from "node:test";
import { createRpcFrames, type FrameContext } from "../../rpc-frames.js";
import { redactCredentialLikeText, type ActivityItem } from "../../../../extension/contracts/index.js";

const LIMIT = 16_384;
const context: FrameContext = { session: 1, aborting: false, gateId: "synthetic-gate", cwd: "/synthetic", executionProfile: { kind: "controlled" } };

function stream() {
  const frames = createRpcFrames();
  const parse = (event: Record<string, unknown>): ActivityItem[] => {
    const frame = frames.interpret(JSON.stringify(event), context);
    assert.equal(frame.kind, "runtime");
    if (frame.kind !== "runtime") throw new Error("Expected valid runtime event");
    return frame.events.flatMap((event) => event.kind === "activity" ? [event.item] : []);
  };
  return {
    reset: () => frames.reset(),
    start: () => parse({ type: "message_start", message: { role: "assistant" } }),
    delta: (delta: string, contentIndex = 0) => parse({ type: "message_update", assistantMessageEvent: { type: "thinking_delta", contentIndex, delta } })[0],
    end: (content: string, contentIndex = 0) => parse({ type: "message_update", assistantMessageEvent: { type: "thinking_end", contentIndex, content } })[0],
    final: (thinking: string) => parse({ type: "message_end", message: { role: "assistant", content: [{ type: "thinking", thinking }] } })[0],
    parse,
  };
}

for (const [name, text] of [
  ["Bearer", "use Bearer SYNTHETIC_PREFIX_SYNTHETIC_TAIL later"],
  ["private key", "before -----BEGIN PRIVATE KEY-----\nSYNTHETIC_PRIVATE_PAYLOAD\nafter"],
  ["quoted field", 'note password="SYNTHETIC_ALPHA \\" SYNTHETIC_BETA" tail'],
  ["unquoted field", "note access_token=SYNTHETIC_PREFIX_SYNTHETIC_TAIL later"],
]) {
  test(`thinking retains credential context across every two-fragment split: ${name}`, () => {
    for (let split = 1; split < text.length; split++) {
      const s = stream();
      s.start();
      assert.equal(s.delta(text.slice(0, split)).text, redactCredentialLikeText(text.slice(0, split)));
      const item = s.delta(text.slice(split));
      assert.equal(item.text, redactCredentialLikeText(text), `split at ${split}`);
      assert.equal(item.truncated, false);
      assert.equal(item.status, "thinking");
    }
  });

  test(`thinking checks each one-character fragment before final correction: ${name}`, () => {
    const s = stream();
    s.start();
    let raw = "";
    for (const character of text) {
      raw += character;
      assert.equal(s.delta(character).text, redactCredentialLikeText(raw));
    }
  });
}

test("raw thinking budget cannot be reclaimed by redaction shortening the display", () => {
  const s = stream();
  s.start();
  const first = s.delta("Bearer " + "X".repeat(LIMIT));
  assert.equal(first.text, "Bearer [redacted]");
  assert.equal(first.truncated, true);
  const tail = s.delta("SYNTHETIC_TAIL visible tail".repeat(100));
  assert.equal(tail.text, first.text);
  assert.equal(tail.truncated, true);
  assert.equal(s.end("authoritative safe summary").text, "authoritative safe summary");
});

test("raw budget exhaustion inside a marker or quoted value omits every later fragment", () => {
  for (const prefix of ["Bearer ", "-----BEGIN PRIVATE", 'password="', 'secret="SYNTHETIC \\']) {
    const s = stream();
    s.start();
    const raw = "x".repeat(LIMIT - prefix.length - 1) + " " + prefix;
    const first = s.delta(raw);
    const tail = s.delta("SYNTHETIC_TAIL KEY-----\nSYNTHETIC_PRIVATE_PAYLOAD");
    assert.equal(tail.text, first.text);
    assert.equal(tail.text.includes("SYNTHETIC_TAIL"), false);
    assert.equal(tail.text.includes("SYNTHETIC_PRIVATE_PAYLOAD"), false);
    assert.equal(tail.truncated, true);
    assert.ok(tail.text.length <= LIMIT);
  }
});

test("ordinary thinking remains cumulative until its raw budget, not a rolling suffix", () => {
  const s = stream();
  s.start();
  assert.equal(s.delta("ordinary ").text, "ordinary ");
  assert.equal(s.delta("continuation").text, "ordinary continuation");
  assert.equal(s.delta("x".repeat(LIMIT)).text, ("ordinary continuation" + "x".repeat(LIMIT)).slice(0, LIMIT));
  const tail = s.delta("different omitted text");
  assert.equal(tail.text.includes("different"), false);
  assert.equal(tail.truncated, true);
});

test("interleaved content indexes, new messages and reset keep distinct raw contexts", () => {
  const s = stream();
  s.start();
  const first = s.delta("Bearer SYNTHETIC_FIRST", 0);
  assert.equal(s.delta("ordinary second", 1).text, "ordinary second");
  assert.equal(s.delta("_TAIL", 0).text, "Bearer [redacted]");
  assert.equal(s.delta(" continued", 1).text, "ordinary second continued");
  s.start();
  const next = s.delta("fresh message", 0);
  assert.notEqual(next.id, first.id);
  assert.equal(next.text, "fresh message");
  s.reset();
  assert.equal(s.delta("fresh runtime", 0).text, "fresh runtime");
});

test("authoritative thinking completion replaces raw context and rejects late continuation", () => {
  const s = stream();
  s.start();
  s.delta("Bearer SYNTHETIC_OLD");
  const final = s.end("corrected ordinary content");
  assert.equal(final.text, "corrected ordinary content");
  assert.equal(final.status, "complete");
  assert.equal(s.delta("SYNTHETIC_LATE").text, final.text);
  assert.equal(s.final("-----BEGIN PRIVATE KEY-----\nSYNTHETIC_FINAL").text, "[redacted]");
  assert.equal(s.delta("SYNTHETIC_AFTER_FINAL").text, "[redacted]");
  assert.equal(s.end("late non-authoritative correction").text, "[redacted]");
});

test("final message clears an unfinished thinking block even when final content omits it", () => {
  const s = stream();
  s.start();
  s.delta("Bearer SYNTHETIC_OLD", 1);
  s.parse({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "done" }] } });
  const late = s.delta("SYNTHETIC_AFTER_END", 1);
  assert.equal(late.text, "Bearer [redacted]");
  s.start();
  assert.equal(s.delta("ordinary next", 1).text, "ordinary next");
});

test("thinking overflow retains only admitted entries and reset admits a fresh stream", () => {
  const s = stream();
  s.start();
  for (let index = 0; index < 63; index++) s.delta("Bearer SYNTHETIC_" + index, index);
  for (let index = 63; index < 100; index++) {
    assert.equal(s.delta("-----BEGIN PRIVATE KEY-----", index).id, "activity-overflow");
    assert.equal(s.delta("SYNTHETIC_OMITTED", index).id, "activity-overflow");
  }
  assert.equal(s.delta("_TAIL", 0).text, "Bearer [redacted]");
  s.reset();
  assert.equal(s.delta("ordinary after reset", 100).text, "ordinary after reset");
});

test("tool JSON input and cumulative output use complete values without becoming thinking deltas", () => {
  const s = stream();
  s.start();
  const start = s.parse({ type: "tool_execution_start", toolCallId: "synthetic", toolName: "read", args: { password: 'SYNTHETIC_ALPHA " SYNTHETIC_BETA', note: "keep" } })[0];
  assert.deepEqual(JSON.parse(start.input ?? ""), { password: "[redacted]", note: "keep" });
  const update = (text: string) => s.parse({ type: "tool_execution_update", toolCallId: "synthetic", partialResult: { content: [{ type: "text", text }] } })[0];
  assert.equal(update('password="SYNTHETIC_ALPHA SYNTHETIC_BETA"').text, 'password="[redacted]"');
  assert.equal(update("complete replacement").text, "complete replacement");
});
