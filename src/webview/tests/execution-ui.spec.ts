import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import type { ActivityItem } from "../../extension/contracts/runtimeLifecycle.js";
import type { ApprovalCard } from "../../extension/editor-tools/toolApproval.js";
import { parseHostMessage } from "../parse-host-message.js";
import { readyState, uiHarness } from "./react-harness.js";

const thinking: ActivityItem = { id: "t1", kind: "thinking", messageId: "m1", text: "Actual upstream text", status: "thinking", truncated: false };
const tool: ActivityItem = { id: "tool1", kind: "tool", messageId: "m1", tool: "write", input: '{"path":"a"}', text: "first", status: "preparing", truncated: false };
const card: ApprovalCard = {
  id: "approval1", tool: "write", toolCallId: "tool1", input: '{"path":"a","content":"<script>literal</script>"}', scope: null,
  expiresAt: Date.now() + 120_000,
};
const message = 'textarea[aria-label="Message"]';
const send = 'button[aria-label="Send message"]';
const stop = 'button[aria-label="Stop current task"]';
const thinkingDetails = 'details[aria-label="Thinking details"]';
const toolDetails = 'details[aria-label="Tool details"]';

test("mounted React conversation keeps incremental nodes, expansion and slider interaction stable", async () => {
  const h = await uiHarness();
  try {
    await h.render({ messages: [{ id: "m1", role: "assistant", text: "Hello" }], activities: [thinking, tool] });
    const row = h.get(".candidate__message");
    const thinkingView = h.get<HTMLDetailsElement>(thinkingDetails);
    const toolView = h.get<HTMLDetailsElement>(toolDetails);
    await h.click(`${thinkingDetails} > summary`);
    await act(async () => thinkingView.dispatchEvent(new h.dom.window.Event("toggle")));
    assert.equal(thinkingView.open, true);

    await h.click("#model-effort-trigger");
    const slider = h.get<HTMLInputElement>("#thinking-slider");
    slider.value = "2";
    await act(async () => slider.dispatchEvent(new h.dom.window.Event("input", { bubbles: true })));
    assert.equal(slider.value, "2");

    await h.click("#model-current");
    const modelItem = h.get<HTMLButtonElement>("#model-list button");
    modelItem.focus();
    const main = h.get(".candidate__messages");
    Object.defineProperties(main, { scrollHeight: { configurable: true, value: 1000 }, clientHeight: { configurable: true, value: 300 } });
    main.scrollTop = 120;
    await act(async () => main.dispatchEvent(new h.dom.window.Event("scroll")));
    await h.render({
      messages: [{ id: "m1", role: "assistant", text: "Hello world" }],
      activities: [{ ...thinking, text: "Updated thinking" }, { ...tool, status: "executing", text: "first second", truncated: true }],
    });
    assert.equal(h.get(".candidate__message") === row, true);
    assert.match(row.textContent ?? "", /Hello world/);
    assert.equal(h.get(thinkingDetails) === thinkingView, true);
    assert.equal(thinkingView.open, true);
    assert.match(toolView.querySelectorAll("pre")[1]?.textContent ?? "", /first second/);
    assert.match(h.get(toolDetails).textContent ?? "", /Truncated/);
    assert.equal(h.get<HTMLInputElement>("#thinking-slider").value, "2");
    assert.equal(h.get("#model-list").hidden, false);
    assert.equal(h.get("#model-list button") === modelItem, true);
    assert.equal(h.dom.window.document.activeElement === modelItem, true);
    assert.equal(main.scrollTop, 120);
    main.scrollTop = 700;
    await act(async () => main.dispatchEvent(new h.dom.window.Event("scroll")));

    await h.render({ messages: [{ id: "m1", role: "assistant", text: "Hello world" }], activities: [] });
    assert.equal(h.root.querySelector(thinkingDetails) === null, true);
    assert.equal(main.scrollTop, 1000);
  } finally {
    await h.close();
  }
});

