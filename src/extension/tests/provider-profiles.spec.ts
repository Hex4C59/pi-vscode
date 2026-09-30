import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import type { PiRuntimeLifecycle, ExecutionProfileProjection } from "../contracts/index.js";
import { folder, harness, settingsRuntime, tick } from "./harness.js";

test("explicit native trusted selection preserves draft and live conversation, never sends entry paths to renderer", async () => {
  const root = path.resolve("dist/tests-fixtures/extension-loading"); await mkdir(root, { recursive: true });
  const dir = await mkdtemp(path.join(root, "provider-")); const entry = path.join(dir, "extension.ts"); await writeFile(entry, "export default function () {}\n");
  const r = settingsRuntime(); const starts: Parameters<PiRuntimeLifecycle["start"]>[0][] = [];
  r.runtime.checkpointRestart = async conversation => ({ kind: "resume", conversation });
  const original = r.runtime.start;
  r.runtime.start = async options => { starts.push(options); await original(options); return { ok: true, modelLabel: null, conversation: { id: "session-id", path: "/owned-session", name: "Live" } }; };
  const h = harness([folder()], true, undefined, r.runtime);
  try {
    const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick();
    assert.equal(v.state().runtime, "ready");
    const state = v.state(); const draft = v.attachments().draft;
    v.send("updateDraft", { generation: state.generation, viewId: state.viewId, draftRevision: draft.revision, editSequence: 1, text: "unsent" });
    h.api.window.showOpenDialog = async () => [folder(entry).uri];
    h.api.window.showWarningMessage = async (message, options, ...items) => { assert.ok(message.includes(entry)); assert.equal(options.modal, true); return items[0]; };
    v.action("chooseExecutionProfile", { profile: "trusted" });
    for (let i = 0; i < 100 && starts.length < 2; i++) await new Promise(resolve => setTimeout(resolve, 5));
    await tick();
    assert.equal(starts.length, 2);
    assert.deepEqual(starts[1]?.profile, { kind: "trusted", entryPath: entry });
    assert.deepEqual(starts[1]?.resume, { id: "session-id", path: "/owned-session" });
    assert.equal(v.attachments().draft.text, "unsent");
    const profile = [...v.sent].reverse().find(value => (value as {type: string}).type === "executionProfileState") as ExecutionProfileProjection;
    assert.equal(profile.profile, "trusted"); assert.equal(profile.phase, "idle");
    assert.equal(profile.displayName, "extension.ts");
    assert.ok(!JSON.stringify(v.sent).includes(entry.replaceAll("\\", "\\\\")));
    v.action("chooseExecutionProfile", { profile: "controlled" }); await tick(); await tick();
    assert.equal(starts.length, 3); assert.equal(starts[2]?.profile, undefined);
    assert.equal(v.state().controlledExecution, true);
  } finally {
    h.provider.dispose();
    assert.equal(path.dirname(dir), root); await rm(dir, { recursive: true });
  }
});

function profileState(view: ReturnType<ReturnType<typeof harness>["createView"]>): ExecutionProfileProjection {
  view.state();
  return [...view.sent].reverse().find(value => (value as { type: string }).type === "executionProfileState") as ExecutionProfileProjection;
}

for (const folders of [[folder()], []]) test(`startup handoff shows a normal ${folders.length ? "empty" : "no-folder"} page after retirement`, async () => {
  const r = settingsRuntime(); let handoffs = 0;
  r.runtime.handoffRetainedRuntime = async () => { handoffs++; return { ok: true, outcome: "retired" }; };
  r.runtime.getOwnershipState = async () => "none";
  r.runtime.endOwnedRuntime = async () => assert.fail("no explicit End ceremony after handoff");
  const h = harness(folders, true, undefined, r.runtime);
  try {
    const v = h.createView(); await tick();
    assert.equal(profileState(v).phase, "idle");
    assert.equal(profileState(v).canEnd, false);
    assert.equal(profileState(v).canRecover, false);
    assert.equal(v.state().runtime, "not-started");
    assert.equal(v.state().status, folders.length ? "eligible" : "no-folder");
    if (folders.length) { v.action("chooseResources", { choice: "decline" }); await tick(); assert.equal(v.state().runtime, "ready"); }
    assert.equal(handoffs, 1);
  } finally { h.provider.dispose(); }
});

