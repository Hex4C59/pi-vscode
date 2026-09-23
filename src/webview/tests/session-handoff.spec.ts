import assert from "node:assert/strict";
import test from "node:test";
import type { SessionBackend, SavedSession } from "../../extension/contracts/sessionBackend.js";
import type { HostMessage, WebviewMessage } from "../../extension/contracts/webviewProtocol.js";
import { parseWebviewMessage } from "../../extension/bridge/webviewMessages.js";
import { folder, harness, settingsRuntime, tick } from "../../extension/tests/harness.js";
import { WebviewClient } from "../webview-client.js";
import { parseHostMessage } from "../parse-host-message.js";

const saved: SavedSession = { id: "retained-session", path: "/host-only/session.jsonl", name: "Saved work", firstMessage: "Earlier question", modified: "2026-09-23T00:00:00.000Z" };
function deferred<T>() {
  let finish: ((value: T) => void) | undefined;
  const promise = new Promise<T>(resolve => { finish = resolve; });
  return { promise, resolve(value: T) { assert.ok(finish); finish(value); } };
}
function backend(): SessionBackend {
  return {
    async list(_cwd, page) { return { ok: true, entries: [saved], page, total: 1 }; },
    async inspect() { return { ok: true, session: saved, anchor: "frozen-anchor", history: { messages: [{ role: "user", text: "Earlier question" }], page: 0, total: 1 } }; },
    async history(_cwd, _id, _anchor, page) { return { ok: true, history: { messages: [{ role: "user", text: "Earlier question" }], page, total: 1 } }; },
    async preview(_cwd, _id, _anchor, _index, offset) { return { ok: true, preview: { text: "Saved text", offset, nextOffset: offset + 10, totalChars: offset + 10, done: true } }; },
  };
}

/** Actual provider/parser/client round trips; only native APIs and the runtime/session backend are fixtures. */
async function connectedSession() {
  const r = settingsRuntime();
  const start = r.runtime.start;
  r.runtime.start = async options => {
    const result = await start(options);
    return result.ok ? { ...result, conversation: { id: options.resume?.id ?? "fresh-" + r.runtime.getSession(), name: options.resume ? saved.name : null, path: options.resume?.path ?? "/host-only/fresh.jsonl" } } : result;
  };
  r.runtime.abortTask = async () => { r.settled(); return { ok: true }; };
  const store = backend();
  const h = harness([folder()], true, undefined, r.runtime, store);
  h.api.window.showWarningMessage = async (_message, _options, ...buttons) => buttons[0];
  const v = h.createView();
  const sent: WebviewMessage[] = [];
  const delivered: { message: HostMessage; text: string }[] = [];
  let active = true;
  const client = new WebviewClient({
    postMessage(message) {
      assert.ok(parseWebviewMessage(message), "client emits only canonical named intents");
      sent.push(message);
      queueMicrotask(() => { if (active) v.receive.fire(message); });
    },
    subscribe(listener) {
      const subscription = v.posted.subscribe(message => {
        queueMicrotask(() => {
          if (!active) return;
          const parsed = parseHostMessage(message);
          assert.ok(parsed, "real host projections must pass the browser boundary");
          listener(message);
          delivered.push({ message: parsed, text: client.getSnapshot().text });
        });
      });
      return () => subscription.dispose();
    },
  });
  client.start(); await tick();
  client.action({ type: "chooseResources", choice: "decline" }); await tick();
  client.getSavedSessions(0); await tick();
  const selected = client.getSnapshot().sessions?.entries[0]?.id;
  assert.ok(selected);
  assert.equal(client.getSnapshot().workspace?.runtime, "ready");
  return { client, sent, delivered, h, v, r, store, selected,
    async draft(text: string) { client.edit(text); await tick(); assert.equal(v.attachments().draft.text, text); await tick(); },
    close() { active = false; client.dispose(); h.provider.dispose(); },
  };
}

test("confirmed New clears the discarded local draft at the host generation commit and never sends it into the new conversation", async () => {
  const f = await connectedSession();
  try {
    await f.draft("Discard this old draft");
    const generation = f.client.getSnapshot().workspace?.generation; assert.ok(generation !== undefined);
    const before = f.sent.length;
    f.client.newConversation(); await tick();
    assert.equal(f.client.getSnapshot().workspace?.generation, generation + 1);
    assert.equal(f.client.getSnapshot().sessions?.phase, "idle");
    assert.equal(f.client.getSnapshot().text, "", "confirmed loss must not resurrect the old composer text");
    assert.equal(f.v.attachments().draft.text, "", "host draft must remain empty after the client sees the committed generation");
    assert.deepEqual(f.sent.slice(before).filter(message => message.type === "updateDraft"), [], "no ghost draft replay under the new generation");
    const oldSwitch = f.delivered.find(entry => entry.message.type === "sessionState" && entry.message.phase === "switching" && entry.message.generation === generation);
    assert.equal(oldSwitch?.text, "Discard this old draft", "switching before commit is not yet permission to discard");
    const committed = f.delivered.find(entry => entry.message.type === "sessionState" && entry.message.phase === "switching" && entry.message.generation === generation + 1);
    assert.equal(committed?.text, "", "new-generation switching arrives before the empty attachment bootstrap");
    await f.draft("A genuinely new draft");
    assert.equal(f.client.getSnapshot().text, "A genuinely new draft");
  } finally { f.close(); }
});

