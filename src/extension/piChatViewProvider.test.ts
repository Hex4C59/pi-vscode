import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import type * as vscode from "vscode";
import { focusPiChat, PiChatViewProvider } from "./piChatViewProvider.js";
import type { PiRuntimeLifecycle } from "./runtimeLifecycle.js";
import { parseWebviewMessage, type WorkspaceStateMessage } from "./webviewMessages.js";
import { getPlaceholderHtml } from "../webview/placeholderHtml.js";
import { boundUserFacingDetail, formatRuntimeError } from "./chatBounds.js";

class Event<T> {
  readonly listeners = new Set<(value: T) => unknown>();
  subscribe = (callback: (value: T) => unknown): vscode.Disposable => {
    this.listeners.add(callback);
    return { dispose: () => { this.listeners.delete(callback); } };
  };
  fire(value: T): void { for (const callback of [...this.listeners]) callback(value); }
}
const folder = (path = "/project", scheme = "file") => ({
  name: path, index: 0, uri: { scheme, fsPath: path, toString: () => `${scheme}://${path}` },
});
const tick = async () => { await new Promise<void>((resolve) => setImmediate(resolve)); };
function harness(
  folders = [folder()],
  trusted = true,
  remoteName: string | undefined = undefined,
  runtime?: PiRuntimeLifecycle,
) {
  const change = new Event<void>();
  const trust = new Event<void>();
  const commands: unknown[][] = [];
  const updates: unknown[][] = [];
  let picks = 0;
  const api = {
    workspace: { workspaceFolders: folders, isTrusted: trusted, onDidChangeWorkspaceFolders: change.subscribe, onDidGrantWorkspaceTrust: trust.subscribe,
      updateWorkspaceFolders: (...args: unknown[]): boolean => { updates.push(args); return true; } },
    env: { remoteName },
    window: { showOpenDialog: async (): Promise<ReturnType<typeof folder>["uri"][] | undefined> => { picks++; return undefined; } },
    commands: { executeCommand: async (...args: unknown[]) => { commands.push(args); } },
  };
  const provider = new PiChatViewProvider(api as unknown as ConstructorParameters<typeof PiChatViewProvider>[0], runtime);
  const createView = () => {
    const receive = new Event<unknown>();
    const dispose = new Event<void>();
    const sent: unknown[] = [];
    const view = { webview: { options: {}, html: "", onDidReceiveMessage: receive.subscribe,
      postMessage: (message: unknown) => { sent.push(message); return Promise.resolve(true); } }, onDidDispose: dispose.subscribe };
    provider.resolveWebviewView(view as unknown as vscode.WebviewView, {} as vscode.WebviewViewResolveContext, {} as vscode.CancellationToken);
    const send = (type: string, extra: object = {}) => receive.fire({ version: 1, type, ...extra });
    const state = () => { send("getWorkspaceState"); return sent.at(-1) as WorkspaceStateMessage; };
    const action = (type: string, extra: object = {}) => send(type, { generation: state().generation, ...extra });
    return { view, receive, dispose, sent, send, state, action };
  };
  return { api, provider, createView, change, trust, commands, updates, get picks() { return picks; } };
}

test("normalizes provider availability errors without exposing raw JSON", () => {
  assert.equal(formatRuntimeError('503: {"message":"Service temporarily unavailable","type":"api_error"}'),
    "Model service is temporarily unavailable. Check the provider status or switch models, then try again.");
  assert.equal(formatRuntimeError("429 rate limit exceeded"),
    "Model rate limit reached. Wait a moment or switch models, then try again.");
  assert.equal(formatRuntimeError("  generic failure  "), "generic failure");
  assert.ok(boundUserFacingDetail("x".repeat(1000)).length <= 300);
});
test("strict action allowlist rejects expanded shapes, hostile values and generations", () => {
  for (const type of ["openFolder", "manageTrust", "chooseResources", "sendChat", "setThinkingLevel", "setChatModel"]) {
    const valid = {
      version: 1, type, generation: 1,
      ...(type === "chooseResources" ? { choice: "allow" } : {}),
      ...(type === "sendChat" ? { text: "hello" } : {}),
      ...(type === "setThinkingLevel" ? { level: "high" } : {}),
      ...(type === "setChatModel" ? { provider: "anthropic", modelId: "claude" } : {}),
    };
    assert.ok(parseWebviewMessage(valid));
    for (const generation of [-1, 1.5, Infinity, NaN, "1", Number.MAX_SAFE_INTEGER + 1]) assert.equal(parseWebviewMessage({ ...valid, generation }), undefined);
    for (const extra of [{ path: "/evil" }, { command: "evil" }, { isTrusted: true }, { choice: "invalid" }]) assert.equal(parseWebviewMessage({ ...valid, ...extra }), undefined);
  }
  assert.equal(parseWebviewMessage(Object.create({ version: 1, type: "ping" })), undefined);
  assert.equal(parseWebviewMessage({ version: 1, type: "ping", [Symbol("extra")]: 1 }), undefined);
  assert.equal(parseWebviewMessage({ version: 1, get type() { throw new Error("must not execute"); } }), undefined);
});

