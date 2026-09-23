import assert from "node:assert/strict";
import { test } from "node:test";
import type { PiRuntimeLifecycle } from "../runtimeLifecycle.js";
import { prepareTestPrompt, folder, harness, readySettings, settingsRuntime, tick } from "./harness.js";

test("resource choice starts runtime with approve or no-approve and stops on workspace change", async () => {
  const starts: { cwd: string; projectTrust: string }[] = [];
  const runtime: PiRuntimeLifecycle = {
    preparePrompt: prepareTestPrompt,
    async start(options) {
      starts.push(options);
      return { ok: true, modelLabel: "Test / model" };
    },
    async stop() { /* noop */ },
    getSession() { return 1; },
    subscribe() { return () => undefined; },
    async prompt() { return { ok: true }; },
    async getModelProjection() {
      return { ok: true, modelLabel: "Test / model", thinkingLevel: "medium", thinkingLevels: ["off", "medium", "high"], models: [] };
    },
    async setThinkingLevel() { return { ok: false, detail: "unused" }; },
    async setModel() { return { ok: false, detail: "unused" }; },
  };
  const h = harness([folder()], true, undefined, runtime);
  const v = h.createView();
  v.action("chooseResources", { choice: "allow" });
  await tick(); await tick(); await tick();
  assert.deepEqual(starts.at(-1), { cwd: "/project", projectTrust: "approve" });
  assert.equal(v.state().runtime, "ready");
  v.action("chooseResources", { choice: "decline" });
  await tick(); await tick();
  assert.deepEqual(starts.at(-1), { cwd: "/project", projectTrust: "no-approve" });
  h.api.workspace.workspaceFolders = [folder("/other")]; h.change.fire();
  await tick(); await tick();
  assert.equal(v.state().runtime, "not-started");
  h.provider.dispose();
});

test("sendChat streams assistant text and rejects stale runtime events", async () => {
  let session = 0;
  const listeners = new Set<(event: import("../runtimeLifecycle.js").RuntimeEvent) => void>();
  const runtime: PiRuntimeLifecycle = {
    preparePrompt: prepareTestPrompt,
    async start() {
      session += 1;
      return { ok: true, modelLabel: null };
    },
    async stop() { session = 0; },
    getSession() { return session; },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async prompt(text) {
      const active = session;
      queueMicrotask(() => {
        for (const listener of listeners) {
          listener({ kind: "text_delta", session: active, delta: `echo:${text}` });
          listener({ kind: "agent_settled", session: active });
        }
      });
      return { ok: true };
    },
    async getModelProjection() {
      return { ok: true, modelLabel: null, thinkingLevel: "off", thinkingLevels: ["off"], models: [] };
    },
    async setThinkingLevel() { return { ok: false, detail: "unused" }; },
    async setModel() { return { ok: false, detail: "unused" }; },
  };
  const h = harness([folder()], true, undefined, runtime);
  const v = h.createView();
  v.action("chooseResources", { choice: "allow" });
  await tick(); await tick();
  assert.equal(v.state().runtime, "ready");
  v.action("sendChat", { text: "hi" });
  await tick(); await tick();
  const after = v.state();
  assert.equal(after.chatBusy, false);
  assert.deepEqual(after.messages, [{ role: "user", text: "hi" }, { role: "assistant", text: "echo:hi" }]);
  for (const listener of listeners) listener({ kind: "text_delta", session: session - 1, delta: "stale" });
  assert.equal(v.state().messages.at(-1)?.text, "echo:hi");
  h.provider.dispose();
});

test('Stop holds deferred settings until cancellation completes and runtime loss fails closed', async()=>{
  const r=settingsRuntime();let finish:()=>void=()=>{};
  r.runtime.abortTask=async()=>{r.settled();await new Promise<void>(resolve=>finish=resolve);return {ok:true};};
  const h=harness([folder()],true,undefined,r.runtime);const v=h.createView();v.action('chooseResources',{choice:'allow'});await tick();r.calls.length=0;
  v.action('sendChat',{text:'work'});v.action('setThinkingLevel',{level:'high'});v.action('stopChat');await tick();
  assert.equal(v.state().execution,'stopping');assert.deepEqual(r.calls,['prompt']);
  v.action('sendChat',{text:'blocked'});assert.deepEqual(r.calls,['prompt']);finish();await tick();assert.ok(r.calls.includes('level:high'));
  r.events.fire({kind:'runtime_error',session:r.runtime.getSession(),detail:'Disconnected'});assert.equal(v.state().runtime,'error');assert.equal(v.state().execution,'failed');assert.equal(v.state().pendingThinkingLevel,null);h.provider.dispose();
});

