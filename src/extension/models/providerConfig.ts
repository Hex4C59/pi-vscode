import os from "node:os";
import type { ModelThinkingLevel } from "@earendil-works/pi-ai" with { "resolution-mode": "import" };
import path from "node:path";
import type { ProviderConfigEntry, ProviderConfigProjection, ModelCatalogEntry } from "../contracts/index.js";
import {
  endpointProviderId, isPublicHttpUrl,
  MAX_MODEL_CATALOG_ENTRIES, MAX_MODEL_ID_CHARS, MAX_MODEL_LABEL_CHARS, MAX_MODEL_PROVIDER_CHARS,
} from "../contracts/index.js";
import { addOpenAiEndpoint, listRemovableEndpointIds, removeOpenAiEndpoint } from "./customEndpoints.js";
import type { EndpointFileSystem, EndpointWriteResult } from "./endpointFileTransaction.js";

type AuthPrompt =
  | { type: "text"; message: string; placeholder?: string; signal?: AbortSignal }
  | { type: "secret"; message: string; placeholder?: string; signal?: AbortSignal }
  | { type: "select"; message: string; options: readonly { id: string; label: string; description?: string }[]; signal?: AbortSignal }
  | { type: "manual_code"; message: string; placeholder?: string; signal?: AbortSignal };

type AuthEvent =
  | { type: "info"; message: string }
  | { type: "auth_url"; url: string; instructions?: string }
  | { type: "device_code"; userCode: string; verificationUri: string }
  | { type: "progress"; message: string };

type AuthInteraction = {
  signal?: AbortSignal;
  prompt(prompt: AuthPrompt): Promise<string>;
  notify(event: AuthEvent): void;
};

type ProviderAuthStatus = { configured: boolean; source?: string; label?: string };

type SdkProvider = {
  id: string;
  name: string;
  auth: { apiKey?: { login?: unknown }; oauth?: { login?: unknown } };
  getModels(): readonly { id: string; name?: string }[];
};

type ThinkingOptions = { level: ModelThinkingLevel; levels: ModelThinkingLevel[] };

type ModelRuntimeLike = {
  thinkingOptions(provider: string, modelId: string, level: ModelThinkingLevel): ThinkingOptions | null;
  getProviders(): readonly SdkProvider[];
  getProviderAuthStatus(providerId: string): ProviderAuthStatus;
  listCredentials(options?: { signal?: AbortSignal }): Promise<readonly { providerId: string; type: string }[]>;
  getModels(providerId?: string): readonly { id: string; name?: string; provider?: string }[];
  getAvailable(providerId?: string): Promise<readonly { id: string; name?: string; provider?: string }[]>;
  getRegisteredNativeProvider?(providerId: string): unknown;
  reloadModels?(): Promise<void>;
  login(providerId: string, type: "api_key" | "oauth", interaction: AuthInteraction): Promise<unknown>;
  logout(providerId: string): Promise<void>;
};

type SettingsManagerLike = {
  getDefaultProvider(): string | undefined;
  getDefaultModel(): string | undefined;
  getDefaultThinkingLevel(): ModelThinkingLevel | undefined;
  getModelThinkingLevel(provider: string, modelId: string): ModelThinkingLevel | undefined;
  setModelThinkingLevel(provider: string, modelId: string, level: ModelThinkingLevel): void;
  setDefaultModelAndProvider(provider: string, modelId: string): void;
  reload(): Promise<void>;
  flush(): Promise<void>;
  drainErrors(): unknown[];
};

export type ProviderConfigPromptUi = {
  showInputBox(options: {
    prompt: string;
    placeHolder?: string;
    password?: boolean;
    ignoreFocusOut?: boolean;
  }): Thenable<string | undefined>;
  showQuickPick(
    items: { label: string; description?: string; id: string }[],
    options: { title: string; ignoreFocusOut?: boolean },
  ): Thenable<{ id: string } | undefined>;
  showInformationMessage(message: string): Thenable<unknown>;
  openExternal(url: string): Thenable<boolean>;
};

