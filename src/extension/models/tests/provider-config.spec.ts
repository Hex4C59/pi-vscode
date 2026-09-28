import assert from "node:assert/strict";
import { test } from "node:test";
import { ProviderConfig, resolvePiAgentDir, type ProviderConfigDeps } from "../providerConfig.js";

function deps(overrides: Partial<ProviderConfigDeps> = {}): ProviderConfigDeps {
  const providers = [{
    id: "anthropic",
    name: "Anthropic",
    auth: { apiKey: { login: async () => ({ type: "api_key" as const, key: "sk-test" }) } },
    getModels: () => [{ id: "claude", name: "Claude" }],
  }];
  let configured = false;
  let credentials: { providerId: string; type: string }[] = [];
  const runtime: Awaited<ReturnType<ProviderConfigDeps["createRuntime"]>> = {
    thinkingOptions: (_provider, _model, level) => ({ level: level === "high" ? "high" : "medium", levels: ["off", "medium", "high"] }),
    getProviders: () => providers,
    getProviderAuthStatus: () => ({ configured, source: configured ? "stored" : undefined, label: configured ? "stored key" : undefined }),
    listCredentials: async () => credentials,
    getModels: () => configured ? [{ id: "claude", name: "Claude", provider: "anthropic" }] : [],
    getAvailable: async () => configured ? [{ id: "claude", name: "Claude", provider: "anthropic" }] : [],
    login: async () => { configured = true; credentials = [{ providerId: "anthropic", type: "api_key" }]; },
    logout: async () => { configured = false; credentials = []; },
  };
  let defaultProvider: string | undefined;
  let defaultModel: string | undefined;
  const levels = new Map<string, NonNullable<ReturnType<Awaited<ReturnType<ProviderConfigDeps["createSettings"]>>["getDefaultThinkingLevel"]>>>();
  const settings = {
    getDefaultProvider: () => defaultProvider,
    getDefaultModel: () => defaultModel,
    getDefaultThinkingLevel: () => "medium" as const,
    getModelThinkingLevel: (provider: string, model: string) => levels.get(`${provider}/${model}`),
    setModelThinkingLevel: (provider: string, model: string, level: NonNullable<ReturnType<Awaited<ReturnType<ProviderConfigDeps["createSettings"]>>["getDefaultThinkingLevel"]>>) => { levels.set(`${provider}/${model}`, level); },
    setDefaultModelAndProvider(provider: string, modelId: string) { defaultProvider = provider; defaultModel = modelId; },
    reload: async () => {},
    flush: async () => {},
    drainErrors: () => [],
  };
  const prompts: string[] = [];
  return {
    createRuntime: async () => runtime,
    createSettings: async () => settings,
    promptUi: {
      showInputBox: async options => { prompts.push(options.prompt); return options.password ? "sk-test" : "value"; },
      showQuickPick: async () => undefined,
      showInformationMessage: async () => undefined,
    },
    ...overrides,
  };
}

test("resolvePiAgentDir honors PI_CODING_AGENT_DIR", () => {
  assert.match(resolvePiAgentDir({}), /[\\/]\.pi[\\/]agent$/);
  assert.equal(resolvePiAgentDir({ PI_CODING_AGENT_DIR: "D:\\custom\\agent" }), "D:\\custom\\agent");
});

test("provider config projects API-key providers without secrets and stores defaults", async () => {
  let interactionUsed = false;
  const base = deps({
    createRuntime: async () => {
      const providers = [{
        id: "anthropic",
        name: "Anthropic",
        auth: { apiKey: { login: async () => ({ type: "api_key" as const, key: "sk-test" }) } },
        getModels: () => [{ id: "claude", name: "Claude" }],
      }];
      let configured = false;
      let credentials: { providerId: string; type: string }[] = [];
      return {
        thinkingOptions: () => null,
        getProviders: () => providers,
        getProviderAuthStatus: () => ({ configured, source: configured ? "stored" : undefined, label: configured ? "stored key" : undefined }),
        listCredentials: async () => credentials,
        getModels: () => configured ? [{ id: "claude", name: "Claude", provider: "anthropic" }] : [],
        getAvailable: async () => configured ? [{ id: "claude", name: "Claude", provider: "anthropic" }] : [],
        login: async (_providerId, _type, interaction) => {
          interactionUsed = true;
          await interaction.prompt({ type: "secret", message: "API key" });
          configured = true;
          credentials = [{ providerId: "anthropic", type: "api_key" }];
        },
        logout: async () => { configured = false; credentials = []; },
      };
    },
  });
  const config = new ProviderConfig(base, () => {});
  await config.refresh();
  assert.equal(config.snapshot.busy, false);
  assert.equal(config.snapshot.providers.length, 1);
  assert.equal(config.snapshot.providers[0]?.providerId, "anthropic");
  assert.equal(config.snapshot.providers[0]?.configured, false);
  assert.equal(config.snapshot.providers[0]?.canAddApiKey, true);
  assert.equal(JSON.stringify(config.snapshot).includes("sk-"), false);

  await config.openApiKey("anthropic");
  assert.equal(interactionUsed, true);
  assert.equal(config.snapshot.providers[0]?.configured, true);
  assert.equal(config.snapshot.catalog[0]?.modelId, "claude");
  assert.equal(JSON.stringify(config.snapshot).includes("sk-"), false);

  await config.setDefaultModel("anthropic", "claude");
  assert.equal(config.snapshot.defaultProvider, "anthropic");
  assert.equal(config.snapshot.defaultModelId, "claude");

  await config.logout("anthropic");
  assert.equal(config.snapshot.providers[0]?.configured, false);
});

