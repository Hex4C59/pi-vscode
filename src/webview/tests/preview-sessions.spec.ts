import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import type { HostMessage } from "../../extension/webviewProtocol.js";
import { parseHostMessage } from "../host-messages.js";
import { PreviewBridge } from "../preview/fixtures.js";

async function previewHarness(t: TestContext) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const dom = new JSDOM("<!doctype html><div id=\"root\"></div>", { url: "http://localhost" });
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const globals: Record<string, unknown> = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    KeyboardEvent: dom.window.KeyboardEvent,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }

  const bridge = new PreviewBridge("sessions");
  const messages: HostMessage[] = [];
  bridge.subscribe(value => {
    const parsed = parseHostMessage(value);
    assert.ok(parsed, `invalid preview host message: ${JSON.stringify(value)}`);
    messages.push(parsed);
  });
  const root = dom.window.document.getElementById("root");
  assert.ok(root);
  const { mountApp } = await import("../mount.js");
  let dispose: () => void = () => undefined;
  await act(async () => { dispose = mountApp(root, bridge); });

  const get = <T extends HTMLElement = HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    assert.ok(element, `Missing ${selector}`);
    return element;
  };
  const click = async (selector: string) => {
    await act(async () => { get(selector).click(); });
  };
  const input = async (value: string) => {
    await act(async () => {
      const element = get<HTMLTextAreaElement>("#chat-input");
      Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")?.set?.call(element, value);
      element.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      element.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    });
  };
  const advance = async (milliseconds: number) => {
    await act(async () => {
      t.mock.timers.tick(milliseconds);
      await Promise.resolve();
    });
  };
  const latest = <T extends HostMessage["type"]>(type: T): Extract<HostMessage, { type: T }> => {
    const message = [...messages].reverse().find(value => value.type === type);
    assert.ok(message, `Missing ${type}`);
    return message as Extract<HostMessage, { type: T }>;
  };
  const send = (message: { type: "getSavedSessions"; page: number }) => {
    const workspace = latest("workspaceState");
    bridge.postMessage({ version: 2, generation: workspace.generation, viewId: workspace.viewId, ...message });
  };
  const close = async () => {
    await act(async () => dispose());
    bridge.dispose();
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  };

  return { root, bridge, messages, get, click, input, advance, latest, send, close };
}

test("synthetic sessions fixture lists a labelled 16-entry catalogue and enforces page bounds", async t => {
  const h = await previewHarness(t);
  try {
    assert.match(h.get("#sessions-current").textContent ?? "", /Synthetic live session/);
    await h.click("#sessions-toggle");
    assert.match(h.get("#sessions-notice").textContent ?? "", /Loading saved conversations/);
    await h.advance(80);
    assert.equal(h.root.querySelectorAll(".sessions-entry").length, 16);
    assert.match(h.get("#sessions-page-status").textContent ?? "", /Page 1 of 3 · 33 saved conversations/);
    assert.match(h.get(".sessions-entry").textContent ?? "", /Synthetic saved session 01/);
    assert.match(h.get(".sessions-excerpt").textContent ?? "", /browser preview/i);
    assert.equal(h.get<HTMLButtonElement>("#sessions-previous").disabled, true);

    await h.click("#sessions-next");
    await h.advance(80);
    assert.equal(h.root.querySelectorAll(".sessions-entry").length, 16);
    assert.match(h.get("#sessions-page-status").textContent ?? "", /Page 2 of 3 · 33 saved conversations/);

    await h.click("#sessions-next");
    await h.advance(80);
    assert.equal(h.root.querySelectorAll(".sessions-entry").length, 1);
    assert.match(h.get("#sessions-page-status").textContent ?? "", /Page 3 of 3 · 33 saved conversations/);
    assert.equal(h.get<HTMLButtonElement>("#sessions-next").disabled, true);

    const beforeOutOfBounds = h.messages.length;
    h.send({ type: "getSavedSessions", page: 3 });
    assert.equal(h.messages.length, beforeOutOfBounds, "the synthetic host must not invent an out-of-range page");
  } finally {
    await h.close();
  }
});

