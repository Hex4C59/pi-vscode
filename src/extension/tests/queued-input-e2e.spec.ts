import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type * as vscode from "vscode";
import { folder, harness, settingsRuntime, tick } from "./harness.js";
import { parseHostMessage } from "../../webview/client/parse-host-message.js";
import type { QueuedTextStateMessage } from "../contracts/index.js";
import { expandQueuedCommand } from "../../adapter/runtime/rpc/queued-input-expansion.js";
import { encodeQueuedMessage } from "../../adapter/runtime/rpc/jsonl.js";

// Build the real helper from source even when npm test runs in a fresh checkout.
const workerPath = path.resolve("dist", `queued-input-test-${randomUUID()}.mjs`);
test.before(() => {
  const options = { entryPoints: [path.resolve("src/adapter/runtime/rpc/queued-input-worker.ts")], bundle: true,
    platform: "node", format: "esm", target: "node22", external: ["@earendil-works/pi-coding-agent"], outfile: workerPath };
  const built = spawnSync(process.execPath, ["--input-type=module", "-e", `import {build} from 'esbuild'; await build(${JSON.stringify(options)});`],
    { windowsHide: true, timeout: 20000, encoding: "utf8" });
  assert.equal(built.status, 0, built.stderr);
});
test.after(() => rm(workerPath, { force: true }));

// E2E failure scenarios BEFORE production changes: whole-file/selection admission
// while busy; native template expansion drops attachments; skill args; invalid
// commands; changed/oversized resources; newer draft or generation after await;
// retained original vs transformed text; Stop/recall races; rejected/unknown ACK;
// empty-draft recovery; duplicate payloads; no implicit retry or source reread.
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "wi091-e2e-"));
  const target = path.join(root, "context.ts"); await writeFile(target, "saved file");
  const template = path.join(root, "review.md"); await writeFile(template, "Review $1 only");
  const skill = path.join(root, "SKILL.md"); await writeFile(skill, "---\nname: inspect\ndescription: inspect code\n---\nInspect selected context");
  const uri = { scheme: "file", authority: "", query: "", fragment: "", fsPath: target, toString: () => `file://${target}` };
  const doc = { uri, version: 1, isDirty: true, isClosed: false, lineCount: 1,
    lineAt: () => ({ range: { end: { line: 0, character: 16 } } }), offsetAt: (p: { character: number }) => p.character,
    getText: (range?: { start: { character: number }; end: { character: number } }) => range ? "unsaved snapshot".slice(range.start.character, range.end.character) : "unsaved snapshot" };
  const r = settingsRuntime(); const writes: { text: string; mode: string }[] = [];
  let delivery: "rpc-accepted" | "rpc-rejected" | "unknown" = "rpc-accepted";
  let queued = { steering: [] as string[], followUp: [] as string[] };
  r.runtime.encodeQueuedInput = async input => {
    let body = input.body;
    if (body.startsWith("/")) {
      const name = body.slice(1).split(/\s/)[0];
      if (name !== "review" && name !== "skill:inspect") return { ok: false, code: "command-not-queueable" };
      const result = await expandQueuedCommand(workerPath, { body, name,
        source: name === "review" ? "prompt" : "skill", path: name === "review" ? template : skill });
      if (!result.ok) return result;
      body = result.text;
    }
    return { ok: true, text: encodeQueuedMessage(input, body) };
  };
  r.runtime.prepareQueuedText = (text, mode) => ({ async send(attempt) {
    writes.push({ text, mode }); attempt();
    if (delivery === "rpc-accepted") {
      queued[mode === "steering" ? "steering" : "followUp"].push(text);
      r.events.fire({ kind: "queue_updated", session: r.runtime.getSession(), ...queued });
    }
    return { delivery };
  } });
  const clear = (onClear: (s: typeof queued) => void) => { onClear(queued); queued = { steering: [], followUp: [] }; return { ok: true as const }; };
  r.runtime.recallQueuedText = async (_session, onClear) => clear(onClear);
  r.runtime.abortTask = async onClear => onClear ? clear(onClear) : { ok: true };
  const h = harness([folder(root)], true, undefined, r.runtime);
  h.api.workspace.textDocuments = [doc as unknown as vscode.TextDocument];
  h.api.window.showOpenDialog = async () => [uri];
  const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick();
  v.action("updateDraft", { draftRevision: v.attachments().draft.revision, editSequence: 1, text: "initial task" });
  v.action("sendChat", { draftRevision: v.attachments().draft.revision }); await tick();
  assert.equal(v.state().chatBusy, true);
  const queue = (): QueuedTextStateMessage => {
    const s = v.sent.map(parseHostMessage).filter(m => m?.type === "queuedTextState").at(-1);
    assert.ok(s && s.type === "queuedTextState"); return s;
  };
  const edit = (text: string) => v.action("updateDraft", { draftRevision: v.attachments().draft.revision,
    editSequence: v.attachments().draft.acceptedEditSequence + 1, text });
  const wait = async (done: () => boolean) => { for (let n = 0; n < 3000 && !done(); n++) await tick(); assert.ok(done(), "operation settled"); };
  const send = async (mode: "steering" | "follow-up") => {
    v.action("queueChat", { draftRevision: v.attachments().draft.revision, mode });
    await wait(() => queue().phase === "idle");
  };
  const add = async (selection = false) => {
    if (selection) Object.assign(h.api.window, { activeTextEditor: { document: doc,
      selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 7 }, isEmpty: false },
      selections: [{ start: { line: 0, character: 0 }, end: { line: 0, character: 7 }, isEmpty: false }] } });
    v.action(selection ? "addSelectionAttachment" : "addFileAttachment", { draftRevision: v.attachments().draft.revision });
    await wait(() => v.attachments().preparation === "idle");
    assert.equal(v.attachments().draft.attachments.length, 1);
  };
  return { root, template, skill, r, h, v, writes, queue, edit, send, add, wait,
    setDelivery(value: typeof delivery) { delivery = value; },
    async close() { h.provider.dispose(); await rm(root, { recursive: true, force: true }); } };
}

