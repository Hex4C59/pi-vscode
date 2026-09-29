import assert from "node:assert/strict";
import { test } from "node:test";
import type { PassThrough } from "node:stream";
import { createMemoryConnection, createMemoryProcess } from "./memory-process.js";
import type { RuntimeEvent } from "../../../extension/contracts/runtimeLifecycle.js";
import { createPiRpcRuntime } from "../pi-rpc-runtime.js";

test("review completion events survive activity overflow and reject old-runtime frames", async () => {
  const outputs: PassThrough[] = [];
  const memory = createMemoryProcess(options => {
    const connection = createMemoryConnection((frame, done) => {
      const stdout = connection.stdout;
      const command = JSON.parse(frame);
      if (command.type === "get_state") queueMicrotask(() => {
        stdout.write(JSON.stringify({ type: "extension_ui_request", method: "notify", message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: options.cwd }) }) + "\n");
        stdout.write(JSON.stringify({ type: "response", id: command.id, command: command.type, success: true, ...(command.type === "get_state" ? { data: { sessionId: "fixture-session", sessionFile: "/private-store/fixture.jsonl" } } : {}) }) + "\n");
      }); done(); return true;
    });
    outputs.push(connection.stdout);
    return connection;
  });
  const runtime = createPiRpcRuntime({ process: memory.process, cliPath: () => "fixture", gateAccess: async () => undefined, startupModel: () => undefined });
  const events: RuntimeEvent[] = []; const unsubscribe = runtime.subscribe(event => events.push(event));
  try {
    assert.equal((await runtime.start({ cwd: "/fixture", projectTrust: "no-approve" })).ok, true);
    const session = runtime.getSession(); const output = outputs[0];
    const frame = (value: unknown) => output.write(JSON.stringify(value) + "\n");
    for (let i = 0; i < 70; i++) {
      frame({ type: "tool_execution_start", toolCallId: "call-" + i, toolName: "write", args: { path: "file.ts", content: "new" } });
      frame({ type: "tool_execution_end", toolCallId: "call-" + i, toolName: "write", isError: i === 69, result: { content: [] } });
    }
    const completed = events.filter(event => event.kind === "tool_finished");
    assert.equal(completed.length, 70); assert.deepEqual(completed.at(-1), { kind: "tool_finished", session, toolCallId: "call-69", failed: true });
    assert.ok(events.some(event => event.kind === "activity" && event.item.id === "activity-overflow"));
    await runtime.stop();
    assert.equal((await runtime.start({ cwd: "/new", projectTrust: "no-approve" })).ok, true);
    frame({ type: "tool_execution_end", toolCallId: "late-old", isError: false });
    assert.equal(events.filter(event => event.kind === "tool_finished").length, 70);
    outputs[1].write(JSON.stringify({ type: "tool_execution_end", toolCallId: "new", isError: false, result: { content: [] } }) + "\n");
    assert.deepEqual(events.filter(event => event.kind === "tool_finished").at(-1), { kind: "tool_finished", session: runtime.getSession(), toolCallId: "new", failed: false });
  } finally { unsubscribe(); await runtime.stop(); }
});
