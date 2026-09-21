import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { getPlaceholderHtml } from "../placeholderHtml.js";

test("UI renders hostile names/paths with textContent and wires keyboard-native choice buttons", () => {
  const html = getPlaceholderHtml("test-nonce");
  const script = html.match(/<script nonce="test-nonce">([\s\S]*?)<\/script>/)?.[1]; assert.ok(script);
  const elements = new Map<string, { textContent: string; hidden: boolean; disabled: boolean; setAttribute: (name: string, value: string) => void; addEventListener: (name: string, callback: () => void) => void }>();
  const clicks = new Map<string, () => void>(); const outgoing: unknown[] = [];
  let receive!: (event: { data: unknown }) => void;
  runInNewContext(script, {
    acquireVsCodeApi: () => ({ postMessage: (message: unknown) => outgoing.push(message) }),
    document: { getElementById: (id: string) => {
      if (!elements.has(id)) elements.set(id, { textContent: "", hidden: false, disabled: false, setAttribute: () => undefined, addEventListener: (_name, callback) => { clicks.set(id, callback); } });
      return elements.get(id);
    } }, window: { addEventListener: (_name: string, callback: typeof receive) => { receive = callback; } },
  });
  const hostile = '</script><img src=x onerror="attack()"> & <';
  receive({ data: { version: 1, type: "workspaceState", generation: 7, status: "eligible", folder: { name: hostile, path: hostile }, choice: "decline", busy: false, error: null, runtime: "not-started", runtimeDetail: null, messages: [], chatBusy: false, chatError: null, chatModel: null, thinkingLevel: null, thinkingLevels: [], availableModels: [], modelBusy: false, modelError: null } });
  assert.equal(elements.get("folder-name-heading")?.textContent, "Project resources — " + hostile);
  assert.equal(elements.get("folder-path")?.textContent, hostile);
  assert.match(elements.get("runtime-hint")?.textContent ?? "", /Not running/);
  clicks.get("allow")?.();
  assert.equal(JSON.stringify(outgoing.at(-1)), JSON.stringify({ version: 1, type: "chooseResources", generation: 7, choice: "allow" }));
  assert.doesNotMatch(html, /innerHTML|localStorage|setState\(|getState\(/);
  assert.match(html, /:focus-visible/); assert.match(html, /role="alert"/);
});
