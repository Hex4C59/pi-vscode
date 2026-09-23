import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { stat as fsStat, realpath as fsRealpath } from "node:fs/promises";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn as nodeSpawn, spawnSync, type ChildProcess, type SpawnOptions } from "node:child_process";
import { tmpdir } from "node:os";
import { PassThrough } from "node:stream";
import path from "node:path";
import { test } from "node:test";

import { createPiSessionBackend, SESSION_WORKER_ARG } from "../pi-session-backend.js";
import {
  runSessionWorkerRequest,
  type SessionManagerApi,
  type SessionInfoLike,
} from "../sessionWorker.js";

const projectRoot = "C:\\project";
const signal = new AbortController().signal;

async function tempDirectory(t: { after: (fn: () => void | Promise<void>) => void }): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "pi-vscode-session-backend-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

async function workerFixture(
  t: { after: (fn: () => void | Promise<void>) => void },
  source: string,
): Promise<string> {
  const directory = await tempDirectory(t);
  const workerPath = path.join(directory, "worker.mjs");
  await writeFile(workerPath, source, "utf8");
  return workerPath;
}

function responseWorker(response: unknown): string {
  const json = JSON.stringify(response);
  return `
const chunks = [];
process.stdin.on("data", chunk => chunks.push(chunk));
process.stdin.on("end", () => {
  JSON.parse(Buffer.concat(chunks).toString("utf8"));
  process.stdout.write(${JSON.stringify(json)} + "\\n");
});
`;
}

function holdWorker(markerPath: string): string {
  return `
import { writeFileSync } from "node:fs";
writeFileSync(${JSON.stringify(markerPath)}, String(process.pid), "utf8");
process.on("SIGTERM", () => { writeFileSync(${JSON.stringify(`${markerPath}.closed`)}, "closed", "utf8"); process.exit(0); });
setInterval(() => {}, 1000);
`;
}

function listResponse(entries: unknown[], page = 1, total = 18): unknown {
  return { version: 1, ok: true, action: "list", page, total, entries };
}

function inspectResponse(session: unknown, history: unknown, anchor = "anchor-1"): unknown {
  return { version: 1, ok: true, action: "inspect", session, history, anchor };
}

const session = {
  id: "session-1",
  path: "C:\\private\\first.jsonl",
  name: "First",
  firstMessage: "First",
  modified: "2026-09-21T10:00:00.000Z",
};

test("saved-session backend returns bounded opaque list results from an external worker", async (t) => {
  const workerPath = await workerFixture(t, responseWorker(listResponse([
    { ...session, id: "session-2", path: "C:\\private\\second.jsonl", name: null, firstMessage: "Second", modified: "2026-09-22T10:00:00.000Z" },
    session,
  ])));
  const backend = createPiSessionBackend(workerPath, { timeoutMs: 2_000 });

  const result = await backend.list(projectRoot, 1, signal);

  assert.deepEqual(result, {
    ok: true,
    page: 1,
    total: 18,
    entries: [
      { id: "session-2", path: "C:\\private\\second.jsonl", name: null, firstMessage: "Second", modified: "2026-09-22T10:00:00.000Z" },
      session,
    ],
  });
});

test("saved-session backend validates inspect history separately from session metadata", async (t) => {
  const history = { messages: [{ id: "saved-entry-1", role: "user", text: "Earlier request" }], page: 0, total: 1 };
  const workerPath = await workerFixture(t, responseWorker(inspectResponse(session, history)));
  const backend = createPiSessionBackend(workerPath, { timeoutMs: 2_000 });

  const result = await backend.inspect(projectRoot, session.id, signal);

  assert.deepEqual(result, { ok: true, session, history, anchor: "anchor-1" });
});

test("saved-session backend rejects malformed, oversized, and unbounded inspect responses", async (t) => {
  const malformed = createPiSessionBackend(await workerFixture(t, "process.stdin.resume(); process.stdout.write('not-json');"), { timeoutMs: 2_000 });
  assert.deepEqual(await malformed.list(projectRoot, 0, signal), { ok: false, code: "unavailable" });

  const invalidMetadata = createPiSessionBackend(await workerFixture(t, responseWorker(listResponse([
    { ...session, firstMessage: "x".repeat(257) },
  ], 0, 1))), { timeoutMs: 2_000 });
  assert.deepEqual(await invalidMetadata.list(projectRoot, 0, signal), { ok: false, code: "unavailable" });

  const oversized = createPiSessionBackend(await workerFixture(t, `process.stdin.resume(); process.stdout.write("x".repeat(2048));`), {
    timeoutMs: 2_000,
    stdoutLimitBytes: 256,
  });
  assert.deepEqual(await oversized.list(projectRoot, 0, signal), { ok: false, code: "unavailable" });
});

