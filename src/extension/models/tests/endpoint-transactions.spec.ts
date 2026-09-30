import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { addOpenAiEndpoint, removeOpenAiEndpoint } from "../customEndpoints.js";
import type { EndpointFileSystem } from "../endpointFileTransaction.js";
import { startEndpointWorker, workerResult } from "./endpoint-process.test-support.js";

for (const [first, second] of [["add", "add"], ["add", "remove"], ["remove", "remove"]] as const) {
  test(`independent processes serialize ${first}/${second} with explicit contention and retry`, { timeout: 12000 }, async t => {
    const file = await fixture(t, { first: {}, second: {}, kept: {} });
    const firstId = first === "add" ? "new-first" : "first";
    const secondId = second === "add" ? "new-second" : "second";
    const owner = await startEndpointWorker(t, file, first, firstId, true);
    await owner.wait("held");
    try {
      const competitor = await startEndpointWorker(t, file, second, secondId);
      assert.deepEqual(await workerResult(competitor), refused("occupied"));
      assert.deepEqual(await providerIds(file), ["first", "kept", "second"]);
    } finally { owner.child.send({ type: "resume" }); }
    assert.deepEqual(await workerResult(owner), { kind: "committed" });
    const retried = await startEndpointWorker(t, file, second, secondId);
    assert.deepEqual(await workerResult(retried), { kind: "committed" });
    const ids = await providerIds(file);
    assert.equal(ids.includes(firstId), first === "add");
    assert.equal(ids.includes(secondId), second === "add");
    assert.ok(ids.includes("kept"));
    await assertClean(file);
  });
}

test("an observed writer crash leaves a lock and cannot authorize automatic takeover", { timeout: 8000 }, async t => {
  const file = await fixture(t, { kept: {} });
  const original = await fs.readFile(file);
  const owner = await startEndpointWorker(t, file, "add", "first", true);
  await owner.wait("held");
  owner.child.kill("SIGKILL");
  const [code, signal] = await owner.close;
  assert.equal(code, null);
  assert.equal(signal, "SIGKILL");
  const marker = await fs.readFile(path.join(lockPath(file), "owner.json"));
  const next = await startEndpointWorker(t, file, "add", "second");
  assert.deepEqual(await workerResult(next), refused("occupied"));
  assert.deepEqual(await fs.readFile(path.join(lockPath(file), "owner.json")), marker);
  assert.deepEqual(await fs.readFile(file), original);
});

const draft = (providerId: string) => ({
  providerId, displayName: providerId, baseUrl: "http://127.0.0.1:8000/v1", modelId: "fixture-model",
});
const refused = (reason: string, cleanupFailed = false) => ({ kind: "not-committed", reason, cleanupFailed });
const lockPath = (file: string) => path.join(path.dirname(file), ".models.json.pi-vscode.lock");

async function fixture(t: TestContext, providers: Record<string, unknown> = {}): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "pi-endpoint-race-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(await fs.realpath(directory), "models.json");
  await fs.writeFile(file, JSON.stringify({ note: "preserve", providers }));
  return file;
}

async function providerIds(file: string): Promise<string[]> {
  const saved: unknown = JSON.parse(await fs.readFile(file, "utf8"));
  assert.ok(typeof saved === "object" && saved !== null && "providers" in saved);
  assert.ok(typeof saved.providers === "object" && saved.providers !== null);
  return Object.keys(saved.providers).sort();
}

async function assertClean(file: string): Promise<void> {
  assert.deepEqual((await fs.readdir(path.dirname(file))).sort(), ["models.json"]);
}

function barrier() {
  let entered: () => void = () => { throw new Error("barrier not initialized"); };
  let release: () => void = () => { throw new Error("barrier not initialized"); };
  const resume = new Promise<void>(resolve => { release = resolve; });
  const reached = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { release(); reject(new Error("writer did not reach read barrier")); }, 5000);
    entered = () => { clearTimeout(timer); resolve(); };
  });
  return { reached, release, wait: async () => { entered(); await resume; } };
}

