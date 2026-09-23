import assert from "node:assert/strict";
import test from "node:test";
import type * as vscode from "vscode";
import { mkdtemp, writeFile, rm, readFile, mkdir, symlink } from "node:fs/promises";
import os from "node:os";
import { unlinkSync } from "node:fs";
import path from "node:path";
import { folder, harness, settingsRuntime, tick } from "../../tests/harness.js";
import type { PromptInput } from "../../contracts/runtimeLifecycle.js";
import { parseWebviewMessage } from "../../bridge/webviewMessages.js";
import { captureSelection, AttachmentFailure } from "../fileAttachment.js";

async function fixture(text = "unsaved code") {
  const root = await mkdtemp(path.join(os.tmpdir(), "pi-attachment-"));
  const target = path.join(root, "code.ts"); await writeFile(target, "disk code");
  const uri = { scheme: "file", authority: "", query: "", fragment: "", fsPath: target, toString: () => `file://${target}` };
  let content = text;
  const doc = { uri, version: 1, isDirty: true, isClosed: false, lineCount: 1,
    lineAt: () => ({ range: { end: { line: 0, character: content.length } } }), offsetAt: () => content.length, getText: () => content };
  const r = settingsRuntime(); const inputs: PromptInput[] = [];
  r.runtime.preparePrompt = input => ({ async send(onAttempt) { inputs.push(input); onAttempt(); return { delivery: "rpc-accepted" }; } });
  const h = harness([folder(root)], true, undefined, r.runtime);
  h.api.workspace.textDocuments = [doc as unknown as vscode.TextDocument];
  h.api.window.showOpenDialog = async () => [uri];
  const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick();
  const waitIdle = () => new Promise<void>(resolve => {
    const original = v.view.webview.postMessage;
    v.view.webview.postMessage = message => {
      const result = original(message);
      if ((message as { type: string; preparation: string }).type === "attachmentState" && (message as { preparation: string }).preparation === "idle") { v.view.webview.postMessage = original; resolve(); }
      return result;
    };
  });
  const add = async () => {
    const state = v.state(); const revision = v.attachments().draft.revision;
    const idle = waitIdle();
    v.send("addFileAttachment", { generation: state.generation, viewId: state.viewId, draftRevision: revision });
    await idle;
  };
  const send = async (body: string) => {
    v.action("updateDraft", { draftRevision: v.attachments().draft.revision, editSequence: v.attachments().draft.acceptedEditSequence + 1, text: body });
    const state = v.state(); const revision = v.attachments().draft.revision;
    const idle = waitIdle();
    v.send("sendChat", { generation: state.generation, viewId: state.viewId, draftRevision: revision });
    await idle; await tick();
  };
  const cleanup = async () => { h.provider.dispose(); await rm(root, { recursive: true, force: true }); };
  return { root, target, uri, doc, r, h, v, inputs, add, send, waitIdle, cleanup, change(value: string) { content = value; doc.version++; h.documentChange.fire({ document: doc as unknown as vscode.TextDocument }); } };
}

async function selectionFixture(content = "first selected\nunselected", originalRange = { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }) {
  const f = await fixture(content);
  const text = f.doc.getText;
  const offset = (position: { line: number; character: number }) => text().split("\n").slice(0, position.line).reduce((n, line) => n + line.length + 1, 0) + position.character;
  let fullReads = 0;
  f.doc.getText = (range?: vscode.Range) => { if (!range) { fullReads++; return text(); } return text().slice(offset(range.start), offset(range.end)); };
  Object.defineProperty(f.doc, "lineCount", { get: () => text().split("\n").length });
  f.doc.lineAt = (line = 0) => ({ range: { end: { line, character: text().split("\n")[line].length } } });
  f.doc.offsetAt = (position?: vscode.Position) => position ? offset(position) : text().length;
  const selection = { ...originalRange, isEmpty: originalRange.start.line === originalRange.end.line && originalRange.start.character === originalRange.end.character } as vscode.Selection;
  const editor = { document: f.doc, selection, selections: [selection] } as unknown as vscode.TextEditor;
  const window = Object.assign(f.h.api.window, { activeTextEditor: editor as vscode.TextEditor | undefined });
  const addSelection = async () => {
    const state = f.v.state(); const draft = f.v.attachments().draft;
    const idle = f.waitIdle(); f.v.send("addSelectionAttachment", { generation: state.generation, viewId: state.viewId, draftRevision: draft.revision }); await idle;
  };
  return { ...f, editor, window, originalRange, addSelection, get fullReads() { return fullReads; } };
}

test("native dirty file admission preserves exact preview/history without saving or rebroadcasting bodies", async () => {
  const f = await fixture('<script>literal</script>\n/skill:code');
  try {
    await f.add(); const attachment = f.v.attachments().draft.attachments[0]; assert.ok(attachment);
    f.v.action("getAttachmentPreview", { requestId: "preview", snapshotId: attachment.snapshotId, offset: 0 });
    assert.equal((f.v.sent.at(-1) as { text: string }).text, '<script>literal</script>\n/skill:code');
    await f.send(" task ");
    assert.deepEqual(f.inputs, [{ kind: "enriched", body: " task ", attachments: [{ path: "code.ts", kind: "file", unsaved: true, text: '<script>literal</script>\n/skill:code' }] }]);
    assert.equal(await readFile(f.target, "utf8"), "disk code");
    assert.equal(f.v.attachments().draft.text, ""); assert.equal(f.v.attachments().historyCount, 1);
    f.change("later text");
    f.v.action("getAttachmentPreview", { requestId: "again", snapshotId: attachment.snapshotId, offset: 0 });
    assert.equal((f.v.sent.at(-1) as { text: string }).text, '<script>literal</script>\n/skill:code');
    const count = f.v.sent.length;
    f.r.events.fire({ kind: "text_delta", session: f.r.runtime.getSession(), delta: "response" });
    assert.equal(f.v.sent.length, count + 1);
    assert.equal((f.v.sent.at(-1) as { type: string }).type, "workspaceState");
  } finally { await f.cleanup(); }
});

test("changes remain invalid even after restoration and rejected send retains draft with zero runtime writes", async () => {
  const f = await fixture();
  try {
    await f.add(); f.change("changed"); f.change("unsaved code");
    await f.send("preserve");
    assert.equal(f.inputs.length, 0); assert.equal(f.v.attachments().draft.text, "preserve");
    assert.equal(f.v.attachments().result?.code, "source-changed");
    const a = f.v.attachments().draft.attachments[0]!;
    f.v.action("removeAttachment", { draftRevision: f.v.attachments().draft.revision, attachmentId: a.attachmentId });
    await f.add(); await f.send("retry after reattach");
    assert.equal(f.inputs.length, 1);
  } finally { await f.cleanup(); }
});

