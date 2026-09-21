import assert from "node:assert/strict";
import { test } from "node:test";
import type { WorkspaceStateMessage } from "../webviewMessages.js";
import { folder, harness, tick } from "./harness.js";

test("eligibility matrix blocks every action except native recovery for its state", async () => {
  for (const [folders, trusted, remote, expected] of [
    [[], true, undefined, "no-folder"], [[folder(), folder("/other")], true, undefined, "multi-root"],
    [[folder()], true, "ssh-remote", "remote"], [[folder("/virtual", "memfs")], true, undefined, "non-file"],
    [[folder()], false, undefined, "untrusted"], [[folder()], true, undefined, "eligible"],
    [[], true, "ssh-remote", "remote"],
  ] as const) {
    const h = harness([...folders], trusted, remote);
    const v = h.createView();
    assert.equal(v.state().status, expected);
    v.action("chooseResources", { choice: "allow" });
    assert.equal(v.state().choice, expected === "eligible" ? "allow" : null);
    v.action("openFolder"); await tick();
    v.action("manageTrust"); await tick();
    assert.equal(h.picks, expected === "no-folder" ? 1 : 0);
    assert.deepEqual(h.commands, expected === "untrusted" ? [["workbench.trust.manage"]] : []);
    await tick();
    await tick();
    assert.equal(v.state().runtime, expected === "eligible" ? "ready" : "not-started");
    h.provider.dispose();
  }
});

test("choices survive view rebuild, reset on identity or eligibility changes and reject stale pages", () => {
  const h = harness(); const first = h.createView();
  first.action("chooseResources", { choice: "allow" });
  const generation = first.state().generation;
  first.dispose.fire();
  const v = h.createView();
  assert.equal(v.state().choice, "allow");
  v.action("chooseResources", { choice: "decline" });
  assert.equal(v.state().choice, "decline");
  first.send("chooseResources", { generation, choice: "allow" });
  assert.equal(v.state().choice, "decline");
  h.api.workspace.workspaceFolders = [folder("/new")]; h.change.fire();
  assert.equal(v.state().choice, null);
  v.send("chooseResources", { generation, choice: "allow" });
  assert.equal(v.state().choice, null);
  v.action("chooseResources", { choice: "allow" });
  h.api.workspace.isTrusted = false; // rechecked even without an event
  v.send("chooseResources", { generation: v.state().generation, choice: "allow" });
  assert.equal(v.state().choice, null);
  h.api.workspace.isTrusted = true; h.trust.fire();
  assert.equal(v.state().choice, null);
  v.action("chooseResources", { choice: "allow" });
  h.api.env.remoteName = "ssh-remote";
  assert.equal(v.state().status, "remote"); assert.equal(v.state().choice, null);
  h.provider.dispose();
  const fresh = harness(); assert.equal(fresh.createView().state().choice, null); fresh.provider.dispose();
});

test("actions recheck host eligibility without trusting a prior state message", () => {
  for (const change of ["trust", "remote", "folder"]) {
    const h = harness(); const v = h.createView();
    const generation = v.state().generation;
    v.send("chooseResources", { generation, choice: "allow" });
    if (change === "trust") h.api.workspace.isTrusted = false;
    if (change === "remote") h.api.env.remoteName = "ssh-remote";
    if (change === "folder") h.api.workspace.workspaceFolders = [folder("/switched")];
    v.send("chooseResources", { generation, choice: "decline" });
    assert.equal((v.sent.at(-1) as WorkspaceStateMessage).choice, null);
    assert.ok((v.sent.at(-1) as WorkspaceStateMessage).generation > generation);
    assert.deepEqual(h.commands, []);
    h.provider.dispose();
  }
});

test("malformed provider messages perform no action or state mutation", () => {
  const h = harness(); const v = h.createView();
  const before = v.state(); const count = v.sent.length;
  for (const message of [null, [], { version: 2, type: "openFolder", generation: before.generation },
    { version: 1, type: "chooseResources", generation: before.generation, choice: "allow", path: "/evil" },
    { version: 1, type: "executeCommand", command: "evil" }]) v.receive.fire(message);
  assert.equal(v.sent.length, count);
  assert.deepEqual(v.state(), before); assert.deepEqual(h.commands, []); assert.equal(h.picks, 0);
  h.provider.dispose();
});

