import assert from "node:assert/strict";
import type { TestContext } from "node:test";
import { act } from "react";
import { JSDOM } from "jsdom";
import type { PreviewScenario } from "../preview/scenarios.js";

export async function candidateHarness(t: TestContext, scenario: PreviewScenario = "empty") {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "http://localhost" });
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const globals: Record<string, unknown> = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, HTMLInputElement: dom.window.HTMLInputElement, HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
    Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, KeyboardEvent: dom.window.KeyboardEvent, IS_REACT_ACT_ENVIRONMENT: true };
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const root = dom.window.document.getElementById("root"); assert.ok(root);
  const { mountCandidatePreview } = await import("../preview/candidate-preview.js");
  const { createPreviewLanguage } = await import("../preview/ui-language.js");
  const language = createPreviewLanguage();
  let preview: ReturnType<typeof mountCandidatePreview> | undefined;
  t.after(async () => {
    try { await act(async () => preview?.dispose()); }
    finally {
      dom.window.close();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    }
  });
  await act(async () => { preview = mountCandidatePreview(root, scenario, language); });
  const get = <T extends HTMLElement = HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector); assert.ok(element, `Missing ${selector}`); return element;
  };
  const click = (selector: string) => act(async () => get(selector).click());
  const input = (value: string) => act(async () => {
    const element = get<HTMLTextAreaElement>('textarea[aria-label="Message"]');
    Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")?.set?.call(element, value);
    element.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    element.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
  const advance = (milliseconds: number) => act(async () => { t.mock.timers.tick(milliseconds); });
  return { root, get, click, input, advance, dom,
    recover: () => act(async () => preview?.recover()),
    changeSources: () => act(async () => preview?.changeSources()),
    completeReview: () => act(async () => preview?.completeReview()),
    loseReview: () => act(async () => preview?.loseReview()),
    queueApprovals: () => act(async () => preview?.queueApprovals()),
    dispose: () => act(async () => preview?.dispose()),
    reset: () => act(async () => { preview?.dispose(); preview = mountCandidatePreview(root, "empty", language); }),
  };
}