function holdRead(file: string, gate: ReturnType<typeof barrier>): EndpointFileSystem {
  let held = false;
  return { ...fs, async open(target, flags, mode) {
    if (target === file && !held) { held = true; await gate.wait(); }
    return fs.open(target, flags, mode);
  } };
}

test("concurrent endpoint additions cannot both succeed while losing one provider", async t => {
  const file = await fixture(t);
  const results = await Promise.all(["first", "second"].map(id => addOpenAiEndpoint(file, draft(id), () => false)));
  const saved = await providerIds(file);
  const committed = results.filter(result => result.kind === "committed").length;
  assert.ok(committed >= 1);
  assert.equal(saved.length, committed);
  for (const [index, id] of ["first", "second"].entries()) {
    if (results[index]?.kind === "committed") assert.ok(saved.includes(id), `${id} reported success but was lost`);
    else assert.deepEqual(results[index], refused("occupied"));
  }
  await assertClean(file);
});

for (const competing of ["add", "remove"] as const) {
  test(`a competing ${competing} refuses while another writer holds the transaction`, async t => {
    const file = await fixture(t, { kept: {} });
    const gate = barrier();
    const writer = addOpenAiEndpoint(file, draft("first"), () => false, holdRead(file, gate));
    await gate.reached;
    try {
      const result = competing === "add" ? await addOpenAiEndpoint(file, draft("second"), () => false)
        : await removeOpenAiEndpoint(file, "kept", () => false);
      assert.deepEqual(result, refused("occupied"));
      assert.deepEqual(await providerIds(file), ["kept"]);
    } finally { gate.release(); }
    assert.deepEqual(await writer, { kind: "committed" });
    if (competing === "add") assert.deepEqual(await addOpenAiEndpoint(file, draft("second"), () => false), { kind: "committed" });
    else assert.deepEqual(await removeOpenAiEndpoint(file, "kept", () => false), { kind: "committed" });
    assert.deepEqual(await providerIds(file), competing === "add" ? ["first", "kept", "second"] : ["first"]);
    await assertClean(file);
  });
}

test("simultaneous removal of distinct providers does not restore a removed entry", async t => {
  const file = await fixture(t, { first: {}, second: {}, kept: {} });
  const results = await Promise.all(["first", "second"].map(id => removeOpenAiEndpoint(file, id, () => false)));
  const ids = await providerIds(file);
  for (const [index, id] of ["first", "second"].entries()) {
    if (results[index]?.kind === "committed") assert.equal(ids.includes(id), false);
    else assert.deepEqual(results[index], refused("occupied"));
  }
  await assertClean(file);
});

test("missing file creation is exclusive and preserves private permissions", async t => {
  const file = await fixture(t);
  await fs.unlink(file);
  const results = await Promise.all(["first", "second"].map(id => addOpenAiEndpoint(file, draft(id), () => false)));
  const committed = results.filter(result => result.kind === "committed").length;
  assert.ok(committed >= 1);
  assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
  assert.equal((await providerIds(file)).length, committed);
  await assertClean(file);
});

test("successful replacement preserves existing permissions and unrelated data", async t => {
  const file = await fixture(t, { kept: { note: "unchanged" } });
  await fs.chmod(file, 0o640);
  assert.deepEqual(await addOpenAiEndpoint(file, draft("first"), () => false), { kind: "committed" });
  assert.equal((await fs.stat(file)).mode & 0o777, 0o640);
  assert.deepEqual(JSON.parse(await fs.readFile(file, "utf8")).providers.kept, { note: "unchanged" });
  assert.equal(JSON.parse(await fs.readFile(file, "utf8")).note, "preserve");
  await assertClean(file);
});

for (const external of ["replace", "delete", "create"] as const) {
  test(`external ${external} before commit is preserved and reported as conflict`, async t => {
    const file = await fixture(t);
    if (external === "create") await fs.unlink(file);
    const foreign = JSON.stringify({ providers: { external: {} } });
    const injected: EndpointFileSystem = { ...fs, async chmod(target, mode) {
      if (external === "delete") await fs.unlink(file);
      else await fs.writeFile(file, foreign);
      return fs.chmod(target, mode);
    } };
    assert.deepEqual(await addOpenAiEndpoint(file, draft("first"), () => false, injected), refused("conflict"));
    if (external === "delete") await assert.rejects(fs.stat(file), { code: "ENOENT" });
    else assert.equal(await fs.readFile(file, "utf8"), foreign);
    assert.equal((await fs.readdir(path.dirname(file))).some(name => name !== "models.json"), false);
  });
}