test("synthetic New and Restore confirm before committing a generation and then clear the draft", async t => {
  const h = await previewHarness(t);
  try {
    await h.click("#sessions-toggle");
    await h.advance(80);
    await h.input("draft retained only until the synthetic handoff commits");
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "draft retained only until the synthetic handoff commits");
    const beforeNew = h.latest("workspaceState").generation;
    await h.click("#sessions-new");
    assert.match(h.get("#sessions-phase").textContent ?? "", /native confirmation/);
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "draft retained only until the synthetic handoff commits");
    const newSwitchStart = h.messages.length;
    await h.advance(120);
    const newSwitchingIndex = h.messages.findIndex((message, index) => index >= newSwitchStart && message.type === "sessionState" && message.phase === "switching");
    const newAttachmentIndex = h.messages.findIndex((message, index) => index >= newSwitchStart && message.type === "attachmentState" && message.generation > beforeNew);
    assert.ok(newSwitchingIndex >= 0);
    assert.ok(newAttachmentIndex > newSwitchingIndex, "switching must precede the new-generation attachment projection");
    const newSwitching = h.messages[newSwitchingIndex];
    assert.ok(newSwitching.type === "sessionState");
    assert.equal(newSwitching.generation, beforeNew + 1);
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "");
    assert.match(h.get("#sessions-current").textContent ?? "", /New conversation/);
    assert.equal(h.root.querySelector("#saved-history"), null);

    await h.input("draft retained until restore commits");
    const beforeRestore = h.latest("workspaceState").generation;
    await h.click('[data-session-action="restore"][data-session-id="preview-session-01"]');
    assert.match(h.get("#sessions-phase").textContent ?? "", /native confirmation/);
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "draft retained until restore commits");
    const restoreSwitchStart = h.messages.length;
    await h.advance(120);
    const restoreSwitchingIndex = h.messages.findIndex((message, index) => index >= restoreSwitchStart && message.type === "sessionState" && message.phase === "switching");
    const restoreAttachmentIndex = h.messages.findIndex((message, index) => index >= restoreSwitchStart && message.type === "attachmentState" && message.generation > beforeRestore);
    assert.ok(restoreSwitchingIndex >= 0);
    assert.ok(restoreAttachmentIndex > restoreSwitchingIndex, "restore must clear attachments only after generation switching");
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "");
    assert.match(h.get("#sessions-current").textContent ?? "", /Synthetic saved session 01/);
    assert.equal(h.root.querySelectorAll("[data-saved-history-row]").length, 32);
  } finally {
    await h.close();
  }
});

test("restored synthetic history keeps literal HTML inert and navigates bounded 8192-character previews", async t => {
  const h = await previewHarness(t);
  try {
    await h.click("#sessions-toggle");
    await h.advance(80);
    await h.click('[data-session-action="restore"][data-session-id="preview-session-01"]');
    await h.advance(120);

    assert.match(h.get("#saved-history-page-status").textContent ?? "", /Entries 34–65 of 65\. Page 1 of 3\./);
    assert.equal(h.root.querySelectorAll("[data-saved-history-row]").length, 32);
    await h.click('[data-saved-history-preview="synthetic-history-65"]');
    await h.advance(80);
    const firstChunk = h.get("#saved-history-preview-text");
    assert.equal(firstChunk.textContent?.length, 8192);
    assert.match(firstChunk.textContent ?? "", /^<article data-fixture="synthetic-session">/);
    assert.equal(firstChunk.querySelector("article"), null, "literal history must not become executable HTML");
    assert.equal(h.get<HTMLButtonElement>("#saved-history-preview-next").disabled, false);

    await h.click("#saved-history-preview-next");
    await h.advance(80);
    assert.ok((h.get("#saved-history-preview-text").textContent?.length ?? 0) > 0);
    assert.ok((h.get("#saved-history-preview-text").textContent?.length ?? 0) <= 8192);
    assert.match(h.get("#saved-history-preview").textContent ?? "", /Characters 8193–/);

    await h.click("#saved-history-preview-previous");
    await h.advance(80);
    assert.equal(h.get("#saved-history-preview-text").textContent?.length, 8192);
    assert.match(h.get("#saved-history-preview-text").textContent ?? "", /^<article data-fixture="synthetic-session">/);

    await h.click("#saved-history-preview-close");
    await h.click("#saved-history-earlier");
    await h.advance(80);
    assert.match(h.get("#saved-history-page-status").textContent ?? "", /Entries 2–33 of 65\. Page 2 of 3\./);
    await h.click("#saved-history-earlier");
    await h.advance(80);
    assert.match(h.get("#saved-history-page-status").textContent ?? "", /Entries 1–1 of 65\. Page 3 of 3\./);
    assert.equal(h.get<HTMLButtonElement>("#saved-history-earlier").disabled, true);
  } finally {
    await h.close();
  }
});
