import type { UiText } from "../components/index.js";
import { createPreviewLanguage } from "./ui-language.js";
import "../styles.css";
import "./preview.css";
import "./candidate.css";
import "./candidate-review.css";
import { mountCandidatePreview } from "./candidate-preview.js";
import { PREVIEW_SCENARIOS, type PreviewScenario } from "./scenarios.js";

type PreviewTheme = "dark" | "light" | "high-contrast";
type HotModule = { dispose(callback: () => void): void };

const scenarioLabels: Record<PreviewScenario, UiText> = {
  ready: "Conversation",
  empty: "New conversation",
  loading: "Loading",
  streaming: "Streaming",
  formatted: "Formatted reply (synthetic)",
  mermaid: "Mermaid diagrams (synthetic)",
  "safe-output": "Untrusted output (synthetic)",
  activity: "Activity before reply (synthetic)",
  approval: "Approval",
  "approval-queue": "Approval queue (synthetic)",
  attachment: "Attachment",
  "attachment-unavailable": "Attachment source unavailable (synthetic)",
  "attachment-layout": "Long context and literal content (synthetic)",
  "attachment-uncertain": "Attachment delivery uncertain (synthetic)",
  "attachment-capacity": "Attachment capacity rejection (synthetic)",
  "attachment-failure": "Attachment preparation failure (synthetic)",
  "source-changed": "Source changed",
  "long-history": "Long live history",
  sessions: "Saved sessions (synthetic)",
  "sessions-error": "Saved sessions error (synthetic; Refresh recovers)",
  "sessions-empty": "No saved sessions (synthetic)",
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

const language = createPreviewLanguage();
let preview: ReturnType<typeof mountCandidatePreview> | undefined;
let toolbarUnsubscribe: (() => void) | undefined;
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
  preview?.dispose();
  appRoot.replaceChildren();
  preview = mountCandidatePreview(appRoot, nextScenario, language);
}

function cleanup(): void {
  toolbarUnsubscribe?.(); toolbarUnsubscribe = undefined;
  if (pagehideHandler) {
    window.removeEventListener("pagehide", pagehideHandler);
    pagehideHandler = undefined;
  }
  preview?.dispose();
  preview = undefined;
}