test("Stop and replacement cancel pending native picks and release document listeners", async () => {
  for (const cancel of ["stop", "view", "workspace"]) {
    const f = await fixture();
    try {
      let resolve!: (uris: typeof f.uri[]) => void;
      f.h.api.window.showOpenDialog = () => new Promise(done => { resolve = done; });
      f.v.action("updateDraft", { draftRevision: f.v.attachments().draft.revision, editSequence: 1, text: "keep" });
      f.v.action("addFileAttachment", { draftRevision: f.v.attachments().draft.revision });
      if (cancel === "stop") f.v.action("stopChat");
      if (cancel === "view") f.h.createView();
      if (cancel === "workspace") { f.h.api.workspace.workspaceFolders = []; f.h.change.fire(); }
      resolve([f.uri]); await tick();
      assert.equal(f.inputs.length, 0);
      const fresh = f.h.createView(); assert.equal(fresh.attachments().draft.text, "keep"); assert.equal(fresh.attachments().draft.attachments[0], undefined);
      f.h.provider.dispose(); assert.equal(f.h.documentChange.listeners.size, 0); assert.equal(f.h.documentClose.listeners.size, 0);
    } finally { await f.cleanup(); }
  }
});

test("acquisition refuses unopened oversized and sensitive paths before document loading but permits open dirty text", async () => {
  const f = await fixture("small dirty text");
  try {
    let opens = 0;
    f.h.api.workspace.openTextDocument = async () => { opens++; throw new Error("binary fixture"); };
    await writeFile(f.target, "x".repeat(1048577)); f.h.api.workspace.textDocuments = [];
    await f.add(); assert.equal(f.v.attachments().result?.code, "source-too-large"); assert.equal(opens, 0);
    f.h.api.workspace.textDocuments = [f.doc as unknown as vscode.TextDocument];
    await f.add(); assert.ok(f.v.attachments().draft.attachments[0]); assert.equal(opens, 0);
    const a = f.v.attachments().draft;
    f.v.action("removeAttachment", { draftRevision: a.revision, attachmentId: a.attachments[0]!.attachmentId });
    f.h.api.workspace.textDocuments = [];
    f.h.api.window.showOpenDialog = async () => [{ ...f.uri, fsPath: path.join(f.root, ".env.dummy") }];
    await f.add(); assert.equal(f.v.attachments().result?.code, "sensitive-source"); assert.equal(opens, 0);
    f.h.api.window.showOpenDialog = async () => [f.uri]; await writeFile(f.target, "small");
    await f.add(); assert.equal(f.v.attachments().result?.code, "not-text"); assert.equal(opens, 1);
  } finally { await f.cleanup(); }
});

test("document-load cancellation and replacement suppress capture after the await", async () => {
  for (const cancel of ["stop", "edit", "view", "resources"] as const) {
    const f = await fixture();
    try {
      f.h.api.workspace.textDocuments = [];
      let release!: (doc: vscode.TextDocument) => void;
      let loaded!: () => void; const loading = new Promise<void>(resolve => { loaded = resolve; });
      f.h.api.workspace.openTextDocument = () => { loaded(); return new Promise(resolve => { release = resolve; }); };
      f.v.action("addFileAttachment", { draftRevision: f.v.attachments().draft.revision }); await loading;
      if (cancel === "stop") f.v.action("stopChat");
      if (cancel === "edit") f.v.action("updateDraft", { draftRevision: f.v.attachments().draft.revision, editSequence: 1, text: "newer" });
      if (cancel === "view") f.h.createView();
      if (cancel === "resources") f.v.action("chooseResources", { choice: "decline" });
      release(f.doc as unknown as vscode.TextDocument); await tick();
      const view = f.h.createView(); assert.equal(view.attachments().draft.attachments[0], undefined); assert.equal(f.inputs.length, 0);
      if (cancel === "edit") assert.equal(view.attachments().draft.text, "newer");
    } finally { await f.cleanup(); }
  }
});

test("edit and removal supersede preparing sends with zero dispatch and allow a deliberate new send", async () => {
  for (const action of ["edit", "remove"] as const) {
    const f = await fixture();
    try {
      await f.add();
      f.v.action("sendChat", { text: "original" });
      const draft = f.v.attachments().draft;
      if (action === "edit") f.v.action("updateDraft", { draftRevision: draft.revision, editSequence: draft.acceptedEditSequence + 1, text: "newer" });
      else f.v.action("removeAttachment", { draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId });
      await tick(); assert.equal(f.inputs.length, 0);
      await f.send("deliberate next send"); assert.equal(f.inputs.length, 1);
      assert.equal(f.inputs[0].body, "deliberate next send");
    } finally { await f.cleanup(); }
  }
});

test("retained bytes equal immutable logical payload, independent of delivery status", async () => {
  const f = await fixture("é");
  try {
    await f.add(); await f.send("body");
    f.v.action("getAttachmentHistory");
    const entry = (f.v.sent.at(-1) as { entries: { submissionId: string; snapshotId: string; relativePath: string; kind: string; utf8Bytes: number; unsaved: boolean }[] }).entries[0];
    const metadata = { submissionId: entry.submissionId, snapshotId: entry.snapshotId, relativePath: "code.ts", kind: "file", utf8Bytes: 2, unsaved: true };
    const state = f.v.attachments() as unknown as { retainedBytes: number };
    assert.equal(state.retainedBytes, 6 + Buffer.byteLength(JSON.stringify(metadata), "utf8"));
    f.r.settled(); assert.equal((f.v.attachments() as unknown as { retainedBytes: number }).retainedBytes, state.retainedBytes);
  } finally { await f.cleanup(); }
});

test("canonical junction escapes and ambiguous Windows inputs fail before document loading", async () => {
  const f = await fixture(); const outside = await mkdtemp(path.join(os.tmpdir(), "pi-outside-"));
  try {
    await writeFile(path.join(outside, "code.ts"), "outside dummy");
    const link = path.join(f.root, "escape"); await symlink(outside, link, "junction");
    let opens = 0; f.h.api.workspace.textDocuments = []; f.h.api.workspace.openTextDocument = async () => { opens++; throw new Error("must not load"); };
    for (const [target, code] of [[path.join(link, "code.ts"), "outside-workspace"], ["C:relative", "invalid-source"], ["C:\\safe\\CON.txt", "invalid-source"], [f.target + ":ads", "invalid-source"], [f.target + " ", "invalid-source"]]) {
      f.h.api.window.showOpenDialog = async () => [{ ...f.uri, fsPath: target }];
      await f.add(); assert.equal(f.v.attachments().result?.code, code); assert.equal(opens, 0);
    }
    let long = f.root;
    for (let i = 0; i < 6; i++) { long = path.join(long, "a".repeat(180)); await mkdir(long); }
    const target = path.join(long, "code.ts"); await writeFile(target, "dummy");
    f.h.api.window.showOpenDialog = async () => [{ ...f.uri, fsPath: target }]; await f.add();
    assert.equal(f.v.attachments().result?.code, "metadata-too-large"); assert.equal(opens, 0);
  } finally { await f.cleanup(); await rm(outside, { recursive: true, force: true }); }
});

