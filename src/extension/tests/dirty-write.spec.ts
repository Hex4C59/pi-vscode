import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, writeFile, rm, mkdir, symlink, link } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import type * as vscode from "vscode";
import type { GateCall } from "../approvalProtocol.js";
import { folder, harness, settingsRuntime, tick } from "./harness.js";

const writeCall = (cwd: string, request: string, target = "file.ts"): GateCall => ({ cwd, runtime: "fixture", request, toolCallId: request, tool: "write", input: { path: target, content: "tool text" } });
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "pi-dirty-write-"));
  await writeFile(path.join(root, "file.ts"), "disk text");
  const r = settingsRuntime();
  let handler: ((call: GateCall) => Promise<boolean>) | undefined;
  r.runtime.setApprovalHandler = value => { handler = value; };
  const h = harness([folder(root)], true, undefined, r.runtime);
  const v = h.createView();
  v.action("chooseResources", { choice: "decline" }); await tick();
  v.action("sendChat", { text: "Write the fixture" }); await tick();
  let saves = 0;
  const document = { uri: { scheme: "file", fsPath: path.join(root, "file.ts") }, isDirty: true, isClosed: false,
    getText: () => "unsaved editor text", save: async () => { saves++; return true; } };
  h.api.workspace.textDocuments = [document as unknown as vscode.TextDocument];
  return { root, r, h, v, document, saves: () => saves,
    request: (id: string, target?: string, tool = "write") => { assert.ok(handler); return handler({ ...writeCall(root, id, target), tool }); },
    async cleanup() { h.provider.dispose(); await rm(root, { recursive: true, force: true }); } };
}

test("covered write is denied before approval when its editor is dirty, without saving or changing either copy", { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    const pending = f.request("dirty");
    assert.deepEqual(await approvalOrSettlement(f, "dirty", pending), { kind: "settled", allowed: false });
    assert.equal(f.v.state().approvals.length, 0);
    assert.match(f.v.state().chatError ?? "", /unsaved editor changes/i);
    assert.equal(await readFile(path.join(f.root, "file.ts"), "utf8"), "disk text");
    assert.equal(f.document.getText(), "unsaved editor text"); assert.equal(f.saves(), 0);
  } finally { await f.cleanup(); }
});

type Observation = { kind: "offered" } | { kind: "settled"; allowed: boolean };
async function approvalOrSettlement(f: Awaited<ReturnType<typeof fixture>>, id: string, pending: Promise<boolean>): Promise<Observation> {
  let release: (() => void) | undefined;
  const offered = new Promise<Observation>(resolve => {
    const subscription = f.v.posted.subscribe(message => {
      const value = message as { approvals?: { id: string }[] };
      if (value.approvals?.some(card => card.id === id)) resolve({ kind: "offered" });
    });
    release = () => subscription.dispose();
    f.v.state(); // Observe a card that was already projected before subscription.
  });
  try { return await Promise.race([offered, pending.then(allowed => ({ kind: "settled" as const, allowed }))]); }
  finally { release?.(); }
}
async function waitForApproval(f: Awaited<ReturnType<typeof fixture>>, id: string, pending: Promise<boolean>): Promise<void> {
  assert.deepEqual(await approvalOrSettlement(f, id, pending), { kind: "offered" });
}

for (const decision of ["once", "session"] as const) test(`editing while ${decision} approval waits prevents execution and does not create a grant`, { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    f.document.isDirty = false;
    const result = f.request("waiting"); await waitForApproval(f, "waiting", result);
    f.document.isDirty = true;
    f.v.action("decideApproval", { id: "waiting", decision });
    assert.equal(await result, false);
    assert.equal(f.v.state().grants.length, 0);
    assert.match(f.v.state().chatError ?? "", /unsaved editor changes/i);
    assert.equal(f.saves(), 0);
  } finally { await f.cleanup(); }
});


test("write/edit protection follows canonical junction aliases and does not block unrelated dirty documents", { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    await mkdir(path.join(f.root, "real")); await writeFile(path.join(f.root, "real", "target.ts"), "real disk");
    await symlink(path.join(f.root, "real"), path.join(f.root, "alias"), "junction");
    f.document.uri.fsPath = path.join(f.root, "real", "target.ts");
    const rejected = f.request("alias", "alias/target.ts", "edit");
    assert.equal(await finishOffered(f, "alias", rejected), false);
    const clean = f.request("unrelated", "file.ts"); await waitForApproval(f, "unrelated", clean);
    f.v.action("decideApproval", { id: "unrelated", decision: "once" });
    assert.equal(await clean, true);
  } finally { await f.cleanup(); }
});

async function finishOffered(f: Awaited<ReturnType<typeof fixture>>, id: string, pending: Promise<boolean>): Promise<boolean> {
  if ((await approvalOrSettlement(f, id, pending)).kind === "offered") f.v.action("decideApproval", { id, decision: "once" });
  return pending;
}

