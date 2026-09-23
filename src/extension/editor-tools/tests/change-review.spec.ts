import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import fileSystem from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type * as vscode from "vscode";
import type { GateCall } from "../../contracts/approvalProtocol.js";
import type { ChangeReviewStateMessage, WorkspaceStateMessage } from "../../contracts/webviewProtocol.js";
import { folder, settingsRuntime, tick, harness } from "../../tests/harness.js";
import { ChangeReview } from "../changeReview.js";
import { parseWebviewMessage } from "../../bridge/webviewMessages.js";

test("review intents accept only host-owned IDs, never a file path or arbitrary editor command", () => {
  const envelope = { version: 2, generation: 1, viewId: "current-view" };
  for (const type of ["openReviewDiff", "openReviewSource"]) {
    assert.ok(parseWebviewMessage({ ...envelope, type, id: "review-1" }));
    assert.equal(parseWebviewMessage({ ...envelope, type, id: "../file" }), undefined);
    assert.equal(parseWebviewMessage({ ...envelope, type, id: "review-1", path: "file.ts" }), undefined);
    assert.equal(parseWebviewMessage({ ...envelope, type, id: "review-1", command: "vscode.diff" }), undefined);
  }
  assert.ok(parseWebviewMessage({ ...envelope, type: "getChangeReview" }));
});


test("a sidebar synchronizes an explicit empty live review state", () => {
  const h = harness();
  try {
    const v = h.createView(); v.action("getChangeReview");
    const review = v.sent.find(message => (message as { type: string }).type === "changeReviewState");
    assert.ok(review);
    assert.deepEqual(review, { version: 2, type: "changeReviewState", generation: v.state().generation, viewId: v.state().viewId,
      entries: [], retainedBytes: 0, limited: false, reset: false, error: null });
  } finally { h.provider.dispose(); }
});


function observe<T>(v: ReturnType<ReturnType<typeof harness>["createView"]>, accepts: (message: unknown) => message is T): { result: Promise<T>; dispose(): void } {
  let subscription: vscode.Disposable | undefined;
  const result = new Promise<T>(resolve => { subscription = v.posted.subscribe(message => { if (accepts(message)) resolve(message); }); });
  return { result, dispose: () => subscription?.dispose() };
}
const reviewState = (message: unknown): message is ChangeReviewStateMessage => (message as { type: string })?.type === "changeReviewState";

