import assert from "node:assert/strict";
import test from "node:test";
import { runSessionWorkerRequest, type SessionManagerApi, type SessionInfoLike } from "../sessionWorker.js";
import { isSessionWorkerRequest } from "../session-worker-protocol.js";

// Before code: global/current-page search, totals/order/clamp, uncertain scans,
// wrong-project data, malformed criteria and abort must never look like success.
const root = "/isolated-project";
const signal = new AbortController().signal;
function source(count: number): SessionInfoLike[] {
  return Array.from({ length: count }, (_, index) => ({ id: `session-${index.toString().padStart(4, "0")}`,
    path: `${root}/sessions/${index}.jsonl`, cwd: root, ...(index % 2 ? { name: `Task ${index.toString().padStart(4, "0")}` } : {}),
    firstMessage: `message ${index}`, modified: new Date(Date.UTC(2026, 8, 1, 0, index)) }));
}
function environment(values: SessionInfoLike[]) {
  let lists = 0; const manager: SessionManagerApi = {
    async list(cwd, directory) { assert.equal(cwd, root); assert.equal(directory, undefined); lists++; return values; },
    findById() { throw new Error("Search must not select a session"); },
    open() { throw new Error("Search must not read branches"); },
  };
  return { sessionManager: manager, fileSystem: {
    async stat(value: string) { return { isDirectory: () => value === root, isFile: () => value.startsWith(root + "/sessions/") }; },
    async realpath(value: string) { return value; },
  }, get lists() { return lists; } };
}
function request(page: number, query = "", namedOnly = false, sort = "recent") {
  return { version: 1, action: "list", root, page, search: { query, namedOnly, sort } };
}

test("worker searches the complete project metadata catalogue and normalizes literal Unicode", async () => {
  const values = source(40); values[39] = { ...values[39]!, name: "Ｎｅｅｄｌｅ" };
  const env = environment(values);
  const found = await runSessionWorkerRequest(request(0, "needle"), env, signal);
  assert.equal(found.ok, true);
  if (!found.ok || found.action !== "list") throw new Error("Expected list");
  assert.equal(found.total, 1); assert.equal(found.entries[0]?.id, "session-0039");
  assert.equal(env.lists, 1);
  const literal = await runSessionWorkerRequest(request(0, "message .*"), env, signal);
  assert.ok(literal.ok && literal.action === "list" && literal.total === 0);
});

test("worker filters and sorts before paging with consistent totals, stable names and page clamping", async () => {
  const env = environment(source(40));
  const oldest = await runSessionWorkerRequest(request(1, "message", true, "oldest"), env, signal);
  assert.ok(oldest.ok && oldest.action === "list");
  if (!oldest.ok || oldest.action !== "list") throw new Error("Expected list");
  assert.equal(oldest.total, 20); assert.equal(oldest.entries.length, 4); assert.equal(oldest.entries[0]?.id, "session-0033");
  const recent = await runSessionWorkerRequest(request(0, "message", true), env, signal);
  assert.ok(recent.ok && recent.action === "list" && recent.entries[0]?.id === "session-0039");
  const name = await runSessionWorkerRequest(request(0, "Task", true, "name"), env, signal);
  assert.ok(name.ok && name.action === "list" && name.entries[0]?.id === "session-0001");
  const clamped = await runSessionWorkerRequest(request(999, "Task", true, "oldest"), env, signal);
  assert.ok(clamped.ok && clamped.action === "list" && clamped.page === 1 && clamped.entries.length === 4);
});

test("worker refuses over-budget, malformed, cancelled and cross-project searches without partial results", async () => {
  assert.equal(isSessionWorkerRequest(request(0, "x".repeat(257))), false);
  assert.equal(isSessionWorkerRequest(request(0, "", false, "wrong")), false);
  assert.equal(isSessionWorkerRequest({ ...request(0), search: { query: "", namedOnly: false, sort: "recent", path: "/foreign" } }), false);
  const tooLarge = await runSessionWorkerRequest(request(0), environment(source(5001)), signal);
  assert.deepEqual(tooLarge, { version: 1, ok: false, code: "catalogue-too-large" });
  const controller = new AbortController(); controller.abort();
  assert.equal((await runSessionWorkerRequest(request(0), environment(source(1)), controller.signal)).ok, false);
  const foreign = source(1); foreign[0] = { ...foreign[0]!, cwd: "/foreign" };
  assert.deepEqual(await runSessionWorkerRequest(request(0), environment(foreign), signal), { version: 1, ok: false, code: "wrong-project" });
});
