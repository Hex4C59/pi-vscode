import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import type { ActivityItem } from "../../extension/runtimeLifecycle.js";
import type { ApprovalCard } from "../../extension/toolApproval.js";
import { uiHarness } from "./react-harness.js";

const thinking: ActivityItem = { id: "t1", kind: "thinking", messageId: "m1", text: "Actual upstream text", status: "thinking", truncated: false };
const tool: ActivityItem = { id: "tool1", kind: "tool", messageId: "m1", tool: "write", input: '{"path":"a"}', text: "first", status: "preparing", truncated: false };
const card: ApprovalCard = {
  id: "approval1", tool: "write", toolCallId: "tool1", input: '{"path":"a","content":"<script>literal</script>"}', scope: null,
  expiresAt: Date.now() + 120_000,
};

test("mounted React conversation keeps incremental nodes, expansion and slider interaction stable", async () => {
  const h = await uiHarness();
  try {
    await h.render({ messages: [{ id: "m1", role: "assistant", text: "Hello" }], activities: [thinking, tool] });
    const row = h.get("#messages").children[0] as HTMLElement;
    const steps = row.children[0] as HTMLElement;
    const thinkingView = steps.querySelector<HTMLElement>('[data-activity-id="t1"]');
    const toolView = steps.querySelector<HTMLElement>('[data-activity-id="tool1"]');
    assert.ok(thinkingView); assert.ok(toolView);
    await h.click('[data-activity-id="t1"] > summary');
    await act(async () => thinkingView.dispatchEvent(new h.dom.window.Event("toggle")));
    assert.equal((thinkingView as HTMLDetailsElement).open, true);

    await h.click("#model-effort-trigger");
    const slider = h.get<HTMLInputElement>("#thinking-slider");
    slider.value = "2";
    await act(async () => slider.dispatchEvent(new h.dom.window.Event("input", { bubbles: true })));
    assert.equal(slider.value, "2");

    await h.click("#model-current");
    const modelItem = h.get<HTMLButtonElement>("#model-list button");
    modelItem.focus();
    const main = h.get("#main");
    Object.defineProperties(main, { scrollHeight: { configurable: true, value: 1000 }, clientHeight: { configurable: true, value: 300 } });
    main.scrollTop = 120;
    await act(async () => main.dispatchEvent(new h.dom.window.Event("scroll")));
    await h.render({
      messages: [{ id: "m1", role: "assistant", text: "Hello world" }],
      activities: [{ ...thinking, text: "Updated thinking" }, { ...tool, status: "executing", text: "first second", truncated: true }],
    });
    assert.equal(h.get("#messages").children[0], row);
    assert.equal((row.children[1] as HTMLElement).textContent, "Hello world");
    assert.equal(steps.querySelector('[data-activity-id="t1"]'), thinkingView);
    assert.equal((thinkingView as HTMLDetailsElement).open, true);
    assert.equal(toolView?.querySelectorAll("pre")[1]?.textContent, "first second");
    assert.match(h.get('[data-activity-id="tool1"] .truncation').textContent ?? "", /Truncated/);
    assert.equal(h.get<HTMLInputElement>("#thinking-slider").value, "2");
    assert.equal(h.get("#model-list").hidden, false);
    assert.equal(h.get("#model-list button"), modelItem);
    assert.equal(h.dom.window.document.activeElement, modelItem);
    assert.equal(main.scrollTop, 120);
    main.scrollTop = 700;
    await act(async () => main.dispatchEvent(new h.dom.window.Event("scroll")));

    await h.render({ messages: [{ id: "m1", role: "assistant", text: "Hello world" }], activities: [] });
    assert.equal(steps.children.length, 0);
    assert.equal(main.scrollTop, 1000);
  } finally {
    await h.close();
  }
});

test("mounted React approvals expose literal input and scope, lock one decision, and revoke grants", async () => {
  for (const [index, decision] of ["once", "session", "deny"].entries()) {
    const h = await uiHarness();
    try {
      await h.render({ approvals: [{ ...card, scope: "exact scope" }], grants: [{ id: "g1", scope: "full exact scope" }] });
      const approval = h.get<HTMLElement>("#approvals").children[0] as HTMLElement;
      assert.equal(approval.querySelector(".approval-input")?.textContent, card.input);
      assert.match(approval.querySelector(".grant-scope")?.textContent ?? "", /exact scope/);
      const buttons = approval.querySelectorAll<HTMLButtonElement>("[data-decision]");
      assert.equal(buttons.length, 3);
      await h.click(`[data-decision="${decision}"]`);
      assert.deepEqual(h.sent.at(-1), { version: 2, type: "decideApproval", generation: 1, viewId: "view", id: "approval1", decision });
      assert.ok([...buttons].every(button => button.disabled));
      await h.click('[data-grant-action="revoke"]');
      assert.equal((h.sent.at(-1) as { type: string }).type, "revokeGrant");
      await h.render({ approvals: [], grants: [] });
      assert.equal(h.get("#approvals").children.length, 0);
      assert.equal(h.get("#grants").children.length, 0);
    } finally {
      await h.close();
    }
    assert.equal(index, ["once", "session", "deny"].indexOf(decision));
  }

  const h = await uiHarness();
  try {
    await h.render({ approvals: [card] });
    const buttons = h.get<HTMLElement>("#approvals").querySelectorAll<HTMLButtonElement>("[data-decision]");
    assert.equal(buttons[1]?.disabled, true);
    await h.render({ approvals: [{ ...card, expiresAt: 0 }] });
    assert.ok([...h.get<HTMLElement>("#approvals").querySelectorAll<HTMLButtonElement>("[data-decision]")].every(button => button.disabled));
  } finally {
    await h.close();
  }
});