test("native picker cancel, success and bounded failures are recoverable", async () => {
  const h = harness([]); const v = h.createView();
  v.action("openFolder"); await tick();
  assert.equal(v.state().error, null); assert.equal(v.state().busy, false); assert.deepEqual(h.commands, []);
  h.api.window.showOpenDialog = async () => { throw new Error("SECRET " + "x".repeat(10000)); };
  v.action("openFolder"); await tick();
  assert.match(v.state().error ?? "", /Try Open folder again/);
  assert.ok((v.state().error?.length ?? 0) < 100);
  assert.doesNotMatch(JSON.stringify(v.sent), /SECRET/);
  h.api.window.showOpenDialog = async () => [folder("/chosen").uri];
  h.api.workspace.updateWorkspaceFolders = () => { throw new Error("SECRET"); };
  v.action("openFolder"); await tick(); assert.match(v.state().error ?? "", /File > Open Folder/);
  h.api.workspace.updateWorkspaceFolders = () => false;
  v.action("openFolder"); await tick(); assert.ok(v.state().error); assert.equal(v.state().busy, false);
  assert.equal(v.state().status, "no-folder"); assert.equal(v.state().folder, null);
  h.api.workspace.updateWorkspaceFolders = (...args) => { h.updates.push(args); return true; };
  v.action("openFolder"); await tick();
  assert.equal(v.state().error, null);
  assert.equal(h.updates.length, 1);
  assert.deepEqual(h.updates[0]?.slice(0, 2), [0, 0]);
  assert.equal((h.updates[0]?.[2] as { uri: { fsPath: string } }).uri.fsPath, "/chosen");
  assert.deepEqual(h.commands, []);
  assert.equal(v.state().status, "no-folder"); assert.equal(v.state().folder, null);
  assert.equal(v.state().busy, true);
  v.action("openFolder"); await tick(); assert.equal(h.updates.length, 1);
  h.api.workspace.workspaceFolders = [folder("/chosen")]; h.change.fire();
  assert.equal(v.state().status, "eligible"); assert.equal(v.state().busy, false);
  h.provider.dispose();
});

test("accepted folder update stays serialized across view rebuild; restarted host reads actual folder", async () => {
  const h = harness([]); const v = h.createView();
  h.api.window.showOpenDialog = async () => [folder("/chosen").uri];
  v.action("openFolder"); await tick();
  const rebuilt = h.createView(); rebuilt.action("openFolder"); await tick();
  assert.equal(h.updates.length, 1); assert.equal(rebuilt.state().busy, true);
  h.provider.dispose();
  const restarted = harness([folder("/chosen")]); const fresh = restarted.createView();
  assert.equal(fresh.state().folder?.path, "/chosen"); assert.equal(fresh.state().status, "eligible");
  assert.equal(fresh.state().choice, null); assert.equal(fresh.state().busy, false);
  restarted.provider.dispose();
});

test("picker rejects non-file and non-single results without changing workspace", async () => {
  for (const selected of [[], [folder("/virtual", "memfs").uri], [folder().uri, folder("/other").uri]]) {
    const h = harness([]); const v = h.createView();
    h.api.window.showOpenDialog = async () => selected;
    v.action("openFolder"); await tick();
    assert.deepEqual(h.updates, []); assert.equal(v.state().status, "no-folder");
    assert.equal(v.state().busy, false); h.provider.dispose();
  }
});

test("trust command failure can retry; trust grant recomputes eligibility", async () => {
  const h = harness([folder()], false); const v = h.createView();
  h.api.commands.executeCommand = async () => { throw new Error("secret"); };
  v.action("manageTrust"); await tick(); assert.match(v.state().error ?? "", /Try Manage workspace trust again/);
  h.api.commands.executeCommand = async () => { h.api.workspace.isTrusted = true; h.trust.fire(); };
  v.action("manageTrust"); await tick();
  assert.equal(v.state().status, "eligible"); assert.equal(v.state().choice, null); assert.equal(v.state().error, null);
  h.provider.dispose();
});

test("late picker completion is ignored after changes, replacement and disposal; listeners cleaned", async () => {
  for (const invalidate of ["workspace", "silent-workspace", "remote", "trust", "replace", "view", "provider"]) {
    const h = harness([]); const v = h.createView();
    let finish!: (value: ReturnType<typeof folder>["uri"][]) => void;
    h.api.window.showOpenDialog = () => new Promise((resolve) => { finish = resolve; });
    v.action("openFolder");
    if (invalidate === "workspace") { h.api.workspace.workspaceFolders = [folder("/new")]; h.change.fire(); }
    if (invalidate === "silent-workspace") h.api.workspace.workspaceFolders = [folder("/new")];
    if (invalidate === "remote") h.api.env.remoteName = "ssh-remote";
    if (invalidate === "trust") h.api.workspace.isTrusted = false;
    if (invalidate === "replace") h.createView();
    if (invalidate === "view") v.dispose.fire();
    if (invalidate === "provider") h.provider.dispose();
    finish([folder("/late").uri]); await tick();
    assert.deepEqual(h.commands, []); assert.deepEqual(h.updates, []);
    h.provider.dispose(); h.provider.dispose();
    assert.equal(h.change.listeners.size, 0); assert.equal(h.trust.listeners.size, 0);
    assert.equal(v.receive.listeners.size, 0); assert.equal(v.dispose.listeners.size, 0);
  }
});

test("pending native operations serialize, tolerate posting failures and late rejection", async () => {
  const h = harness([]); const v = h.createView();
  let reject!: (reason: Error) => void;
  let calls = 0;
  h.api.window.showOpenDialog = () => { calls++; return new Promise((_resolve, fail) => { reject = fail; }); };
  v.action("openFolder"); v.action("openFolder"); assert.equal(calls, 1);
  v.view.webview.postMessage = () => Promise.reject(new Error("unloaded"));
  v.send("getWorkspaceState"); await tick();
  h.provider.dispose(); reject(new Error("late secret")); await tick();
  assert.deepEqual(h.commands, []);
});
