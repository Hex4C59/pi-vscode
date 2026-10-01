import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { act } from "react";
import { attachmentState, readAppStyles, uiHarness } from "./react-harness.js";
import { chineseUi } from "../i18n/ui-zh-cn.js";

async function report(name: string, body: Record<string, unknown>): Promise<void> {
  const output = path.resolve("dist/wi077-queued-ui");
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, `${name}.json`), JSON.stringify({
    schemaVersion: 1, status: "passed", evidence: "mounted-queue-composer",
    limits: ["jsdom layout", "not browser theme matrix, F5 or installed VSIX"], ...body,
  }, null, 2) + "\n");
}

// Failure modes: busy chat still only shows Send; pending/recovery invisible;
// Steer posts sendChat; Chinese labels missing; recall absent when pending exists.
test("busy composer mounts Steer/Follow-up, pending queues and recovery actions", async () => {
  const h = await uiHarness();
  try {
    const style = h.dom.window.document.createElement("style");
    style.textContent = readAppStyles();
    h.dom.window.document.head.append(style);

    await h.render({ chatBusy: true, execution: "replying", messages: [{ role: "assistant", text: "working" }] });
    await h.input("steer now");
    const update = h.sent.at(-1);
    assert.equal(update?.type, "updateDraft");
    if (update?.type === "updateDraft") {
      await h.receive(attachmentState({
        draft: { revision: update.draftRevision + 1, text: "steer now", acceptedEditSequence: update.editSequence, attachments: [] },
      }));
    }

    await h.receive({
      version: 3, type: "queuedTextState", viewId: "view", generation: 1, revision: 5, phase: "idle", error: null,
      pending: {
        steering: [{ attribution: "local", reusable: true, text: "already steering" }],
        followUp: [{ attribution: "external", reusable: false }],
      },
      recovery: [{ id: "rec-1", mode: "follow-up", status: "recalled", text: "brought back" }],
    });

    assert.equal(h.root.querySelector('button[aria-label="Send message"]'), null);
    assert.ok(h.get('button[aria-label="Stop current task"]'));
    const steer = [...h.root.querySelectorAll("button")].find(button => button.textContent === "Steer current task");
    const follow = [...h.root.querySelectorAll("button")].find(button => button.textContent === "Follow up after task");
    assert.ok(steer); assert.ok(follow);
    assert.equal(steer.disabled, false);
    assert.match(h.root.textContent ?? "", /Steering/);
    assert.match(h.root.textContent ?? "", /already steering/);
    assert.match(h.root.textContent ?? "", /Follow-up/);
    assert.match(h.root.textContent ?? "", /External: Text unavailable/);
    assert.match(h.root.textContent ?? "", /brought back/);
    assert.equal(chineseUi["Steer current task"], "引导当前任务");
    assert.equal(chineseUi["Follow up after task"], "任务结束后跟进");
    assert.equal(chineseUi["Recall pending text"], "取回待处理文字");

    const textarea = h.get<HTMLTextAreaElement>('textarea[aria-label="Message"]');
    const beforeEnter = h.sent.length;
    await act(async () => {
      textarea.dispatchEvent(new h.dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    });
    assert.equal(
      h.sent.slice(beforeEnter).some(message => message.type === "sendChat" || message.type === "queueChat"),
      false,
      "Enter in a busy composer must not send or queue",
    );
    assert.ok(steer.tabIndex >= 0);
    assert.ok(follow.tabIndex >= 0);

    const before = h.sent.length;
    await act(async () => { steer.click(); });
    const queued = h.sent.slice(before).find(message => message.type === "queueChat");
    assert.equal(queued?.type, "queueChat");
    if (queued?.type === "queueChat") assert.equal(queued.mode, "steering");

    const recall = [...h.root.querySelectorAll("button")].find(button => button.textContent === "Recall pending text");
    assert.ok(recall); assert.equal(recall.disabled, false);
    await act(async () => { recall.click(); });
    assert.equal(h.sent.at(-1)?.type, "recallQueuedText");

    const use = [...h.root.querySelectorAll("button")].find(button => button.textContent === "Use in draft");
    assert.ok(use);
    assert.equal(use.disabled, true, "non-empty draft blocks restore into composer");

    await report("mounted-composer-queue", {
      steerFollowUpVisibleWhileBusy: true,
      pendingAndRecoveryRendered: true,
      queueChatPosted: true,
      recallPosted: true,
      useBlockedWhenDraftOccupied: true,
      chineseLabelsPresent: true,
      enterWhileBusyDoesNotSend: true,
      queueButtonsKeyboardReachable: true,
    });
  } finally {
    await h.close();
  }
});
