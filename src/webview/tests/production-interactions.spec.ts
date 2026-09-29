import assert from "node:assert/strict";
import { test } from "node:test";
import { uiHarness } from "./react-harness.js";

test("production chat renders separate extension forms and emits only typed host intents", async () => {
  const h = await uiHarness(true);
  const errors: string[] = [];
  h.dom.window.addEventListener("error", event => { errors.push(event.message); });
  try {
    const envelope = { version: 3, generation: 1, viewId: "view" };
    await h.receive({ ...envelope, type: "interactionState", active: { id: "one", method: "confirm", title: "Literal <b>request</b>", message: "Not tool permission", origin: "trusted runtime extension; not authenticated" }, queuedCount: 0, phase: "waiting", errorCode: null, feedback: [], omittedFeedback: 0 });
    assert.match(h.root.textContent ?? "", /Literal <b>request<\/b>/);
    assert.equal(h.root.querySelector(".extension-interactions b") === null, true);
    await h.click('.extension-interactions [data-action="cancel"]');
    assert.ok(h.sent.some(message => message.type === "cancelInteraction" && message.id === "one"));
    assert.equal(h.sent.some(message => message.type === "decideApproval"), false);
    await h.receive({ ...envelope, type: "executionProfileState", profile: "controlled", displayName: null, phase: "recovery-required", errorCode: "exit-evidence-required", canSwitch: false, canEnd: true, canRecover: false });
    assert.ok(h.root.querySelector(".candidate__runtime-recovery"));
    assert.equal(h.root.querySelector(".candidate__extension-profile") === null, true);
    await h.click('.candidate__runtime-recovery [data-action="end-owned-runtime"]');
    assert.ok(h.sent.some(message => message.type === "endOwnedRuntime"));
    assert.equal(h.get<HTMLButtonElement>('.candidate__runtime-recovery [data-action="recover-controlled-runtime"]').disabled, true);
    assert.deepEqual(errors, []);
  } finally { await h.close(); }
});

test("idle execution profile opens beside the composer and keeps the model control visible", async () => {
  const h = await uiHarness(true);
  try {
    const envelope = { version: 3, generation: 1, viewId: "view" };
    assert.ok(h.root.querySelector("#model-effort-trigger"), "model control is present before workspace projection");
    await h.receive({ ...envelope, type: "executionProfileState", profile: "controlled", displayName: null, phase: "idle", errorCode: null, canSwitch: true, canEnd: false, canRecover: false });
    assert.equal(h.root.querySelector(".candidate__extension-profile") === null, true);
    assert.equal(h.root.querySelector(".candidate__runtime-recovery") === null, true);
    assert.ok(h.root.querySelector("#model-effort-trigger"));
    await h.click('.candidate-permissions > summary');
    assert.match(h.get(".candidate-settings").textContent ?? "", /Execution profile|执行配置/);
    assert.equal(h.root.querySelector(".candidate-settings .execution-profile-controls__phase") === null, true);
    assert.ok(h.get('.candidate-settings [data-profile-choice="trusted"]'));
    await h.click('.candidate-settings [data-profile-choice="trusted"]');
    assert.ok(h.sent.some(message => message.type === "chooseExecutionProfile" && message.profile === "trusted"));
    await h.receive({ ...envelope, type: "executionProfileState", profile: "controlled", displayName: null, phase: "switching", errorCode: null, canSwitch: false, canEnd: false, canRecover: false });
    assert.match(h.get(".candidate-settings .execution-profile-controls__phase").textContent ?? "", /Changing execution profile|正在切换执行配置/);
    assert.ok(h.get(".candidate-settings .execution-profile-controls__notes"));
    assert.equal(h.get<HTMLButtonElement>('.candidate-settings [data-profile-choice="trusted"]').disabled, true);
  } finally { await h.close(); }
});

test("idle extension feedback stays inspectable without occupying the conversation viewport", async () => {
  const h = await uiHarness(true);
  try {
    const envelope = { version: 3, generation: 1, viewId: "view" };
    await h.receive({ ...envelope, type: "interactionState", active: null, queuedCount: 0, phase: "idle", errorCode: null, feedback: [{ id: "feedback-one", kind: "status", level: "info", text: "sysprompt: off" }], omittedFeedback: 0 });
    const details = h.get<HTMLDetailsElement>("details.extension-interactions");
    assert.equal(details.open, false);
    await h.click(".extension-interactions > summary"); assert.equal(details.open, true);
    assert.match(h.root.textContent ?? "", /sysprompt: off/);
    await h.receive({ ...envelope, type: "interactionState", active: { id: "next", method: "input", title: "Needs response", origin: "trusted runtime extension; not authenticated" }, queuedCount: 0, phase: "waiting", errorCode: null, feedback: [], omittedFeedback: 0 });
    assert.equal(details.open, true);
  } finally { await h.close(); }
});

test("lost runtime transport does not claim the owned process has ended", async () => {
  const h = await uiHarness(true);
  try {
    const { attachmentState } = await import("./react-harness.js");
    await h.receive(attachmentState({ result: { code: "runtime-lost" } }));
    await h.render({ runtime: "error", runtimeDetail: "Stop is unconfirmed" });
    assert.match(h.root.textContent ?? "", /Runtime connection unavailable; attachment history cleared/);
    assert.doesNotMatch(h.root.textContent ?? "", /Runtime ended/);
  } finally { await h.close(); }
});
