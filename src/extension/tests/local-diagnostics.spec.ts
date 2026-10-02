import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import type * as vscode from "vscode";
import { LocalDiagnostics } from "../diagnostics/index.js";
import { hostFixture, readySettings } from "./harness.js";

// Before implementation: unknown versions, accidental sensitive fields, stale preview,
// cancel/dispose, overlap, nonlocal/overwrite/partial files, failures and runtime side effects.
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "pi-diagnostic-fixture-"));
  const runtime = path.join(root, "node_modules/@earendil-works/pi-coding-agent");
  await mkdir(runtime, { recursive: true });
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "pi-vscode", version: "0.0.1", privateCredential: "sk-sensitive-fixture" }));
  await writeFile(path.join(runtime, "package.json"), JSON.stringify({ name: "@earendil-works/pi-coding-agent", version: "0.86.1" }));
  const h = hostFixture(); const notices: string[] = []; let consent: string | undefined = "Export reviewed snapshot";
  let destination: vscode.Uri | undefined = h.api.Uri.file(path.join(root, "export.json")) as unknown as vscode.Uri;
  let saves = 0; let preview = ""; let review = async () => consent;
  const window = { ...h.api.window,
    showTextDocument: async (uri: vscode.Uri) => { preview = String(h.contentProviders.get(uri.scheme)?.provideTextDocumentContent(uri, {} as vscode.CancellationToken)); },
    showInformationMessage: async (message: string) => { notices.push(message); return message.includes("Review") || message.includes("审查") ? review() : undefined; },
    showWarningMessage: async (message: string) => { notices.push(message); return undefined; },
    showSaveDialog: async () => { saves++; return destination; },
  };
  let state = { locale: "en" as "en" | "zh-CN", workspace: "eligible", runtime: "ready", chatBusy: false, modelBusy: false, sessionBusy: false, controlled: true, hostError: false, runtimeError: false,
    secret: "sk-sensitive-fixture", error: "/private/user/source.ts", messages: ["full-session-sentinel"] };
  const owner = new LocalDiagnostics({ ...h.api, window } as unknown as ConstructorParameters<typeof LocalDiagnostics>[0], root, "1.105.0", () => state);
  return { root, h, owner, notices, get preview() { return preview; }, get saves() { return saves; }, setConsent(value: string | undefined) { consent = value; },
    setDestination(value: vscode.Uri | undefined) { destination = value; }, setReview(value: typeof review) { review = value; }, changeState() { state = { ...state, chatBusy: true }; },
    async close() { owner.dispose(); await rm(root, { recursive: true, force: true }); } };
}

test("production diagnostic flow exports the exact reviewed allowlist using installed manifests, no sensitive extras", async () => {
  const f = await fixture();
  try {
    f.setReview(async () => { f.changeState(); return "Export reviewed snapshot"; }); await f.owner.open();
    const bytes = await readFile(path.join(f.root, "export.json"), "utf8"); assert.equal(bytes, f.preview);
    const report = JSON.parse(bytes); assert.equal(report.versions.extension, "0.0.1"); assert.equal(report.versions.piRuntime, "0.86.1");
    assert.equal(report.versions.vscode, "1.105.0"); assert.equal(report.state.chatBusy, false);
    assert.doesNotMatch(bytes, /sk-sensitive|source\.ts|full-session|\/private|messages|secret|endpoint/); assert.ok(Buffer.byteLength(bytes) <= 4096);
    assert.equal(f.saves, 1); assert.deepEqual((await readdir(f.root)).filter(name => name.startsWith(".pi-diagnostic-")), []);
    await mkdir("dist/goal-eight/wi088", { recursive: true }); await writeFile("dist/goal-eight/wi088/host-export.json", bytes);
  } finally { await f.close(); }
});

