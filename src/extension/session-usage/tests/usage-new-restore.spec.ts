import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { folder, harness, settingsRuntime, tick } from "../../tests/harness.js";
import type { SessionUsageStateMessage, SessionStateMessage } from "../../contracts/index.js";
const latestUsage = (sent: unknown[]) => [...sent].reverse().find(value => (value as { type: string }).type === "sessionUsageState") as SessionUsageStateMessage;

test("New and Restore refresh their own stable statistics rather than inheriting old totals", async () => {
  const r = settingsRuntime(); const start = r.runtime.start; let reads = 0, restored = false;
  r.runtime.start = async options => {
    restored = !!options.resume; const result = await start(options);
    return result.ok ? { ...result, conversation: { id: options.resume?.id ?? `fresh-${r.runtime.getSession()}`,
      path: options.resume?.path ?? "/private/new.jsonl", name: null } } : result;
  };
  r.runtime.getSessionUsage = async () => { reads++; const total = restored ? 102 : r.runtime.getSession() === 1 ? 12 : 0;
    return { ok: true, usage: { context: null, cost: null, tokens: { input: total, output: 0, cacheRead: 0, cacheWrite: 0, total } } }; };
  const saved = { id: "saved", path: "/private/saved.jsonl", name: "Saved", firstMessage: "Earlier", modified: "2026-10-02T00:00:00Z" };
  const host = harness([folder()], true, undefined, r.runtime, {
    list: async (_cwd, page) => ({ ok: true, entries: [saved], page, total: 1 }),
    inspect: async () => ({ ok: true, session: saved, anchor: "anchor", history: { messages: [], page: 0, total: 0 } }),
    history: async () => ({ ok: false, code: "unavailable" }), preview: async () => ({ ok: false, code: "unavailable" }),
  });
  host.api.window.showWarningMessage = async (_message, _options, ...buttons) => buttons[0];
  const view = host.createView(); let passed = false;
  try {
    view.action("chooseResources", { choice: "allow" }); await tick(); assert.equal(reads, 1);
    view.action("newConversation"); await tick(); await tick();
    assert.equal(r.runtime.getSession(), 2, JSON.stringify(view.state())); assert.equal(reads, 2, JSON.stringify(view.state()));
    const fresh = latestUsage(view.sent); assert.equal(fresh.status, "ready"); assert.equal(fresh.usage?.tokens.total, 0);
    view.action("getSavedSessions", { page: 0 }); await tick();
    const sessions = [...view.sent].reverse().find(value => (value as { type: string }).type === "sessionState") as SessionStateMessage;
    view.action("resumeConversation", { id: sessions.entries[0].id }); await tick(); await tick();
    assert.equal(reads, 3); assert.equal(latestUsage(view.sent).usage?.tokens.total, 102); passed = true;
  } finally {
    host.provider.dispose(); mkdirSync("dist/wi079-session-usage", { recursive: true });
    writeFileSync("dist/wi079-session-usage/host-new-restore.json", JSON.stringify({ passed, reads, limits: ["synthetic runtime and VS Code"] }, null, 2));
  }
});
