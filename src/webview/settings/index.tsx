import { createRoot } from "react-dom/client";
import { useLayoutEffect, useRef, useState, type ReactElement } from "react";
import type {
  PluginInventoryIntent, PluginInventoryProjection, ProviderConfigIntent, ProviderConfigStateMessage,
} from "../../extension/contracts/index.js";
import { parseHostMessage, type WebviewBridge } from "../index.js";
import { UiTextProvider, useUiText } from "../components/index.js";
import { uiLanguages, SessionIcon } from "../chat/index.js";
import { PluginsPanel } from "./plugins.js";

type Page = "general" | "models" | "providers" | "plugins";
type SettingsAction = ProviderConfigIntent | PluginInventoryIntent;
type Props = {
  config: ProviderConfigStateMessage | null;
  inventory: PluginInventoryProjection | null;
  locale: "en" | "zh-CN";
  onLanguage(locale: "en" | "zh-CN"): void;
  onAction(intent: SettingsAction): void;
};

const pages: { id: Page; label: "General" | "Default model" | "Providers" | "Plugins" }[] = [
  { id: "general", label: "General" },
  { id: "models", label: "Default model" },
  { id: "providers", label: "Providers" },
  { id: "plugins", label: "Plugins" },
];

function pageTitle(page: Page, adding: boolean, providerName: string | undefined): "Add endpoint" | "General" | "Default model" | "Providers" | "Plugins" | string {
  if (adding) return "Add endpoint";
  if (providerName) return providerName;
  return pages.find(item => item.id === page)?.label ?? "Settings";
}

