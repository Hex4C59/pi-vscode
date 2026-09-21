import * as vscode from "vscode";

import { createPiRpcRuntime } from "./adapter/pi-rpc-runtime.js";
import { focusPiChat, PiChatViewProvider } from "./extension/piChatViewProvider.js";

export function activate(context: vscode.ExtensionContext): void {
  const runtime = createPiRpcRuntime();
  const provider = new PiChatViewProvider(vscode, runtime);
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