test("early settlement keeps admission blocked until prompt acknowledgement resolves", async () => {
  const { r, h, v } = await readySettings();
  let finish!: (value: { ok: true }) => void;
  r.runtime.prompt = () => new Promise(resolve => { finish = resolve; });
  v.action("sendChat", { text: "first" });
  v.action("setThinkingLevel", { level: "high" });
  r.settled(); await tick();
  assert.equal(v.state().chatBusy, true);
  assert.equal(v.state().thinkingLevel, "medium");
  v.action("sendChat", { text: "next" });
  assert.equal(v.state().messages.filter(message => message.role === "user").length, 1);
  finish({ ok: true }); await tick();
  assert.equal(v.state().chatBusy, false);
  assert.equal(v.state().thinkingLevel, "high");
  assert.equal(v.state().execution, "idle", "early settlement must end waiting after the ACK");
  assert.equal(v.attachments().draft.text, "next");
  h.provider.dispose();
});


test("RPC rejection ends waiting, preserves a newer draft, and never replays the rejected task", async () => {
  const { r, h, v } = await readySettings();
  let reject!: (value: { ok: false; detail: string }) => void;
  let prompts = 0;
  r.runtime.prompt = () => { prompts++; return new Promise(resolve => { reject = resolve; }); };
  try {
    v.action("sendChat", { text: "rejected task" });
    v.action("updateDraft", { draftRevision: v.attachments().draft.revision, editSequence: 2, text: "new unsent draft" });
    reject({ ok: false, detail: "synthetic missing model" });
    await tick();
    assert.equal(v.state().execution, "failed");
    assert.equal(v.state().chatBusy, false);
    assert.equal(v.state().runtime, "ready");
    assert.match(v.state().chatError ?? "", /rejected/i);
    assert.doesNotMatch(v.state().chatError ?? "", /Stop/);
    assert.equal(v.attachments().lastSubmission?.delivery, "rpc-rejected");
    assert.equal(v.attachments().lastSubmission?.outcome, "failed");
    assert.equal(v.attachments().draft.text, "new unsent draft");
    const next = h.createView(); next.action("getWorkspaceState");
    assert.equal(next.state().execution, "failed");
    assert.equal(next.attachments().draft.text, "new unsent draft");
    assert.equal(prompts, 1);
  } finally { h.provider.dispose(); }
});


test("a late Stop resynchronizes settled host state instead of leaving the view stopping", async () => {
  const { r, h, v } = await readySettings();
  try {
    v.action("sendChat", { text: "task" }); await tick();
    const busy = v.state();
    r.settled();
    const count = v.sent.length;
    // Renderer can still have the prior busy snapshot when the user presses Stop.
    v.send("stopChat", { generation: busy.generation, viewId: busy.viewId }); await tick();
    const replies = v.sent.slice(count);
    assert.ok(replies.some(message => (message as { type: string }).type === "workspaceState"));
    assert.equal(v.state().chatBusy, false);
    assert.equal(v.state().execution, "idle");
    assert.deepEqual(r.calls, ["prompt"]);
  } finally { h.provider.dispose(); }
});


test("late prompt acknowledgement cannot turn a disconnected runtime back into idle", async () => {
  const { r, h, v } = await readySettings();
  let acknowledge!: (value: { ok: true }) => void;
  r.runtime.prompt = () => new Promise(resolve => { acknowledge = resolve; });
  try {
    v.action("sendChat", { text: "uncertain task" });
    r.events.fire({ kind: "runtime_error", session: r.runtime.getSession(), detail: "Runtime disconnected." });
    acknowledge({ ok: true }); await tick();
    assert.equal(v.state().runtime, "error");
    assert.equal(v.state().execution, "failed");
    assert.equal(v.attachments().lastSubmission?.delivery, "unknown");
    assert.equal(v.attachments().lastSubmission?.outcome, "interrupted");
    assert.equal(v.state().chatBusy, false);
  } finally { h.provider.dispose(); }
});