function renderToolbar(): void {
  toolbarRoot.replaceChildren();
  const title = document.createElement("div");
  title.className = "preview-toolbar__title";
  const name = document.createElement("strong");
  name.textContent = "Pi · UIP-05–07";
  const note = document.createElement("span");
  const scenario = selectControl(PREVIEW_SCENARIOS, item => scenarioLabels[item], "empty");
  scenario.setAttribute("aria-label", "Scenario");
  const supported = new Set<PreviewScenario>(["approval", "approval-queue", "change-review", "attachment-unavailable", "attachment-layout", "attachment", "source-changed", "long-history", "attachment-failure", "attachment-capacity", "attachment-uncertain", "sessions", "sessions-empty", "sessions-error", "ready", "empty", "loading", "streaming", "formatted", "mermaid", "safe-output", "activity", "error", "no-folder", "untrusted", "unavailable-model", "blocked"]);
  for (const option of scenario.options) if (!supported.has(option.value as PreviewScenario)) {
    option.disabled = true;
    option.textContent += " (later slice)";
  }
  note.textContent = "Synthetic host · candidate preview";
  title.append(name, note);
  scenario.addEventListener("change", () => {
    reset(scenario.value as PreviewScenario);
  });

  const themes = ["dark", "light", "high-contrast"] as const;
  const theme = selectControl(themes, item => item === "high-contrast" ? "High contrast" : item[0].toUpperCase() + item.slice(1), "dark");
  theme.setAttribute("aria-label", "Theme");
  theme.addEventListener("change", () => {
    document.documentElement.dataset.theme = theme.value as PreviewTheme;
  });

  const widths = ["280", "320", "360", "400", "600"] as const;
  const width = selectControl(widths, item => `${item}px`, "360");
  width.setAttribute("aria-label", "Sidebar width");
  width.addEventListener("change", () => {
    document.documentElement.style.setProperty("--preview-sidebar-width", `${width.value}px`);
  });

  const locales = ["en", "zh-CN"] as const;
  const locale = selectControl(locales, item => item === "zh-CN" ? "简体中文" : "English", language.getSnapshot().locale === "zh-CN" ? "zh-CN" : "en");
  locale.setAttribute("aria-label", "Language");
  locale.addEventListener("change", () => {
    language.select(locale.value);
    reset(scenario.value as PreviewScenario);
  });

  const resetButton = document.createElement("button");
  resetButton.className = "preview-toolbar__reset";
  resetButton.type = "button";
  resetButton.textContent = "Reset";
  resetButton.addEventListener("click", () => reset(scenario.value as PreviewScenario));

  const recoverButton = document.createElement("button");
  recoverButton.className = "preview-toolbar__reset";
  recoverButton.type = "button";
  recoverButton.textContent = "Simulate recovery";
  recoverButton.addEventListener("click", () => preview?.recover());

  const sourceButton = document.createElement("button");
  sourceButton.className = "preview-toolbar__reset"; sourceButton.type = "button";
  sourceButton.addEventListener("click", () => preview?.changeSources());
  const simulations: [UiText, () => void][] = [
    ["Simulate pending approvals", () => preview?.queueApprovals()],
    ["Simulate captured changes", () => preview?.completeReview()],
    ["Simulate review loss", () => preview?.loseReview()],
    ["Simulate extension request", () => preview?.simulateInteraction()],
    ["Simulate runtime recovery", () => preview?.simulateRecoveryRequired()],
  ];
  const simulationButtons = simulations.map(([label, action]) => {
    const button = document.createElement("button"); button.className = "preview-toolbar__reset"; button.type = "button";
    button.textContent = label; button.addEventListener("click", action); return { label, button };
  });
  const fields = document.createElement("div");
  fields.className = "preview-toolbar__fields";
  const scenarioLabel = controlLabel("Scenario", scenario);
  const themeLabel = controlLabel("Theme", theme);
  const widthLabel = controlLabel("Sidebar", width);
  const localeLabel = controlLabel("Language", locale);
  fields.append(
    scenarioLabel, themeLabel, widthLabel, localeLabel,
    resetButton,
    recoverButton, sourceButton, ...simulationButtons.map(item => item.button),
  );
  const options = document.createElement("details"); options.className = "preview-control-options";
  const optionsSummary = document.createElement("summary"); optionsSummary.textContent = "Preview controls";
  options.append(optionsSummary, fields);
  toolbarRoot.append(title, options);
  const localize = () => {
    const { locale: currentLocale, text: t } = language.getSnapshot();
    document.documentElement.lang = currentLocale;
    locale.value = currentLocale === "zh-CN" ? "zh-CN" : "en";
    for (const { label, button } of simulationButtons) button.textContent = t(label);
    note.textContent = t("Synthetic host · candidate preview");
    optionsSummary.textContent = t("Preview controls");
    const labels: [HTMLSelectElement, HTMLLabelElement, UiText, UiText][] = [
      [scenario, scenarioLabel, "Scenario", "Scenario"], [theme, themeLabel, "Theme", "Theme"],
      [width, widthLabel, "Sidebar", "Sidebar width"], [locale, localeLabel, "Language", "Language"],
    ];
    for (const [control, label, caption, accessible] of labels) {
      if (label.firstElementChild) label.firstElementChild.textContent = t(caption);
      control.setAttribute("aria-label", t(accessible));
    }
    for (const option of scenario.options) option.textContent = t(scenarioLabels[option.value as PreviewScenario]) + (option.disabled ? t(" (later slice)") : "");
    for (const option of theme.options) option.textContent = t(option.value === "high-contrast" ? "High contrast" : option.value === "light" ? "Light" : "Dark");
    for (const option of locale.options) option.textContent = option.value === "zh-CN" ? "简体中文" : "English";
    sourceButton.textContent = t("Simulate source edit");
    resetButton.textContent = t("Reset"); recoverButton.textContent = t("Simulate recovery");
  };
  localize();
  toolbarUnsubscribe?.(); toolbarUnsubscribe = language.subscribe(localize);
}

renderToolbar();
document.documentElement.dataset.theme = "dark";
document.documentElement.style.setProperty("--preview-sidebar-width", "360px");
pagehideHandler = () => cleanup();
window.addEventListener("pagehide", pagehideHandler);
reset("empty");

const hot = (import.meta as ImportMeta & { hot?: HotModule }).hot;
hot?.dispose(() => cleanup());