test("saved-session backend returns anchored history and preview pages and preserves stale failures", async (t) => {
  const history = { messages: [{ id: "saved-entry-1", role: "assistant", text: "Earlier" }], page: 1, total: 33 };
  const historyWorker = await workerFixture(t, responseWorker({ version: 1, ok: true, action: "history", history }));
  const historyBackend = createPiSessionBackend(historyWorker, { timeoutMs: 2_000 });
  assert.deepEqual(await historyBackend.history(projectRoot, session.id, "anchor-1", 1, signal), { ok: true, history });

  const preview = { text: "retained text", offset: 8, nextOffset: 21, done: false, totalChars: 40 };
  const previewWorker = await workerFixture(t, responseWorker({ version: 1, ok: true, action: "preview", preview }));
  const previewBackend = createPiSessionBackend(previewWorker, { timeoutMs: 2_000 });
  assert.deepEqual(await previewBackend.preview(projectRoot, session.id, "anchor-1", 3, 8, signal), { ok: true, preview });

  const staleWorker = await workerFixture(t, responseWorker({ version: 1, ok: false, code: "stale" }));
  const staleBackend = createPiSessionBackend(staleWorker, { timeoutMs: 2_000 });
  assert.deepEqual(await staleBackend.history(projectRoot, session.id, "anchor-1", 0, signal), { ok: false, code: "stale" });
  assert.deepEqual(await staleBackend.preview(projectRoot, session.id, "anchor-1", 0, 0, signal), { ok: false, code: "stale" });
});

test("saved-session backend cancels and deadlines external workers only after owned close", async (t) => {
  const directory = await tempDirectory(t);
  const marker = path.join(directory, "worker.pid");
  const workerPath = await workerFixture(t, holdWorker(marker));

  const controller = new AbortController();
  const cancellation = createPiSessionBackend(workerPath, { timeoutMs: 2_000, terminationGraceMs: 250 }).list(projectRoot, 0, controller.signal);
  await new Promise((resolve) => setTimeout(resolve, 25));
  controller.abort();
  assert.deepEqual(await cancellation, { ok: false, code: "cancelled" });
  await assert.rejects(readFile(`${marker}.closed`, "utf8"), { code: "ENOENT" });

  const deadlineMarker = path.join(directory, "deadline.pid");
  const deadlineWorker = await workerFixture(t, holdWorker(deadlineMarker));
  const deadline = createPiSessionBackend(deadlineWorker, { timeoutMs: 25, terminationGraceMs: 250 });
  assert.deepEqual(await deadline.list(projectRoot, 0, signal), { ok: false, code: "unavailable" });
});

test("saved-session backend blocks retries while an unclosed helper remains owned", async () => {
  let spawnCount = 0;
  const unclosedChild = Object.assign(new EventEmitter(), {
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    exitCode: null,
    signalCode: null,
    kill: () => true,
  }) as unknown as ChildProcess;
  const backend = createPiSessionBackend("C:\\worker.mjs", {
    timeoutMs: 10,
    terminationGraceMs: 5,
    spawn: () => {
      spawnCount += 1;
      return unclosedChild;
    },
  });

  assert.deepEqual(await backend.list(projectRoot, 0, signal), { ok: false, code: "unavailable" });
  assert.equal(spawnCount, 1);
  assert.deepEqual(await backend.list(projectRoot, 0, signal), { ok: false, code: "unavailable" });
  assert.equal(spawnCount, 1);

  unclosedChild.emit("close", null, null);
});

