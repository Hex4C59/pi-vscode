import assert from "node:assert/strict";
import test from "node:test";
import { WebviewClient } from "../webview-client.js";
import { parseHostMessage } from "../parse-host-message.js";
import { createWebviewBridge } from "../bridge.js";
import { readySettings } from "../../extension/tests/harness.js";
import type { HostMessage, WebviewMessage } from "../../extension/webviewMessages.js";

function clientHarness() {
  const sent: WebviewMessage[] = [];
  let listener: ((value: unknown) => void) | undefined;
  const client = new WebviewClient({ postMessage: m => { sent.push(m); }, subscribe: next => { listener = next; return () => { listener = undefined; }; } });
  client.start();
  return { client, sent, receive: (m: unknown) => listener?.(m), subscribed: () => !!listener };
}

test("real host projection is accepted by the browser boundary, malformed snapshots are ignored", async () => {
  const { h, v, r } = await readySettings();
  const ui = clientHarness();
  try {
    for (const message of v.sent) { assert.ok(parseHostMessage(message), JSON.stringify(message)); ui.receive(message); }
    assert.equal(ui.client.getSnapshot().workspace?.runtime, "ready");
    const snapshot = ui.client.getSnapshot();
    for (const malformed of [null, [], { ...v.state(), version: 1 }, { ...v.state(), messages: [{}] }, { ...v.state(), approvals: [null] }]) ui.receive(malformed);
    assert.equal(ui.client.getSnapshot(), snapshot);
    r.events.fire({ kind: "activity", session: r.runtime.getSession(), item: { id: `tool-${"x".repeat(200)}`, messageId: "message-1", kind: "tool", text: "output", status: "executing", truncated: false } });
    assert.ok(parseHostMessage(v.sent.at(-1)), "maximum host tool-call id must render");
  } finally { ui.client.dispose(); h.provider.dispose(); }
});

