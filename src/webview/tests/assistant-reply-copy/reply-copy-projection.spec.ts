import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import { readySettings } from "../../../extension/tests/harness.js";
import { createRpcFrames } from "../../../adapter/runtime/rpc-frames.js";
import { uiHarness } from "../react-harness.js";
import { parseHostMessage } from "../../client/parse-host-message.js";

// Failure modes: producer drops completion fact; host guesses from global idle;
// final redaction/truncation is hidden; delta retains obsolete eligibility.
test("public final frame transfers complete safe body eligibility through host projection", async () => {
  const { r, h, v } = await readySettings();
  const ui = await uiHarness(false);
  const frames = createRpcFrames();
  const context = { session: r.runtime.getSession(), aborting: false, gateId: "fixture", cwd: "/project", executionProfile: { kind: "controlled" as const } };
  const forward = (value: unknown) => {
    const result = frames.interpret(JSON.stringify(value), context);
    assert.equal(result.kind, "runtime");
    if (result.kind === "runtime") for (const event of result.events) r.events.fire(event);
  };
  try {
    v.action("sendChat", { text: "Question" });
    forward({ type: "message_start", message: { role: "assistant" } });
    forward({ type: "message_end", message: { role: "assistant", stopReason: "stop", content: [
      { type: "thinking", thinking: "Separate reasoning" }, { type: "text", text: "# Complete\n\nExact body.\n" },
    ] } });
    const row = v.state().messages.at(-1);
    assert.equal(row?.text, "# Complete\n\nExact body.\n");
    assert.equal(row && Reflect.get(row, "bodyCopyEligible"), true);
    const published: unknown = JSON.parse(JSON.stringify(v.state()));
    assert.ok(parseHostMessage(published), "production host JSON workspace projection validates");
    await ui.receive(published);
    assert.equal(ui.root.querySelectorAll('button[aria-label="Copy reply"]').length, 1);
    forward({ type: "message_update", assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "Streaming again" } });
    await ui.receive(JSON.parse(JSON.stringify(v.state())));
    assert.equal(v.state().messages.some(message => message.bodyCopyEligible), false);
    assert.equal(ui.root.querySelectorAll('button[aria-label="Copy reply"]').length, 0);
    await mkdir("dist/wi081-copy", { recursive: true });
    await writeFile("dist/wi081-copy/producer.json", JSON.stringify({ status: "passed", seam: "public JSONL frame → host projection", eligibility: true, streamingRemovedCopy: true }, null, 2));
  } catch (error) {
    await mkdir("dist/wi081-copy", { recursive: true });
    await writeFile("dist/wi081-copy/producer-red.json", JSON.stringify({ status: "failed", seam: "public JSONL frame → host projection",
      error: error instanceof Error ? error.message : "unknown" }, null, 2));
    throw error;
  } finally { await ui.close(); h.provider.dispose(); }
});