test("eligibility matrix blocks every action except native recovery for its state", async () => {
  for (const [folders, trusted, remote, expected] of [
    [[], true, undefined, "no-folder"], [[folder(), folder("/other")], true, undefined, "multi-root"],
    [[folder()], true, "ssh-remote", "remote"], [[folder("/virtual", "memfs")], true, undefined, "non-file"],
    [[folder()], false, undefined, "untrusted"], [[folder()], true, undefined, "eligible"],
    [[], true, "ssh-remote", "remote"],
  ] as const) {
    const h = harness([...folders], trusted, remote);
    const v = h.createView();
    assert.equal(v.state().status, expected);
    v.action("chooseResources", { choice: "allow" });
    assert.equal(v.state().choice, expected === "eligible" ? "allow" : null);
    v.action("openFolder"); await tick();
    v.action("manageTrust"); await tick();
    assert.equal(h.picks, expected === "no-folder" ? 1 : 0);
    assert.deepEqual(h.commands, expected === "untrusted" ? [["workbench.trust.manage"]] : []);
    await tick();
    await tick();
    assert.equal(v.state().runtime, expected === "eligible" ? "ready" : "not-started");
    h.provider.dispose();
  }
});

test("choices survive view rebuild, reset on identity or eligibility changes and reject stale pages", () => {
  const h = harness(); const first = h.createView();
  first.action("chooseResources", { choice: "allow" });
  const generation = first.state().generation;
  first.dispose.fire();
  const v = h.createView();
  assert.equal(v.state().choice, "allow");
  v.action("chooseResources", { choice: "decline" });
  assert.equal(v.state().choice, "decline");
  first.send("chooseResources", { generation, choice: "allow" });
  assert.equal(v.state().choice, "decline");
  h.api.workspace.workspaceFolders = [folder("/new")]; h.change.fire();
  assert.equal(v.state().choice, null);
  v.send("chooseResources", { generation, choice: "allow" });
  assert.equal(v.state().choice, null);
  v.action("chooseResources", { choice: "allow" });
  h.api.workspace.isTrusted = false; // rechecked even without an event
  v.send("chooseResources", { generation: v.state().generation, choice: "allow" });
  assert.equal(v.state().choice, null);
  h.api.workspace.isTrusted = true; h.trust.fire();
  assert.equal(v.state().choice, null);
  v.action("chooseResources", { choice: "allow" });
  h.api.env.remoteName = "ssh-remote";
  assert.equal(v.state().status, "remote"); assert.equal(v.state().choice, null);
  h.provider.dispose();
  const fresh = harness(); assert.equal(fresh.createView().state().choice, null); fresh.provider.dispose();
});

test("actions recheck host eligibility without trusting a prior state message", () => {
  for (const change of ["trust", "remote", "folder"]) {
    const h = harness(); const v = h.createView();
    const generation = v.state().generation;
    v.send("chooseResources", { generation, choice: "allow" });
    if (change === "trust") h.api.workspace.isTrusted = false;
    if (change === "remote") h.api.env.remoteName = "ssh-remote";
    if (change === "folder") h.api.workspace.workspaceFolders = [folder("/switched")];
    v.send("chooseResources", { generation, choice: "decline" });
    assert.equal((v.sent.at(-1) as WorkspaceStateMessage).choice, null);
    assert.ok((v.sent.at(-1) as WorkspaceStateMessage).generation > generation);
    assert.deepEqual(h.commands, []);
    h.provider.dispose();
  }
});

test("malformed provider messages perform no action or state mutation", () => {
  const h = harness(); const v = h.createView();
  const before = v.state(); const count = v.sent.length;
  for (const message of [null, [], { version: 2, type: "openFolder", generation: before.generation },
    { version: 1, type: "chooseResources", generation: before.generation, choice: "allow", path: "/evil" },
    { version: 1, type: "executeCommand", command: "evil" }]) v.receive.fire(message);
  assert.equal(v.sent.length, count);
  assert.deepEqual(v.state(), before); assert.deepEqual(h.commands, []); assert.equal(h.picks, 0);
  h.provider.dispose();
});

