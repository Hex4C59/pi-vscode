import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { act } from "react";
import type { AttachmentStateMessage, WebviewMessage, WorkspaceStateMessage } from "../../extension/webviewProtocol.js";
import { parseWebviewMessage } from "../../extension/webviewMessages.js";
import type { WebviewBridge } from "../bridge.js";

export const readyState: WorkspaceStateMessage = {
  version: 2, type: "workspaceState", viewId: "view", generation: 1, status: "eligible", folder: { name: "project", path: "/project" },
  choice: "allow", busy: false, error: null, runtime: "ready", runtimeDetail: null, messages: [], chatBusy: false, chatError: null,
  chatModel: "A / one", thinkingLevel: "medium", thinkingLevels: ["off", "medium", "high"],
  availableModels: [{ provider: "A", modelId: "one", label: "One" }, { provider: "B", modelId: "two", label: "Two" }],
  pendingModel: null, pendingThinkingLevel: null, modelBusy: false, modelError: null, activities: [], approvals: [], grants: [], execution: "idle", controlledExecution: true,
};
export function attachmentState(patch: Partial<AttachmentStateMessage> = {}): AttachmentStateMessage {
  return { version: 2, type: "attachmentState", viewId: "view", generation: 1, draft: { revision: 0, text: "", acceptedEditSequence: 0, attachments: [] },
    preparation: "idle", result: null, historyCount: 0, retainedBytes: 0, lastSubmission: null, ...patch };
}
export async function uiHarness(initial = true) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "http://localhost" });
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const globals: Record<string, unknown> = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, HTMLInputElement: dom.window.HTMLInputElement, HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
    Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, KeyboardEvent: dom.window.KeyboardEvent, IS_REACT_ACT_ENVIRONMENT: true };
  for (const [key, value] of Object.entries(globals)) { previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  const listeners = new Set<(message: unknown) => void>();
  const sent: WebviewMessage[] = [];
  const bridge: WebviewBridge = { postMessage(message) { assert.ok(parseWebviewMessage(message), `invalid outbound ${JSON.stringify(message)}`); sent.push(message); },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; } };
  const root = dom.window.document.getElementById("root"); assert.ok(root);
  const { mountApp } = await import("../mount.js");
  let dispose: () => void = () => undefined;
  await act(async () => { dispose = mountApp(root, bridge); });
  const receive = async (value: unknown) => { await act(async () => { for (const listener of [...listeners]) listener(value); }); };
  const render = (patch: Partial<WorkspaceStateMessage> = {}) => receive({ ...readyState, ...patch });
  const get = <T extends HTMLElement = HTMLElement>(selector: string): T => { const el = root.querySelector<T>(selector); assert.ok(el, `Missing ${selector}`); return el; };
  const click = async (selector: string) => { await act(async () => { get(selector).click(); }); };
  const input = async (value: string, selector = "#chat-input") => { await act(async () => {
    const el = get<HTMLTextAreaElement>(selector);
    // Bypass React's value tracker just as a native user edit would.
    Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")?.set?.call(el, value);
    el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    el.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  }); };
  if (initial) { await receive(attachmentState()); await render(); }
  return { dom, root, get, click, input, receive, render, sent, listeners,
    async unmount() { await act(async () => dispose()); },
    async close() { await act(async () => dispose()); dom.window.close(); for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); } },
  };
}
