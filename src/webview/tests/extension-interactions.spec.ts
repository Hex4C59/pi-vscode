import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement, Fragment, type ReactElement } from "react";
import type { Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import type { ExecutionProfileProjection, ExtensionInteractionProjection, InteractionAnswer } from "../../extension/contracts/index.js";
import { ExecutionProfileControls, ExtensionInteractions } from "../chat/extension-interactions.js";
import { UiTextProvider, englishUi, formatUiText, type UiLanguage } from "../components/ui-text.js";
import { chineseUi } from "../chat/ui-zh-cn.js";

const chineseLanguage: UiLanguage = { locale: "zh-CN", text: (message, values) => formatUiText(chineseUi[message], values) };
function localized(element: ReactElement, locale: "en" | "zh-CN" = "en"): ReactElement {
  return createElement(UiTextProvider, { value: locale === "zh-CN" ? chineseLanguage : englishUi }, element);
}

const globalNames = ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLSelectElement", "HTMLTextAreaElement", "Node", "Event", "MouseEvent", "KeyboardEvent", "IS_REACT_ACT_ENVIRONMENT"] as const;

async function mount(element: ReactElement) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "http://localhost" });
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const values: Record<string, unknown> = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    HTMLSelectElement: dom.window.HTMLSelectElement,
    HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
    Node: dom.window.Node,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    KeyboardEvent: dom.window.KeyboardEvent,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  for (const name of globalNames) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: values[name] });
  }
  const container = dom.window.document.getElementById("root");
  assert.ok(container);
  const { createRoot } = await import("react-dom/client");
  const root: Root = createRoot(container);
  await act(async () => root.render(element));
  return {
    dom,
    root: container,
    get<T extends HTMLElement = HTMLElement>(selector: string): T {
      const element = container.querySelector<T>(selector);
      assert.ok(element, `Missing ${selector}`);
      return element;
    },
    async render(next: ReactElement) { await act(async () => root.render(next)); },
    async close() {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [name, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else Reflect.deleteProperty(globalThis, name);
      }
    },
  };
}

function projection(active: ExtensionInteractionProjection["active"], patch: Partial<ExtensionInteractionProjection> = {}): ExtensionInteractionProjection {
  return { active, queuedCount: 0, phase: active ? "waiting" : "idle", errorCode: null, feedback: [], omittedFeedback: 0, ...patch };
}

test("select interaction submits the opaque option ID and renders labels as literal text", async () => {
  const answers: Array<{ id: string; answer: InteractionAnswer }> = [];
  const cancellations: string[] = [];
  const state = projection({
    id: "interaction-select-1",
    method: "select",
    title: "Choose <script>not markup</script>",
    origin: "trusted runtime extension; not authenticated",
    options: [{ id: "opaque-option-1", label: "First <b>literal</b>" }, { id: "opaque-option-2", label: "Second" }],
  }, { queuedCount: 2 });
  const view = await mount(createElement(ExtensionInteractions, {
    state,
    onAnswer: (id, answer) => answers.push({ id, answer }),
    onCancel: id => cancellations.push(id),
  }));
  try {
    assert.equal(view.get(".extension-interactions__title").textContent, "Choose <script>not markup</script>");
    assert.equal(view.root.querySelector("script, b") === null, true);
    assert.match(view.get('[role="status"]').textContent ?? "", /2.*queued/i);
    const select = view.get<HTMLSelectElement>('select[aria-label="Select an option"]');
    assert.equal(select.options[1].value, "opaque-option-1");
    assert.equal(select.options[1].textContent, "First <b>literal</b>");
    await act(async () => {
      select.value = "opaque-option-2";
      select.dispatchEvent(new view.dom.window.Event("change", { bubbles: true }));
    });
    await act(async () => view.get<HTMLButtonElement>('[data-action="answer"]').click());
    assert.deepEqual(answers, [{ id: "interaction-select-1", answer: { method: "select", optionId: "opaque-option-2" } }]);
    assert.equal(view.get<HTMLButtonElement>('[data-action="answer"]').disabled, true);
    await act(async () => view.get<HTMLButtonElement>('[data-action="cancel"]').click());
    assert.deepEqual(cancellations, []);
  } finally { await view.close(); }
});