test("native picker cancel, success and bounded failures are recoverable", async () => {
  const h = harness([]); const v = h.createView();
  v.action("openFolder"); await tick();
  assert.equal(v.state().error, null); assert.equal(v.state().busy, false); assert.deepEqual(h.commands, []);
  h.api.window.showOpenDialog = async () => { throw new Error("SECRET " + "x".repeat(10000)); };
  v.action("openFolder"); await tick();
  assert.match(v.state().error ?? "", /Try Open folder again/);
  assert.ok((v.state().error?.length ?? 0) < 100);
  assert.doesNotMatch(JSON.stringify(v.sent), /SECRET/);
  h.api.window.showOpenDialog = async () => [folder("/chosen").uri];
  h.api.workspace.updateWorkspaceFolders = () => { throw new Error("SECRET"); };
  v.action("openFolder"); await tick(); assert.match(v.state().error ?? "", /File > Open Folder/);
  h.api.workspace.updateWorkspaceFolders = () => false;
  v.action("openFolder"); await tick(); assert.ok(v.state().error); assert.equal(v.state().busy, false);
  assert.equal(v.state().status, "no-folder"); assert.equal(v.state().folder, null);
  h.api.workspace.updateWorkspaceFolders = (...args) => { h.updates.push(args); return true; };
  v.action("openFolder"); await tick();
  assert.equal(v.state().error, null);
  assert.equal(h.updates.length, 1);
  assert.deepEqual(h.updates[0]?.slice(0, 2), [0, 0]);
  assert.equal((h.updates[0]?.[2] as { uri: { fsPath: string } }).uri.fsPath, "/chosen");
  assert.deepEqual(h.commands, []);
  assert.equal(v.state().status, "no-folder"); assert.equal(v.state().folder, null);
  assert.equal(v.state().busy, true);
  v.action("openFolder"); await tick(); assert.equal(h.updates.length, 1);
  h.api.workspace.workspaceFolders = [folder("/chosen")]; h.change.fire();
  assert.equal(v.state().status, "eligible"); assert.equal(v.state().busy, false);
  h.provider.dispose();
});

test("accepted folder update stays serialized across view rebuild; restarted host reads actual folder", async () => {
  const h = harness([]); const v = h.createView();
  h.api.window.showOpenDialog = async () => [folder("/chosen").uri];
  v.action("openFolder"); await tick();
  const rebuilt = h.createView(); rebuilt.action("openFolder"); await tick();
  assert.equal(h.updates.length, 1); assert.equal(rebuilt.state().busy, true);
  h.provider.dispose();
  const restarted = harness([folder("/chosen")]); const fresh = restarted.createView();
  assert.equal(fresh.state().folder?.path, "/chosen"); assert.equal(fresh.state().status, "eligible");
  assert.equal(fresh.state().choice, null); assert.equal(fresh.state().busy, false);
  restarted.provider.dispose();
});

test("picker rejects non-file and non-single results without changing workspace", async () => {
  for (const selected of [[], [folder("/virtual", "memfs").uri], [folder().uri, folder("/other").uri]]) {
    const h = harness([]); const v = h.createView();
    h.api.window.showOpenDialog = async () => selected;
    v.action("openFolder"); await tick();
    assert.deepEqual(h.updates, []); assert.equal(v.state().status, "no-folder");
    assert.equal(v.state().busy, false); h.provider.dispose();
  }
});

test("focus command reveals existing container before focusing, including repeated invocations", async () => {
  const calls: string[] = []; let reveal!: () => void;
  const api = { commands: { executeCommand: async (command: string) => {
    calls.push(command);
    if (command === "workbench.view.extension.pi-vscode") await new Promise<void>((resolve) => { reveal = resolve; });
  } } } as unknown as Parameters<typeof focusPiChat>[0];
  const first = focusPiChat(api);
  assert.deepEqual(calls, ["workbench.view.extension.pi-vscode"]);
  reveal(); await first;
  const second = focusPiChat(api); reveal(); await second;
  assert.deepEqual(calls, ["workbench.view.extension.pi-vscode", "pi-vscode.chat.focus", "workbench.view.extension.pi-vscode", "pi-vscode.chat.focus"]);
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.deepEqual(pkg.contributes.menus["editor/title"], [{ command: "pi-vscode.focusChat", group: "navigation" }]);
  const command = pkg.contributes.commands.find((entry: { command: string }) => entry.command === "pi-vscode.focusChat");
  for (const theme of ["light", "dark"]) assert.match(readFileSync(command.icon[theme], "utf8"), /<path /);
  assert.equal(pkg.contributes.viewsContainers.secondarySidebar[0].id, "pi-vscode");
});

test("focus reveal failure does not issue a subsequent focus command", async () => {
  const calls: string[] = [];
  const api = { commands: { executeCommand: async (command: string) => { calls.push(command); throw new Error("unavailable"); } } };
  await assert.rejects(focusPiChat(api as unknown as Parameters<typeof focusPiChat>[0]), /unavailable/);
  assert.deepEqual(calls, ["workbench.view.extension.pi-vscode"]);
});

test("trust command failure can retry; trust grant recomputes eligibility", async () => {
  const h = harness([folder()], false); const v = h.createView();
  h.api.commands.executeCommand = async () => { throw new Error("secret"); };
  v.action("manageTrust"); await tick(); assert.match(v.state().error ?? "", /Try Manage workspace trust again/);
  h.api.commands.executeCommand = async () => { h.api.workspace.isTrusted = true; h.trust.fire(); };
  v.action("manageTrust"); await tick();
  assert.equal(v.state().status, "eligible"); assert.equal(v.state().choice, null); assert.equal(v.state().error, null);
  h.provider.dispose();
});