test("v2 host DTO parsing rejects accessors and extra fields while preserving real projections", async () => {
  const { h, v } = await readySettings();
  const ui = clientHarness();
  let getterCalls = 0;
  try {
    v.action("getAttachmentHistory");
    v.action("getAttachmentPreview", { requestId: "preview-1", snapshotId: "missing-snapshot", offset: 0 });
    const projections: object[] = [];
    for (const message of v.sent) {
      if (typeof message === "object" && message !== null && !Array.isArray(message) && "type" in message) projections.push(message);
    }
    const observedTypes = new Set<string>();
    for (const projection of projections) {
      const parsed = parseHostMessage(projection);
      assert.ok(parsed, "a real host projection should pass the browser boundary");
      observedTypes.add(parsed.type);
      assert.equal(parseHostMessage({ ...projection, unexpected: true }), undefined, `${parsed.type} rejects unknown fields`);
      ui.receive(projection);
    }
    assert.deepEqual([...observedTypes].sort(), ["attachmentHistory", "attachmentPreview", "attachmentState", "changeReviewState", "savedHistoryState", "sessionState", "workspaceState"]);

    const workspace = v.state();
    const pong = { version: 2, type: "pong", viewId: workspace.viewId, generation: workspace.generation } as const;
    assert.ok(parseHostMessage(pong));
    assert.equal(parseHostMessage({ ...pong, unexpected: true }), undefined);
    const beforeMalformed = ui.client.getSnapshot();
    const topLevelAccessor = Object.defineProperty({ ...pong }, "version", {
      enumerable: true,
      get() { getterCalls++; throw new Error("version accessor must not run"); },
    });
    assert.doesNotThrow(() => ui.receive(topLevelAccessor));
    assert.equal(parseHostMessage(topLevelAccessor), undefined);
    assert.equal(getterCalls, 0);
    assert.equal(ui.client.getSnapshot(), beforeMalformed);

    assert.ok(workspace.folder);
    const folderAccessor = Object.defineProperty({ ...workspace.folder }, "name", {
      enumerable: true,
      get() { getterCalls++; throw new Error("folder accessor must not run"); },
    });
    const nestedAccessor = { ...workspace, folder: folderAccessor };
    assert.doesNotThrow(() => ui.receive(nestedAccessor));
    assert.equal(parseHostMessage(nestedAccessor), undefined);
    assert.equal(getterCalls, 0);
    assert.equal(ui.client.getSnapshot(), beforeMalformed);

    const lineAccessor = Object.defineProperty({ role: "assistant", text: "safe" }, "id", {
      enumerable: true,
      get() { getterCalls++; throw new Error("list-item accessor must not run"); },
    });
    const nestedListAccessor = { ...workspace, messages: [lineAccessor] };
    assert.doesNotThrow(() => ui.receive(nestedListAccessor));
    assert.equal(parseHostMessage(nestedListAccessor), undefined);
    const accessorList = new Array(1);
    Object.defineProperty(accessorList, "0", {
      enumerable: true,
      get() { getterCalls++; throw new Error("array-element accessor must not run"); },
    });
    const listAccessor = { ...workspace, messages: accessorList };
    assert.doesNotThrow(() => ui.receive(listAccessor));
    assert.equal(parseHostMessage(listAccessor), undefined);
    assert.equal(getterCalls, 0);
    assert.equal(ui.client.getSnapshot(), beforeMalformed);

    const nestedExtra = { ...workspace, folder: { ...workspace.folder, unexpected: true } };
    const itemExtra = { ...workspace, messages: [{ role: "assistant", text: "safe", unexpected: true }] };
    assert.equal(parseHostMessage(nestedExtra), undefined);
    assert.equal(parseHostMessage(itemExtra), undefined);
    assert.equal(getterCalls, 0);
    assert.equal(ui.client.getSnapshot(), beforeMalformed);

    const withContractOptionals = {
      ...workspace,
      messages: [{ role: "assistant" as const, text: "line", id: "message-1" }],
      activities: [{ id: "activity-1", messageId: "message-1", contentIndex: 2, toolCallId: "tool-call-1", kind: "tool" as const,
        tool: "read", text: "reading", input: "{}", status: "complete" as const, truncated: false }],
    };
    const parsedOptionals = parseHostMessage(withContractOptionals);
    assert.ok(parsedOptionals?.type === "workspaceState");
    assert.equal(parsedOptionals.messages[0]?.id, "message-1");
    assert.equal(parsedOptionals.activities[0]?.contentIndex, 2);
    assert.equal(parsedOptionals.activities[0]?.toolCallId, "tool-call-1");
    assert.equal(parsedOptionals.activities[0]?.tool, "read");
    assert.equal(parsedOptionals.activities[0]?.input, "{}");
  } finally { ui.client.dispose(); h.provider.dispose(); }
});
test("attachment metadata paths are bounded by UTF-8 bytes", () => {
  const nearLimitPath = `${"界".repeat(341)}a`;
  const oversizedPath = "界".repeat(342);
  const encoder = new TextEncoder();
  assert.equal(encoder.encode(nearLimitPath).byteLength, 1024);
  assert.equal(encoder.encode(oversizedPath).byteLength, 1026);

  const history = (relativePath: string) => ({
    version: 2,
    type: "attachmentHistory",
    viewId: "view",
    generation: 1,
    entries: [{ snapshotId: "snapshot-1", relativePath, kind: "file", utf8Bytes: 1, unsaved: false,
      submissionId: "submission-1", delivery: "sent", outcome: "complete" }],
  });
  assert.ok(parseHostMessage(history(nearLimitPath)));
  assert.equal(parseHostMessage(history(oversizedPath)), undefined);

  const draftState = (path: string) => ({
    version: 2,
    type: "attachmentState",
    viewId: "view",
    generation: 1,
    draft: { revision: 0, text: "", acceptedEditSequence: 0, attachments: [{ attachmentId: "attachment-1", snapshotId: "snapshot-1",
      relativePath: path, kind: "file", utf8Bytes: 1, unsaved: false, state: "attached" }] },
    preparation: "idle",
    result: null,
    historyCount: 1,
    retainedBytes: 1,
    lastSubmission: null,
  });
  assert.ok(parseHostMessage(draftState(nearLimitPath)));
  assert.equal(parseHostMessage(draftState(oversizedPath)), undefined);
});

test("native message bridge removes listeners and transport failures do not retry", () => {
  const target = new EventTarget();
  const sent: WebviewMessage[] = [];
  const bridge = createWebviewBridge({ postMessage: m => sent.push(m) }, target as unknown as Window);
  const received: unknown[] = [];
  const dispose = bridge.subscribe(m => received.push(m));
  target.dispatchEvent(new MessageEvent("message", { data: "first" })); dispose();
  target.dispatchEvent(new MessageEvent("message", { data: "later" }));
  assert.deepEqual(received, ["first"]);
  let attempts = 0;
  const client = new WebviewClient({ subscribe: () => () => undefined, postMessage: () => { attempts++; throw Error("offline"); } });
  client.start(); client.submit(); client.dispose(); client.start();
  assert.equal(attempts, 1); assert.match(client.getSnapshot().error ?? "", /connect/);
});

test("host busy state defers draft synchronization without retry loops and resumes when ready", async () => {
  const { h, v } = await readySettings();
  const ui = clientHarness();
  try {
    for (const message of v.sent) ui.receive(message);
    const state = v.state();
    ui.receive({ ...state, busy: true, runtime: "stopping" } satisfies HostMessage);
    const before = ui.sent.length;
    ui.client.edit("typed during restart");
    assert.equal(ui.sent.length, before, "host rejects all actions while busy");
    ui.receive(state);
    assert.equal(ui.sent.at(-1)?.type, "updateDraft");
    ui.client.dispose(); assert.equal(ui.subscribed(), false);
    const snapshot = ui.client.getSnapshot(); ui.receive(state); assert.equal(ui.client.getSnapshot(), snapshot);
  } finally { ui.client.dispose(); h.provider.dispose(); }
});

