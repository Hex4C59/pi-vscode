import type * as vscode from "vscode";
import { randomBytes } from "node:crypto";
import { getPlaceholderHtml } from "../webview/placeholderHtml.js";
import { boundUserFacingDetail } from "./chatBounds.js";
import { noopPiRuntimeLifecycle, type PiRuntimeLifecycle, type RuntimeEvent } from "./runtimeLifecycle.js";
import { parseWebviewMessage, type WorkspaceStateMessage } from "./webviewMessages.js";

export const PI_CHAT_VIEW_ID = "pi-vscode.chat";

/** Reveal the contributed container, then focus its existing view (never toggle). */
export async function focusPiChat(api: Pick<typeof vscode, "commands">): Promise<void> {
  await api.commands.executeCommand("workbench.view.extension.pi-vscode");
  await api.commands.executeCommand(`${PI_CHAT_VIEW_ID}.focus`);
}

/** Host-owned, memory-only pre-runtime state. No adapter/runtime dependency. */
export class PiChatViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  public static readonly viewType = PI_CHAT_VIEW_ID;
  private readonly subscriptions: vscode.Disposable[];
  private view: vscode.WebviewView | undefined;
  private viewSubscriptions: vscode.Disposable[] = [];
  private disposed = false;
  private identity = "";
  private operation: object | undefined;
  private workspaceUpdatePending = false;
  private reconcileToken = 0;
  private runtimeSession = 0;
  private readonly unsubscribeRuntime: () => void;
  private state: WorkspaceStateMessage = {
    version: 1, type: "workspaceState", generation: 0, status: "no-folder",
    folder: null, choice: null, busy: false, error: null, runtime: "not-started", runtimeDetail: null,
    messages: [], chatBusy: false, chatError: null, chatModel: null,
  };

  constructor(
    private readonly api: Pick<typeof vscode, "workspace" | "env" | "window" | "commands">,
    private readonly runtime: PiRuntimeLifecycle = noopPiRuntimeLifecycle,
  ) {
    this.refresh();
    this.unsubscribeRuntime = this.runtime.subscribe((event) => { this.handleRuntimeEvent(event); });
    this.subscriptions = [
      api.workspace.onDidChangeWorkspaceFolders(() => { this.refresh(true); this.publish(); }),
      api.workspace.onDidGrantWorkspaceTrust(() => { this.refresh(); this.publish(); }),
    ];
  }

  private clearChat(): void {
    this.state = { ...this.state, messages: [], chatBusy: false, chatError: null };
    this.runtimeSession = 0;
  }

  private handleRuntimeEvent(event: RuntimeEvent): void {
    if (event.session !== this.runtimeSession || this.disposed) return;
    if (event.kind === "text_delta") {
      const messages = [...this.state.messages];
      const last = messages.at(-1);
      if (last?.role === "assistant") {
        messages[messages.length - 1] = { role: "assistant", text: last.text + event.delta };
      } else {
        messages.push({ role: "assistant", text: event.delta });
      }
      this.state = { ...this.state, messages };
      this.publish();
      return;
    }
    if (event.kind === "stream_error") {
      this.state = { ...this.state, chatError: event.detail };
      this.publish();
      return;
    }
    if (event.kind === "agent_settled") {
      const hasAssistant = this.state.messages.some((entry) => entry.role === "assistant" && entry.text.length > 0);
      this.state = {
        ...this.state,
        chatBusy: false,
        chatError: hasAssistant || this.state.chatError
          ? this.state.chatError
          : "No assistant response. In pi, use /model and Ctrl+S to save a startup model, then restart runtime here.",
      };
      this.publish();
    }
  }

  private refresh(workspaceChanged = false): void {
    const folders = this.api.workspace.workspaceFolders ?? [];
    const remote = this.api.env.remoteName;
    const trusted = this.api.workspace.isTrusted;
    const folder = folders.length === 1 ? folders[0] : undefined;
    const identity = JSON.stringify([remote ?? null, trusted, folders.map((entry) => [entry.uri.toString(), entry.name])]);
    if (!workspaceChanged && identity === this.identity) return;
    this.identity = identity;
    this.operation = undefined;
    this.workspaceUpdatePending = false;
    this.clearChat();
    const prevChoice = this.state.choice;
    const prevStatus = this.state.status;
    this.state = {
      ...this.state, generation: this.state.generation + 1, choice: null, busy: false, error: null,
      runtime: "not-started", runtimeDetail: null, chatModel: null,
      status: remote ? "remote" : folders.length === 0 ? "no-folder" : folders.length > 1 ? "multi-root"
        : folder?.uri.scheme !== "file" ? "non-file" : !trusted ? "untrusted" : "eligible",
      folder: folder ? { name: folder.name, path: folder.uri.scheme === "file" ? folder.uri.fsPath : folder.uri.toString() } : null,
    };
    if (prevChoice !== this.state.choice || prevStatus !== this.state.status) {
      void this.reconcileRuntime();
    }
  }

  private async reconcileRuntime(): Promise<void> {
    const token = ++this.reconcileToken;
    const folderPath = this.state.folder?.path;
    const choice = this.state.choice;
    const shouldRun = this.state.status === "eligible" && folderPath && choice !== null && !this.disposed;
    if (!shouldRun) {
      if (this.state.runtime !== "not-started") {
        this.state = { ...this.state, runtime: "stopping", runtimeDetail: null };
        this.publish();
      }
      await this.runtime.stop();
      if (token !== this.reconcileToken || this.disposed) return;
      this.state = { ...this.state, runtime: "not-started", runtimeDetail: null };
      this.publish();
      return;
    }
    const projectTrust = choice === "allow" ? "approve" : "no-approve";
    this.state = { ...this.state, runtime: "starting", runtimeDetail: null };
    this.publish();
    const result = await this.runtime.start({ cwd: folderPath, projectTrust });
    if (token !== this.reconcileToken || this.disposed) return;
    this.refresh();
    if (this.state.status !== "eligible" || this.state.choice !== choice || this.state.folder?.path !== folderPath) {
      void this.reconcileRuntime();
      return;
    }
    if (!result.ok) {
      this.state = {
        ...this.state,
        runtime: "error",
        runtimeDetail: result.detail.length > 300 ? `${result.detail.slice(0, 297)}...` : result.detail,
      };
    } else {
      this.runtimeSession = this.runtime.getSession();
      this.state = {
        ...this.state,
        runtime: "ready",
        runtimeDetail: null,
        chatModel: result.ok ? result.modelLabel : null,
      };
    }
    this.publish();
  }

  private publish(): void {
    if (this.view && !this.disposed) this.post(this.view, { ...this.state });
  }

  private post(view: vscode.WebviewView, message: unknown): void {
    // A disposed/unloaded renderer may reject delivery; reopening resynchronizes.
    try { void Promise.resolve(view.webview.postMessage(message)).catch(() => undefined); }
    catch { /* Synchronous teardown race: no payload or exception is logged. */ }
  }

  private clearView(): void {
    this.view = undefined;
    this.operation = undefined;
    this.state = { ...this.state, busy: this.workspaceUpdatePending, error: null };
    for (const subscription of this.viewSubscriptions) subscription.dispose();
    this.viewSubscriptions = [];
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    if (this.disposed) return;
    this.clearView();
    this.refresh();
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true, localResourceRoots: [] };
    this.viewSubscriptions = [
      webviewView.webview.onDidReceiveMessage((message: unknown) => { void this.receive(webviewView, message); }),
      webviewView.onDidDispose(() => { if (this.view === webviewView) this.clearView(); }),
    ];
    webviewView.webview.html = getPlaceholderHtml(randomBytes(16).toString("base64"));
  }

  private async receive(view: vscode.WebviewView, value: unknown): Promise<void> {
    if (this.disposed || view !== this.view) return;
    const message = parseWebviewMessage(value);
    if (!message) return;
    this.refresh();
    if (message.type === "ping") { this.post(view, { version: 1, type: "pong" }); return; }
    if (message.type === "getWorkspaceState") { this.publish(); return; }
    if (message.generation !== this.state.generation || this.state.busy) { this.publish(); return; }
    if (message.type === "chooseResources") {
      if (this.state.status === "eligible") {
        this.clearChat();
        this.state = { ...this.state, choice: message.choice, error: null };
        void this.reconcileRuntime();
      }
      this.publish();
      return;
    }
    if (message.type === "sendChat") {
      if (this.state.runtime !== "ready" || this.state.chatBusy || this.state.busy) {
        this.publish();
        return;
      }
      const text = message.text.trim();
      if (!text) {
        this.publish();
        return;
      }
      this.state = {
        ...this.state,
        messages: [...this.state.messages, { role: "user", text }],
        chatBusy: true,
        chatError: null,
      };
      this.publish();
      const generation = this.state.generation;
      const session = this.runtimeSession;
      const result = await this.runtime.prompt(text);
      if (this.disposed || view !== this.view) return;
      if (this.state.generation !== generation || this.runtimeSession !== session) {
        this.state = { ...this.state, chatBusy: false };
        this.publish();
        return;
      }
      if (!result.ok) {
        this.state = {
          ...this.state,
          chatBusy: false,
          chatError: boundUserFacingDetail(result.detail),
        };
        this.publish();
        return;
      }
      return;
    }
    if ((message.type === "openFolder" && this.state.status !== "no-folder")
      || (message.type === "manageTrust" && this.state.status !== "untrusted")) { this.publish(); return; }
    const operation = {};
    this.operation = operation;
    const generation = this.state.generation;
    const current = (): boolean => {
      if (this.disposed || view !== this.view || this.operation !== operation) return false;
      this.refresh();
      return this.operation === operation && this.state.generation === generation;
    };
    this.state = { ...this.state, busy: true, error: null };
    this.publish();
    try {
      if (message.type === "openFolder") {
        const selected = await this.api.window.showOpenDialog({
          canSelectFiles: false, canSelectFolders: true, canSelectMany: false, openLabel: "Open folder for pi",
        });
        if (current() && this.state.status === "no-folder" && selected?.length === 1 && selected[0]?.scheme === "file") {
          // Adding the first folder can restart this host without a folder event.
          // The next provider reads authoritative workspace state in its constructor;
          // a true return only accepts the request, not proof the folder is open.
          if (!this.api.workspace.updateWorkspaceFolders(0, 0, { uri: selected[0] })) {
            throw new Error("Workspace folder update rejected");
          }
          if (current()) this.workspaceUpdatePending = true;
        }
      } else {
        await this.api.commands.executeCommand("workbench.trust.manage");
      }
    } catch {
      if (current()) this.state = { ...this.state, error: message.type === "openFolder"
        ? "Could not add the folder. Try Open folder again or use File > Open Folder."
        : "Could not open workspace trust settings. Try Manage workspace trust again." };
    } finally {
      if (current()) {
        this.operation = undefined;
        this.state = { ...this.state, busy: this.workspaceUpdatePending };
      }
      if (!this.disposed && view === this.view) this.publish();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.reconcileToken += 1;
    this.unsubscribeRuntime();
    this.clearChat();
    void this.runtime.stop();
    this.clearView();
    for (const subscription of this.subscriptions) subscription.dispose();
  }
}
