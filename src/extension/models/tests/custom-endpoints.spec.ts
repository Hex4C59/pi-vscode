import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { parseWebviewMessage } from "../../bridge/webviewMessages.js";
import { endpointProviderId, isPublicHttpUrl } from "../../contracts/index.js";
import { addOpenAiEndpoint, removeOpenAiEndpoint } from "../customEndpoints.js";
import { ProviderConfig, type ProviderConfigDeps } from "../providerConfig.js";

const envelope = { version: 3, generation: 1, viewId: "view" };

function file(t: TestContext): string {
  const directory = mkdtempSync(path.join(os.tmpdir(), "pi-endpoint-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return path.join(directory, "models.json");
}

test("endpoint merge keeps other providers and never stores the API key", async t => {
  const target = file(t);
  const original = `${JSON.stringify({
    note: "keep",
    providers: { other: { baseUrl: "https://other.example/v1", api: "openai-completions", apiKey: "sk-existing", models: [{ id: "kept" }] } },
  }, null, 2)}\n`;
  writeFileSync(target, original);
  const added = await addOpenAiEndpoint(target, {
    providerId: "local-vllm", displayName: "Local vLLM", baseUrl: "http://127.0.0.1:8000/v1", modelId: "qwen2.5",
  }, id => id === "openai");
  assert.equal(added, undefined);
  const text = readFileSync(target, "utf8");
  const saved = JSON.parse(text) as { note: string; providers: Record<string, { apiKey?: string; api?: string; models?: { id: string }[] }> };
  assert.equal(saved.note, "keep");
  assert.deepEqual(saved.providers.other, {
    baseUrl: "https://other.example/v1", api: "openai-completions", apiKey: "sk-existing", models: [{ id: "kept" }],
  });
  assert.equal(saved.providers["local-vllm"]?.api, "openai-completions");
  assert.equal(saved.providers["local-vllm"]?.apiKey, undefined);
  assert.equal(saved.providers["local-vllm"]?.models?.[0]?.id, "qwen2.5");

  const collided = await addOpenAiEndpoint(target, {
    providerId: "local-vllm", displayName: "Local vLLM", baseUrl: "http://127.0.0.1:8000/v1", modelId: "other",
  }, () => false);
  assert.equal(collided, "exists");
  assert.equal(await addOpenAiEndpoint(target, {
    providerId: "openai", displayName: "openai", baseUrl: "https://example.com/v1", modelId: "gpt",
  }, id => id === "openai"), "native");
  assert.equal(readFileSync(target, "utf8"), text);
});

test("a damaged models file is left unchanged", async t => {
  const target = file(t);
  writeFileSync(target, "{ providers: oops }\n");
  const result = await addOpenAiEndpoint(target, {
    providerId: "local", displayName: "local", baseUrl: "http://127.0.0.1:11434/v1", modelId: "llama3.1:8b",
  }, () => false);
  assert.equal(result, "invalid");
  assert.equal(readFileSync(target, "utf8"), "{ providers: oops }\n");
  assert.equal(await removeOpenAiEndpoint(target, "local", () => false), "invalid");
  assert.equal(readFileSync(target, "utf8"), "{ providers: oops }\n");
});

test("removing an endpoint deletes only that provider", async t => {
  const target = file(t);
  writeFileSync(target, JSON.stringify({ providers: { local: { api: "openai-completions" }, kept: { api: "openai-completions" } } }));
  const before = readFileSync(target, "utf8");
  assert.equal(await removeOpenAiEndpoint(target, "openai", () => true), "native");
  assert.equal(readFileSync(target, "utf8"), before);
  assert.equal(await removeOpenAiEndpoint(target, "local", id => id === "openai"), "removed");
  const saved = JSON.parse(readFileSync(target, "utf8")) as { providers: Record<string, unknown> };
  assert.equal(saved.providers.local, undefined);
  assert.deepEqual(saved.providers.kept, { api: "openai-completions" });
});

test("custom endpoint messages reject secrets, userinfo and unknown fields", () => {
  assert.equal(endpointProviderId("Local vLLM"), "local-vllm");
  assert.equal(endpointProviderId("你好"), undefined);
  assert.equal(isPublicHttpUrl("http://user:secret@127.0.0.1/v1"), false);
  assert.equal(isPublicHttpUrl("javascript:alert(1)"), false);
  const valid = { ...envelope, type: "addCustomEndpoint", displayName: "Local vLLM", baseUrl: "http://127.0.0.1:8000/v1", modelId: "llama3.1:8b" };
  assert.deepEqual(parseWebviewMessage(valid), valid);
  assert.equal(parseWebviewMessage({ ...valid, apiKey: "sk-secret" }), undefined);
  assert.equal(parseWebviewMessage({ ...valid, baseUrl: "http://user:secret@127.0.0.1/v1" }), undefined);
  assert.equal(parseWebviewMessage({ ...envelope, type: "openProviderOAuth", providerId: "openai-codex" })?.type, "openProviderOAuth");
});

test("OAuth opens a host URL and device code without projecting them", async t => {
  const notices: string[] = [];
  const opened: string[] = [];
  let loginType = "";
  const modelsFile = file(t);
  const dependencies: ProviderConfigDeps = {
    async createRuntime() {
      return {
        thinkingOptions: () => null,
        getProviders: () => [{
          id: "openai-codex", name: "ChatGPT",
          auth: { oauth: { login: async () => ({ type: "oauth" }) } },
          getModels: () => [],
        }],
        getProviderAuthStatus: () => ({ configured: false }),
        listCredentials: async () => [],
        getModels: () => [],
        getAvailable: async () => [],
        login: async (_id, type, interaction) => {
          loginType = type;
          interaction.notify({ type: "auth_url", url: "javascript:alert(1)" });
          interaction.notify({ type: "auth_url", url: "https://user:token@example.com/oauth" });
          interaction.notify({ type: "auth_url", url: "https://example.com/oauth/start", instructions: "Finish in the browser" });
          interaction.notify({ type: "device_code", userCode: "DEVICE-99", verificationUri: "https://example.com/device" });
          throw new Error("cancelled");
        },
        logout: async () => {},
      };
    },
    async createSettings() {
      return {
        getDefaultProvider: () => undefined, getDefaultModel: () => undefined, getDefaultThinkingLevel: () => undefined,
        getModelThinkingLevel: () => undefined, setModelThinkingLevel: () => {}, setDefaultModelAndProvider: () => {},
        reload: async () => {}, flush: async () => {}, drainErrors: () => [],
      };
    },
    promptUi: {
      showInputBox: async () => undefined,
      showQuickPick: async () => undefined,
      showInformationMessage: async message => { notices.push(message); },
      openExternal: async url => { opened.push(url); return true; },
    },
    modelsPath: () => modelsFile,
  };
  const config = new ProviderConfig(dependencies, () => {});
  await config.refresh();
  assert.equal(config.snapshot.providers[0]?.canSignIn, true);
  await config.openOAuth("openai-codex");
  assert.equal(loginType, "oauth");
  assert.deepEqual(opened, ["https://example.com/oauth/start", "https://example.com/device"]);
  assert.ok(notices.includes("Finish in the browser"));
  assert.ok(notices.some(message => message.includes("DEVICE-99")));
  const snapshot = JSON.stringify(config.snapshot);
  for (const privateValue of ["DEVICE-99", "token", "https://example.com/oauth/start", "https://example.com/device", "Finish in the browser"]) {
    assert.equal(snapshot.includes(privateValue), false, `${privateValue} must stay out of the provider projection`);
  }
  assert.equal(config.snapshot.error, null);
});

test("adding an endpoint writes models.json and keeps a cancelled key out of the projection", async t => {
  const target = file(t);
  const secret = "sk-cancelled-endpoint-fixture";
  let seenKey = "";
  const dependencies: ProviderConfigDeps = {
    async createRuntime() {
      const providers = [{
        id: "local-vllm", name: "Local vLLM",
        auth: { apiKey: { login: async () => ({ type: "api_key" }) } },
        getModels: () => [{ id: "qwen2.5", name: "Qwen" }],
      }];
      return {
        thinkingOptions: () => null,
        getProviders: () => providers,
        getRegisteredNativeProvider: (id: string) => id === "openai" ? {} : undefined,
        reloadModels: async () => {},
        getProviderAuthStatus: () => ({ configured: false }),
        listCredentials: async () => [],
        getModels: () => [{ id: "qwen2.5", provider: "local-vllm" }],
        getAvailable: async () => [{ id: "qwen2.5", name: "Qwen", provider: "local-vllm" }],
        login: async (_id, type, interaction) => {
          assert.equal(type, "api_key");
          seenKey = await interaction.prompt({ type: "secret", message: "API key" });
          throw new Error("cancelled");
        },
        logout: async () => {},
      };
    },
    async createSettings() {
      return {
        getDefaultProvider: () => undefined, getDefaultModel: () => undefined, getDefaultThinkingLevel: () => undefined,
        getModelThinkingLevel: () => undefined, setModelThinkingLevel: () => {}, setDefaultModelAndProvider: () => {},
        reload: async () => {}, flush: async () => {}, drainErrors: () => [],
      };
    },
    promptUi: {
      showInputBox: async () => secret,
      showQuickPick: async () => undefined,
      showInformationMessage: async () => undefined,
      openExternal: async () => false,
    },
    modelsPath: () => target,
  };
  const config = new ProviderConfig(dependencies, () => {});
  const saved = await config.addCustomEndpoint({ displayName: "Local vLLM", baseUrl: "http://127.0.0.1:8000/v1", modelId: "qwen2.5" });
  assert.equal(saved, undefined);
  const text = readFileSync(target, "utf8");
  assert.equal(text.includes("apiKey"), false);
  assert.equal(text.includes(secret), false);
  assert.equal(text.includes("qwen2.5"), true);
  assert.equal(seenKey, secret);
  assert.equal(JSON.stringify(config.snapshot).includes(secret), false);
  assert.equal(config.snapshot.error, null);
  assert.equal(config.snapshot.providers.some(provider => provider.canRemoveEndpoint && provider.providerId === "local-vllm"), true);
});
