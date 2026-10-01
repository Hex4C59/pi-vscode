import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readySettings, tick } from "./harness.js";
import { parseHostMessage } from "../../webview/client/parse-host-message.js";
import { parseWebviewMessage } from "../bridge/webviewMessages.js";

// Failure modes: inventory invented as executable; path crosses bridge; completion sends;
// arguments or newer edits overwritten; unknown/stale command mutates draft; settings admits chat intent.
test("host catalogue to acknowledged draft completion preserves arguments and never submits", async () => {
  const { r, h, v } = await readySettings();
  r.runtime.getCommandCatalogue = () => ({ status: "ready", rows: [
    { name: "fix-tests", source: "prompt", location: "project", description: "Fix tests" },
    { name: "skill:review", source: "skill", location: "user" },
  ] });
  try {
    v.state();
    const catalogue = [...v.sent].reverse().find(value => (value as { type: string }).type === "commandCatalogueState");
    assert.ok(parseHostMessage(catalogue), "browser must accept paired catalogue DTO");
    const d = v.attachments().draft;
    v.action("updateDraft", { draftRevision: d.revision, editSequence: 1, text: "/fi retain these arguments" });
    v.action("completeCommand", { draftRevision: v.attachments().draft.revision, name: "fix-tests" });
    await tick();
    assert.equal(v.attachments().draft.text, "/fix-tests retain these arguments");
    const revision = v.attachments().draft.revision;
    v.action("completeCommand", { draftRevision: revision, name: "fix-tests" });
    assert.equal(v.attachments().draft.revision, revision, "same completion is idempotent");
    assert.equal(r.calls.includes("prompt"), false);
    const output = path.resolve("dist/wi078-command-catalogue");
    await mkdir(output, { recursive: true });
    await writeFile(path.join(output, "host-completion.json"), JSON.stringify({ schemaVersion: 1,
      status: "passed", evidence: "provider-validator-draft-browser-parser-composition",
      catalogue, completion: { text: v.attachments().draft.text, sent: false },
      limits: ["VS Code and runtime seams", "not browser layout, F5 or installed VSIX"] }, null, 2) + "\n");
  } finally { h.provider.dispose(); }
});

test("host rejects unknown command, stale draft or generation and leaves unsent text intact", async () => {
  const { r, h, v } = await readySettings();
  r.runtime.getCommandCatalogue = () => ({ status: "ready", rows: [{ name: "skill:review", source: "skill" }] });
  try {
    const d = v.attachments().draft;
    v.action("updateDraft", { draftRevision: d.revision, editSequence: 1, text: "/sk" });
    const acknowledged = v.attachments().draft.revision;
    v.action("completeCommand", { draftRevision: acknowledged, name: "settings" });
    assert.equal(v.attachments().draft.text, "/sk");
    v.action("updateDraft", { draftRevision: acknowledged, editSequence: 2, text: "newer unsent" });
    v.action("completeCommand", { draftRevision: acknowledged, name: "skill:review" });
    assert.equal(v.attachments().draft.text, "newer unsent");
    const state = v.state();
    v.send("completeCommand", { generation: state.generation - 1, viewId: state.viewId,
      draftRevision: v.attachments().draft.revision, name: "skill:review" });
    assert.equal(v.attachments().draft.text, "newer unsent");
    assert.equal(r.calls.includes("prompt"), false);
  } finally { h.provider.dispose(); }
});

test("discovery intents and DTOs reject extra path fields, unsafe names and inconsistent rows", () => {
  const envelope = { version: 3, generation: 1, viewId: "view" };
  const intent = { ...envelope, type: "completeCommand", draftRevision: 0, name: "skill:review" };
  assert.ok(parseWebviewMessage(intent));
  for (const name of ["", "has space", "slash/name", "x".repeat(201)]) {
    assert.equal(parseWebviewMessage({ ...intent, name }), undefined);
  }
  assert.equal(parseWebviewMessage({ ...intent, path: "/private/command.md" }), undefined);
  const catalogue = { ...envelope, type: "commandCatalogueState", revision: 1,
    status: "ready", error: null, rows: [{ name: "review", source: "prompt" }] };
  assert.ok(parseHostMessage(catalogue));
  assert.equal(parseHostMessage({ ...catalogue, rows: [{ ...catalogue.rows[0], path: "/private/prompt.md" }] }), undefined);
  assert.equal(parseHostMessage({ ...catalogue, status: "empty" }), undefined);
  assert.equal(parseHostMessage({ ...catalogue, rows: [...catalogue.rows, ...catalogue.rows] }), undefined);
});