test("closed, reopened, deleted and changed disk sources cannot send captured context", async () => {
  for (const change of ["close", "reopen", "delete", "disk"] as const) {
    const f = await fixture();
    try {
      await f.add();
      if (change === "close" || change === "reopen") { f.doc.isClosed = true; f.h.documentClose.fire(f.doc as unknown as vscode.TextDocument); }
      if (change === "reopen") { f.doc.isClosed = false; f.h.api.workspace.textDocuments = [{ ...f.doc } as unknown as vscode.TextDocument]; }
      if (change === "delete") await rm(f.target);
      if (change === "disk") await writeFile(f.target, "different disk identity and size");
      await f.send("preserve");
      assert.equal(f.inputs.length, 0); assert.equal(f.v.attachments().draft.text, "preserve");
      assert.ok(["source-changed", "unavailable"].includes(f.v.attachments().result?.code ?? ""));
    } finally { await f.cleanup(); }
  }
});

test("preview pending delivery rejects excess requests and replacement releases the guard", async () => {
  const f = await fixture("preview");
  try {
    await f.add(); const snapshotId = f.v.attachments().draft.attachments[0]!.snapshotId;
    const original = f.v.view.webview.postMessage; let finish!: (value: boolean) => void;
    f.v.view.webview.postMessage = message => {
      original(message);
      return (message as { type: string; code?: string }).type === "attachmentPreview" && !(message as { code?: string }).code ? new Promise(resolve => { finish = resolve; }) : Promise.resolve(true);
    };
    f.v.action("getAttachmentPreview", { snapshotId, requestId: "first", offset: 0 });
    f.v.action("getAttachmentPreview", { snapshotId, requestId: "excess", offset: 0 });
    assert.equal((f.v.sent.at(-1) as { code: string }).code, "busy");
    const fresh = f.h.createView();
    fresh.action("getAttachmentPreview", { snapshotId, requestId: "fresh", offset: 0 });
    assert.equal((fresh.sent.at(-1) as { text: string }).text, "preview");
    finish(true); await tick(); assert.equal(f.inputs.length, 0);
  } finally { await f.cleanup(); }
});

test("both live history caps block admission without eviction and preserve plain chat", async () => {
  for (const [text, capacity] of [["", 128], ["a".repeat(262144), 31]] as const) {
    const f = await fixture(text);
    try {
      for (let i = 0; i < capacity; i++) { await f.add(); await f.send("task"); f.r.settled(); await tick(); }
      assert.equal(f.v.attachments().historyCount, capacity);
      await f.add(); await f.send("overflow");
      assert.equal(f.v.attachments().result?.code, "history-full"); assert.equal(f.inputs.length, capacity);
      f.v.action("getAttachmentHistory");
      assert.equal((f.v.sent.at(-1) as { entries: unknown[] }).entries.length, capacity);
      const draft = f.v.attachments().draft;
      f.v.action("removeAttachment", { draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId });
      await f.send("plain"); assert.equal(f.inputs.length, capacity + 1);
    } finally { await f.cleanup(); }
  }
});

test("sensitive and over-budget dummy sources are blocked before admission", async () => {
  for (const [text, code] of [["password = dummy-marker", "sensitive-source"], ["é".repeat(131073), "text-too-large"]]) {
    const f = await fixture(text);
    try { await f.add(); assert.equal(f.v.attachments().draft.attachments[0], undefined); assert.equal(f.v.attachments().result?.code, code); assert.equal(f.inputs.length, 0); }
    finally { await f.cleanup(); }
  }
});

test("changed whole files stage latest bytes and require a new explicit confirmation after each edit", async () => {
  const f = await fixture("original");
  try {
    await f.add(); const original = f.v.attachments().draft.attachments[0]!;
    f.change("first latest 中"); await f.send("keep request");
    const first = f.v.attachments().draft;
    assert.equal(first.attachments[0]?.state, "confirmation-required");
    assert.notEqual(first.attachments[0]?.snapshotId, original.snapshotId);
    assert.equal(f.inputs.length, 0); assert.equal(first.text, "keep request");
    // Confirmation is intentionally usable without opening the optional preview.
    const state = f.v.state();
    let idle = f.waitIdle();
    f.v.send("confirmFileAttachment", { generation: state.generation, viewId: state.viewId, draftRevision: first.revision, attachmentId: first.attachments[0]!.attachmentId, snapshotId: first.attachments[0]!.snapshotId });
    await idle;
    assert.equal(f.v.attachments().draft.attachments[0]?.state, "attached");
    assert.equal(f.inputs.length, 0, "confirmation alone never sends");
    f.change("second latest 🐱"); await f.send("keep request");
    const second = f.v.attachments().draft;
    assert.equal(second.attachments[0]?.state, "confirmation-required");
    assert.notEqual(second.attachments[0]?.snapshotId, first.attachments[0]!.snapshotId);
    f.v.action("confirmFileAttachment", { draftRevision: second.revision, attachmentId: second.attachments[0]!.attachmentId, snapshotId: first.attachments[0]!.snapshotId });
    assert.equal(f.v.attachments().result?.code, "stale");
    assert.equal(f.inputs.length, 0);
    idle = f.waitIdle();
    f.v.send("confirmFileAttachment", { generation: state.generation, viewId: state.viewId, draftRevision: second.revision, attachmentId: second.attachments[0]!.attachmentId, snapshotId: second.attachments[0]!.snapshotId });
    await idle; await f.send("keep request");
    assert.deepEqual(f.inputs, [{ kind: "enriched", body: "keep request", attachments: [{ path: "code.ts", kind: "file", unsaved: true, text: "second latest 🐱" }] }]);
    f.change("after send");
    f.v.action("getAttachmentPreview", { requestId: "history", snapshotId: second.attachments[0]!.snapshotId, offset: 0 });
    assert.equal((f.v.sent.at(-1) as { text: string }).text, "second latest 🐱");
    assert.equal(await readFile(f.target, "utf8"), "disk code");
  } finally { await f.cleanup(); }
});

