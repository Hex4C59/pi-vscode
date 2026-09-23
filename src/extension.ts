import path from "node:path";
import { createPiSessionBackend } from "./adapter/sessions/index.js";
import * as vscode from "vscode";

import { createPiRpcRuntime } from "./adapter/runtime/index.js";
import { focusPiChat, PiChatViewProvider } from "./extension/index.js";

export function activate(context: vscode.ExtensionContext): void {
  const runtime = createPiRpcRuntime();
  const provider = new PiChatViewProvider(vscode, runtime, context.extensionUri, createPiSessionBackend(path.join(context.extensionUri.fsPath, "dist/session-worker.mjs")));
  context.subscriptions.push(provider);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      PiChatViewProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pi-vscode.focusChat", async () => {
      await focusPiChat(vscode);
    }),
  );
}

export function deactivate(): void {
  // PiChatViewProvider.dispose stops the owned subprocess via injected lifecycle.
}