export type ProviderConfigDeps = {
  createRuntime(): Promise<ModelRuntimeLike>;
  createSettings(): Promise<SettingsManagerLike>;
  promptUi: ProviderConfigPromptUi;
  modelsPath(): string;
  endpointFileSystem?: EndpointFileSystem;
};

export type EndpointAddResult = {
  write: EndpointWriteResult;
  selection?: { providerId: string; modelId: string };
};

export type DefaultModelSaveResult =
  | { kind: "committed"; provider: string; modelId: string }
  | { kind: "failed" }
  | { kind: "not-run" }
  | { kind: "stale" };

const empty = (): ProviderConfigProjection => ({
  busy: false, error: null, defaultProvider: null, defaultModelId: null, defaultThinkingLevel: null, thinkingLevels: [], providers: [], catalog: [],
});

function boundLabel(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
}

function catalogFromModels(
  models: readonly { id: string; name?: string; provider?: string }[],
  fallbackProvider?: string,
): ModelCatalogEntry[] {
  const out: ModelCatalogEntry[] = [];
  for (const model of models) {
    if (out.length >= MAX_MODEL_CATALOG_ENTRIES) break;
    const provider = (model.provider ?? fallbackProvider ?? "").trim();
    const modelId = model.id?.trim() ?? "";
    if (!provider || provider.length > MAX_MODEL_PROVIDER_CHARS) continue;
    if (!modelId || modelId.length > MAX_MODEL_ID_CHARS) continue;
    const label = boundLabel((model.name ?? `${provider} / ${modelId}`).trim() || modelId, MAX_MODEL_LABEL_CHARS);
    out.push({ provider, modelId, label });
  }
  return out;
}

/** Resolve the pi agent directory, honoring PI_CODING_AGENT_DIR. */
export function resolvePiAgentDir(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.PI_CODING_AGENT_DIR?.trim();
  if (override) {
    if (override === "~") return os.homedir();
    if (override.startsWith("~/") || override.startsWith("~\\")) {
      return path.join(os.homedir(), override.slice(2));
    }
    return override;
  }
  return path.join(os.homedir(), ".pi", "agent");
}

export function createDefaultProviderConfigDeps(promptUi: ProviderConfigPromptUi): ProviderConfigDeps {
  return {
    async createRuntime() {
      const { ModelRuntime } = await import("@earendil-works/pi-coding-agent");
      const { getSupportedThinkingLevels, clampThinkingLevel } = await import("@earendil-works/pi-ai");
      const runtime = await ModelRuntime.create({ refreshOnCreate: false });
      return {
        getProviders: () => runtime.getProviders(),
        getProviderAuthStatus: id => runtime.getProviderAuthStatus(id),
        listCredentials: options => runtime.listCredentials(options),
        getModels: id => runtime.getModels(id),
        getAvailable: id => runtime.getAvailable(id),
        getRegisteredNativeProvider: id => runtime.getRegisteredNativeProvider(id),
        reloadModels: async () => { await runtime.refresh({ allowNetwork: false }); },
        login: (id, type, interaction) => runtime.login(id, type, interaction),
        logout: id => runtime.logout(id),
        thinkingOptions(provider: string, modelId: string, level: ModelThinkingLevel): ThinkingOptions | null {
          const model = runtime.getModel(provider, modelId);
          return model ? { level: clampThinkingLevel(model, level), levels: getSupportedThinkingLevels(model) } : null;
        },
      };
    },
    async createSettings() {
      const { SettingsManager, getAgentDir } = await import("@earendil-works/pi-coding-agent");
      let agentDir = resolvePiAgentDir();
      try { agentDir = getAgentDir(); } catch { /* keep resolvePiAgentDir */ }
      return SettingsManager.create(os.homedir(), agentDir);
    },
    promptUi,
    modelsPath: () => path.join(resolvePiAgentDir(), "models.json"),
  };
}

