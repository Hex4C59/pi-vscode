import path from "node:path";
import * as vscode from "vscode";

import { createRuntimeOwner } from "./adapter/ownership/index.js";
import { createManagedProcess, createPiRpcRuntime } from "./adapter/runtime/index.js";
import { createPiSessionBackend } from "./adapter/sessions/index.js";
import { focusPiChat, PiChatViewProvider } from "./extension/index.js";

/** Recovery domain under global storage; it fences a runtime owned by a previous host. */
const RECOVERY_DIRECTORY = "recovery-v1";
/** Bundled host entry points, resolved against the installed extension root. */
const SUPERVISOR_BUNDLE = "dist/runtime-supervisor.mjs";
const SESSION_WORKER_BUNDLE = "dist/session-worker.mjs";
const FOCUS_CHAT_COMMAND = "pi-vscode.focusChat";

export function activate(context: vscode.ExtensionContext): void {
  const extensionPath = context.extensionUri.fsPath;
  const owner = createRuntimeOwner({
    directory: path.join(context.globalStorageUri.fsPath, RECOVERY_DIRECTORY),
    workerPath: path.join(extensionPath, SUPERVISOR_BUNDLE),
  });
  const runtime = createPiRpcRuntime({ process: createManagedProcess(owner) });
  const sessionBackend = createPiSessionBackend(path.join(extensionPath, SESSION_WORKER_BUNDLE));
  const provider = new PiChatViewProvider(vscode, runtime, context.extensionUri, sessionBackend);

  context.subscriptions.push(provider);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      PiChatViewProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
    vscode.commands.registerCommand(FOCUS_CHAT_COMMAND, async () => {
      await focusPiChat(vscode);
    }),
  );
}

export function deactivate(): void {
  // Provider disposal retires an idle owned child; uncertain work retains its supervisor/fence.
}