test("confirm false is an answer, while Cancel remains a distinct intent", async () => {
  const answers: Array<{ id: string; answer: InteractionAnswer }> = [];
  const cancellations: string[] = [];
  const callbacks = {
    onAnswer: (id: string, answer: InteractionAnswer) => answers.push({ id, answer }),
    onCancel: (id: string) => cancellations.push(id),
  };
  const makeConfirm = (id: string) => projection({
    id,
    method: "confirm",
    title: "Apply this change?",
    message: "Choose yes or no; neither is cancellation.",
    origin: "trusted runtime extension; not authenticated",
  });
  const view = await mount(createElement(ExtensionInteractions, { state: makeConfirm("confirm-false-1"), ...callbacks }));
  try {
    const no = view.get<HTMLInputElement>('input[type="radio"][value="false"]');
    assert.equal(no.labels?.[0]?.textContent?.trim(), "No");
    await act(async () => no.click());
    await act(async () => no.dispatchEvent(new view.dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })));
    assert.deepEqual(answers, [{ id: "confirm-false-1", answer: { method: "confirm", value: false } }]);
    assert.deepEqual(cancellations, []);

    await view.render(localized(createElement(ExtensionInteractions, { state: makeConfirm("confirm-cancel-1"), ...callbacks }), "zh-CN"));
    assert.equal(view.get<HTMLButtonElement>('[data-action="cancel"]').textContent, "取消此交互");
    await act(async () => view.get<HTMLButtonElement>('[data-action="cancel"]').click());
    assert.deepEqual(cancellations, ["confirm-cancel-1"]);
    assert.equal(answers.length, 1);
  } finally { await view.close(); }
});


test("input interaction preserves and submits an empty string with Enter", async () => {
  const answers: Array<{ id: string; answer: InteractionAnswer }> = [];
  const state = projection({
    id: "interaction-input-empty",
    method: "input",
    title: "<img src=x onerror=alert(1)>",
    origin: "trusted runtime extension; not authenticated",
    placeholder: "",
  });
  const view = await mount(createElement(ExtensionInteractions, {
    state,
    onAnswer: (id, answer) => answers.push({ id, answer }),
    onCancel: () => undefined,
  }));
  try {
    const input = view.get<HTMLInputElement>('input[aria-label="Your response"]');
    assert.equal(input.value, "");
    assert.equal(input.getAttribute("placeholder"), "");
    assert.equal(view.root.querySelector("img") === null, true);
    await act(async () => input.dispatchEvent(new view.dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })));
    assert.deepEqual(answers, [{ id: "interaction-input-empty", answer: { method: "input", text: "" } }]);
    assert.equal(view.get<HTMLButtonElement>('[data-action="answer"]').disabled, true);
  } finally { await view.close(); }
});


test("editor keeps Enter for newlines and submits its empty value only with Ctrl+Enter", async () => {
  const answers: Array<{ id: string; answer: InteractionAnswer }> = [];
  const state = projection({
    id: "interaction-editor-empty",
    method: "editor",
    title: "Long response",
    origin: "trusted runtime extension; not authenticated",
    prefill: "",
  });
  const view = await mount(createElement(ExtensionInteractions, {
    state,
    onAnswer: (id, answer) => answers.push({ id, answer }),
    onCancel: () => undefined,
  }));
  try {
    const editor = view.get<HTMLTextAreaElement>('textarea[aria-label="Editor text"]');
    assert.equal(editor.value, "");
    await act(async () => editor.dispatchEvent(new view.dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })));
    assert.deepEqual(answers, []);
    await act(async () => editor.dispatchEvent(new view.dom.window.KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true, cancelable: true })));
    assert.deepEqual(answers, [{ id: "interaction-editor-empty", answer: { method: "editor", text: "" } }]);
  } finally { await view.close(); }
});