test("an allowed write opens actual immutable before/after in a readonly diff, not Git HEAD", { timeout: 5000 }, async t => {
  const root = await mkdtemp(path.join(tmpdir(), "pi-review-pair-"));
  const r = settingsRuntime(); let approval: ((call: GateCall) => Promise<boolean>) | undefined;
  r.runtime.setApprovalHandler = handler => { approval = handler; };
  const h = harness([folder(root)], true, undefined, r.runtime); const v = h.createView();
  const offered = observe(v, (m): m is WorkspaceStateMessage => (m as WorkspaceStateMessage).type === "workspaceState" && (m as WorkspaceStateMessage).approvals.length > 0);
  const completed = observe(v, (m): m is ChangeReviewStateMessage => reviewState(m) && m.entries.some(e => e.diff === "ready"));
  t.after(async () => { offered.dispose(); completed.dispose(); h.provider.dispose(); await rm(root, { recursive: true, force: true }); });
  try {
    await writeFile(path.join(root, "file.ts"), "const before = 1;\n");
    v.action("chooseResources", { choice: "decline" }); await tick(); v.action("sendChat", { text: "Change it" }); await tick(); assert.ok(approval);
    const permission = approval({ cwd: root, runtime: "fixture", request: "request-1", toolCallId: "call-1", tool: "write", input: { path: "file.ts", content: "const after = 2;\n" } });
    await offered.result; v.action("decideApproval", { id: "request-1", decision: "once" }); assert.equal(await permission, true);
    await writeFile(path.join(root, "file.ts"), "const after = 2;\n");
    r.events.fire({ kind: "tool_finished", session: r.runtime.getSession(), toolCallId: "call-1", failed: false });
    const state = await completed.result; const entry = state.entries.find(e => e.source === "tool"); assert.ok(entry); assert.equal(entry.path, "file.ts");
    let commandSubscription: vscode.Disposable | undefined;
    const commandResult = new Promise<unknown[]>(resolve => { commandSubscription = h.executed.subscribe(command => { if (command[0] === "vscode.diff") resolve(command); }); });
    t.after(() => commandSubscription?.dispose());
    v.action("openReviewDiff", { id: entry.id });
    const opened = await commandResult; commandSubscription?.dispose();
    const provider = h.contentProviders.get("pi-vscode-review"); assert.ok(provider);
    const token = { isCancellationRequested: false } as vscode.CancellationToken;
    assert.equal(await provider.provideTextDocumentContent(opened[1] as vscode.Uri, token), "const before = 1;\n");
    assert.equal(await provider.provideTextDocumentContent(opened[2] as vscode.Uri, token), "const after = 2;\n");
    await writeFile(path.join(root, "file.ts"), "later user change\n");
    assert.equal(await provider.provideTextDocumentContent(opened[2] as vscode.Uri, token), "const after = 2;\n");
    assert.equal(await readFile(path.join(root, "file.ts"), "utf8"), "later user change\n");
    const changed = observe(v, (m): m is ChangeReviewStateMessage => reviewState(m) && m.entries.some(e => e.id === entry.id && e.sourceChanged));
    t.after(() => changed.dispose());
    v.action("openReviewDiff", { id: entry.id }); await changed.result;
    assert.equal(await provider.provideTextDocumentContent(opened[2] as vscode.Uri, token), "const after = 2;\n");
    let sourceOpened: (uri: unknown) => void = () => {};
    const source = new Promise<unknown>(resolve => { sourceOpened = resolve; });
    h.api.window.showTextDocument = async uri => { sourceOpened(uri); };
    v.action("openReviewSource", { id: entry.id });
    assert.equal((await source as vscode.Uri).fsPath, path.join(root, "file.ts"));
    const oldView = v.state().viewId; v.dispose.fire(); const replacement = h.createView();
    replacement.action("getChangeReview");
    const restored = [...replacement.sent].reverse().find(reviewState);
    assert.notEqual(replacement.state().viewId, oldView); assert.equal(restored?.entries[0]?.id, entry.id);
    assert.equal(await provider.provideTextDocumentContent(opened[1] as vscode.Uri, token), "const before = 1;\n");
    replacement.action("chooseResources", { choice: "allow" });
    assert.match(String(await provider.provideTextDocumentContent(opened[1] as vscode.Uri, token)), /no longer available/);
    replacement.action("getChangeReview");
    const reset = [...replacement.sent].reverse().find(reviewState); assert.equal(reset?.entries.length, 0); assert.equal(reset?.reset, true);
    assert.ok(!JSON.stringify(state).includes("const before"), "Snapshot contents stay out of Webview DTOs");
  } finally { offered.dispose(); completed.dispose(); h.provider.dispose(); await rm(root, { recursive: true, force: true }); }
});


async function reviewFixture(t: TestContext) {
  const root = await mkdtemp(path.join(tmpdir(), "pi-review-behavior-")); const r = settingsRuntime();
  let approval: ((call: GateCall) => Promise<boolean>) | undefined;
  r.runtime.setApprovalHandler = handler => { approval = handler; };
  const h = harness([folder(root)], true, undefined, r.runtime); const v = h.createView();
  t.after(async () => { h.provider.dispose(); await rm(root, { recursive: true, force: true }); });
  v.action("chooseResources", { choice: "decline" }); await tick(); v.action("sendChat", { text: "Change files" }); await tick();
  const state = () => { v.action("getChangeReview"); const latest = [...v.sent].reverse().find(reviewState); assert.ok(latest); return latest; };
  const request = async (id: string, target: string, beforeApproval?: () => Promise<void>) => {
    const offered = observe(v, (m): m is WorkspaceStateMessage => (m as WorkspaceStateMessage).type === "workspaceState" && (m as WorkspaceStateMessage).approvals.some(card => card.id === id));
    t.after(() => offered.dispose()); assert.ok(approval);
    const result = approval({ cwd: root, runtime: "fixture", request: id, toolCallId: id, tool: "write", input: { path: target, content: "replacement" } });
    assert.equal(await Promise.race([offered.result.then(() => "offered"), result.then(() => "settled")]), "offered");
    await beforeApproval?.(); v.action("decideApproval", { id, decision: "once" }); assert.equal(await result, true); offered.dispose();
    return state().entries.filter(entry => entry.source === "tool").at(-1);
  };
  const finish = async (id: string, recordId: string, failed = false) => {
    const done = observe(v, (m): m is ChangeReviewStateMessage => reviewState(m) && m.entries.some(e => e.id === recordId && e.status === (failed ? "failed" : "complete")));
    t.after(() => done.dispose()); r.events.fire({ kind: "tool_finished", session: r.runtime.getSession(), toolCallId: id, failed });
    const result = await done.result; done.dispose(); return result.entries.find(e => e.id === recordId);
  };
  return { root, r, h, v, state, request, finish, authorize: (call: GateCall) => { assert.ok(approval); return approval(call); } };
}