test("late picker completion is ignored after changes, replacement and disposal; listeners cleaned", async () => {
  for (const invalidate of ["workspace", "silent-workspace", "remote", "trust", "replace", "view", "provider"]) {
    const h = harness([]); const v = h.createView();
    let finish!: (value: ReturnType<typeof folder>["uri"][]) => void;
    h.api.window.showOpenDialog = () => new Promise((resolve) => { finish = resolve; });
    v.action("openFolder");
    if (invalidate === "workspace") { h.api.workspace.workspaceFolders = [folder("/new")]; h.change.fire(); }
    if (invalidate === "silent-workspace") h.api.workspace.workspaceFolders = [folder("/new")];
    if (invalidate === "remote") h.api.env.remoteName = "ssh-remote";
    if (invalidate === "trust") h.api.workspace.isTrusted = false;
    if (invalidate === "replace") h.createView();
    if (invalidate === "view") v.dispose.fire();
    if (invalidate === "provider") h.provider.dispose();
    finish([folder("/late").uri]); await tick();
    assert.deepEqual(h.commands, []); assert.deepEqual(h.updates, []);
    h.provider.dispose(); h.provider.dispose();
    assert.equal(h.change.listeners.size, 0); assert.equal(h.trust.listeners.size, 0);
    assert.equal(v.receive.listeners.size, 0); assert.equal(v.dispose.listeners.size, 0);
  }
});

test("pending native operations serialize, tolerate posting failures and late rejection", async () => {
  const h = harness([]); const v = h.createView();
  let reject!: (reason: Error) => void;
  let calls = 0;
  h.api.window.showOpenDialog = () => { calls++; return new Promise((_resolve, fail) => { reject = fail; }); };
  v.action("openFolder"); v.action("openFolder"); assert.equal(calls, 1);
  v.view.webview.postMessage = () => Promise.reject(new Error("unloaded"));
  v.send("getWorkspaceState"); await tick();
  h.provider.dispose(); reject(new Error("late secret")); await tick();
  assert.deepEqual(h.commands, []);
});

