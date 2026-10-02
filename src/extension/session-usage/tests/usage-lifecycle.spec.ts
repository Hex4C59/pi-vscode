import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { folder, harness, settingsRuntime, tick } from "../../tests/harness.js";
import type { SessionUsageStateMessage } from "../../contracts/index.js";

const usage = { tokens: { input: 10, output: 2, cacheRead: 0, cacheWrite: 0, total: 12 }, context: null, cost: null };

test("ready and stable task settlement refresh once without periodic polling or draft effects", async () => {
  const r = settingsRuntime(); let reads = 0;
  r.runtime.getSessionUsage = async () => { reads++; return { ok: true, usage }; };
  const host = harness([folder()], true, undefined, r.runtime);
  const view = host.createView(); let passed = false;
  try {
    view.action("chooseResources", { choice: "allow" }); await tick();
    assert.equal(reads, 1);
    view.action("sendChat", { text: "work" }); await tick();
    assert.equal(reads, 1);
    r.settled(); await tick(); assert.equal(reads, 2);
    await tick(); assert.equal(reads, 2);
    const last = [...view.sent].reverse().find(value => (value as { type: string }).type === "sessionUsageState") as SessionUsageStateMessage;
    assert.equal(last.status, "ready"); passed = true;
  } finally {
    host.provider.dispose(); mkdirSync("dist/wi079-session-usage", { recursive: true });
    writeFileSync("dist/wi079-session-usage/host-lifecycle.json", JSON.stringify({ passed, reads, limits: ["synthetic runtime and VS Code"] }, null, 2));
  }
});
