import assert from "node:assert/strict";
import test from "node:test";
import { Event, readySettings, tick } from "./harness.js";

function nativeProgress(h: Awaited<ReturnType<typeof readySettings>>["h"]) {
  const cancel = new Event<void>();
  const notices: string[] = [];
  h.api.window.showInformationMessage = async message => { notices.push(message); return undefined; };
  Object.assign(h.api.window, { withProgress: async (_options: unknown, task: (progress: { report(value: unknown): void }, token: { isCancellationRequested: boolean; onCancellationRequested: typeof cancel.subscribe }) => Promise<unknown>) => task({ report() {} }, { isCancellationRequested: false, onCancellationRequested: cancel.subscribe }) });
  return { cancel, notices };
}

// Pre-code failures: no loss warning, cancel still compacts, busy calls compact,
// old identity, draft loss, Stop releases before actual completion and listener leaks.
test("native confirmed compaction is visible and does not submit or discard the draft", async () => {
  const { r, h, v } = await readySettings(); const n = nativeProgress(h);
  let finish!: () => void; const calls: (string | undefined)[] = [];
  h.api.window.showWarningMessage = async message => { assert.match(message, /lossy/); return "Add instructions"; };
  h.api.window.showInputBox = async () => "  custom 中\nnext  ";
  r.runtime.compactContext = async instructions => { calls.push(instructions); await new Promise<void>(resolve => { finish = resolve; }); return { outcome: "completed", agentRunning: false }; };
  try {
    v.action("updateDraft", { text: "keep unsent", draftRevision: v.attachments().draft.revision, editSequence: 1 });
    const running = h.provider.compactContext(); await tick();
    assert.equal(v.state().chatBusy, true); assert.equal(v.state().execution, "compacting");
    v.send("sendChat", { generation: v.state().generation, viewId: v.state().viewId, draftRevision: v.attachments().draft.revision }); await tick();
    assert.equal(r.calls.includes("prompt"), false);
    finish(); await running;
    assert.deepEqual(calls, ["  custom 中\nnext  "]);
    assert.equal(v.state().chatBusy, false);
    assert.equal(v.attachments().draft.text, "keep unsent");
    assert.ok(n.notices.some(s => /completed/i.test(s)));
    assert.equal(n.cancel.listeners.size, 0);
  } finally { h.provider.dispose(); }
});

test("native confirmation cancellation, stale identity and task-busy refusal never compact", async () => {
  const { r, h, v } = await readySettings(); nativeProgress(h); let calls = 0;
  r.runtime.compactContext = async () => { calls++; return { outcome: "completed", agentRunning: false }; };
  try {
    await h.provider.compactContext(); assert.equal(calls, 0);
    const originalSession = r.runtime.getSession;
    h.api.window.showWarningMessage = async () => { r.runtime.getSession = () => 999; return "Compact"; };
    await h.provider.compactContext(); assert.equal(calls, 0);
    r.runtime.getSession = originalSession;
    v.action("sendChat", { text: "existing task" }); await tick();
    assert.equal(v.state().chatBusy, true);
    await h.provider.compactContext(); assert.equal(calls, 0);
  } finally { h.provider.dispose(); }
});
