import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import type * as vscode from "vscode";
import { VersionInformation } from "../version-information/index.js";
import { hostFixture, readySettings } from "./harness.js";

// Before code: wrong installed version/notes, implicit network/update, unknown/missing,
// incomplete/huge/duplicate notes, literal plain text, overlap/dispose and native failures.
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "pi-version-fixture-"));
  const runtimeRoot = path.join(root, "node_modules/@earendil-works/pi-coding-agent"); await mkdir(runtimeRoot, { recursive: true });
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "pi-vscode", version: "0.0.1", dependencies: { "@earendil-works/pi-coding-agent": "9.9.9" } }));
  await writeFile(path.join(runtimeRoot, "package.json"), JSON.stringify({ name: "@earendil-works/pi-coding-agent", version: "0.86.1" }));
  await writeFile(path.join(root, "CHANGELOG.md"), "# Changelog\n## [Unreleased]\nnot-corresponding-new\n## [0.0.1] - 2026-09-19\nextension-exact\n[link](https://example.invalid/never-load)\n<img src=x>\n## [0.0.0]\nolder-excluded\n");
  await writeFile(path.join(runtimeRoot, "CHANGELOG.md"), "## [0.86.1] - 2026-09-20\nruntime-exact\n## [0.86.0]\nolder-runtime-excluded\n");
  const h = hostFixture(); const notices: string[] = []; const previews: string[] = []; let show = async (_uri: vscode.Uri) => undefined;
  const window = { ...h.api.window, showTextDocument: async (uri: vscode.Uri) => { previews.push(String(h.contentProviders.get(uri.scheme)?.provideTextDocumentContent(uri, {} as vscode.CancellationToken))); await show(uri); },
    showWarningMessage: async (message: string) => { notices.push(message); return undefined; } };
  let locale: "en" | "zh-CN" = "en";
  const owner = new VersionInformation({ ...h.api, window } as unknown as ConstructorParameters<typeof VersionInformation>[0], root, "1.105.0", () => locale);
  return { root, runtimeRoot, h, owner, notices, get previews() { return previews; }, setShow(value: typeof show) { show = value; }, chinese() { locale = "zh-CN"; },
    async close() { owner.dispose(); await rm(root, { recursive: true, force: true }); } };
}

test("production version report selects actual fixed manifests and exact notes as literal read-only text", async () => {
  const f = await fixture();
  try {
    await f.owner.open(); const text = f.previews[0]!;
    assert.match(text, /Extension: 0\.0\.1/); assert.match(text, /Bundled pi: 0\.86\.1/); assert.match(text, /VS Code: 1\.105\.0/);
    assert.match(text, /extension-exact/); assert.match(text, /runtime-exact/); assert.match(text, /<img src=x>/);
    assert.doesNotMatch(text, /9\.9\.9|not-corresponding-new|older-excluded|older-runtime-excluded/);
    assert.match(text, /not a newest-version check/i); assert.ok(Buffer.byteLength(text) <= 20 * 1024);
    await mkdir("dist/goal-eight/wi089", { recursive: true }); await writeFile("dist/goal-eight/wi089/host-report.txt", text);
    f.chinese(); await f.owner.open(); assert.match(f.previews[1]!, /插件：0\.0\.1/); assert.match(f.previews[1]!, /内置 pi：0\.86\.1/);
  } finally { await f.close(); }
});

test("unknown versions never use dependency declarations or Unreleased and missing corresponding notes are explicit", async () => {
  const f = await fixture();
  try {
    await rm(path.join(f.root, "package.json")); await writeFile(path.join(f.runtimeRoot, "package.json"), JSON.stringify({ name: "@earendil-works/pi-coding-agent", version: "0.86.2" }));
    await f.owner.open(); const text = f.previews[0]!;
    assert.match(text, /Extension: unknown/); assert.match(text, /Bundled pi: 0\.86\.2/); assert.match(text, /Corresponding notes unavailable/);
    assert.doesNotMatch(text, /extension-exact|runtime-exact|not-corresponding-new/);
  } finally { await f.close(); }
});

test("bounded note prefix rejects huge/incomplete and duplicate sections while keeping a complete current section", async () => {
  const f = await fixture();
  try {
    for (const content of ["## [0.0.1]\n" + "x".repeat(9000), "## [0.0.1]\n" + "x".repeat(70000), "## [0.0.1]\nfirst\n## [0.0.1]\nsecond\n"]) {
      await writeFile(path.join(f.root, "CHANGELOG.md"), content); await f.owner.open(); assert.match(f.previews.at(-1)!, /Corresponding notes unavailable/); assert.ok(Buffer.byteLength(f.previews.at(-1)!) <= 20 * 1024);
    }
    await writeFile(path.join(f.root, "CHANGELOG.md"), "## [0.0.1]\ncomplete-current\n## [0.0.0]\n" + "older".repeat(20000));
    await f.owner.open(); assert.match(f.previews.at(-1)!, /complete-current/); assert.doesNotMatch(f.previews.at(-1)!, /olderolder/);
    await writeFile(path.join(f.root, "CHANGELOG.md"), "x".repeat(70000) + "\n## [0.0.1]\nhidden-beyond-budget");
    await f.owner.open(); assert.match(f.previews.at(-1)!, /Corresponding notes unavailable/); assert.doesNotMatch(f.previews.at(-1)!, /hidden-beyond-budget/);
  } finally { await f.close(); }
});

test("unreadable notes and native open failure recover with fixed notices and no sensitive exception", async () => {
  const f = await fixture(); let attempts = 0;
  try {
    await rm(path.join(f.root, "CHANGELOG.md")); await mkdir(path.join(f.root, "CHANGELOG.md"));
    f.setShow(async () => { if (++attempts === 1) throw Error("/private/sensitive-error"); });
    await f.owner.open(); assert.equal(f.notices.length, 1); assert.doesNotMatch(f.notices[0]!, /sensitive-error|\/private/);
    await f.owner.open(); assert.equal(attempts, 2); assert.match(f.previews.at(-1)!, /Corresponding notes unavailable/);
  } finally { await f.close(); }
});

test("overlap is serialized and disposal suppresses later version report presentation", async () => {
  const f = await fixture(); let release!: () => void;
  try {
    f.setShow(() => new Promise<undefined>(resolve => { release = () => resolve(undefined); }));
    const first = f.owner.open(); while (!release) await new Promise(resolve => setImmediate(resolve));
    await f.owner.open(); assert.equal(f.previews.length, 1); release(); await first;
    f.owner.dispose(); await f.owner.open(); assert.equal(f.previews.length, 1);
    const closed = new VersionInformation(f.h.api as unknown as ConstructorParameters<typeof VersionInformation>[0], f.root, undefined, () => "en");
    const pending = closed.open(); closed.dispose(); await pending; assert.equal(f.h.shown.length, 0);
  } finally { await f.close(); }
});

test("provider version command has no runtime side effects and root notes are declared for packaging", async () => {
  const { r, h } = await readySettings(); const before = [...r.calls];
  try { await h.provider.showVersionInformation(); assert.deepEqual(r.calls, before); assert.ok(h.contentProviders.has("pi-vscode-version")); }
  finally { h.provider.dispose(); }
  assert.equal(h.contentProviders.has("pi-vscode-version"), false);
  const manifest = JSON.parse(await readFile("package.json", "utf8")); assert.ok(manifest.files.includes("CHANGELOG.md"));
});
