import * as vscode from "vscode";

import { focusPiChat, PiChatViewProvider } from "./extension/piChatViewProvider.js";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new PiChatViewProvider(vscode);
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
  // Runtime lifecycle is owned by adapter layers in later WIs.
}
