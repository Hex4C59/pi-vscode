import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { getPlaceholderHtml } from "../webview/placeholderHtml.js";

/** Scripted DOM seam, not browser/F5 rendering evidence. Collected by npm test. */
class Element {
  textContent = ""; hidden = false; disabled = false; value = ""; max = "0";
  open = false; className = ""; type = "";
  scrollTop = 0; scrollHeight = 1000; clientHeight = 300;
  parent?: Element;
  children: Element[] = [];
  attributes = new Map<string, string>();
  listeners = new Map<string, (event: unknown) => void>();
  style = { setProperty: (_name: string, _value: string) => undefined };
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  addEventListener(name: string, callback: (event: unknown) => void) { this.listeners.set(name, callback); }
  replaceChildren() { for (const child of this.children) child.parent = undefined; this.children = []; }
  appendChild(child: Element) { child.remove(); this.children.push(child); child.parent = this; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); this.parent = undefined; }
  fire(name = "click", event: unknown = {}) { this.listeners.get(name)?.(event); }
}
function harness() {
  const elements = new Map<string, Element>();
  const element = (id: string) => { let el = elements.get(id); if (!el) { el = new Element(); elements.set(id, el); } return el; };
  const listeners = new Map<string, (event: unknown) => void>();
  const sent: Record<string, unknown>[] = [];
  const document = { getElementById: element, createElement: () => new Element(), activeElement: null as Element | null };
  const html = getPlaceholderHtml("execution-test");
  const script = html.match(/<script nonce="execution-test">([\s\S]*?)<\/script>/)?.[1]; assert.ok(script);
  runInNewContext(script, {
    acquireVsCodeApi: () => ({ postMessage: (message: Record<string, unknown>) => sent.push(message) }), document,
    window: { addEventListener: (name: string, listener: (event: unknown) => void) => listeners.set(name, listener) },
  });
  const state = { version: 1, type: "workspaceState", generation: 2, status: "eligible", runtime: "ready", busy: false,
    messages: [{ id: "m1", role: "assistant", text: "Hello" }], activities: [], approvals: [], grants: [], chatBusy: true,
    chatModel: "Model", thinkingLevel: "low", thinkingLevels: ["low", "high"], availableModels: [{ provider: "p", modelId: "m", label: "Model" }], execution: "waiting" };
  return { element, sent, document, html, render: (patch: Record<string, unknown> = {}) => listeners.get("message")?.({ data: { ...state, ...patch } }) };
}
const thinking = { id: "t1", kind: "thinking", messageId: "m1", text: "Actual upstream text", status: "thinking", truncated: false };
const tool = { id: "tool1", kind: "tool", messageId: "m1", tool: "write", input: '{"path":"a"}', text: "first", status: "preparing", truncated: false };
const card = { id: "approval1", tool: "write", toolCallId: "tool1", input: '{"path":"a","content":"<script>literal</script>"}', scope: null, expiresAt: Date.now() + 120000 };

test("execution UI keeps incremental nodes, expansion, focus, scroll and cumulative output", () => {
  const h = harness(); h.render({ activities: [thinking, tool] });
  const row = h.element("messages").children[0];
  const steps = row.children[0]; const thinkingView = steps.children[0]; const toolView = steps.children[1];
  assert.equal(thinkingView.open, false); thinkingView.open = true;
  const menu = h.element("model-list").children[0]; h.document.activeElement = menu;
  h.element("model-effort-trigger").fire(); h.element("model-current").fire();
  h.element("main").scrollTop = 120;
  h.element("thinking-slider").value = "1"; // A drag in progress must not reset on a text delta.
  h.render({ messages: [{ id: "m1", role: "assistant", text: "Hello world" }], activities: [{ ...thinking, text: "Updated thinking" }, { ...tool, status: "executing", text: "first second", truncated: true }] });
  assert.equal(h.element("messages").children[0], row); assert.equal(row.children[1].textContent, "Hello world");
  assert.equal(steps.children[0], thinkingView); assert.equal(thinkingView.open, true);
  assert.equal(thinkingView.children[4].textContent, "Updated thinking");
  assert.equal(toolView.children[4].textContent, "first second"); assert.match(toolView.children[5].textContent, /Truncated/);
  assert.equal(h.element("model-list").children[0], menu); assert.equal(h.document.activeElement, menu);
  assert.equal(h.element("model-list").hidden, false); assert.equal(h.element("main").scrollTop, 120);
  assert.equal(h.element("thinking-slider").value, "1");
  h.element("main").scrollTop = 700; h.render({ activities: [thinking, tool] });
  assert.equal(h.element("main").scrollTop, 1000);
  h.render({ activities: [] }); assert.equal(steps.children.length, 0);
});

