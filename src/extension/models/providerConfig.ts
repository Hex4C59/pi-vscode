import os from "node:os";
import path from "node:path";
import type { ProviderConfigEntry, ProviderConfigProjection, ModelCatalogEntry } from "../contracts/index.js";
import {
  MAX_MODEL_CATALOG_ENTRIES, MAX_MODEL_ID_CHARS, MAX_MODEL_LABEL_CHARS, MAX_MODEL_PROVIDER_CHARS,
} from "./modelCatalog.js";

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
  auth: { apiKey?: { login?: unknown }; oauth?: unknown };
  getModels(): readonly { id: string; name?: string }[];
};

type ModelRuntimeLike = {
  getProviders(): readonly SdkProvider[];
  getProviderAuthStatus(providerId: string): ProviderAuthStatus;
  listCredentials(options?: { signal?: AbortSignal }): Promise<readonly { providerId: string; type: string }[]>;
  getModels(providerId?: string): readonly { id: string; name?: string; provider?: string }[];
  getAvailable(providerId?: string): Promise<readonly { id: string; name?: string; provider?: string }[]>;
  login(providerId: string, type: "api_key", interaction: AuthInteraction): Promise<unknown>;
  logout(providerId: string): Promise<void>;
};

type SettingsManagerLike = {
  getDefaultProvider(): string | undefined;
  getDefaultModel(): string | undefined;
  setDefaultModelAndProvider(provider: string, modelId: string): void;
  flush(): Promise<void>;
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
};

export type ProviderConfigDeps = {
  createRuntime(): Promise<ModelRuntimeLike>;
  createSettings(): Promise<SettingsManagerLike>;
  promptUi: ProviderConfigPromptUi;
};

const empty = (): ProviderConfigProjection => ({
  busy: false, error: null, defaultProvider: null, defaultModelId: null, providers: [], catalog: [],
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

async function loadSdk(): Promise<{
  ModelRuntime: { create(options?: { refreshOnCreate?: boolean }): Promise<ModelRuntimeLike> };
  SettingsManager: { create(cwd: string, agentDir?: string): SettingsManagerLike };
  getAgentDir(): string;
}> {
  return import("@earendil-works/pi-coding-agent") as Promise<{
    ModelRuntime: { create(options?: { refreshOnCreate?: boolean }): Promise<ModelRuntimeLike> };
    SettingsManager: { create(cwd: string, agentDir?: string): SettingsManagerLike };
    getAgentDir(): string;
  }>;
}

export function createDefaultProviderConfigDeps(promptUi: ProviderConfigPromptUi): ProviderConfigDeps {
  return {
    async createRuntime() {
      const { ModelRuntime } = await loadSdk();
      return ModelRuntime.create({ refreshOnCreate: false });
    },
    async createSettings() {
      const { SettingsManager, getAgentDir } = await loadSdk();
      let agentDir = resolvePiAgentDir();
      try { agentDir = getAgentDir(); } catch { /* keep resolvePiAgentDir */ }
      return SettingsManager.create(os.homedir(), agentDir);
    },
    promptUi,
  };
}

function canLoginWithApiKey(provider: SdkProvider): boolean {
  return typeof provider.auth.apiKey?.login === "function";
}

/** Owns non-secret provider status, API-key login/logout and default model persistence. */
export class ProviderConfig {
  private value = empty();
  private revision = 0;
  private runtime: ModelRuntimeLike | undefined;
  private settings: SettingsManagerLike | undefined;

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
          void ui.showInformationMessage(event.message);
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
      });
    };
    for (const provider of runtime.getProviders()) {
      if (canLoginWithApiKey(provider) || stored.has(provider.id) || runtime.getProviderAuthStatus(provider.id).configured) {
        push(provider);
      }
    }
    providers.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return {
      busy: false,
      error: null,
      defaultProvider: settings.getDefaultProvider()?.trim() || null,
      defaultModelId: settings.getDefaultModel()?.trim() || null,
      providers,
      catalog,
    };
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
    const token = ++this.revision;
    this.value = { ...this.value, busy: true, error: null };
    this.changed();
    try {
      const runtime = await this.ensureRuntime();
      const settings = await this.ensureSettings();
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

  async openApiKey(providerId: string): Promise<void> {
    const token = ++this.revision;
    this.value = { ...this.value, busy: true, error: null };
    this.changed();
    try {
      const runtime = await this.ensureRuntime();
      const provider = runtime.getProviders().find(item => item.id === providerId);
      if (!provider || !canLoginWithApiKey(provider)) throw new Error("unsupported");
      await runtime.login(providerId, "api_key", this.interaction());
      if (token !== this.revision) return;
      await this.refresh();
    } catch (error) {
      if (token !== this.revision) return;
      const cancelled = error instanceof Error && error.message === "cancelled";
      this.value = {
        ...this.value,
        busy: false,
        error: cancelled ? null : "Could not save the API key. Try again.",
      };
      this.changed();
      if (!cancelled) await this.refresh();
    }
  }

  async logout(providerId: string): Promise<void> {
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

  async setDefaultModel(provider: string, modelId: string): Promise<void> {
    const token = ++this.revision;
    this.value = { ...this.value, busy: true, error: null };
    this.changed();
    try {
      const settings = await this.ensureSettings();
      settings.setDefaultModelAndProvider(provider, modelId);
      await settings.flush();
      if (token !== this.revision) return;
      this.value = {
        ...this.value,
        busy: false,
        error: null,
        defaultProvider: provider,
        defaultModelId: modelId,
      };
    } catch {
      if (token !== this.revision) return;
      this.value = { ...this.value, busy: false, error: "Could not save the default model." };
    }
    this.changed();
  }
}
