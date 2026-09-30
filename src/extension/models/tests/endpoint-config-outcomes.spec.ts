import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { ProviderConfig, type ProviderConfigDeps } from "../providerConfig.js";
import type { EndpointFileSystem, EndpointWriteResult } from "../endpointFileTransaction.js";

async function configFixture(t: TestContext, inject?: (file: string) => EndpointFileSystem) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "pi-endpoint-config-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, "models.json");
  await fs.writeFile(file, JSON.stringify({ providers: { first: {} } }));
  const calls: string[] = [];
  let ids = ["first"];
  const dependencies: ProviderConfigDeps = {
    modelsPath: () => file, endpointFileSystem: inject?.(file),
    createRuntime: async () => ({
      thinkingOptions: () => null,
      getProviders: () => ids.map(id => ({ id, name: id, auth: { apiKey: { login: () => {} } }, getModels: () => [] })),
      getProviderAuthStatus: () => ({ configured: false }), listCredentials: async () => [],
      getModels: () => [], getAvailable: async () => [],
      reloadModels: async () => { calls.push("reload"); ids = Object.keys(JSON.parse(readFileSync(file, "utf8")).providers); },
      login: async id => { calls.push(`login:${id}`); }, logout: async id => { calls.push(`logout:${id}`); },
    }),
    createSettings: async () => ({
      getDefaultProvider: () => undefined, getDefaultModel: () => undefined, getDefaultThinkingLevel: () => undefined,
      getModelThinkingLevel: () => undefined, setModelThinkingLevel: () => {}, setDefaultModelAndProvider: () => {},
      reload: async () => {}, flush: async () => {}, drainErrors: () => [],
    }),
    promptUi: { showInputBox: async () => undefined, showQuickPick: async () => undefined,
      showInformationMessage: async () => undefined, openExternal: async () => false },
  };
  const config = new ProviderConfig(dependencies, () => {});
  await config.refresh();
  calls.length = 0;
  return { config, file, calls };
}

async function mutate(config: ProviderConfig, operation: "save" | "remove"): Promise<EndpointWriteResult | undefined> {
  if (operation === "save") {
    return (await config.addCustomEndpoint({ displayName: "second", baseUrl: "http://127.0.0.1:8000/v1", modelId: "fixture" }))?.write;
  }
  return config.removeCustomEndpoint("first");
}

for (const operation of ["save", "remove"] as const) {
  test(`${operation} initialization failure is an explicit noncommit without refresh or path/credential effects`, async () => {
    const calls: string[] = [];
    const busy: boolean[] = [];
    const dependencies: ProviderConfigDeps = {
      createRuntime: async () => { calls.push("runtime"); throw new Error("private-path synthetic-token"); },
      createSettings: async () => { calls.push("settings"); throw new Error("unexpected settings"); },
      modelsPath: () => { calls.push("path"); throw new Error("unexpected path request"); },
      promptUi: { showInputBox: async () => { calls.push("prompt"); return undefined; },
        showQuickPick: async () => undefined, showInformationMessage: async () => undefined, openExternal: async () => false },
    };
    const config = new ProviderConfig(dependencies, () => { busy.push(config.snapshot.busy); });
    assert.deepEqual(await mutate(config, operation), { kind: "not-committed", reason: "write", cleanupFailed: false });
    assert.equal(calls.filter(call => call === "runtime").length, 1);
    assert.equal(calls.includes("path"), false);
    assert.equal(calls.includes("prompt"), false);
    assert.deepEqual(busy, [true, false]);
    assert.match(config.snapshot.error ?? "", /Could not/);
    assert.equal(JSON.stringify(config.snapshot).includes("synthetic-token"), false);
  });
}

for (const operation of ["save", "remove"] as const) {
  for (const failure of ["occupied", "conflict", "write", "cleanup-committed", "cleanup-uncommitted"] as const) {
    test(`${operation} ${failure} reports a fixed outcome without continuing credentials or reload`, async t => {
      const { config, file, calls } = await configFixture(t, target => ({ ...fs,
        async chmod(temporary, mode) {
          if (failure === "conflict") await fs.writeFile(target, '{"providers":{"external":{}}}');
          return fs.chmod(temporary, mode);
        },
        async rename(source, destination) {
          if (failure === "write" || failure === "cleanup-uncommitted") throw new Error("private-path synthetic-token");
          return fs.rename(source, destination);
        },
        async rmdir(directory) {
          if (failure.startsWith("cleanup")) throw new Error("private-path synthetic-token");
          return fs.rmdir(directory);
        },
      }));
      if (failure === "occupied") await fs.mkdir(path.join(path.dirname(file), ".models.json.pi-vscode.lock"));
      const before = await fs.readFile(file, "utf8");
      const result = await mutate(config, operation);
      const expectedWrite: EndpointWriteResult = failure === "cleanup-committed" ? { kind: "committed-cleanup-failed" }
        : { kind: "not-committed", reason: failure === "occupied" || failure === "conflict" ? failure : "write",
          cleanupFailed: failure === "cleanup-uncommitted" };
      assert.deepEqual(result, expectedWrite);
      assert.deepEqual(calls, []);
      assert.equal(config.snapshot.busy, false);
      const error = config.snapshot.error ?? "";
      const expected = failure === "occupied" ? /locked/ : failure === "conflict" ? /changed during/
        : failure === "cleanup-committed" ? new RegExp(`was ${operation === "save" ? "saved" : "removed"}`)
          : failure === "cleanup-uncommitted" ? /not changed.*cleanup failed/ : /Could not/;
      assert.match(error, expected);
      assert.equal(error.includes("private-path"), false);
      assert.equal(error.includes("synthetic-token"), false);
      assert.equal(error.includes(file), false);
      if (failure === "occupied" || failure === "write" || failure === "cleanup-uncommitted") assert.equal(await fs.readFile(file, "utf8"), before);
      await config.refresh();
      assert.equal(config.snapshot.error, null);
      assert.deepEqual(calls, ["reload"]);
      if (failure === "cleanup-committed") assert.equal(config.snapshot.providers.some(provider => provider.providerId === (operation === "save" ? "second" : "first")), operation === "save");
    });
  }
}

test("explicit retry after contention succeeds once and permits only its clean commit login", async t => {
  const { config, file, calls } = await configFixture(t);
  const lock = path.join(path.dirname(file), ".models.json.pi-vscode.lock");
  await fs.mkdir(lock);
  await mutate(config, "save");
  assert.deepEqual(calls, []);
  await fs.rmdir(lock); // Test-owned empty lock, no writer was started.
  assert.deepEqual(await config.addCustomEndpoint({ displayName: "second", baseUrl: "http://127.0.0.1:8000/v1", modelId: "fixture" }), {
    write: { kind: "committed" }, selection: { providerId: "second", modelId: "fixture" },
  });
  assert.deepEqual(calls, ["reload", "login:second", "reload"]);
  assert.equal(config.snapshot.error, null);
});

test("clean removal logs out after commit and lock release", async t => {
  const { config, calls, file } = await configFixture(t);
  await config.removeCustomEndpoint("first");
  assert.deepEqual(calls, ["reload", "logout:first", "reload"]);
  assert.deepEqual(JSON.parse(await fs.readFile(file, "utf8")).providers, {});
  assert.equal(config.snapshot.error, null);
  await assert.rejects(fs.stat(path.join(path.dirname(file), ".models.json.pi-vscode.lock")), { code: "ENOENT" });
});
