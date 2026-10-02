import assert from "node:assert/strict";
import test from "node:test";
import type { SavedSessionSearch, SessionBackend, SessionStateMessage } from "../contracts/index.js";
import { folder, harness, settingsRuntime, tick } from "./harness.js";

// Before code: explicit identity-bound criteria, same criteria on page/refetch,
// stale/failed new search and no automatic restore or additional body reads.
async function fixture() {
  const calls: { page: number; search: SavedSessionSearch | undefined; signal: AbortSignal }[] = [];
  let failure = false;
  const backend: SessionBackend = {
    async list(_cwd, page, signal, search) {
      calls.push({ page, search, signal });
      return failure ? { ok: false, code: "unavailable" } : { ok: true, entries: [{ id: "saved-1", path: "/isolated/saved.jsonl", name: "Named", firstMessage: "preview", modified: "2026-09-01T00:00:00Z" }], page, total: 20 };
    },
    async inspect() { throw new Error("Search cannot inspect or restore"); },
    async history() { throw new Error("Search cannot read history"); },
    async preview() { throw new Error("Search cannot read bodies"); },
  };
  const r = settingsRuntime(); const h = harness([folder()], true, undefined, r.runtime, backend);
  const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick();
  const state = () => [...v.sent].reverse().find(message => (message as { type: string }).type === "sessionState") as SessionStateMessage;
  return { h, v, calls, state, fail() { failure = true; } };
}

test("host applies named metadata criteria before paging and keeps them for refetch, without restoring", async () => {
  const f = await fixture(); const search = { query: "needle", namedOnly: true, sort: "oldest" as const };
  try {
    f.v.action("searchSavedSessions", search); await tick(); await tick();
    assert.deepEqual(f.calls[0]?.search, search); assert.equal(f.calls[0]?.page, 0);
    assert.deepEqual(f.state().search, search); assert.equal(f.state().total, 20);
    f.v.action("getSavedSessions", { page: 1 }); await tick(); await tick();
    assert.deepEqual(f.calls[1]?.search, search); assert.equal(f.state().page, 1);
    f.v.action("getSavedSessions", { page: 0 }); await tick(); await tick();
    assert.deepEqual(f.calls[2]?.search, search);
    assert.equal(f.state().current, null);
  } finally { f.h.provider.dispose(); }
});

test("new failed search clears mismatched old rows and malformed or stale search has no effect", async () => {
  const f = await fixture();
  try {
    f.v.action("getSavedSessions", { page: 0 }); await tick(); await tick(); assert.equal(f.state().entries.length, 1);
    f.fail(); f.v.action("searchSavedSessions", { query: "not found", namedOnly: false, sort: "name" }); await tick(); await tick();
    assert.equal(f.state().entries.length, 0); assert.equal(f.state().error, "unavailable");
    const count = f.calls.length;
    f.v.action("searchSavedSessions", { query: "x".repeat(257), namedOnly: false, sort: "recent" });
    f.v.send("searchSavedSessions", { generation: 999, viewId: "old", query: "old", namedOnly: false, sort: "recent" });
    await tick(); assert.equal(f.calls.length, count);
  } finally { f.h.provider.dispose(); }
});
