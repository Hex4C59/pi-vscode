import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { uiHarness, attachmentState, readyState } from "./react-harness.js";

test("loading, busy and runtime-error projections hide chat despite retained history and emit no actions", async () => {
  const h = await uiHarness(false);
  try {
    const bootstrap = [{ version: 2, type: "ping" }, { version: 2, type: "getWorkspaceState" }];
    assert.deepEqual(h.sent, bootstrap);
    assert.equal(h.root.querySelector("#chat") === null, true);
    assert.equal(h.root.querySelector("#composer-wrap") === null, true);

    await h.render({ runtime: "starting", busy: true, choice: "allow", messages: readyState.messages });
    assert.equal(h.root.querySelector("#chat") === null, true, "a starting runtime must not expose retained conversation history");
    assert.equal(h.root.querySelector("#composer-wrap") === null, true, "a starting runtime must not expose the composer");

    await h.render({ runtime: "ready", busy: true, choice: "allow", messages: [], chatBusy: false });
    assert.equal(h.root.querySelector("#chat") === null, true, "workspace work must keep the chat hidden before it is ready");
    assert.equal(h.root.querySelector("#composer-wrap") === null, true);

    await h.render({ runtime: "error", busy: false, choice: "allow", messages: readyState.messages, chatBusy: false });
    assert.equal(h.root.querySelector("#chat") === null, true, "runtime failure must not reveal retained conversation history");
    assert.equal(h.root.querySelector("#composer-wrap") === null, true, "runtime failure must not expose the composer");
    assert.deepEqual(h.sent, bootstrap, "host projections alone must not emit actions");
  } finally {
    await h.close();
  }
});

test("ready chat remains visible and an active Stop keeps its controls mounted", async () => {
  const h = await uiHarness(false);
  try {
    await h.render();
    assert.ok(h.root.querySelector("#chat"));
    assert.ok(h.root.querySelector("#composer-wrap"));

    await h.render({ chatBusy: true, execution: "awaiting-approval" });
    assert.ok(h.root.querySelector("#chat"));
    await h.click("#stop-chat");
    assert.ok(h.root.querySelector("#chat"));
    assert.ok(h.root.querySelector("#composer-wrap"));
    assert.equal(h.get<HTMLButtonElement>("#stop-chat").disabled, true);
    assert.match(h.get("#execution-status").textContent ?? "", /Stopping/);
    assert.deepEqual(h.sent.map(message => message.type), ["ping", "getWorkspaceState", "stopChat"]);
  } finally {
    await h.close();
  }
});

test("attachment draft and pending model survive Stop and view recreation without replay", async () => {
  const attachment = {
    attachmentId: "attachment-1",
    snapshotId: "snapshot-1",
    relativePath: "src/example.ts",
    kind: "file" as const,
    utf8Bytes: 18,
    unsaved: true,
    state: "attached" as const,
  };
  const pendingModel = { provider: "B", modelId: "two", label: "Two" };
  const approval = {
    id: "approval-1",
    toolCallId: "tool-call-1",
    tool: "read",
    input: '{"path":"src/example.ts"}',
    scope: '["read","/project/src/example.ts"]',
    expiresAt: Date.now() + 60_000,
  };
  const first = await uiHarness();
  try {
    await first.click("#add-file");
    await first.receive(attachmentState({ draft: { revision: 1, text: "", acceptedEditSequence: 0, attachments: [attachment] } }));
    await first.input("Review this file");
    assert.deepEqual(first.sent.at(-1), {
      version: 2, generation: 1, viewId: "view", type: "updateDraft", draftRevision: 1, editSequence: 1, text: "Review this file",
    });
    await first.receive(attachmentState({ draft: { revision: 2, text: "Review this file", acceptedEditSequence: 1, attachments: [attachment] } }));

    await first.render({ chatBusy: true, execution: "awaiting-approval", approvals: [approval] });
    assert.ok(first.root.querySelector('[data-approval-id="approval-1"]'));
    await first.click("#model-effort-trigger");
    await first.click("#model-current");
    await first.click("#model-list button:nth-child(2)");
    assert.deepEqual(first.sent.at(-1), {
      version: 2, generation: 1, viewId: "view", type: "setChatModel", provider: "B", modelId: "two",
    });
    await first.render({ chatBusy: true, execution: "awaiting-approval", approvals: [approval], pendingModel });
    assert.ok(first.get("#pending-settings").textContent?.includes("Next turn (pending): B / Two"));

    await first.click("#stop-chat");
    assert.deepEqual(first.sent.at(-1), { version: 2, generation: 1, viewId: "view", type: "stopChat" });
    assert.equal(first.get<HTMLTextAreaElement>("#chat-input").value, "Review this file");
    assert.ok(first.get("#attachment-entry").textContent?.includes("src/example.ts"));
    assert.deepEqual(first.sent.map(message => message.type), [
      "ping", "getWorkspaceState", "addFileAttachment", "updateDraft", "setChatModel", "stopChat",
    ]);
    await first.unmount();
    assert.equal(first.listeners.size, 0);
  } finally {
    await first.close();
  }

  const recreated = await uiHarness(false);
  try {
    await recreated.render({ chatBusy: false, execution: "stopping", approvals: [], pendingModel });
    await recreated.receive(attachmentState({ draft: { revision: 2, text: "Review this file", acceptedEditSequence: 1, attachments: [attachment] } }));
    assert.equal(recreated.get<HTMLTextAreaElement>("#chat-input").value, "Review this file");
    assert.ok(recreated.get("#attachment-entry").textContent?.includes("src/example.ts"));
    assert.ok(recreated.get("#pending-settings").textContent?.includes("Next turn (pending): B / Two"));
    assert.equal(recreated.get<HTMLButtonElement>("#stop-chat").disabled, true);
    assert.equal(recreated.get("#stop-chat").textContent, "Stopping…");
    assert.deepEqual(recreated.sent, [
      { version: 2, type: "ping" },
      { version: 2, type: "getWorkspaceState" },
    ], "restoring host projections must not replay the draft, model selection or Stop action");
  } finally {
    await recreated.close();
  }
});

