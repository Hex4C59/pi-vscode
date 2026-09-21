import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { focusPiChat } from "../piChatViewProvider.js";

test("focus command reveals existing container before focusing, including repeated invocations", async () => {
  const calls: string[] = []; let reveal!: () => void;
  const api = { commands: { executeCommand: async (command: string) => {
    calls.push(command);
    if (command === "workbench.view.extension.pi-vscode") await new Promise<void>((resolve) => { reveal = resolve; });
  } } } as unknown as Parameters<typeof focusPiChat>[0];
  const first = focusPiChat(api);
  assert.deepEqual(calls, ["workbench.view.extension.pi-vscode"]);
  reveal(); await first;
  const second = focusPiChat(api); reveal(); await second;
  assert.deepEqual(calls, ["workbench.view.extension.pi-vscode", "pi-vscode.chat.focus", "workbench.view.extension.pi-vscode", "pi-vscode.chat.focus"]);
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.deepEqual(pkg.contributes.menus["editor/title"], [{ command: "pi-vscode.focusChat", group: "navigation" }]);
  const command = pkg.contributes.commands.find((entry: { command: string }) => entry.command === "pi-vscode.focusChat");
  for (const theme of ["light", "dark"]) assert.match(readFileSync(command.icon[theme], "utf8"), /<path /);
  assert.equal(pkg.contributes.viewsContainers.secondarySidebar[0].id, "pi-vscode");
});

test("focus reveal failure does not issue a subsequent focus command", async () => {
  const calls: string[] = [];
  const api = { commands: { executeCommand: async (command: string) => { calls.push(command); throw new Error("unavailable"); } } };
  await assert.rejects(focusPiChat(api as unknown as Parameters<typeof focusPiChat>[0]), /unavailable/);
  assert.deepEqual(calls, ["workbench.view.extension.pi-vscode"]);
});