test("bounded feedback stays literal, queue and local cutoff stay labeled, and blocked projections are read-only", async () => {
  const longLiteral = `<img src=x onerror=alert(1)> **plain text**\n${"bounded-feedback-".repeat(900)}`;
  const answers: Array<{ id: string; answer: InteractionAnswer }> = [];
  const state = projection({
    id: "interaction-feedback-1",
    method: "input",
    title: "Feedback context",
    origin: "trusted runtime extension; not authenticated",
    placeholder: "Optional text",
    localCutoffAt: Date.UTC(2026, 8, 27, 12, 0, 0),
  }, {
    queuedCount: 3,
    feedback: [{ id: "feedback-1", kind: "notify", level: "warning", text: longLiteral }],
    omittedFeedback: 2,
  });
  const callbacks = {
    onAnswer: (id: string, answer: InteractionAnswer) => answers.push({ id, answer }),
    onCancel: () => undefined,
  };
  const view = await mount(createElement(ExtensionInteractions, { state, ...callbacks }));
  try {
    assert.match(view.get('[data-role="local-cutoff"]').textContent ?? "", /local cutoff.*receipt-based.*not remote expiry/i);
    assert.equal(view.get("time").getAttribute("datetime"), new Date(state.active?.localCutoffAt ?? 0).toISOString());
    assert.equal(view.get(".extension-interactions__origin").textContent, "Origin: trusted runtime extension; not authenticated.");
    assert.match(view.get('[role="status"]').textContent ?? "", /3.*queued/i);
    assert.equal(view.get(".extension-interactions__feedback-text").textContent, longLiteral);
    assert.equal(view.root.querySelector("img, strong") === null, true);
    assert.match(view.get(".extension-interactions__omitted").textContent ?? "", /2/);
    assert.match(view.get(".extension-interactions__limitations").textContent ?? "", /custom.*terminal/i);

    const blocked = projection(state.active, { phase: "blocked", errorCode: "reply-failed", feedback: state.feedback, omittedFeedback: 2 });
    await view.render(createElement(ExtensionInteractions, { state: blocked, ...callbacks }));
    assert.match(view.get('[role="alert"]').textContent ?? "", /reply.*could not be confirmed/i);
    assert.equal(view.get<HTMLInputElement>('input[aria-label="Your response"]').disabled, true);
    assert.equal(view.get<HTMLButtonElement>('[data-action="answer"]').disabled, true);
    await act(async () => view.get<HTMLButtonElement>('[data-action="answer"]').click());
    assert.deepEqual(answers, []);
  } finally { await view.close(); }
});


test("execution profile shows trusted identity and only dispatches host-approved profile choices", async () => {
  const chosen: Array<"controlled" | "trusted"> = [];
  const profile: ExecutionProfileProjection = {
    profile: "trusted",
    displayName: "chosen <script>entry</script>",
    phase: "idle",
    errorCode: null,
    canSwitch: true,
    canEnd: false,
    canRecover: false,
  };
  const view = await mount(createElement(ExecutionProfileControls, {
    state: profile,
    onChoose: value => chosen.push(value),
    onEnd: () => undefined,
    onRecover: () => undefined,
  }));
  let browserConfirmCalls = 0;
  Object.defineProperty(view.dom.window, "confirm", { configurable: true, value: () => { browserConfirmCalls++; return true; } });
  try {
    assert.equal(view.get('[data-profile-badge="trusted"]').textContent, "Trusted execution · chosen <script>entry</script>");
    assert.equal(view.root.querySelector("script") === null, true);
    assert.match(view.get(".execution-profile-controls__coverage").textContent ?? "", /not a security sandbox.*outside covered approval/i);
    assert.match(view.get(".execution-profile-controls__domain").textContent ?? "", /each vs code window.*own runtime/i);
    await act(async () => view.get<HTMLButtonElement>('[data-profile-choice="controlled"]').click());
    await act(async () => view.get<HTMLButtonElement>('[data-profile-choice="trusted"]').click());
    assert.deepEqual(chosen, ["controlled", "trusted"]);
    assert.equal(browserConfirmCalls, 0);
  } finally { await view.close(); }
});


