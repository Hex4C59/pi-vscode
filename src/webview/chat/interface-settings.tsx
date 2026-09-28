import type { UiLanguageState } from "./types.js";
import type { ExecutionProfileProjection, ProviderConfigProjection } from "../../extension/contracts/index.js";
import { ExecutionProfileControls } from "./extension-interactions.js";
import { useEffect, useRef, useState, useLayoutEffect, type ReactElement } from "react";
import { useChatPreview } from "./environment.js";
import { useUiText } from "../components/index.js";
import { uiLanguages } from "./ui-language.js";

export interface InterfaceSettingsProps {
  language: UiLanguageState;
  executionProfile?: ExecutionProfileProjection | null;
  providerConfig?: ProviderConfigProjection | null;
  openRequest?: number;
  onChooseProfile?(profile: "controlled" | "trusted"): void;
  onEndRuntime?(): void;
  onRecoverRuntime?(): void;
  onAddApiKey?(providerId: string): void;
  onLogoutProvider?(providerId: string): void;
  onSetDefaultModel?(provider: string, modelId: string): void;
  onRefreshProviders?(): void;
}

/** Native modal owns focus containment/Escape; no document listeners or host settings. */
export function InterfaceSettings({
  language,
  executionProfile = null,
  providerConfig = null,
  openRequest = 0,
  onChooseProfile,
  onEndRuntime,
  onRecoverRuntime,
  onAddApiKey,
  onLogoutProvider,
  onSetDefaultModel,
  onRefreshProviders,
}: InterfaceSettingsProps): ReactElement {
  const { locale, text: t } = useUiText();
  const preview = useChatPreview();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (openRequest > 0) setOpen(true);
  }, [openRequest]);
  useLayoutEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    if (typeof node.showModal === "function") node.showModal();
    else node.open = true; // jsdom; native modal behavior is verified in Chrome.
  }, [open]);
  const finishClose = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }); };
  const close = () => {
    if (typeof dialog.current?.close === "function") dialog.current.close();
    else finishClose();
  };
  const defaultValue = providerConfig?.defaultProvider && providerConfig.defaultModelId
    ? `${providerConfig.defaultProvider}\0${providerConfig.defaultModelId}`
    : "";
  return <>
    <button ref={trigger} className="candidate__icon" type="button" aria-label={t("Interface settings")} title={t("Interface settings")}
      onClick={() => setOpen(true)}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m8 2-.5 2-2 .9-1.8-.6-2 3.4 1.5 1.4v2l-1.5 1.4 2 3.4 1.8-.6 2 .9.5 2h4l.5-2 2-.9 1.8.6 2-3.4-1.5-1.4v-2l1.5-1.4-2-3.4-1.8.6-2-.9L12 2Z"/><circle cx="10" cy="10" r="3"/></svg>
    </button>
    {open && <dialog ref={dialog} className="candidate-settings" aria-label={t("Interface settings")} onClose={finishClose}
      onKeyDown={event => { if (event.key === "Escape") event.stopPropagation(); }}>
      <header><h2>{t("Interface settings")}</h2>
        <button className="candidate__icon" type="button" aria-label={t("Close settings")} title={t("Close settings")}
          onClick={close}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M5 15 15 5"/></svg>
        </button>
      </header>
      <section className="candidate-settings__section" aria-labelledby="candidate-settings-language">
        <h3 id="candidate-settings-language">{t("Language")}</h3>
        <label className="candidate-settings__row"><span className="candidate-settings__hint">{t("Language")}</span>
          <select aria-label={t("Language")} value={locale} onChange={event => language.select(event.currentTarget.value)}>
            {uiLanguages.map(item => <option key={item.locale} value={item.locale}>{item.label}</option>)}
          </select>
        </label>
        <p className="candidate-settings__note">{t(preview ? "For this preview only. Reloading the page restores English." : "For this view only. Reloading the view restores English.")}</p>
      </section>
      {providerConfig && (
        <section className="candidate-settings__section" aria-labelledby="candidate-settings-providers">
          <h3 id="candidate-settings-providers">{t("Providers and models")}</h3>
          <p className="candidate-settings__note">{t("API keys are entered in a native password prompt. Keys are never shown in this view.")}</p>
          {providerConfig.error && <p className="candidate-settings__error" role="alert">{providerConfig.error}</p>}
          <div className="candidate-settings__row">
            <span className="candidate-settings__hint">{t("Default model")}</span>
            <select
              aria-label={t("Default model")}
              disabled={providerConfig.busy || !onSetDefaultModel || providerConfig.catalog.length === 0}
              value={defaultValue}
              onChange={event => {
                const [provider, modelId] = event.currentTarget.value.split("\0");
                if (provider && modelId) onSetDefaultModel?.(provider, modelId);
              }}
            >
              <option value="">{providerConfig.catalog.length ? t("Select a default model") : t("No models available")}</option>
              {providerConfig.catalog.map(entry => (
                <option key={`${entry.provider}:${entry.modelId}`} value={`${entry.provider}\0${entry.modelId}`}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
          <ul className="candidate-settings__providers">
            {providerConfig.providers.map(provider => (
              <li key={provider.providerId} className="candidate-settings__provider">
                <div>
                  <strong>{provider.displayName}</strong>
                  <span className="candidate-settings__hint">
                    {provider.configured
                      ? t("Configured{source}", { source: provider.authLabel ? ` · ${provider.authLabel}` : "" })
                      : t("Not configured")}
                  </span>
                </div>
                <div className="candidate-settings__provider-actions">
                  {provider.canAddApiKey && onAddApiKey && (
                    <button type="button" disabled={providerConfig.busy}
                      onClick={() => onAddApiKey(provider.providerId)}>
                      {t(provider.configured ? "Update API key" : "Add API key")}
                    </button>
                  )}
                  {provider.canLogout && onLogoutProvider && (
                    <button type="button" disabled={providerConfig.busy}
                      onClick={() => onLogoutProvider(provider.providerId)}>
                      {t("Remove credentials")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {providerConfig.providers.length === 0 && (
            <p className="candidate-settings__note">{t("No API-key providers are available yet.")}</p>
          )}
          {onRefreshProviders && (
            <button className="candidate-settings__refresh" type="button" disabled={providerConfig.busy}
              onClick={onRefreshProviders}>
              {t(providerConfig.busy ? "Refreshing providers…" : "Refresh providers")}
            </button>
          )}
        </section>
      )}
      {executionProfile && onChooseProfile && onEndRuntime && onRecoverRuntime && (
        <section className="candidate-settings__section" aria-label={t("Runtime extensions")}>
          <ExecutionProfileControls
            state={executionProfile}
            language={locale === "zh-CN" ? "zh-CN" : "en"}
            density="settings"
            onChoose={onChooseProfile}
            onEnd={onEndRuntime}
            onRecover={onRecoverRuntime}
          />
        </section>
      )}
    </dialog>}
  </>;
}
