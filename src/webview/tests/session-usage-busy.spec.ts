import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
import { mkdirSync, writeFileSync } from "node:fs";
import { readySettings, tick } from "../../extension/tests/harness.js";
import { uiHarness } from "./react-harness.js";

test("running task keeps usage inspectable and marks the previous snapshot without an RPC refresh", async () => {
  const { r, h, v } = await readySettings(); let reads = 0;
  r.runtime.getSessionUsage = async () => { reads++; return { ok: true, usage: { context: null,
    tokens: { input: 10, output: 2, cacheRead: 0, cacheWrite: 0, total: 12 }, cost: null } }; };
  const ui = await uiHarness(false); let inbound = 0, outbound = 0, passed = false;
  const pump = () => act(async () => {
    for (const message of ui.sent.slice(inbound)) v.receive.fire(message);
    inbound = ui.sent.length; await tick();
    for (const message of v.sent.slice(outbound)) await ui.receive(message);
    outbound = v.sent.length;
  });
  try {
    await pump(); await ui.click('button[aria-label="Usage"]'); await pump();
    assert.match(ui.get('[role="dialog"][aria-label="Usage"]').textContent ?? "", /Session total/);
    await ui.click('[role="dialog"][aria-label="Usage"] button');
    await ui.input("start task"); await pump(); await ui.click('button[aria-label="Send message"]'); await pump();
    const before = reads;
    await ui.click('button[aria-label="Usage"]'); await pump();
    const panel = ui.get('[role="dialog"][aria-label="Usage"]');
    assert.match(panel.textContent ?? "", /Previous snapshot while the task is running/);
    assert.equal(ui.get<HTMLButtonElement>('button[aria-label="Refresh usage"]').disabled, true);
    assert.equal(reads, before); assert.equal(r.calls.filter(value => value === "prompt").length, 1); passed = true;
  } finally {
    await ui.close(); h.provider.dispose(); mkdirSync("dist/wi079-session-usage", { recursive: true });
    writeFileSync("dist/wi079-session-usage/mounted-busy.json", JSON.stringify({ passed, reads, limits: ["synthetic runtime and VS Code"] }, null, 2));
  }
});
