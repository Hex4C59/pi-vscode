import type * as vscode from "vscode";
import { randomBytes } from "node:crypto";
import type {
  PluginInventoryIntent, PluginInventoryProjection, ProviderConfigIntent, ProviderConfigProjection,
} from "../contracts/index.js";
import { getWebviewHtml, getWebviewResourceRoot } from "./webviewHtml.js";
import { parseWebviewMessage } from "./webviewMessages.js";

type SettingsState = {
  generation: number;
  locale: "en" | "zh-CN";
  config: ProviderConfigProjection;
  inventory: PluginInventoryProjection;
};
type SettingsIntent = ProviderConfigIntent | PluginInventoryIntent;

/** One editor surface with a separate identity and provider-only capabilities. */
export class SettingsPanel implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private viewId = "";
  private subscriptions: vscode.Disposable[] = [];
  private projection = "";
  constructor(
    private readonly window: Pick<typeof vscode.window, "createWebviewPanel">,
    private readonly extensionUri: vscode.Uri,
    private readonly snapshot: () => SettingsState,
    private readonly action: (intent: SettingsIntent) => Promise<void>,
    private readonly language: (locale: "en" | "zh-CN") => void,
    private readonly prepare: () => Promise<void> = async () => undefined,
  ) {}

  open(): void {
    if (this.panel) { this.panel.reveal(); void this.prepare().then(() => this.publish(true)); return; }
    // ViewColumn.One targets the editor, not a new group beside the chat sidebar.
    const panel = this.window.createWebviewPanel("pi-vscode.settings", "Pi · Settings", 1, {
      enableScripts: true, retainContextWhenHidden: true,
      localResourceRoots: [getWebviewResourceRoot(this.extensionUri)],
    });
    this.panel = panel;
    this.viewId = randomBytes(16).toString("hex");
    this.subscriptions = [panel.onDidDispose(() => this.clear(panel)), panel.webview.onDidReceiveMessage((value: unknown) => {
      void this.receive(panel, value).catch(() => { this.publish(true); });
    })];
    panel.webview.html = getWebviewHtml(panel.webview, this.extensionUri, randomBytes(16).toString("base64"), "settings");
    void this.prepare().then(() => this.publish(true));
  }

  publish(force = false): void {
    const panel = this.panel;
    if (!panel) return;
    const state = this.snapshot();
    const envelope = { version: 3, generation: state.generation, viewId: this.viewId };
    const projection = JSON.stringify(state);
    if (!force && projection === this.projection) return;
    this.projection = projection;
    panel.title = state.locale === "zh-CN" ? "Pi · 设置" : "Pi · Settings";
    this.post(panel, { ...envelope, type: "uiLanguageState", locale: state.locale });
    this.post(panel, { ...envelope, type: "providerConfigState", ...state.config });
    this.post(panel, { ...envelope, type: "pluginInventoryState", ...state.inventory });
  }

  private async receive(panel: vscode.WebviewPanel, value: unknown): Promise<void> {
    if (this.panel !== panel) return;
    const message = parseWebviewMessage(value);
    if (!message) return;
    if (message.type === "getWorkspaceState" || message.type === "ping") { this.publish(true); return; }
    const state = this.snapshot();
    if (message.viewId !== this.viewId || message.generation !== state.generation) { this.publish(true); return; }
    if (message.type === "setUiLanguage") { this.language(message.locale); return; }
    switch (message.type) {
      case "refreshProviderConfig": case "openProviderApiKey": case "openProviderOAuth": case "addCustomEndpoint": case "removeCustomEndpoint": case "logoutProvider":
      case "setDefaultModel": case "setDefaultThinkingLevel": case "addPluginInventoryEntry":
        await this.action(message);
        this.publish(true);
    }
  }

  private post(panel: vscode.WebviewPanel, value: unknown): void {
    try { void Promise.resolve(panel.webview.postMessage(value)).catch(() => undefined); }
    catch { /* A closed renderer resynchronizes only when reopened. */ }
  }
  private clear(panel: vscode.WebviewPanel): void {
    if (this.panel !== panel) return;
    this.panel = undefined;
    this.projection = "";
    this.viewId = "";
    for (const subscription of this.subscriptions.splice(0)) subscription.dispose();
  }
  dispose(): void { const panel = this.panel; if (panel) { this.clear(panel); panel.dispose(); } }
}