test("runtime loss clears review metadata and invalidates late tool completions and watcher listeners", { timeout: 5000 }, async t => {
  const f = await reviewFixture(t); await writeFile(path.join(f.root, "file.ts"), "old");
  const entry = await f.request("lost", "file.ts"); assert.ok(entry);
  f.r.events.fire({ kind: "runtime_error", session: f.r.runtime.getSession(), detail: "Disconnected fixture" });
  const reset = f.state(); assert.equal(reset.entries.length, 0); assert.equal(reset.reset, true);
  assert.equal(f.h.fileChange.listeners.size, 0);
  f.r.events.fire({ kind: "tool_finished", session: f.r.runtime.getSession(), toolCallId: "lost", failed: false });
  assert.equal(f.state().entries.length, 0);
});


test("disk edits while approval waits become the before image; new files and failed partial writes remain honest", { timeout: 5000 }, async t => {
  const f = await reviewFixture(t); const target = path.join(f.root, "file.ts"); await writeFile(target, "original\n");
  const entry = await f.request("late-save", "file.ts", () => writeFile(target, "user saved during approval\n")); assert.ok(entry);
  await writeFile(target, "tool partially wrote\n"); const finished = await f.finish("late-save", entry.id, true); assert.equal(finished?.status, "failed"); assert.equal(finished?.diff, "ready");
  const provider = f.h.contentProviders.get("pi-vscode-review"); assert.ok(provider);
  const token = { isCancellationRequested: false } as vscode.CancellationToken;
  assert.equal(await provider.provideTextDocumentContent(f.h.api.Uri.parse("pi-vscode-review:/" + entry.id + "/before") as unknown as vscode.Uri, token), "user saved during approval\n");
  const created = await f.request("create", "new.ts"); assert.ok(created); await writeFile(path.join(f.root, "new.ts"), "new content\n");
  assert.equal((await f.finish("create", created.id))?.diff, "ready");
  assert.equal(await provider.provideTextDocumentContent(f.h.api.Uri.parse("pi-vscode-review:/" + created.id + "/before") as unknown as vscode.Uri, token), "");
});

test("observed workspace changes are not tool attribution and metadata overflow preserves prior entries", { timeout: 5000 }, async t => {
  const f = await reviewFixture(t);
  f.h.fileChange.fire(f.h.api.Uri.file(path.join(f.root, "shell.ts")) as unknown as vscode.Uri);
  const first = f.state().entries[0]; assert.ok(first); assert.equal(first.source, "observed"); assert.equal(first.diff, "unavailable"); assert.equal(first.reason, "no-before-snapshot");
  for (let i = 0; i < 130; i++) f.h.fileCreate.fire(f.h.api.Uri.file(path.join(f.root, "observed-" + i + ".ts")) as unknown as vscode.Uri);
  const full = f.state(); assert.equal(full.entries.length, 128); assert.equal(full.limited, true); assert.equal(full.entries[0].id, first.id);
  f.r.settled();
  f.h.fileChange.fire(f.h.api.Uri.file(path.join(f.root, "outside-task.ts")) as unknown as vscode.Uri);
  assert.ok(!f.state().entries.some(entry => entry.path === "outside-task.ts"));
});

test("unsafe or unreliable image sources disclose unavailability without truncation or blocking approved tools", { timeout: 5000 }, async t => {
  const f = await reviewFixture(t);
  const fixtures: { name: string; content: string | Buffer; reason: string }[] = [
    { name: ".env", content: "synthetic fixture, not a credential", reason: "sensitive-source" },
    { name: "literal.ts", content: 'const secret = "synthetic placeholder";', reason: "sensitive-source" },
    { name: "binary.bin", content: Buffer.from([0, 1, 2]), reason: "not-text" },
    { name: "invalid.bin", content: Buffer.from([255, 254]), reason: "not-text" },
    { name: "large.ts", content: "x".repeat(262145), reason: "too-large" },
  ];
  for (let i = 0; i < fixtures.length; i++) {
    const fixture = fixtures[i]; await writeFile(path.join(f.root, fixture.name), fixture.content);
    const entry = await f.request("unsafe-" + i, fixture.name); assert.ok(entry);
    const finished = await f.finish("unsafe-" + i, entry.id);
    assert.equal(finished?.diff, "unavailable"); assert.equal(finished?.reason, fixture.reason);
  }
  assert.equal(f.state().retainedBytes, 0);
});

