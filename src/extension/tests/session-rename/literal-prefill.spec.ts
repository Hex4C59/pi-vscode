import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { tick } from "../harness.js";
import { renameFixture } from "./rename.test-support.js";

test("accepting the unchanged literal upstream prefill is a no-op even with surrounding whitespace", async () => {
  const original = "  Original name  "; const f = await renameFixture(original);
  try {
    let prompts = 0;
    f.h.api.window.showInputBox = async options => { prompts++; assert.equal(options?.value, original); return original; };
    f.v.action("renameSession"); await tick();
    assert.equal(prompts, 1);
    assert.equal(f.commands.filter(value => value.type === "set_session_name").length, 0);
    assert.equal(f.state.sessionName, original);
    mkdirSync("dist/wi080", { recursive: true });
    writeFileSync("dist/wi080/literal-prefill.json", JSON.stringify({ status: "passed", nativePrefillLiteral: true, unchangedNoMutation: true }, null, 2));
  } finally { await f.close(); }
});