test("saved-session backend maps fixed worker failures and preserves controlled child invocation", async (t) => {
  const workerPath = await workerFixture(t, responseWorker({ version: 1, ok: false, code: "wrong-project" }));
  let invocation: { command: string; args: readonly string[]; options: SpawnOptions } | undefined;
  const backend = createPiSessionBackend(workerPath, {
    spawn: (command: string, args: readonly string[], options: SpawnOptions): ChildProcess => {
      invocation = { command, args, options };
      return nodeSpawn(command, args, options);
    },
    env: { PI_OFFLINE: "0", PI_TELEMETRY: "1", FIXTURE_PROVIDER_KEY: "fixture" },
    timeoutMs: 2_000,
  });

  assert.deepEqual(await backend.list(projectRoot, 0, signal), { ok: false, code: "wrong-project" });
  assert.ok(invocation);
  assert.equal(invocation.command, process.execPath);
  assert.deepEqual(invocation.args, [path.resolve(workerPath), SESSION_WORKER_ARG]);
  assert.equal(invocation.options.shell, false);
  assert.equal(invocation.options.env?.ELECTRON_RUN_AS_NODE, "1");
  assert.equal(invocation.options.env?.PI_OFFLINE, "1");
  assert.equal(invocation.options.env?.PI_TELEMETRY, "0");
  assert.equal(invocation.options.env?.FIXTURE_PROVIDER_KEY, "fixture");
});

async function ownedSessionFixture(
  t: { after: (fn: () => void | Promise<void>) => void },
  count = 17,
): Promise<{ root: string; paths: string[]; infos: SessionInfoLike[] }> {
  const root = await tempDirectory(t);
  const paths: string[] = [];
  const infos: SessionInfoLike[] = [];
  for (let index = 0; index < count; index += 1) {
    const file = path.join(root, `session-${index}.jsonl`);
    await writeFile(file, "fixture placeholder", "utf8");
    paths.push(file);
    infos.push({
      id: `session-${String(index).padStart(2, "0")}`,
      path: file,
      cwd: root,
      name: index === 0 ? "n".repeat(200) : undefined,
      firstMessage: index === 0 ? "f".repeat(300) : `Message ${index}`,
      modified: new Date(Date.UTC(2026, 8, 23, 0, index, 0)),
    });
  }
  return { root, paths, infos };
}

function fileSystem(): { stat: typeof fsStat; realpath: typeof fsRealpath } {
  return { stat: fsStat, realpath: fsRealpath };
}

test("session worker validates the current project and sorts bounded metadata before pagination", async (t) => {
  const fixture = await ownedSessionFixture(t);
  let observed: { sessionDir?: string; progress?: unknown; signal?: AbortSignal } | undefined;
  const manager: SessionManagerApi = {
    list: async (cwd, sessionDir, progress, listSignal) => {
      observed = { sessionDir, progress, signal: listSignal };
      assert.equal(cwd, fixture.root);
      return fixture.infos;
    },
    findById: () => undefined,
    open: () => { throw new Error("not used"); },
  };
  const result = await runSessionWorkerRequest({ version: 1, action: "list", root: fixture.root, page: 0 }, {
    sessionManager: manager,
    fileSystem: fileSystem(),
  }, signal);

  assert.equal(result.ok, true);
  if (result.ok && result.action === "list") {
    assert.equal(result.total, 17);
    assert.equal(result.entries.length, 16);
    assert.equal(result.entries[0].id, "session-16");
    const nextPage = await runSessionWorkerRequest({ version: 1, action: "list", root: fixture.root, page: 1 }, {
      sessionManager: manager,
      fileSystem: fileSystem(),
    }, signal);
    assert.equal(nextPage.ok, true);
    if (nextPage.ok && nextPage.action === "list") {
      assert.equal(nextPage.entries.length, 1);
      assert.equal(nextPage.entries[0].id, "session-00");
      assert.equal(nextPage.entries[0].name?.length, 160);
      assert.equal(nextPage.entries[0].firstMessage.length, 256);
    }
  }
  assert.equal(observed?.sessionDir, undefined);
  assert.equal(typeof observed?.progress, "function");
  assert.equal(observed?.signal, signal);
});

test("session worker rejects a foreign project and missing selected ID without opening a fresh session", async (t) => {
  const fixture = await ownedSessionFixture(t, 1);
  const foreign = await tempDirectory(t);
  const foreignFile = path.join(foreign, "foreign.jsonl");
  await writeFile(foreignFile, "fixture placeholder", "utf8");
  const foreignInfo: SessionInfoLike = { ...fixture.infos[0], path: foreignFile, cwd: foreign };
  let opened = false;
  const manager: SessionManagerApi = {
    list: async () => [foreignInfo],
    findById: () => undefined,
    open: () => { opened = true; throw new Error("must not open"); },
  };
  const foreignResult = await runSessionWorkerRequest({ version: 1, action: "list", root: fixture.root, page: 0 }, {
    sessionManager: manager,
    fileSystem: fileSystem(),
  }, signal);
  assert.deepEqual(foreignResult, { version: 1, ok: false, code: "wrong-project" });

  const missing = await runSessionWorkerRequest({ version: 1, action: "inspect", root: fixture.root, id: "missing" }, {
    sessionManager: { ...manager, list: async () => fixture.infos },
    fileSystem: fileSystem(),
  }, signal);
  assert.deepEqual(missing, { version: 1, ok: false, code: "unavailable" });
  assert.equal(opened, false);
});

