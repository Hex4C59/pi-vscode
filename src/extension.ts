import path from "node:path";
import * as vscode from "vscode";

import {
  allocateWindowId,
  createRuntimeOwner,
  handoffForeignRecoveryDomains,
  windowRecoveryDirectory,
  withForeignHandoff,
} from "./adapter/ownership/index.js";
import { createManagedProcess, createPiRpcRuntime } from "./adapter/runtime/index.js";
import { createPiSessionBackend } from "./adapter/sessions/index.js";
import { focusPiChat, PiChatViewProvider } from "./extension/index.js";

/** Bundled host entry points, resolved against the installed extension root. */
const SUPERVISOR_BUNDLE = "dist/runtime-supervisor.mjs";
const SESSION_WORKER_BUNDLE = "dist/session-worker.mjs";
const FOCUS_CHAT_COMMAND = "pi-vscode.focusChat";

export function activate(context: vscode.ExtensionContext): void {
  const extensionPath = context.extensionUri.fsPath;
  const workerPath = path.join(extensionPath, SUPERVISOR_BUNDLE);
  const windowId = allocateWindowId();
  const owner = createRuntimeOwner({
    directory: windowRecoveryDirectory(context.globalStorageUri.fsPath, windowId),
    workerPath,
  });
  const process = withForeignHandoff(createManagedProcess(owner), () => handoffForeignRecoveryDomains({
    globalStorage: context.globalStorageUri.fsPath,
    currentWindowId: windowId,
    workerPath,
  }));
  const runtime = createPiRpcRuntime({ process });
  const sessionBackend = createPiSessionBackend(path.join(extensionPath, SESSION_WORKER_BUNDLE));
  const provider = new PiChatViewProvider(
    vscode, runtime, context.extensionUri, sessionBackend, {},
    { globalStorage: context.globalStorageUri.fsPath },
  );

  context.subscriptions.push(provider);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      PiChatViewProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
    vscode.commands.registerCommand("pi-vscode.showResourceReport", () => provider.showResourceReport()),
    vscode.commands.registerCommand(FOCUS_CHAT_COMMAND, async () => {
      await focusPiChat(vscode);
    }),
  );
}

export function deactivate(): void {
  // Provider disposal still ends an idle owned child through stop/end/recover.
  // Host crash or pipe loss is handled by the supervisor (ADR 0008): it ends the exact child.
}
