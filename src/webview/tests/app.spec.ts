import { readAppStyles } from "./react-harness.js";
import assert from "node:assert/strict";
import test from "node:test";
import { uiHarness, attachmentState, readyState } from "./react-harness.js";

const message = 'textarea[aria-label="Message"]';
const send = 'button[aria-label="Send message"]';
const stop = 'button[aria-label="Stop current task"]';
const addContext = 'button[aria-label="Add context"]';

test("loading, busy and runtime-error projections keep send gated and emit no actions", async () => {
  const h = await uiHarness(false);
  try {
    const bootstrap = [{ version: 3, type: "ping" }, { version: 3, type: "getWorkspaceState" }];
    assert.deepEqual(h.sent, bootstrap);
    assert.ok(h.root.querySelector(".candidate"));

    await h.render({ runtime: "starting", busy: true, choice: "allow", messages: readyState.messages });
    assert.equal(h.root.querySelectorAll(".candidate__message").length, 0, "a starting runtime must not expose retained conversation history");
    assert.equal(h.get<HTMLButtonElement>(send).disabled, true);

    await h.render({ runtime: "ready", busy: true, choice: "allow", messages: [], chatBusy: false });
    assert.equal(h.root.querySelectorAll(".candidate__message").length, 0, "workspace work must keep the transcript empty before it is ready");
    assert.equal(h.get<HTMLButtonElement>(send).disabled, true);

    await h.render({ runtime: "error", busy: false, choice: "allow", messages: readyState.messages, chatBusy: false });
    assert.match(h.root.textContent ?? "", /Runtime unavailable/);
    assert.deepEqual(h.sent, bootstrap, "host projections alone must not emit actions");
  } finally {
    await h.close();
  }
});