test("Stop, newer input and replacement during confirmation never authorize the staged snapshot", async () => {
  for (const cancel of ["stop", "input", "remove", "view", "resources"] as const) {
    const f = await fixture("initial");
    try {
      await f.add(); f.change("latest"); await f.send("request");
      const draft = f.v.attachments().draft; const state = f.v.state();
      let validationReached!: () => void;
      const validation = new Promise<void>(resolve => { validationReached = resolve; });
      const originalGetText = f.doc.getText;
      f.doc.getText = () => {
        f.doc.getText = originalGetText;
        if (cancel === "stop") f.v.action("stopChat");
        if (cancel === "input") f.v.action("updateDraft", { draftRevision: draft.revision, editSequence: draft.acceptedEditSequence + 1, text: "new request" });
        if (cancel === "remove") f.v.action("removeAttachment", { draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId });
        if (cancel === "view") f.h.createView();
        if (cancel === "resources") f.v.action("chooseResources", { choice: "decline" });
        validationReached(); return originalGetText();
      };
      f.v.send("confirmFileAttachment", { generation: state.generation, viewId: state.viewId, draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId, snapshotId: draft.attachments[0]!.snapshotId });
      await validation; await tick();
      const fresh = f.h.createView();
      assert.equal(f.inputs.length, 0);
      assert.equal(fresh.attachments().draft.text, cancel === "input" ? "new request" : "request");
      assert.equal(fresh.attachments().draft.attachments[0]?.state, cancel === "resources" || cancel === "remove" ? undefined : "confirmation-required");
    } finally { await f.cleanup(); }
  }
});

test("latest-file capture and confirmation reject new unsafe, oversized, deleted or changing sources", async () => {
  for (const invalid of ["large", "sensitive", "deleted", "confirm-change"] as const) {
    const f = await fixture("initial");
    try {
      await f.add(); f.change("latest"); await f.send("keep request");
      const draft = f.v.attachments().draft; const state = f.v.state();
      if (invalid === "large") f.change("é".repeat(131073));
      if (invalid === "sensitive") f.change("password = dummy-marker");
      if (invalid === "deleted") await rm(f.target);
      if (invalid === "confirm-change") {
        const originalGetText = f.doc.getText;
        f.doc.getText = () => { f.doc.getText = originalGetText; f.change("changed during validation"); return originalGetText(); };
      }
      if (invalid === "large" || invalid === "sensitive") await f.send("keep request");
      else {
        const idle = f.waitIdle();
        f.v.send("confirmFileAttachment", { generation: state.generation, viewId: state.viewId, draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId, snapshotId: draft.attachments[0]!.snapshotId });
        await idle;
      }
      assert.equal(f.inputs.length, 0); assert.equal(f.v.attachments().draft.text, "keep request");
      assert.notEqual(f.v.attachments().draft.attachments[0]?.state, "attached");
      assert.equal(f.v.attachments().result?.code, invalid === "large" ? "text-too-large" : invalid === "sensitive" ? "sensitive-source" : invalid === "deleted" ? "unavailable" : "source-changed");
      assert.equal(await readFile(f.target, "utf8").catch(() => "deleted"), invalid === "deleted" ? "deleted" : "disk code");
    } finally { await f.cleanup(); }
  }
});

test("a rebuilt view retains unconfirmed bytes but old-view and old-revision answers cannot confirm them", async () => {
  const f = await fixture("initial");
  try {
    await f.add(); f.change("candidate"); await f.send("request");
    const old = f.v.state(); const draft = f.v.attachments().draft;
    const fresh = f.h.createView();
    assert.equal(fresh.attachments().draft.attachments[0]?.snapshotId, draft.attachments[0]!.snapshotId);
    assert.equal(fresh.attachments().draft.attachments[0]?.state, "confirmation-required");
    fresh.send("confirmFileAttachment", { generation: old.generation, viewId: old.viewId, draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId, snapshotId: draft.attachments[0]!.snapshotId });
    fresh.action("updateDraft", { draftRevision: draft.revision, editSequence: 1, text: "new request" });
    fresh.action("confirmFileAttachment", { draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId, snapshotId: draft.attachments[0]!.snapshotId });
    assert.equal(fresh.attachments().result?.code, "stale");
    assert.equal(fresh.attachments().draft.text, "new request");
    assert.equal(fresh.attachments().draft.attachments[0]?.state, "confirmation-required");
    assert.equal(f.inputs.length, 0);
  } finally { await f.cleanup(); }
});

test("Stop invalidates the old confirmation envelope and only a new explicit confirmation can authorize", async () => {
  const f = await fixture("initial");
  try {
    await f.add(); f.change("latest"); await f.send("request");
    const state = f.v.state(); const draft = f.v.attachments().draft;
    const oldAnswer = { generation: state.generation, viewId: state.viewId, draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId, snapshotId: draft.attachments[0]!.snapshotId };
    f.v.send("confirmFileAttachment", oldAnswer);
    f.v.send("stopChat", { generation: state.generation, viewId: state.viewId });
    let idle = f.waitIdle(); f.v.send("confirmFileAttachment", oldAnswer); await idle;
    assert.equal(f.v.attachments().draft.attachments[0]?.state, "confirmation-required");
    assert.equal(f.v.attachments().result?.code, "stale");
    assert.equal(f.inputs.length, 0); assert.equal(f.v.attachments().draft.text, "request");
    const revision = f.v.attachments().draft.revision;
    idle = f.waitIdle(); f.v.send("confirmFileAttachment", { ...oldAnswer, draftRevision: revision }); await idle;
    assert.equal(f.v.attachments().draft.attachments[0]?.state, "attached");
    assert.equal(f.inputs.length, 0);
  } finally { await f.cleanup(); }
});

test("an explicit dirty editor selection sends only its fixed text and original range", async () => {
  const f = await selectionFixture("prefix\nα中🐱 tail\nsuffix", { start: { line: 1, character: 1 }, end: { line: 1, character: 4 } });
  try {
    const { editor, originalRange } = f;
    const state = f.v.state(); const revision = f.v.attachments().draft.revision;
    const action = { version: 2, type: "addSelectionAttachment", generation: state.generation, viewId: state.viewId, draftRevision: revision };
    assert.ok(parseWebviewMessage(action), "the named selection intent must be admitted by the real validator");
    const idle = f.waitIdle(); f.v.receive.fire(action); await idle;
    const attached = f.v.attachments().draft.attachments[0]; assert.ok(attached);
    assert.deepEqual(attached, { attachmentId: attached.attachmentId, snapshotId: attached.snapshotId, relativePath: "code.ts", kind: "selection", originalRange, stale: false, utf8Bytes: 7, unsaved: true, state: "attached" });
    // Moving the live cursor does not move the captured selection.
    editor.selection = { start: { line: 0, character: 0 }, end: { line: 0, character: 6 }, isEmpty: false } as vscode.Selection;
    await f.send("inspect selection");
    assert.deepEqual(f.inputs, [{ kind: "enriched", body: "inspect selection", attachments: [{ path: "code.ts", kind: "selection", originalRange, stale: false, unsaved: true, text: "中🐱" }] }]);
    f.v.action("getAttachmentHistory");
    const historical = (f.v.sent.at(-1) as { entries: { kind: string; originalRange: unknown; stale: boolean }[] }).entries[0];
    assert.equal(historical.kind, "selection"); assert.deepEqual(historical.originalRange, originalRange); assert.equal(historical.stale, false);
    assert.equal(f.fullReads, 0, "selection capture and send do not read the whole editor body");
    assert.equal(await readFile(f.target, "utf8"), "disk code");
    f.change("completely different");
    f.v.action("getAttachmentPreview", { requestId: "selected-history", snapshotId: attached.snapshotId, offset: 0 });
    assert.equal((f.v.sent.at(-1) as { text: string }).text, "中🐱");
  } finally { await f.cleanup(); }
});

