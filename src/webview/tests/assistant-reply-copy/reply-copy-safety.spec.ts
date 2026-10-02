import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import { readySettings } from "../../../extension/tests/harness.js";
import { createRpcFrames, type FrameContext } from "../../../adapter/runtime/rpc-frames.js";
import { uiHarness } from "../react-harness.js";

type SafetyCase = { name: string; text: string; stopReason?: string; aborting?: boolean };

async function observe(case_: SafetyCase): Promise<{ qualified: boolean; actions: number }> {
  const { r, h, v } = await readySettings();
  const ui = await uiHarness(false);
  const frames = createRpcFrames();
  const context: FrameContext = { session: r.runtime.getSession(), aborting: case_.aborting ?? false,
    gateId: "fixture", cwd: "/project", executionProfile: { kind: "controlled" } };
  const forward = (value: unknown) => {
    const result = frames.interpret(JSON.stringify(value), context);
    assert.equal(result.kind, "runtime");
    if (result.kind === "runtime") for (const event of result.events) r.events.fire(event);
  };
  try {
    v.action("sendChat", { text: "Question" });
    forward({ type: "message_start", message: { role: "assistant" } });
    forward({ type: "message_end", message: { role: "assistant", stopReason: case_.stopReason,
      content: [{ type: "text", text: case_.text }] } });
    await ui.receive(JSON.parse(JSON.stringify(v.state())));
    assert.match(ui.root.textContent ?? "", /Question/);
    return { qualified: v.state().messages.some(row => row.bodyCopyEligible === true),
      actions: ui.root.querySelectorAll('button[aria-label="Copy reply"]').length };
  } finally { await ui.close(); h.provider.dispose(); }
}

// Failure modes: abort-in-flight succeeds late; error/length/deferred is mistaken for
// complete; hidden or capped body escapes safety; global idle invents provenance.
test("aborting and unverified final bodies never offer whole reply copy", async () => {
  const cases: SafetyCase[] = [{ name: "abort-in-flight", text: "Late finished body", stopReason: "stop", aborting: true },
    ...[undefined, "pending", "length", "toolUse", "error", "aborted", "deferred"].map(stopReason =>
      ({ name: stopReason ?? "missing-reason", text: "Partial body", stopReason })),
    { name: "empty", text: " \n", stopReason: "stop" },
    { name: "hidden", text: "password=synthetic-value", stopReason: "stop" },
    { name: "truncated", text: "x".repeat(65537), stopReason: "stop" }];
  const observed = [];
  try {
    for (const case_ of cases) {
      const result = await observe(case_);
      observed.push({ name: case_.name, ...result });
      assert.equal(result.qualified, false, case_.name);
      assert.equal(result.actions, 0, case_.name);
    }
    await mkdir("dist/wi081-copy", { recursive: true });
    await writeFile("dist/wi081-copy/safety.json", JSON.stringify({ status: "passed", observed }, null, 2));
  } catch (error) {
    await mkdir("dist/wi081-copy", { recursive: true });
    await writeFile("dist/wi081-copy/safety-red.json", JSON.stringify({ status: "failed", observed,
      error: error instanceof Error ? error.message : "unknown" }, null, 2));
    throw error;
  }
});
