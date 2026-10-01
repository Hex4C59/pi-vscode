import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type * as vscode from "vscode";
import { DraftSubmission } from "../draft/draftSubmission.js";
import type { AttachmentStateMessage, WebviewMessage } from "../bridge/webviewMessages.js";
import { QueuedTextLedger } from "../queue/queuedTextLedger.js";
import { QueuedTextCoordinator } from "../queue/queuedTextCoordinator.js";
import { createPiRpcRuntime } from "../../adapter/runtime/pi-rpc-runtime.js";
import { createMemoryConnection, createMemoryProcess, type MemoryConnection } from "../../adapter/runtime/tests/memory-process.js";
import { hostFixture, readySettings, tick } from "./harness.js";
import { parseWebviewMessage } from "../bridge/webviewMessages.js";
import { parseHostMessage } from "../../webview/client/parse-host-message.js";

async function report(name: string, body: Record<string, unknown>): Promise<void> {
  const output = path.resolve("dist/wi077-draft-queue");
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, `${name}.json`), JSON.stringify({
    schemaVersion: 1, status: "passed", evidence: "draft-ledger-coordinator-composition",
    limits: ["not provider/UI wiring", "not real pi, F5 or installed VSIX"], ...body,
  }, null, 2) + "\n");
}

function draftFixture() {
  const host = hostFixture();
  const messages: AttachmentStateMessage[] = [];
  const view = { webview: { postMessage: async () => true } } as unknown as vscode.WebviewView;
  const context = { generation: 1, session: 1, viewId: "queue-view", view: view as vscode.WebviewView | undefined,
    cwd: "/project", disposed: false, ready: true, eligible: true };
  const draft = new DraftSubmission(
    host.api as unknown as ConstructorParameters<typeof DraftSubmission>[0],
    { preparePrompt() { return { async send() { return { delivery: "not-sent", code: "runtime-lost" }; } }; } },
    () => context,
    message => messages.push(message as AttachmentStateMessage),
    { accepted() {}, attempted() {}, failed() {}, settled() {}, changed() {} },
  );
  const action = (type: string, fields = {}) => draft.handle(view, {
    version: 3, generation: context.generation, viewId: context.viewId, type,
    draftRevision: draft.revision, ...fields,
  } as WebviewMessage);
  const snapshot = () => { draft.publish(); return messages.at(-1)!; };
  return { host, draft, context, view, action, snapshot };
}

function runtimeFixture() {
  let connection!: MemoryConnection;
  const commands: Record<string, unknown>[] = [];
  const memory = createMemoryProcess(options => {
    const transport = createMemoryConnection((line, done) => {
      const request = JSON.parse(line); commands.push(request);
      queueMicrotask(() => {
        if (request.type === "get_state") transport.frame({ type: "extension_ui_request", method: "notify",
          message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: options.cwd }) });
        const data = request.type === "get_state" ? { sessionId: "fixture-session", sessionFile: "/private-store/fixture.jsonl" }
          : request.type === "clear_queue" ? { steering: ["queued"], followUp: [] } : undefined;
        transport.frame({ type: "response", id: request.id, command: request.type, success: true, data });
      });
      done(); return true;
    });
    connection = transport; return connection;
  });
  const runtime = createPiRpcRuntime({ process: memory.process, cliPath: () => "fixture", startupModel: () => undefined, gateAccess: async () => undefined });
  return { runtime, commands, get connection() { return connection; } };
}

// Failure modes: queue admission clears a newer draft edit; slash text committed;
// late onAttempt wipes replacement text; stale revision still clears.
test("queue draft admission keeps newer edits and refuses slash or stale revisions", async () => {
  const f = draftFixture();
  try {
    await f.action("updateDraft", { editSequence: 1, text: "steer this" });
    const admitted = f.draft.admitQueuedText(f.draft.revision);
    assert.equal(admitted.kind, "ok");
    if (admitted.kind !== "ok") return;
    assert.equal(admitted.text, "steer this");
    await f.action("updateDraft", { editSequence: 2, text: "newer unsent" });
    admitted.commitAttempt();
    assert.equal(f.snapshot().draft.text, "newer unsent");

    await f.action("updateDraft", { editSequence: 3, text: "  /skill expand" });
    assert.deepEqual(f.draft.admitQueuedText(f.draft.revision), { kind: "refused", reason: "invalid-text" });
    assert.equal(f.snapshot().draft.text, "  /skill expand");
    assert.deepEqual(f.draft.admitQueuedText(f.draft.revision - 1), { kind: "refused", reason: "stale" });
    await f.action("updateDraft", { editSequence: 4, text: "   " });
    assert.deepEqual(f.draft.admitQueuedText(f.draft.revision), { kind: "refused", reason: "invalid-text" });
    await report("draft-admission", { newerEditPreserved: true, slashRefused: true, staleRefused: true });
  } finally { f.draft.dispose(); }
});