test("changed selection text stays fixed and each source revision requires an explicit old-snapshot choice", async () => {
  const f = await selectionFixture();
  try {
    await f.addSelection(); const attached = f.v.attachments().draft.attachments[0]!;
    f.change("changed once"); await f.send("inspect old selection");
    let draft = f.v.attachments().draft; const state = f.v.state();
    assert.equal(draft.attachments[0]?.state, "confirmation-required");
    assert.equal(draft.attachments[0]?.snapshotId, attached.snapshotId);
    assert.equal(f.inputs.length, 0);
    const answer = { version: 2, type: "confirmSelectionAttachment", generation: state.generation, viewId: state.viewId, draftRevision: draft.revision, attachmentId: attached.attachmentId, snapshotId: attached.snapshotId };
    assert.ok(parseWebviewMessage(answer));
    let idle = f.waitIdle(); f.v.receive.fire(answer); await idle;
    assert.equal(f.v.attachments().draft.attachments[0]?.state, "attached"); assert.equal(f.inputs.length, 0);
    f.change("changed twice"); await f.send("inspect old selection");
    draft = f.v.attachments().draft;
    assert.equal(draft.attachments[0]?.state, "confirmation-required");
    f.v.receive.fire(answer); assert.equal(f.v.attachments().result?.code, "stale");
    idle = f.waitIdle(); f.v.receive.fire({ ...answer, draftRevision: draft.revision }); await idle;
    await f.send("inspect old selection");
    assert.deepEqual(f.inputs, [{ kind: "enriched", body: "inspect old selection", attachments: [{ path: "code.ts", kind: "selection", originalRange: f.originalRange, stale: true, unsaved: true, text: "first" }] }]);
    f.v.action("getAttachmentHistory");
    const entry = (f.v.sent.at(-1) as { entries: { stale: boolean; originalRange: unknown }[] }).entries[0];
    assert.equal(entry.stale, true); assert.deepEqual(entry.originalRange, f.originalRange);
    assert.equal(f.fullReads, 0);
  } finally { await f.cleanup(); }
});

test("selection admission gives recoverable errors for absent, empty or multiple ranges and unsafe text", async () => {
  for (const scenario of ["no-editor", "empty-selection", "multiple-selections", "sensitive-source"] as const) {
    const f = await selectionFixture(scenario === "sensitive-source" ? "password = dummy-marker" : "first selected");
    try {
      if (scenario === "no-editor") f.window.activeTextEditor = undefined;
      if (scenario === "empty-selection") f.editor.selection = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 }, isEmpty: true } as vscode.Selection;
      if (scenario === "multiple-selections") f.editor.selections = [f.editor.selection, f.editor.selection];
      if (scenario === "sensitive-source") f.editor.selection = { start: { line: 0, character: 0 }, end: { line: 0, character: 23 }, isEmpty: false } as vscode.Selection;
      await f.addSelection();
      assert.equal(f.v.attachments().result?.code, scenario);
      assert.equal(f.v.attachments().draft.attachments[0], undefined); assert.equal(f.inputs.length, 0);
    } finally { await f.cleanup(); }
  }
});

test("a bounded selection in a large open document is allowed, with UTF-8 limits applied only to selected text", async () => {
  const f = await selectionFixture("x".repeat(1048577) + "\nchosen", { start: { line: 1, character: 0 }, end: { line: 1, character: 6 } });
  try {
    await f.addSelection(); await f.send("large document small selection");
    assert.equal(f.inputs.length, 1); assert.equal(f.inputs[0].kind, "enriched");
    if (f.inputs[0].kind === "enriched") assert.equal(f.inputs[0].attachments[0].text, "chosen");
    assert.equal(f.fullReads, 0);
  } finally { await f.cleanup(); }
  for (const length of [131072, 131073]) {
    const f = await selectionFixture("é".repeat(length), { start: { line: 0, character: 0 }, end: { line: 0, character: length } });
    try {
      await f.addSelection();
      if (length === 131072) { await f.send("boundary"); assert.equal(f.inputs.length, 1); }
      else { assert.equal(f.v.attachments().result?.code, "text-too-large"); assert.equal(f.v.attachments().draft.attachments[0], undefined); assert.equal(f.inputs.length, 0); }
      assert.equal(f.fullReads, 0);
    } finally { await f.cleanup(); }
  }
});

test("old-selection confirmation cannot bypass a deleted source or changed document identity", async () => {
  for (const scenario of ["deleted", "reopened", "closed"] as const) {
    const f = await selectionFixture();
    try {
      await f.addSelection(); f.change("changed"); await f.send("keep draft");
      const draft = f.v.attachments().draft; const state = f.v.state();
      if (scenario === "deleted") await rm(f.target);
      if (scenario === "reopened") f.h.api.workspace.textDocuments = [{ ...f.doc } as unknown as vscode.TextDocument];
      if (scenario === "closed") f.doc.isClosed = true;
      const idle = f.waitIdle();
      f.v.send("confirmSelectionAttachment", { generation: state.generation, viewId: state.viewId, draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId, snapshotId: draft.attachments[0]!.snapshotId }); await idle;
      assert.equal(f.v.attachments().result?.code, "unavailable"); assert.equal(f.inputs.length, 0); assert.equal(f.v.attachments().draft.text, "keep draft");
    } finally { await f.cleanup(); }
  }
});

test("selection confirmation is invalidated by edits, Stop, newer drafts, removal, view and runtime replacement", async () => {
  for (const cancel of ["edit", "stop", "draft", "remove", "view", "resources"] as const) {
    const f = await selectionFixture();
    try {
      await f.addSelection(); f.change("changed"); await f.send("keep draft");
      const draft = f.v.attachments().draft; const state = f.v.state(); const version = f.doc.version;
      let reached!: () => void; const checking = new Promise<void>(resolve => { reached = resolve; });
      Object.defineProperty(f.doc, "version", { configurable: true, get() {
        Object.defineProperty(f.doc, "version", { configurable: true, writable: true, value: version });
        if (cancel === "edit") f.change("another change");
        if (cancel === "stop") f.v.action("stopChat");
        if (cancel === "draft") f.v.action("updateDraft", { draftRevision: draft.revision, editSequence: draft.acceptedEditSequence + 1, text: "newer draft" });
        if (cancel === "remove") f.v.action("removeAttachment", { draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId });
        if (cancel === "view") f.h.createView();
        if (cancel === "resources") f.v.action("chooseResources", { choice: "decline" });
        reached(); return version;
      } });
      f.v.send("confirmSelectionAttachment", { generation: state.generation, viewId: state.viewId, draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId, snapshotId: draft.attachments[0]!.snapshotId });
      await checking; await tick();
      const fresh = f.h.createView();
      assert.equal(f.inputs.length, 0); assert.notEqual(fresh.attachments().draft.attachments[0]?.state, "attached");
      assert.equal(fresh.attachments().draft.text, cancel === "draft" ? "newer draft" : "keep draft");
    } finally { await f.cleanup(); }
  }
});

