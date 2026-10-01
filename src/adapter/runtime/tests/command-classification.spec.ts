import assert from "node:assert/strict";
import { test } from "node:test";
import { dispatchedExtensionCommand, extensionCommandNames, presentCommandCatalogue } from "../command-classification.js";

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

test("command catalogue projection strips paths, keeps sources, and does not invent TUI commands", () => {
  const presented = presentCommandCatalogue({
    commands: [
      { name: "sysprompt", description: "Session prompt", source: "extension", path: "/home/user/.pi/agent/extensions/session.ts" },
      { name: "fix-tests", description: "Fix failing tests", source: "prompt", location: "project", path: "/home/user/myproject/.pi/agent/prompts/fix-tests.md" },
      { name: "skill:brave-search", description: "Web search via Brave API", source: "skill", location: "user", path: "/home/user/.pi/agent/skills/brave-search/SKILL.md" },
    ],
  });
  assert.deepEqual(presented, {
    status: "ready",
    rows: [
      { name: "sysprompt", description: "Session prompt", source: "extension" },
      { name: "fix-tests", description: "Fix failing tests", source: "prompt", location: "project" },
      { name: "skill:brave-search", description: "Web search via Brave API", source: "skill", location: "user" },
    ],
  });
  assert.equal(JSON.stringify(presented).includes("path"), false);
  assert.equal(JSON.stringify(presented).includes("/home/"), false);
  assert.equal(JSON.stringify(presented).includes("settings"), false);
  assert.equal(JSON.stringify(presented).includes("hotkeys"), false);
});

test("command catalogue empty, malformed and oversized snapshots are unavailable or empty, never guessed", () => {
  assert.deepEqual(presentCommandCatalogue({ commands: [] }), { status: "empty" });
  assert.deepEqual(presentCommandCatalogue({ commands: [{ name: "x", source: "extension" }, { name: "x", source: "extension" }] }), { status: "unavailable" });
  assert.deepEqual(presentCommandCatalogue({ commands: [{ name: "/settings", source: "extension" }] }), { status: "unavailable" });
  assert.deepEqual(presentCommandCatalogue(undefined), { status: "unavailable" });
  assert.deepEqual(presentCommandCatalogue({ commands: Array.from({ length: 513 }, (_, index) => ({ name: `c${index}`, source: "prompt" })) }), { status: "unavailable" });
});
