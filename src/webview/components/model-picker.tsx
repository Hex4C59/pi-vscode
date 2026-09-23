import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import type { ModelPickerProps } from "./types.js";
export type { ModelPickerProps } from "./types.js";


export function ModelPicker({ state, disabled, onModel, onThinking }: ModelPickerProps): ReactElement {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modelListOpen, setModelListOpen] = useState(false);
  const appliedLevel = state.thinkingLevel;
  const selectedLevel = state.pendingThinkingLevel ?? appliedLevel;
  const levelsKey = state.thinkingLevels.join("\u0000");
  const selectedLevelIndex = Math.max(0, state.thinkingLevels.indexOf(selectedLevel ?? ""));
  const [sliderIndex, setSliderIndex] = useState(selectedLevelIndex);

  useEffect(() => {
    setSliderIndex(selectedLevelIndex);
  }, [levelsKey, selectedLevel, selectedLevelIndex]);

  useEffect(() => {
    if (!popoverOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPopoverOpen(false);
        setModelListOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [popoverOpen]);

  const settingsDisabled = disabled || state.busy || state.modelBusy || state.runtime !== "ready" || state.execution === "stopping";
  // Native change commits a range drag on release; React onChange also fires on every input.
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    const commit = () => {
      const level = state.thinkingLevels[Number(slider.value)];
      if (!slider.disabled && level) onThinking(level);
    };
    slider.addEventListener("change", commit);
    return () => slider.removeEventListener("change", commit);
  }, [onThinking, state.thinkingLevels]);
  const modelLabel = state.chatModel ?? "Model not configured";
  const thinkingLabel = appliedLevel ?? "—";
  const pendingSettings: string[] = [];
  if (state.pendingModel) pendingSettings.push(`${state.pendingModel.provider} / ${state.pendingModel.label}`);
  if (state.pendingThinkingLevel) pendingSettings.push(`thinking: ${state.pendingThinkingLevel}`);
  const max = Math.max(state.thinkingLevels.length - 1, 0);
  const value = Math.min(Math.max(sliderIndex, 0), max);
  const fill = max > 0 ? `${(value / max) * 100}%` : "0%";
  const sliderStyle = { "--fill": fill, accentColor: "#168BFF" } as CSSProperties;

  const closePopover = () => {
    setPopoverOpen(false);
    setModelListOpen(false);
    triggerRef.current?.focus();
  };

  const togglePopover = () => {
    setPopoverOpen(open => {
      if (open) setModelListOpen(false);
      return !open;
    });
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
        title={`Applied: ${modelLabel} · ${thinkingLabel}`}
        onClick={togglePopover}
      >
        {modelLabel} · {thinkingLabel}
      </button>
      <div id="model-popover" className="popover" role="dialog" aria-label="Model and thinking level" hidden={!popoverOpen}>
        <p className="popover-title">Model</p>
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
        <p className="popover-title" id="thinking-heading">Thinking level</p>
        <input
          id="thinking-slider"
          ref={sliderRef}
          className="thinking-slider"
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          aria-labelledby="thinking-heading"
          disabled={settingsDisabled || state.thinkingLevels.length <= 1}
          style={sliderStyle}
          onPointerDown={event => event.currentTarget.setAttribute("data-keyboard-focus", "false")}
          onKeyDown={event => { if (event.key !== "Tab") event.currentTarget.setAttribute("data-keyboard-focus", "true"); }}
          onInput={event => setSliderIndex(Number(event.currentTarget.value))}
          onChange={event => setSliderIndex(Number(event.currentTarget.value))}
        />
        <p id="thinking-level-label" className="muted" aria-live="polite">
          Applied: {thinkingLabel}{state.pendingThinkingLevel ? ` · Next turn (pending): ${state.pendingThinkingLevel}` : ""}
        </p>
        <div id="model-error" className="banner" role="alert">{state.modelError ?? ""}</div>
      </div>
      <p id="pending-settings" className="muted" role="status" hidden={pendingSettings.length === 0 && !state.modelBusy}>
        {pendingSettings.length > 0 ? `${state.modelBusy ? "Applying next turn: " : "Next turn (pending): "}${pendingSettings.join(" · ")}` : "Loading model settings…"}
      </p>
      <div id="model-status-error" className="banner" role="alert" hidden={!state.modelError}>{state.modelError ?? ""}</div>
    </>
  );
}
