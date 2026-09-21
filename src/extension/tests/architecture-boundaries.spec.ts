import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

test("webview provider does not import adapter; extension entry wires subprocess lifecycle", () => {
  for (const path of ["src/extension/piChatViewProvider.ts", "src/extension/webviewMessages.ts", "src/webview/placeholderHtml.ts"]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /from\s+["'][^"']*(?:adapter|pi-coding-agent|child_process|node:fs)|SecretStorage|globalState|workspaceState\.update|trust\.json/);
  }
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.capabilities.untrustedWorkspaces.supported, "limited");
});
