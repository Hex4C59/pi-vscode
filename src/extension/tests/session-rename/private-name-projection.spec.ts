import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { parseHostMessage } from "../../../webview/client/parse-host-message.js";
import { tick } from "../harness.js";
import { renameFixture } from "./rename.test-support.js";

test("raw upstream credentials beyond 160 units never reach current title or native prefill while 200-unit rename verifies literally", async () => {
  const original = "N".repeat(165) + " password=WI080_FAKE_SECRET"; const f = await renameFixture(original);
  try {
    assert.doesNotMatch(JSON.stringify(f.v.sent), /WI080_FAKE_SECRET/, "public get_state must project a safe title before postMessage");
    let prefill = "";
    f.h.api.window.showInputBox = async options => { prefill = options?.value ?? ""; return undefined; };
    f.v.action("renameSession"); await tick();
    assert.doesNotMatch(prefill, /WI080_FAKE_SECRET/); assert.match(prefill, /\[redacted\]/); assert.ok(prefill.length <= 200);
    assert.equal(f.state.sessionName, original, "safe projection must leave public raw metadata unchanged");
    const name = "名".repeat(200); f.h.api.window.showInputBox = async () => name;
    f.v.action("renameSession"); await tick(); await tick();
    const current = f.v.sent.map(parseHostMessage).filter(value => value?.type === "sessionState").at(-1)?.current;
    assert.equal(current?.name, name); assert.equal(f.state.sessionName, name);
    f.h.api.window.showInputBox = async options => { assert.equal(options?.value, name); return name; };
    f.v.action("renameSession"); await tick();
    assert.equal(f.commands.filter(value => value.type === "set_session_name").length, 1);
    mkdirSync("dist/wi080", { recursive: true });
    writeFileSync("dist/wi080/private-name-projection.json", JSON.stringify({ status: "passed", safeOldProjection: true, safeNativePrefill: true,
      publicRawMetadataUnchangedOnCancel: true, exact200Readback: true, unchanged200NoMutation: true }, null, 2));
  } finally { await f.close(); }
});