for (const mode of ["steering", "follow-up"] as const) for (const command of ["plain task", "/review alpha", "/skill:inspect alpha"]) {
  test(`queue E2E: ${mode} ${command} retains and explicitly restores native attachment snapshots`, async () => {
    const f = await fixture();
    try {
      await f.add(mode === "follow-up"); f.edit(command); await f.send(mode);
      assert.equal(f.writes.length, 1); const pending = f.queue().pending[mode === "steering" ? "steering" : "followUp"][0]; assert.ok(pending.reusable); assert.equal(pending.attachmentCount, 1); const wire = f.writes[0].text;
      assert.ok(wire.includes(mode === "follow-up" ? "unsaved" : "unsaved snapshot"));
      if (command.startsWith("/review")) { assert.ok(wire.includes("Review alpha only")); assert.ok(!wire.includes('"body":"/review')); }
      if (command.startsWith("/skill")) assert.ok(wire.includes("Inspect selected context"));
      assert.equal(f.v.attachments().draft.text, ""); assert.equal(f.v.attachments().draft.attachments.length, 0);
      f.v.action("recallQueuedText", { queueRevision: f.queue().revision }); await f.wait(() => f.queue().phase === "idle");
      const recovered = f.queue().recovery.find(r => r.status === "recalled"); assert.ok(recovered && recovered.status !== "unavailable"); assert.equal(recovered.attachmentCount, 1);
      f.edit("newer draft"); f.v.action("useRecoveredText", { id: recovered.id, draftRevision: f.v.attachments().draft.revision }); await tick();
      assert.equal(f.v.attachments().draft.text, "newer draft"); assert.equal(f.queue().recovery.length, 1);
      f.edit(""); f.v.action("useRecoveredText", { id: recovered.id, draftRevision: f.v.attachments().draft.revision }); await tick();
      assert.equal(f.v.attachments().draft.text, command); assert.equal(f.v.attachments().draft.attachments.length, 1);
      assert.equal(f.queue().recovery.length, 0); assert.equal(f.writes.length, 1);
      await mkdir("dist/wi091-e2e", { recursive: true });
      await writeFile(`dist/wi091-e2e/${mode}-${command.startsWith("/skill") ? "skill" : command.startsWith("/") ? "template" : "plain"}.json`, JSON.stringify({ passed: true, mode, command, writes: 1, snapshotRestored: true, evidence: "provider/native-draft/public-SDK composition; not VS Code UI or real-model" }));
    } finally { await f.close(); }
  });
}

test("queue E2E: nonqueueable command preserves draft/attachments with zero writes", async () => {
  const f = await fixture(); try {
    await f.add(); f.edit("/login provider"); await f.send("steering");
    assert.equal(f.writes.length, 0); assert.equal(f.v.attachments().draft.text, "/login provider");
    assert.equal(f.v.attachments().draft.attachments.length, 1); assert.equal(f.queue().error, "command-not-queueable");
  } finally { await f.close(); }
});

