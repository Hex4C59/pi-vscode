import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { readFileSync } from "node:fs";
import { candidateHarness } from "./candidate-harness.js";
import { readAppStyles, settingsHarness } from "./react-harness.js";
import { chineseUi } from "../chat/ui-zh-cn.js";

async function styledEmptySession(t: TestContext) {
  const h = await candidateHarness(t);
  const style = h.dom.window.document.createElement("style");
  style.textContent = readAppStyles();
  h.dom.window.document.head.append(style);
  return h;
}

test("idle empty session shows the π mark and exactly one greeting line", async t => {
  const h = await candidateHarness(t);
  const empty = h.get(".candidate__empty");
  assert.deepEqual([...empty.children].map(child => child.className || child.tagName), ["candidate__mark", "H1"]);
  assert.equal(empty.querySelectorAll("h1").length, 1);
  assert.equal(empty.querySelector("p") === null, true);
  assert.equal(h.get(".candidate__mark").getAttribute("aria-label"), "Replay Pi logo animation");
  assert.equal(h.get(".candidate__mark svg").getAttribute("aria-hidden"), "true");
  assert.equal(empty.textContent, "What should we work on?");
  assert.doesNotMatch(h.root.textContent ?? "", /Ask a question or describe a change/);
  assert.equal(chineseUi["What should we work on?"], "今天想做些什么？");
  assert.equal(Object.values(chineseUi).includes("提出问题，或描述你想要的修改。"), false);
});

test("welcome uses official tricolor cells; send and composer retain brand tokens", async t => {
  const h = await styledEmptySession(t);
  const computed = (selector: string) => h.dom.window.getComputedStyle(h.get(selector));
  // jsdom leaves custom properties unresolved; the actual per-theme colors are checked in the browser preview.
  assert.deepEqual([...new Set([...h.get(".candidate__mark").querySelectorAll("rect")].map(cell => cell.getAttribute("fill")))].sort(), ["#4D9ABF", "#F09082", "#F1BE58"]);
  await h.input("Ready to send");
  assert.equal(h.get<HTMLButtonElement>('button[aria-label="Send message"]').disabled, false);
  assert.equal(computed('button[aria-label="Send message"]').backgroundColor, "var(--ui-brand)");
  const focusRule = [...(h.dom.window.document.styleSheets[0]?.cssRules ?? [])]
    .find((rule): rule is CSSStyleRule => rule instanceof h.dom.window.CSSStyleRule && rule.selectorText === ".candidate__composer:focus-within");
  assert.equal(focusRule?.style.getPropertyValue("border-color"), "var(--ui-brand-focus)");
});

