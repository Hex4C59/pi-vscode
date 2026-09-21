import type * as vscode from "vscode";
import { PiChatViewProvider } from "../piChatViewProvider.js";
import type { PiRuntimeLifecycle, RuntimeEvent } from "../runtimeLifecycle.js";
import type { WorkspaceStateMessage } from "../webviewMessages.js";

export class Event<T> {
  readonly listeners = new Set<(value: T) => unknown>();
  subscribe = (callback: (value: T) => unknown): vscode.Disposable => {
    this.listeners.add(callback);
    return { dispose: () => { this.listeners.delete(callback); } };
  };
  fire(value: T): void { for (const callback of [...this.listeners]) callback(value); }
}
export const folder = (path = "/project", scheme = "file") => ({
  name: path, index: 0, uri: { scheme, fsPath: path, toString: () => `${scheme}://${path}` },
});
export const tick = async () => { await new Promise<void>((resolve) => setImmediate(resolve)); };
export function harness(
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

export function settingsRuntime() {
  const events = new Event<RuntimeEvent>();
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

export async function readySettings() {
  const r = settingsRuntime();
  const h = harness([folder()], true, undefined, r.runtime);
  const v = h.createView(); v.action("chooseResources", { choice: "allow" }); await tick();
  r.calls.length = 0;
  return { r, h, v };
}