test("replacement with equal bytes but a different identity is a conflict", async t => {
  const file = await fixture(t);
  const original = await fs.readFile(file);
  const injected: EndpointFileSystem = { ...fs, async chmod(target, mode) {
    const replacement = path.join(path.dirname(file), "foreign.tmp");
    await fs.writeFile(replacement, original);
    await fs.rename(replacement, file);
    return fs.chmod(target, mode);
  } };
  assert.deepEqual(await addOpenAiEndpoint(file, draft("first"), () => false, injected), refused("conflict"));
  assert.deepEqual(await fs.readFile(file), original);
  await assertClean(file);
});

for (const failure of ["read", "temporary", "chmod", "rename"] as const) {
  test(`${failure} failure preserves original bytes and cleans owned resources`, async t => {
    const file = await fixture(t);
    const original = await fs.readFile(file);
    const injected: EndpointFileSystem = { ...fs,
      async open(target, flags, mode) {
        if ((failure === "read" && target === file) || (failure === "temporary" && target !== file)) throw new Error("private failure");
        return fs.open(target, flags, mode);
      },
      async chmod(target, mode) { if (failure === "chmod") throw new Error("private failure"); return fs.chmod(target, mode); },
      async rename(source, target) { if (failure === "rename") throw new Error("private failure"); return fs.rename(source, target); },
    };
    assert.deepEqual(await addOpenAiEndpoint(file, draft("first"), () => false, injected), refused(failure === "read" ? "invalid" : "write"));
    assert.deepEqual(await fs.readFile(file), original);
    await assertClean(file);
  });
}

test("a stale or foreign lock blocks add/remove without removing metadata", async t => {
  const file = await fixture(t, { kept: {} });
  const original = await fs.readFile(file);
  await fs.mkdir(lockPath(file));
  const marker = path.join(lockPath(file), "owner.json");
  await fs.writeFile(marker, '{"token":"foreign","pid":0}');
  assert.deepEqual(await addOpenAiEndpoint(file, draft("first"), () => false), refused("occupied"));
  assert.deepEqual(await removeOpenAiEndpoint(file, "kept", () => false), refused("occupied"));
  assert.deepEqual(await fs.readFile(file), original);
  assert.equal(await fs.readFile(marker, "utf8"), '{"token":"foreign","pid":0}');
});

test("canonical parent directory aliases share one lock domain", async t => {
  const file = await fixture(t);
  const alias = path.join(path.dirname(file), "alias");
  await fs.symlink(path.dirname(file), alias, "dir");
  const gate = barrier();
  const writer = addOpenAiEndpoint(file, draft("first"), () => false, holdRead(file, gate));
  await gate.reached;
  try { assert.deepEqual(await addOpenAiEndpoint(path.join(alias, "models.json"), draft("second"), () => false), refused("occupied")); }
  finally { gate.release(); }
  assert.deepEqual(await writer, { kind: "committed" });
  assert.deepEqual(await providerIds(file), ["first"]);
});

for (const race of [false, true]) {
  test(`a ${race ? "racing" : "pre-existing"} FIFO target cannot block file validation or retain the lock`, {
    timeout: 5000, skip: process.platform === "win32",
  }, async t => {
    const file = await fixture(t);
    const makeFifo = async () => {
      await fs.unlink(file);
      await promisify(execFile)("mkfifo", [file], { windowsHide: true, timeout: 2000 });
    };
    if (!race) await makeFifo();
    const injected: EndpointFileSystem = { ...fs, async open(target, flags, mode) {
      if (race && target === file) await makeFifo();
      return fs.open(target, flags, mode);
    } };
    assert.deepEqual(await addOpenAiEndpoint(file, draft("first"), () => false, injected), refused("invalid"));
    assert.equal((await fs.lstat(file)).isFIFO(), true);
    await assert.rejects(fs.stat(lockPath(file)), { code: "ENOENT" });
    assert.deepEqual(await removeOpenAiEndpoint(file, "first", () => false), refused("invalid"));
    await assert.rejects(fs.stat(lockPath(file)), { code: "ENOENT" });
  });
}