test("confirmed Resume discards text before the new-generation attachment bootstrap while the old-generation history reset preserves it", async () => {
  const f = await connectedSession();
  try {
    await f.draft("Do not migrate this draft");
    const generation = f.client.getSnapshot().workspace?.generation; assert.ok(generation !== undefined);
    const before = f.sent.length, deliveredBefore = f.delivered.length;
    f.client.resumeConversation(f.selected); await tick();
    assert.equal(f.client.getSnapshot().workspace?.generation, generation + 1);
    assert.equal(f.client.getSnapshot().sessions?.current?.id, saved.id);
    assert.equal(f.client.getSnapshot().savedHistory?.available, true);
    assert.equal(f.client.getSnapshot().text, "");
    assert.equal(f.v.attachments().draft.text, "");
    assert.deepEqual(f.sent.slice(before).filter(message => message.type === "updateDraft"), []);
    const transition = f.delivered.slice(deliveredBefore);
    const oldHistoryReset = transition.find(entry => entry.message.type === "savedHistoryState" && !entry.message.available && entry.message.generation === generation);
    assert.equal(oldHistoryReset?.text, "Do not migrate this draft", "history reset can arrive before generation commit and must not clear text");
    const commitIndex = transition.findIndex(entry => entry.message.type === "sessionState" && entry.message.phase === "switching" && entry.message.generation === generation + 1);
    const attachmentIndex = transition.findIndex(entry => entry.message.type === "attachmentState" && entry.message.generation === generation + 1);
    assert.ok(commitIndex >= 0 && attachmentIndex > commitIndex, "real host orders committed switching before the empty attachment projection");
    assert.equal(transition[commitIndex].text, "");
  } finally { f.close(); }
});

for (const kind of ["New", "Resume"] as const) {
  test(kind + " does not replay a discarded draft when runtime startup fails after the host committed replacement", async () => {
    const f = await connectedSession();
    const startup = deferred<void>();
    try {
      await f.draft("Discard even if startup fails");
      const generation = f.client.getSnapshot().workspace?.generation; assert.ok(generation !== undefined);
      f.r.runtime.start = async () => { await startup.promise; return { ok: false, detail: "Synthetic postcommit startup failure" }; };
      const before = f.sent.length;
      if (kind === "New") f.client.newConversation(); else f.client.resumeConversation(f.selected);
      await tick();
      assert.equal(f.client.getSnapshot().workspace?.generation, generation + 1);
      assert.equal(f.client.getSnapshot().workspace?.runtime, "starting");
      assert.equal(f.client.getSnapshot().text, "", "discard at commit, not eventual startup success");
      startup.resolve(); await tick();
      assert.equal(f.client.getSnapshot().workspace?.runtime, "error");
      assert.equal(f.client.getSnapshot().sessions?.error, "restore-failed");
      assert.equal(f.client.getSnapshot().text, "");
      assert.equal(f.v.attachments().draft.text, "");
      assert.deepEqual(f.sent.slice(before).filter(message => message.type === "updateDraft"), []);
    } finally { startup.resolve(); f.close(); }
  });

  test("cancelling native " + kind + " keeps the acknowledged draft and generation unchanged", async () => {
    const f = await connectedSession();
    const answer = deferred<string | undefined>();
    try {
      await f.draft("Keep my cancelled draft");
      const generation = f.client.getSnapshot().workspace?.generation;
      f.h.api.window.showWarningMessage = () => answer.promise;
      if (kind === "New") f.client.newConversation(); else f.client.resumeConversation(f.selected);
      await tick();
      assert.equal(f.client.getSnapshot().sessions?.phase, "confirming");
      assert.equal(f.client.getSnapshot().text, "Keep my cancelled draft");
      answer.resolve(undefined); await tick();
      assert.equal(f.client.getSnapshot().sessions?.error, "cancelled");
      assert.equal(f.client.getSnapshot().workspace?.generation, generation);
      assert.equal(f.client.getSnapshot().text, "Keep my cancelled draft");
      assert.equal(f.v.attachments().draft.text, "Keep my cancelled draft");
    } finally { answer.resolve(undefined); f.close(); }
  });
}