test("Stop rejects replay of an old-selection answer but allows a new deliberate confirmation", async () => {
  const f = await selectionFixture();
  try {
    await f.addSelection(); f.change("changed"); await f.send("request");
    const state = f.v.state(); const draft = f.v.attachments().draft;
    const answer = { generation: state.generation, viewId: state.viewId, draftRevision: draft.revision, attachmentId: draft.attachments[0]!.attachmentId, snapshotId: draft.attachments[0]!.snapshotId };
    f.v.send("confirmSelectionAttachment", answer);
    f.v.send("stopChat", { generation: state.generation, viewId: state.viewId });
    let idle = f.waitIdle(); f.v.send("confirmSelectionAttachment", answer); await idle;
    assert.equal(f.v.attachments().draft.attachments[0]?.state, "confirmation-required");
    assert.equal(f.v.attachments().result?.code, "stale"); assert.equal(f.inputs.length, 0);
    const revision = f.v.attachments().draft.revision;
    idle = f.waitIdle(); f.v.send("confirmSelectionAttachment", { ...answer, draftRevision: revision }); await idle;
    assert.equal(f.v.attachments().draft.attachments[0]?.state, "attached"); assert.equal(f.inputs.length, 0);
    await f.send("request"); assert.equal(f.inputs.length, 1);
    const input = f.inputs[0]; assert.equal(input.kind, "enriched");
    if (input.kind === "enriched") assert.equal(input.attachments[0].text, "first");
  } finally { await f.cleanup(); }
});

test("selection capture rechecks document validity after async source lookup before any text read", async () => {
  for (const change of ["expanded", "closed", "replaced"] as const) {
    const f = await selectionFixture("a\nb\nc", { start: { line: 0, character: 0 }, end: { line: 2, character: 1 } });
    try {
      let reads = 0; const getText = f.doc.getText;
      f.doc.getText = (...args) => { reads++; return getText(...args); };
      let changed = false;
      let failure: unknown;
      try {
        await captureSelection(f.h.api.workspace, f.root, f.editor, () => {
          if (!changed) {
            changed = true;
            if (change === "expanded") f.change("a\n" + "x".repeat(1048576) + "\nc");
            if (change === "closed") f.doc.isClosed = true;
            if (change === "replaced") f.h.api.workspace.textDocuments = [];
          }
          return true;
        });
      } catch (error) { failure = error; }
      assert.equal(reads, 0, "stale document must be rejected before allocating selected text");
      assert.ok(failure instanceof AttachmentFailure);
      assert.equal(failure.code, change === "expanded" ? "source-changed" : "unavailable");
    } finally { await f.cleanup(); }
  }
});

test("a whole file and fixed selection are submitted together in one immutable mixed vector", async () => {
  const f = await selectionFixture();
  try {
    await f.add(); await f.addSelection(); await f.send("mixed request");
    assert.deepEqual(f.inputs, [{ kind: "enriched", body: "mixed request", attachments: [
      { path: "code.ts", kind: "file", unsaved: true, text: "first selected\nunselected" },
      { path: "code.ts", kind: "selection", unsaved: true, text: "first", originalRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }, stale: false },
    ] }]);
    assert.equal(f.v.attachments().historyCount, 2);
    f.v.action("getAttachmentHistory");
    const message = f.v.sent.at(-1) as { entries: { submissionId: string; snapshotId: string }[] };
    assert.equal(message.entries.length, 2); assert.equal(message.entries[0].submissionId, message.entries[1].submissionId);
    assert.notEqual(message.entries[0].snapshotId, message.entries[1].snapshotId);
    assert.equal(await readFile(f.target, "utf8"), "disk code");
  } finally { await f.cleanup(); }
});

test("a source removed while another item is prepared blocks the complete mixed submission", async () => {
  const f = await fixture("first text");
  try {
    const target = path.join(f.root, "second.ts"); await writeFile(target, "second disk");
    const uri = { ...f.uri, fsPath: target, toString: () => "file://" + target };
    const doc = { ...f.doc, uri, lineAt: () => ({ range: { end: { line: 0, character: 11 } } }), offsetAt: () => 11, getText: () => "second text" };
    f.h.api.workspace.textDocuments.push(doc as unknown as vscode.TextDocument);
    f.h.api.window.showOpenDialog = async () => [f.uri, uri]; await f.add();
    const initial = f.v.attachments().draft.attachments; assert.equal(initial.length, 2);
    let deleted = false;
    doc.getText = () => { if (!deleted) { deleted = true; unlinkSync(f.target); } return "second text"; };
    await f.send("keep both and body");
    assert.equal(f.inputs.length, 0, "cannot submit an earlier source deleted during later capture");
    assert.equal(f.v.attachments().historyCount, 0); assert.equal(f.v.attachments().draft.text, "keep both and body");
    assert.deepEqual(f.v.attachments().draft.attachments.map(a => a.snapshotId), initial.map(a => a.snapshotId));
    assert.equal(f.v.attachments().result?.code, "unavailable");
  } finally { await f.cleanup(); }
});

test("twenty explicit files fit one transaction; a twenty-first item is refused without mutating the list", async () => {
  const f = await fixture("small");
  try {
    f.h.api.window.showOpenDialog = async () => Array.from({ length: 20 }, () => f.uri);
    await f.add(); const before = f.v.attachments().draft;
    assert.equal(before.attachments.length, 20); assert.equal(new Set(before.attachments.map(a => a.snapshotId)).size, 20);
    f.h.api.window.showOpenDialog = async () => [f.uri]; await f.add();
    assert.equal(f.v.attachments().result?.code, "attachment-limit"); assert.deepEqual(f.v.attachments().draft, before);
    f.v.action("removeAttachment", { draftRevision: before.revision, attachmentId: before.attachments[0].attachmentId }); await f.add();
    await f.send("twenty together");
    assert.equal(f.inputs.length, 1); const input = f.inputs[0]; assert.equal(input.kind, "enriched");
    if (input.kind === "enriched") assert.equal(input.attachments.length, 20);
    assert.equal(f.v.attachments().historyCount, 20);
  } finally { await f.cleanup(); }
});