for (const failure of ["exit-unconfirmed", "owner-unavailable", "blocked", "throws"] as const) test(`startup handoff ${failure} preserves explicit recovery and rejects an early launch`, async () => {
  const r = settingsRuntime(); let finish!: () => void; let starts = 0;
  r.runtime.handoffRetainedRuntime = () => new Promise((resolve, reject) => { finish = () => {
    if (failure === "throws") reject(new Error("private diagnostic"));
    else if (failure === "blocked") resolve({ ok: false, code: "blocked", reason: "invalid-record" });
    else resolve({ ok: false, code: failure });
  }; });
  r.runtime.getOwnershipState = async () => failure === "blocked" ? "blocked" : "pending";
  r.runtime.start = async () => { starts++; return { ok: true, modelLabel: null }; };
  const h = harness([folder()], true, undefined, r.runtime);
  try {
    const v = h.createView();
    v.action("chooseResources", { choice: "decline" }); await tick();
    assert.equal(starts, 0);
    finish(); await tick();
    assert.equal(starts, 0);
    assert.equal(profileState(v).phase, "recovery-required");
    assert.equal(profileState(v).canEnd, failure !== "blocked");
    assert.equal(profileState(v).canRecover, false);
    assert.equal(v.state().runtime, "not-started");
    assert.doesNotMatch(JSON.stringify(v.sent), /private diagnostic/);
  } finally { h.provider.dispose(); }
});

test("a live owner in another window never shows End or Recover even after occupied launch failure", async () => {
  const r = settingsRuntime(); let starts = 0;
  r.runtime.handoffRetainedRuntime = async () => ({ ok: true, outcome: "live-owner" });
  r.runtime.getOwnershipState = async () => "pending";
  r.runtime.endOwnedRuntime = async () => assert.fail("must not end another live owner");
  r.runtime.recoverOwnedRuntime = async () => assert.fail("must not retire another live owner");
  r.runtime.start = async () => { starts++; return { ok: false, detail: "This window's recovery domain is already occupied. No replacement was launched." }; };
  const h = harness([folder()], true, undefined, r.runtime);
  try {
    const v = h.createView(); await tick();
    assert.equal(profileState(v).phase, "idle");
    v.action("chooseResources", { choice: "decline" }); await tick();
    assert.equal(starts, 1);
    assert.equal(v.state().runtime, "error");
    assert.match(v.state().runtimeDetail ?? "", /occupied/);
    assert.equal(profileState(v).phase, "idle");
    assert.equal(profileState(v).canEnd, false);
    assert.equal(profileState(v).canRecover, false);
    v.action("endOwnedRuntime"); v.action("recoverControlledRuntime"); await tick();
    assert.equal(profileState(v).phase, "idle");
  } finally { h.provider.dispose(); }
});

test("a window that later acquires its own run keeps in-session failure recovery", async () => {
  const r = settingsRuntime();
  r.runtime.handoffRetainedRuntime = async () => ({ ok: true, outcome: "live-owner" });
  r.runtime.getOwnershipState = async () => "pending";
  const h = harness([folder()], true, undefined, r.runtime);
  try {
    const v = h.createView(); await tick();
    v.action("chooseResources", { choice: "decline" }); await tick();
    assert.equal(v.state().runtime, "ready");
    r.events.fire({ kind: "runtime_error", session: r.runtime.getSession(), detail: "Own run failed" });
    await tick();
    assert.equal(profileState(v).phase, "recovery-required");
    assert.equal(profileState(v).canEnd, true);
  } finally { h.provider.dispose(); }
});

