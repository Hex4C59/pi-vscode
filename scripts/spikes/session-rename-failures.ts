import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { parseHostMessage } from "../../src/webview/client/parse-host-message.js";
import { renameFixture } from "../../src/extension/tests/session-rename/rename.test-support.js";
import { tick } from "../../src/extension/tests/harness.js";

function save(name: string, evidence: object): void {
  mkdirSync("dist/wi080", { recursive: true }); writeFileSync(`dist/wi080/${name}.json`, JSON.stringify(evidence, null, 2));
}
async function catalogueFailure(): Promise<void> {
  const f = await renameFixture();
  try {
    f.v.action("getSavedSessions", { page: 0 }); await tick(); f.failCatalogue();
    f.h.api.window.showInputBox = async () => "Verified despite catalogue failure";
    f.v.action("renameSession"); await tick(); await tick();
    const projection = f.v.sent.map(parseHostMessage).filter(value => value?.type === "sessionState").at(-1); assert.ok(projection);
    assert.equal(projection.current?.name, "Verified despite catalogue failure"); assert.equal(projection.error, "unavailable");
    assert.equal(projection.entries[0].title, "Original name"); assert.equal(projection.entries[0].excerpt, "Historical literal body");
    save("catalogue-failure", { status: "passed", current: projection.current, catalogueError: projection.error, oldRowRetained: true, fabricatedRow: false });
  } finally { await f.close(); }
}
async function uncertainDeadline(): Promise<void> {
  const f = await renameFixture();
  try {
    f.h.api.window.showInputBox = async () => "Outcome unknown"; f.hold("set_session_name");
    const began = performance.now(); f.v.action("renameSession"); await tick();
    await new Promise(resolve => setTimeout(resolve, 5500));
    const request = f.commands.find(value => value.type === "set_session_name"); assert.ok(request);
    const current = f.v.sent.map(parseHostMessage).filter(value => value?.type === "sessionState").at(-1)?.current;
    assert.equal(current?.name, "Original name"); assert.equal(f.v.state().runtime, "error");
    assert.deepEqual(f.memory.releases, ["uncertain"]); assert.equal(f.commands.filter(value => value.type === "set_session_name").length, 1);
    f.connection.frame({ type: "response", id: request.id, command: "set_session_name", success: true }); await tick();
    assert.equal(f.v.state().runtime, "error");
    save("deadline", { status: "passed", deadlineMs: 5000, observedAfterMs: performance.now() - began, oldVisibleName: current?.name,
      mutationAttempts: 1, upstreamOutcome: "unknown", explicitRecovery: true, release: f.memory.releases, lateAckIgnored: true });
  } finally { await f.close(); }
}
void (async () => { await catalogueFailure(); await uncertainDeadline(); console.log("Passed catalogue failure and uncertain rename deadline probes"); })()
  .catch(error => { console.error(error); process.exitCode = 1; });