test("ready chat remains visible and an active Stop keeps its controls mounted", async () => {
  const h = await uiHarness(false);
  try {
    await h.render();
    assert.ok(h.root.querySelector(".candidate__composer"));
    assert.ok(h.root.querySelector(message));

    await h.render({ chatBusy: true, execution: "awaiting-approval" });
    assert.ok(h.root.querySelector(".candidate__composer"));
    await h.click(stop);
    assert.ok(h.root.querySelector(".candidate__composer"));
    assert.equal(h.get<HTMLButtonElement>(stop).disabled, true);
    assert.match(h.get(".candidate__progress").textContent ?? "", /Stopping/);
    assert.deepEqual(h.sent.map(m => m.type), ["ping", "getWorkspaceState", "stopChat"]);
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
    await first.click(addContext);
    await first.click('button[aria-label="Add file"]');
    await first.receive(attachmentState({ draft: { revision: 1, text: "", acceptedEditSequence: 0, attachments: [attachment] } }));
    await first.input("Review this file");
    assert.deepEqual(first.sent.at(-1), {
      version: 3, generation: 1, viewId: "view", type: "updateDraft", draftRevision: 1, editSequence: 1, text: "Review this file",
    });
    await first.receive(attachmentState({ draft: { revision: 2, text: "Review this file", acceptedEditSequence: 1, attachments: [attachment] } }));

    await first.render({ chatBusy: true, execution: "awaiting-approval", approvals: [approval] });
    assert.ok(first.root.querySelector('[data-approval-id="approval-1"]'));
    await first.click("#model-effort-trigger");
    await first.click("#model-current");
    await first.click("#model-list button:nth-child(2)");
    assert.deepEqual(first.sent.at(-1), {
      version: 3, generation: 1, viewId: "view", type: "setChatModel", provider: "B", modelId: "two",
    });
    await first.render({ chatBusy: true, execution: "awaiting-approval", approvals: [approval], pendingModel });
    assert.ok(first.get("#pending-settings").textContent?.includes("Next turn (pending): Two"));

    await first.click(stop);
    assert.deepEqual(first.sent.at(-1), { version: 3, generation: 1, viewId: "view", type: "stopChat" });
    assert.equal(first.get<HTMLTextAreaElement>(message).value, "Review this file");
    assert.ok(first.get(".candidate-context__draft").textContent?.includes("src/example.ts"));
    assert.deepEqual(first.sent.map(m => m.type), [
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
    assert.equal(recreated.get<HTMLTextAreaElement>(message).value, "Review this file");
    assert.ok(recreated.get(".candidate-context__draft").textContent?.includes("src/example.ts"));
    assert.ok(recreated.get("#pending-settings").textContent?.includes("Next turn (pending): Two"));
    assert.equal(recreated.get<HTMLButtonElement>(stop).disabled, true);
    assert.match(recreated.get(".candidate__progress").textContent ?? "", /Stopping/);
    assert.deepEqual(recreated.sent, [
      { version: 3, type: "ping" },
      { version: 3, type: "getWorkspaceState" },
    ], "restoring host projections must not replay the draft, model selection or Stop action");
  } finally {
    await recreated.close();
  }
});

test("project-resource consent uses the v3 bridge, escapes folder text and releases its listener", async () => {
  const h = await uiHarness(false);
  try {
    assert.deepEqual(h.sent, [{ version: 3, type: "ping" }, { version: 3, type: "getWorkspaceState" }]);
    const hostile = '</script><img src=x onerror="attack()">';
    await h.render({ runtime: "not-started", choice: null, folder: { name: hostile, path: hostile } });
    // Production surfaces the folder path in the deferred ProjectResourcesPrompt, not a persistent WorkspaceSetup card.
    await h.input("need resources");
    await h.click(send);
    assert.ok(h.root.textContent?.includes(hostile)); assert.equal(h.root.querySelector("img") === null, true);
    await h.click("#allow");
    assert.deepEqual(h.sent.at(-1), { version: 3, generation: 1, viewId: "view", type: "chooseResources", choice: "allow" });
    await h.unmount(); assert.equal(h.listeners.size, 0);
  } finally { await h.close(); }
});

test("draft acknowledgement gates one submission and late admission preserves newer edits", async () => {
  const h = await uiHarness();
  try {
    await h.input("first task");
    assert.deepEqual(h.sent.at(-1), { version: 3, generation: 1, viewId: "view", type: "updateDraft", draftRevision: 0, editSequence: 1, text: "first task" });
    assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
    await h.receive(attachmentState({ draft: { revision: 1, text: "first task", acceptedEditSequence: 1, attachments: [] } }));
    await h.click(send); await h.click(send);
    assert.equal(h.sent.filter(m => m.type === "sendChat").length, 1);
    assert.equal(h.get<HTMLTextAreaElement>(message).value, "first task");
    await h.input("newer task");
    await h.receive(attachmentState({ draft: { revision: 2, text: "", acceptedEditSequence: 1, attachments: [] }, lastSubmission: { submissionId: "submission", draftRevision: 1, delivery: "host-accepted", outcome: "pending" } }));
    assert.equal(h.get<HTMLTextAreaElement>(message).value, "newer task");
    assert.equal(h.sent.filter(m => m.type === "sendChat").length, 1);
    await h.receive(attachmentState({ draft: { revision: 3, text: "newer task", acceptedEditSequence: 2, attachments: [] } }));
    assert.equal(h.get<HTMLButtonElement>(send).disabled, false);
    await h.receive(attachmentState({ draft: { revision: 0, text: "obsolete", acceptedEditSequence: 0, attachments: [] } }));
    assert.equal(h.get<HTMLTextAreaElement>(message).value, "newer task");
  } finally { await h.close(); }
});

test("high-contrast user messages keep a visible hairline on the production surface", async () => {
  const h = await uiHarness();
  try {
    const css = readAppStyles();
    // Production draws the hairline with border-color under high-contrast bodies; jsdom does not resolve CSS variables into getComputedStyle colors.
    assert.match(css, /body\.vscode-high-contrast[\s\S]*?\.candidate__message--user[\s\S]*?border-color:\s*var\(--ui-border\)/);
    assert.match(css, /body\.vscode-high-contrast-light[\s\S]*?\.candidate__message--user[\s\S]*?border-color:\s*var\(--ui-border\)/);
    const style = h.dom.window.document.createElement("style");
    style.textContent = css;
    h.dom.window.document.head.append(style);
    await h.render({ messages: [{ role: "user", text: "Visible user task" }] });
    const row = h.get(".candidate__message--user");
    const computed = h.dom.window.getComputedStyle(row);
    assert.equal(computed.borderTopWidth, "1px");
    assert.equal(computed.borderTopStyle, "solid");
  } finally { await h.close(); }
});

test("model picker opens with non-clipping overflow styles through its footer", async () => {
  const h = await uiHarness();
  try {
    const style = h.dom.window.document.createElement("style");
    style.textContent = readAppStyles(); h.dom.window.document.head.append(style);
    assert.ok(h.root.querySelector(".candidate__composer"));
    assert.ok(h.root.querySelector(".candidate-context"));
    await h.click("#model-effort-trigger");
    const dialog = h.get<HTMLElement>('[role="dialog"][aria-label="Model and thinking level"]');
    assert.equal(dialog.hidden, false);
    const footer = dialog.closest("footer"); assert.ok(footer);
    // jsdom leaves initial values empty and does not expand overflow shorthand.
    // Check both forms on each ancestor; this is a style guard, not layout evidence.
    for (let ancestor = dialog.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const computed = h.dom.window.getComputedStyle(ancestor);
      assert.match(computed.overflow, /^(?:visible(?: visible)?)?$/, `${ancestor.className}: overflow`);
      assert.match(computed.overflowX, /^(?:visible)?$/, `${ancestor.className}: overflow-x`);
      assert.match(computed.overflowY, /^(?:visible)?$/, `${ancestor.className}: overflow-y`);
      if (ancestor === footer) break;
    }
  } finally { await h.close(); }
});
