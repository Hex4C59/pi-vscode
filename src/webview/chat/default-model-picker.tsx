import { useRef, useState, type ReactElement } from "react";
import type { ProviderConfigProjection } from "../../extension/contracts/index.js";
import { useUiText } from "../components/index.js";

/** Before a project session exists, model choice belongs to global provider settings. */
export function DefaultModelPicker({ config, disabled, onSelect, onSettings }: {
  config: ProviderConfigProjection | null; disabled: boolean;
  onSelect(provider: string, modelId: string): void; onSettings(): void;
}): ReactElement {
  const { text: t } = useUiText();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const label = config?.defaultProvider && config.defaultModelId
    ? `${config.defaultProvider} / ${config.defaultModelId}` : t("Model not configured");
  const close = () => { setOpen(false); trigger.current?.focus(); };
  return <div onKeyDown={event => {
    if (event.key === "Escape" && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    <button id="model-effort-trigger" ref={trigger} className="chip" type="button" disabled={disabled}
      aria-expanded={open} aria-controls="model-popover" title={t("Default model")} onClick={() => setOpen(!open)}>
      <span className="model-effort-trigger__model">{label}</span>
    </button>
    {open && <div id="model-popover" className="popover" role="dialog" aria-label={t("Default model")}>
      <p className="popover-title">{t("Default model")}</p>
      {(!config || config.busy) && <p role="status">{t("Loading model settings…")}</p>}
      {config?.error && <p role="alert">{config.error}</p>}
      <div id="model-list" role="menu">
        {config?.catalog.map(entry => <button key={`${entry.provider}:${entry.modelId}`} className="menu-item" type="button" role="menuitemradio"
          aria-checked={config.defaultProvider === entry.provider && config.defaultModelId === entry.modelId}
          disabled={disabled || config.busy} onClick={() => { onSelect(entry.provider, entry.modelId); close(); }}>
          <span>{entry.label || entry.modelId}</span><span className="sub">{entry.provider}</span>
        </button>)}
      </div>
      {config && !config.busy && !config.catalog.length && <p>{t("Model not configured")}</p>}
      <button className="menu-item" type="button" onClick={() => { close(); onSettings(); }}>{t("Open provider settings")}</button>
    </div>}
    {config?.error && !open && <p role="alert">{config.error}</p>}
  </div>;
}