function endpointWriteError(result: EndpointWriteResult, action: "save" | "remove"): string {
  if (result.kind === "committed-cleanup-failed") {
    const done = action === "save" ? "saved" : "removed";
    return `The endpoint was ${done}, but file cleanup failed. Credential actions were not continued. Close writing windows and verify the leftover lock before clearing it, then refresh.`;
  }
  if (result.kind === "not-committed") {
    if (result.cleanupFailed) return "The endpoint was not changed, but file cleanup failed. Close writing windows and verify leftover transaction files before clearing them, then refresh.";
    if (result.reason === "occupied") return "The endpoint file is locked. Try again after the other write finishes. If this persists, close writing windows and verify the leftover lock before clearing it.";
    if (result.reason === "conflict") return "The endpoint file changed during the operation, so it was not overwritten. Refresh and try again.";
    if (result.reason === "invalid") return "The endpoint file is invalid, so it was not changed.";
    if (result.reason === "too-large") return "The endpoint file would exceed the 1 MiB size limit, so it was not changed.";
    if (result.reason === "exists") return "An endpoint with this name already exists. Refresh or choose another name.";
    if (result.reason === "missing") return "The endpoint no longer exists in the file. Refresh before continuing.";
  }
  return action === "save" ? "Could not save the endpoint. Try again." : "Could not remove the endpoint. Try again.";
}

function canLoginWithApiKey(provider: SdkProvider): boolean {
  return typeof provider.auth.apiKey?.login === "function";
}

function canLoginWithOAuth(provider: SdkProvider): boolean {
  return typeof provider.auth.oauth?.login === "function";
}

function boundedNotice(value: string): string {
  let text = "";
  for (const char of value) text += char.charCodeAt(0) <= 31 ? " " : char;
  text = text.trim();
  return text.length <= 240 ? text : `${text.slice(0, 239)}…`;
}

/** Owns non-secret provider status, API-key login/logout and default model persistence. */
export class ProviderConfig {
  private value = empty();
  private revision = 0;
  private runtime: ModelRuntimeLike | undefined;
  private settings: SettingsManagerLike | undefined;
  private saving = false;
  private removable = new Set<string>();

  constructor(
    private readonly deps: ProviderConfigDeps,
    private readonly changed: () => void,
  ) {}

  get snapshot(): Readonly<ProviderConfigProjection> { return this.value; }

  private interaction(): AuthInteraction {
    const ui = this.deps.promptUi;
    return {
      async prompt(prompt) {
        if (prompt.type === "select") {
          const picked = await ui.showQuickPick(
            prompt.options.map(option => ({ id: option.id, label: option.label, description: option.description })),
            { title: prompt.message, ignoreFocusOut: true },
          );
          if (!picked) throw new Error("cancelled");
          return picked.id;
        }
        const value = await ui.showInputBox({
          prompt: prompt.message,
          placeHolder: prompt.placeholder,
          password: prompt.type === "secret",
          ignoreFocusOut: true,
        });
        if (value === undefined) throw new Error("cancelled");
        return value;
      },
      notify(event) {
        if (event.type === "info" || event.type === "progress") {
          const message = boundedNotice(event.message);
          if (message) void ui.showInformationMessage(message);
          return;
        }
        if (event.type === "auth_url") {
          if (isPublicHttpUrl(event.url)) void ui.openExternal(event.url);
          const instructions = event.instructions ? boundedNotice(event.instructions) : "";
          if (instructions) void ui.showInformationMessage(instructions);
          return;
        }
        if (event.type === "device_code" && isPublicHttpUrl(event.verificationUri)) {
          const code = boundedNotice(event.userCode);
          if (code) void ui.showInformationMessage(`Sign-in code: ${code}`);
          void ui.openExternal(event.verificationUri);
        }
      },
    };
  }

  private async ensureRuntime(): Promise<ModelRuntimeLike> {
    if (!this.runtime) this.runtime = await this.deps.createRuntime();
    return this.runtime;
  }

  private async ensureSettings(): Promise<SettingsManagerLike> {
    if (!this.settings) this.settings = await this.deps.createSettings();
    return this.settings;
  }