test("mounted React approvals expire each card at its own deadline", async t => {
  const startedAt = Date.UTC(2026, 0, 1);
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: startedAt });
  const h = await uiHarness();
  try {
    await h.render({ approvals: [
      { ...card, id: "approval-soon", scope: "exact scope", expiresAt: startedAt + 1_000 },
      { ...card, id: "approval-later", scope: "exact scope", expiresAt: startedAt + 2_000 },
    ] });

    const buttonsFor = (id: string) => [...h.get<HTMLElement>(`[data-approval-id="${id}"]`).querySelectorAll<HTMLButtonElement>("[data-decision]")];
    assert.ok(buttonsFor("approval-soon").every(button => !button.disabled));
    assert.ok(buttonsFor("approval-later").every(button => !button.disabled));

    await act(async () => { t.mock.timers.tick(1_001); });
    assert.ok(buttonsFor("approval-soon").every(button => button.disabled));
    assert.ok(buttonsFor("approval-later").every(button => !button.disabled));

    await act(async () => { t.mock.timers.tick(1_000); });
    assert.ok(buttonsFor("approval-later").every(button => button.disabled));
  } finally {
    await h.close();
  }
});
test("Stop stays visible while stopping, locks approvals, and preserves draft and next-turn controls", async () => {
  const h = await uiHarness();
  try {
    await h.render({ chatBusy: true, approvals: [card], execution: "thinking", pendingThinkingLevel: "high" });
    assert.match(h.get("#execution-status").textContent ?? "", /Thinking/);
    assert.equal(h.get<HTMLButtonElement>("#stop-chat").hidden, false);
    assert.equal(h.get<HTMLButtonElement>("#stop-chat").disabled, false);
    assert.equal(h.get<HTMLInputElement>("#thinking-slider").disabled, false);
    assert.match(h.get("#pending-settings").textContent ?? "", /Next turn/);
    await h.input("draft");
    await h.click("#stop-chat");
    assert.equal((h.sent.at(-1) as { type: string }).type, "stopChat");
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "draft");
    assert.ok([...h.get<HTMLElement>("#approvals").querySelectorAll<HTMLButtonElement>("[data-decision]")].every(button => button.disabled));

    await h.render({ runtime: "stopping", execution: "stopping", busy: true });
    assert.equal(h.get<HTMLButtonElement>("#stop-chat").disabled, true);
    assert.equal(h.get<HTMLInputElement>("#thinking-slider").disabled, true);
    assert.match(h.get("#execution-status").textContent ?? "", /not rolled back/);
    await h.render({ chatBusy: false, execution: "idle", runtime: "ready", busy: false });
    assert.equal(h.root.querySelector("#stop-chat"), null);
    assert.equal(h.get<HTMLButtonElement>("#send-chat").disabled, true);
    assert.match(h.get("#controlled-disclosure").textContent ?? "", /not in a sandbox/);
  } finally {
    await h.close();
  }
});

test("generation changes clear old activity and approval nodes without reviving stale projections", async () => {
  const h = await uiHarness();
  try {
    await h.render({ activities: [thinking], approvals: [card] });
    assert.equal(h.get("#messages").children.length, 1);
    assert.equal(h.root.querySelectorAll("[data-activity-id]").length, 1);
    assert.equal(h.get("#approvals").children.length, 1);
    await h.render({ generation: 2, messages: [], activities: [], approvals: [] });
    assert.equal(h.get("#messages").children.length, 0);
    assert.equal(h.root.querySelectorAll("[data-activity-id]").length, 0);
    assert.equal(h.get("#approvals").children.length, 0);
    await h.receive({ ...({ version: 2, type: "workspaceState", viewId: "view", generation: 1 }), messages: [{ id: "late", role: "assistant", text: "late" }], activities: [], approvals: [], grants: [] });
    assert.equal(h.get("#messages").textContent, "");
  } finally {
    await h.close();
  }
});

test("thinking node keeps focus and expansion when the first assistant text arrives", async () => {
  const h = await uiHarness();
  try {
    await h.render({ chatBusy: true, activities: [thinking] });
    const details = h.get<HTMLDetailsElement>('[data-activity-id="t1"]');
    const summary = h.get<HTMLElement>('[data-activity-id="t1"] summary');
    details.open = true;
    await act(async () => details.dispatchEvent(new h.dom.window.Event("toggle")));
    summary.focus();
    await h.render({ chatBusy: true, activities: [thinking], messages: [{ id: "m1", role: "assistant", text: "First reply" }] });
    assert.equal(h.get('[data-activity-id="t1"]'), details);
    assert.equal(h.dom.window.document.activeElement, summary);
    assert.equal(details.open, true);
  } finally { await h.close(); }
});