test("image retention is bounded at 8 MiB without evicting older exact snapshots", { timeout: 10000 }, async t => {
  const f = await reviewFixture(t); const before = "b".repeat(262144); const after = "a".repeat(262144);
  let firstId = "";
  for (let i = 0; i < 17; i++) {
    const name = "large-" + i + ".ts"; const target = path.join(f.root, name); await writeFile(target, before);
    const entry = await f.request("capacity-" + i, name); assert.ok(entry); firstId ||= entry.id;
    await writeFile(target, after); const completed = await f.finish("capacity-" + i, entry.id);
    assert.equal(completed?.diff, i < 16 ? "ready" : "unavailable");
    if (i === 16) assert.equal(completed?.reason, "retention-limit");
  }
  const state = f.state(); assert.equal(state.retainedBytes, 8388608); assert.equal(state.limited, true); assert.equal(state.entries[0].id, firstId);
  const provider = f.h.contentProviders.get("pi-vscode-review"); assert.ok(provider);
  assert.equal(await provider.provideTextDocumentContent(f.h.api.Uri.parse("pi-vscode-review:/" + firstId + "/after") as unknown as vscode.Uri, { isCancellationRequested: false } as vscode.CancellationToken), after);
});


test("an unresolved tool window remains disclosed when a later task targets the same file", { timeout: 5000 }, async t => {
  const f = await reviewFixture(t); await writeFile(path.join(f.root, "file.ts"), "before");
  const first = await f.request("unfinished", "file.ts"); assert.ok(first);
  f.r.settled();
  assert.equal(f.state().entries.find(entry => entry.id === first.id)?.status, "interrupted");
  f.v.action("sendChat", { text: "Explicit next task" }); await tick();
  const second = await f.request("next-task", "file.ts"); assert.ok(second);
  assert.equal(f.state().entries.find(entry => entry.id === first.id)?.overlap, true);
  assert.equal(f.state().entries.find(entry => entry.id === second.id)?.overlap, true);
});

test("outside-project targets have no fabricated snapshot and cannot be opened through review", { timeout: 5000 }, async t => {
  const f = await reviewFixture(t);
  const entry = await f.request("external", "../not-a-project-review-file.txt"); assert.ok(entry);
  const completed = await f.finish("external", entry.id);
  assert.equal(completed?.diff, "unavailable"); assert.equal(completed?.reason, "outside-project"); assert.equal(completed?.path, null);
  const error = observe(f.v, (m): m is ChangeReviewStateMessage => reviewState(m) && m.error === "unavailable"); t.after(() => error.dispose());
  f.v.action("openReviewSource", { id: entry.id }); await error.result;
  assert.equal(f.h.shown.length, 0); assert.equal(f.h.commands.length, 0);
});


test("named review editor operations are single-flight even when valid IDs are replayed", { timeout: 5000 }, async t => {
  const root = await mkdtemp(path.join(tmpdir(), "pi-review-open-")); const h = harness(); h.provider.dispose();
  const review = new ChangeReview(h.api as unknown as ConstructorParameters<typeof ChangeReview>[0], () => {});
  let release: (() => void) | undefined;
  t.after(async () => { release?.(); review.dispose(); await rm(root, { recursive: true, force: true }); });
  const target = path.join(root, "file.ts"); await writeFile(target, "before"); review.beginTask(root, "task");
  await review.beforeWrite({ cwd: root, runtime: "runtime", request: "request", toolCallId: "call", tool: "write", input: { path: "file.ts", content: "after" } });
  await writeFile(target, "after"); await review.finishTool("call", false); const entry = review.snapshot().entries[0]; assert.ok(entry);
  let started: (() => void) | undefined; const commandStarted = new Promise<void>(resolve => { started = resolve; });
  const commandWaiting = new Promise<void>(resolve => { release = resolve; });
  h.api.commands.executeCommand = async (...args) => { h.commands.push(args); started?.(); await commandWaiting; };
  const first = review.open(entry.id, "diff", () => true); await commandStarted;
  await review.open(entry.id, "source", () => true);
  assert.equal(h.shown.length, 0, "A concurrent source intent must not open another native editor");
  release?.(); await first; await review.open(entry.id, "source", () => true); assert.equal(h.shown.length, 1);
});

