import assert from "node:assert/strict";
import { test } from "node:test";
import { createRpcFrames } from "../../adapter/runtime/rpc-frames.js";
import { readySettings, tick } from "./harness.js";

for (const [label, fragments, expected] of [
  ["Bearer", ["Bearer SYNTHETIC_PREFIX", "_SYNTHETIC_TAIL"], "Bearer [redacted]"],
  ["private key", ["-----BEGIN PRIVATE KEY-----", "\nSYNTHETIC_PRIVATE_PAYLOAD"], "[redacted]"],
  ["quoted field", ['password="SYNTHETIC_ALPHA ', 'SYNTHETIC_BETA"'], 'password="[redacted]"'],
] satisfies [string, string[], string][]) {
  test(`host publishes only redacted thinking on every frame and view recreation: ${label}`, async () => {
    const { r, h, v } = await readySettings();
    const frames = createRpcFrames();
    const forward = (value: unknown) => {
      const result = frames.interpret(JSON.stringify(value), { session: r.runtime.getSession(), aborting: false,
        gateId: "synthetic-gate", cwd: "/project", executionProfile: { kind: "controlled" } });
      assert.equal(result.kind, "runtime");
      if (result.kind !== "runtime") throw new Error("Expected runtime frame");
      for (const event of result.events) r.events.fire(event);
    };
    try {
      v.action("sendChat", { text: "inspect the fixture" });
      await tick();
      forward({ type: "message_start", message: { role: "assistant" } });
      for (const delta of fragments) {
        forward({ type: "message_update", assistantMessageEvent: { type: "thinking_delta", contentIndex: 0, delta } });
        assert.equal(JSON.stringify(v.sent).includes("SYNTHETIC_"), false);
      }
      assert.equal(v.state().activities[0].text, expected);
      v.dispose.fire();
      const recreated = h.createView();
      assert.equal(recreated.state().activities[0].text, expected);
      assert.equal(JSON.stringify(recreated.sent).includes("SYNTHETIC_"), false);
      r.settled();
      assert.equal(recreated.state().execution, "completed");
    } finally { h.provider.dispose(); }
  });
}

test("host tool activity publishes complete redacted JSON values without raw buffers", async () => {
  const { r, h, v } = await readySettings();
  const frames = createRpcFrames();
  try {
    v.action("sendChat", { text: "inspect the fixture" });
    await tick();
    const result = frames.interpret(JSON.stringify({ type: "tool_execution_start", toolCallId: "tool-1", toolName: "read",
      args: { password: 'SYNTHETIC_ALPHA " SYNTHETIC_BETA', note: "visible" } }),
    { session: r.runtime.getSession(), aborting: false, gateId: "synthetic-gate", cwd: "/project", executionProfile: { kind: "controlled" } });
    assert.equal(result.kind, "runtime");
    if (result.kind !== "runtime") throw new Error("Expected runtime frame");
    for (const event of result.events) r.events.fire(event);
    assert.deepEqual(JSON.parse(v.state().activities[0].input ?? ""), { password: "[redacted]", note: "visible" });
    assert.equal(JSON.stringify(v.sent).includes("SYNTHETIC_"), false);
    assert.equal(JSON.stringify(v.sent).includes('"raw"'), false);
  } finally { h.provider.dispose(); }
});
