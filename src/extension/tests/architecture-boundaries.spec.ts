import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

test("host and browser modules preserve the runtime and capability boundaries", () => {
  for (const path of [
    "src/extension/piChatViewProvider.ts",
    "src/extension/bridge/webviewHtml.ts",
    "src/extension/bridge/webviewMessages.ts",
    "src/webview/main.tsx",
    "src/webview/bridge.ts",
    "src/webview/webview-client.ts",
  ]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /from\s+["'][^"']*(?:adapter|pi-coding-agent|child_process|node:fs)|SecretStorage|globalState|workspaceState\.update|trust\.json/);
  }
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.capabilities.untrustedWorkspaces.supported, "limited");
});

// Cross-directory consumers use a deliberately small directory entry; internal files may remain direct.
test("application module consumers use public directory entries", () => {
  const sourceRoot = path.resolve("src");
  const modules = new Set([
    "adapter", "adapter/runtime", "adapter/sessions", "extension", "extension/bridge",
    "extension/contracts", "extension/draft", "extension/editor-tools", "extension/models",
    "extension/sessions", "webview", "webview/components",
  ].map(directory => path.join(sourceRoot, directory)));
  const sources = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === "tests") return [];
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? sources(absolute) : /\.tsx?$/.test(entry.name) ? [absolute] : [];
  });
  for (const file of sources(sourceRoot)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/\bfrom\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) {
      const target = path.resolve(path.dirname(file), match[1]);
      const targetModule = path.dirname(target);
      if (!modules.has(targetModule) || path.dirname(file) === targetModule) continue;
      // Presentation components consume helpers owned by their parent UI module.
      if (targetModule === path.join(sourceRoot, "webview") && file.startsWith(path.join(targetModule, "components") + path.sep)) continue;
      assert.equal(target, path.join(targetModule, "index.js"), `${path.relative(sourceRoot, file)} should import ${match[1]} through its module entry`);
    }
    if (file.startsWith(path.join(sourceRoot, "webview") + path.sep)) {
      for (const match of source.matchAll(/\bimport\s+(type\s+)?[^;]+?from\s*["']([^"']*extension\/contracts\/index\.js)["']/gs)) {
        assert.equal(match[1], "type ", `${file}: Webview may only import host-owned contracts as types`);
      }
    }
  }
});

// Module-local contracts describe the interface without pulling runtime capabilities into importers.
test("module type contracts are type-only and reachable through their public entry", () => {
  for (const module of [
    "adapter/runtime", "adapter/sessions", "extension/draft", "extension/editor-tools",
    "extension/models", "extension/sessions", "webview", "webview/components",
  ]) {
    const contract = readFileSync(path.join("src", module, "types.ts"), "utf8");
    const entry = readFileSync(path.join("src", module, "index.ts"), "utf8");
    assert.match(contract, /export (?:type|interface) /, `${module}: missing type declarations`);
    assert.doesNotMatch(contract, /^import\s+(?!type\b)/m, `${module}: type file must not import a runtime value`);
    assert.doesNotMatch(contract, /^export\s+(?!type\b|interface\b)/m, `${module}: type file must not export a runtime value`);
    assert.match(entry, /export type\s*\{[^}]+\}\s*from\s*["']\.\/types\.js["']/s, `${module}: public entry must expose its contract`);
  }
});