test("a disposed host ignores late startup handoff completion", async () => {
  const r = settingsRuntime(); let finish!: () => void; let starts = 0;
  r.runtime.handoffRetainedRuntime = () => new Promise(resolve => { finish = () => resolve({ ok: true, outcome: "retired" }); });
  r.runtime.start = async () => { starts++; return { ok: true, modelLabel: null }; };
  const h = harness([folder()], true, undefined, r.runtime);
  const v = h.createView(); v.action("chooseResources", { choice: "decline" }); await tick();
  h.provider.dispose();
  const sent = v.sent.length;
  finish(); await tick();
  assert.equal(starts, 0);
  assert.equal(v.sent.length, sent);
});

test("another window clearing the domain removes the stranded recovery ceremony", async () => {
  const r = settingsRuntime(); let ownership: "pending" | "none" = "pending";
  r.runtime.handoffRetainedRuntime = async () => ({ ok: false, code: "owner-unavailable" });
  r.runtime.getOwnershipState = async () => ownership;
  const h = harness([folder()], true, undefined, r.runtime);
  try {
    const v = h.createView(); await tick();
    assert.equal(profileState(v).phase, "recovery-required");
    ownership = "none"; v.state(); await tick();
    assert.equal(profileState(v).phase, "idle");
    assert.equal(profileState(v).errorCode, null);
    assert.equal(profileState(v).canEnd, false);
    assert.equal(profileState(v).canRecover, false);
    v.action("chooseResources", { choice: "decline" }); await tick();
    assert.equal(v.state().runtime, "ready");
  } finally { h.provider.dispose(); }
});

test("workspace change while startup handoff waits never launches the old cwd", async () => {
  const r = settingsRuntime(); let finish!: () => void; let starts = 0;
  r.runtime.handoffRetainedRuntime = () => new Promise(resolve => { finish = () => resolve({ ok: true, outcome: "retired" }); });
  r.runtime.start = async () => { starts++; return { ok: true, modelLabel: null }; };
  const h = harness([folder()], true, undefined, r.runtime);
  try {
    const v = h.createView(); v.action("chooseResources", { choice: "decline" }); await tick();
    h.api.workspace.workspaceFolders = []; h.change.fire();
    finish(); await tick();
    assert.equal(starts, 0);
    assert.equal(v.state().status, "no-folder");
    assert.equal(v.state().runtime, "not-started");
  } finally { h.provider.dispose(); }
});

test("recovery requires observed terminal ownership and an explicit second action, never an End acknowledgement alone", async () => {
  const r = settingsRuntime();
  let ownership: "pending" | "terminal" | "none" = "pending";
  let endCalls = 0; let recoverCalls = 0; let starts = 0;
  const start = r.runtime.start; r.runtime.start = async options => { starts++; return start(options); };
  r.runtime.getOwnershipState = async () => ownership;
  r.runtime.endOwnedRuntime = async () => { endCalls++; return { ok: true }; };
  r.runtime.recoverOwnedRuntime = async () => { recoverCalls++; assert.equal(ownership, "terminal"); ownership = "none"; return { ok: true }; };
  const h = harness([folder()], true, undefined, r.runtime);
  try {
    const v = h.createView(); await tick();
    const projection = () => { v.state(); return [...v.sent].reverse().find(value => (value as { type: string }).type === "executionProfileState") as ExecutionProfileProjection; };
    assert.equal(projection().phase, "recovery-required");
    assert.equal(projection().canRecover, false);
    v.action("chooseResources", { choice: "allow" }); await tick(); assert.equal(starts, 0);
    h.api.window.showWarningMessage = async (_message, options, ...items) => { assert.equal(options.modal, true); return items[0]; };
    v.action("endOwnedRuntime"); await tick();
    assert.equal(endCalls, 1); assert.equal(recoverCalls, 0); assert.equal(projection().canRecover, false);
    v.action("recoverControlledRuntime"); await tick(); assert.equal(recoverCalls, 0);
    ownership = "terminal";
    v.action("endOwnedRuntime"); await tick();
    assert.equal(projection().canRecover, true); assert.equal(starts, 0);
    v.action("recoverControlledRuntime"); await tick();
    assert.equal(recoverCalls, 1); assert.equal(projection().profile, "controlled"); assert.equal(projection().phase, "idle");
    v.action("chooseResources", { choice: "allow" }); await tick(); assert.equal(starts, 1);
  } finally { h.provider.dispose(); }
});