for (const delivery of ["rpc-rejected", "unknown"] as const) test(`queue E2E: ${delivery} retains original without automatic replay`, async () => {
  const f = await fixture(); try {
    f.setDelivery(delivery); await f.add(); f.edit("/review retained"); await f.send("follow-up");
    assert.equal(f.writes.length, 1); assert.ok(f.queue().recovery.length > 0);
    await tick(); assert.equal(f.writes.length, 1);
    assert.equal(f.queue().recovery[0].status, delivery === "unknown" ? "uncertain" : "recalled");
  } finally { await f.close(); }
});

test("queue E2E: source change and oversized expansion refuse atomically", async () => {
  const f = await fixture(); try {
    f.edit("/review alpha"); await writeFile(f.template, "x".repeat(300000)); await f.send("steering");
    assert.equal(f.writes.length, 0); assert.equal(f.v.attachments().draft.text, "/review alpha");
    assert.equal(f.queue().error, "capacity");
    await writeFile(f.template, "Review $1"); await f.add(); f.h.documentChange.fire({ document: f.h.api.workspace.textDocuments[0] });
    await f.send("steering"); assert.equal(f.writes.length, 0); assert.equal(f.queue().error, "source-changed");
  } finally { await f.close(); }
});

test("queue E2E: Stop overtakes pending expansion and late result never writes", async () => {
  const f = await fixture(); try {
    let finish!: (value: { ok: true; text: string }) => void;
    let entered = false;
    f.r.runtime.encodeQueuedInput = async () => { entered = true; return new Promise(resolve => { finish = resolve; }); };
    f.edit("/review pending"); f.v.action("queueChat", { draftRevision: f.v.attachments().draft.revision, mode: "steering" });
    await f.wait(() => entered); f.v.action("stopChat"); await tick();
    finish({ ok: true, text: "late expanded text" }); await f.wait(() => f.queue().phase === "idle");
    assert.equal(f.writes.length, 0); assert.equal(f.v.state().execution, "stopped");
    assert.equal(f.v.attachments().draft.text, "/review pending");
  } finally { await f.close(); }
});

test("queue E2E: actual runtime-loss event keeps one uncertain original and permits explicit recovery", async () => {
  const f = await fixture(); try {
    const prepare = f.r.runtime.prepareQueuedText!;
    f.r.runtime.prepareQueuedText = (...args) => {
      const token = prepare(...args); return { async send(attempt) {
        const result = await token.send(attempt);
        f.r.events.fire({ kind: "runtime_error", session: f.r.runtime.getSession(), detail: "fixture disconnected" });
        return result;
      } };
    };
    f.setDelivery("unknown"); await f.add(); f.edit("/review uncertain"); await f.send("steering");
    assert.equal(f.v.state().runtime, "error"); assert.equal(f.queue().recovery.length, 1);
    const entry = f.queue().recovery[0]; assert.equal(entry.status, "uncertain");
    f.v.action("useRecoveredText", { id: entry.id, draftRevision: f.v.attachments().draft.revision }); await tick();
    assert.equal(f.v.attachments().draft.text, "/review uncertain");
    assert.equal(f.v.attachments().draft.attachments.length, 1); assert.equal(f.writes.length, 1);
  } finally { await f.close(); }
});

test("queue E2E: disconnect preserves newer unsent text/context alongside uncertain original", async () => {
  const f = await fixture(); try {
    const prepare = f.r.runtime.prepareQueuedText!;
    f.r.runtime.prepareQueuedText = (...args) => {
      const token = prepare(...args); return { async send(attempt) {
        const result = await token.send(attempt);
        f.edit("newer unsent draft"); await f.add();
        f.r.events.fire({ kind: "runtime_error", session: f.r.runtime.getSession(), detail: "fixture disconnected" });
        return result;
      } };
    };
    f.setDelivery("unknown"); await f.add(); f.edit("original queued draft"); await f.send("steering");
    assert.equal(f.v.attachments().draft.text, "newer unsent draft");
    assert.equal(f.v.attachments().draft.attachments.length, 1);
    assert.equal(f.queue().recovery.length, 1); assert.equal(f.queue().recovery[0].status, "uncertain");
    f.v.action("useRecoveredText", { id: f.queue().recovery[0].id, draftRevision: f.v.attachments().draft.revision }); await tick();
    assert.equal(f.v.attachments().draft.text, "newer unsent draft"); assert.equal(f.queue().recovery.length, 1);
    assert.equal(f.writes.length, 1);
  } finally { await f.close(); }
});