for (const link of ["symlink", "hardlink"] as const) {
  test(`a ${link} target is refused without replacing the link or changing its destination`, async t => {
    const file = await fixture(t);
    const original = await fs.readFile(file);
    const linked = path.join(path.dirname(file), "destination.json");
    await fs.rename(file, linked);
    if (link === "symlink") await fs.symlink(linked, file);
    else await fs.link(linked, file);
    assert.deepEqual(await addOpenAiEndpoint(file, draft("first"), () => false), refused("invalid"));
    assert.deepEqual(await fs.readFile(linked), original);
    assert.equal((await fs.lstat(file)).isSymbolicLink(), link === "symlink");
    await assert.rejects(fs.stat(lockPath(file)), { code: "ENOENT" });
  });
}

for (const committed of [true, false]) {
  test(`lock release failure reports ${committed ? "committed" : "uncommitted"} state and retains a barrier`, async t => {
    const file = await fixture(t);
    const original = await fs.readFile(file);
    const injected: EndpointFileSystem = { ...fs,
      async rename(source, target) { if (!committed) throw new Error("write failure"); return fs.rename(source, target); },
      async rmdir() { throw new Error("private cleanup failure"); },
    };
    const result = await addOpenAiEndpoint(file, draft("first"), () => false, injected);
    assert.deepEqual(result, committed ? { kind: "committed-cleanup-failed" } : refused("write", true));
    if (committed) assert.deepEqual(await providerIds(file), ["first"]);
    else assert.deepEqual(await fs.readFile(file), original);
    assert.deepEqual(await addOpenAiEndpoint(file, draft("second"), () => false), refused("occupied"));
  });
}

test("temporary cleanup failure is explicit and never claims a commit", async t => {
  const file = await fixture(t);
  const original = await fs.readFile(file);
  const injected: EndpointFileSystem = { ...fs,
    async rename() { throw new Error("write failure"); },
    async unlink(target) { if (String(target).endsWith(".tmp")) throw new Error("cleanup failure"); return fs.unlink(target); },
  };
  assert.deepEqual(await addOpenAiEndpoint(file, draft("first"), () => false, injected), refused("write", true));
  assert.deepEqual(await fs.readFile(file), original);
  assert.equal((await fs.readdir(path.dirname(file))).filter(name => name.endsWith(".tmp")).length, 1);
});

test("failed lock initialization cleans only its own empty directory", async t => {
  const file = await fixture(t);
  const injected: EndpointFileSystem = { ...fs, async writeFile() { throw new Error("metadata failure"); } };
  assert.deepEqual(await addOpenAiEndpoint(file, draft("first"), () => false, injected), refused("write"));
  await assertClean(file);
});

test("changed owner metadata is not removed by lock release", async t => {
  const file = await fixture(t);
  const injected: EndpointFileSystem = { ...fs, async rename(source, target) {
    await fs.writeFile(path.join(lockPath(file), "owner.json"), "foreign-owner");
    return fs.rename(source, target);
  } };
  assert.deepEqual(await addOpenAiEndpoint(file, draft("first"), () => false, injected), { kind: "committed-cleanup-failed" });
  assert.equal(await fs.readFile(path.join(lockPath(file), "owner.json"), "utf8"), "foreign-owner");
});

test("a same-id collision and missing removal preserve the original document", async t => {
  const file = await fixture(t, { first: {} });
  const original = await fs.readFile(file);
  assert.deepEqual(await addOpenAiEndpoint(file, draft("first"), () => false), refused("exists"));
  assert.deepEqual(await removeOpenAiEndpoint(file, "missing", () => false), refused("missing"));
  assert.deepEqual(await fs.readFile(file), original);
  await assertClean(file);
});