/** A focused task page; credentials never enter this renderer. */
function SettingsPage({ config, inventory, locale, onLanguage, onAction }: Props): ReactElement {
  const { text: t } = useUiText();
  const [page, setPage] = useState<Page>("models");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [endpointName, setEndpointName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [modelId, setModelId] = useState("");
  const [query, setQuery] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  const provider = config?.providers.find(item => item.providerId === providerId);
  const title = pageTitle(page, adding, provider?.displayName);
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    heading.current?.focus();
  }, [page, providerId, adding]);
  const navigate = (next: Page) => { setPage(next); setProviderId(null); setAdding(false); setQuery(""); };
  const models = config?.catalog.filter(item => `${item.label} ${item.provider} ${item.modelId}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) ?? [];
  return <main className="settings-page" lang={locale}>
    <nav className="settings-page__nav" aria-label={t("Settings categories")}>
      <h1>{t("Settings")}</h1>
      {pages.map(item => <button key={item.id} type="button" aria-current={page === item.id ? "page" : undefined}
        onClick={() => navigate(item.id)}>{t(item.label)}</button>)}
    </nav>
    <section className="settings-page__content" aria-labelledby="settings-page-heading">
      <header className="settings-page__header">
        {(provider || adding) && <button type="button" className="settings-page__icon" aria-label={t("Back to providers")} onClick={() => { setProviderId(null); setAdding(false); }}><SessionIcon name="arrow-left" /></button>}
        <h2 id="settings-page-heading" tabIndex={-1} ref={heading}>{typeof title === "string" && (title === "Add endpoint" || title === "General" || title === "Default model" || title === "Providers" || title === "Plugins") ? t(title) : title}</h2>
        {page !== "general" && page !== "plugins" && <button type="button" className="settings-page__icon" disabled={!config || config.busy} aria-busy={config?.busy ?? false}
          aria-label={t(config?.busy ? "Refreshing providers…" : "Refresh providers")} onClick={() => onAction({ type: "refreshProviderConfig" })}><SessionIcon name="refresh-cw" /></button>}
      </header>
      {page === "general" ? <div className="settings-page__row">
        <label htmlFor="settings-language">{t("Language")}</label>
        <select id="settings-language" value={locale} disabled={!config} onChange={event => onLanguage(event.currentTarget.value === "zh-CN" ? "zh-CN" : "en")}>
          {uiLanguages.map(item => <option key={item.locale} value={item.locale}>{item.label}</option>)}
        </select>
      </div> : page === "plugins" ? <PluginsPanel inventory={inventory} onAdd={() => onAction({ type: "addPluginInventoryEntry" })} />
        : !config ? <p role="status">{t("Loading providers…")}</p> : <>
        {config.error && <p className="settings-page__error" role="alert">{config.error}</p>}
        {page === "models" ? <ModelsPanel config={config} models={models} query={query} onQuery={setQuery} onAction={onAction} onProviders={() => navigate("providers")} />
          : adding ? <EndpointForm config={config} endpointName={endpointName} baseUrl={baseUrl} modelId={modelId}
            onName={setEndpointName} onUrl={setBaseUrl} onModel={setModelId} onAction={onAction} />
            : provider ? <ProviderDetail config={config} provider={provider} onAction={onAction} />
              : <ProviderList config={config} onAdd={() => setAdding(true)} onOpen={setProviderId} />}
      </>}
    </section>
  </main>;
}

function ModelsPanel({ config, models, query, onQuery, onAction, onProviders }: {
  config: ProviderConfigStateMessage; models: ProviderConfigStateMessage["catalog"]; query: string;
  onQuery(value: string): void; onAction(intent: SettingsAction): void; onProviders(): void;
}): ReactElement {
  const { text: t } = useUiText();
  return <>
    <label className="sr-only" htmlFor="settings-model-search">{t("Search models")}</label>
    <input id="settings-model-search" className="settings-page__search" type="search" placeholder={t("Search models")} value={query} onChange={event => onQuery(event.currentTarget.value)} />
    <div className="settings-page__models" aria-label={t("Default model")} aria-busy={config.busy}>
      {models.map(model => <button className="settings-page__model" type="button" key={`${model.provider}:${model.modelId}`}
        disabled={config.busy} aria-pressed={model.provider === config.defaultProvider && model.modelId === config.defaultModelId}
        onClick={() => onAction({ type: "setDefaultModel", provider: model.provider, modelId: model.modelId })}>
        <span><strong>{model.label}</strong><small>{model.provider}</small></span>
        <span className="settings-page__check"><SessionIcon name="check" /></span>
      </button>)}
      {!models.length && <p role="status">{t(config.busy ? "Loading providers…" : config.catalog.length ? "No matching models" : "No models available")}</p>}
    </div>
    <button className="settings-page__row settings-page__link" type="button" onClick={onProviders}><span>{t("Manage providers")}</span><SessionIcon name="chevron-right" /></button>
  </>;
}

function EndpointForm({ config, endpointName, baseUrl, modelId, onName, onUrl, onModel, onAction }: {
  config: ProviderConfigStateMessage; endpointName: string; baseUrl: string; modelId: string;
  onName(value: string): void; onUrl(value: string): void; onModel(value: string): void; onAction(intent: SettingsAction): void;
}): ReactElement {
  const { text: t } = useUiText();
  return <form className="settings-page__fields" onSubmit={event => {
    event.preventDefault();
    onAction({ type: "addCustomEndpoint", displayName: endpointName.trim(), baseUrl: baseUrl.trim(), modelId: modelId.trim() });
  }}>
    <label>{t("Endpoint name")}<input value={endpointName} disabled={config.busy} autoComplete="off" onChange={event => onName(event.currentTarget.value)} /></label>
    <label>{t("Base URL")}<input value={baseUrl} disabled={config.busy} autoComplete="off" inputMode="url" spellCheck={false} onChange={event => onUrl(event.currentTarget.value)} /></label>
    <label>{t("Model ID")}<input value={modelId} disabled={config.busy} autoComplete="off" spellCheck={false} onChange={event => onModel(event.currentTarget.value)} /></label>
    <div className="settings-page__actions">
      <button className="settings-page__button" type="submit" disabled={config.busy || !endpointName.trim() || !baseUrl.trim() || !modelId.trim()}>{t("Save endpoint")}</button>
    </div>
  </form>;
}

function ProviderDetail({ config, provider, onAction }: {
  config: ProviderConfigStateMessage; provider: NonNullable<ProviderConfigStateMessage["providers"][number]>;
  onAction(intent: SettingsAction): void;
}): ReactElement {
  const { text: t } = useUiText();
  return <>
    <div className="settings-page__row"><span>{t("API key")}</span><span className="settings-page__muted">{t(provider.configured ? "Configured" : "Not configured")}</span></div>
    <div className="settings-page__actions">
      {provider.canSignIn && <button className="settings-page__button" type="button" disabled={config.busy} onClick={() => onAction({ type: "openProviderOAuth", providerId: provider.providerId })}>{t("Sign in")}</button>}
      {provider.canAddApiKey && <button className="settings-page__button" type="button" disabled={config.busy} onClick={() => onAction({ type: "openProviderApiKey", providerId: provider.providerId })}>{t(provider.configured ? "Update API key" : "Add API key")}</button>}
      {provider.canLogout && <button type="button" disabled={config.busy} onClick={() => onAction({ type: "logoutProvider", providerId: provider.providerId })}>{t("Remove credentials")}</button>}
      {provider.canRemoveEndpoint && <button type="button" disabled={config.busy} onClick={() => onAction({ type: "removeCustomEndpoint", providerId: provider.providerId })}>{t("Remove endpoint")}</button>}
    </div>
  </>;
}

function ProviderList({ config, onAdd, onOpen }: {
  config: ProviderConfigStateMessage; onAdd(): void; onOpen(id: string): void;
}): ReactElement {
  const { text: t } = useUiText();
  return <>
    <div className="settings-page__actions">
      <button className="settings-page__button" type="button" disabled={config.busy} onClick={onAdd}>{t("Add endpoint")}</button>
    </div>
    <div className="settings-page__providers">
      {config.providers.map(item => <button className="settings-page__row settings-page__link" key={item.providerId} type="button" onClick={() => onOpen(item.providerId)}>
        <span>{item.displayName}</span><span className="settings-page__trailing"><small>{t(item.configured ? "Configured" : "Not configured")}</small><SessionIcon name="chevron-right" /></span>
      </button>)}
      {!config.providers.length && <p role="status">{t(config.busy ? "Loading providers…" : "No API-key providers are available yet.")}</p>}
    </div>
  </>;
}

/** Settings bootstrap receives only non-secret provider and inventory state and shared UI language. */
export function mountSettings(container: HTMLElement, bridge: WebviewBridge): () => void {
  const root = createRoot(container);
  let config: ProviderConfigStateMessage | null = null;
  let inventory: PluginInventoryProjection | null = null;
  let identity: { generation: number; viewId: string } | undefined;
  let locale: "en" | "zh-CN" = "en";
  const onAction = (intent: SettingsAction | { type: "setUiLanguage"; locale: "en" | "zh-CN" }) => {
    if (identity) bridge.postMessage({ version: 3, ...identity, ...intent });
  };
  const render = () => root.render(<UiTextProvider value={uiLanguages.find(item => item.locale === locale) ?? uiLanguages[0]}>
    <SettingsPage config={config} inventory={inventory} locale={locale} onAction={onAction} onLanguage={next => onAction({ type: "setUiLanguage", locale: next })} />
  </UiTextProvider>);
  const unsubscribe = bridge.subscribe(value => {
    const message = parseHostMessage(value);
    if (!message || (message.type !== "providerConfigState" && message.type !== "uiLanguageState" && message.type !== "pluginInventoryState")) return;
    if (identity && (identity.viewId !== message.viewId || message.generation < identity.generation)) return;
    if (identity && message.generation > identity.generation) { config = null; inventory = null; }
    identity = { generation: message.generation, viewId: message.viewId };
    if (message.type === "providerConfigState") config = message;
    else if (message.type === "pluginInventoryState") inventory = { busy: message.busy, error: message.error, entries: message.entries };
    else locale = message.locale;
    render();
  });
  render();
  bridge.postMessage({ version: 3, type: "getWorkspaceState" });
  let disposed = false;
  return () => { if (disposed) return; disposed = true; unsubscribe(); root.unmount(); };
}
