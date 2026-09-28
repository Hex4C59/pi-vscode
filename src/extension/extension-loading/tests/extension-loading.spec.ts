import assert from "node:assert/strict";
import { test } from "node:test";
import { selectTrustedExtension } from "../index.js";

test("cancelling explicit extension selection does not ask for execution consent", async () => {
  let confirmations = 0;
  const result = await selectTrustedExtension({
    async pick() { return undefined; },
    async confirm() { confirmations += 1; return true; },
  }, () => true);
  assert.deepEqual(result, { kind: "cancelled" });
  assert.equal(confirmations, 0);
});

test("a local regular entry needs explicit canonical-path consent and stale consent cannot authorize loading", async t => {
  const { mkdir, mkdtemp, writeFile, rm, realpath } = await import("node:fs/promises");
  const path = await import("node:path");
  const root = path.resolve("dist/tests-fixtures/extension-loading");
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, "entry-"));
  t.after(async () => { assert.equal(path.dirname(directory), root); await rm(directory, { recursive: true, force: true }); });
  const entry = path.join(directory, "entry.mjs");
  await writeFile(entry, "export default function() {}", "utf8");
  let valid = true;
  let shown = "";
  const ui = { async pick() { return entry; }, async confirm(value: string) { shown = value; return true; } };
  assert.deepEqual(await selectTrustedExtension(ui, () => valid), { kind: "selected", entryPath: await realpath(entry), displayName: "entry.mjs" });
  assert.equal(shown, await realpath(entry));
  assert.deepEqual(await selectTrustedExtension({ ...ui, async confirm() { valid = false; return true; } }, () => valid), { kind: "stale" });
});

test("Unicode extension labels fit the UTF-8 projection budget without changing canonical consent", async t => {
  const { mkdir, mkdtemp, writeFile, rm, realpath } = await import("node:fs/promises");
  const path = await import("node:path");
  const root = path.resolve("dist/tests-fixtures/extension-loading");
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, "unicode-"));
  t.after(async () => { assert.equal(path.dirname(directory), root); await rm(directory, { recursive: true, force: true }); });
  // Windows filenames count UTF-16 units; Unix commonly limits bytes per component.
  // Exercise the >512-byte valid filename on Windows without creating an invalid Unix fixture.
  const basename = "界".repeat(process.platform === "win32" ? 200 : 80) + ".ts";
  const entry = path.join(directory, basename);
  await writeFile(entry, "export default function() {}", "utf8");
  let confirmed = "";
  const result = await selectTrustedExtension({ async pick() { return entry; }, async confirm(value) { confirmed = value; return true; } }, () => true);
  assert.equal(result.kind, "selected");
  if (result.kind === "selected") {
    assert.equal(result.entryPath, await realpath(entry));
    assert.equal(confirmed, result.entryPath);
    assert.ok(Buffer.byteLength(result.displayName, "utf8") <= 512);
    assert.equal(result.displayName, process.platform === "win32" ? "界".repeat(169) + "…" : basename);
    assert.equal(result.displayName.includes("\uFFFD"), false);
  }
});