  private projectFrom(
    runtime: ModelRuntimeLike,
    settings: SettingsManagerLike,
    credentials: readonly { providerId: string; type: string }[],
    catalog: ModelCatalogEntry[],
  ): ProviderConfigProjection {
    const stored = new Set(credentials.map(item => item.providerId));
    const seen = new Set<string>();
    const providers: ProviderConfigEntry[] = [];
    const push = (provider: SdkProvider): void => {
      if (seen.has(provider.id) || providers.length >= 64) return;
      seen.add(provider.id);
      const status = runtime.getProviderAuthStatus(provider.id);
      const authLabel = status.label?.trim()
        ? boundLabel(status.label.trim(), 200)
        : status.source ? boundLabel(String(status.source), 64) : null;
      providers.push({
        providerId: provider.id.slice(0, MAX_MODEL_PROVIDER_CHARS),
        displayName: boundLabel(provider.name || provider.id, MAX_MODEL_LABEL_CHARS),
        configured: !!status.configured,
        authLabel,
        canAddApiKey: canLoginWithApiKey(provider),
        canLogout: stored.has(provider.id),
        canSignIn: canLoginWithOAuth(provider),
        canRemoveEndpoint: this.removable.has(provider.id),
      });
    };
    for (const provider of runtime.getProviders()) {
      const status = runtime.getProviderAuthStatus(provider.id);
      if (canLoginWithApiKey(provider) || canLoginWithOAuth(provider) || this.removable.has(provider.id)
        || stored.has(provider.id) || status.configured) {
        push(provider);
      }
    }
    providers.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return {
      busy: false,
      error: null,
      defaultProvider: settings.getDefaultProvider()?.trim() || null,
      defaultModelId: settings.getDefaultModel()?.trim() || null,
      ...this.thinkingProjection(runtime, settings),
      providers,
      catalog,
    };
  }

  private thinkingProjection(runtime: ModelRuntimeLike, settings: SettingsManagerLike): Pick<ProviderConfigProjection, "defaultThinkingLevel" | "thinkingLevels"> {
    const provider = settings.getDefaultProvider();
    const model = settings.getDefaultModel();
    const options = provider && model ? runtime.thinkingOptions(provider, model,
      settings.getModelThinkingLevel(provider, model) ?? settings.getDefaultThinkingLevel() ?? "medium") : null;
    return { defaultThinkingLevel: options?.level ?? null, thinkingLevels: options?.levels ?? [] };
  }

  private async buildCatalog(runtime: ModelRuntimeLike): Promise<ModelCatalogEntry[]> {
    try {
      const available = await runtime.getAvailable();
      const catalog = catalogFromModels(available);
      if (catalog.length > 0) return catalog;
    } catch { /* fall through to static catalogs */ }
    const catalog: ModelCatalogEntry[] = [];
    for (const provider of runtime.getProviders()) {
      if (!runtime.getProviderAuthStatus(provider.id).configured) continue;
      for (const entry of catalogFromModels(provider.getModels(), provider.id)) {
        if (catalog.length >= MAX_MODEL_CATALOG_ENTRIES) return catalog;
        if (!catalog.some(item => item.provider === entry.provider && item.modelId === entry.modelId)) {
          catalog.push(entry);
        }
      }
    }
    return catalog;
  }

  async refresh(): Promise<void> {
    if (this.saving) return;
    const token = ++this.revision;
    this.value = { ...this.value, busy: true, error: null };
    this.changed();
    try {
      const runtime = await this.ensureRuntime();
      await runtime.reloadModels?.();
      this.removable = await this.removableIds(runtime);
      const settings = await this.ensureSettings();
      await settings.reload();
      if (settings.drainErrors().length) throw new Error("settings unavailable");
      const credentials = await runtime.listCredentials();
      const catalog = await this.buildCatalog(runtime);
      if (token !== this.revision) return;
      this.value = this.projectFrom(runtime, settings, credentials, catalog);
    } catch {
      if (token !== this.revision) return;
      this.value = { ...this.value, busy: false, error: "Could not load provider configuration." };
    }
    this.changed();
  }