test("fresh empty profile switch does not resume an unpersisted session path", async () => {
  const root = path.resolve("dist/wi013-checkpoint-evidence/fixtures"); await mkdir(root, { recursive: true });
  const dir = await mkdtemp(path.join(root, "fresh-")); const entry = path.join(dir, "extension.ts"); await writeFile(entry, "export default function () {}\n");
  const r = settingsRuntime(); const starts: Parameters<PiRuntimeLifecycle["start"]>[0][] = [];
  const start = r.runtime.start;
  r.runtime.start = async options => {
    starts.push(options); await start(options);
    return { ok: true, modelLabel: null, conversation: { id: starts.length === 1 ? "fresh" : "replacement", path: "/unpersisted-session", name: null } };
  };
  r.runtime.checkpointRestart = async () => ({ kind: "empty" });
  const h = harness([folder()], true, undefined, r.runtime);
  try {
    const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick();
    assert.equal(v.state().runtime, "ready");
    h.api.window.showOpenDialog = async () => [folder(entry).uri];
    h.api.window.showWarningMessage = async (_message, _options, ...items) => items[0];
    v.action("chooseExecutionProfile", { profile: "trusted" });
    for (let i = 0; i < 100 && starts.length < 2; i++) await new Promise(resolve => setTimeout(resolve, 5));
    await tick();
    assert.equal(starts.length, 2);
    assert.equal(starts[1]?.resume, undefined);
    assert.equal(v.state().runtime, "ready");
  } finally { h.provider.dispose(); assert.equal(path.dirname(dir), root); await rm(dir, { recursive: true }); }
});

for (const checkpoint of ["unavailable", "throws", "missing"] as const) test(`profile checkpoint ${checkpoint} preserves the old ready runtime and draft`, async () => {
  const root = path.resolve("dist/wi013-checkpoint-evidence/fixtures"); await mkdir(root, { recursive: true });
  const dir = await mkdtemp(path.join(root, "blocked-")); const entry = path.join(dir, "extension.ts"); await writeFile(entry, "export default function () {}\n");
  const r = settingsRuntime(); let starts = 0; let stops = 0;
  const start = r.runtime.start;
  r.runtime.start = async options => { starts++; await start(options); return { ok: true, modelLabel: null, conversation: { id: "nonempty", path: "/not-yet-persisted", name: null } }; };
  r.runtime.stop = async () => { stops++; };
  if (checkpoint !== "missing") r.runtime.checkpointRestart = async () => {
    if (checkpoint === "throws") throw new Error("RPC unavailable");
    return { kind: "unavailable" };
  };
  const h = harness([folder()], true, undefined, r.runtime);
  try {
    const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick();
    assert.equal(v.state().runtime, "ready");
    const state = v.state(); const draft = v.attachments().draft;
    v.send("updateDraft", { generation: state.generation, viewId: state.viewId, draftRevision: draft.revision, editSequence: 1, text: "retain this draft" });
    const previousStops = stops;
    h.api.window.showOpenDialog = async () => [folder(entry).uri];
    h.api.window.showWarningMessage = async (_message, _options, ...items) => items[0];
    v.action("chooseExecutionProfile", { profile: "trusted" });
    for (let i = 0; i < 100; i++) {
      await new Promise(resolve => setTimeout(resolve, 5));
      const profile = [...v.sent].reverse().find(value => (value as { type: string }).type === "executionProfileState") as ExecutionProfileProjection;
      if (profile.errorCode !== null) break;
    }
    const profile = [...v.sent].reverse().find(value => (value as { type: string }).type === "executionProfileState") as ExecutionProfileProjection;
    assert.equal(profile.phase, "idle");
    assert.equal(profile.errorCode, "state-changed");
    assert.equal(starts, 1); assert.equal(stops, previousStops);
    assert.equal(v.state().runtime, "ready"); assert.equal(v.state().controlledExecution, true);
    assert.equal(v.attachments().draft.text, "retain this draft");
  } finally { h.provider.dispose(); assert.equal(path.dirname(dir), root); await rm(dir, { recursive: true }); }
});

