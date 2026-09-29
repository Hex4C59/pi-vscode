import assert from "node:assert/strict";
import { test } from "node:test";
import type { PiRuntimeLifecycle, ExtensionInteractionProjection } from "../contracts/index.js";
import type { InteractionReply } from "../interactions/index.js";
import { folder, harness, settingsRuntime, tick } from "./harness.js";

test("host retains extension interaction on view recreation, rejects stale answers and answers exactly once", async () => {
  const r = settingsRuntime();
  let handler!: Parameters<NonNullable<PiRuntimeLifecycle["setInteractionHandler"]>>[0];
  r.runtime.setInteractionHandler = value => { handler = value; };
  const h = harness([folder()], true, undefined, r.runtime);
  const replies: InteractionReply[] = [];
  try {
    const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick();
    assert.equal(typeof handler, "function");
    handler({ method: "confirm", title: "Extension request", message: "Not a tool permission" }, value => { replies.push(value); });
    const projection = (view: typeof v) => { view.state(); return [...view.sent].reverse().find(value => (value as { type: string }).type === "interactionState") as ExtensionInteractionProjection; };
    const form = projection(v).active; assert.ok(form);
    v.action("sendChat", { text: "blocked while waiting" }); await tick();
    assert.ok(!r.calls.includes("prompt"));
    const old = v.state(); v.dispose.fire(); const next = h.createView();
    assert.equal(projection(next).active?.id, form.id);
    next.send("answerInteraction", { generation: old.generation, viewId: old.viewId, id: form.id, answer: { method: "confirm", value: true } });
    assert.equal(replies.length, 0);
    next.action("answerInteraction", { id: form.id, answer: { method: "confirm", value: false } });
    next.action("answerInteraction", { id: form.id, answer: { method: "confirm", value: true } });
    assert.deepEqual(replies, [{ kind: "answer", answer: { method: "confirm", value: false } }]);
    assert.equal(projection(next).active, null);
    assert.deepEqual(next.state().grants, []);
  } finally { h.provider.dispose(); }
});

test("Stop cancels local forms before abort and blocks late forms without settlement", async () => {
  const r = settingsRuntime();
  let handler!: Parameters<NonNullable<PiRuntimeLifecycle["setInteractionHandler"]>>[0];
  r.runtime.setInteractionHandler = value => { handler = value; };
  const replies: InteractionReply[] = [];
  let finish!: () => void;
  r.runtime.abortTask = async () => {
    assert.equal(replies[0]?.kind, "cancel");
    await new Promise<void>(resolve => { finish = resolve; });
    return { ok: true };
  };
  const h = harness([folder()], true, undefined, r.runtime);
  try {
    const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick();
    v.action("sendChat", { text: "/manage" }); await tick();
    handler({ method: "input", title: "Name" }, value => { replies.push(value); });
    v.action("stopChat"); await tick();
    assert.equal(typeof finish, "function");
    handler({ method: "editor", title: "Continued after cancel" }, value => { replies.push(value); });
    assert.equal(replies.length, 2);
    assert.equal(replies.every(reply => reply.kind === "cancel"), true);
    finish(); await tick();
    handler({ method: "input", title: "Fresh task" }, value => { replies.push(value); });
    assert.equal(replies.length, 2);
  } finally { finish?.(); h.provider.dispose(); }
});

test("an interaction overflow barrier invalidates transport once and exposes owned recovery", async () => {
  const r = settingsRuntime();
  let handler!: Parameters<NonNullable<PiRuntimeLifecycle["setInteractionHandler"]>>[0];
  let invalidations = 0;
  r.runtime.setInteractionHandler = value => { handler = value; };
  r.runtime.invalidateInteractions = () => { invalidations++; r.events.fire({ kind: "runtime_error", session: r.runtime.getSession(), detail: "Interaction state unconfirmed" }); };
  r.runtime.getOwnershipState = async () => invalidations ? "pending" : "none";
  const h = harness([folder()], true, undefined, r.runtime);
  try {
    const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick();
    for (let n = 0; n < 13; n++) handler({ method: "input", title: "Request " + n }, () => undefined);
    await tick();
    assert.equal(invalidations, 1);
    assert.equal(v.state().runtime, "error");
    const projection = [...v.sent].reverse().find(value => (value as { type: string }).type === "executionProfileState") as { phase: string; canEnd: boolean; canRecover: boolean };
    assert.equal(projection.phase, "recovery-required"); assert.equal(projection.canEnd, true); assert.equal(projection.canRecover, false);
  } finally { h.provider.dispose(); }
});
