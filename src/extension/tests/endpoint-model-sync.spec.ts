import assert from "node:assert/strict";
import { test } from "node:test";
import { ProviderConfig, type EndpointAddResult } from "../models/providerConfig.js";
import type { EndpointWriteResult } from "../models/endpointFileTransaction.js";
import { harness, settingsRuntime, tick, folder } from "./harness.js";

function endpointHost(write: EndpointWriteResult | undefined, hasDefault: boolean, emptySession: boolean, selection?: EndpointAddResult["selection"]) {
  const r = settingsRuntime();
  let starts = 0;
  let writes = 0;
  const start = r.runtime.start;
  r.runtime.start = async options => { starts++; return start(options); };
  if (emptySession) r.runtime.getModelProjection = async () => {
    r.calls.push("read");
    return { ok: true, modelLabel: null, thinkingLevel: null, thinkingLevels: [], models: [] };
  };
  const host = harness([folder()], true, undefined, r.runtime);
  const config: unknown = Reflect.get(host.provider, "providerConfig");
  assert.ok(config instanceof ProviderConfig);
  config.refresh = async () => {};
  config.addCustomEndpoint = async () => { writes++; return write ? selection ? { write, selection } : { write } : undefined; };
  config.removeCustomEndpoint = async () => { writes++; return write; };
  Object.assign(config.snapshot, { defaultProvider: hasDefault ? "A" : null, defaultModelId: hasDefault ? "one" : null });
  return { host, calls: r.calls, starts: () => starts, writes: () => writes };
}

async function ready(subject: ReturnType<typeof endpointHost>) {
  const view = subject.host.createView();
  view.action("chooseResources", { choice: "allow" });
  await tick(); await tick(); await tick();
  assert.equal(view.state().runtime, "ready");
  subject.calls.length = 0;
  return view;
}

function mutate(view: Awaited<ReturnType<typeof ready>>, operation: "add" | "remove"): void {
  if (operation === "add") view.action("addCustomEndpoint", { displayName: "endpoint", baseUrl: "http://127.0.0.1:9/v1", modelId: "fixture" });
  else view.action("removeCustomEndpoint", { providerId: "endpoint" });
}

const failures: { label: string; write: EndpointWriteResult | undefined }[] = [
  { label: "occupied", write: { kind: "not-committed", reason: "occupied", cleanupFailed: false } },
  { label: "uncommitted cleanup failure", write: { kind: "not-committed", reason: "write", cleanupFailed: true } },
  { label: "committed cleanup failure", write: { kind: "committed-cleanup-failed" } },
  { label: "not run or obsolete", write: undefined },
];
for (const operation of ["add", "remove"] as const) {
  for (const hasDefault of [false, true]) {
    for (const failure of failures) {
      test(`${operation} ${failure.label} does not read/apply session models or restart with ${hasDefault ? "a saved" : "no"} default`, async () => {
        const subject = endpointHost(failure.write, hasDefault, true);
        try {
          const view = await ready(subject);
          const before = subject.starts();
          mutate(view, operation);
          await tick(); await tick();
          assert.equal(subject.writes(), 1, "the validated intent reached provider configuration");
          assert.deepEqual(subject.calls, []);
          assert.equal(subject.starts(), before);
        } finally { subject.host.provider.dispose(); }
      });
    }
  }
}

for (const mode of ["login", "cancelled key", "remove"] as const) {
  test(`a clean endpoint ${mode} retains its existing session-model synchronization`, async () => {
    const selection = mode === "login" ? { providerId: "B", modelId: "two" } : undefined;
    const subject = endpointHost({ kind: "committed" }, true, false, selection);
    try {
      const view = await ready(subject);
      mutate(view, mode === "remove" ? "remove" : "add");
      await tick(); await tick();
      assert.equal(subject.writes(), 1);
      assert.ok(subject.calls.includes("read"));
      if (mode === "login") {
        assert.ok(subject.calls.includes("model:B/two"));
        assert.equal(view.state().chatModel, "B / two");
      } else assert.equal(subject.calls.some(call => call.startsWith("model:B/")), false);
    } finally { subject.host.provider.dispose(); }
  });
}