for (const submitted of [false, true]) test(`owned recovery ${submitted ? 'retains a submitted session identity' : 'replaces an untouched controlled session without resuming a nonexistent file'}`, async () => {
  const r = settingsRuntime();
  let ownership: "none" | "terminal" = "none";
  const starts: Parameters<PiRuntimeLifecycle["start"]>[0][] = [];
  const start = r.runtime.start;
  r.runtime.start = async options => {
    starts.push(options); await start(options);
    return { ok: true, modelLabel: "A / one", conversation: { id: options.resume?.id ?? `fresh-${starts.length}`, path: options.resume?.path ?? `/unpersisted-${starts.length}`, name: null } };
  };
  r.runtime.getOwnershipState = async () => ownership;
  r.runtime.recoverOwnedRuntime = async () => { ownership = "none"; return { ok: true }; };
  const h = harness([folder()], true, undefined, r.runtime);
  try {
    const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick(); await tick();
    if (submitted) { v.action("sendChat", { text: "Submitted before loss" }); await tick(); }
    ownership = "terminal";
    r.events.fire({ kind: "runtime_error", session: r.runtime.getSession(), detail: "Owned runtime ended" });
    await tick();
    v.action("recoverControlledRuntime"); await tick(); await tick();
    assert.equal(starts.length, 2);
    assert.deepEqual(starts[1]?.resume, submitted ? { id: "fresh-1", path: "/unpersisted-1" } : undefined);
    assert.equal(v.state().runtime, "ready");
  } finally { h.provider.dispose(); }
});

for (const trusted of [false, true]) {
  test(`owned-runtime cleanup remains available without execution eligibility (${trusted ? "no folder" : "untrusted"})`, async () => {
    const r = settingsRuntime();
    let ownership: "pending" | "terminal" | "none" = "pending";
    let ends = 0; let recoveries = 0; let starts = 0;
    r.runtime.getOwnershipState = async () => ownership;
    r.runtime.endOwnedRuntime = async () => { ends++; ownership = "terminal"; return { ok: true }; };
    r.runtime.recoverOwnedRuntime = async () => { assert.equal(ownership, "terminal"); recoveries++; ownership = "none"; return { ok: true }; };
    r.runtime.start = async () => { starts++; return { ok: true, modelLabel: null }; };
    const h = harness(trusted ? [] : [folder()], trusted, undefined, r.runtime);
    try {
      const v = h.createView(); await tick();
      const projection = () => { v.state(); return [...v.sent].reverse().find(value => (value as { type: string }).type === "executionProfileState") as ExecutionProfileProjection; };
      assert.equal(projection().canEnd, true);
      h.api.window.showWarningMessage = async () => undefined;
      v.action("endOwnedRuntime"); await tick(); assert.equal(ends, 0);
      h.api.window.showWarningMessage = async (_message, options, ...items) => { assert.equal(options.modal, true); return items[0]; };
      v.action("recoverControlledRuntime"); await tick(); assert.equal(recoveries, 0);
      v.action("endOwnedRuntime"); await tick();
      assert.equal(ends, 1); assert.equal(recoveries, 0); assert.equal(projection().canRecover, true);
      v.action("recoverControlledRuntime"); await tick(); await tick();
      assert.equal(recoveries, 1); assert.equal(projection().phase, "idle");
      assert.equal(v.state().choice, null); assert.equal(v.state().runtime, "not-started");
      v.action("chooseResources", { choice: "allow" }); await tick();
      assert.equal(starts, 0); assert.equal(v.state().choice, null);
    } finally { h.provider.dispose(); }
  });
}