test("theme is monochrome: emphasis follows the host foreground and buttons use the neutral secondary style", () => {
  const theme = readFileSync("src/webview/styles/theme.css", "utf8");
  assert.match(theme, /:root \{[^}]*--ui-brand: var\(--ui-fg\);/s);
  assert.match(theme, /:root \{[^}]*--ui-accent: var\(--vscode-button-secondaryBackground,/s);
  assert.match(theme, /body\.vscode-high-contrast,[^{]*\{[^}]*--ui-brand-focus: var\(--ui-focus\);/s);
  assert.equal(theme.replace(/var\(--vscode-[^)]*\)/g, "").match(/#[0-9a-fA-F]{3,8}\b/g), null, "no literal colors; every surface comes from --vscode-* with fallbacks");
  const styles = readAppStyles();
  for (const blue of ["#168bff", "#2563eb", "#7c3aed", "#E07A5F", "#C45C3E", "hsl(212"]) {
    assert.equal(styles.includes(blue), false, `${blue} must not appear in the shipped styles`);
  }
});

test("settings page uses categories, icon refresh and separate provider details", async () => {
  const h = await settingsHarness();
  try {
    await h.receive({
      version: 3, generation: 1, viewId: "view", type: "providerConfigState", busy: false, error: null,
      defaultProvider: "openai", defaultModelId: "gpt", defaultThinkingLevel: null, thinkingLevels: [],
      providers: [{ providerId: "openai", displayName: "OpenAI", configured: true, authLabel: "stored", canAddApiKey: true, canLogout: true }],
      catalog: [{ provider: "openai", modelId: "gpt", label: "GPT" }],
    });

    const settings = h.get(".settings-page");
    const refresh = settings.querySelector<HTMLButtonElement>('.settings-page__header button[aria-label="Refresh providers"]');
    assert.ok(refresh, "refresh lives in the providers heading as an icon button");
    assert.equal(refresh.textContent, "");
    assert.equal(settings.querySelector(".candidate-settings__secondary, .candidate-settings__panel") === null, true);
    await h.click(".settings-page__nav button:last-child");
    await h.click(".settings-page__providers button");
    assert.equal(settings.querySelector(".candidate-settings__status") === null, true);
    assert.equal(h.get(".settings-page__actions").querySelectorAll("button").length, 2);
    await h.click('.settings-page__header button[aria-label="Refresh providers"]');
    assert.ok(h.sent.some(message => message.type === "refreshProviderConfig"));
  } finally { await h.close(); }
});

test("narrow composer keeps model, permissions and send in one non-wrapping flow instead of stacking over the input", async t => {
  const h = await styledEmptySession(t);
  const toolbar = h.get(".candidate__composer-actions");
  assert.deepEqual([...toolbar.children].map(child => child.classList[0]), ["candidate-context__actions", "candidate__model", "candidate-permissions", "candidate__send"]);
  const style = (element: Element) => h.dom.window.getComputedStyle(element);
  assert.equal(style(toolbar).display, "flex");
  assert.notEqual(style(toolbar).flexWrap, "wrap", "toolbar stays on one row while the model name truncates");
  assert.equal(style(h.get(".candidate__model")).minWidth, "0px", "the model label truncates before it can push send out of reach");
  assert.notEqual(style(h.get('button[aria-label="Add context"]')).position, "absolute", "context participates in layout and keyboard order");
  assert.notEqual(style(h.get(".candidate-permissions > summary")).position, "absolute");
  assert.equal(style(h.get(".candidate__send")).flexShrink, "0");
  const textarea = h.get('textarea[aria-label="Message"]');
  assert.equal(textarea.compareDocumentPosition(toolbar) & h.dom.window.Node.DOCUMENT_POSITION_FOLLOWING, h.dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
});

test("conversation surface keeps the closed spacing, type and radius scale", () => {
  const css = readFileSync("src/webview/chat/candidate-conversation.css", "utf8");
  const offScale = /(?:padding|margin|gap|font-size|inset):[^;{}]*\b(?:3|5|6|7|10|11)px/.exec(css);
  assert.equal(offScale, null, `off-scale spacing or type literal: ${offScale?.[0] ?? ""}`);
  const radii = [...css.matchAll(/border-radius:\s*([^;]+);/g)].map(match => match[1].trim());
  assert.ok(radii.length > 0, "the conversation surface uses the shared radius tokens");
  assert.deepEqual([...new Set(radii)].sort(), ["0", "var(--ui-radius)"]);
  const hexes = css.match(/#[0-9a-fA-F]{3,8}\b/g);
  assert.equal(hexes, null, "surfaces come from --vscode-* aliases, not literal colors");
});

test("operations area styles keep the closed spacing scale and token-only colors", () => {
  const files = [
    "src/webview/chat/task-status.css",
    "src/webview/chat/candidate-approvals.css",
    "src/webview/chat/candidate-review.css",
    "src/webview/chat/extension-interactions.css",
    "src/webview/chat/chat-dialog.css",
    "src/webview/chat/interface-settings.css",
    "src/webview/components/change-review.css",
  ];
  for (const file of files) {
    const css = readFileSync(file, "utf8");
    const offScale = /(?:padding|margin|gap|font-size|inset):[^;{}]*\b(?:3|5|6|7|10|11)px/.exec(css);
    assert.equal(offScale, null, `${file}: off-scale spacing or type literal: ${offScale?.[0] ?? ""}`);
    assert.equal(css.match(/#[0-9a-fA-F]{3,8}\b/g), null, `${file}: surfaces come from --vscode-* aliases, not literal colors`);
  }
});

test("task status motion serves real state changes and yields to reduced motion", () => {
  const css = readFileSync("src/webview/chat/task-status.css", "utf8");
  assert.match(css, /@keyframes task-status-pulse/, "the pulse is the only status animation");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.candidate__pulse \{ animation: none; \}\s*\}/s, "reduced motion stills the pulse");
  assert.equal((css.match(/@keyframes/g) ?? []).length, 1, "no entrance or layout animation on status updates");
});

test("settings dialog motion is open-only and yields to reduced motion", () => {
  const css = readFileSync("src/webview/chat/chat-dialog.css", "utf8");
  assert.match(css, /@keyframes candidate-dialog-in/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.candidate-dialog\[open\] \{ animation: none; \}\s*\}/s);
  assert.equal((css.match(/@keyframes/g) ?? []).length, 1, "settings content updates must not replay a second entrance");
});