test("too many enabled plugins explain the host error without implying a switch", async () => {
  const state: ExecutionProfileProjection = {
    profile: "controlled",
    displayName: null,
    phase: "error",
    errorCode: "too-many-enabled",
    canSwitch: true,
    canEnd: false,
    canRecover: false,
  };
  const view = await mount(createElement(ExecutionProfileControls, {
    state,
    onChoose: () => undefined,
    onEnd: () => undefined,
    onRecover: () => undefined,
  }));
  try {
    assert.match(view.get(".execution-profile-controls__error").textContent ?? "", /too many plugins are enabled/i);
    assert.equal(view.get('[data-profile-badge="controlled"]').textContent, "Controlled execution");
  } finally { await view.close(); }
});

test("a host-enabled profile switch can be retried after a non-pending error", async () => {
  const chosen: Array<"controlled" | "trusted"> = [];
  const state: ExecutionProfileProjection = {
    profile: "controlled",
    displayName: null,
    phase: "error",
    errorCode: "invalid-entry",
    canSwitch: true,
    canEnd: false,
    canRecover: false,
  };
  const view = await mount(createElement(ExecutionProfileControls, {
    state,
    onChoose: value => chosen.push(value),
    onEnd: () => undefined,
    onRecover: () => undefined,
  }));
  try {
    const retry = view.get<HTMLButtonElement>('[data-profile-choice="trusted"]');
    assert.equal(retry.disabled, false);
    assert.match(view.get('[role="alert"]').textContent ?? "", /execution profile is not ready/i);
    await act(async () => retry.click());
    assert.deepEqual(chosen, ["trusted"]);
  } finally { await view.close(); }
});
test("recovery actions are separate host intents and pending profile operations disable every action", async () => {
  const ended: string[] = [];
  const recovered: string[] = [];
  const chosen: Array<"controlled" | "trusted"> = [];
  const state: ExecutionProfileProjection = {
    profile: "trusted",
    displayName: "reviewed-extension",
    phase: "recovery-required",
    errorCode: "raw-secret-like-detail-must-not-render",
    canSwitch: false,
    canEnd: true,
    canRecover: true,
  };
  const view = await mount(localized(createElement(ExecutionProfileControls, {
    state,
    onChoose: value => chosen.push(value),
    onEnd: () => ended.push("end"),
    onRecover: () => recovered.push("recover"),
  }), "zh-CN"));
  let browserConfirmCalls = 0;
  Object.defineProperty(view.dom.window, "confirm", { configurable: true, value: () => { browserConfirmCalls++; return true; } });
  try {
    assert.match(view.get('[role="alert"]').textContent ?? "", /运行时结果不确定/);
    assert.equal(view.root.textContent?.includes("raw-secret-like-detail-must-not-render"), false);
    const end = view.get<HTMLButtonElement>('[data-action="end-owned-runtime"]');
    const recover = view.get<HTMLButtonElement>('[data-action="recover-controlled-runtime"]');
    assert.equal(end.disabled, false);
    assert.equal(recover.disabled, false);
    await act(async () => end.click());
    await act(async () => recover.click());
    assert.deepEqual(ended, ["end"]);
    assert.deepEqual(recovered, ["recover"]);
    assert.equal(browserConfirmCalls, 0);

    const pending: ExecutionProfileProjection = { ...state, profile: "controlled", displayName: null, phase: "switching", errorCode: null, canSwitch: true };
    await view.render(localized(createElement(ExecutionProfileControls, {
      state: pending,
      onChoose: value => chosen.push(value),
      onEnd: () => ended.push("pending-end"),
      onRecover: () => recovered.push("pending-recover"),
    }), "zh-CN"));
    const pendingButtons = view.root.querySelectorAll<HTMLButtonElement>("button");
    assert.equal(pendingButtons.length, 4);
    for (const button of pendingButtons) assert.equal(button.disabled, true);
    assert.match(view.get('[role="status"]').textContent ?? "", /正在切换/);
    assert.equal(browserConfirmCalls, 0);
  } finally { await view.close(); }
});


