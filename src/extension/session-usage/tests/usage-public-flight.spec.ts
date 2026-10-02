import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { createPiRpcRuntime } from "../../../adapter/runtime/index.js";
import { createMemoryConnection, createMemoryProcess, type MemoryConnection } from "../../../adapter/runtime/tests/memory-process.js";
import { folder, harness, tick } from "../../tests/harness.js";
import type { SessionUsageStateMessage } from "../../contracts/index.js";

function deferredPublicUsage() {
  let connection: MemoryConnection, firstStats: Record<string, unknown> | undefined, reads = 0, prompts = 0;
  const identity = { sessionId: "deferred", sessionFile: "/owned/deferred.jsonl" };
  const model = { provider: "fixture", id: "fixture", name: "Fixture", api: "openai-completions", reasoning: false,
    input: ["text"], contextWindow: 1000, maxTokens: 100, cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 } };
  const memory = createMemoryProcess(options => {
    connection = createMemoryConnection((text, done) => {
      const request = JSON.parse(text); done();
      queueMicrotask(() => {
        if (request.type === "get_session_stats" && ++reads === 1) { firstStats = request; return; }
        if (request.type === "get_state") connection.frame({ type: "extension_ui_request", method: "notify", message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: options.cwd }) });
        const data = request.type === "get_state" ? { ...identity, model, thinkingLevel: "off", isStreaming: false, isCompacting: false, pendingMessageCount: 0, messageCount: 0 }
          : request.type === "get_session_stats" ? { ...identity, tokens: { input: 100, output: 2, cacheRead: 0, cacheWrite: 0, total: 102 }, cost: 0.001 }
          : request.type === "get_available_models" ? { models: [model] } : request.type === "get_commands" ? { commands: [] } : {};
        connection.frame({ type: "response", id: request.id, command: request.type, success: true, data });
        if (request.type === "prompt") { prompts++; connection.frame({ type: "agent_start" }); }
      }); return true;
    }); return connection;
  });
  return { runtime: createPiRpcRuntime({ process: memory.process, cliPath: () => "fixture", gateAccess: async () => undefined, startupModel: () => undefined }),
    get reads() { return reads; }, get prompts() { return prompts; }, settle() { connection.frame({ type: "agent_settled" }); },
    finishFirst() { assert.ok(firstStats); connection.frame({ type: "response", id: firstStats.id, command: "get_session_stats", success: false, error: "fixture" }); } };
}

test("a settled admitted task requests one fresh read after an initial in-flight public statistics failure", async () => {
  const f = deferredPublicUsage(), host = harness([folder()], true, undefined, f.runtime), view = host.createView(); let passed = false;
  try {
    view.action("chooseResources", { choice: "allow" }); await tick(); assert.equal(f.reads, 1);
    view.action("refreshSessionUsage"); view.action("refreshSessionUsage"); await tick(); assert.equal(f.reads, 1);
    view.action("sendChat", { text: "admitted task" }); await tick(); assert.equal(f.prompts, 1);
    f.settle(); await tick(); assert.equal(f.reads, 1);
    f.finishFirst(); await tick(); await tick(); assert.equal(f.reads, 2);
    const last = [...view.sent].reverse().find(value => (value as { type: string }).type === "sessionUsageState") as SessionUsageStateMessage;
    assert.equal(last.status, "ready"); assert.equal(last.usage?.tokens.total, 102);
    await tick(); assert.equal(f.reads, 2); passed = true;
  } finally {
    host.provider.dispose(); mkdirSync("dist/wi079-session-usage", { recursive: true });
    writeFileSync("dist/wi079-session-usage/host-public-flight.json", JSON.stringify({ passed, reads: f.reads, prompts: f.prompts, limits: ["public byte transport fixture", "synthetic VS Code"] }, null, 2));
  }
});
