import assert from "node:assert/strict";
import { test } from "node:test";
import { parseHostMessage } from "../client/parse-host-message.js";
import { WebviewClient } from "../client/webview-client.js";
const envelope = { version: 3, generation: 1, viewId: "view" };
const interaction = { ...envelope, type: "interactionState", active: { id: "dialog-1", method: "input", title: "Literal", origin: "trusted runtime extension; not authenticated", placeholder: "Value" }, queuedCount: 0, phase: "waiting", errorCode: null, feedback: [], omittedFeedback: 0 };

test("v3 interaction projection is copied and strictly bounded before reaching client state", () => {
  const parsed = parseHostMessage(interaction);
  assert.deepEqual(parsed, interaction);
  for (const patch of [{ queuedCount: 8 }, { active: { ...interaction.active, method: "shell" } }, { active: { ...interaction.active, title: "界".repeat(171) } }, { active: { ...interaction.active, remoteId: "private" } }, { feedback: [{ id: "x", kind: "notify", level: "info", text: "界".repeat(10923) }] }]) assert.equal(parseHostMessage({ ...interaction, ...patch }), undefined);
  assert.equal(parseHostMessage({ ...interaction, version: 2 }), undefined);
});

test("client retains extension projections and clears their authority on a new generation", () => {
  let receive: (value: unknown) => void = () => undefined;
  const client = new WebviewClient({ postMessage() {}, subscribe(listener) { receive = listener; return () => {}; } });
  client.start();
  try {
    receive(interaction);
    assert.equal(client.getSnapshot().interactions?.active?.id, "dialog-1");
    receive({ ...envelope, type: "executionProfileState", profile: "trusted", displayName: "entry.mjs", phase: "idle", errorCode: null, canSwitch: false, canEnd: true, canRecover: false });
    assert.equal(client.getSnapshot().executionProfile?.profile, "trusted");
    receive({ ...envelope, generation: 2, type: "pong" });
    assert.equal(client.getSnapshot().interactions, null);
    assert.equal(client.getSnapshot().executionProfile, null);
  } finally { client.dispose(); }
});

test("active extension forms and recovery barriers disable competing settings", async () => {
  const { readySettings } = await import("../../extension/tests/harness.js");
  const { availability } = await import("../client/client-state.js");
  const { h, v } = await readySettings();
  const client = new WebviewClient({ postMessage() {}, subscribe() { return () => {}; } });
  try {
    const base = { ...client.getSnapshot(), workspace: v.state() };
    assert.equal(availability(base).settingsDisabled, false);
    const active = { ...base, interactions: { ...interaction, version: 3 as const, type: "interactionState" as const, phase: "waiting" as const, active: { ...interaction.active, method: "input" as const, origin: "trusted runtime extension; not authenticated" as const } } };
    assert.equal(availability(active).settingsDisabled, true);
    const recovery = { ...base, executionProfile: { ...envelope, version: 3 as const, type: "executionProfileState" as const, profile: "controlled" as const, displayName: null, phase: "recovery-required" as const, errorCode: "stop-unconfirmed", canSwitch: false, canEnd: true, canRecover: false } };
    assert.equal(availability(recovery).settingsDisabled, true);
  } finally { client.dispose(); h.provider.dispose(); }
});

test("trusted profile workspace projection does not assert controlled-only execution", async () => {
  const { readySettings } = await import("../../extension/tests/harness.js");
  const { h, v } = await readySettings();
  try {
    const workspace = { ...v.state(), controlledExecution: false };
    assert.deepEqual(parseHostMessage(workspace), workspace);
    assert.equal(parseHostMessage({ ...workspace, controlledExecution: "false" }), undefined);
  } finally { h.provider.dispose(); }
});
