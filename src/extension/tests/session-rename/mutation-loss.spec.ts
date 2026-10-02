import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { tick } from "../harness.js";
import { renameFixture } from "./rename.test-support.js";

test("transport loss after the public rename write reports unknown name outcome without replay", async () => {
  const f = await renameFixture();
  try {
    f.h.api.window.showInputBox = async () => "Possibly changed"; f.hold("set_session_name");
    f.v.action("renameSession"); await tick();
    assert.equal(f.commands.filter(value => value.type === "set_session_name").length, 1);
    f.connection.lose(); await tick(); await tick();
    const state = f.v.state(); assert.equal(state.runtime, "error");
    assert.match(state.runtimeDetail ?? "", /name.*(?:may|unknown|unverified)|pi may already have changed/i,
      "after the recorded mutation write the visible error must explain name uncertainty");
    assert.match(state.runtimeDetail ?? "", /recovery/i);
    assert.equal(f.commands.filter(value => value.type === "set_session_name").length, 1);
    assert.deepEqual(f.memory.releases, ["uncertain"]);
    mkdirSync("dist/wi080", { recursive: true });
    writeFileSync("dist/wi080/mutation-loss.json", JSON.stringify({ status: "passed", mutationAttempts: 1, upstreamOutcome: "unknown",
      visibleError: state.runtimeDetail, explicitRecovery: true, replay: false }, null, 2));
  } finally { await f.close(); }
});
