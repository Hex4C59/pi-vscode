import type * as vscode from "vscode";
import { randomBytes } from "node:crypto";
import { getPlaceholderHtml } from "../webview/placeholderHtml.js";
import { boundUserFacingDetail } from "./chatBounds.js";
import { findCatalogEntry } from "./modelCatalog.js";
import { noopPiRuntimeLifecycle, type PiRuntimeLifecycle, type RuntimeEvent } from "./runtimeLifecycle.js";
import { parseWebviewMessage, type WorkspaceStateMessage } from "./webviewMessages.js";

import { ToolApprovals } from "./toolApproval.js";

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
  private catalogToken = 0;
  private runtimeSession = 0;
  private promptToken = 0;
  private stoppingTask = false;
  private readonly unsubscribeRuntime: () => void;
  private readonly toolApprovals = new ToolApprovals(() => {
    if (!this.state) return;
    const approvals = this.toolApprovals.cards();
    this.state = {...this.state, approvals, grants:this.toolApprovals.scopes(), execution: approvals.length ? 'awaiting-approval' : this.state.execution === 'awaiting-approval' ? 'waiting' : this.state.execution};
    this.publish();
  });
  private state: WorkspaceStateMessage = {
    version: 1, type: "workspaceState", generation: 0, status: "no-folder",
    folder: null, choice: null, busy: false, error: null, runtime: "not-started", runtimeDetail: null,
    messages: [], chatBusy: false, chatError: null, chatModel: null,
    thinkingLevel: null, thinkingLevels: [], availableModels: [], modelBusy: false, modelError: null,
    pendingModel: null, pendingThinkingLevel: null,
    activities: [], approvals: [], grants: [], execution:'idle', controlledExecution:true,
  };

  private emptyModelFields(): Pick<
    WorkspaceStateMessage,
    "chatModel" | "thinkingLevel" | "thinkingLevels" | "availableModels" | "modelBusy" | "modelError" | "pendingModel" | "pendingThinkingLevel"
  > {
    return {
      chatModel: null,
      thinkingLevel: null,
      thinkingLevels: [],
      availableModels: [],
      modelBusy: false,
      modelError: null,
      pendingModel: null,
      pendingThinkingLevel: null,
    };
  }

  private canChangeModelSettings(): boolean {
    return this.state.runtime === "ready" && !this.state.busy && !this.state.modelBusy;
  }

  /** Serialize next-turn intent only after the session-level settled event. */
  private async applyPendingSettings(): Promise<void> {
    if (this.disposed || this.stoppingTask || !this.canChangeModelSettings() || this.state.chatBusy) return;
    const model = this.state.pendingModel;
    const level = this.state.pendingThinkingLevel;
    if (!model && !level) return;
    const token = ++this.catalogToken;
    const generation = this.state.generation;
    const session = this.runtimeSession;
    const current = (): boolean => {
      if (this.disposed) return false;
      this.refresh();
      return token === this.catalogToken && generation === this.state.generation
        && session === this.runtimeSession && this.state.runtime === "ready";
    };
    this.state = { ...this.state, modelBusy: true, modelError: null };
    this.publish();
    let error = "Could not apply model settings. Select again to retry.";
    const accept = (result: Awaited<ReturnType<PiRuntimeLifecycle["getModelProjection"]>>): boolean => {
      if (!result.ok) return false;
      this.state = { ...this.state, chatModel: result.modelLabel, thinkingLevel: result.thinkingLevel,
        thinkingLevels: result.thinkingLevels, availableModels: result.models };
      return true;
    };
    try {
      if (model) {
        const result = await this.runtime.setModel(model.provider, model.modelId);
        if (!current()) return;
        if (!accept(result)) throw new Error();
        // setModel returns a fresh get_state + available-levels projection.
      }
      if (level) {
        if (!this.state.thinkingLevels.includes(level)) {
          error = "Requested thinking level is not supported by the selected model. It was not applied.";
          throw new Error();
        }
        const result = await this.runtime.setThinkingLevel(level);
        if (!current()) return;
        if (!accept(result)) throw new Error();
        if (this.state.thinkingLevel !== level) {
          error = "Requested thinking level was not applied by the runtime. Select again to retry.";
          throw new Error();
        }
      }
    } catch {
      if (!current()) return;
      // A failed mutation/refresh may have changed upstream state; read back,
      // never retry a mutation or claim that the requested value was applied.
      try {
        const result = await this.runtime.getModelProjection();
        if (!current()) return;
        if (!accept(result)) this.state = { ...this.state, chatModel: null, thinkingLevel: null, thinkingLevels: [] };
      } catch {
        if (!current()) return;
        this.state = { ...this.state, chatModel: null, thinkingLevel: null, thinkingLevels: [] };
      }
      this.state = { ...this.state, modelError: error };
    } finally {
      if (current()) {
        this.state = { ...this.state, modelBusy: false, pendingModel: null, pendingThinkingLevel: null };
        this.publish();
      }
    }
  }

  private async syncModelCatalog(): Promise<void> {
    const token = ++this.catalogToken;
    if (this.state.runtime !== "ready" || this.disposed) return;
    if (!this.state.modelBusy) {
      this.state = { ...this.state, modelBusy: true, modelError: null };
      this.publish();
    }
    const generation = this.state.generation;
    const session = this.runtimeSession;
    const result = await this.runtime.getModelProjection().catch(() => ({ ok: false as const, detail: "Could not load model settings." }));
    if (token !== this.catalogToken || this.disposed) return;
    if (this.state.generation !== generation || this.runtimeSession !== session || this.state.runtime !== "ready") {
      this.state = { ...this.state, modelBusy: false };
      this.publish();
      return;
    }
    if (!result.ok) {
      this.state = {
        ...this.state,
        modelBusy: false,
        modelError: "Could not load model settings. Restart runtime to retry.",
      };
      this.publish();
      return;
    }
    this.state = {
      ...this.state,
      modelBusy: false,
      modelError: null,
      chatModel: result.modelLabel,
      thinkingLevel: result.thinkingLevel,
      thinkingLevels: result.thinkingLevels,
      availableModels: result.models,
    };
    this.publish();
  }

  constructor(
    private readonly api: Pick<typeof vscode, "workspace" | "env" | "window" | "commands">,
    private readonly runtime: PiRuntimeLifecycle = noopPiRuntimeLifecycle,
  ) {
    this.refresh();
    this.runtime.setApprovalHandler?.(call => this.state.runtime === 'ready' && this.state.chatBusy && this.state.execution !== 'stopping' && call.cwd === this.state.folder?.path ? this.toolApprovals.request(call) : Promise.resolve(false));
    this.unsubscribeRuntime = this.runtime.subscribe((event) => { this.handleRuntimeEvent(event); });
    this.subscriptions = [
      api.workspace.onDidChangeWorkspaceFolders(() => { this.refresh(true); this.publish(); }),
      api.workspace.onDidGrantWorkspaceTrust(() => { this.refresh(); this.publish(); }),
    ];
  }

  private clearChat(): void {
    this.catalogToken += 1;
    this.toolApprovals.cancel(true);
    this.stoppingTask = false;
    this.state = { ...this.state, messages: [], activities:[], execution:'idle', chatBusy: false, chatError: null, ...this.emptyModelFields() };
    this.runtimeSession = 0;
  }

  private handleRuntimeEvent(event: RuntimeEvent): void {
    if (this.disposed) return;
    this.refresh();
    if (event.session !== this.runtimeSession || this.state.runtime !== "ready") return;
    if (event.kind === 'runtime_error') {
      this.stoppingTask=false;
      this.toolApprovals.cancel(true); this.catalogToken++; this.promptToken++;
      this.state={...this.state,runtime:'error',runtimeDetail:event.detail,chatBusy:false,execution:'failed',pendingModel:null,pendingThinkingLevel:null,modelBusy:false,activities:this.state.activities.map(i=>i.status==='complete'||i.status==='failed'?i:{...i,status:'interrupted'})};this.publish();return;
    }
    if (event.kind === 'activity') {
      const activities=[...this.state.activities];const index=activities.findIndex(i=>i.id===event.item.id);
      if(index>=0)activities[index]=event.item;else if(activities.length<64)activities.push(event.item);
      this.state={...this.state,activities,execution:this.state.execution==='stopping'?'stopping':this.state.approvals.length?'awaiting-approval':event.item.kind==='thinking'?'thinking':event.item.status==='executing'?'executing':'waiting'};this.publish();return;
    }
    if(event.kind==='message_final') {
      const messages=[...this.state.messages];const index=messages.findIndex(m=>m.id===event.messageId);
      if(index>=0)messages[index]={role:'assistant',id:event.messageId,text:event.text};else if(event.text)messages.push({role:'assistant',id:event.messageId,text:event.text});
      this.state={...this.state,messages:messages.slice(-32)};this.publish();return;
    }
    if (event.kind === "text_delta") {
      const messages = [...this.state.messages];
      const last = messages.at(-1);
      if (last?.role === "assistant" && (!event.messageId || last.id===event.messageId)) {
        messages[messages.length - 1] = { ...last, text: (last.text + event.delta).slice(0,65536) };
      } else {
        messages.push({ role: "assistant", text: event.delta.slice(0,65536), ...(event.messageId?{id:event.messageId}:{}) });
      }
      this.state = { ...this.state, messages:messages.slice(-32), execution:this.state.execution==='stopping'?'stopping':'replying' };
      this.publish();
      return;
    }
    if (event.kind === "stream_error") {
      this.state = { ...this.state, chatError: event.detail };
      this.publish();
      return;
    }
    if (event.kind === "agent_settled" && this.state.chatBusy) {
      this.promptToken += 1;
      const hasAssistant = this.state.messages.some((entry) => entry.role === "assistant" && entry.text.length > 0);
      this.state = {
        ...this.state,
        chatBusy: false,
        execution: this.stoppingTask ? 'stopping' : 'idle',
        chatError: hasAssistant || this.state.activities.length || this.stoppingTask || this.state.chatError
          ? this.state.chatError
          : "No assistant response. In pi, use /model and Ctrl+S to save a startup model, then restart runtime here.",
      };
      void this.applyPendingSettings();
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
      runtime: "not-started", runtimeDetail: null, ...this.emptyModelFields(),
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
        chatModel: result.modelLabel,
        thinkingLevel: null,
        thinkingLevels: [],
        availableModels: [],
        modelBusy: true,
        modelError: null,
      };
      void this.syncModelCatalog();
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
    if (message.type === 'decideApproval') {this.toolApprovals.decide(message.id,message.decision);return;}
    if (message.type === 'revokeGrant') {this.toolApprovals.revoke(message.id);return;}
    if (message.type === 'stopChat') {
      if(!this.state.chatBusy || this.state.execution==='stopping')return;
      const session=this.runtimeSession;const generation=this.state.generation;
      this.stoppingTask=true;
      this.state={...this.state,execution:'stopping'};this.toolApprovals.cancel();this.publish();
      const result=await this.runtime.abortTask?.().catch(()=>({ok:false as const,detail:'Could not stop task.'}));
      if(session!==this.runtimeSession||generation!==this.state.generation||this.disposed)return;
      this.stoppingTask=false;
      if(result?.ok){this.state={...this.state,execution:'idle',chatBusy:false};void this.applyPendingSettings();}
      if(!result?.ok){this.toolApprovals.cancel(true);this.state={...this.state,runtime:'error',execution:'failed',chatBusy:false,chatError:result?.detail??'Stop is unavailable.',pendingModel:null,pendingThinkingLevel:null};}
      this.publish();return;
    }
    if (message.type === "chooseResources") {
      if (this.state.status === "eligible") {
        this.clearChat();
        this.state = { ...this.state, choice: message.choice, error: null };
        void this.reconcileRuntime();
      }
      this.publish();
      return;
    }
    if (message.type === "setThinkingLevel" || message.type === "setChatModel") {
      if (!this.canChangeModelSettings()) {
        this.publish();
        return;
      }
      if (message.type === "setThinkingLevel" && !this.state.thinkingLevels.includes(message.level)) {
        this.publish();
        return;
      }
      if (message.type === "setChatModel" && !findCatalogEntry(this.state.availableModels, message.provider, message.modelId)) {
        this.publish();
        return;
      }
      this.state = message.type === "setThinkingLevel"
        ? { ...this.state, pendingThinkingLevel: message.level, modelError: null }
        : { ...this.state, pendingModel: findCatalogEntry(this.state.availableModels, message.provider, message.modelId) ?? null, modelError: null };
      void this.applyPendingSettings();
      this.publish();
      return;
    }
    if (message.type === "sendChat") {
      if (this.state.runtime !== "ready" || this.state.chatBusy || this.stoppingTask || this.state.busy || this.state.modelBusy) {
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
        execution:'waiting',
        chatError: null,
      };
      this.publish();
      const generation = this.state.generation;
      const session = this.runtimeSession;
      const promptToken = ++this.promptToken;
      const result = await this.runtime.prompt(text);
      if (this.disposed || promptToken !== this.promptToken) return;
      if (this.state.generation !== generation || this.runtimeSession !== session) return;
      if (!result.ok) {
        this.state = {
          ...this.state,
          chatBusy: false,
          chatError: boundUserFacingDetail(result.detail),
        };
        this.state = { ...this.state, pendingModel: null, pendingThinkingLevel: null };
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