// Failure modes: overlapping recall and Stop both clear; Stop proceeds without
// reserved recovery; draft commit races a concurrent recall.
test("coordinator serializes queue send, recall and Stop around one clear owner", async () => {
  const rt = runtimeFixture();
  const draftHost = draftFixture();
  try {
    assert.equal((await rt.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
    assert.equal((await rt.runtime.prompt("running")).ok, true);
    rt.connection.frame({ type: "agent_start" });
    const session = rt.runtime.getSession();
    const ledger = new QueuedTextLedger(rt.runtime, session);
    const coordinator = new QueuedTextCoordinator(draftHost.draft, ledger, rt.runtime);
    await draftHost.action("updateDraft", { editSequence: 1, text: "follow after" });
    const queued = await coordinator.queueChat(draftHost.draft.revision, "follow-up");
    assert.equal(queued.kind, "observed");
    assert.equal(draftHost.snapshot().draft.text, "");

    ledger.observeQueueUpdated(session, { steering: ["queued"], followUp: [] });
    const recall = coordinator.recall(ledger.revision);
    assert.equal(coordinator.phase(), "recalling");
    const stopDuringRecall = await coordinator.stopWithRecall();
    assert.deepEqual(stopDuringRecall, { kind: "refused", reason: "busy" });
    const recallResult = await recall;
    assert.equal(recallResult.kind, "recalled");
    assert.equal(rt.commands.filter(command => command.type === "clear_queue").length, 1);
    assert.equal(rt.commands.filter(command => command.type === "abort").length, 0);
    assert.equal(coordinator.phase(), "idle");
    assert.equal(ledger.recoveryProjection().some(item => item.text === "queued"), true);
    const reused = coordinator.useRecovered(ledger.recoveryProjection()[0].id, draftHost.draft.revision);
    assert.deepEqual(reused, { kind: "ok" });
    assert.equal(draftHost.snapshot().draft.text, "queued");
    assert.equal(ledger.recoveryProjection().length, 0);
    await report("coordinator-serial", {
      queueCommittedDraft: true, overlappingStopRefused: true, clearCommands: 1, abortCommands: 0, recoveredIntoEmptyDraft: true,
    });
  } finally {
    draftHost.draft.dispose();
    await rt.runtime.stop();
  }
});

// Failure modes: stale queueRevision still clears; non-empty draft overwrites;
// unavailable sensitive recovery offered for reuse; settings acts on chat queue intents.
test("Living queue intents parse exactly and settings ignore them without side effects", async () => {
  const envelope = { version: 3, generation: 1, viewId: "chat-view" };
  assert.ok(parseWebviewMessage({ ...envelope, type: "queueChat", draftRevision: 1, mode: "steering" }));
  assert.ok(parseWebviewMessage({ ...envelope, type: "recallQueuedText", queueRevision: 2 }));
  assert.ok(parseWebviewMessage({ ...envelope, type: "useRecoveredText", id: "rec-1", draftRevision: 0 }));
  assert.ok(parseWebviewMessage({ ...envelope, type: "discardRecoveredText", id: "rec-1" }));
  assert.equal(parseWebviewMessage({ ...envelope, type: "queueChat", draftRevision: 1, mode: "steer" }), undefined);
  assert.equal(parseWebviewMessage({ ...envelope, type: "queueChat", draftRevision: 1, mode: "steering", text: "no" }), undefined);
  assert.equal(parseWebviewMessage({ ...envelope, type: "recallQueuedText", queueRevision: -1 }), undefined);
  assert.equal(parseWebviewMessage({ ...envelope, type: "useRecoveredText", id: "../x", draftRevision: 0 }), undefined);

  const { h, v } = await readySettings();
  try {
    const draft = v.attachments().draft;
    v.action("updateDraft", { draftRevision: draft.revision, editSequence: draft.acceptedEditSequence + 1, text: "Keep this draft" });
    v.action("openSettings");
    const panel = h.panels[0];
    panel.receive.fire({ version: 3, type: "getWorkspaceState" });
    const state = parseHostMessage(panel.sent[0]); assert.ok(state);
    const settingsEnvelope = { version: 3, viewId: state.viewId, generation: state.generation };
    for (const intent of [
      { type: "queueChat", draftRevision: v.attachments().draft.revision, mode: "steering" },
      { type: "recallQueuedText", queueRevision: 0 },
      { type: "useRecoveredText", id: "rec-1", draftRevision: v.attachments().draft.revision },
      { type: "discardRecoveredText", id: "rec-1" },
    ]) {
      const message = { ...settingsEnvelope, ...intent };
      assert.ok(parseWebviewMessage(message), `${intent.type} must parse`);
      panel.receive.fire(message);
    }
    await tick();
    assert.equal(v.attachments().draft.text, "Keep this draft");
    await report("living-parse-settings", { parsed: true, settingsIgnoredQueueIntents: true });
  } finally { h.provider.dispose(); }
});