test("write targets use the declared pi path spellings, including @, home, file URL and Unicode spaces", { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    const file = path.join(f.root, "space file.ts"); await writeFile(file, "safe"); f.document.uri.fsPath = file;
    const names = ["@space file.ts", "space\u00a0file.ts", pathToFileURL(file).href];
    if (process.platform === "win32") {
      const unix = file.replaceAll("\\", "/"); const drive = unix[0].toLowerCase(); const tail = unix.slice(3);
      names.push("/" + drive + "/" + tail, "/mnt/" + drive + "/" + tail, "/cygdrive/" + drive + "/" + tail, file.toUpperCase());
    }
    for (let i = 0; i < names.length; i++) {
      const id = "spelling-" + i;
      assert.equal(await finishOffered(f, id, f.request(id, names[i])), false, names[i]);
    }
    // A virtual unsaved document: no file is read or created in the actual home.
    const homeName = path.basename(f.root) + ".ts";
    f.document.uri.fsPath = path.join(homedir(), homeName);
    assert.equal(await finishOffered(f, "home", f.request("home", "~/" + homeName)), false);
  } finally { await f.cleanup(); }
});


test("new files through a junction and existing hard-link aliases protect the same dirty document", { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    await mkdir(path.join(f.root, "real")); await symlink(path.join(f.root, "real"), path.join(f.root, "alias"), "junction");
    f.document.uri.fsPath = path.join(f.root, "real", "new.ts");
    assert.equal(await finishOffered(f, "new", f.request("new", "alias/new.ts")), false);
    await link(path.join(f.root, "file.ts"), path.join(f.root, "hard.ts"));
    f.document.uri.fsPath = path.join(f.root, "hard.ts");
    assert.equal(await finishOffered(f, "hard", f.request("hard", "file.ts")), false);
  } finally { await f.cleanup(); }
});

test("a newly opened dirty document during target resolution is included before approval", { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    let reads = 0;
    Object.defineProperty(f.h.api.workspace, "textDocuments", { get: () => ++reads === 1 ? [] : [f.document] });
    assert.equal(await finishOffered(f, "opened", f.request("opened")), false);
    assert.equal(f.v.sent.some(message => { const value = message as { approvals?: unknown[] }; return !!value.approvals?.length; }), false, "No approval may be offered for the newly dirty target");
  } finally { await f.cleanup(); }
});


test("session grants never bypass dirty checks; clean recovery is explicit and read remains allowed", { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    f.document.isDirty = false;
    const initial = f.request("grant"); await waitForApproval(f, "grant", initial); f.v.action("decideApproval", { id: "grant", decision: "session" });
    assert.equal(await initial, true); assert.equal(f.v.state().grants.length, 1);
    f.document.isDirty = true;
    assert.equal(await f.request("blocked-reuse"), false); assert.equal(f.v.state().grants.length, 1);
    assert.equal(await f.request("read-dirty", "file.ts", "read"), true);
    f.document.isDirty = false;
    assert.equal(await f.request("explicit-retry"), true); assert.equal(f.saves(), 0);
  } finally { await f.cleanup(); }
});

test("Stop and workspace replacement invalidate pending approvals and their late replies", { timeout: 5000 }, async () => {
  for (const action of ["stop", "replace"] as const) {
    const f = await fixture();
    try {
      f.document.isDirty = false;
      f.r.runtime.abortTask = async () => { f.r.settled(); return { ok: true }; };
      const pending = f.request("old"); await waitForApproval(f, "old", pending);
      if (action === "stop") f.v.action("stopChat");
      else { f.h.api.workspace.workspaceFolders = [folder(path.join(f.root, "other"))]; f.h.change.fire(); }
      f.v.action("decideApproval", { id: "old", decision: "session" });
      assert.equal(await pending, false); assert.equal(f.v.state().grants.length, 0); assert.equal(f.saves(), 0);
    } finally { await f.cleanup(); }
  }
});


test("a replacement sidebar retains pending approval but its dirty check uses the current editor", { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    f.document.isDirty = false;
    const pending = f.request("view-replacement"); await waitForApproval(f, "view-replacement", pending);
    const oldViewId = f.v.state().viewId;
    f.v.dispose.fire(); const replacement = f.h.createView();
    assert.notEqual(replacement.state().viewId, oldViewId);
    assert.equal(replacement.state().approvals.length, 1);
    f.document.isDirty = true;
    replacement.action("decideApproval", { id: "view-replacement", decision: "once" });
    assert.equal(await pending, false);
    assert.match(replacement.state().chatError ?? "", /unsaved editor changes/i);
    assert.equal(replacement.state().grants.length, 0); assert.equal(f.saves(), 0);
  } finally { await f.cleanup(); }
});