test("approval UI exposes full literal input and exact scope, sends once/session/deny and revokes grants", () => {
  for (const [index, decision] of ["once", "session", "deny"].entries()) {
    const h = harness(); h.render({ approvals: [{ ...card, scope: 'exact scope' }], grants: [{ id: "g1", scope: "full exact scope" }] });
    const approval = h.element("approvals").children[0];
    assert.equal(approval.children[1].textContent, card.input);
    assert.match(approval.children[2].textContent, /exact scope/);
    approval.children[3].children[index].fire();
    assert.equal(JSON.stringify(h.sent.at(-1)), JSON.stringify({ version: 1, type: "decideApproval", generation: 2, id: "approval1", decision }));
    assert.ok(approval.children[3].children.every(button => button.disabled));
    h.element("grants").children[0].children[1].fire(); assert.equal(h.sent.at(-1)?.type, "revokeGrant");
    h.render({ approvals: [], grants: [] }); assert.equal(h.element("approvals").children.length, 0); assert.equal(h.element("grants").children.length, 0);
  }
  const h = harness(); h.render({ approvals: [card] });
  const actions = h.element("approvals").children[0].children[3].children;
  assert.equal(actions[1].disabled, true); const count = h.sent.length; actions[1].fire(); assert.equal(h.sent.length, count);
  h.render({ approvals: [{ ...card, expiresAt: 0 }] }); assert.ok(actions.every(button => button.disabled));
});

test("Stop stays visible through stopping, locks approvals, preserves drafts and next-turn controls", () => {
  const h = harness();
  h.render({ approvals: [card], execution: "thinking", pendingThinkingLevel: "high" });
  assert.match(h.element("execution-status").textContent, /Thinking/);
  assert.equal(h.element("stop-chat").hidden, false); assert.equal(h.element("stop-chat").disabled, false);
  assert.equal(h.element("thinking-slider").disabled, false); assert.match(h.element("pending-settings").textContent, /Next turn/);
  h.element("chat-input").value = "draft"; h.element("stop-chat").fire();
  assert.equal(h.sent.at(-1)?.type, "stopChat"); assert.equal(h.element("chat-input").value, "draft");
  assert.ok(h.element("approvals").children[0].children[3].children.every(button => button.disabled));
  h.render({ runtime: "stopping", execution: "stopping", busy: true });
  assert.equal(h.element("composer-wrap").hidden, false); assert.equal(h.element("stop-chat").disabled, true);
  assert.match(h.element("execution-status").textContent, /not rolled back/);
  h.render({ chatBusy: false, execution: "idle" }); assert.equal(h.element("stop-chat").hidden, true); assert.equal(h.element("send-chat").disabled, false);
  assert.match(h.html, /Third-party extensions are disabled/); assert.match(h.html, /not in a sandbox/);
  assert.match(h.html, /height: 14px; border-radius: 7px/); assert.match(h.html, /#168BFF/);
});

test("generation changes clear cards and stale snapshots do not restore them; missing thinking stays absent", () => {
  const h = harness(); h.render({ activities: [thinking], approvals: [card] });
  h.render({ generation: 3, messages: [], activities: [] });
  assert.equal(h.element("messages").children.length, 0); assert.equal(h.element("approvals").children.length, 0);
  h.render({ activities: [thinking], approvals: [card] }); assert.equal(h.element("messages").children.length, 0);
  h.render({ generation: 3, activities: [], execution: "thinking" });
  assert.equal(h.element("messages").children[0].children[0].children.length, 0);
  assert.match(h.element("execution-status").textContent, /Thinking/);
});
