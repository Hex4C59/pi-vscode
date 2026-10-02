import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readySettings, tick } from "../../extension/tests/harness.js";
import { uiHarness } from "./react-harness.js";

// Approved seams: runtime capability -> real host bridge -> validated client -> shipped mount.
// Failures: cumulative totals shown as context; Refresh clears or sends the draft;
// the panel never opens; refreshed statistics are replaced by an older projection.
test("user opens current-context and session totals, refreshes them and keeps an unsent draft", async () => {
  const { r, h: host, v } = await readySettings();
  let usage = {
    tokens: { input: 1111, output: 222, cacheRead: 333, cacheWrite: 444, total: 2110 },
    context: { tokens: 321, contextWindow: 8192, percent: 3.91845703125 }, cost: 0.125,
  };
  Object.assign(r.runtime, { getSessionUsage: async () => ({ ok: true, usage }) });
  const ui = await uiHarness(false);
  let inbound = 0, outbound = 0;
  const pump = async () => {
    await act(async () => {
      for (const message of ui.sent.slice(inbound)) v.receive.fire(message);
      inbound = ui.sent.length;
      await tick();
      for (const message of v.sent.slice(outbound)) await ui.receive(message);
      outbound = v.sent.length;
    });
  };
  let passed = false;
  try {
    await pump();
    await ui.input("keep this unsent draft"); await pump();
    await ui.click('button[aria-label="Usage"]'); await pump();
    const panel = ui.get('[role="dialog"][aria-label="Usage"]');
    assert.match(panel.textContent ?? "", /Current context/);
    assert.match(panel.textContent ?? "", /Session total/);
    assert.match(panel.textContent ?? "", /321/);
    assert.match(panel.textContent ?? "", /2[, ]?110/);
    assert.match(panel.textContent ?? "", /0\.125/);
    usage = { ...usage, context: { ...usage.context, tokens: 654 },
      tokens: { ...usage.tokens, output: 999, total: 2887 } };
    await ui.click('button[aria-label="Refresh usage"]'); await pump();
    assert.match(panel.textContent ?? "", /654/);
    assert.match(panel.textContent ?? "", /2[, ]?887/);
    assert.equal(ui.get<HTMLTextAreaElement>("textarea").value, "keep this unsent draft");
    assert.equal(r.calls.includes("prompt"), false);
    passed = true;
  } finally {
    await ui.close(); host.provider.dispose();
    const output = path.resolve("dist/wi079-session-usage");
    await mkdir(output, { recursive: true });
    await writeFile(path.join(output, "mounted-host-roundtrip.json"), JSON.stringify({
      status: passed ? "passed" : "failed", evidence: "host-client-mounted-production-roundtrip",
      limits: ["synthetic runtime capability and VS Code", "not real pi, browser, F5 or installed VSIX"],
    }, null, 2));
  }
});
