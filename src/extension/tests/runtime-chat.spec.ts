import assert from "node:assert/strict";
import { test } from "node:test";
import type { PiRuntimeLifecycle } from "../contracts/runtimeLifecycle.js";
import { prepareTestPrompt, folder, harness, readySettings, settingsRuntime, tick } from "./harness.js";

test("resource choice starts runtime with approve or no-approve and stops on workspace change", async () => {
  const starts: { cwd: string; projectTrust: string }[] = [];
  let stops = 0;
  const runtime: PiRuntimeLifecycle = {
    preparePrompt: prepareTestPrompt,
    async start(options) {
      starts.push(options);
      return { ok: true, modelLabel: "Test / model" };
    },
    async stop() { stops++; },
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
  const beforeChange = stops;
  h.api.workspace.workspaceFolders = [folder("/other")]; h.change.fire();
  await tick(); await tick();
  assert.equal(v.state().runtime, "not-started");
  assert.equal(stops, beforeChange + 1);
  h.provider.dispose();
});

test("sendChat streams assistant text and rejects stale runtime events", async () => {
  let session = 0;
  const listeners = new Set<(event: import("../contracts/runtimeLifecycle.js").RuntimeEvent) => void>();
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
  const r=settingsRuntime();let finish!:()=>void;let abortCalls=0;
  r.runtime.abortTask=async()=>{abortCalls++;r.settled();await new Promise<void>(resolve=>finish=resolve);return {ok:true};};
  const h=harness([folder()],true,undefined,r.runtime);const v=h.createView();v.action('chooseResources',{choice:'allow'});await tick();r.calls.length=0;
  v.action('sendChat',{text:'work'});v.action('setThinkingLevel',{level:'high'});v.action('stopChat');await tick();
  assert.equal(v.state().execution,'stopping');assert.equal(abortCalls,1);assert.equal(typeof finish,'function');assert.deepEqual(r.calls,['prompt']);
  v.action('sendChat',{text:'blocked'});assert.deepEqual(r.calls,['prompt']);finish();await tick();assert.equal(r.calls.filter(call=>call==='level:high').length,1);
  r.events.fire({kind:'runtime_error',session:r.runtime.getSession(),detail:'Disconnected'});assert.equal(v.state().runtime,'error');assert.equal(v.state().execution,'stopped');assert.equal(v.state().pendingThinkingLevel,null);const calls=[...r.calls];v.action('sendChat',{text:'blocked after runtime loss'});assert.deepEqual(r.calls,calls);h.provider.dispose();
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
  assert.equal(v.state().execution, "completed", "early settlement must end waiting after the ACK");
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
    assert.equal(v.state().execution, "completed");
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
test("retry projects a running state without admitting a new task or applying deferred settings", async () => {
  const { r, h, v } = await readySettings();
  try {
    v.action("sendChat", { text: "retry fixture" }); await tick();
    v.action("setThinkingLevel", { level: "high" });
    r.events.fire({ kind: "workflow", session: r.runtime.getSession(), phase: "retrying" });
    assert.equal(v.state().execution, "retrying");
    assert.equal(v.state().chatBusy, true);
    v.action("sendChat", { text: "must wait" });
    assert.deepEqual(r.calls, ["prompt"]);
    r.events.fire({ kind: "workflow", session: r.runtime.getSession(), phase: "waiting" });
    assert.equal(v.state().chatBusy, true);
    assert.equal(v.state().thinkingLevel, "medium");
  } finally { h.provider.dispose(); }
});
test("failed stream settlement preserves accepted delivery and newer draft instead of reporting success", async () => {
  const { r, h, v } = await readySettings();
  try {
    v.action("sendChat", { text: "failure fixture" }); await tick();
    v.action("updateDraft", { draftRevision: v.attachments().draft.revision, editSequence: 3, text: "newer unsent draft" });
    r.events.fire({ kind: "stream_error", session: r.runtime.getSession(), detail: "Synthetic retry exhausted" });
    assert.equal(v.state().chatBusy, true, "only reliable settlement ends the task");
    r.settled();
    assert.equal(v.state().execution, "failed");
    assert.equal(v.state().chatBusy, false);
    assert.equal(v.attachments().lastSubmission?.delivery, "rpc-accepted");
    assert.equal(v.attachments().lastSubmission?.outcome, "failed");
    assert.equal(v.attachments().draft.text, "newer unsent draft");
    r.settled(); assert.equal(v.state().execution, "failed");
  } finally { h.provider.dispose(); }
});
test("reliable settlement displays completed while Stop remains stopping until cancellation finishes", async () => {
  const { r, h, v } = await readySettings();
  try {
    v.action("sendChat", { text: "complete fixture" }); await tick();
    r.events.fire({ kind: "text_delta", session: r.runtime.getSession(), delta: "Synthetic answer" });
    r.settled(); assert.equal(v.state().execution, "completed");
    let finish!: () => void;
    r.runtime.abortTask = async () => { r.settled(); await new Promise<void>(resolve => { finish = resolve; }); return { ok: true }; };
    v.action("sendChat", { text: "stop fixture" }); await tick();
    v.action("stopChat"); await tick();
    assert.equal(v.state().execution, "stopping");
    finish(); await tick();
    assert.equal(v.state().execution, "stopped");
    assert.equal(v.attachments().lastSubmission?.outcome, "interrupted");
  } finally { h.provider.dispose(); }
});
test("a recoverable error followed by public retry completes only after settlement and ACK", async () => {
  const { r, h, v } = await readySettings();
  let acknowledge!: (value: { ok: true }) => void;
  r.runtime.prompt = () => new Promise(resolve => { acknowledge = resolve; });
  try {
    v.action("sendChat", { text: "recover fixture" });
    r.events.fire({ kind: "stream_error", session: r.runtime.getSession(), detail: "Synthetic transient failure" });
    r.events.fire({ kind: "workflow", session: r.runtime.getSession(), phase: "retrying" });
    assert.equal(v.state().chatError, null);
    r.events.fire({ kind: "text_delta", session: r.runtime.getSession(), delta: "Recovered" });
    r.settled(); assert.equal(v.state().chatBusy, true);
    acknowledge({ ok: true }); await tick();
    assert.equal(v.state().execution, "completed");
    assert.equal(v.attachments().lastSubmission?.outcome, "settled");
    assert.equal(v.attachments().lastSubmission?.delivery, "rpc-accepted");
  } finally { h.provider.dispose(); }
});
test("late workflow and content events cannot revive a settled task in the same runtime", async () => {
  const { r, h, v } = await readySettings();
  try {
    v.action("sendChat", { text: "late fixture" }); await tick();
    r.events.fire({ kind: "text_delta", session: r.runtime.getSession(), delta: "Final answer" });
    r.settled(); const messages = v.state().messages;
    for (const event of [
      { kind: "workflow", phase: "compacting" },
      { kind: "text_delta", delta: "late text" },
      { kind: "message_final", messageId: "late", text: "late final" },
      { kind: "stream_error", detail: "late error" },
    ] as const) r.events.fire({ ...event, session: r.runtime.getSession() });
    assert.equal(v.state().execution, "completed");
    assert.equal(v.state().chatBusy, false);
    assert.deepEqual(v.state().messages, messages);
  } finally { h.provider.dispose(); }
});
test("late prompt ACK preserves an already settled Stop outcome", async () => {
  const { r, h, v } = await readySettings(); let acknowledge!: (value: { ok: true }) => void;
  r.runtime.prompt = () => new Promise(resolve => { acknowledge = resolve; });
  r.runtime.abortTask = async () => { r.settled(); return { ok: true }; };
  try {
    v.action("sendChat", { text: "stop before ACK" }); await tick();
    v.action("stopChat"); await tick(); assert.equal(v.state().execution, "stopped");
    acknowledge({ ok: true }); await tick();
    assert.equal(v.state().execution, "stopped");
    assert.equal(v.attachments().lastSubmission?.outcome, "interrupted");
    assert.equal(v.attachments().lastSubmission?.delivery, "rpc-accepted");
  } finally { h.provider.dispose(); }
});
test("settled failure is frozen while waiting for ACK and rejects late phase or content", async () => {
  const { r, h, v } = await readySettings(); let acknowledge!: (value: { ok: true }) => void;
  r.runtime.prompt = () => new Promise(resolve => { acknowledge = resolve; });
  try {
    v.action("sendChat", { text: "early failed fixture" });
    r.events.fire({ kind: "stream_error", session: r.runtime.getSession(), detail: "Synthetic final failure" });
    r.settled(); assert.equal(v.state().chatBusy, true);
    r.events.fire({ kind: "workflow", session: r.runtime.getSession(), phase: "compacting" });
    r.events.fire({ kind: "text_delta", session: r.runtime.getSession(), delta: "late text" });
    assert.equal(v.state().chatError, "Synthetic final failure");
    assert.equal(v.state().messages.some(message => message.text.includes("late text")), false);
    acknowledge({ ok: true }); await tick();
    assert.equal(v.state().execution, "failed");
    assert.equal(v.attachments().lastSubmission?.outcome, "failed");
    assert.equal(v.attachments().lastSubmission?.delivery, "rpc-accepted");
  } finally { h.provider.dispose(); }
});
test("runtime loss preserves confirmed accepted delivery while ending the unfinished task", async () => {
  const { r, h, v } = await readySettings();
  try {
    v.action("sendChat", { text: "accepted then lost" }); await tick();
    assert.equal(v.attachments().lastSubmission?.delivery, "rpc-accepted");
    r.events.fire({ kind: "runtime_error", session: r.runtime.getSession(), detail: "Synthetic disconnect after ACK" });
    assert.equal(v.state().execution, "failed");
    assert.equal(v.attachments().lastSubmission?.delivery, "rpc-accepted");
    assert.equal(v.attachments().lastSubmission?.outcome, "interrupted");
  } finally { h.provider.dispose(); }
});
test("duplicate settlement cannot rewrite completed task history during a late Stop and pending ACK", async () => {
  const { r, h, v } = await readySettings(); let acknowledge!: (value: { ok: true }) => void;
  r.runtime.prompt = () => new Promise(resolve => { acknowledge = resolve; });
  r.runtime.abortTask = async () => { r.settled(); return { ok: true }; };
  try {
    v.action("sendChat", { text: "completed before ACK" });
    r.events.fire({ kind: "text_delta", session: r.runtime.getSession(), delta: "Complete answer" });
    r.settled(); assert.equal(v.attachments().lastSubmission?.outcome, "settled");
    v.action("stopChat"); await tick();
    acknowledge({ ok: true }); await tick();
    assert.equal(v.state().execution, "completed");
    assert.equal(v.attachments().lastSubmission?.outcome, "settled");
    assert.equal(v.attachments().lastSubmission?.delivery, "rpc-accepted");
  } finally { h.provider.dispose(); }
});
test("explicit Stop failure ends pending task history but preserves confirmed delivery and newer draft", async () => {
  const { r, h, v } = await readySettings();
  r.runtime.abortTask = async () => ({ ok: false, detail: "Synthetic Stop failure; runtime shut down" });
  try {
    v.action("sendChat", { text: "failed Stop fixture" }); await tick();
    v.action("updateDraft", { draftRevision: v.attachments().draft.revision, editSequence: 4, text: "new draft after send" });
    v.action("stopChat"); await tick();
    assert.equal(v.state().runtime, "error");
    assert.equal(v.state().execution, "failed");
    assert.equal(v.attachments().lastSubmission?.outcome, "failed");
    assert.equal(v.attachments().lastSubmission?.delivery, "rpc-accepted");
    assert.equal(v.attachments().draft.text, "new draft after send");
  } finally { h.provider.dispose(); }
});

test("explicit Stop failure releases the active change-review watcher", async () => {
  const { r, h, v } = await readySettings();
  r.runtime.abortTask = async () => ({ ok: false, detail: "Synthetic Stop failure" });
  try {
    v.action("sendChat", { text: "review owner fixture" }); await tick();
    assert.equal(h.fileChange.listeners.size, 1);
    v.action("stopChat"); await tick();
    assert.equal(v.state().runtime, "error");
    assert.equal(h.fileChange.listeners.size, 0, "failed task must stop observing later workspace edits");
  } finally { h.provider.dispose(); }
});

test("runtime disconnection does not rewrite a reliably completed task as failed", async () => {
  const { r, h, v } = await readySettings();
  try {
    v.action("sendChat", { text: "settle before runtime loss" }); await tick(); r.settled();
    assert.equal(v.state().execution, "completed");
    r.events.fire({ kind: "runtime_error", session: r.runtime.getSession(), detail: "Synthetic subsequent disconnect" });
    assert.equal(v.state().runtime, "error");
    assert.equal(v.state().execution, "completed");
    assert.equal(v.attachments().lastSubmission?.outcome, "settled");
    assert.equal(v.attachments().lastSubmission?.delivery, "rpc-accepted");
  } finally { h.provider.dispose(); }
});

test("registered command handler settlement is not an empty assistant failure and respects active agent", async () => {
  const { r, h, v } = await readySettings();
  try {
    v.action("sendChat", { text: "/manage" }); await tick();
    assert.equal(v.state().chatBusy, true);
    r.events.fire({ kind: "command_handled", session: r.runtime.getSession(), agentRunning: false });
    await tick();
    assert.equal(v.state().chatBusy, false);
    assert.equal(v.state().chatError, null);
    v.action("sendChat", { text: "/starts-agent" }); await tick();
    r.events.fire({ kind: "command_handled", session: r.runtime.getSession(), agentRunning: true });
    assert.equal(v.state().chatBusy, true);
    r.events.fire({ kind: "text_delta", session: r.runtime.getSession(), delta: "agent reply" });
    r.settled(); await tick();
    assert.equal(v.state().chatBusy, false);
    assert.equal(v.state().messages.at(-1)?.text, "agent reply");
  } finally { h.provider.dispose(); }
});
