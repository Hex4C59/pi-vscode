import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { createPiRpcRuntime } from "../index.js";
import { createMemoryConnection, createMemoryProcess, type MemoryConnection } from "./memory-process.js";

function usageFixture() {
  let connection: MemoryConnection;
  let afterStats: () => void = () => undefined;
  const frames: string[] = [];
  const identity = { sessionId: "usage-session", sessionFile: "/owned/usage.jsonl" };
  let stats: Record<string, unknown> = { ...identity, tokens: { input: 11, output: 7, cacheRead: 5, cacheWrite: 3, total: 26 },
    cost: 0.125, contextUsage: { tokens: 9, contextWindow: 1000, percent: 0.9 } };
  let state: Record<string, unknown> = { ...identity, isStreaming: false, isCompacting: false, pendingMessageCount: 0, messageCount: 0,
    model: { cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 } } };
  const memory = createMemoryProcess(options => {
    connection = createMemoryConnection((text, done) => {
      const request = JSON.parse(text); frames.push(request.type);
      queueMicrotask(() => {
        if (request.type === "get_state") connection.frame({ type: "extension_ui_request", method: "notify", message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: options.cwd }) });
        const data = request.type === "get_state" ? state : request.type === "get_session_stats" ? stats : request.type === "get_commands" ? { commands: [] } : {};
        connection.frame({ type: "response", command: request.type, id: request.id, success: true, data });
        if (request.type === "get_session_stats") afterStats();
      });
      done(); return true;
    }); return connection;
  });
  const runtime = createPiRpcRuntime({ process: memory.process, cliPath: () => "fixture", startupModel: () => undefined, gateAccess: async () => undefined });
  return { runtime, frames, afterStats(action: () => void) { afterStats = action; }, setStats(value: Record<string, unknown>) { stats = value; }, setState(value: Record<string, unknown>) { state = { ...state, ...value }; }, get stats() { return stats; } };
}

test("public runtime statistics separates whole session from current context and removes metadata", async () => {
  const f = usageFixture();
  let result: unknown;
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    result = await f.runtime.getSessionUsage?.(f.runtime.getSession());
    mkdirSync("dist/wi079-session-usage", { recursive: true });
    writeFileSync("dist/wi079-session-usage/adapter-rpc.json", JSON.stringify({ result, frames: f.frames, limits: ["synthetic byte transport"] }, null, 2));
    assert.deepEqual(result, { ok: true, usage: { tokens: { input: 11, output: 7, cacheRead: 5, cacheWrite: 3, total: 26 },
      context: { tokens: 9, contextWindow: 1000, percent: 0.9 }, cost: 0.125 } });
    assert.equal(f.frames.includes("get_session_stats"), true);
    assert.equal(JSON.stringify(result).includes("sessionFile"), false);
  } finally { await f.runtime.stop(); }
});

test("zero reported cost with zero-only model pricing remains unknown rather than free", async () => {
  const f = usageFixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    f.setStats({ ...f.stats, cost: 0 });
    f.setState({ model: { cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } } });
    const result = await f.runtime.getSessionUsage?.(f.runtime.getSession());
    assert.equal(result?.ok, true);
    if (result?.ok) assert.equal(result.usage.cost, null);
  } finally { await f.runtime.stop(); }
});

test("statistics that complete across an upstream session replacement never become ready", async () => {
  const f = usageFixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    f.afterStats(() => f.setState({ sessionId: "replacement", sessionFile: "/owned/replacement.jsonl" }));
    const result = await f.runtime.getSessionUsage?.(f.runtime.getSession());
    assert.equal(result?.ok, false);
  } finally { await f.runtime.stop(); }
});

test("consistent statistics for an unrequested upstream session still fail the startup identity guard", async () => {
  const f = usageFixture();
  try {
    assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    f.setState({ sessionId: "replacement", sessionFile: "/owned/replacement.jsonl" });
    f.setStats({ ...f.stats, sessionId: "replacement", sessionFile: "/owned/replacement.jsonl" });
    assert.equal((await f.runtime.getSessionUsage?.(f.runtime.getSession()))?.ok, false);
  } finally { await f.runtime.stop(); }
});
