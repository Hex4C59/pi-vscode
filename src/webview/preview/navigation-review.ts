import "../styles.css";
import "./preview.css";
import { mountChat, createUiLanguage } from "../chat/index.js";
import { PreviewBridge } from "./preview-bridge.js";
import { createHandoffConfirmation } from "./handoff-confirmation.js";
import type { PreviewScenario } from "./scenarios.js";

// Browser-only review fixture. The production entry never imports this module.
const params = new URLSearchParams(location.search);
const theme = params.get("theme") === "light" ? "light" : params.get("theme") === "high-contrast" ? "high-contrast" : "dark";
const chinese = params.get("language") === "zh";
document.documentElement.dataset.theme = theme;
const root = document.getElementById("review");
if (!root) throw new Error("Missing review mount");
const scenario: PreviewScenario = params.get("state") === "empty" ? "sessions-empty" : params.get("state") === "error" ? "sessions-error" : "sessions";

if (!params.has("panel")) {
  document.body.style.overflow = "auto";
  root.style.cssText = "padding:24px; margin:auto;";
  const heading = document.createElement("h1");
  heading.textContent = "Pi · Session navigation / 会话导航";
  heading.style.fontSize = "17px";
  const links = document.createElement("nav");
  links.style.cssText = "display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px";
  for (const [key, value, label] of [
    ["theme", "dark", "Dark"], ["theme", "light", "Light"], ["theme", "high-contrast", "High contrast"],
    ["language", "en", "English"], ["language", "zh", "中文"],
    ["state", "ready", "Sessions"], ["state", "empty", "Empty"], ["state", "error", "Error"], ["state", "loading", "Loading"],
  ]) {
    const next = new URLSearchParams(params); next.set(key, value);
    const link = document.createElement("a"); link.href = `?${next}`; link.textContent = label; link.style.color = "inherit"; links.append(link);
  }
  const panels = document.createElement("div"); panels.style.cssText = "display:flex;align-items:start;gap:24px";
  for (const width of [280, 320, 400]) {
    const column = document.createElement("section");
    const label = document.createElement("p"); label.textContent = `${width}px · ${theme} · ${chinese ? "中文" : "English"}`;
    const frame = document.createElement("iframe");
    const next = new URLSearchParams(params); next.set("panel", "true");
    frame.src = `?${next}`; frame.title = `${width}px navigation`; frame.width = String(width); frame.height = "480";
    frame.style.cssText = "display:block;border:0;outline:1px solid var(--ui-border)";
    column.append(label, frame); panels.append(column);
  }
  const note = document.createElement("p"); note.textContent = "Synthetic host · real shared chat · open History in each panel · F5 / installed package not verified here.";
  root.append(heading, links, panels, note);
} else {
  root.style.cssText = "display:flex;flex:1;min-height:0";
  const language = createUiLanguage(); language.select(chinese ? "zh-CN" : "en");
  const confirmation = createHandoffConfirmation(root, language.getSnapshot);
  const title = chinese ? "精修会话导航与历史面板：检查长标题、键盘焦点和窄侧栏下的完整呈现" : "Refine session navigation and history: long titles, keyboard focus and narrow sidebar layouts";
  const view = document.createElement("div"); view.className = "candidate-mount"; root.append(view);
  const synthetic = new PreviewBridge(scenario, confirmation.confirm, { title, loading: params.get("state") === "loading" });
  const dispose = mountChat(view, synthetic, { language, preview: true });
  const cleanup = () => { dispose(); synthetic.dispose(); confirmation.dispose(); };
  window.addEventListener("pagehide", cleanup, { once: true });
  import.meta.hot?.dispose(() => { window.removeEventListener("pagehide", cleanup); cleanup(); });
}
