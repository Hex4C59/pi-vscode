import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { WebviewClient } from "../client/webview-client.js";
import { availability } from "../client/client-state.js";
import { parseHostMessage } from "../client/parse-host-message.js";
import type { HostMessage, QueuedTextStateMessage, WebviewMessage, WorkspaceStateMessage } from "../../extension/contracts/index.js";
import { readySettings } from "../../extension/tests/harness.js";

function clientHarness() {
  const sent: WebviewMessage[] = [];
  let listener: ((value: unknown) => void) | undefined;
  const client = new WebviewClient({
    postMessage: m => { sent.push(m); },
    subscribe: next => { listener = next; return () => { listener = undefined; }; },
  });
  client.start();
  return { client, sent, receive: (m: unknown) => listener?.(m) };
}

async function report(name: string, body: Record<string, unknown>): Promise<void> {
  const output = path.resolve("dist/wi077-queued-ui");
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, `${name}.json`), JSON.stringify({
    schemaVersion: 1, status: "passed", evidence: "webview-client-queued-text",
    limits: ["synthetic host messages", "not browser render, F5 or installed VSIX"], ...body,
  }, null, 2) + "\n");
}

function queuedState(base: WorkspaceStateMessage, patch: Partial<QueuedTextStateMessage> = {}): QueuedTextStateMessage {
  return {
    version: 3, type: "queuedTextState", generation: base.generation, viewId: base.viewId,
    revision: 1, phase: "idle", error: null,
    pending: { steering: [], followUp: [] }, recovery: [],
    ...patch,
  };
}

// Failure modes: queuedTextState ignored by client; steer/follow-up posted while idle;
// recall without pending; useRecovered when draft not empty silently overwrites locally;
// generation bump retains old queue; attachments still enable queueChat.
test("client mirrors queuedTextState and posts named queue intents only while a task is running", async () => {
  const { h, v } = await readySettings();
  const ui = clientHarness();
  try {
    for (const message of v.sent) {
      const parsed = parseHostMessage(message);
      if (parsed) ui.receive(parsed);
    }
    const workspace = ui.client.getSnapshot().workspace;
    assert.ok(workspace);
    assert.ok(ui.client.getSnapshot().queuedText, "ready host must project queuedTextState into the client");

    const before = ui.sent.length;
    ui.client.queueChat("steering");
    ui.client.queueChat("follow-up");
    assert.equal(ui.sent.length, before, "idle chat must not post queueChat");

    const busy = { ...workspace, chatBusy: true } satisfies WorkspaceStateMessage;
    ui.receive(busy);
    ui.client.edit("steer now");
    const update = ui.sent.at(-1);
    assert.equal(update?.type, "updateDraft");
    if (update?.type !== "updateDraft") throw new Error("Expected a draft update");
    const beforeAck = v.sent.length;
    v.receive.fire(update);
    for (const message of v.sent.slice(beforeAck)) {
      const parsed = parseHostMessage(message);
      if (parsed) ui.receive(parsed);
    }
    assert.equal(ui.client.getSnapshot().synchronizing, false);
    assert.equal(availability(ui.client.getSnapshot()).queueDisabled, false);

    ui.client.queueChat("steering");
    const steer = ui.sent.at(-1);
    assert.equal(steer?.type, "queueChat");
    if (steer?.type === "queueChat") {
      assert.equal(steer.mode, "steering");
      assert.equal(steer.draftRevision, ui.client.getSnapshot().attachments?.draft.revision);
    }

    ui.client.queueChat("follow-up");
    const follow = ui.sent.at(-1);
    assert.equal(follow?.type, "queueChat");
    if (follow?.type === "queueChat") assert.equal(follow.mode, "follow-up");

    ui.receive(queuedState(busy, {
      revision: 4,
      pending: {
        steering: [{ attribution: "local", reusable: true, text: "steer now" }],
        followUp: [{ attribution: "external", reusable: false }],
      },
      recovery: [{ id: "rec-1", mode: "steering", status: "recalled", text: "brought back" }],
    }));
    assert.equal(ui.client.getSnapshot().queuedText?.revision, 4);
    assert.equal(ui.client.getSnapshot().queuedText?.pending.steering.length, 1);

    ui.client.recallQueuedText();
    const recall = ui.sent.at(-1);
    assert.equal(recall?.type, "recallQueuedText");
    if (recall?.type === "recallQueuedText") assert.equal(recall.queueRevision, 4);

    ui.client.edit("");
    ui.client.useRecoveredText("rec-1");
    const use = ui.sent.at(-1);
    assert.equal(use?.type, "useRecoveredText");
    if (use?.type === "useRecoveredText") assert.equal(use.id, "rec-1");

    ui.client.discardRecoveredText("rec-1");
    const discard = ui.sent.at(-1);
    assert.equal(discard?.type, "discardRecoveredText");
    if (discard?.type === "discardRecoveredText") assert.equal(discard.id, "rec-1");

    ui.receive({ ...busy, generation: busy.generation + 1 } satisfies HostMessage);
    assert.equal(ui.client.getSnapshot().queuedText, null, "generation bump must drop prior queue projection");

    await report("client-queue-intents", {
      idleQueueRefused: true,
      busySteerFollowUpPosted: true,
      recallUsesPublishedRevision: true,
      recoveryUseDiscardPosted: true,
      generationClearsQueue: true,
    });
  } finally {
    ui.client.dispose();
    h.provider.dispose();
  }
});