test("new interaction focuses its field without stealing the composer and restores prior focus only when focus was not moved", async () => {
  const noActive = projection(null);
  const active = projection({
    id: "interaction-focus-1",
    method: "select",
    title: "Focus target",
    origin: "trusted runtime extension; not authenticated",
    options: [{ id: "focus-option", label: "Continue" }],
  });
  const callbacks = { onAnswer: () => undefined, onCancel: () => undefined };
  const tree = (state: ExtensionInteractionProjection) => createElement(Fragment, null,
    createElement("button", { id: "prior-focus", type: "button" }, "Prior focus"),
    createElement("button", { id: "elsewhere", type: "button" }, "Elsewhere"),
    createElement("textarea", { id: "chat-composer", "aria-label": "Chat composer" }),
    createElement(ExtensionInteractions, { state, ...callbacks }),
  );
  const view = await mount(tree(noActive));
  try {
    const prior = view.get<HTMLButtonElement>("#prior-focus");
    prior.focus();
    await view.render(tree(active));
    assert.equal(view.dom.window.document.activeElement?.getAttribute("aria-label"), "Select an option");
    await view.render(tree(noActive));
    assert.equal(view.dom.window.document.activeElement?.id, "prior-focus");

    const elsewhere = view.get<HTMLButtonElement>("#elsewhere");
    await view.render(tree(active));
    elsewhere.focus();
    await view.render(tree(noActive));
    assert.equal(view.dom.window.document.activeElement?.id, "elsewhere");

    const composer = view.get<HTMLTextAreaElement>("#chat-composer");
    composer.focus();
    await view.render(tree(active));
    assert.equal(view.dom.window.document.activeElement?.id, "chat-composer");
  } finally { await view.close(); }
});


for (const language of ["en", "zh-CN"] as const) test(`oversized input answers remain editable and can be corrected or cancelled (${language})`, async () => {
  const answers: InteractionAnswer[] = [];
  const cancellations: string[] = [];
  const state = projection({ id: "input-byte-limit", method: "input", title: "Response", origin: "trusted runtime extension; not authenticated" });
  const callbacks = { onAnswer: (_id: string, answer: InteractionAnswer) => answers.push(answer), onCancel: (id: string) => cancellations.push(id) };
  const view = await mount(localized(createElement(ExtensionInteractions, { state, ...callbacks }), language));
  try {
    const input = view.get<HTMLInputElement>("input");
    const setText = async (text: string) => act(async () => {
      Object.getOwnPropertyDescriptor(view.dom.window.HTMLInputElement.prototype, "value")?.set?.call(input, text);
      input.dispatchEvent(new view.dom.window.Event("input", { bubbles: true }));
    });
    await setText("界".repeat(10923)); // 32,769 UTF-8 bytes, despite fewer characters.
    await act(async () => view.get<HTMLButtonElement>('[data-action="answer"]').click());
    assert.equal(answers.length, 0);
    assert.match(view.get('[role="alert"]').textContent ?? "", language === "en" ? /32,768.*UTF-8.*shorten.*cancel/i : /32,768 UTF-8.*缩短.*重新提交.*取消/);
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.equal(input.getAttribute("aria-describedby"), view.get('[role="alert"]').id);
    assert.equal(input.disabled, false);
    assert.equal(view.get<HTMLButtonElement>('[data-action="cancel"]').disabled, false);
    const valid = "界".repeat(10922) + "ab"; // Exactly 32,768 bytes.
    await setText(valid);
    await act(async () => input.dispatchEvent(new view.dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })));
    assert.deepEqual(answers, [{ method: "input", text: valid }]);
    const next = projection({ id: "input-cancel", method: "input", title: "Response", origin: "trusted runtime extension; not authenticated" });
    await view.render(localized(createElement(ExtensionInteractions, { state: next, ...callbacks }), language));
    const nextInput = view.get<HTMLInputElement>("input");
    await act(async () => {
      Object.getOwnPropertyDescriptor(view.dom.window.HTMLInputElement.prototype, "value")?.set?.call(nextInput, "a".repeat(32769));
      nextInput.dispatchEvent(new view.dom.window.Event("input", { bubbles: true }));
    });
    await act(async () => view.get<HTMLButtonElement>('[data-action="answer"]').click());
    assert.equal(answers.length, 1);
    await act(async () => view.get<HTMLButtonElement>('[data-action="cancel"]').click());
    assert.deepEqual(cancellations, ["input-cancel"]);
  } finally { await view.close(); }
});