test("review cancellation, destination cancellation and disposal never publish diagnostic bytes", async () => {
  for (const mode of ["review", "save", "dispose"]) {
    const f = await fixture();
    try {
      if (mode === "review") f.setConsent(undefined);
      if (mode === "save") f.setDestination(undefined);
      if (mode === "dispose") f.setReview(async () => { f.owner.dispose(); return "Export reviewed snapshot"; });
      await f.owner.open(); await assert.rejects(readFile(path.join(f.root, "export.json")), /ENOENT/);
      assert.equal(f.saves, mode === "save" ? 1 : 0);
    } finally { await f.close(); }
  }
});

test("overlapping review cannot replace frozen snapshot or create another destination dialog", async () => {
  const f = await fixture(); let release!: (value: string | undefined) => void;
  f.setReview(() => new Promise(resolve => { release = resolve; }));
  try {
    const first = f.owner.open(); while (!release) await new Promise(resolve => setImmediate(resolve));
    const preview = f.preview; f.changeState(); await f.owner.open(); assert.equal(f.preview, preview); assert.equal(f.saves, 0);
    release("Export reviewed snapshot"); await first; assert.equal(f.saves, 1);
  } finally { await f.close(); }
});

test("nonlocal and existing/symlink destinations refuse overwrite, clean temporary data, and recover", async () => {
  const f = await fixture();
  try {
    f.setDestination({ scheme: "https", fsPath: path.join(f.root, "remote") } as vscode.Uri); await f.owner.open();
    await writeFile(path.join(f.root, "existing.json"), "retained");
    await symlink(path.join(f.root, "existing.json"), path.join(f.root, "link.json"));
    for (const name of ["existing.json", "link.json", "absent-parent/export.json"]) {
      f.setDestination(f.h.api.Uri.file(path.join(f.root, name)) as unknown as vscode.Uri); await f.owner.open();
    }
    assert.equal(await readFile(path.join(f.root, "existing.json"), "utf8"), "retained");
    assert.deepEqual((await readdir(f.root)).filter(name => name.startsWith(".pi-diagnostic-")), []);
    assert.doesNotMatch(f.notices.join("\n"), new RegExp(f.root));
    f.setDestination(f.h.api.Uri.file(path.join(f.root, "recovered.json")) as unknown as vscode.Uri); await f.owner.open();
    assert.equal(await readFile(path.join(f.root, "recovered.json"), "utf8"), f.preview);
  } finally { await f.close(); }
});

test("missing/invalid manifests are unknown; native preview failure is fixed and retryable", async () => {
  const f = await fixture();
  try {
    await writeFile(path.join(f.root, "package.json"), JSON.stringify({ version: "credential-must-not-export" }));
    await rm(path.join(f.root, "node_modules/@earendil-works/pi-coding-agent/package.json"));
    await f.owner.open(); const report = JSON.parse(f.preview); assert.equal(report.versions.extension, null); assert.equal(report.versions.piRuntime, null);
    assert.doesNotMatch(f.preview, /credential-must/);
    f.owner.dispose();
    let attempts = 0; const owner = new LocalDiagnostics({ ...f.h.api, window: { ...f.h.api.window, showTextDocument: async () => { if (++attempts === 1) throw Error("secret-native-error"); } } } as unknown as ConstructorParameters<typeof LocalDiagnostics>[0], f.root, undefined, () => ({ locale: "zh-CN" }));
    try { await owner.open(); await owner.open(); assert.equal(attempts, 2); } finally { owner.dispose(); }
  } finally { await f.close(); }
});

test("provider diagnostic command does not start, prompt or stop runtime and registers a read-only snapshot", async () => {
  const { r, h } = await readySettings(); const before = [...r.calls];
  try { await h.provider.exportLocalDiagnostics(); assert.deepEqual(r.calls, before); assert.ok(h.contentProviders.has("pi-vscode-diagnostics")); }
  finally { h.provider.dispose(); }
  assert.equal(h.contentProviders.has("pi-vscode-diagnostics"), false);
});