test("missing models and unconfirmed or unavailable snapshots block submission while retaining the draft", async () => {
  for (const blocked of ["model", "confirmation-required", "unavailable"] as const) {
    const { h, v } = await readySettings();
    const ui = clientHarness();
    try {
      for (const message of v.sent) ui.receive(message);
      ui.client.edit("keep this draft");
      v.receive.fire(ui.sent.at(-1));
      for (const message of v.sent.slice(-1)) ui.receive(message);
      if (blocked === "model") ui.receive({ ...v.state(), chatModel: null, availableModels: [], thinkingLevels: [] });
      else ui.receive({ ...ui.client.getSnapshot().attachments, draft: { ...ui.client.getSnapshot().attachments!.draft,
        attachments: [{ attachmentId: "a", snapshotId: "s", relativePath: "sample.ts", kind: "file", utf8Bytes: 4, unsaved: false, state: blocked }] } });
      const count = ui.sent.length; ui.client.submit();
      assert.equal(ui.sent.length, count, `${blocked} should not emit sendChat`);
      assert.equal(ui.client.getSnapshot().text, "keep this draft");
    } finally { ui.client.dispose(); h.provider.dispose(); }
  }
});

test("selection metadata accepts only exact immutable ranges and never executes nested accessors", async () => {
  const { h, v } = await readySettings();
  try {
    const envelope = v.attachments();
    const range = { start: { line: 0, character: 2 }, end: { line: 1, character: 0 } };
    const selection = { attachmentId: "a", snapshotId: "s", relativePath: "source.ts", kind: "selection", utf8Bytes: 2, unsaved: true, state: "attached", stale: false, originalRange: range };
    const projection = (attachment: unknown) => ({ ...envelope, draft: { ...envelope.draft, attachments: [attachment] } });
    assert.ok(parseHostMessage(projection(selection)));
    let getters = 0;
    const accessor = Object.defineProperty({ character: 2 }, "line", { get() { getters++; throw Error("not invoked"); } });
    for (const originalRange of [undefined, null, { ...range, extra: true }, { ...range, start: accessor }, { ...range, start: { ...range.start, path: "no" } }, { start: range.end, end: range.start }, { start: range.start, end: range.start }, { ...range, start: { line: -1, character: 0 } }, { ...range, end: { line: 1, character: Number.MAX_SAFE_INTEGER + 1 } }]) {
      assert.equal(parseHostMessage(projection({ ...selection, originalRange })), undefined);
    }
    for (const extra of [{ stale: undefined }, { stale: "true" }, { kind: "file" }, { text: "not metadata" }]) assert.equal(parseHostMessage(projection({ ...selection, ...extra })), undefined);
    assert.equal(getters, 0);
    const { attachmentId: omitted, state: omittedState, ...details } = selection; void omitted; void omittedState;
    const history = { version: 2, type: "attachmentHistory", viewId: v.state().viewId, generation: v.state().generation, entries: [{ ...details, submissionId: "submission", delivery: "rpc-accepted", outcome: "completed" }] };
    assert.ok(parseHostMessage(history));
    assert.equal(parseHostMessage({ ...history, entries: [{ ...history.entries[0], originalRange: { start: range.end, end: range.start } }] }), undefined);
  } finally { h.provider.dispose(); }
});

test("mixed draft projections reject duplicate identities, sparse items and byte metadata beyond the declared budgets", async () => {
  const { h, v } = await readySettings();
  try {
    const original = v.attachments();
    const item = { attachmentId: "a", snapshotId: "s", relativePath: "file.ts", kind: "file", utf8Bytes: 1, unsaved: false, state: "attached" };
    const projection = (attachments: unknown) => ({ ...original, draft: { ...original.draft, attachments } });
    const twenty = Array.from({ length: 20 }, (_, i) => ({ ...item, attachmentId: `a${i}`, snapshotId: `s${i}` }));
    assert.ok(parseHostMessage(projection(twenty)));
    for (const invalid of [[...twenty, { ...item, attachmentId: "extra", snapshotId: "extra" }], [item, item], [item, { ...item, attachmentId: "other" }], [item, { ...item, snapshotId: "other" }], new Array(2), [{ ...item, utf8Bytes: 262145 }], [...Array.from({ length: 4 }, (_, i) => ({ ...item, attachmentId: `big${i}`, snapshotId: `big${i}`, utf8Bytes: 262144 })), item]]) {
      assert.equal(parseHostMessage(projection(invalid)), undefined);
    }
  } finally { h.provider.dispose(); }
});
