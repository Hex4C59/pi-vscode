import "../styles.css";
import "./preview.css";
import { mountChat, createUiLanguage } from "../chat/index.js";
import { PreviewBridge, type PreviewBridgeOptions, type SettingsFixture } from "./preview-bridge.js";
import { createHandoffConfirmation } from "./handoff-confirmation.js";
import type { PreviewScenario } from "./scenarios.js";

// Browser-only review fixture. The production entry never imports this module.
const params = new URLSearchParams(location.search);
const theme = params.get("theme") === "light" ? "light" : params.get("theme") === "high-contrast" ? "high-contrast" : "dark";
const chinese = params.get("language") === "zh";
const state = params.get("state") ?? "ready";
document.documentElement.dataset.theme = theme;
const root = document.getElementById("review");
if (!root) throw new Error("Missing review mount");

const states = [
  ["pre-session", "Pre-session model / strength"],
  ["ready", "Configured"],
  ["loading", "Loading"],
  ["error", "Error"],
  ["empty", "Empty"],
  ["unconfigured", "Unconfigured"],
  ["mismatch", "Default ≠ session"],
  ["switching", "Switching"],
  ["long", "Long names"],
  ["no-folder", "No folder"],
  ["resources", "Project resources"],
] as const;

function fixtureFor(value: string): { scenario: PreviewScenario; options: PreviewBridgeOptions; open: "settings" | "prompt" | "model" | "none" } {
  if (value === "pre-session") return { scenario: "no-folder", options: { settings: params.get("long") === "true" ? "long" : "ready" }, open: "model" };
  if (value === "no-folder") return { scenario: "no-folder", options: {}, open: "prompt" };
  if (value === "resources") return { scenario: "empty", options: { resourcesPending: true }, open: "prompt" };
  const settings = (["ready", "loading", "error", "empty", "unconfigured", "mismatch", "switching", "long"].includes(value)
    ? value
    : "ready") as SettingsFixture;
  return { scenario: "empty", options: { settings }, open: "settings" };
}

if (!params.has("panel")) {
  document.body.style.overflow = "auto";
  root.style.cssText = "padding:24px; margin:auto;";
  const heading = document.createElement("h1");
  heading.textContent = "Pi · Settings / confirmation · 设置与确认";
  heading.style.fontSize = "17px";
  const links = document.createElement("nav");
  links.style.cssText = "display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px";
  for (const [key, value, label] of [
    ["theme", "dark", "Dark"], ["theme", "light", "Light"], ["theme", "high-contrast", "High contrast"],
    ["language", "en", "English"], ["language", "zh", "中文"],
    ...states.map(([value, label]) => ["state", value, label] as const),
  ]) {
    const next = new URLSearchParams(params); next.set(key, value);
    const link = document.createElement("a"); link.href = `?${next}`; link.textContent = label; link.style.color = "inherit"; links.append(link);
  }
  const panels = document.createElement("div"); panels.style.cssText = "display:flex;align-items:start;gap:24px";
  for (const width of [280, 320, 400]) {
    const column = document.createElement("section");
    const label = document.createElement("p"); label.textContent = `${width}px · ${theme} · ${chinese ? "中文" : "English"} · ${state}`;
    const frame = document.createElement("iframe");
    const next = new URLSearchParams(params); next.set("panel", "true");
    frame.src = `?${next}`; frame.title = `${width}px settings`; frame.width = String(width); frame.height = "640";
    frame.style.cssText = "display:block;border:0;outline:1px solid var(--ui-border)";
    column.append(label, frame); panels.append(column);
  }
  const note = document.createElement("p");
  note.textContent = "Synthetic host · real shared chat · no real keys or permission grants · F5 / installed package not verified here.";
  root.append(heading, links, panels, note);
} else {
  root.style.cssText = "display:flex;flex:1;min-height:0";
  const language = createUiLanguage(); language.select(chinese ? "zh-CN" : "en");
  const confirmation = createHandoffConfirmation(root, language.getSnapshot);
  const fixture = fixtureFor(state);
  const view = document.createElement("div"); view.className = "candidate-mount"; root.append(view);
  const synthetic = new PreviewBridge(fixture.scenario, confirmation.confirm, fixture.options);
  const dispose = mountChat(view, synthetic, { language, preview: true });
  const open = () => {
    if (fixture.open === "model") { view.querySelector<HTMLButtonElement>("#model-effort-trigger")?.click(); return; }
    if (fixture.open === "settings") {
      view.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')?.click();
      return;
    }
    if (fixture.open === "prompt") {
      const input = view.querySelector<HTMLTextAreaElement>('textarea[aria-label="Message"], textarea[aria-label="消息"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        setter?.call(input, chinese ? "保留这份草稿" : "Keep this draft");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
      view.querySelector<HTMLButtonElement>('button[aria-label="Send message"], button[aria-label="发送消息"]')?.click();
    }
  };
  requestAnimationFrame(() => requestAnimationFrame(open));
  const cleanup = () => { dispose(); synthetic.dispose(); confirmation.dispose(); };
  window.addEventListener("pagehide", cleanup, { once: true });
  import.meta.hot?.dispose(() => { window.removeEventListener("pagehide", cleanup); cleanup(); });
}