  private async removableIds(runtime: ModelRuntimeLike): Promise<Set<string>> {
    const ids = await listRemovableEndpointIds(
      this.deps.modelsPath(),
      id => runtime.getRegisteredNativeProvider?.(id) !== undefined,
    );
    return new Set(ids ?? []);
  }

  private async loginWith(providerId: string, type: "api_key" | "oauth"): Promise<void> {
    if (this.saving) return;
    const token = ++this.revision;
    this.value = { ...this.value, busy: true, error: null };
    this.changed();
    try {
      const runtime = await this.ensureRuntime();
      const provider = runtime.getProviders().find(item => item.id === providerId);
      const supported = provider && (type === "oauth" ? canLoginWithOAuth(provider) : canLoginWithApiKey(provider));
      if (!supported) throw new Error("unsupported");
      await runtime.login(providerId, type, this.interaction());
      if (token !== this.revision) return;
      await this.refresh();
    } catch (error) {
      if (token !== this.revision) return;
      const cancelled = error instanceof Error && error.message === "cancelled";
      this.value = {
        ...this.value,
        busy: false,
        error: cancelled ? null : type === "oauth" ? "Could not sign in. Try again." : "Could not save the API key. Try again.",
      };
      this.changed();
      if (!cancelled) await this.refresh();
    }
  }

  async openApiKey(providerId: string): Promise<void> {
    await this.loginWith(providerId, "api_key");
  }

  async openOAuth(providerId: string): Promise<void> {
    await this.loginWith(providerId, "oauth");
  }

  async addCustomEndpoint(input: { displayName: string; baseUrl: string; modelId: string }): Promise<EndpointAddResult | undefined> {
    if (this.saving) return undefined;
    const providerId = endpointProviderId(input.displayName);
    if (!providerId) {
      this.value = { ...this.value, error: "Could not save the endpoint. Use a name with letters or numbers." };
      this.changed();
      return undefined;
    }
    this.saving = true;
    const token = ++this.revision;
    this.value = { ...this.value, busy: true, error: null };
    this.changed();
    let saved: { providerId: string; modelId: string } | undefined;
    let cancelled = false;
    let result: EndpointWriteResult | undefined;
    try {
      const runtime = await this.ensureRuntime();
      result = await addOpenAiEndpoint(this.deps.modelsPath(), {
        providerId, displayName: input.displayName, baseUrl: input.baseUrl, modelId: input.modelId,
      }, id => runtime.getRegisteredNativeProvider?.(id) !== undefined, this.deps.endpointFileSystem);
      if (result.kind === "committed") {
        await runtime.reloadModels?.();
        if (token !== this.revision) return undefined;
        await runtime.login(providerId, "api_key", this.interaction());
        if (token === this.revision) saved = { providerId, modelId: input.modelId };
      }
    } catch (error) {
      cancelled = error instanceof Error && error.message === "cancelled";
    } finally { this.saving = false; }
    if (token !== this.revision) return undefined;
    if (!result || result.kind !== "committed") {
      const write: EndpointWriteResult = result ?? { kind: "not-committed", reason: "write", cleanupFailed: false };
      this.publishEndpointError(write, "save");
      return { write };
    }
    const beforeRefresh = this.revision;
    await this.refresh();
    if (this.revision !== beforeRefresh + 1) return undefined;
    if (!saved && !cancelled) this.publishEndpointError(result, "save");
    return saved ? { write: result, selection: saved } : { write: result };
  }

  private publishEndpointError(result: EndpointWriteResult, action: "save" | "remove"): void {
    this.value = { ...this.value, busy: false, error: endpointWriteError(result, action) };
    this.changed();
  }

