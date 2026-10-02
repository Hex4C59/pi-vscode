import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type * as vscode from "vscode";
import { Event, folder, harness, settingsRuntime, tick } from "./harness.js";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "pi-file-discovery-"));
  const target = path.join(root, "main.ts"); await writeFile(target, "synthetic code");
  const r = settingsRuntime(); const h = harness([folder(root)], true, undefined, r.runtime);
  const uri = h.api.Uri.file(target); let reads = 0; let content = "synthetic code";
  let candidates = [uri];
  const document = { uri, isClosed: false, isDirty: false, version: 1, lineCount: 1,
    lineAt: () => ({ range: { end: { line: 0, character: content.length } } }), offsetAt: () => content.length, getText: () => { reads++; return content; } };
  h.api.workspace.textDocuments = [document as unknown as vscode.TextDocument];
  const accepted = new Event<void>(); const hidden = new Event<void>(); const changed = new Event<string>();
  type Item = vscode.QuickPickItem & { uri?: vscode.Uri };
  const picker = { items: [] as readonly Item[], selectedItems: [] as readonly Item[], value: "", title: "", placeholder: "",
    busy: false, matchOnDescription: false, matchOnDetail: false, ignoreFocusOut: false,
    onDidAccept: accepted.subscribe, onDidHide: hidden.subscribe, onDidChangeValue: changed.subscribe,
    show() {}, hide() { hidden.fire(); }, dispose() { accepted.listeners.clear(); hidden.listeners.clear(); changed.listeners.clear(); } };
  let searches = 0;
  Object.assign(h.api.window, { createQuickPick: () => picker });
  Object.assign(h.api.workspace, { findFiles: async (pattern: { base: string }, exclude: unknown, maxResults: number) => {
    searches++; assert.equal(pattern.base, root); assert.equal(exclude, undefined); assert.equal(maxResults, 3001); return candidates;
  } });
  const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick();
  assert.equal(v.state().runtime, "ready"); r.calls.length = 0;
  return { h, v, picker, accepted, hidden, r, root, setCandidates: (next: typeof candidates) => { candidates = next; },
    setContent: (next: string) => { content = next; document.isDirty = true; document.version++; }, reads: () => reads, searches: () => searches,
    async close() { h.provider.dispose(); await rm(root, { recursive: true, force: true }); } };
}
async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 5000;
  while (!predicate()) { if (Date.now() >= deadline) throw new Error("Discovery did not reach expected state"); await new Promise(resolve => setTimeout(resolve, 5)); }
}

// Before implementation: host derives acknowledged token, discovers no bodies,
// inherits whole-file capture, commits token removal atomically and rejects stale work.
test("host @ discovery captures selected file through attachments and preserves surrounding draft", async () => {
  const f = await fixture();
  try {
    f.v.action("updateDraft", { text: "inspect @main now", draftRevision: f.v.attachments().draft.revision, editSequence: 1 });
    f.v.action("completeFileReference", { draftRevision: f.v.attachments().draft.revision, caret: 13 });
    await waitFor(() => f.picker.items.length > 0);
    assert.equal(f.picker.value, "main"); assert.equal(f.reads(), 0); assert.equal(f.searches(), 1);
    f.picker.selectedItems = [f.picker.items[0]!]; f.accepted.fire();
    await waitFor(() => f.v.attachments().draft.attachments.length === 1);
    assert.equal(f.v.attachments().draft.text, "inspect  now");
    assert.equal(f.v.attachments().draft.attachments[0]?.kind, "file");
    assert.equal(f.r.calls.includes("prompt"), false); assert.ok(f.reads() > 0);
    assert.equal(f.accepted.listeners.size, 0);
  } finally { await f.close(); }
});

test("host cancelled or edited discovery never removes token or appends a partial attachment", async () => {
  const f = await fixture();
  try {
    f.v.action("updateDraft", { text: "@main", draftRevision: f.v.attachments().draft.revision, editSequence: 1 });
    f.v.action("completeFileReference", { draftRevision: f.v.attachments().draft.revision, caret: 5 });
    await waitFor(() => f.picker.items.length > 0); f.hidden.fire(); await tick();
    assert.equal(f.v.attachments().draft.text, "@main"); assert.equal(f.v.attachments().draft.attachments.length, 0);
    f.v.action("completeFileReference", { draftRevision: f.v.attachments().draft.revision, caret: 5 }); await tick();
    f.v.action("updateDraft", { text: "new edit", draftRevision: f.v.attachments().draft.revision, editSequence: 2 });
    f.picker.selectedItems = [f.picker.items[0]!]; f.accepted.fire(); await tick();
    assert.equal(f.v.attachments().draft.text, "new edit"); assert.equal(f.v.attachments().draft.attachments.length, 0);
    assert.equal(f.reads(), 0); assert.equal(f.r.calls.includes("prompt"), false);
  } finally { await f.close(); }
});


test("host discovery omits unsafe names and discloses a bounded incomplete list before reading content", async () => {
  const f = await fixture();
  try {
    const unsafe = [f.h.api.Uri.file(path.join(f.root, ".env")), f.h.api.Uri.file(path.join(f.root, "..", "outside.ts"))];
    f.setCandidates([...unsafe, f.h.api.Uri.file(path.join(f.root, "main.ts"))]);
    f.v.action("updateDraft", { text: "@main", draftRevision: f.v.attachments().draft.revision, editSequence: 1 });
    f.v.action("completeFileReference", { draftRevision: f.v.attachments().draft.revision, caret: 5 });
    await waitFor(() => f.picker.items.length > 0);
    assert.equal(f.picker.items.length, 1); assert.doesNotMatch(JSON.stringify(f.picker.items), /\.env|outside/);
    f.hidden.fire(); await tick();
    f.setCandidates(Array.from({ length: 3001 }, (_, i) => f.h.api.Uri.file(path.join(f.root, `synthetic-${i}.ts`))));
    f.v.action("completeFileReference", { draftRevision: f.v.attachments().draft.revision, caret: 5 });
    await waitFor(() => f.picker.items.length >= 3000);
    assert.equal(f.picker.items.length, 3000); assert.match(f.picker.title + f.picker.placeholder, /3000|limited|truncat/i);
    assert.equal(f.reads(), 0); f.hidden.fire(); await tick();
    assert.equal(f.v.attachments().draft.text, "@main");
  } finally { await f.close(); }
});

test("selected sensitive content is rejected by inherited attachment capture without consuming the query", async () => {
  const f = await fixture();
  try {
    f.setContent("-----BEGIN PRIVATE KEY-----\nSYNTHETIC_TEST_ONLY\n-----END PRIVATE KEY-----");
    f.v.action("updateDraft", { text: "@main", draftRevision: f.v.attachments().draft.revision, editSequence: 1 });
    f.v.action("completeFileReference", { draftRevision: f.v.attachments().draft.revision, caret: 5 });
    await waitFor(() => f.picker.items.length > 0); assert.equal(f.reads(), 0);
    f.picker.selectedItems = [f.picker.items[0]!]; f.accepted.fire();
    await waitFor(() => f.v.attachments().result?.code === "sensitive-source");
    assert.equal(f.v.attachments().draft.attachments.length, 0); assert.equal(f.v.attachments().draft.text, "@main");
    assert.equal(f.r.calls.includes("prompt"), false);
  } finally { await f.close(); }
});
