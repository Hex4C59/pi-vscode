import { createRoot } from "react-dom/client";
import { useLayoutEffect, useRef, useState, type ReactElement } from "react";
import type { ProviderConfigIntent, ProviderConfigStateMessage } from "../../extension/contracts/index.js";
import { parseHostMessage, type WebviewBridge } from "../index.js";
import { UiTextProvider, useUiText } from "../components/index.js";
import { uiLanguages, SessionIcon } from "../chat/index.js";

type Page = "general" | "models" | "providers";
type Props = {
  config: ProviderConfigStateMessage | null;
  locale: "en" | "zh-CN";
  onLanguage(locale: "en" | "zh-CN"): void;
  onAction(intent: ProviderConfigIntent): void;
};

/** A focused task page; credentials never enter this renderer. */
function SettingsPage({ config, locale, onLanguage, onAction }: Props): ReactElement {
  const { text: t } = useUiText();
  const [page, setPage] = useState<Page>("models");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  const provider = config?.providers.find(item => item.providerId === providerId);
  const title = provider?.displayName ?? t(page === "general" ? "General" : page === "models" ? "Default model" : "Providers");
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    heading.current?.focus();
  }, [page, providerId]);
  const navigate = (next: Page) => { setPage(next); setProviderId(null); setQuery(""); };
  const models = config?.catalog.filter(item => `${item.label} ${item.provider} ${item.modelId}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) ?? [];
  return <main className="settings-page" lang={locale}>
    <nav className="settings-page__nav" aria-label={t("Settings categories")}>
      <h1>{t("Settings")}</h1>
      {(["general", "models", "providers"] as const).map(item => <button key={item} type="button" aria-current={page === item ? "page" : undefined}
        onClick={() => navigate(item)}>{t(item === "general" ? "General" : item === "models" ? "Default model" : "Providers")}</button>)}
    </nav>
    <section className="settings-page__content" aria-labelledby="settings-page-heading">
      <header className="settings-page__header">
        {provider && <button type="button" className="settings-page__icon" aria-label={t("Back to providers")} onClick={() => setProviderId(null)}><SessionIcon name="arrow-left" /></button>}
        <h2 id="settings-page-heading" tabIndex={-1} ref={heading}>{title}</h2>
        {page !== "general" && <button type="button" className="settings-page__icon" disabled={!config || config.busy} aria-busy={config?.busy ?? false}
          aria-label={t(config?.busy ? "Refreshing providers…" : "Refresh providers")} onClick={() => onAction({ type: "refreshProviderConfig" })}><SessionIcon name="refresh-cw" /></button>}
      </header>
      {page === "general" ? <div className="settings-page__row">
        <label htmlFor="settings-language">{t("Language")}</label>
        <select id="settings-language" value={locale} disabled={!config} onChange={event => onLanguage(event.currentTarget.value === "zh-CN" ? "zh-CN" : "en")}>
          {uiLanguages.map(item => <option key={item.locale} value={item.locale}>{item.label}</option>)}
        </select>
      </div> : !config ? <p role="status">{t("Loading providers…")}</p> : <>
        {config.error && <p className="settings-page__error" role="alert">{config.error}</p>}
        {page === "models" ? <>
          <label className="sr-only" htmlFor="settings-model-search">{t("Search models")}</label>
          <input id="settings-model-search" className="settings-page__search" type="search" placeholder={t("Search models")} value={query} onChange={event => setQuery(event.currentTarget.value)} />
          <div className="settings-page__models" aria-label={t("Default model")} aria-busy={config.busy}>
            {models.map(model => <button className="settings-page__model" type="button" key={`${model.provider}:${model.modelId}`}
              disabled={config.busy} aria-pressed={model.provider === config.defaultProvider && model.modelId === config.defaultModelId}
              onClick={() => onAction({ type: "setDefaultModel", provider: model.provider, modelId: model.modelId })}>
              <span><strong>{model.label}</strong><small>{model.provider}</small></span>
              <span className="settings-page__check"><SessionIcon name="check" /></span>
            </button>)}
            {!models.length && <p role="status">{t(config.busy ? "Loading providers…" : config.catalog.length ? "No matching models" : "No models available")}</p>}
          </div>
          <button className="settings-page__row settings-page__link" type="button" onClick={() => navigate("providers")}><span>{t("Manage providers")}</span><SessionIcon name="chevron-right" /></button>
        </> : provider ? <>
          <div className="settings-page__row"><span>{t("API key")}</span><span className="settings-page__muted">{t(provider.configured ? "Configured" : "Not configured")}</span></div>
          <div className="settings-page__actions">
            {provider.canAddApiKey && <button className="settings-page__button" type="button" disabled={config.busy} onClick={() => onAction({ type: "openProviderApiKey", providerId: provider.providerId })}>{t(provider.configured ? "Update API key" : "Add API key")}</button>}
            {provider.canLogout && <button type="button" disabled={config.busy} onClick={() => onAction({ type: "logoutProvider", providerId: provider.providerId })}>{t("Remove credentials")}</button>}
          </div>
        </> : <div className="settings-page__providers">
          {config.providers.map(item => <button className="settings-page__row settings-page__link" key={item.providerId} type="button" onClick={() => setProviderId(item.providerId)}>
            <span>{item.displayName}</span><span className="settings-page__trailing"><small>{t(item.configured ? "Configured" : "Not configured")}</small><SessionIcon name="chevron-right" /></span>
          </button>)}
          {!config.providers.length && <p role="status">{t(config.busy ? "Loading providers…" : "No API-key providers are available yet.")}</p>}
        </div>}
      </>}
    </section>
  </main>;
}

/** Settings bootstrap receives only non-secret provider state and shared UI language. */
export function mountSettings(container: HTMLElement, bridge: WebviewBridge): () => void {
  const root = createRoot(container);
  let config: ProviderConfigStateMessage | null = null;
  let identity: { generation: number; viewId: string } | undefined;
  let locale: "en" | "zh-CN" = "en";
  const onAction = (intent: ProviderConfigIntent | { type: "setUiLanguage"; locale: "en" | "zh-CN" }) => {
    if (identity) bridge.postMessage({ version: 3, ...identity, ...intent });
  };
  const render = () => root.render(<UiTextProvider value={uiLanguages.find(item => item.locale === locale) ?? uiLanguages[0]}>
    <SettingsPage config={config} locale={locale} onAction={onAction} onLanguage={next => onAction({ type: "setUiLanguage", locale: next })} />
  </UiTextProvider>);
  const unsubscribe = bridge.subscribe(value => {
    const message = parseHostMessage(value);
    if (!message || (message.type !== "providerConfigState" && message.type !== "uiLanguageState")) return;
    if (identity && (identity.viewId !== message.viewId || message.generation < identity.generation)) return;
    if (identity && message.generation > identity.generation) config = null;
    identity = { generation: message.generation, viewId: message.viewId };
    if (message.type === "providerConfigState") config = message;
    else locale = message.locale;
    render();
  });
  render();
  bridge.postMessage({ version: 3, type: "getWorkspaceState" });
  let disposed = false;
  return () => { if (disposed) return; disposed = true; unsubscribe(); root.unmount(); };
}
