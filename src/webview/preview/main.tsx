import "../styles.css";
import { mountApp } from "../mount.js";
import { PreviewBridge, PREVIEW_SCENARIOS, type PreviewScenario } from "./fixtures.js";

type PreviewTheme = "dark" | "light" | "high-contrast";
type HotModule = { dispose(callback: () => void): void };

const scenarioLabels: Record<PreviewScenario, string> = {
  ready: "Ready",
  streaming: "Streaming",
  approval: "Approval",
  attachment: "Attachment",
  "source-changed": "Source changed",
  "long-history": "Long live history",
  sessions: "Saved sessions (synthetic)",
  "change-review": "Captured review (synthetic)",
  error: "Runtime error",
  "no-folder": "No folder",
  untrusted: "Untrusted workspace",
  "unavailable-model": "No model",
  blocked: "Blocked workspace",
};

const app = document.getElementById("app");
const toolbar = document.getElementById("preview-toolbar");
if (!app || !toolbar) throw new Error("Preview shell is missing its root elements.");
const appRoot = app;
const toolbarRoot = toolbar;

let bridge: PreviewBridge | undefined;
let disposeApp: (() => void) | undefined;
let pagehideHandler: (() => void) | undefined;

function option<T extends string>(value: T, label: string): HTMLOptionElement {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = label;
  return item;
}

function controlLabel(text: string, control: HTMLElement): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "preview-toolbar__field";
  const name = document.createElement("span");
  name.textContent = text;
  label.append(name, control);
  return label;
}

function selectControl<T extends string>(values: readonly T[], labels: (value: T) => string, value: T): HTMLSelectElement {
  const select = document.createElement("select");
  select.className = "preview-toolbar__select";
  select.setAttribute("aria-label", value);
  for (const item of values) select.append(option(item, labels(item)));
  select.value = value;
  return select;
}

function reset(nextScenario: PreviewScenario): void {
  disposeApp?.();
  bridge?.dispose();
  appRoot.replaceChildren();
  bridge = new PreviewBridge(nextScenario);
  disposeApp = mountApp(appRoot, bridge);
}

function cleanup(): void {
  if (pagehideHandler) {
    window.removeEventListener("pagehide", pagehideHandler);
    pagehideHandler = undefined;
  }
  disposeApp?.();
  disposeApp = undefined;
  bridge?.dispose();
  bridge = undefined;
}

function renderToolbar(): void {
  toolbarRoot.replaceChildren();
  const title = document.createElement("div");
  title.className = "preview-toolbar__title";
  const name = document.createElement("strong");
  name.textContent = "Pi preview";
  const note = document.createElement("span");
  const scenario = selectControl(PREVIEW_SCENARIOS, item => scenarioLabels[item], "ready");
  const updateScenarioNote = () => {
    note.textContent = scenario.value === "sessions"
      ? "Synthetic host · session handoffs simulated"
      : "Synthetic host";
  };
  updateScenarioNote();
  title.append(name, note);
  scenario.addEventListener("change", () => {
    updateScenarioNote();
    reset(scenario.value as PreviewScenario);
  });

  const themes = ["dark", "light", "high-contrast"] as const;
  const theme = selectControl(themes, item => item === "high-contrast" ? "High contrast" : item[0].toUpperCase() + item.slice(1), "dark");
  theme.addEventListener("change", () => {
    document.documentElement.dataset.theme = theme.value as PreviewTheme;
  });

  const widths = ["280", "360", "600"] as const;
  const width = selectControl(widths, item => `${item}px`, "360");
  width.addEventListener("change", () => {
    document.documentElement.style.setProperty("--preview-sidebar-width", `${width.value}px`);
  });

  const resetButton = document.createElement("button");
  resetButton.className = "preview-toolbar__reset";
  resetButton.type = "button";
  resetButton.textContent = "Reset";
  resetButton.addEventListener("click", () => reset(scenario.value as PreviewScenario));

  const fields = document.createElement("div");
  fields.className = "preview-toolbar__fields";
  fields.append(
    controlLabel("Scenario", scenario),
    controlLabel("Theme", theme),
    controlLabel("Sidebar", width),
    resetButton,
  );
  toolbarRoot.append(title, fields);
}

renderToolbar();
document.documentElement.dataset.theme = "dark";
document.documentElement.style.setProperty("--preview-sidebar-width", "360px");
pagehideHandler = () => cleanup();
window.addEventListener("pagehide", pagehideHandler);
reset("ready");

const hot = (import.meta as ImportMeta & { hot?: HotModule }).hot;
hot?.dispose(() => cleanup());
