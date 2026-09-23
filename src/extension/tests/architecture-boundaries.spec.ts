import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

test("host and browser modules preserve the runtime and capability boundaries", () => {
  for (const path of [
    "src/extension/piChatViewProvider.ts",
    "src/extension/webviewHtml.ts",
    "src/extension/webviewMessages.ts",
    "src/webview/main.tsx",
    "src/webview/bridge.ts",
    "src/webview/client.ts",
  ]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /from\s+["'][^"']*(?:adapter|pi-coding-agent|child_process|node:fs)|SecretStorage|globalState|workspaceState\.update|trust\.json/);
  }
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.capabilities.untrustedWorkspaces.supported, "limited");
});
