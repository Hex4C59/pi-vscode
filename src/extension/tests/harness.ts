import type * as vscode from "vscode";
import type { SessionBackend } from "../sessionBackend.js";
import { PiChatViewProvider } from "../piChatViewProvider.js";
import { noopPiRuntimeLifecycle, type PiRuntimeLifecycle, type RuntimeEvent } from "../runtimeLifecycle.js";
import type { WorkspaceStateMessage, AttachmentStateMessage } from "../webviewMessages.js";

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
function resourceUri(path: string, scheme = "file") {
  return {
    scheme,
    path,
    fsPath: path,
    with(changes: { path?: string; scheme?: string }) {
      return resourceUri(changes.path ?? path, changes.scheme ?? scheme);
    },
    toString: () => `${scheme}://${path}`,
  };
}
export const tick = async () => { await new Promise<void>((resolve) => setImmediate(resolve)); };
export function harness(
  folders = [folder()],
  trusted = true,
  remoteName: string | undefined = undefined,
  runtime?: PiRuntimeLifecycle,
  sessions?: SessionBackend,
) {
  const change = new Event<void>();
  const trust = new Event<void>();
  const documentChange = new Event<{ document: vscode.TextDocument }>();
  const documentClose = new Event<vscode.TextDocument>();
  const fileCreate = new Event<vscode.Uri>();
  const fileChange = new Event<vscode.Uri>();
  const fileDelete = new Event<vscode.Uri>();
  const contentProviders = new Map<string, vscode.TextDocumentContentProvider>();
  const shown: unknown[] = [];
  const executed = new Event<unknown[]>();
  const commands: unknown[][] = [];
  const updates: unknown[][] = [];
  let picks = 0;
  const api = {
    Uri: { file: (value: string) => resourceUri(value), parse: (value: string) => resourceUri(value.slice(value.indexOf(":") + 1), value.slice(0, value.indexOf(":"))) },
    RelativePattern: class { constructor(readonly base: string, readonly pattern: string) {} },
    EventEmitter: class<T> extends Event<T> { event = this.subscribe; dispose() { this.listeners.clear(); } },
    workspace: { workspaceFolders: folders, isTrusted: trusted, onDidChangeWorkspaceFolders: change.subscribe, onDidGrantWorkspaceTrust: trust.subscribe,
      registerTextDocumentContentProvider: (scheme: string, provider: vscode.TextDocumentContentProvider) => { contentProviders.set(scheme, provider); return { dispose: () => { contentProviders.delete(scheme); } }; },
      createFileSystemWatcher: () => ({ onDidCreate: fileCreate.subscribe, onDidChange: fileChange.subscribe, onDidDelete: fileDelete.subscribe, dispose() {} }),
      textDocuments: [] as vscode.TextDocument[], onDidChangeTextDocument: documentChange.subscribe, onDidCloseTextDocument: documentClose.subscribe,
      openTextDocument: async (_uri: vscode.Uri): Promise<vscode.TextDocument> => { throw new Error("fixture document unavailable"); },
      updateWorkspaceFolders: (...args: unknown[]): boolean => { updates.push(args); return true; } },
    env: { remoteName },
    window: { showWarningMessage: async (_message: string, _options: vscode.MessageOptions, ..._items: string[]): Promise<string | undefined> => undefined, showTextDocument: async (uri: unknown) => { shown.push(uri); }, showOpenDialog: async (): Promise<ReturnType<typeof folder>["uri"][] | undefined> => { picks++; return undefined; } },
    commands: { executeCommand: async (...args: unknown[]) => { commands.push(args); executed.fire(args); } },
  };
  const extensionUri = resourceUri("/extension");
  const provider = new PiChatViewProvider(
    api as unknown as ConstructorParameters<typeof PiChatViewProvider>[0],
    runtime ?? noopPiRuntimeLifecycle,
    extensionUri as unknown as ConstructorParameters<typeof PiChatViewProvider>[2],
    sessions,
  );
  const createView = () => {
    const receive = new Event<unknown>();
    const dispose = new Event<void>();
    const sent: unknown[] = [];
    const posted = new Event<unknown>();
    const view = { webview: {
      options: {}, html: "", cspSource: "vscode-webview://test",
      asWebviewUri: (resource: { with: (changes: { scheme: string }) => unknown }) => resource.with({ scheme: "vscode-webview-resource" }),
      onDidReceiveMessage: receive.subscribe,
      postMessage: (message: unknown) => { sent.push(message); posted.fire(message); return Promise.resolve(true); } }, onDidDispose: dispose.subscribe };
    provider.resolveWebviewView(view as unknown as vscode.WebviewView, {} as vscode.WebviewViewResolveContext, {} as vscode.CancellationToken);
    const send = (type: string, extra: object = {}) => receive.fire({ version: 2, type, ...extra });
    const state = () => { send("getWorkspaceState"); return sent.at(-1) as WorkspaceStateMessage; };
    const attachments = () => { state(); return [...sent].reverse().find((value) => (value as { type: string }).type === "attachmentState") as AttachmentStateMessage; };
    const action = (type: string, extra: object = {}) => {
      const s = state();
      if (type === "sendChat" && "text" in extra) {
        const d = attachments().draft;
        send("updateDraft", { generation: s.generation, viewId: s.viewId, draftRevision: d.revision, editSequence: d.acceptedEditSequence + 1, text: extra.text });
        send(type, { generation: s.generation, viewId: s.viewId, draftRevision: attachments().draft.revision });
      } else send(type, { generation: s.generation, viewId: s.viewId, ...extra });
    };
    return { view, receive, dispose, sent, posted, send, state, action, attachments };
  };
  return { api, provider, createView, change, trust, documentChange, documentClose, fileCreate, fileChange, fileDelete, contentProviders, shown, executed, commands, updates, get picks() { return picks; } };
}

export const prepareTestPrompt: PiRuntimeLifecycle["preparePrompt"] = function (this: PiRuntimeLifecycle, input) {
  let used = false;
  return { send: async onAttempt => {
    if (used) return { delivery: "not-sent", code: "runtime-lost" };
    used = true; onAttempt();
    const result = await this.prompt(input.body.trim());
    return result.ok ? { delivery: "rpc-accepted" } : { delivery: "rpc-rejected", code: "rpc-rejected" };
  } };
};

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
    preparePrompt: prepareTestPrompt,
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
