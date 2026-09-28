import type { UiLanguageState } from "./types.js";
import type { ExecutionProfileProjection, ProviderConfigEntry, ProviderConfigProjection } from "../../extension/contracts/index.js";
import { ExecutionProfileControls } from "./extension-interactions.js";
import { useEffect, useId, useRef, useState, useLayoutEffect, type ReactElement } from "react";
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

function preferredProviderId(providers: readonly ProviderConfigEntry[], defaultProvider: string | null): string {
  if (defaultProvider && providers.some(entry => entry.providerId === defaultProvider)) return defaultProvider;
  return providers.find(entry => entry.configured)?.providerId ?? providers[0]?.providerId ?? "";
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
  const [open, setOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const languageId = useId();
  const defaultModelId = useId();
  const providerId = useId();
  useEffect(() => {
    if (openRequest > 0) setOpen(true);
  }, [openRequest]);
  useLayoutEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    if (typeof node.showModal === "function") node.showModal();
    else node.open = true; // jsdom; native modal behavior is verified in Chrome.
  }, [open]);
  useEffect(() => {
    if (!providerConfig) {
      setSelectedProviderId("");
      return;
    }
    const ids = new Set(providerConfig.providers.map(entry => entry.providerId));
    if (selectedProviderId && ids.has(selectedProviderId)) return;
    setSelectedProviderId(preferredProviderId(providerConfig.providers, providerConfig.defaultProvider));
  }, [providerConfig, selectedProviderId]);
  const finishClose = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }); };
  const close = () => {
    if (typeof dialog.current?.close === "function") dialog.current.close();
    else finishClose();
  };
  const defaultValue = providerConfig?.defaultProvider && providerConfig.defaultModelId
    ? `${providerConfig.defaultProvider}\0${providerConfig.defaultModelId}`
    : "";
  const selectedProvider = providerConfig?.providers.find(entry => entry.providerId === selectedProviderId) ?? null;
  const configuredNames = providerConfig?.providers.filter(entry => entry.configured).map(entry => entry.displayName) ?? [];
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
        <div className="candidate-settings__heading"><h3 id="candidate-settings-language">{t("Language")}</h3></div>
        <div className="candidate-settings__field">
          <select id={languageId} aria-label={t("Language")} value={locale}
            onChange={event => language.select(event.currentTarget.value)}>
            {uiLanguages.map(item => <option key={item.locale} value={item.locale}>{item.label}</option>)}
          </select>
        </div>
      </section>
      {providerConfig && (
        <section className="candidate-settings__section" aria-labelledby="candidate-settings-providers">
          <div className="candidate-settings__heading">
            <h3 id="candidate-settings-providers">{t("Providers and models")}</h3>
            {onRefreshProviders && (
              <button className="candidate__icon" type="button" disabled={providerConfig.busy} aria-busy={providerConfig.busy}
                aria-label={t(providerConfig.busy ? "Refreshing providers…" : "Refresh providers")}
                title={t(providerConfig.busy ? "Refreshing providers…" : "Refresh providers")}
                onClick={onRefreshProviders}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10a6 6 0 1 1-1.8-4.3M16 3v4h-4" /></svg>
              </button>
            )}
          </div>
          {providerConfig.error && <p className="candidate-settings__error" role="alert">{providerConfig.error}</p>}
          <div className="candidate-settings__field">
            <label htmlFor={defaultModelId}>{t("Default model")}</label>
            <select
              id={defaultModelId}
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
          <p className="candidate-settings__note" data-testid="configured-providers">
            {configuredNames.length
              ? t("Configured providers: {names}", { names: configuredNames.join(", ") })
              : t("No providers configured yet.")}
          </p>
          {providerConfig.providers.length === 0 ? (
            <p className="candidate-settings__note">{t("No API-key providers are available yet.")}</p>
          ) : (
            <>
              <div className="candidate-settings__field">
                <label htmlFor={providerId}>{t("Provider")}</label>
                <select
                  id={providerId}
                  aria-label={t("Provider")}
                  disabled={providerConfig.busy}
                  value={selectedProviderId}
                  onChange={event => setSelectedProviderId(event.currentTarget.value)}
                >
                  {!selectedProviderId && <option value="">{t("Select a provider")}</option>}
                  {providerConfig.providers.map(provider => (
                    <option key={provider.providerId} value={provider.providerId}>
                      {provider.displayName}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProvider && (
                <div className="candidate-settings__provider" data-testid="selected-provider">
                  <p className={`candidate-settings__status${selectedProvider.configured ? " is-ready" : ""}`}>
                    <span className="candidate-settings__dot" aria-hidden="true" />
                    {selectedProvider.configured
                      ? t("Configured{source}", { source: selectedProvider.authLabel ? ` · ${selectedProvider.authLabel}` : "" })
                      : t("Not configured")}
                  </p>
                  <div className="candidate-settings__actions candidate-settings__provider-actions">
                    {selectedProvider.canAddApiKey && onAddApiKey && (
                      <button type="button" disabled={providerConfig.busy}
                        onClick={() => onAddApiKey(selectedProvider.providerId)}>
                        {t(selectedProvider.configured ? "Update API key" : "Add API key")}
                      </button>
                    )}
                    {selectedProvider.canLogout && onLogoutProvider && (
                      <button type="button" disabled={providerConfig.busy}
                        onClick={() => onLogoutProvider(selectedProvider.providerId)}>
                        {t("Remove credentials")}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
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