test("mounted React approvals expose literal input and scope, lock one decision, and revoke grants", async () => {
  for (const decision of ["once", "session", "deny"]) {
    const h = await uiHarness();
    try {
      await h.render({ approvals: [{ ...card, scope: "exact scope" }], grants: [{ id: "g1", scope: "full exact scope" }] });
      const approval = h.get<HTMLElement>('[data-approval-id="approval1"]');
      assert.equal(approval.querySelector(".approval-input")?.textContent, card.input);
      assert.match(approval.querySelector(".grant-scope")?.textContent ?? "", /exact scope/);
      const buttons = approval.querySelectorAll<HTMLButtonElement>("[data-decision]");
      assert.equal(buttons.length, 3);
      await h.click(`[data-decision="${decision}"]`);
      assert.deepEqual(h.sent.at(-1), { version: 3, type: "decideApproval", generation: 1, viewId: "view", id: "approval1", decision });
      assert.ok([...buttons].every(button => button.disabled));
      await h.click(".candidate-permissions > summary");
      await h.click('[data-grant-action="revoke"]');
      assert.equal((h.sent.at(-1) as { type: string }).type, "revokeGrant");
      await h.render({ approvals: [], grants: [] });
      assert.equal(h.root.querySelector("#approvals") === null, true);
      assert.equal(h.root.querySelectorAll("[data-grant-action]").length, 0);
    } finally {
      await h.close();
    }
  }

  const h = await uiHarness();
  try {
    await h.render({ approvals: [card] });
    const buttons = h.get<HTMLElement>("#approvals").querySelectorAll<HTMLButtonElement>("[data-decision]");
    assert.equal(buttons.length, 3);
    assert.equal(buttons[1].disabled, true);
    await h.render({ approvals: [{ ...card, expiresAt: 0 }] });
    const expired = h.get<HTMLElement>("#approvals").querySelectorAll<HTMLButtonElement>("[data-decision]");
    assert.equal(expired.length, 3);
    assert.ok([...expired].every(button => button.disabled));
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

    const buttonsFor = (id: string) => {
      const buttons = [...h.get<HTMLElement>(`[data-approval-id="${id}"]`).querySelectorAll<HTMLButtonElement>("[data-decision]")];
      assert.equal(buttons.length, 3);
      return buttons;
    };
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
    assert.match(h.get(".candidate__progress").textContent ?? "", /Working/);
    assert.equal(h.get<HTMLButtonElement>(stop).disabled, false);
    assert.equal(h.get<HTMLInputElement>("#thinking-slider").disabled, false);
    assert.match(h.get("#pending-settings").textContent ?? "", /Next turn/);
    await h.input("draft");
    await h.click(stop);
    assert.equal((h.sent.at(-1) as { type: string }).type, "stopChat");
    assert.equal(h.get<HTMLTextAreaElement>(message).value, "draft");
    const buttons = h.get<HTMLElement>("#approvals").querySelectorAll<HTMLButtonElement>("[data-decision]");
    assert.equal(buttons.length, 3);
    assert.ok([...buttons].every(button => button.disabled));

    await h.render({ runtime: "stopping", execution: "stopping", busy: true, approvals: [card] });
    assert.equal(h.get<HTMLButtonElement>(stop).disabled, true);
    assert.equal(h.get<HTMLInputElement>("#thinking-slider").disabled, true);
    assert.match(h.get(".candidate__progress").textContent ?? "", /Stopping|settle/);
    await h.render({ chatBusy: false, execution: "idle", runtime: "ready", busy: false, approvals: [] });
    assert.equal(h.root.querySelector(stop) === null, true);
    assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
    await h.click("details.candidate-permissions > summary");
    assert.match(h.get(".candidate-permissions").textContent ?? "", /not a sandbox/);
  } finally {
    await h.close();
  }
});

test("composer keeps the model picker and Execution profile from staying open together", async () => {
  const h = await uiHarness();
  try {
    const permissions = h.get<HTMLDetailsElement>(".candidate-permissions");
    await act(async () => {
      permissions.open = true;
      permissions.dispatchEvent(new h.dom.window.Event("toggle", { bubbles: true }));
    });
    assert.equal(permissions.open, true);
    await h.click("#model-effort-trigger");
    assert.equal(h.get("#model-popover").hidden, false);
    assert.equal(permissions.open, false, "opening the model picker closes Execution profile");
    await act(async () => {
      permissions.open = true;
      permissions.dispatchEvent(new h.dom.window.Event("toggle", { bubbles: true }));
    });
    assert.equal(permissions.open, true);
    assert.equal(h.get("#model-popover").hidden, true, "opening Execution profile closes the model picker");
  } finally { await h.close(); }
});

