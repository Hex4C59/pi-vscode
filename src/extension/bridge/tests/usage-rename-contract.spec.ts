import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { parseWebviewMessage } from "../webviewMessages.js";
import { parseHostMessage } from "../../../webview/client/parse-host-message.js";


test("current-session rename uses native host input and an exact revisioned state", () => {
  const intent = { ...envelope, type: "renameSession" };
  const state = { ...envelope, type: "sessionRenameState", revision: 0, status: "ready" };
  artifact("rename", { intentAdmitted: !!parseWebviewMessage(intent), stateAdmitted: !!parseHostMessage(state) });
  assert.deepEqual(parseWebviewMessage(intent), intent);
  assert.deepEqual(parseHostMessage(state), state);
  for (const status of ["unavailable", "renaming"]) assert.ok(parseHostMessage({ ...state, status }));
  for (const extra of [{ name: "new" }, { id: "other" }, { path: "/private" }]) {
    assert.equal(parseWebviewMessage({ ...intent, ...extra }), undefined);
    assert.equal(parseHostMessage({ ...state, ...extra }), undefined);
  }
  assert.equal(parseHostMessage({ ...state, revision: -1 }), undefined);
});
const envelope = { version: 3, generation: 1, viewId: "view" };

test("whole-body eligibility is host-owned literal true only for nonempty assistant bodies", () => {
  const message = { ...envelope, type: "workspaceState", status: "eligible", folder: null, choice: "allow",
    busy: false, error: null, runtime: "ready", runtimeDetail: null, chatBusy: false, chatError: null,
    chatModel: null, thinkingLevel: null, thinkingLevels: [], availableModels: [], pendingModel: null,
    pendingThinkingLevel: null, modelBusy: false, modelError: null, activities: [], approvals: [], grants: [],
    execution: "completed", controlledExecution: true, messages: [{ role: "assistant", text: "Complete body", bodyCopyEligible: true }] };
  const admitted = parseHostMessage(message);
  artifact("body-copy", { admitted: admitted !== undefined });
  assert.deepEqual(admitted, message);
  for (const patch of [{ bodyCopyEligible: false }, { bodyCopyEligible: 1 }, { bodyCopyEligible: "true" }, { role: "user" }, { text: " \n" }]) {
    assert.equal(parseHostMessage({ ...message, messages: [{ ...message.messages[0], ...patch }] }), undefined);
  }
  assert.ok(parseHostMessage({ ...message, messages: [{ role: "assistant", text: "Unverified body" }] }));
  assert.equal(parseHostMessage({ ...envelope, type: "savedHistoryState", available: true, phase: "idle",
    messages: message.messages, page: 0, total: 1, error: null }), undefined);
});
function artifact(name: string, value: unknown) {
  mkdirSync("dist/wi079-contract", { recursive: true });
  writeFileSync(`dist/wi079-contract/${name}.json`, JSON.stringify(value, null, 2));
}

test("chat usage refresh is an exact no-payload intent", () => {
  const intent = { ...envelope, type: "refreshSessionUsage" };
  const admitted = parseWebviewMessage(intent);
  artifact("refresh", { admitted: admitted !== undefined });
  assert.deepEqual(admitted, intent);
  for (const extra of [{ path: "/private" }, { name: "override" }, { id: "session" }, { version: 2 }]) {
    assert.equal(parseWebviewMessage({ ...intent, ...extra }), undefined);
  }
});

test("usage projection preserves cumulative totals and nullable context without raw metadata", () => {
  const usage = { tokens: { input: 120, output: 30, cacheRead: 40, cacheWrite: 10, total: 200 }, context: { tokens: null, contextWindow: 1000, percent: null }, cost: null };
  const message = { ...envelope, type: "sessionUsageState", revision: 2, status: "ready", usage };
  const admitted = parseHostMessage(message);
  artifact("projection", { admitted: admitted !== undefined, expected: message });
  assert.deepEqual(admitted, message);
  for (const bad of [NaN, Infinity, -1, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(parseHostMessage({ ...message, usage: { ...usage, tokens: { ...usage.tokens, total: bad } } }), undefined);
  }
  assert.equal(parseHostMessage({ ...message, usage: { ...usage, sessionFile: "/private" } }), undefined);
  assert.equal(parseHostMessage({ ...message, usage: { ...usage, context: { ...usage.context, percent: 100.01 } } }), undefined);
  for (const status of ["loading", "unavailable", "no-session"]) {
    assert.ok(parseHostMessage({ ...message, status, usage: null }));
    assert.equal(parseHostMessage({ ...message, status }), undefined);
  }
});
