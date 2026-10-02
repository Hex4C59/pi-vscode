import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { parseHostMessage } from "../../../webview/client/parse-host-message.js";
import { tick } from "../harness.js";
import { renameFixture } from "./rename.test-support.js";

function status(f: Awaited<ReturnType<typeof renameFixture>>) {
  const messages = f.v.sent.map(parseHostMessage);
  return messages.filter(value => value?.type === "sessionRenameState").at(-1)?.status;
}
function report(name: string, value: object) {
  mkdirSync("dist/wi080", { recursive: true }); writeFileSync(`dist/wi080/${name}.json`, JSON.stringify(value, null, 2));
}
function deferred<T>() {
  let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve };
}

for (const input of [undefined, "Original name", "  ", "bad\nname", "x".repeat(201), "password=synthetic"])
  test(`native rename preserves title for ${input === undefined ? "cancel" : input === "Original name" ? "unchanged" : "invalid " + JSON.stringify(input.slice(0, 12))}`, async () => {
    const f = await renameFixture();
    try {
      let prompts = 0; f.h.api.window.showInputBox = async () => { prompts++; return input; };
      f.v.action("renameSession"); await tick();
      assert.equal(prompts, 1, "the native interaction must actually occur");
      assert.equal(f.state.sessionName, "Original name");
      assert.equal(f.commands.some(value => value.type === "set_session_name"), false);
      assert.equal(status(f), "ready");
    } finally { await f.close(); }
  });

test("pending native rename admits one prompt and fences duplicate sends and session replacement", async () => {
  const f = await renameFixture(); const answer = deferred<string | undefined>();
  try {
    let prompts = 0; f.h.api.window.showInputBox = async () => { prompts++; return answer.promise; };
    f.v.action("renameSession"); await tick();
    assert.equal(status(f), "renaming");
    f.v.action("renameSession"); f.v.action("newConversation"); f.v.action("sendChat", { text: "Do not send" }); await tick();
    assert.equal(prompts, 1); assert.equal(f.memory.launches.length, 1);
    assert.equal(f.commands.some(value => value.type === "prompt"), false);
    answer.resolve(undefined); await tick(); assert.equal(status(f), "ready");
    report("single-flight", { status: "passed", prompts, launches: f.memory.launches.length, promptSent: false });
  } finally { answer.resolve(undefined); await f.close(); }
});

test("view replacement cancels pending native rename before any public mutation", async () => {
  const f = await renameFixture(); const answer = deferred<string | undefined>();
  try {
    f.h.api.window.showInputBox = async () => answer.promise;
    f.v.action("renameSession"); await tick(); assert.equal(status(f), "renaming");
    const replacement = f.h.createView(); replacement.state(); answer.resolve("Must not apply"); await tick();
    assert.equal(f.state.sessionName, "Original name");
    assert.equal(f.commands.some(value => value.type === "set_session_name"), false);
    report("view-cancel", { status: "passed", mutation: false, replacementGeneration: replacement.state().generation });
  } finally { answer.resolve(undefined); await f.close(); }
});

test("busy task cannot offer or admit a rename prompt", async () => {
  const f = await renameFixture();
  try {
    f.v.action("sendChat", { text: "Start a task before attempting rename" }); await tick();
    assert.equal(f.v.state().chatBusy, true);
    let prompts = 0; f.h.api.window.showInputBox = async () => { prompts++; return "Wrong"; };
    f.v.action("renameSession"); await tick(); assert.equal(status(f), "unavailable"); assert.equal(prompts, 0);
    assert.equal(f.commands.some(value => value.type === "set_session_name"), false);
  } finally { await f.close(); }
});

test("public rename refuses wrong opened identity before mutation and preserves its visible name", async () => {
  const f = await renameFixture();
  try {
    f.state.sessionId = "foreign-session";
    f.h.api.window.showInputBox = async () => "Do not rename foreign";
    f.v.action("renameSession"); await tick();
    assert.equal(status(f), "unavailable");
    assert.equal(f.commands.some(value => value.type === "set_session_name"), false);
    assert.equal(f.state.sessionName, "Original name");
  } finally { await f.close(); }
});

test("RPC refusal and unverified readback preserve title and never replay mutation", async () => {
  for (const failure of ["rejected", "wrong-name", "wrong-identity"] as const) {
    const f = await renameFixture();
    try {
      let mutated = false;
      f.override(type => {
        if (type === "set_session_name") { mutated = true; return failure === "rejected" ? { success: false, error: "PRIVATE_DIAGNOSTIC" } : undefined; }
        if (type === "get_state" && mutated) return { data: { ...f.state, ...(failure === "wrong-name" ? { sessionName: "Unexpected" } : { sessionId: "foreign" }) } };
      });
      f.h.api.window.showInputBox = async () => "Requested";
      f.v.action("renameSession"); await tick();
      const messages = f.v.sent.map(parseHostMessage);
      const current = messages.filter(value => value?.type === "sessionState").at(-1);
      assert.equal(current?.current?.name, "Original name");
      assert.equal(f.commands.filter(value => value.type === "set_session_name").length, 1);
      assert.doesNotMatch(JSON.stringify(f.v.sent), /PRIVATE_DIAGNOSTIC/);
      report(`failure-${failure}`, { status: "passed", visibleName: current?.current?.name, mutations: 1, uncertain: failure !== "rejected" });
    } finally { await f.close(); }
  }
});

test("replacement during committed rename rejects late ACK and title publication", async () => {
  const f = await renameFixture();
  try {
    f.h.api.window.showInputBox = async () => "Late name"; f.hold("set_session_name");
    f.v.action("renameSession"); await tick(); assert.equal(status(f), "renaming");
    const request = f.commands.find(value => value.type === "set_session_name"); assert.ok(request);
    const replacement = f.h.createView(); replacement.state();
    f.connection.frame({ type: "response", id: request.id, command: "set_session_name", success: true }); await tick();
    const current = replacement.sent.map(parseHostMessage).filter(value => value?.type === "sessionState").at(-1);
    assert.equal(current?.current?.name, "Original name");
    report("late-replacement", { status: "passed", replacementName: current?.current?.name, mutations: 1 });
  } finally { await f.close(); }
});