test("workspace event bursts coalesce publication and stop after the metadata limit", async t => {
  const root = await mkdtemp(path.join(tmpdir(), "pi-review-events-")); const h = harness(); h.provider.dispose();
  let publications = 0; const review = new ChangeReview(h.api as unknown as ConstructorParameters<typeof ChangeReview>[0], () => { publications++; });
  t.after(async () => { review.dispose(); await rm(root, { recursive: true, force: true }); });
  review.beginTask(root, "task");
  for (let i = 0; i < 1000; i++) h.fileChange.fire(h.api.Uri.file(path.join(root, "event-" + i + ".ts")) as vscode.Uri);
  await tick();
  assert.equal(review.snapshot().entries.length, 128); assert.equal(review.snapshot().limited, true);
  assert.ok(publications <= 2, "An event burst must not emit one full snapshot per event: " + publications);
  const prior = publications;
  for (let i = 0; i < 1000; i++) h.fileChange.fire(h.api.Uri.file(path.join(root, "extra-" + i + ".ts")) as vscode.Uri);
  await tick(); assert.equal(publications, prior, "An already disclosed limit must not flood duplicate updates");
  review.clear(); const cleared = publications;
  h.fileChange.fire(h.api.Uri.file(path.join(root, "late.ts")) as vscode.Uri); await tick();
  assert.equal(publications, cleared); assert.deepEqual(review.snapshot().entries, []);
});

test("a dirty guard denial after capture releases provisional review entries and bytes", { timeout: 5000 }, async t => {
  const f = await reviewFixture(t); const target = path.join(f.root, "file.ts"); await writeFile(target, "before");
  const offered = observe(f.v, (m): m is WorkspaceStateMessage => (m as WorkspaceStateMessage).type === "workspaceState" && (m as WorkspaceStateMessage).approvals.length > 0);
  t.after(() => offered.dispose());
  const changed = f.v.posted.subscribe(message => {
    if (reviewState(message) && message.entries.some(entry => entry.source === "tool")) f.h.api.workspace.textDocuments.push({ uri: f.h.api.Uri.file(target), isDirty: true, isClosed: false } as vscode.TextDocument);
  }); t.after(() => changed.dispose());
  const result = f.authorize({ cwd: f.root, runtime: "fixture", request: "race", toolCallId: "race", tool: "write", input: { path: "file.ts", content: "next" } });
  await offered.result; f.v.action("decideApproval", { id: "race", decision: "once" });
  assert.equal(await result, false); changed.dispose();
  assert.match(f.v.state().chatError ?? "", /unsaved/);
  assert.equal(f.state().entries.length, 0, "A denied tool must not leave an interrupted operation");
  assert.equal(f.state().retainedBytes, 0);
  f.h.api.workspace.textDocuments.length = 0;
  assert.ok(await f.request("retry", "file.ts"));
});

test("preflight overlap survives another call completing before the delayed capture returns", { timeout: 5000 }, async t => {
  const root = await mkdtemp(path.join(tmpdir(), "pi-review-overlap-")); const h = harness(); h.provider.dispose();
  const review = new ChangeReview(h.api as unknown as ConstructorParameters<typeof ChangeReview>[0], () => {});
  let release: (() => void) | undefined;
  t.after(async () => { release?.(); review.dispose(); await rm(root, { recursive: true, force: true }); });
  const target = path.join(root, "file.ts"); await writeFile(target, "old"); review.beginTask(root, "task");
  const call = (id: string): GateCall => ({ cwd: root, runtime: "fixture", request: id, toolCallId: id, tool: "write", input: { path: "file.ts", content: "new" } });
  await review.beforeWrite(call("first"));
  let entered!: () => void; const blocked = new Promise<void>(resolve => { entered = resolve; });
  const proceed = new Promise<void>(resolve => { release = resolve; }); const original = fileSystem.open;
  t.mock.method(fileSystem, "open", async (...args: Parameters<typeof fileSystem.open>) => { entered(); await proceed; return original(...args); }, { times: 1 });
  const second = review.beforeWrite(call("second")); await blocked;
  await writeFile(target, "first result"); await review.finishTool("first", false);
  release?.(); await second;
  assert.equal(review.snapshot().entries.length, 2);
  assert.ok(review.snapshot().entries.every(entry => entry.overlap), "Terminal status must not erase an intersecting preflight interval");
});