test("precommit inspection and Stop failures preserve the draft even after old-generation switching", async () => {
  const f = await connectedSession();
  try {
    await f.draft("Retain on precommit failure");
    const generation = f.client.getSnapshot().workspace?.generation;
    f.store.inspect = async () => ({ ok: false, code: "stale" });
    f.client.resumeConversation(f.selected); await tick();
    assert.equal(f.client.getSnapshot().sessions?.error, "stale");
    assert.equal(f.client.getSnapshot().workspace?.generation, generation);
    assert.equal(f.client.getSnapshot().text, "Retain on precommit failure");
    f.client.submit(); await tick();
    assert.equal(f.client.getSnapshot().workspace?.chatBusy, true);
    await f.draft("Retain when Stop fails");
    f.r.runtime.abortTask = async () => ({ ok: false, detail: "Synthetic Stop failure" });
    f.client.newConversation(); await tick();
    assert.equal(f.client.getSnapshot().sessions?.error, "stop-failed");
    assert.equal(f.client.getSnapshot().workspace?.generation, generation);
    assert.equal(f.client.getSnapshot().text, "Retain when Stop fails");
    assert.equal(f.v.attachments().draft.text, "Retain when Stop fails");
  } finally { f.close(); }
});

test("a workspace generation change during precommit switching is not a committed handoff and retains local text", async () => {
  const f = await connectedSession();
  const inspect = deferred<Awaited<ReturnType<SessionBackend["inspect"]>>>();
  try {
    await f.draft("Keep through an unrelated project generation");
    const generation = f.client.getSnapshot().workspace?.generation; assert.ok(generation !== undefined);
    f.store.inspect = () => inspect.promise;
    f.client.resumeConversation(f.selected); await tick();
    assert.equal(f.client.getSnapshot().sessions?.phase, "switching");
    assert.equal(f.client.getSnapshot().workspace?.generation, generation);
    f.h.api.workspace.workspaceFolders = [folder("/other-project")]; f.h.change.fire(); await tick();
    assert.equal(f.client.getSnapshot().workspace?.generation, generation + 1);
    assert.equal(f.client.getSnapshot().workspace?.choice, null);
    assert.equal(f.client.getSnapshot().sessions?.phase, "idle");
    assert.equal(f.client.getSnapshot().text, "Keep through an unrelated project generation");
    inspect.resolve({ ok: false, code: "cancelled" }); await tick();
    assert.equal(f.v.attachments().draft.text, "Keep through an unrelated project generation");
  } finally { inspect.resolve({ ok: false, code: "cancelled" }); f.close(); }
});

test("native confirmation cancels a delayed retained-text preview locally; cancelling the handoff permits a fresh preview without a stale loading state", async () => {
  const f = await connectedSession();
  const answer = deferred<string | undefined>();
  const pending = deferred<Awaited<ReturnType<SessionBackend["preview"]>>>();
  try {
    f.client.resumeConversation(f.selected); await tick();
    await f.draft("Preserve this cancelled handoff draft");
    const generation = f.client.getSnapshot().workspace?.generation;
    const id = f.client.getSnapshot().savedHistory?.messages[0]?.id; assert.ok(id);
    const preview = f.store.preview;
    const signals: AbortSignal[] = [];
    f.store.preview = (...args) => { signals.push(args[5]); return signals.length === 1 ? pending.promise : preview(...args); };
    f.client.savedHistory.preview(id); await tick();
    const old = f.sent.at(-1); assert.ok(old?.type === "getSavedHistoryPreview");
    assert.equal(f.client.getSnapshot().savedHistoryPreview?.phase, "loading");
    assert.equal(signals.length, 1);
    f.h.api.window.showWarningMessage = () => answer.promise;
    f.client.newConversation(); await tick();
    assert.equal(signals[0].aborted, true, "the real host cancels the pending backend read before native confirmation");
    assert.equal(f.client.getSnapshot().sessions?.phase, "confirming");
    assert.equal(f.client.getSnapshot().savedHistoryPreview, null, "the cancelled host read must not leave an indefinitely loading local preview");
    answer.resolve(undefined); await tick();
    assert.equal(f.client.getSnapshot().sessions?.error, "cancelled");
    assert.equal(f.client.getSnapshot().workspace?.generation, generation);
    assert.equal(f.client.getSnapshot().text, "Preserve this cancelled handoff draft");
    f.client.savedHistory.preview(id); await tick();
    const fresh = f.sent.at(-1); assert.ok(fresh?.type === "getSavedHistoryPreview");
    assert.notEqual(fresh.requestId, old.requestId);
    pending.resolve({ ok: true, preview: { text: "Obsolete", offset: 0, nextOffset: 8, totalChars: 8, done: true } }); await tick();
    assert.equal(signals.length, 2);
    assert.equal(f.delivered.some(entry => entry.message.type === "savedHistoryPreview" && entry.message.requestId === old.requestId), false, "real host suppresses the late cancelled backend result");
    assert.equal(f.client.getSnapshot().savedHistoryPreview?.requestId, fresh.requestId);
    assert.equal(f.client.getSnapshot().savedHistoryPreview?.phase, "idle");
    assert.equal(f.client.getSnapshot().savedHistoryPreview?.text, "Saved text");
    assert.equal(f.v.attachments().draft.text, "Preserve this cancelled handoff draft");
  } finally { pending.resolve({ ok: false, code: "cancelled" }); answer.resolve(undefined); f.close(); }
});
