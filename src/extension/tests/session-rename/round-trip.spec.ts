import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { parseHostMessage } from "../../../webview/client/parse-host-message.js";
import { tick } from "../harness.js";
import { renameFixture } from "./rename.test-support.js";

function sessions(f: Awaited<ReturnType<typeof renameFixture>>) {
  const raw = [...f.v.sent].reverse().find(value => (value as { type?: string }).type === "sessionState");
  const message = parseHostMessage(raw); assert.ok(message?.type === "sessionState"); return message;
}
function artifact(name: string, value: object) {
  mkdirSync("dist/wi080", { recursive: true });
  writeFileSync(`dist/wi080/${name}.json`, JSON.stringify(value, null, 2));
}

test("native rename round trip verifies the opened identity then refreshes title and catalogue preserving draft and body", async () => {
  const f = await renameFixture();
  try {
    f.v.action("sendChat", { text: "Historical literal body" }); await tick();
    f.connection.frame({ type: "message_update", assistantMessageEvent: { type: "text_delta", delta: "Literal assistant body" } });
    f.connection.frame({ type: "agent_settled" }); await tick();
    assert.equal(f.v.state().chatBusy, false);
    assert.match(JSON.stringify(f.v.state().messages), /Historical literal body/);
    assert.match(JSON.stringify(f.v.state().messages), /Literal assistant body/);
    f.v.action("getSavedSessions", { page: 0 }); await tick();
    f.v.action("updateDraft", { draftRevision: f.v.attachments().draft.revision, editSequence: f.v.attachments().draft.acceptedEditSequence + 1, text: "Preserve this draft" });
    assert.equal(f.v.attachments().draft.text, "Preserve this draft");
    const before = f.v.state(); const body = before.messages; const runtimeSession = f.runtime.getSession();
    let prompts = 0;
    f.h.api.window.showInputBox = async options => { prompts++; assert.equal(options?.value, "Original name"); return "Renamed current work"; };
    f.v.action("renameSession"); await tick(); await tick();
    artifact("round-trip", { prompts, projectedName: sessions(f).current?.name, publicName: f.state.sessionName, catalogue: sessions(f).entries, draft: f.v.attachments().draft.text });
    assert.equal(prompts, 1, "canonical host intent must open one native input");
    assert.equal(sessions(f).current?.name, "Renamed current work");
    assert.equal(sessions(f).entries[0].title, "Renamed current work");
    assert.equal(sessions(f).entries[0].excerpt, "Historical literal body");
    assert.equal(f.lists, 2);
    assert.equal(f.runtime.getSession(), runtimeSession);
    assert.equal(f.v.state().generation, before.generation);
    assert.deepEqual(f.v.state().messages, body);
    assert.equal(f.v.attachments().draft.text, "Preserve this draft");
    assert.deepEqual(f.commands.slice(-3).map(value => value.type), ["get_state", "set_session_name", "get_state"]);
  } finally { await f.close(); }
});
