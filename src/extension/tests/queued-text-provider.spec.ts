import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readySettings, tick } from "./harness.js";
import { parseHostMessage } from "../../webview/client/parse-host-message.js";

async function report(name: string, body: Record<string, unknown>): Promise<void> {
  const output = path.resolve("dist/wi077-provider-queue");
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, `${name}.json`), JSON.stringify({
    schemaVersion: 1, status: "passed", evidence: "provider-hosted-queue-session",
    limits: ["synthetic harness runtime", "not real pi, F5 or installed VSIX"], ...body,
  }, null, 2) + "\n");
}

// Failure modes: queue intents ignored by provider; queuedTextState never published
// after runtime ready; draft text still cleared when queue send cannot run.
test("provider publishes queuedTextState and routes queueChat without clearing on refusal", async () => {
  const { h, v } = await readySettings();
  try {
    assert.equal(v.state().runtime, "ready");
    const queued = v.sent.map(parseHostMessage).filter(message => message?.type === "queuedTextState");
    assert.ok(queued.length >= 1);
    const state = queued.at(-1);
    assert.ok(state && state.type === "queuedTextState");
    assert.equal(state.phase, "idle");
    assert.equal(state.error, null);

    const draft = v.attachments().draft;
    v.action("updateDraft", { draftRevision: draft.revision, editSequence: draft.acceptedEditSequence + 1, text: "steer from provider" });
    await tick();
    v.send("queueChat", {
      generation: v.state().generation, viewId: v.state().viewId,
      draftRevision: v.attachments().draft.revision, mode: "steering",
    });
    await tick();
    const after = v.sent.map(parseHostMessage).filter(message => message?.type === "queuedTextState").at(-1);
    assert.ok(after && after.type === "queuedTextState");
    assert.equal(after.error, "runtime-unavailable");
    assert.equal(v.attachments().draft.text, "steer from provider");
    await report("provider-route", {
      queuedTextStatePublished: true,
      queueChatRefusedWithoutClearingDraft: true,
      lastError: after.error,
    });
  } finally { h.provider.dispose(); }
});