test("one MiB text aggregate is accepted but another selected byte cannot partially modify the draft", async () => {
  const f = await selectionFixture("x".repeat(262144), { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } });
  try {
    f.h.api.window.showOpenDialog = async () => [f.uri, f.uri, f.uri, f.uri]; await f.add();
    const before = f.v.attachments().draft; assert.equal(before.attachments.length, 4);
    await f.addSelection(); assert.equal(f.v.attachments().result?.code, "total-too-large"); assert.deepEqual(f.v.attachments().draft, before);
    await f.send("full aggregate"); assert.equal(f.inputs.length, 1);
    const input = f.inputs[0]; assert.equal(input.kind, "enriched");
    if (input.kind === "enriched") assert.equal(input.attachments.reduce((bytes, a) => bytes + Buffer.byteLength(a.text, "utf8"), 0), 1048576);
  } finally { await f.cleanup(); }
});

test("an over-budget or unsafe native batch leaves the prior draft intact rather than adding a prefix", async () => {
  for (const failure of ["bytes", "unsafe", "count"] as const) {
    const f = await fixture("x".repeat(262144));
    try {
      await f.add(); const before = f.v.attachments().draft;
      f.h.api.window.showOpenDialog = async () => failure === "unsafe"
        ? [f.uri, { ...f.uri, fsPath: path.join(f.root, ".env.dummy") }]
        : Array.from({ length: failure === "bytes" ? 4 : 20 }, () => f.uri);
      await f.add();
      assert.deepEqual(f.v.attachments().draft, before); assert.equal(f.inputs.length, 0);
      assert.equal(f.v.attachments().result?.code, failure === "bytes" ? "total-too-large" : failure === "unsafe" ? "sensitive-source" : "attachment-limit");
    } finally { await f.cleanup(); }
  }
});

test("latest whole-file aggregate overflow blocks all writes until removal and each explicit confirmation", async () => {
  const f = await fixture("small");
  try {
    f.h.api.window.showOpenDialog = async () => Array.from({ length: 5 }, () => f.uri); await f.add();
    const original = f.v.attachments().draft.attachments.map(a => a.snapshotId);
    f.change("x".repeat(262144)); await f.send("keep whole request");
    assert.equal(f.v.attachments().result?.code, "total-too-large"); assert.equal(f.inputs.length, 0); assert.equal(f.v.attachments().historyCount, 0);
    assert.deepEqual(f.v.attachments().draft.attachments.map(a => a.snapshotId), original); assert.equal(f.v.attachments().draft.text, "keep whole request");
    const draft = f.v.attachments().draft; f.v.action("removeAttachment", { draftRevision: draft.revision, attachmentId: draft.attachments[4].attachmentId });
    await f.send("keep whole request"); assert.equal(f.v.attachments().draft.attachments.length, 4);
    assert.ok(f.v.attachments().draft.attachments.every(a => a.state === "confirmation-required"));
    for (let index = 0; index < 4; index++) {
      const current = f.v.attachments().draft; const state = f.v.state(); const a = current.attachments[index];
      const idle = f.waitIdle(); f.v.send("confirmFileAttachment", { generation: state.generation, viewId: state.viewId, draftRevision: current.revision, attachmentId: a.attachmentId, snapshotId: a.snapshotId }); await idle;
      assert.equal(f.inputs.length, 0);
    }
    await f.send("keep whole request"); assert.equal(f.inputs.length, 1); assert.equal(f.v.attachments().historyCount, 4);
  } finally { await f.cleanup(); }
});

test("a native batch does not attach an earlier file deleted during a later capture", async () => {
  const f = await fixture("first text");
  try {
    const target = path.join(f.root, "second.ts"); await writeFile(target, "second disk");
    const uri = { ...f.uri, fsPath: target, toString: () => "file://" + target };
    let deleted = false;
    const doc = { ...f.doc, uri, lineAt: () => ({ range: { end: { line: 0, character: 11 } } }), offsetAt: () => 11,
      getText: () => { if (!deleted) { deleted = true; unlinkSync(f.target); } return "second text"; } };
    f.h.api.workspace.textDocuments.push(doc as unknown as vscode.TextDocument);
    f.h.api.window.showOpenDialog = async () => [f.uri, uri]; await f.add();
    assert.equal(f.v.attachments().draft.attachments.length, 0); assert.equal(f.v.attachments().result?.code, "unavailable");
    assert.equal(f.inputs.length, 0);
  } finally { await f.cleanup(); }
});

test("mixed retention charges body once and shares delivery and settlement across every record", async () => {
  const f = await selectionFixture("whole selected text");
  try {
    await f.add(); await f.addSelection(); await f.send("body");
    f.v.action("getAttachmentHistory");
    const entries = (f.v.sent.at(-1) as { entries: { submissionId: string; snapshotId: string; delivery: string; outcome: string }[] }).entries;
    assert.equal(entries.length, 2); assert.equal(new Set(entries.map(e => e.submissionId)).size, 1);
    assert.ok(entries.every(e => e.delivery === "rpc-accepted" && e.outcome === "pending"));
    const firstCharge = f.v.attachments().retainedBytes;
    f.r.settled(); await tick(); f.v.action("getAttachmentHistory");
    assert.ok((f.v.sent.at(-1) as { entries: { outcome: string }[] }).entries.every(e => e.outcome === "settled"));
    assert.equal(f.v.attachments().retainedBytes, firstCharge);
    await f.add(); await f.addSelection(); await f.send("body" + "x".repeat(100));
    assert.equal(f.v.attachments().retainedBytes - firstCharge, firstCharge + 100, "body growth charged once, not per attachment");
  } finally { await f.cleanup(); }
});

test("history count and byte reservation reject a whole batch without retaining or sending its prefix", async () => {
  for (const dimension of ["count", "bytes"] as const) {
    const f = await fixture(dimension === "bytes" ? "x".repeat(262144) : "");
    try {
      const batch = dimension === "bytes" ? 4 : 20; const rounds = dimension === "bytes" ? 7 : 6;
      f.h.api.window.showOpenDialog = async () => Array.from({ length: batch }, () => f.uri);
      for (let i = 0; i < rounds; i++) { await f.add(); await f.send("accepted"); f.r.settled(); await tick(); }
      const before = f.v.attachments(); await f.add(); const pending = f.v.attachments().draft.attachments;
      await f.send("preserve all pending context");
      assert.equal(f.inputs.length, rounds); assert.equal(f.v.attachments().result?.code, "history-full");
      assert.equal(f.v.attachments().historyCount, before.historyCount); assert.equal(f.v.attachments().retainedBytes, before.retainedBytes);
      assert.deepEqual(f.v.attachments().draft.attachments, pending); assert.equal(f.v.attachments().draft.text, "preserve all pending context");
    } finally { await f.cleanup(); }
  }
});

