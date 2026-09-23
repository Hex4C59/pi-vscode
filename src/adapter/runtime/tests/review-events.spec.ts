import assert from "node:assert/strict";
import { test } from "node:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { ChildProcess, spawn } from "node:child_process";
import type { RuntimeEvent } from "../../../extension/contracts/runtimeLifecycle.js";
import { createPiRpcRuntime } from "../pi-rpc-runtime.js";

test("review completion events survive activity overflow and reject malformed or old-runtime frames", async () => {
  const outputs: PassThrough[] = [];
  const fakeSpawn = ((_command: string, _args: string[], options: { cwd: string; env: Record<string, string> }) => {
    const stdout = new PassThrough(); outputs.push(stdout);
    const child: EventEmitter & { exitCode: number | null; signalCode: null; kill: () => boolean } = Object.assign(new EventEmitter(), { exitCode: null, signalCode: null, kill: () => { child.exitCode = 0; queueMicrotask(() => child.emit("close")); return true; } });
    const stdin = Object.assign(new EventEmitter(), { destroyed: false, writableEnded: false, write(frame: string) {
      const command = JSON.parse(frame);
      if (command.type === "get_state") queueMicrotask(() => {
        stdout.write(JSON.stringify({ type: "extension_ui_request", method: "notify", message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: options.cwd }) }) + "\n");
        stdout.write(JSON.stringify({ type: "response", id: command.id, success: true, ...(command.type === "get_state" ? { data: { sessionId: "fixture-session", sessionFile: "/private-store/fixture.jsonl" } } : {}) }) + "\n");
      }); return true;
    } });
    return Object.assign(child, { stdout, stdin, stderr: new PassThrough() }) as unknown as ChildProcess;
  }) as unknown as typeof spawn;
  const runtime = createPiRpcRuntime({ spawn: fakeSpawn, cliPath: () => "fixture", gateAccess: async () => undefined, startupModel: () => undefined });
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
    for (const bad of [{ toolCallId: "", isError: false }, { toolCallId: "x".repeat(201), isError: false }, { toolCallId: "bad", isError: "false" }]) frame({ type: "tool_execution_end", ...bad });
    assert.equal(events.filter(event => event.kind === "tool_finished").length, 70);
    await runtime.stop();
    assert.equal((await runtime.start({ cwd: "/new", projectTrust: "no-approve" })).ok, true);
    frame({ type: "tool_execution_end", toolCallId: "late-old", isError: false });
    assert.equal(events.filter(event => event.kind === "tool_finished").length, 70);
    outputs[1].write(JSON.stringify({ type: "tool_execution_end", toolCallId: "new", isError: false }) + "\n");
    assert.deepEqual(events.filter(event => event.kind === "tool_finished").at(-1), { kind: "tool_finished", session: runtime.getSession(), toolCallId: "new", failed: false });
  } finally { unsubscribe(); await runtime.stop(); }
});
