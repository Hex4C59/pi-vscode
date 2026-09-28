import { ChatDialog } from "./chat-dialog.js";
import { SessionIcon } from "./session-icon.js";
import type { UiLanguageState } from "./types.js";
import type { ExecutionProfileProjection, ProviderConfigEntry, ProviderConfigProjection } from "../../extension/contracts/index.js";
import { ExecutionProfileControls } from "./extension-interactions.js";
import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import { useUiText } from "../components/index.js";
import { uiLanguages } from "./ui-language.js";

export interface InterfaceSettingsProps {
  language: UiLanguageState;
  executionProfile?: ExecutionProfileProjection | null;
  providerConfig?: ProviderConfigProjection | null;
  sessionModel?: string | null;
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

function sessionMatchesDefault(
  sessionModel: string | null | undefined,
  provider: string | null,
  modelId: string | null,
  label: string | undefined,
): boolean {
  if (!sessionModel || !provider || !modelId) return false;
  return sessionModel === `${provider} / ${modelId}` || sessionModel === label || sessionModel === `${provider} / ${label}`;
}

/** Native modal owns focus containment/Escape; no document listeners or host settings. */
export function InterfaceSettings({
  language,
  executionProfile = null,
  providerConfig = null,
  sessionModel = null,
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
  const trigger = useRef<HTMLButtonElement>(null);
  const languageId = useId();
  const defaultModelId = useId();
  const providerId = useId();
  useEffect(() => {
    if (openRequest > 0) setOpen(true);
  }, [openRequest]);
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
  const defaultValue = providerConfig?.defaultProvider && providerConfig.defaultModelId
    ? `${providerConfig.defaultProvider}\0${providerConfig.defaultModelId}`
    : "";
  const selectedProvider = providerConfig?.providers.find(entry => entry.providerId === selectedProviderId) ?? null;
  const configuredNames = providerConfig?.providers.filter(entry => entry.configured).map(entry => entry.displayName) ?? [];
  const defaultEntry = providerConfig?.catalog.find(entry =>
    entry.provider === providerConfig.defaultProvider && entry.modelId === providerConfig.defaultModelId);
  const defaultMatchesSession = sessionMatchesDefault(
    sessionModel, providerConfig?.defaultProvider ?? null, providerConfig?.defaultModelId ?? null, defaultEntry?.label);
  const providerStatus = providerConfig?.busy
    ? "busy"
    : selectedProvider?.configured ? "ready"
      : selectedProvider ? "empty"
        : providerConfig?.providers.length === 0 ? "empty"
          : "empty";
  return <>
    <button ref={trigger} className="candidate__icon session-icon-button" aria-haspopup="dialog" aria-expanded={open} type="button" aria-label={t("Interface settings")} title={t("Interface settings")}
      onClick={() => setOpen(true)}>
      <SessionIcon name="settings" />
    </button>
    {open && <ChatDialog className="candidate-settings" title={t("Interface settings")} closeLabel={t("Close settings")} onClose={finishClose}>
      <section className="candidate-settings__section" aria-labelledby="candidate-settings-language">
        <div className="candidate-settings__heading"><h3 id="candidate-settings-language">{t("Language")}</h3></div>
        <p className="candidate-settings__note">{t("For this view only. Reloading the view restores English.")}</p>
        <select id={languageId} aria-label={t("Language")} value={locale}
          onChange={event => language.select(event.currentTarget.value)}>
          {uiLanguages.map(item => <option key={item.locale} value={item.locale}>{item.label}</option>)}
        </select>
      </section>
      {providerConfig && (
        <section className="candidate-settings__section" aria-labelledby="candidate-settings-providers">
          <div className="candidate-settings__heading">
            <h3 id="candidate-settings-providers">{t("Providers and models")}</h3>
            {onRefreshProviders && (
              <button className="candidate__icon candidate-settings__refresh" type="button" disabled={providerConfig.busy} aria-busy={providerConfig.busy}
                aria-label={t(providerConfig.busy ? "Refreshing providers…" : "Refresh providers")}
                title={t(providerConfig.busy ? "Refreshing providers…" : "Refresh providers")}
                onClick={onRefreshProviders}>
                <SessionIcon name="refresh-cw" />
              </button>
            )}
          </div>
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
            <p className="candidate-settings__note">{t("Saved default. This is not a connection test.")}</p>
            {sessionModel
              ? <>
                <p className="candidate-settings__note" data-testid="session-model">{t("This session: {model}", { model: sessionModel })}</p>
                {!defaultMatchesSession && <p className="candidate-settings__note">{t("Changing the default does not replace the current session model until the host applies it.")}</p>}
              </>
              : <p className="candidate-settings__note" data-testid="session-model">{t("No live session model yet. The default is used when a session starts.")}</p>}
          </div>
          <p className="candidate-settings__note" data-testid="configured-providers">
            {configuredNames.length
              ? t("Configured providers: {names}", { names: configuredNames.join(", ") })
              : t("No providers configured yet.")}
          </p>
          {providerConfig.providers.length === 0 ? (
            <p className="candidate-settings__note" role="status">{t(providerConfig.busy ? "Loading providers…" : "No API-key providers are available yet.")}</p>
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
                  <p className={`candidate-settings__status is-${providerStatus}`} data-provider-status={providerStatus}>
                    <span className="candidate-settings__dot" aria-hidden="true" />
                    {providerConfig.busy
                      ? t("Refreshing providers…")
                      : selectedProvider.configured
                        ? t("Configured{source}", { source: selectedProvider.authLabel ? ` · ${selectedProvider.authLabel}` : "" })
                        : t("Not configured")}
                  </p>
                  <p className="candidate-settings__note">{t("API keys are entered in a native password prompt. Keys are never shown in this view.")}</p>
                  <p className="candidate-settings__note">{t("Configured means credentials are saved, not that a connection test succeeded.")}</p>
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
                  {providerConfig.error && <p className="candidate-settings__error" role="alert">{providerConfig.error}</p>}
                </div>
              )}
            </>
          )}
          {providerConfig.error && providerConfig.providers.length === 0 && <p className="candidate-settings__error" role="alert">{providerConfig.error}</p>}
        </section>
      )}
      {executionProfile && onChooseProfile && onEndRuntime && onRecoverRuntime && (
        <section className="candidate-settings__section">
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
    </ChatDialog>}
  </>;
}