test("cancelling the later document in a native batch never admits its already-captured prefix", async () => {
  for (const cancel of ["stop", "edit", "view", "resources"] as const) {
    const f = await fixture();
    try {
      await f.add(); const before = f.v.attachments().draft.attachments;
      const target = path.join(f.root, "later.ts"); await writeFile(target, "later disk");
      const uri = { ...f.uri, fsPath: target, toString: () => "file://" + target };
      const doc = { ...f.doc, uri } as unknown as vscode.TextDocument;
      let release!: (doc: vscode.TextDocument) => void;
      let loaded!: () => void; const loading = new Promise<void>(resolve => { loaded = resolve; });
      f.h.api.window.showOpenDialog = async () => [f.uri, uri];
      f.h.api.workspace.openTextDocument = () => { loaded(); return new Promise(resolve => { release = resolve; }); };
      f.v.action("addFileAttachment", { draftRevision: f.v.attachments().draft.revision }); await loading;
      if (cancel === "stop") f.v.action("stopChat");
      if (cancel === "edit") f.v.action("updateDraft", { draftRevision: f.v.attachments().draft.revision, editSequence: 1, text: "newer" });
      if (cancel === "view") f.h.createView();
      if (cancel === "resources") f.v.action("chooseResources", { choice: "decline" });
      release(doc); await tick(); const view = f.h.createView();
      assert.deepEqual(view.attachments().draft.attachments, cancel === "resources" ? [] : before, "resource choice replaces runtime and intentionally releases old snapshots"); assert.equal(f.inputs.length, 0); assert.equal(view.attachments().historyCount, 0);
      if (cancel === "edit") assert.equal(view.attachments().draft.text, "newer");
    } finally { await f.cleanup(); }
  }
});

test("unrelated editor events emit no attachment projection while all matching mixed items invalidate together", async () => {
  const f = await selectionFixture();
  try {
    const projections = () => f.v.sent.filter(m => (m as { type: string }).type === "attachmentState").length;
    const unrelated = { ...f.doc, uri: { ...f.uri, fsPath: path.join(f.root, "unrelated.ts") } } as unknown as vscode.TextDocument;
    let before = projections();
    f.h.documentChange.fire({ document: unrelated }); f.h.documentClose.fire(unrelated);
    assert.equal(projections(), before, "empty draft ignores unrelated editor events");
    await f.add(); await f.addSelection(); before = projections();
    f.h.documentChange.fire({ document: unrelated }); f.h.documentClose.fire(unrelated);
    assert.equal(projections(), before, "mixed draft ignores unrelated editor events");
    f.change("different source"); assert.equal(projections(), before + 1);
    assert.ok(f.v.attachments().draft.attachments.every(a => a.state === "changed"));
    before = projections(); f.h.documentClose.fire(f.doc as unknown as vscode.TextDocument); assert.equal(projections(), before + 1);
    assert.ok(f.v.attachments().draft.attachments.every(a => a.state === "unavailable"));
  } finally { await f.cleanup(); }
});

test("long live history survives the chat window and source deletion, restores after view recreation, and ends on runtime loss", async () => {
  const original = "// immutable original\r\n" + "中🐱".repeat(6000);
  const f = await selectionFixture(original);
  try {
    await f.add(); await f.addSelection(); await f.send("earliest attachment submission");
    f.r.events.fire({ kind: "message_final", session: f.r.runtime.getSession(), messageId: "answer-0", text: "earliest answer" }); f.r.settled(); await tick();
    for (let index = 1; index <= 18; index++) {
      await f.send("later task " + index);
      f.r.events.fire({ kind: "message_final", session: f.r.runtime.getSession(), messageId: "answer-" + index, text: "later answer " + index });
      f.r.settled(); await tick();
    }
    assert.equal(f.v.state().messages.length, 32); assert.ok(f.v.state().messages.every(m => !m.text.includes("earliest")));
    f.change("new source is irrelevant to retained text"); await rm(f.target);
    const draft = f.v.attachments().draft;
    f.v.action("updateDraft", { draftRevision: draft.revision, editSequence: draft.acceptedEditSequence + 1, text: "keep this acknowledged draft" });
    const recreated = f.h.createView(); assert.equal(recreated.attachments().draft.text, "keep this acknowledged draft");
    recreated.action("getAttachmentHistory");
    const history = recreated.sent.at(-1) as { entries: { submissionId: string; snapshotId: string; kind: string }[] };
    assert.equal(history.entries.length, 2); assert.equal(history.entries[0].submissionId, history.entries[1].submissionId);
    assert.equal(JSON.stringify(history).includes("immutable original"), false);
    f.h.api.workspace.openTextDocument = async () => { throw new Error("history must not reopen a source"); };
    for (const entry of history.entries) {
      let offset = 0; let text = "";
      for (;;) {
        recreated.action("getAttachmentPreview", { requestId: "restored-" + entry.kind, snapshotId: entry.snapshotId, offset });
        const chunk = recreated.sent.at(-1) as { text: string; nextOffset: number; done: boolean };
        assert.ok(chunk.text.length <= 16384); text += chunk.text; offset = chunk.nextOffset; await tick();
        if (chunk.done) break;
      }
      assert.equal(text, entry.kind === "file" ? original : "// im");
    }
    const oldMessages = f.v.sent.length;
    f.v.action("getAttachmentPreview", { requestId: "old-view", snapshotId: history.entries[0].snapshotId, offset: 0 });
    assert.equal(f.v.sent.length, oldMessages, "superseded view cannot retrieve retained data");
    const before = recreated.sent.length;
    for (let index = 0; index < 10; index++) f.r.events.fire({ kind: "text_delta", session: f.r.runtime.getSession(), messageId: "later-live", delta: "delta" });
    assert.equal(recreated.sent.length - before, 10); assert.ok(recreated.sent.slice(before).every(m => (m as { type: string }).type === "workspaceState"));
    assert.equal(recreated.attachments().draft.text, "keep this acknowledged draft");
    f.r.events.fire({ kind: "runtime_error", session: f.r.runtime.getSession(), detail: "synthetic loss" });
    assert.equal(recreated.attachments().historyCount, 0); assert.equal(recreated.attachments().draft.text, "keep this acknowledged draft");
    recreated.action("getAttachmentHistory"); assert.deepEqual((recreated.sent.at(-1) as { entries: unknown[] }).entries, []);
    recreated.action("getAttachmentPreview", { requestId: "lost", snapshotId: history.entries[0].snapshotId, offset: 0 });
    assert.equal((recreated.sent.at(-1) as { code: string }).code, "stale", "lost runtime invalidates the preview scope before any snapshot lookup");
  } finally { await f.cleanup(); }
});
