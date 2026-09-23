import assert from "node:assert/strict";
import test from "node:test";
import type * as vscode from "vscode";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { EditorTools } from "../editorTools.js";
import type { GateCall } from "../../contracts/approvalProtocol.js";
import type { WebviewMessage } from "../../bridge/webviewMessages.js";
import type { ApprovalCard, SessionGrant } from "../../contracts/webviewProtocol.js";
import { hostFixture, harness, folder, settingsRuntime, tick } from "../../tests/harness.js";

async function fixture(changeReview: boolean) {
  const root = await mkdtemp(path.join(tmpdir(), "pi-editor-tools-"));
  await writeFile(path.join(root, "file.ts"), "fixture");
  const host = hostFixture([folder(root)]);
  const context = { generation: 1, session: 1, cwd: root, ready: true, chatBusy: true, stopping: false, disposed: false };
  const document = { uri: { scheme: "file", fsPath: path.join(root, "file.ts") }, isClosed: false, isDirty: false };
  host.api.workspace.textDocuments = [document as vscode.TextDocument];
  let projection: { approvals: ApprovalCard[]; grants: SessionGrant[] } = { approvals: [], grants: [] };
  let offered: (() => void) | undefined;
  const errors: string[] = [];
  const tools = new EditorTools(host.api as unknown as ConstructorParameters<typeof EditorTools>[0],
    () => context, value => { projection = value; if (value.approvals.length) offered?.(); }, () => {}, message => errors.push(message), { changeReview });
  const action = (type: string, extra: object) => tools.handle({ version: 2, generation: 1, viewId: "view", type, ...extra } as WebviewMessage, () => true);
  const request = (id: string) => {
    const card = new Promise<string>(resolve => { offered = () => resolve("offered"); });
    const call: GateCall = { cwd: root, runtime: "fixture", request: id, toolCallId: id, tool: "write", input: { path: "file.ts", content: "replacement" } };
    const result = tools.requestApproval(call);
    return { result, offered: Promise.race([card, result.then(() => "settled")]) };
  };
  return { host, context, document, tools, action, request, errors, projection: () => projection,
    async cleanup() { tools.dispose(); await rm(root, { recursive: true, force: true }); } };
}

test("omitting change review keeps editor write protection and session approval policy active", { timeout: 5000 }, async () => {
  const f = await fixture(false);
  try {
    assert.equal(f.host.contentProviders.size, 0);
    f.tools.beginTask("task");
    assert.equal(f.host.fileChange.listeners.size, 0);
    const initial = f.request("grant"); assert.equal(await initial.offered, "offered");
    await f.action("decideApproval", { id: "grant", decision: "session" });
    assert.equal(await initial.result, true);
    assert.equal(f.projection().grants.length, 1);
    f.document.isDirty = true;
    assert.equal(await f.request("dirty").result, false);
    assert.match(f.errors.at(-1) ?? "", /unsaved editor changes/);
    f.document.isDirty = false;
    assert.equal(await f.request("clean").result, true);
    f.tools.reset();
    assert.equal(f.projection().grants.length, 0);
    const cancelled = f.request("cancel"); assert.equal(await cancelled.offered, "offered");
    f.tools.dispose();
    assert.equal(await cancelled.result, false);
    assert.equal(await f.request("disposed").result, false);
  } finally { await f.cleanup(); }
});

test("editor tools own review resources and reset releases watchers without removing the provider", async () => {
  const f = await fixture(true);
  try {
    assert.equal(f.host.contentProviders.size, 1);
    f.tools.beginTask("task");
    assert.equal(f.host.fileChange.listeners.size, 1);
    f.tools.reset();
    assert.equal(f.host.fileChange.listeners.size, 0);
    assert.equal(f.host.contentProviders.size, 1);
    f.tools.beginTask("next");
    assert.equal(f.host.fileChange.listeners.size, 1);
  } finally { await f.cleanup(); }
  assert.equal(f.host.fileChange.listeners.size, 0);
  assert.equal(f.host.contentProviders.size, 0);
});

test("host composition without change review still sends, streams and stops a conversation", async () => {
  const r = settingsRuntime();
  r.runtime.abortTask = async () => { r.settled(); return { ok: true }; };
  const h = harness([folder()], true, undefined, r.runtime, undefined, { changeReview: false });
  try {
    const v = h.createView(); v.action("chooseResources", { choice: "decline" }); await tick();
    v.action("sendChat", { text: "hello" }); await tick();
    assert.equal(v.state().chatBusy, true);
    r.events.fire({ kind: "text_delta", session: r.runtime.getSession(), delta: "reply" });
    assert.equal(v.state().messages.at(-1)?.text, "reply");
    v.action("stopChat"); await tick();
    assert.equal(v.state().chatBusy, false);
    assert.equal(v.state().execution, "idle");
    assert.equal(h.contentProviders.size, 0);
    assert.equal(h.fileChange.listeners.size, 0);
    assert.equal(v.state().controlledExecution, true);
  } finally { h.provider.dispose(); }
});

test("reset invalidates an editor safety check before its late error can reach the host", { timeout: 5000 }, async () => {
  const f = await fixture(false);
  try {
    f.document.isDirty = true;
    const pending = f.request("obsolete");
    f.tools.reset();
    assert.equal(await pending.result, false);
    assert.deepEqual(f.errors, []);
    assert.deepEqual(f.projection(), { approvals: [], grants: [] });
  } finally { await f.cleanup(); }
});