test("cancelled API key prompt does not report a hard error", async () => {
  const config = new ProviderConfig(deps({
    createRuntime: async () => {
      const providers = [{
        id: "anthropic",
        name: "Anthropic",
        auth: { apiKey: { login: async () => ({ type: "api_key" as const, key: "sk-test" }) } },
        getModels: () => [{ id: "claude", name: "Claude" }],
      }];
      return {
        thinkingOptions: () => null,
        getProviders: () => providers,
        getProviderAuthStatus: () => ({ configured: false }),
        listCredentials: async () => [],
        getModels: () => [],
        getAvailable: async () => [],
        login: async (_providerId, _type, interaction) => {
          await interaction.prompt({ type: "secret", message: "API key" });
        },
        logout: async () => {},
      };
    },
    promptUi: {
      showInputBox: async () => undefined,
      showQuickPick: async () => undefined,
      showInformationMessage: async () => undefined,
    },
  }), () => {});
  await config.refresh();
  await config.openApiKey("anthropic");
  assert.equal(config.snapshot.error, null);
  assert.equal(config.snapshot.providers[0]?.configured, false);
});

test("pre-session strength persists per model across config recreation and rejects stale/unsupported choices", async () => {
  const dependencies = deps();
  const config = new ProviderConfig(dependencies, () => {});
  await config.refresh();
  await config.setDefaultModel("anthropic", "claude");
  assert.equal(config.snapshot.defaultThinkingLevel, "medium");
  await config.setDefaultThinkingLevel("anthropic", "claude", "high");
  assert.equal(config.snapshot.defaultThinkingLevel, "high");
  const reopened = new ProviderConfig(dependencies, () => {});
  await reopened.refresh();
  assert.equal(reopened.snapshot.defaultThinkingLevel, "high");
  await reopened.setDefaultThinkingLevel("anthropic", "claude", "invented");
  assert.equal(reopened.snapshot.defaultThinkingLevel, "high");
  assert.ok(reopened.snapshot.error);
  await reopened.setDefaultModel("anthropic", "other");
  assert.equal(reopened.snapshot.defaultThinkingLevel, "medium");
  await reopened.setDefaultThinkingLevel("anthropic", "claude", "off");
  assert.ok(reopened.snapshot.error);
  await reopened.setDefaultModel("anthropic", "claude");
  assert.equal(reopened.snapshot.defaultThinkingLevel, "high");
});

test("pre-session strength save failure keeps applied projection and saving rejects overlap", async () => {
  const dependencies = deps();
  const settings = await dependencies.createSettings();
  const config = new ProviderConfig(dependencies, () => {});
  await config.refresh();
  await config.setDefaultModel("anthropic", "claude");
  let reject!: (reason: Error) => void;
  settings.flush = () => new Promise<void>((_resolve, fail) => { reject = fail; });
  const pending = config.setDefaultThinkingLevel("anthropic", "claude", "high");
  await new Promise(resolve => setImmediate(resolve));
  await config.setDefaultThinkingLevel("anthropic", "claude", "off");
  await config.setDefaultModel("anthropic", "other");
  assert.equal(config.snapshot.busy, true);
  reject(new Error("private credentials must not be projected"));
  await pending;
  assert.equal(config.snapshot.defaultThinkingLevel, "medium");
  assert.equal(config.snapshot.defaultModelId, "claude");
  assert.equal(config.snapshot.busy, false);
  assert.match(config.snapshot.error ?? "", /Could not save/);
  assert.ok(!JSON.stringify(config.snapshot).includes("private credentials"));
});
