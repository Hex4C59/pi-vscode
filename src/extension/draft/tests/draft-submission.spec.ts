import assert from "node:assert/strict";
import test from "node:test";
import type * as vscode from "vscode";
import { DraftSubmission } from "../draftSubmission.js";
import type { AttachmentPromptResult } from "../../contracts/runtimeLifecycle.js";
import type { AttachmentStateMessage, WebviewMessage } from "../../bridge/webviewMessages.js";
import { hostFixture } from "../../tests/harness.js";

function fixture() {
  const host = hostFixture();
  const messages: AttachmentStateMessage[] = [];
  const events: string[] = [];
  const view = { webview: { postMessage: async () => true } } as unknown as vscode.WebviewView;
  const context = { generation: 1, session: 1, viewId: "first-view", view: view as vscode.WebviewView | undefined,
    cwd: "/project", disposed: false, ready: true, eligible: true };
  let acknowledge!: (result: AttachmentPromptResult) => void;
  const draft = new DraftSubmission(
    host.api as unknown as ConstructorParameters<typeof DraftSubmission>[0],
    { preparePrompt(input) {
      events.push(`prepare:${input.body}`);
      return { send(onAttempt) { onAttempt(); return new Promise(resolve => { acknowledge = resolve; }); } };
    } }, () => context,
    message => messages.push(message as AttachmentStateMessage),
    { accepted: body => { events.push(`accepted:${body}`); context.eligible = false; },
      attempted: () => events.push("attempted"), failed: () => events.push("failed"),
      settled: () => { events.push("settled"); context.eligible = true; }, changed: () => {} },
  );
  const action = (type: string, fields = {}) => draft.handle(view, {
    version: 2, generation: context.generation, viewId: context.viewId, type,
    draftRevision: draft.revision, ...fields,
  } as WebviewMessage);
  const snapshot = () => { draft.publish(); return messages.at(-1)!; };
  return { host, draft, context, events, action, snapshot, acknowledge: (result: AttachmentPromptResult) => acknowledge(result) };
}

test("draft module waits for ACK after early settlement and preserves newer text across view loss", async () => {
  const f = fixture();
  try {
    await f.action("updateDraft", { editSequence: 1, text: "first" });
    const sent = f.action("sendChat");
    assert.deepEqual(f.events, ["prepare:first", "accepted:first", "attempted"]);
    assert.equal(f.draft.settle(false), false);
    assert.equal(f.snapshot().lastSubmission?.outcome, "settled");
    await f.action("updateDraft", { editSequence: 2, text: "next draft" });
    f.draft.closeView(); f.context.view = undefined;
    f.acknowledge({ delivery: "rpc-accepted" }); await sent;
    assert.equal(f.draft.awaitingAcknowledgement, false);
    assert.equal(f.events.at(-1), "settled");
    f.context.view = {} as vscode.WebviewView; f.context.viewId = "second-view"; f.draft.openView();
    assert.equal(f.snapshot().draft.text, "next draft");
    assert.equal(f.snapshot().draft.acceptedEditSequence, 0);
    assert.equal(f.snapshot().lastSubmission?.delivery, "rpc-accepted");
  } finally { f.draft.dispose(); }
});

test("draft module reset ignores old ACK and disposal releases its document listeners", async () => {
  const f = fixture();
  try {
    await f.action("updateDraft", { editSequence: 1, text: "old" });
    const sent = f.action("sendChat");
    f.draft.reset(true);
    f.acknowledge({ delivery: "rpc-rejected" }); await sent;
    assert.equal(f.events.includes("failed"), false);
    assert.equal(f.snapshot().lastSubmission, null);
    assert.equal(f.snapshot().result, null);
    assert.equal(f.host.documentChange.listeners.size, 1);
    assert.equal(f.host.documentClose.listeners.size, 1);
  } finally { f.draft.dispose(); f.draft.dispose(); }
  assert.equal(f.host.documentChange.listeners.size, 0);
  assert.equal(f.host.documentClose.listeners.size, 0);
});

test("draft module cancels pending picker without submitting or losing acknowledged text", async () => {
  const f = fixture();
  let finishPick!: () => void;
  f.host.api.window.showOpenDialog = () => new Promise(resolve => { finishPick = () => resolve(undefined); });
  try {
    await f.action("updateDraft", { editSequence: 1, text: "keep" });
    const picking = f.action("addFileAttachment");
    assert.equal(f.snapshot().preparation, "picking");
    const revision = f.draft.cancelPreparation();
    assert.equal(revision, f.draft.revision);
    finishPick(); await picking;
    assert.equal(f.snapshot().draft.text, "keep");
    assert.equal(f.snapshot().result?.code, "preparation-cancelled");
    assert.deepEqual(f.events, []);
  } finally { f.draft.dispose(); }
});
