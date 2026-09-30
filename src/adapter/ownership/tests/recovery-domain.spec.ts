import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  allocateWindowId,
  createRecoveryStore,
  handoffForeignRecoveryDomains,
  recoveryRoot,
  siblingWindowDirectories,
  windowRecoveryDirectory,
  withForeignHandoff,
} from "../index.js";

const root = path.resolve("dist/tests-fixtures/runtime-ownership");

async function fixture(t: { after(callback: () => Promise<void>): void }): Promise<string> {
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, "window-"));
  t.after(async () => {
    const relative = path.relative(root, path.resolve(directory));
    assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
    await rm(directory, { recursive: true, force: true });
  });
  return directory;
}

test("window recovery directories nest under recovery-v1/windows", () => {
  const storage = "/tmp/global-storage";
  const id = allocateWindowId();
  assert.match(id, /^[0-9a-f-]{36}$/i);
  assert.equal(recoveryRoot(storage), path.join(storage, "recovery-v1"));
  assert.equal(windowRecoveryDirectory(storage, id), path.join(storage, "recovery-v1", "windows", id));
});

test("independent window domains can both reserve", async (t) => {
  const storage = await fixture(t);
  const first = createRecoveryStore(windowRecoveryDirectory(storage, randomUUID()));
  const second = createRecoveryStore(windowRecoveryDirectory(storage, randomUUID()));
  const admitted = await Promise.all([first.reserve(), second.reserve()]);
  assert.equal(admitted.every(result => result.ok), true);
});

test("sibling listing skips the current id, junk names and files, and caps at 32", async (t) => {
  const storage = await fixture(t);
  const current = randomUUID();
  const windows = path.join(recoveryRoot(storage), "windows");
  await mkdir(windows, { recursive: true });
  const kept: string[] = [];
  for (let i = 0; i < 33; i++) {
    const id = randomUUID();
    kept.push(id);
    await mkdir(path.join(windows, id));
  }
  await mkdir(path.join(windows, current));
  await mkdir(path.join(windows, "not-a-uuid"));
  await writeFile(path.join(windows, `${randomUUID()}.json`), "{}");
  const siblings = await siblingWindowDirectories(storage, current);
  assert.equal(siblings.length, 32);
  assert.equal(siblings.some(directory => path.basename(directory) === current), false);
  assert.equal(siblings.some(directory => path.basename(directory) === "not-a-uuid"), false);
  for (const directory of siblings) {
    assert.equal(kept.includes(path.basename(directory)), true);
  }
});

test("foreign handoff visits the legacy root then sibling window dirs, not the current window", async (t) => {
  const storage = await fixture(t);
  const current = randomUUID();
  const sibling = randomUUID();
  await mkdir(windowRecoveryDirectory(storage, sibling), { recursive: true });
  await mkdir(windowRecoveryDirectory(storage, current), { recursive: true });
  const visited: string[] = [];
  await handoffForeignRecoveryDomains({
    globalStorage: storage,
    currentWindowId: current,
    workerPath: path.join(storage, "unused-worker.mjs"),
    createOwner: directory => ({
      async handoff() {
        visited.push(directory);
        return { ok: true, outcome: "none" };
      },
    }),
  });
  assert.deepEqual(visited, [recoveryRoot(storage), windowRecoveryDirectory(storage, sibling)]);
});

test("foreign handoff failure does not prevent this window's later handoff", async () => {
  let local = 0;
  const process = withForeignHandoff({
    async handoff() {
      local += 1;
      return { ok: true, outcome: "none" as const };
    },
  }, async () => { throw new Error("foreign failed"); });
  assert.deepEqual(await process.handoff(), { ok: true, outcome: "none" });
  assert.equal(local, 1);
});