test("generation changes clear old activity and approval nodes without reviving stale projections", async () => {
  const h = await uiHarness();
  try {
    await h.render({ activities: [thinking], approvals: [card] });
    assert.equal(h.root.querySelectorAll(".candidate__message").length, 1);
    assert.equal(h.root.querySelectorAll(thinkingDetails).length, 1);
    assert.ok(h.root.querySelector("#approvals"));
    await h.render({ generation: 2, messages: [], activities: [], approvals: [] });
    assert.equal(h.root.querySelectorAll(".candidate__message").length, 0);
    assert.equal(h.root.querySelectorAll(thinkingDetails).length, 0);
    assert.equal(h.root.querySelector("#approvals") === null, true);
    const stale = { ...readyState, messages: [{ id: "late", role: "assistant" as const, text: "late" }], activities: [thinking], approvals: [card] };
    assert.equal(parseHostMessage(stale)?.type, "workspaceState", "the stale frame must be valid before the generation guard rejects it");
    await h.receive(stale);
    assert.equal(h.root.querySelectorAll(".candidate__message").length, 0);
    assert.equal(h.root.querySelector(thinkingDetails) === null, true);
    assert.equal(h.root.querySelector("#approvals") === null, true);
  } finally {
    await h.close();
  }
});

test("thinking node keeps focus and expansion when the first assistant text arrives", async () => {
  const h = await uiHarness();
  try {
    await h.render({ chatBusy: true, activities: [thinking] });
    const details = h.get<HTMLDetailsElement>(thinkingDetails);
    const summary = h.get<HTMLElement>(`${thinkingDetails} summary`);
    details.open = true;
    await act(async () => details.dispatchEvent(new h.dom.window.Event("toggle")));
    summary.focus();
    await h.render({ chatBusy: true, activities: [thinking], messages: [{ id: "m1", role: "assistant", text: "First reply" }] });
    assert.equal(h.get(thinkingDetails) === details, true);
    assert.equal(h.dom.window.document.activeElement === summary, true);
    assert.equal(details.open, true);
  } finally { await h.close(); }
});

test("candidate displays validated retry, compaction and terminal states without hiding Stop or clearing drafts", async () => {
  const h = await uiHarness(true, true);
  try {
    await h.input("new candidate draft", ".candidate__composer textarea");
    for (const [execution, label] of [["retrying", "Retrying"], ["compacting", "Compacting context"]] as const) {
      await h.render({ chatBusy: true, execution });
      assert.match(h.get(".candidate__progress").textContent ?? "", new RegExp(label));
      assert.equal(h.get<HTMLButtonElement>(".candidate__send").disabled, false);
      assert.equal(h.get<HTMLButtonElement>(".candidate__send").getAttribute("aria-label"), "Stop current task");
    }
    for (const [execution, label] of [["completed", "Task completed"], ["stopped", "Task stopped"], ["failed", "Task failed"]] as const) {
      await h.render({ chatBusy: false, execution });
      assert.match(h.get(".candidate__progress").textContent ?? "", new RegExp(label));
      assert.equal(h.get<HTMLTextAreaElement>(".candidate__composer textarea").value, "new candidate draft");
    }
  } finally { await h.close(); }
});

test("runtime loss keeps the newer draft readable without admitting actions", async () => {
  const h = await uiHarness();
  try {
    await h.input("Newer unsent draft after runtime loss");
    await h.render({ runtime: "error", runtimeDetail: "Runtime disconnected", chatBusy: false, execution: "failed" });
    const input = h.get<HTMLTextAreaElement>(message);
    assert.equal(input.value, "Newer unsent draft after runtime loss");
    assert.equal(input.readOnly, true);
    assert.equal(input.disabled, false, "the retained draft must remain focusable for copying");
    assert.match(h.get(".candidate__progress").textContent ?? "", /failed/i);
    assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
    const before = h.sent.length;
    await h.click(send);
    assert.equal(h.sent.length, before);
    input.focus(); assert.equal(h.dom.window.document.activeElement === input, true);
  } finally { await h.close(); }
});
