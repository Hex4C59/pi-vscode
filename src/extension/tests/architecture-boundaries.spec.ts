import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

test("selected host and browser entry files avoid forbidden capability references", () => {
  const forbidden = /(?:\bfrom\s*|\b(?:import|require)\s*\(\s*)["'][^"']*(?:adapter|pi-coding-agent|child_process|node:fs)|SecretStorage|globalState|workspaceState\.update|trust\.json/;
  assert.match('await import("../../adapter/runtime/index.js")', forbidden);
  assert.match('require("node:fs")', forbidden);
  for (const path of [
    "src/extension/piChatViewProvider.ts",
    "src/extension/bridge/webviewHtml.ts",
    "src/extension/bridge/webviewMessages.ts",
    "src/webview/main.tsx",
    "src/webview/bridge.ts",
    "src/webview/webview-client.ts",
  ]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), forbidden);
  }
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.capabilities.untrustedWorkspaces.supported, "limited");
});

const sourceRoot = path.resolve("src");
const modules = new Set([
  "adapter", "adapter/runtime", "adapter/sessions", "adapter/ownership", "extension", "extension/bridge",
  "extension/contracts", "extension/draft", "extension/editor-tools", "extension/models",
  "extension/sessions", "extension/interactions", "extension/extension-loading", "webview", "webview/components", "webview/chat",
].map(directory => path.join(sourceRoot, directory)));

// Report the same public-entry violations for source fixtures and the application scan.
function moduleEntryViolations(file: string, source: string): string[] {
  const violations: string[] = [];
  for (const match of source.matchAll(/\b(?:from\s*|(?:import|require)\s*\(\s*)["'](\.{1,2}\/[^"']+\.js)["']/g)) {
    const target = path.resolve(path.dirname(file), match[1]);
    const targetModule = path.dirname(target);
    if (!modules.has(targetModule) || path.dirname(file) === targetModule) continue;
    if (target !== path.join(targetModule, "index.js")) violations.push(match[1]);
  }
  return violations;
}

test("public-entry checks allow legal imports and reject presentation imports bypassing their parent entry", () => {
  const file = path.join(sourceRoot, "webview/components/example.tsx");
  assert.deepEqual(moduleEntryViolations(file, `
    import type { SavedHistoryPreview } from "../index.js";
    import type { SessionsProps } from "./types.js";
    import type { SessionStateMessage } from "../../extension/contracts/index.js";
    import { useState } from "react";
    const shared = await import("../index.js");
    void shared;
  `), []);
  assert.deepEqual(moduleEntryViolations(file, `
    import type { SavedHistoryPreview } from "../types.js";
    import { SESSION_PAGE_SIZE } from "../client-state.js";
    import { SAVED_HISTORY_PAGE_SIZE } from "../saved-history-client.js";
  `), ["../types.js", "../client-state.js", "../saved-history-client.js"]);
  assert.deepEqual(moduleEntryViolations(file, `
    const client = await import("../client-state.js");
    const history = require("../saved-history-client.js");
    void client;
    void history;
  `), ["../client-state.js", "../saved-history-client.js"]);
});

// Cross-directory consumers use a deliberately small directory entry; internal files may remain direct.
test("application module consumers use public directory entries", () => {
  const sources = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === "tests") return [];
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? sources(absolute) : /\.tsx?$/.test(entry.name) ? [absolute] : [];
  });
  for (const file of sources(sourceRoot)) {
    const source = readFileSync(file, "utf8");
    assert.deepEqual(moduleEntryViolations(file, source), [], `${path.relative(sourceRoot, file)} should import through its module entries`);
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
    "adapter/runtime", "adapter/sessions", "adapter/ownership", "extension/interactions", "extension/draft", "extension/editor-tools",
    "extension/models", "extension/sessions", "webview", "webview/components", "webview/chat",
  ]) {
    const contract = readFileSync(path.join("src", module, "types.ts"), "utf8");
    const entry = readFileSync(path.join("src", module, "index.ts"), "utf8");
    assert.match(contract, /export (?:type|interface) /, `${module}: missing type declarations`);
    assert.doesNotMatch(contract, /^import\s+(?!type\b)/m, `${module}: type file must not import a runtime value`);
    assert.doesNotMatch(contract, /^export\s+(?!type\b|interface\b)/m, `${module}: type file must not export a runtime value`);
    assert.match(entry, /export type\s*\{[^}]+\}\s*from\s*["']\.\/types\.js["']/s, `${module}: public entry must expose its contract`);
  }
});

test("activation and packaging reference the persistent runtime supervisor", () => {
  const activation = readFileSync("src/extension.ts", "utf8");
  assert.match(activation, /createRuntimeOwner/);
  assert.match(activation, /windowRecoveryDirectory/);
  assert.match(activation, /handoffForeignRecoveryDomains/);
  assert.match(activation, /context\.globalStorageUri\.fsPath/);
  assert.match(activation, /runtime-supervisor\.mjs/);
  assert.match(readFileSync("src/adapter/ownership/recovery-domain.ts", "utf8"), /recovery-v1/);
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.ok(pkg.files.includes("dist/runtime-supervisor.mjs"));
  const build = readFileSync("esbuild.mjs", "utf8");
  assert.match(build, /src\/adapter\/ownership\/supervisor\.ts/);
  assert.match(build, /dist\/runtime-supervisor\.mjs/);
});
