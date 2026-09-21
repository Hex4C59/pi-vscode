import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import type { WorkspaceStateMessage } from "../../extension/webviewMessages.js";
import { getPlaceholderHtml } from "../placeholderHtml.js";

// Equivalent ready DTO to the host settings fixture, without constructing a provider.
const readyState: WorkspaceStateMessage = {
  version: 1, type: "workspaceState", generation: 1, status: "eligible",
  folder: { name: "/project", path: "/project" }, choice: "allow", busy: false, error: null,
  runtime: "ready", runtimeDetail: null, messages: [], chatBusy: false, chatError: null,
  chatModel: "A / one", thinkingLevel: "medium", thinkingLevels: ["off", "medium", "high"],
  availableModels: [{ provider: "A", modelId: "one", label: "One" }, { provider: "B", modelId: "two", label: "Two" }],
  pendingModel: null, pendingThinkingLevel: null, modelBusy: false, modelError: null,
  activities: [], approvals: [], grants: [], execution: "idle", controlledExecution: true,
};

test("UI streaming controls stage selections; pending and applied remain distinct; applying blocks send", async () => {
  class Element {
    textContent = ""; hidden = false; disabled = false; value = ""; max = "0";
    children: Element[] = [];
    attributes = new Map<string, string>();
    listeners = new Map<string, (event: unknown) => void>();
    style = { setProperty: (_name: string, _value: string) => undefined };
    setAttribute(name: string, value: string) { this.attributes.set(name, value); }
    addEventListener(name: string, callback: (event: unknown) => void) { this.listeners.set(name, callback); }
    replaceChildren() { this.children = []; }
    appendChild(child: Element) { this.children.push(child); }
    fire(name: string, event: unknown = {}) { this.listeners.get(name)?.(event); }
  }
  const elements = new Map<string, Element>();
  const element = (id: string) => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id)!;
  };
  const windows = new Map<string, (event: unknown) => void>();
  const outgoing: unknown[] = [];
  const html = getPlaceholderHtml("ui-test");
  const script = html.match(/<script nonce="ui-test">([\s\S]*?)<\/script>/)?.[1]; assert.ok(script);
  runInNewContext(script, {
    acquireVsCodeApi: () => ({ postMessage: (message: unknown) => outgoing.push(message) }),
    document: { getElementById: element, createElement: () => new Element() },
    window: { addEventListener: (name: string, callback: (event: unknown) => void) => {
      const previous = windows.get(name);
      windows.set(name, event => { previous?.(event); callback(event); });
    } },
  });
  const state = { ...readyState, chatBusy: true, pendingThinkingLevel: "high",
    pendingModel: { provider: "B", modelId: "two", label: "Two" } };
  const render = (patch: Partial<WorkspaceStateMessage> = {}) => windows.get("message")?.({ data: { ...state, ...patch } });
  render();
  assert.equal(element("model-effort-trigger").disabled, false);
  assert.equal(element("thinking-slider").disabled, false);
  assert.equal(element("send-chat").disabled, true);
  assert.equal(element("model-effort-trigger").textContent, "A / one · medium");
  assert.match(element("pending-settings").textContent, /Next turn \(pending\): B \/ Two · thinking: high/);
  assert.match(element("thinking-level-label").textContent, /Applied: medium.*pending.*high/);
  assert.equal(element("model-list").hidden, true);
  element("model-effort-trigger").fire("click");
  element("model-current").fire("click");
  assert.equal(element("model-list").hidden, false);
  element("model-list").children[1].fire("click");
  assert.equal((outgoing.at(-1) as { type: string }).type, "setChatModel");
  assert.equal(element("model-list").hidden, true);
  element("thinking-slider").fire("change", { target: { value: "0" } });
  assert.equal((outgoing.at(-1) as { level: string }).level, "off");
  render({ chatBusy: false, modelBusy: true });
  assert.equal(element("model-effort-trigger").disabled, true);
  assert.equal(element("thinking-slider").disabled, true);
  assert.ok(element("model-list").children.every(item => item.disabled));
  assert.match(element("pending-settings").textContent, /Applying next turn/);
  element("chat-input").value = "keep draft";
  const count = outgoing.length;
  element("chat-input").fire("keydown", { key: "Enter", preventDefault() {} });
  assert.equal(outgoing.length, count);
  assert.equal(element("chat-input").value, "keep draft");
  render({ chatBusy: false, modelBusy: false, pendingModel: null, pendingThinkingLevel: null,
    modelError: "Requested thinking level is not supported." });
  assert.equal(element("pending-settings").hidden, true);
  assert.equal(element("model-status-error").hidden, false);
  assert.equal(element("send-chat").disabled, false);
  element("model-effort-trigger").fire("click");
  windows.get("keydown")?.({ key: "Escape", preventDefault() {} });
  assert.equal(element("model-popover").hidden, true);
  element("model-effort-trigger").fire("click");
  render({ generation: state.generation + 1 });
  assert.equal(element("model-popover").hidden, true);
  assert.match(html, /height: 14px; border-radius: 7px/);
  assert.match(html, /#168BFF/);
});