for (const language of ["en", "zh-CN"] as const) test(`oversized editor answers show guidance and support correction or cancellation (${language})`, async () => {
  const answers: InteractionAnswer[] = [];
  const cancellations: string[] = [];
  const state = projection({ id: "editor-byte-limit", method: "editor", title: "Response", origin: "trusted runtime extension; not authenticated", prefill: "" });
  const callbacks = { onAnswer: (_id: string, answer: InteractionAnswer) => answers.push(answer), onCancel: (id: string) => cancellations.push(id) };
  const view = await mount(localized(createElement(ExtensionInteractions, { state, ...callbacks }), language));
  try {
    const editor = view.get<HTMLTextAreaElement>("textarea");
    const setText = async (text: string) => act(async () => {
      Object.getOwnPropertyDescriptor(view.dom.window.HTMLTextAreaElement.prototype, "value")?.set?.call(editor, text);
      editor.dispatchEvent(new view.dom.window.Event("input", { bubbles: true }));
    });
    await setText("界".repeat(10923));
    await act(async () => editor.dispatchEvent(new view.dom.window.KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true, cancelable: true })));
    assert.equal(answers.length, 0);
    assert.match(view.get('[role="alert"]').textContent ?? "", language === "en" ? /32,768.*UTF-8.*shorten.*cancel/i : /32,768 UTF-8.*缩短.*重新提交.*取消/);
    assert.equal(editor.getAttribute("aria-invalid"), "true");
    assert.equal(editor.getAttribute("aria-describedby"), view.get('[role="alert"]').id);
    assert.equal(editor.disabled, false);
    const valid = "界".repeat(10922) + "ab";
    await setText(valid);
    assert.equal(view.root.querySelector('[role="alert"]') === null, true);
    await act(async () => view.get<HTMLButtonElement>('[data-action="answer"]').click());
    assert.deepEqual(answers, [{ method: "editor", text: valid }]);

    const next = projection({ id: "editor-cancel", method: "editor", title: "Response", origin: "trusted runtime extension; not authenticated", prefill: "a".repeat(32768) });
    await view.render(localized(createElement(ExtensionInteractions, { state: next, ...callbacks }), language));
    const nextEditor = view.get<HTMLTextAreaElement>("textarea");
    await act(async () => {
      Object.getOwnPropertyDescriptor(view.dom.window.HTMLTextAreaElement.prototype, "value")?.set?.call(nextEditor, "a".repeat(32769));
      nextEditor.dispatchEvent(new view.dom.window.Event("input", { bubbles: true }));
    });
    await act(async () => view.get<HTMLButtonElement>('[data-action="answer"]').click());
    assert.equal(answers.length, 1);
    await act(async () => view.get<HTMLButtonElement>('[data-action="cancel"]').click());
    assert.deepEqual(cancellations, ["editor-cancel"]);
  } finally { await view.close(); }
});

test("returning focus to an active form reveals the field in nested scroll containers", async () => {
  const state = projection({ id: "refocus-editor", method: "editor", title: "Edit", origin: "trusted runtime extension; not authenticated" });
  const view = await mount(createElement(Fragment, null,
    createElement("button", { id: "outside-form" }, "Settings"),
    createElement(ExtensionInteractions, { state, onAnswer: () => undefined, onCancel: () => undefined })));
  try {
    const field = view.get<HTMLTextAreaElement>("textarea");
    const scrolls: unknown[] = [];
    field.scrollIntoView = options => { scrolls.push(options); };
    await act(async () => { view.get("#outside-form").focus(); field.focus(); });
    assert.deepEqual(scrolls, [{ block: "nearest", inline: "nearest" }]);
    assert.equal(view.dom.window.document.activeElement, field);
  } finally { await view.close(); }
});
