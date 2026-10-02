import assert from "node:assert/strict";
import test from "node:test";
import type * as vscode from "vscode";
import { mkdir, writeFile } from "node:fs/promises";
import { harness, readySettings } from "./harness.js";

// Failure modes before implementation: discovery claimed as body loading; missing evidence
// claimed as zero; old identity; report starts/sends; unbounded names; open failure; disposal.
function report(h: ReturnType<typeof harness>): string {
  const provider = h.contentProviders.get("pi-vscode-resources");
  assert.ok(provider);
  const uri = h.api.Uri.parse("pi-vscode-resources:/resource-loading.txt");
  const value = provider.provideTextDocumentContent(uri as unknown as vscode.Uri, {} as vscode.CancellationToken);
  assert.equal(typeof value, "string");
  return String(value);
}

test("resource report follows current runtime evidence without sending or loading resources", async () => {
  const { r, h, v } = await readySettings();
  r.runtime.getCommandCatalogue = () => ({ status: "ready", rows: [
    { name: "fixture-template", source: "prompt" },
    { name: "skill:fixture-skill", source: "skill" },
    { name: "fixture-extension", source: "extension" },
  ] });
  try {
    await h.provider.showResourceReport();
    const first = report(h);
    assert.match(first, /AGENTS\.md: unknown/);
    assert.match(first, /Prompt template definitions: 1 loaded/);
    assert.match(first, /Skill definitions: 1 loaded/);
    assert.match(first, /Skill bodies in context: unknown/);
    assert.match(first, /Extension commands: 1 registered/);
    assert.match(first, /Extension files loaded: unknown/);
    assert.match(first, /not proof of runtime loading/);
    assert.match(first, /fixture-template/);
    assert.doesNotMatch(first, /\/project|sourceInfo/);
    assert.equal(h.shown.length, 1);
    assert.equal(r.calls.includes("prompt"), false);
    r.runtime.getSession = () => 999;
    v.send("getWorkspaceState");
    assert.match(report(h), /unavailable/);
    assert.doesNotMatch(report(h), /fixture-template|1 loaded/);
    await mkdir("dist/goal-eight/wi082", { recursive: true });
    await writeFile("dist/goal-eight/wi082/host-report.json", JSON.stringify({
      evidence: "host composition with substituted VS Code and runtime seams", first,
      stale: report(h), sent: false, limitations: ["not actual pi, F5 or installed VSIX"],
    }, null, 2));
  } finally { h.provider.dispose(); }
});

test("resource report distinguishes empty, unavailable and no runtime and follows language", async () => {
  const { r, h, v } = await readySettings();
  try {
    r.runtime.getCommandCatalogue = () => ({ status: "empty" });
    await h.provider.showResourceReport();
    assert.match(report(h), /Prompt template definitions: 0 loaded/);
    assert.match(report(h), /Extension files loaded: unknown/);
    r.runtime.getCommandCatalogue = () => ({ status: "unavailable" });
    assert.match(report(h), /unavailable/);
    assert.doesNotMatch(report(h), /0 loaded/);
    v.action("setUiLanguage", { locale: "zh-CN" });
    assert.match(report(h), /AGENTS\.md：未知/);
    assert.match(report(h), /不可用/);
  } finally { h.provider.dispose(); }
  const idle = harness();
  try {
    await idle.provider.showResourceReport();
    assert.match(report(idle), /unavailable/);
    assert.doesNotMatch(report(idle), /0 loaded/);
  } finally { idle.provider.dispose(); }
});

test("resource report bounds displayed names and recovers native open failure", async () => {
  const { r, h } = await readySettings();
  r.runtime.getCommandCatalogue = () => ({ status: "ready", rows: Array.from({ length: 150 }, (_, i) => ({ name: `template-${i}`, source: "prompt" })) });
  let attempts = 0;
  h.api.window.showTextDocument = async () => { if (++attempts === 1) throw new Error("native failed"); };
  const notices: string[] = [];
  h.api.window.showWarningMessage = async message => { notices.push(message); return undefined; };
  try {
    await h.provider.showResourceReport();
    assert.equal(notices.length, 1);
    await h.provider.showResourceReport();
    assert.equal(attempts, 2);
    assert.match(report(h), /150 loaded/);
    assert.match(report(h), /50 names omitted/);
    assert.doesNotMatch(report(h), /template-149/);
  } finally { h.provider.dispose(); }
  assert.equal(h.contentProviders.has("pi-vscode-resources"), false);
  await h.provider.showResourceReport();
  assert.equal(attempts, 2);
});