test("session worker opens a verified public identity and projects bounded active-branch history", async (t) => {
  const fixture = await ownedSessionFixture(t, 1);
  const selected = fixture.infos[0];
  const history = { messages: [{ id: "saved-entry", role: "assistant" as const, text: "Projected" }], page: 0, total: 1 };
  const manager: SessionManagerApi = {
    list: async () => fixture.infos,
    findById: () => selected.path,
    open: () => ({
      getCwd: () => fixture.root,
      getSessionId: () => selected.id,
      getSessionFile: () => selected.path,
      getBranch: () => [{ type: "message", id: "anchor-1" }],
    }),
  };
  const result = await runSessionWorkerRequest({ version: 1, action: "inspect", root: fixture.root, id: selected.id }, {
    sessionManager: manager,
    projectHistory: (branch, page) => {
      assert.deepEqual(branch, [{ type: "message", id: "anchor-1" }]);
      assert.equal(page, 0);
      return history;
    },
    fileSystem: fileSystem(),
  }, signal);

  assert.deepEqual(result, {
    version: 1,
    ok: true,
    action: "inspect",
    session: {
      id: selected.id,
      path: selected.path,
      name: "n".repeat(160),
      firstMessage: "f".repeat(256),
      modified: selected.modified.toISOString().slice(0, 40),
    },
    history,
    anchor: "anchor-1",
  });
});

test("session worker freezes history and preview to the requested public branch anchor", async (t) => {
  const fixture = await ownedSessionFixture(t, 1);
  const selected = fixture.infos[0];
  const branch = [
    { type: "message", id: "entry-0" },
    { type: "message", id: "anchor-1" },
    { type: "message", id: "entry-after-anchor" },
  ];
  const history = { messages: [{ id: "saved-entry", role: "assistant" as const, text: "Projected page" }], page: 0, total: 1 };
  const preview = { text: "retained", offset: 4, nextOffset: 12, done: true, totalChars: 12 };
  let observedHistory: unknown[] | undefined;
  let observedPreview: { branch: unknown[]; index: number; offset: number } | undefined;
  const manager: SessionManagerApi = {
    list: async () => fixture.infos,
    findById: () => selected.path,
    open: () => ({
      getCwd: () => fixture.root,
      getSessionId: () => selected.id,
      getSessionFile: () => selected.path,
      getBranch: () => branch,
    }),
  };
  const environment = {
    sessionManager: manager,
    projectHistory: (anchored: unknown[], page?: number) => {
      observedHistory = anchored;
      assert.equal(page, 0);
      return history;
    },
    projectHistoryPreview: (anchored: unknown[], index: number, offset: number) => {
      observedPreview = { branch: anchored, index, offset };
      return preview;
    },
    fileSystem: fileSystem(),
  };

  assert.deepEqual(await runSessionWorkerRequest({ version: 1, action: "history", root: fixture.root, id: selected.id, anchor: "anchor-1", page: 0 }, environment, signal), {
    version: 1,
    ok: true,
    action: "history",
    history,
  });
  assert.deepEqual(observedHistory, branch.slice(0, 2));

  assert.deepEqual(await runSessionWorkerRequest({ version: 1, action: "preview", root: fixture.root, id: selected.id, anchor: "anchor-1", index: 1, offset: 4 }, environment, signal), {
    version: 1,
    ok: true,
    action: "preview",
    preview,
  });
  assert.deepEqual(observedPreview, { branch: branch.slice(0, 2), index: 1, offset: 4 });

  assert.deepEqual(await runSessionWorkerRequest({ version: 1, action: "history", root: fixture.root, id: selected.id, anchor: "missing-anchor", page: 0 }, environment, signal), {
    version: 1,
    ok: false,
    code: "stale",
  });
});

