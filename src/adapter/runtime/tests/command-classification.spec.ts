import assert from "node:assert/strict";
import { test } from "node:test";
import { extensionCommandNames, dispatchedExtensionCommand } from "../command-classification.js";

test("handler leases are limited to exact current-catalogue extension commands, not templates or arbitrary slash text", () => {
  const names = extensionCommandNames({ commands: [
    { name: "sysprompt", source: "extension" }, { name: "template", source: "prompt" }, { name: "skill:test", source: "skill" },
  ] });
  assert.ok(names);
  assert.equal(dispatchedExtensionCommand({ kind: "plain", body: "  /sysprompt add sample  " }, names), "sysprompt");
  for (const body of ["/unknown", "/template", "/skill:test", "/sysprompt\tadd", "text /sysprompt", "/sysprompt\nadd"]) {
    assert.equal(dispatchedExtensionCommand({ kind: "plain", body }, names), undefined);
  }
  assert.equal(dispatchedExtensionCommand({ kind: "enriched", body: "/sysprompt", attachments: [] }, names), undefined);
  assert.equal(extensionCommandNames({ commands: [{ name: "x", source: "extension" }, { name: "x", source: "extension" }] }), undefined);
});