  async removeCustomEndpoint(providerId: string): Promise<EndpointWriteResult | undefined> {
    if (this.saving) return;
    this.saving = true;
    const token = ++this.revision;
    this.value = { ...this.value, busy: true, error: null };
    this.changed();
    let removed = false;
    let result: EndpointWriteResult | undefined;
    try {
      const runtime = await this.ensureRuntime();
      result = await removeOpenAiEndpoint(
        this.deps.modelsPath(), providerId,
        id => runtime.getRegisteredNativeProvider?.(id) !== undefined, this.deps.endpointFileSystem,
      );
      if (result.kind === "committed") {
        await runtime.reloadModels?.();
        if (token !== this.revision) return;
        await runtime.logout(providerId);
        removed = true;
      }
    } catch { /* Fixed error below; never forward storage or SDK exceptions. */ }
    finally { this.saving = false; }
    if (token !== this.revision) return;
    if (!result || result.kind !== "committed") {
      const write: EndpointWriteResult = result ?? { kind: "not-committed", reason: "write", cleanupFailed: false };
      this.publishEndpointError(write, "remove");
      return write;
    }
    const beforeRefresh = this.revision;
    await this.refresh();
    if (this.revision !== beforeRefresh + 1) return undefined;
    if (!removed) this.publishEndpointError(result, "remove");
    return result;
  }

  async logout(providerId: string): Promise<void> {
    if (this.saving) return;
    const token = ++this.revision;
    this.value = { ...this.value, busy: true, error: null };
    this.changed();
    try {
      const runtime = await this.ensureRuntime();
      await runtime.logout(providerId);
      if (token !== this.revision) return;
      await this.refresh();
    } catch {
      if (token !== this.revision) return;
      this.value = { ...this.value, busy: false, error: "Could not remove stored credentials." };
      this.changed();
      await this.refresh();
    }
  }

  async setDefaultModel(provider: string, modelId: string): Promise<DefaultModelSaveResult> {
    if (this.value.busy || this.saving) return { kind: "not-run" };
    this.saving = true;
    const token = ++this.revision;
    this.value = { ...this.value, busy: true, error: null };
    this.changed();
    try {
      return await this.commitDefaultModel(token, provider, modelId);
    } catch {
      if (token !== this.revision) return { kind: "stale" };
      this.value = { ...this.value, busy: false, error: "Could not save the default model." };
      this.settings = undefined;
      this.changed();
      return { kind: "failed" };
    } finally { this.saving = false; }
  }

  private async commitDefaultModel(
    token: number, provider: string, modelId: string,
  ): Promise<DefaultModelSaveResult> {
    const settings = await this.ensureSettings();
    const runtime = await this.ensureRuntime();
    if (settings.drainErrors().length) throw new Error("settings unavailable");
    settings.setDefaultModelAndProvider(provider, modelId);
    await settings.flush();
    if (settings.drainErrors().length) throw new Error("settings write failed");
    if (token !== this.revision) return { kind: "stale" };
    this.value = {
      ...this.value,
      busy: false,
      error: null,
      defaultProvider: provider,
      defaultModelId: modelId,
      ...this.thinkingProjection(runtime, settings),
    };
    this.changed();
    return { kind: "committed", provider, modelId };
  }

  async setDefaultThinkingLevel(provider: string, modelId: string, level: string): Promise<void> {
    if (this.value.busy || this.saving) return;
    if (provider !== this.value.defaultProvider || modelId !== this.value.defaultModelId
      || !this.value.thinkingLevels.includes(level)) {
      this.value = { ...this.value, error: "This thinking level is unavailable for the default model. Refresh model settings." };
      this.changed();
      return;
    }
    this.saving = true;
    this.value = { ...this.value, busy: true, error: null };
    this.changed();
    try {
      const settings = await this.ensureSettings();
      const runtime = await this.ensureRuntime();
      const options = runtime.thinkingOptions(provider, modelId, settings.getDefaultThinkingLevel() ?? "medium");
      const supported = options?.levels.find(candidate => candidate === level);
      if (!supported) throw new Error("unsupported");
      if (settings.drainErrors().length) throw new Error("settings unavailable");
      settings.setModelThinkingLevel(provider, modelId, supported);
      await settings.flush();
      if (settings.drainErrors().length) throw new Error("settings write failed");
      this.value = { ...this.value, busy: false, error: null, defaultThinkingLevel: supported };
    } catch {
      this.value = { ...this.value, busy: false, error: "Could not save the default thinking level. Refresh model settings and try again." };
      this.settings = undefined;
    } finally { this.saving = false; }
    this.changed();
  }

}
