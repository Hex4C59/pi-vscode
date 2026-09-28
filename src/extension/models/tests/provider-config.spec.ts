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
  const runtime = {
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
  const settings = {
    getDefaultProvider: () => defaultProvider,
    getDefaultModel: () => defaultModel,
    setDefaultModelAndProvider(provider: string, modelId: string) { defaultProvider = provider; defaultModel = modelId; },
    flush: async () => {},
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
