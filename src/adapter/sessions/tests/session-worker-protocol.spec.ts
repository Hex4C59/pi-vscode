import assert from "node:assert/strict";
import path from "node:path";
import { PassThrough } from "node:stream";
import { test } from "node:test";

import { runSessionWorkerCli, type SessionManagerApi } from "../sessionWorker.js";
import {
  HISTORY_PAGE_SIZE,
  SESSION_PAGE_SIZE,
  SESSION_WORKER_MAX_HISTORY_ROWS,
  SESSION_WORKER_MAX_HISTORY_TEXT_LENGTH,
  SESSION_WORKER_MAX_HISTORY_TOTAL_BYTES,
  SESSION_WORKER_MAX_PREVIEW_TEXT_LENGTH,
  SESSION_WORKER_PROTOCOL_VERSION,
  isSessionWorkerRequest,
  parseSessionWorkerResponse,
  type SessionWorkerRequest,
} from "../session-worker-protocol.js";

const root = path.resolve("/sessions/project");
const sessionPath = path.resolve("/sessions/project/one.jsonl");

function roundTrip(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

function session(id: string): { id: string; path: string; name: null; firstMessage: string; modified: string } {
  return { id, path: sessionPath, name: null, firstMessage: "hello", modified: "2026-09-29T00:00:00.000Z" };
}

function history(text = "saved"): { messages: { role: "user"; text: string }[]; page: number; total: number } {
  return { messages: [{ role: "user", text }], page: 0, total: 1 };
}

const requests: SessionWorkerRequest[] = [
  { version: SESSION_WORKER_PROTOCOL_VERSION, action: "list", root, page: 0 },
  { version: SESSION_WORKER_PROTOCOL_VERSION, action: "inspect", root, id: "session-1" },
  { version: SESSION_WORKER_PROTOCOL_VERSION, action: "history", root, id: "session-1", anchor: "anchor-1", page: 0 },
  { version: SESSION_WORKER_PROTOCOL_VERSION, action: "preview", root, id: "session-1", anchor: "anchor-1", index: 0, offset: 0 },
];

const successes = [
  { version: SESSION_WORKER_PROTOCOL_VERSION, ok: true, action: "list", entries: [session("session-1")], page: 0, total: 1 },
  { version: SESSION_WORKER_PROTOCOL_VERSION, ok: true, action: "inspect", session: session("session-1"), history: history(), anchor: "anchor-1" },
  { version: SESSION_WORKER_PROTOCOL_VERSION, ok: true, action: "history", history: history() },
  { version: SESSION_WORKER_PROTOCOL_VERSION, ok: true, action: "preview", preview: { text: "kept", offset: 0, nextOffset: 4, done: true, totalChars: 4 } },
];

test("session worker requests and successes survive JSON and still validate", () => {
  for (const request of requests) assert.equal(isSessionWorkerRequest(roundTrip(request)), true);
  for (const [index, success] of successes.entries()) {
    const request = requests[index];
    assert.ok(request);
    assert.equal(parseSessionWorkerResponse(roundTrip(success), request).ok, true);
  }
});

test("session worker failure codes stay distinct", () => {
  const request = requests[0];
  assert.ok(request);
  for (const code of ["unavailable", "wrong-project", "stale"] as const) {
    assert.deepEqual(parseSessionWorkerResponse(roundTrip({ version: SESSION_WORKER_PROTOCOL_VERSION, ok: false, code }), request), { ok: false, code });
  }
});

test("session worker protocol rejects malformed frames", () => {
  const list = requests[0];
  const historyRequest = requests[2];
  const preview = requests[3];
  assert.ok(list && historyRequest && preview);
  assert.equal(isSessionWorkerRequest({ version: 2, action: "list", root, page: 0 }), false);
  assert.equal(isSessionWorkerRequest({ version: SESSION_WORKER_PROTOCOL_VERSION, action: "list", root }), false);
  assert.equal(isSessionWorkerRequest({ version: SESSION_WORKER_PROTOCOL_VERSION, action: "list", root, page: 0, extra: true }), false);
  assert.equal(isSessionWorkerRequest({ version: SESSION_WORKER_PROTOCOL_VERSION, action: "inspect", root, id: "bad id" }), false);
  assert.equal(isSessionWorkerRequest({
    version: SESSION_WORKER_PROTOCOL_VERSION,
    action: "list",
    root,
    page: Math.floor(Number.MAX_SAFE_INTEGER / SESSION_PAGE_SIZE) + 1,
  }), false);
  assert.equal(isSessionWorkerRequest({
    version: SESSION_WORKER_PROTOCOL_VERSION,
    action: "history",
    root,
    id: "session-1",
    anchor: "anchor-1",
    page: Math.floor(Number.MAX_SAFE_INTEGER / HISTORY_PAGE_SIZE) + 1,
  }), false);

  const duplicate = parseSessionWorkerResponse({
    version: SESSION_WORKER_PROTOCOL_VERSION,
    ok: true,
    action: "list",
    entries: [session("session-1"), session("session-1")],
    page: 0,
    total: 2,
  }, list);
  assert.deepEqual(duplicate, { ok: false, code: "unavailable" });

  const longText = parseSessionWorkerResponse({
    version: SESSION_WORKER_PROTOCOL_VERSION,
    ok: true,
    action: "history",
    history: history("a".repeat(SESSION_WORKER_MAX_HISTORY_TEXT_LENGTH + 1)),
  }, historyRequest);
  assert.deepEqual(longText, { ok: false, code: "unavailable" });

  const emoji = "😀";
  const acceptedEmoji = parseSessionWorkerResponse({
    version: SESSION_WORKER_PROTOCOL_VERSION,
    ok: true,
    action: "history",
    history: history(emoji.repeat(SESSION_WORKER_MAX_HISTORY_TEXT_LENGTH)),
  }, historyRequest);
  assert.equal(acceptedEmoji.ok, true);

  const messages = Array.from({ length: SESSION_WORKER_MAX_HISTORY_ROWS }, () => ({ role: "user", text: "a".repeat(8_000) }));
  const totalBytes = messages.reduce((sum, message) => sum + Buffer.byteLength(message.text, "utf8"), 0);
  assert.ok(totalBytes > SESSION_WORKER_MAX_HISTORY_TOTAL_BYTES);
  const oversizedBytes = parseSessionWorkerResponse({
    version: SESSION_WORKER_PROTOCOL_VERSION,
    ok: true,
    action: "history",
    history: { messages, page: 0, total: messages.length },
  }, historyRequest);
  assert.deepEqual(oversizedBytes, { ok: false, code: "unavailable" });

  const acceptedText = emoji.repeat(SESSION_WORKER_MAX_PREVIEW_TEXT_LENGTH / 2);
  const acceptedPreview = parseSessionWorkerResponse({
    version: SESSION_WORKER_PROTOCOL_VERSION,
    ok: true,
    action: "preview",
    preview: { text: acceptedText, offset: 0, nextOffset: acceptedText.length, done: true, totalChars: acceptedText.length },
  }, preview);
  assert.equal(acceptedPreview.ok, true);
  const oversizedText = emoji.repeat(SESSION_WORKER_MAX_PREVIEW_TEXT_LENGTH / 2 + 1);
  const longPreview = parseSessionWorkerResponse({
    version: SESSION_WORKER_PROTOCOL_VERSION,
    ok: true,
    action: "preview",
    preview: { text: oversizedText, offset: 0, nextOffset: oversizedText.length, done: true, totalChars: oversizedText.length },
  }, preview);
  assert.deepEqual(longPreview, { ok: false, code: "unavailable" });
  const badOffset = parseSessionWorkerResponse({
    version: SESSION_WORKER_PROTOCOL_VERSION,
    ok: true,
    action: "preview",
    preview: { text: "kept", offset: 4, nextOffset: 3, done: false, totalChars: 8 },
  }, preview);
  assert.deepEqual(badOffset, { ok: false, code: "unavailable" });
  const extraField = parseSessionWorkerResponse({
    version: SESSION_WORKER_PROTOCOL_VERSION,
    ok: true,
    action: "history",
    history: history(),
    extra: true,
  }, historyRequest);
  assert.deepEqual(extraField, { ok: false, code: "unavailable" });
});

test("session worker CLI stream output is accepted by the shared response parser", async () => {
  const request = requests[0];
  assert.ok(request && request.action === "list");
  const sessionFile = path.join(root, "one.jsonl");
  const manager: SessionManagerApi = {
    list: async () => [{ id: "session-1", path: sessionFile, cwd: root, name: "Named", firstMessage: "Saved", modified: new Date("2026-09-29T00:00:00.000Z") }],
    findById: () => undefined,
    open: () => { throw new Error("not used"); },
  };
  const input = new PassThrough();
  const output = new PassThrough();
  const chunks: Buffer[] = [];
  output.on("data", (chunk: Buffer | string) => { chunks.push(Buffer.from(chunk)); });
  const pending = runSessionWorkerCli(input, output, {
    sessionManager: manager,
    fileSystem: {
      stat: async (value: string) => ({ isDirectory: () => value === root, isFile: () => value === sessionFile }),
      realpath: async (value: string) => value,
    },
  });
  input.end(`${JSON.stringify(request)}\n`);
  await pending;
  const parsed = parseSessionWorkerResponse(JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown, request);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.kind, "list");
  if (parsed.ok && parsed.kind === "list") {
    assert.equal(parsed.total, 1);
    assert.equal(parsed.entries[0]?.id, "session-1");
  }
});