function testEnvironment(agentDirectory: string): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
    ComSpec: process.env.ComSpec,
    TEMP: process.env.TEMP,
    TMP: process.env.TMP,
    PI_CODING_AGENT_DIR: agentDirectory,
    PI_OFFLINE: "1",
    PI_TELEMETRY: "0",
  };
  return Object.fromEntries(Object.entries(environment).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}


async function buildWorker(t: { after: (fn: () => void | Promise<void>) => void }): Promise<string> {
  const directory = await tempDirectory(t);
  const workerPath = path.join(process.cwd(), "dist", `session-worker-test-${path.basename(directory)}.mjs`);
  t.after(() => rm(workerPath, { force: true }));
  const esbuild = path.join(process.cwd(), "node_modules", "esbuild", "bin", "esbuild");
  const source = path.join(process.cwd(), "src", "adapter", "sessions", "sessionWorker.ts");
  const built = spawnSync(process.execPath, [
    esbuild,
    source,
    "--bundle",
    "--platform=node",
    "--format=esm",
    "--target=node22",
    "--external:@earendil-works/pi-coding-agent",
    `--outfile=${workerPath}`,
  ], { cwd: process.cwd(), env: testEnvironment(directory), encoding: "utf8" });
  assert.equal(built.status, 0, built.stderr);
  return workerPath;
}

test("session worker uses public SessionManager APIs in an isolated external fixture", async (t) => {
  const root = await tempDirectory(t);
  const agentDirectory = await tempDirectory(t);
  const sdkEntry = path.join(process.cwd(), "node_modules", "@earendil-works", "pi-coding-agent", "dist", "index.js").replaceAll("\\", "/");
  const fixtureCode = `import { SessionManager } from ${JSON.stringify(`file:///${sdkEntry}`)};
const manager = SessionManager.create(${JSON.stringify(root)});
manager.appendMessage({ role: "user", content: "Synthetic public SDK history", timestamp: 0 });
manager.appendMessage({ role: "assistant", content: [{ type: "text", text: "Synthetic public SDK reply" }], api: "fixture", provider: "fixture", model: "fixture-model", usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } }, stopReason: "stop", timestamp: 0 });
process.stdout.write(JSON.stringify({ id: manager.getSessionId() }));`;
  const created = spawnSync(process.execPath, ["--input-type=module", "--eval", fixtureCode], {
    cwd: process.cwd(),
    env: testEnvironment(agentDirectory),
    encoding: "utf8",
  });
  assert.equal(created.status, 0, created.stderr);
  const fixture = JSON.parse(created.stdout) as { id: string };
  assert.equal(typeof fixture.id, "string");

  const backend = createPiSessionBackend(await buildWorker(t), {
    env: testEnvironment(agentDirectory),
    timeoutMs: 10_000,
  });
  const result = await backend.inspect(root, fixture.id, signal);

  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.equal(result.session.id, fixture.id);
    assert.equal(result.history.total, 2);
    assert.equal(result.history.messages.length, 2);
    assert.equal(result.history.messages[0]?.text, "Synthetic public SDK history");
    assert.equal(result.history.messages[1]?.text, "Synthetic public SDK reply");
  }
});

test("session identity preserves canonical project component case while accepting drive spelling", async () => {
  const root = process.platform === "win32" ? "d:\\Project" : "/Project";
  const same = process.platform === "win32" ? "D:\\Project" : root;
  const foreign = process.platform === "win32" ? "D:\\project" : "/project";
  const selectedPath = path.resolve("/Sessions/selected.jsonl");
  const fs = { stat: async () => ({ isDirectory: () => true, isFile: () => true }), realpath: async (value: string) => value };
  for (const cwd of [same, foreign]) {
    const manager: SessionManagerApi = {
      list: async () => [{ id: "selected", path: selectedPath, cwd, modified: new Date(0), firstMessage: "Saved" }],
      findById: () => selectedPath,
      open: () => ({ getCwd: () => cwd, getSessionId: () => "selected", getSessionFile: () => selectedPath, getBranch: () => [] }),
    };
    const result = await runSessionWorkerRequest({ version: 1, action: "inspect", root, id: "selected" }, { sessionManager: manager, fileSystem: fs });
    assert.equal(result.ok, cwd === same, `canonical project ${cwd}`);
    if (cwd === foreign) assert.deepEqual(result, { version: 1, ok: false, code: "wrong-project" });
  }
});
