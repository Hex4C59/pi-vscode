import { useUiText } from "./ui-text.js";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactElement } from "react";
import type { ModelPickerProps } from "./types.js";
export type { ModelPickerProps } from "./types.js";


export function ModelPicker({ state, disabled, onModel, onThinking, continuousThinkingDrag = false, animatePopover = false }: ModelPickerProps): ReactElement {
  const { text: t } = useUiText();
  const thinkingText = (level: string) => {
    switch (level) {
      case "off": case "minimal": case "low": case "medium": case "high": case "xhigh": return t(level);
      default: return level; // Preserve future runtime-supported levels literally.
    }
  };
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const selectionFocus = useRef<{ phase: "awaiting-busy" | "busy"; target: HTMLElement } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modelListOpen, setModelListOpen] = useState(false);
  const appliedLevel = state.thinkingLevel;
  const selectedLevel = state.pendingThinkingLevel ?? appliedLevel;
  const levelsKey = state.thinkingLevels.join("\u0000");
  const selectedLevelIndex = Math.max(0, state.thinkingLevels.indexOf(selectedLevel ?? ""));
  const [sliderIndex, setSliderIndex] = useState(selectedLevelIndex);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setSliderIndex(selectedLevelIndex);
  }, [levelsKey, selectedLevel, selectedLevelIndex]);

  useEffect(() => {
    if (!popoverOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPopoverOpen(false);
        if (!animatePopover) setModelListOpen(false);
        if (selectionFocus.current && triggerRef.current) selectionFocus.current.target = triggerRef.current;
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [popoverOpen, animatePopover]);

  const settingsDisabled = disabled || state.busy || state.modelBusy || state.runtime !== "ready" || state.execution === "stopping";
  // Native disabled controls lose focus in Chromium while the host applies an idle
  // selection. Restore only our own selection's focus, never a newer user target.
  useEffect(() => {
    const moved = (event: FocusEvent) => {
      if (event.target !== document.body && event.target !== selectionFocus.current?.target) selectionFocus.current = null;
    };
    document.addEventListener("focusin", moved);
    return () => document.removeEventListener("focusin", moved);
  }, []);
  useEffect(() => {
    if (!selectionFocus.current) return;
    if (state.modelBusy) { selectionFocus.current.phase = "busy"; return; }
    if (selectionFocus.current.phase !== "busy") return;
    const target = selectionFocus.current.target;
    selectionFocus.current = null;
    if (!settingsDisabled && target.isConnected && document.activeElement === document.body) target.focus();
  }, [state.modelBusy, settingsDisabled]);
  // Native change commits a range drag on release; React onChange also fires on every input.
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    const commit = () => {
      const position = Number(slider.value);
      const index = continuousThinkingDrag ? Math.round(position) : position;
      const level = state.thinkingLevels[index];
      if (slider.disabled || !level) return;
      if (continuousThinkingDrag) {
        slider.value = String(index);
        setSliderIndex(index);
        if (level === selectedLevel) return;
      }
      if (!state.chatBusy && document.activeElement === slider) selectionFocus.current = { phase: "awaiting-busy", target: slider };
      onThinking(level);
    };
    slider.addEventListener("change", commit);
    return () => slider.removeEventListener("change", commit);
  }, [onThinking, state.thinkingLevels, state.chatBusy, selectedLevel, continuousThinkingDrag]);
  const modelLabel = state.chatModel ?? t("Model not configured");
  const thinkingLabel = appliedLevel ? thinkingText(appliedLevel) : "—";
  const pendingSettings: string[] = [];
  if (state.pendingModel) pendingSettings.push(`${state.pendingModel.provider} / ${state.pendingModel.label}`);
  if (state.pendingThinkingLevel) pendingSettings.push(t("thinking: {thinking}", { thinking: thinkingText(state.pendingThinkingLevel) }));
  const max = Math.max(state.thinkingLevels.length - 1, 0);
  const value = Math.min(Math.max(sliderIndex, 0), max);
  const fill = max > 0 ? `${(value / max) * 100}%` : "0%";
  const previewIndex = Math.round(value);
  const previewLevel = state.thinkingLevels[previewIndex];
  const effortStyle = { "--effort-position": max > 0 ? value / max : 0 } as CSSProperties;
  const sliderStyle = {
    "--fill": fill,
    accentColor: "#168BFF",
    ...(continuousThinkingDrag ? {
      "--thinking-strength": max > 0 ? previewIndex / max : 0,
      // Paint supported positions under the native thumb, without adding a pointer-intercepting layer.
      "--thinking-ticks": state.thinkingLevels.map((_, index) => {
        const position = max > 0 ? index / max : 0.5;
        const color = index <= value ? "#ffffffb3" : "var(--thinking-tick-idle)";
        return `radial-gradient(circle at calc(var(--thinking-thumb-size) / 2 + (100% - var(--thinking-thumb-size)) * ${position}) 50%, ${color} 0 2px, transparent 3px)`;
      }).join(", ") || "none",
    } : {}),
  } as CSSProperties;

  const closePopover = () => {
    setPopoverOpen(false);
    if (!animatePopover) setModelListOpen(false);
    triggerRef.current?.focus();
  };

  const togglePopover = () => {
    setPopoverOpen(open => {
      // Keep closing content stable; the next open starts with a collapsed model list.
      if (!open || !animatePopover) setModelListOpen(false);
      return !open;
    });
  };

  const handleThinkingKey = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Tab") event.currentTarget.setAttribute("data-keyboard-focus", "true");
    if (!continuousThinkingDrag || settingsDisabled || state.thinkingLevels.length <= 1) return;
    const current = Math.round(Number(event.currentTarget.value));
    let next: number;
    switch (event.key) {
      case "ArrowLeft": case "ArrowDown": case "PageDown": next = current - 1; break;
      case "ArrowRight": case "ArrowUp": case "PageUp": next = current + 1; break;
      case "Home": next = 0; break;
      case "End": next = max; break;
      default: return;
    }
    event.preventDefault();
    next = Math.min(Math.max(next, 0), max);
    event.currentTarget.value = String(next);
    setSliderIndex(next);
    const level = state.thinkingLevels[next];
    if (level && level !== selectedLevel) {
      if (!state.chatBusy) selectionFocus.current = { phase: "awaiting-busy", target: event.currentTarget };
      onThinking(level);
    }
  };

  return (
    <>
      <button
        id="model-effort-trigger"
        ref={triggerRef}
        className="chip"
        type="button"
        aria-expanded={popoverOpen}
        aria-controls="model-popover"
        disabled={settingsDisabled}
        title={t("Applied: {model} · {thinking}", { model: modelLabel, thinking: thinkingLabel })}
        onClick={togglePopover}
      >
        <span className="model-effort-trigger__model">{modelLabel}</span><span className="model-effort-trigger__thinking"> · {thinkingLabel}</span>
      </button>
      <div id="model-popover" className="popover" role="dialog" aria-label={t("Model and thinking level")} hidden={!popoverOpen}
        data-animated={animatePopover ? "true" : undefined} aria-hidden={!popoverOpen} inert={!popoverOpen}>
        <p className="popover-title">{t("Model")}</p>
        <button
          id="model-current"
          className="menu-item"
          type="button"
          aria-expanded={modelListOpen}
          aria-controls="model-list"
          disabled={settingsDisabled || state.availableModels.length === 0}
          onClick={() => setModelListOpen(open => !open)}
        >
          <span id="model-current-label">{modelLabel}</span>
          <span className="chevron" aria-hidden="true">⌄</span>
        </button>
        <div id="model-list" role="menu" hidden={!modelListOpen}>
          {state.availableModels.map(entry => {
            const entryLabel = entry.label || entry.modelId;
            const applied = state.chatModel === `${entry.provider} / ${entry.modelId}` || state.chatModel === entryLabel;
            return (
              <button
                key={`${entry.provider}:${entry.modelId}`}
                className="menu-item"
                type="button"
                role="menuitemradio"
                aria-checked={applied}
                disabled={settingsDisabled}
                onClick={() => {
                  selectionFocus.current = !state.chatBusy && triggerRef.current ? { phase: "awaiting-busy", target: triggerRef.current } : null;
                  onModel(entry.provider, entry.modelId);
                  closePopover();
                }}
              >
                <span>{entryLabel}</span>
                <span className="sub">{entry.provider}</span>
              </button>
            );
          })}
        </div>
        <p className="popover-title" id="thinking-heading">{t("Thinking level")}</p>
        {continuousThinkingDrag && <strong className="thinking-current">{previewLevel ? thinkingText(previewLevel) : "—"}</strong>}
        <div className={continuousThinkingDrag ? "thinking-control" : undefined} style={effortStyle}
          data-dragging={dragging} data-maximum={max > 0 && value >= max - 0.001}
          data-disabled={settingsDisabled || state.thinkingLevels.length <= 1}>
        {continuousThinkingDrag && <>
          <div className="thinking-control__track" aria-hidden="true">
            <div className="thinking-control__fill" />
            {state.thinkingLevels.map((level, index) => <i key={level} className="thinking-control__stop"
              style={{ "--stop-position": max > 0 ? index / max : 0 } as CSSProperties} />)}
          </div>
          <div className="thinking-control__thumb" aria-hidden="true" />
        </>}
        <input
          id="thinking-slider"
          ref={sliderRef}
          className="thinking-slider"
          type="range"
          min={0}
          max={max}
          step={continuousThinkingDrag ? "any" : 1}
          value={value}
          aria-labelledby="thinking-heading"
          aria-valuetext={continuousThinkingDrag && previewLevel ? thinkingText(previewLevel) : undefined}
          data-maximum={continuousThinkingDrag && max > 0 && previewIndex === max ? "true" : undefined}
          disabled={settingsDisabled || state.thinkingLevels.length <= 1}
          style={sliderStyle}
          onPointerDown={event => { event.currentTarget.setAttribute("data-keyboard-focus", "false"); setDragging(true); }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onLostPointerCapture={() => setDragging(false)}
          onKeyDown={handleThinkingKey}
          onInput={event => setSliderIndex(Number(event.currentTarget.value))}
          onChange={event => setSliderIndex(Number(event.currentTarget.value))}
        />
        </div>
        <p id="thinking-level-label" className="muted" aria-live="polite">
          {t("Applied: {thinking}", { thinking: thinkingLabel })}{state.pendingThinkingLevel ? t(" · Next turn (pending): {thinking}", { thinking: thinkingText(state.pendingThinkingLevel) }) : ""}
        </p>
        <div id="model-error" className="banner" role="alert">{state.modelError ?? ""}</div>
      </div>
      <p id="pending-settings" className="muted" role="status" hidden={pendingSettings.length === 0 && !state.modelBusy}>
        {pendingSettings.length > 0 ? t(state.modelBusy ? "Applying next turn: {settings}" : "Next turn (pending): {settings}", { settings: pendingSettings.join(" · ") }) : t("Loading model settings…")}
      </p>
      <div id="model-status-error" className="banner" role="alert" hidden={!state.modelError || popoverOpen}>{state.modelError ?? ""}</div>
    </>
  );
}