test("UI renders hostile names/paths with textContent and wires keyboard-native choice buttons", () => {
  const html = getPlaceholderHtml("test-nonce");
  const script = html.match(/<script nonce="test-nonce">([\s\S]*?)<\/script>/)?.[1]; assert.ok(script);
  const elements = new Map<string, { textContent: string; hidden: boolean; disabled: boolean; setAttribute: (name: string, value: string) => void; addEventListener: (name: string, callback: () => void) => void }>();
  const clicks = new Map<string, () => void>(); const outgoing: unknown[] = [];
  let receive!: (event: { data: unknown }) => void;
  runInNewContext(script, {
    acquireVsCodeApi: () => ({ postMessage: (message: unknown) => outgoing.push(message) }),
    document: { getElementById: (id: string) => {
      if (!elements.has(id)) elements.set(id, { textContent: "", hidden: false, disabled: false, setAttribute: () => undefined, addEventListener: (_name, callback) => { clicks.set(id, callback); } });
      return elements.get(id);
    } }, window: { addEventListener: (_name: string, callback: typeof receive) => { receive = callback; } },
  });
  const hostile = '</script><img src=x onerror="attack()"> & <';
  receive({ data: { version: 1, type: "workspaceState", generation: 7, status: "eligible", folder: { name: hostile, path: hostile }, choice: "decline", busy: false, error: null, runtime: "not-started", runtimeDetail: null, messages: [], chatBusy: false, chatError: null, chatModel: null, thinkingLevel: null, thinkingLevels: [], availableModels: [], modelBusy: false, modelError: null } });
  assert.equal(elements.get("folder-name-heading")?.textContent, "Project resources — " + hostile);
  assert.equal(elements.get("folder-path")?.textContent, hostile);
  assert.match(elements.get("runtime-hint")?.textContent ?? "", /Not running/);
  clicks.get("allow")?.();
  assert.equal(JSON.stringify(outgoing.at(-1)), JSON.stringify({ version: 1, type: "chooseResources", generation: 7, choice: "allow" }));
  assert.doesNotMatch(html, /innerHTML|localStorage|setState\(|getState\(/);
  assert.match(html, /:focus-visible/); assert.match(html, /role="alert"/);
});

test("resource choice starts runtime with approve or no-approve and stops on workspace change", async () => {
  const starts: { cwd: string; projectTrust: string }[] = [];
  const runtime: PiRuntimeLifecycle = {
    async start(options) {
      starts.push(options);
      return { ok: true, modelLabel: "Test / model" };
    },
    async stop() { /* noop */ },
    getSession() { return 1; },
    subscribe() { return () => undefined; },
    async prompt() { return { ok: true }; },
    async getModelProjection() {
      return { ok: true, modelLabel: "Test / model", thinkingLevel: "medium", thinkingLevels: ["off", "medium", "high"], models: [] };
    },
    async setThinkingLevel() { return { ok: false, detail: "unused" }; },
    async setModel() { return { ok: false, detail: "unused" }; },
  };
  const h = harness([folder()], true, undefined, runtime);
  const v = h.createView();
  v.action("chooseResources", { choice: "allow" });
  await tick(); await tick(); await tick();
  assert.deepEqual(starts.at(-1), { cwd: "/project", projectTrust: "approve" });
  assert.equal(v.state().runtime, "ready");
  v.action("chooseResources", { choice: "decline" });
  await tick(); await tick();
  assert.deepEqual(starts.at(-1), { cwd: "/project", projectTrust: "no-approve" });
  h.api.workspace.workspaceFolders = [folder("/other")]; h.change.fire();
  await tick(); await tick();
  assert.equal(v.state().runtime, "not-started");
  h.provider.dispose();
});

test("sendChat streams assistant text and rejects stale runtime events", async () => {
  let session = 0;
  const listeners = new Set<(event: import("./runtimeLifecycle.js").RuntimeEvent) => void>();
  const runtime: PiRuntimeLifecycle = {
    async start() {
      session += 1;
      return { ok: true, modelLabel: null };
    },
    async stop() { session = 0; },
    getSession() { return session; },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async prompt(text) {
      const active = session;
      queueMicrotask(() => {
        for (const listener of listeners) {
          listener({ kind: "text_delta", session: active, delta: `echo:${text}` });
          listener({ kind: "agent_settled", session: active });
        }
      });
      return { ok: true };
    },
    async getModelProjection() {
      return { ok: true, modelLabel: null, thinkingLevel: "off", thinkingLevels: ["off"], models: [] };
    },
    async setThinkingLevel() { return { ok: false, detail: "unused" }; },
    async setModel() { return { ok: false, detail: "unused" }; },
  };
  const h = harness([folder()], true, undefined, runtime);
  const v = h.createView();
  v.action("chooseResources", { choice: "allow" });
  await tick(); await tick();
  assert.equal(v.state().runtime, "ready");
  v.action("sendChat", { text: "hi" });
  await tick(); await tick();
  const after = v.state();
  assert.equal(after.chatBusy, false);
  assert.deepEqual(after.messages, [{ role: "user", text: "hi" }, { role: "assistant", text: "echo:hi" }]);
  for (const listener of listeners) listener({ kind: "text_delta", session: session - 1, delta: "stale" });
  assert.equal(v.state().messages.at(-1)?.text, "echo:hi");
  h.provider.dispose();
});

test("setThinkingLevel and setChatModel update projection and reject stale or busy operations", async () => {
  const calls: string[] = [];
  const runtime: PiRuntimeLifecycle = {
    async start() { return { ok: true, modelLabel: "A / one" }; },
    async stop() { /* noop */ },
    getSession() { return 3; },
    subscribe() { return () => undefined; },
    async prompt() { return { ok: true }; },
    async getModelProjection() {
      return {
        ok: true,
        modelLabel: "A / one",
        thinkingLevel: "medium",
        thinkingLevels: ["off", "medium", "high"],
        models: [{ provider: "A", modelId: "one", label: "One" }, { provider: "B", modelId: "two", label: "Two" }],
      };
    },
    async setThinkingLevel(level) {
      calls.push(`level:${level}`);
      return {
        ok: true,
        modelLabel: "A / one",
        thinkingLevel: level,
        thinkingLevels: ["off", "medium", "high"],
        models: [{ provider: "A", modelId: "one", label: "One" }, { provider: "B", modelId: "two", label: "Two" }],
      };
    },
    async setModel(provider, modelId) {
      calls.push(`model:${provider}/${modelId}`);
      return {
        ok: true,
        modelLabel: `${provider} / ${modelId}`,
        thinkingLevel: "off",
        thinkingLevels: ["off"],
        models: [{ provider: "A", modelId: "one", label: "One" }, { provider: "B", modelId: "two", label: "Two" }],
      };
    },
  };
  const h = harness([folder()], true, undefined, runtime);
  const v = h.createView();
  v.action("chooseResources", { choice: "allow" });
  await tick(); await tick(); await tick();
  assert.equal(v.state().thinkingLevel, "medium");
  v.action("setThinkingLevel", { level: "high" });
  await tick();
  assert.deepEqual(calls, ["level:high"]);
  assert.equal(v.state().thinkingLevel, "high");
  v.action("setChatModel", { provider: "B", modelId: "two" });
  await tick();
  assert.equal(v.state().chatModel, "B / two");
  v.action("sendChat", { text: "x" });
  v.action("setThinkingLevel", { level: "off" });
  await tick();
  assert.deepEqual(calls, ["level:high", "model:B/two"]);
  h.provider.dispose();
});

function settingsRuntime() {
  const events = new Event<import("./runtimeLifecycle.js").RuntimeEvent>();
  const calls: string[] = [];
  let session = 0;
  let projection = {
    ok: true as const, modelLabel: "A / one", thinkingLevel: "medium",
    thinkingLevels: ["off", "medium", "high"],
    models: [{ provider: "A", modelId: "one", label: "One" }, { provider: "B", modelId: "two", label: "Two" }],
  };
  const runtime: PiRuntimeLifecycle = {
    async start() { session++; return { ok: true, modelLabel: projection.modelLabel }; },
    async stop() { /* session is monotonic */ },
    getSession: () => session,
    subscribe(listener) { const sub = events.subscribe(listener); return () => sub.dispose(); },
    async prompt() { calls.push("prompt"); return { ok: true }; },
    async getModelProjection() { calls.push("read"); return projection; },
    async setModel(provider, modelId) {
      calls.push(`model:${provider}/${modelId}`);
      projection = { ...projection, modelLabel: `${provider} / ${modelId}` };
      return projection;
    },
    async setThinkingLevel(level) {
      calls.push(`level:${level}`); projection = { ...projection, thinkingLevel: level }; return projection;
    },
  };
  return { runtime, calls, events, settled: () => events.fire({ kind: "agent_settled", session }),
    setLevels: (levels: string[]) => { projection = { ...projection, thinkingLevels: levels }; } };
}

test('Stop holds deferred settings until cancellation completes and runtime loss fails closed', async()=>{
  const r=settingsRuntime();let finish:()=>void=()=>{};
  r.runtime.abortTask=async()=>{r.settled();await new Promise<void>(resolve=>finish=resolve);return {ok:true};};
  const h=harness([folder()],true,undefined,r.runtime);const v=h.createView();v.action('chooseResources',{choice:'allow'});await tick();r.calls.length=0;
  v.action('sendChat',{text:'work'});v.action('setThinkingLevel',{level:'high'});v.action('stopChat');await tick();
  assert.equal(v.state().execution,'stopping');assert.deepEqual(r.calls,['prompt']);
  v.action('sendChat',{text:'blocked'});assert.deepEqual(r.calls,['prompt']);finish();await tick();assert.ok(r.calls.includes('level:high'));
  r.events.fire({kind:'runtime_error',session:r.runtime.getSession(),detail:'Disconnected'});assert.equal(v.state().runtime,'error');assert.equal(v.state().execution,'failed');assert.equal(v.state().pendingThinkingLevel,null);h.provider.dispose();
});

async function readySettings() {
  const r = settingsRuntime();
  const h = harness([folder()], true, undefined, r.runtime);
  const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick();
  r.calls.length = 0;
  return { r, h, v };
}

test("streaming selections replace pending intent without mutation; settled applies model then thinking", async () => {
  const { r, h, v } = await readySettings();
  v.action("sendChat", { text: "first" });
  v.action("setChatModel", { provider: "A", modelId: "one" });
  v.action("setThinkingLevel", { level: "medium" });
  v.action("setChatModel", { provider: "B", modelId: "two" });
  v.action("setThinkingLevel", { level: "high" });
  await tick();
  assert.deepEqual(r.calls, ["prompt"]);
  assert.equal(v.state().chatModel, "A / one");
  assert.equal(v.state().thinkingLevel, "medium");
  assert.equal(v.state().pendingModel?.modelId, "two");
  assert.equal(v.state().pendingThinkingLevel, "high");
  r.events.fire({ kind: "agent_settled", session: -1 });
  assert.equal(v.state().chatBusy, true);
  r.settled(); r.settled();
  v.action("sendChat", { text: "blocked" });
  assert.equal(v.state().modelBusy, true);
  await tick();
  assert.deepEqual(r.calls, ["prompt", "model:B/two", "level:high"]);
  assert.equal(v.state().chatModel, "B / two");
  assert.equal(v.state().thinkingLevel, "high");
  assert.equal(v.state().pendingModel, null);
  assert.equal(v.state().pendingThinkingLevel, null);
  assert.equal(v.state().modelBusy, false);
  h.provider.dispose();
});

test("unsupported pending thinking is explicitly rejected after refreshed model capabilities", async () => {
  const { r, h, v } = await readySettings();
  v.action("sendChat", { text: "first" });
  v.action("setThinkingLevel", { level: "high" });
  v.action("setChatModel", { provider: "B", modelId: "two" });
  r.setLevels(["off"]); r.settled(); await tick();
  assert.deepEqual(r.calls, ["prompt", "model:B/two", "read"]);
  assert.match(v.state().modelError ?? "", /not supported.*not applied/);
  assert.equal(v.state().chatModel, "B / two");
  assert.equal(v.state().pendingThinkingLevel, null);
  h.provider.dispose();
});

test("mutation and recovery failures use fixed safe messages and always release busy", async () => {
  for (const operation of ["model", "thinking"]) for (const failure of ["result", "throw"]) {
    const { r, h, v } = await readySettings();
    const fail = async () => {
      if (failure === "throw") throw new Error("SECRET");
      return { ok: false as const, detail: "SECRET" };
    };
    if (operation === "model") r.runtime.setModel = fail;
    else r.runtime.setThinkingLevel = fail;
    r.runtime.getModelProjection = fail;
    v.action(operation === "model" ? "setChatModel" : "setThinkingLevel",
      operation === "model" ? { provider: "B", modelId: "two" } : { level: "high" });
    await tick();
    assert.equal(v.state().modelBusy, false);
    assert.equal(v.state().pendingModel, null);
    assert.equal(v.state().pendingThinkingLevel, null);
    assert.equal(v.state().chatModel, null);
    assert.match(v.state().modelError ?? "", /Select again/);
    assert.doesNotMatch(JSON.stringify(v.sent), /SECRET/);
    h.provider.dispose();
  }
});

test("pending configuration survives view recreation and ignores old page actions", async () => {
  const { r, h, v } = await readySettings();
  v.action("sendChat", { text: "first" });
  v.action("setThinkingLevel", { level: "high" });
  const generation = v.state().generation;
  const fresh = h.createView();
  v.send("setThinkingLevel", { generation, level: "off" });
  assert.equal(fresh.state().pendingThinkingLevel, "high");
  r.settled(); await tick();
  assert.equal(fresh.state().thinkingLevel, "high");
  assert.equal(fresh.state().modelBusy, false);
  h.provider.dispose();
});

test("in-flight settings completion cannot overwrite replacement runtime or workspace", async () => {
  for (const invalidation of ["workspace", "resources", "dispose", "view"]) {
    const { r, h, v } = await readySettings();
    let finish!: (value: Awaited<ReturnType<PiRuntimeLifecycle["setModel"]>>) => void;
    r.runtime.setModel = () => new Promise(resolve => { finish = resolve; });
    v.action("sendChat", { text: "first" });
    v.action("setChatModel", { provider: "B", modelId: "two" });
    v.action("setThinkingLevel", { level: "high" });
    r.settled();
    let fresh = v;
    if (invalidation === "workspace") { h.api.workspace.workspaceFolders = [folder("/next")]; h.change.fire(); }
    if (invalidation === "resources") v.action("chooseResources", { choice: "decline" });
    if (invalidation === "dispose") h.provider.dispose();
    if (invalidation === "view") fresh = h.createView();
    await tick();
    finish({ ok: true, modelLabel: "Late", thinkingLevel: "off", thinkingLevels: ["off", "high"], models: [] });
    await tick();
    if (invalidation === "view") {
      assert.ok(r.calls.includes("level:high")); assert.equal(fresh.state().modelBusy, false);
    } else {
      assert.ok(!r.calls.includes("level:high"));
      if (invalidation !== "dispose") {
        assert.notEqual(fresh.state().chatModel, "Late");
        assert.equal(fresh.state().pendingModel, null); assert.equal(fresh.state().modelBusy, false);
      }
    }
    h.provider.dispose();
  }
});

test("late prompt acknowledgement cannot disturb settled configuration or a newer turn", async () => {
  const { r, h, v } = await readySettings();
  let finish!: (value: { ok: false; detail: string }) => void;
  r.runtime.prompt = () => new Promise(resolve => { finish = resolve; });
  v.action("sendChat", { text: "first" });
  v.action("setThinkingLevel", { level: "high" });
  r.settled(); await tick();
  r.runtime.prompt = async () => ({ ok: true });
  v.action("sendChat", { text: "next" });
  finish({ ok: false, detail: "late" }); await tick();
  assert.equal(v.state().chatBusy, true);
  assert.equal(v.state().thinkingLevel, "high");
  assert.notEqual(v.state().chatError, "late");
  h.provider.dispose();
});

test("UI streaming controls stage selections; pending and applied remain distinct; applying blocks send", async () => {
  const { h, v } = await readySettings();
  class Element {
    textContent = ""; hidden = false; disabled = false; value = ""; max = "0";
    children: Element[] = [];
    attributes = new Map<string, string>();
    listeners = new Map<string, (event: unknown) => void>();
    style = { setProperty: (_name: string, _value: string) => undefined };
    setAttribute(name: string, value: string) { this.attributes.set(name, value); }
    addEventListener(name: string, callback: (event: unknown) => void) { this.listeners.set(name, callback); }
    replaceChildren() { this.children = []; }
    appendChild(child: Element) { this.children.push(child); }
    fire(name: string, event: unknown = {}) { this.listeners.get(name)?.(event); }
  }
  const elements = new Map<string, Element>();
  const element = (id: string) => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id)!;
  };
  const windows = new Map<string, (event: unknown) => void>();
  const outgoing: unknown[] = [];
  const html = getPlaceholderHtml("ui-test");
  const script = html.match(/<script nonce="ui-test">([\s\S]*?)<\/script>/)?.[1]; assert.ok(script);
  runInNewContext(script, {
    acquireVsCodeApi: () => ({ postMessage: (message: unknown) => outgoing.push(message) }),
    document: { getElementById: element, createElement: () => new Element() },
    window: { addEventListener: (name: string, callback: (event: unknown) => void) => {
      const previous = windows.get(name);
      windows.set(name, event => { previous?.(event); callback(event); });
    } },
  });
  const state = { ...v.state(), chatBusy: true, pendingThinkingLevel: "high",
    pendingModel: { provider: "B", modelId: "two", label: "Two" } };
  const render = (patch: Partial<WorkspaceStateMessage> = {}) => windows.get("message")?.({ data: { ...state, ...patch } });
  render();
  assert.equal(element("model-effort-trigger").disabled, false);
  assert.equal(element("thinking-slider").disabled, false);
  assert.equal(element("send-chat").disabled, true);
  assert.equal(element("model-effort-trigger").textContent, "A / one · medium");
  assert.match(element("pending-settings").textContent, /Next turn \(pending\): B \/ Two · thinking: high/);
  assert.match(element("thinking-level-label").textContent, /Applied: medium.*pending.*high/);
  assert.equal(element("model-list").hidden, true);
  element("model-effort-trigger").fire("click");
  element("model-current").fire("click");
  assert.equal(element("model-list").hidden, false);
  element("model-list").children[1].fire("click");
  assert.equal((outgoing.at(-1) as { type: string }).type, "setChatModel");
  assert.equal(element("model-list").hidden, true);
  element("thinking-slider").fire("change", { target: { value: "0" } });
  assert.equal((outgoing.at(-1) as { level: string }).level, "off");
  render({ chatBusy: false, modelBusy: true });
  assert.equal(element("model-effort-trigger").disabled, true);
  assert.equal(element("thinking-slider").disabled, true);
  assert.ok(element("model-list").children.every(item => item.disabled));
  assert.match(element("pending-settings").textContent, /Applying next turn/);
  element("chat-input").value = "keep draft";
  const count = outgoing.length;
  element("chat-input").fire("keydown", { key: "Enter", preventDefault() {} });
  assert.equal(outgoing.length, count);
  assert.equal(element("chat-input").value, "keep draft");
  render({ chatBusy: false, modelBusy: false, pendingModel: null, pendingThinkingLevel: null,
    modelError: "Requested thinking level is not supported." });
  assert.equal(element("pending-settings").hidden, true);
  assert.equal(element("model-status-error").hidden, false);
  assert.equal(element("send-chat").disabled, false);
  element("model-effort-trigger").fire("click");
  windows.get("keydown")?.({ key: "Escape", preventDefault() {} });
  assert.equal(element("model-popover").hidden, true);
  element("model-effort-trigger").fire("click");
  render({ generation: state.generation + 1 });
  assert.equal(element("model-popover").hidden, true);
  assert.match(html, /height: 14px; border-radius: 7px/);
  assert.match(html, /#168BFF/);
  h.provider.dispose();
});

test("queued configuration clears before resource and workspace replacements", async () => {
  for (const kind of ["workspace", "resources"]) {
    const { r, h, v } = await readySettings();
    v.action("sendChat", { text: "first" });
    v.action("setThinkingLevel", { level: "high" });
    if (kind === "workspace") { h.api.workspace.workspaceFolders = [folder("/new")]; h.change.fire(); }
    else v.action("chooseResources", { choice: "decline" });
    r.settled(); await tick();
    assert.equal(v.state().pendingThinkingLevel, null);
    assert.ok(!r.calls.includes("level:high"));
    h.provider.dispose();
  }
});

test("deferred thinking failure preserves confirmed model without exposing exception", async () => {
  const { r, h, v } = await readySettings();
  v.action("sendChat", { text: "first" });
  v.action("setChatModel", { provider: "B", modelId: "two" });
  v.action("setThinkingLevel", { level: "high" });
  r.runtime.setThinkingLevel = async () => { throw new Error("SECRET"); };
  r.settled(); await tick();
  assert.equal(v.state().chatModel, "B / two");
  assert.equal(v.state().thinkingLevel, "medium");
  assert.equal(v.state().modelBusy, false);
  assert.match(v.state().modelError ?? "", /Could not apply/);
  assert.doesNotMatch(JSON.stringify(v.sent), /SECRET/);
  h.provider.dispose();
});

test("webview provider does not import adapter; extension entry wires subprocess lifecycle", () => {
  for (const path of ["src/extension/piChatViewProvider.ts", "src/extension/webviewMessages.ts", "src/webview/placeholderHtml.ts"]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /from\s+["'][^"']*(?:adapter|pi-coding-agent|child_process|node:fs)|SecretStorage|globalState|workspaceState\.update|trust\.json/);
  }
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.capabilities.untrustedWorkspaces.supported, "limited");
});