test("React workspace setup boots through the real v2 bridge and releases its listener", async () => {
  const h = await uiHarness(false);
  try {
    assert.deepEqual(h.sent, [{ version: 2, type: "ping" }, { version: 2, type: "getWorkspaceState" }]);
    const hostile = '</script><img src=x onerror="attack()">';
    await h.render({ runtime: "not-started", folder: { name: hostile, path: hostile } });
    assert.ok(h.root.textContent?.includes(hostile)); assert.equal(h.root.querySelector("img"), null);
    await h.click("#allow");
    assert.deepEqual(h.sent.at(-1), { version: 2, generation: 1, viewId: "view", type: "chooseResources", choice: "allow" });
    await h.unmount(); assert.equal(h.listeners.size, 0);
  } finally { await h.close(); }
});

test("draft acknowledgement gates one submission and late admission preserves newer edits", async () => {
  const h = await uiHarness();
  try {
    await h.input("first task");
    assert.deepEqual(h.sent.at(-1), { version: 2, generation: 1, viewId: "view", type: "updateDraft", draftRevision: 0, editSequence: 1, text: "first task" });
    assert.equal(h.get<HTMLButtonElement>("#send-chat").disabled, true);
    await h.receive(attachmentState({ draft: { revision: 1, text: "first task", acceptedEditSequence: 1, attachments: [] } }));
    await h.click("#send-chat"); await h.click("#send-chat");
    assert.equal(h.sent.filter(m => m.type === "sendChat").length, 1);
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "first task");
    await h.input("newer task");
    await h.receive(attachmentState({ draft: { revision: 2, text: "", acceptedEditSequence: 1, attachments: [] }, lastSubmission: { submissionId: "submission", draftRevision: 1, delivery: "host-accepted", outcome: "pending" } }));
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "newer task");
    assert.equal(h.sent.filter(m => m.type === "sendChat").length, 1);
    await h.receive(attachmentState({ draft: { revision: 3, text: "newer task", acceptedEditSequence: 2, attachments: [] } }));
    assert.equal(h.get<HTMLButtonElement>("#send-chat").disabled, false);
    await h.receive(attachmentState({ draft: { revision: 0, text: "obsolete", acceptedEditSequence: 0, attachments: [] } }));
    assert.equal(h.get<HTMLTextAreaElement>("#chat-input").value, "newer task");
  } finally { await h.close(); }
});


test("high-contrast messages use the theme surface and foreground as a readable pair", async () => {
  const h = await uiHarness();
  try {
    const style = h.dom.window.document.createElement("style");
    style.textContent = readFileSync("src/webview/styles.css", "utf8");
    h.dom.window.document.head.append(style);
    await h.render({ messages: [{ role: "user", text: "Visible user task" }] });
    for (const theme of ["vscode-high-contrast", "vscode-high-contrast-light"]) {
      h.dom.window.document.body.className = theme;
      const message = h.get(".msg-user");
      const computed = h.dom.window.getComputedStyle(message);
      // jsdom exposes unresolved CSS variables: native/browser evidence verifies their actual colors.
      assert.equal(computed.backgroundColor, "var(--ui-surface)");
      assert.equal(computed.color, "var(--ui-fg)");
      assert.equal(computed.borderTopWidth, "1px");
    }
  } finally { await h.close(); }
});

test("composer context scrolls independently while the input and task controls remain siblings outside it", async () => {
  const h = await uiHarness();
  try {
    const style = h.dom.window.document.createElement("style");
    style.textContent = readFileSync("src/webview/styles.css", "utf8"); h.dom.window.document.head.append(style);
    const context = h.get("#composer-context");
    for (const id of ["controlled-disclosure", "execution-status", "attachment-controls"]) assert.ok(context.contains(h.get(`#${id}`)));
    assert.equal(context.contains(h.get("#composer")), false);
    assert.equal(context.parentElement, h.get("#composer").parentElement);
    assert.equal(h.dom.window.getComputedStyle(context).overflowY, "auto");
    assert.equal(h.dom.window.getComputedStyle(context).minHeight, "0px");
    assert.equal(h.dom.window.getComputedStyle(h.get("#composer-wrap")).overflowY, "hidden");
    // Actual viewport geometry and keyboard access are checked in browser/native evidence.
  } finally { await h.close(); }
});
