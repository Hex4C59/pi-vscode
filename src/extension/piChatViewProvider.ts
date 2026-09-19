import * as vscode from "vscode";

import { getPlaceholderHtml } from "../webview/placeholderHtml.js";

export const PI_CHAT_VIEW_ID = "pi-vscode.chat";

export class PiChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = PI_CHAT_VIEW_ID;

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    webviewView.webview.options = {
      enableScripts: false,
      localResourceRoots: [],
    };
    webviewView.webview.html = getPlaceholderHtml();
  }
}
