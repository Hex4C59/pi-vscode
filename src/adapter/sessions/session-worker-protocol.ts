import path from "node:path";

import type { SavedHistoryPage, SavedHistoryPreview, SavedSession } from "../../extension/contracts/index.js";

export const SESSION_WORKER_ARG = "--pi-vscode-session-worker";
export const SESSION_WORKER_PROTOCOL_VERSION = 1;
export const SESSION_PAGE_SIZE = 16;
export const HISTORY_PAGE_SIZE = 32;
export const SESSION_WORKER_REQUEST_LIMIT_BYTES = 64 * 1024;
export const SESSION_WORKER_RESPONSE_LIMIT_BYTES = 1024 * 1024;
export const SESSION_WORKER_MAX_ROOT_LENGTH = 32 * 1024;
export const SESSION_WORKER_MAX_ID_LENGTH = 200;
export const SESSION_WORKER_MAX_PATH_LENGTH = 32 * 1024;
export const SESSION_WORKER_MAX_NAME_LENGTH = 160;
export const SESSION_WORKER_MAX_FIRST_MESSAGE_LENGTH = 256;
export const SESSION_WORKER_MAX_MODIFIED_LENGTH = 40;
export const SESSION_WORKER_MAX_HISTORY_ROWS = 32;
export const SESSION_WORKER_MAX_HISTORY_TEXT_LENGTH = 8_000;
export const SESSION_WORKER_MAX_HISTORY_TOTAL_BYTES = 128 * 1024;
export const SESSION_WORKER_MAX_PREVIEW_TEXT_LENGTH = 8_192;

export type SessionWorkerListRequest = { version: typeof SESSION_WORKER_PROTOCOL_VERSION; action: "list"; root: string; page: number };
export type SessionWorkerInspectRequest = { version: typeof SESSION_WORKER_PROTOCOL_VERSION; action: "inspect"; root: string; id: string };
export type SessionWorkerHistoryRequest = { version: typeof SESSION_WORKER_PROTOCOL_VERSION; action: "history"; root: string; id: string; anchor: string; page: number };
export type SessionWorkerPreviewRequest = { version: typeof SESSION_WORKER_PROTOCOL_VERSION; action: "preview"; root: string; id: string; anchor: string; index: number; offset: number };
export type SessionWorkerRequest = SessionWorkerListRequest | SessionWorkerInspectRequest | SessionWorkerHistoryRequest | SessionWorkerPreviewRequest;
export type SessionWorkerFailureCode = "unavailable" | "wrong-project" | "stale";
export type SessionWorkerFailure = { version: typeof SESSION_WORKER_PROTOCOL_VERSION; ok: false; code: SessionWorkerFailureCode };
export type SessionWorkerSuccess =
  | { version: typeof SESSION_WORKER_PROTOCOL_VERSION; ok: true; action: "list"; entries: SavedSession[]; page: number; total: number }
  | { version: typeof SESSION_WORKER_PROTOCOL_VERSION; ok: true; action: "inspect"; session: SavedSession; history: SavedHistoryPage; anchor: string | null }
  | { version: typeof SESSION_WORKER_PROTOCOL_VERSION; ok: true; action: "history"; history: SavedHistoryPage }
  | { version: typeof SESSION_WORKER_PROTOCOL_VERSION; ok: true; action: "preview"; preview: SavedHistoryPreview };

type ParsedSessionWorkerResponse =
  | { ok: true; kind: "list"; entries: SavedSession[]; page: number; total: number }
  | { ok: true; kind: "inspect"; session: SavedSession; history: SavedHistoryPage; anchor: string | null }
  | { ok: true; kind: "history"; history: SavedHistoryPage }
  | { ok: true; kind: "preview"; preview: SavedHistoryPreview }
  | { ok: false; code: "unavailable" | "stale" | "wrong-project" };

export function sessionWorkerFailure(code: SessionWorkerFailureCode = "unavailable"): SessionWorkerFailure {
  return { version: SESSION_WORKER_PROTOCOL_VERSION, ok: false, code };
}

export function isSessionWorkerRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

export function isBoundedSessionWorkerText(value: unknown, maxCharacters: number): value is string {
  return typeof value === "string" && Array.from(value).length <= maxCharacters;
}

export function isSessionWorkerRoot(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= SESSION_WORKER_MAX_ROOT_LENGTH && path.isAbsolute(value);
}

export function isSessionWorkerId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= SESSION_WORKER_MAX_ID_LENGTH && /^[A-Za-z0-9_-]+$/.test(value);
}

function isSessionWorkerPage(value: unknown, pageSize: number): value is number {
  return Number.isSafeInteger(value)
    && (value as number) >= 0
    && (value as number) <= Math.floor(Number.MAX_SAFE_INTEGER / pageSize);
}

export function isSessionWorkerRequest(value: unknown): value is SessionWorkerRequest {
  if (!isSessionWorkerRecord(value) || value.version !== SESSION_WORKER_PROTOCOL_VERSION || !isSessionWorkerRoot(value.root)) return false;
  if (value.action === "list") return hasExactKeys(value, ["version", "action", "root", "page"]) && isSessionWorkerPage(value.page, SESSION_PAGE_SIZE);
  if (value.action === "inspect") return hasExactKeys(value, ["version", "action", "root", "id"]) && isSessionWorkerId(value.id);
  if (value.action === "history") return hasExactKeys(value, ["version", "action", "root", "id", "anchor", "page"]) && isSessionWorkerId(value.id) && isSessionWorkerId(value.anchor) && isSessionWorkerPage(value.page, HISTORY_PAGE_SIZE);
  return value.action === "preview"
    && hasExactKeys(value, ["version", "action", "root", "id", "anchor", "index", "offset"])
    && isSessionWorkerId(value.id)
    && isSessionWorkerId(value.anchor)
    && isSessionWorkerPage(value.index, 1)
    && isSessionWorkerPage(value.offset, 1);
}

function isSavedSession(value: unknown): value is SavedSession {
  return isSessionWorkerRecord(value)
    && hasExactKeys(value, ["id", "path", "name", "firstMessage", "modified"])
    && isSessionWorkerId(value.id)
    && isBoundedSessionWorkerText(value.path, SESSION_WORKER_MAX_PATH_LENGTH)
    && path.isAbsolute(value.path)
    && (value.name === null || isBoundedSessionWorkerText(value.name, SESSION_WORKER_MAX_NAME_LENGTH))
    && isBoundedSessionWorkerText(value.firstMessage, SESSION_WORKER_MAX_FIRST_MESSAGE_LENGTH)
    && isBoundedSessionWorkerText(value.modified, SESSION_WORKER_MAX_MODIFIED_LENGTH)
    && Number.isFinite(Date.parse(value.modified));
}

export function isSessionWorkerHistory(value: unknown): value is SavedHistoryPage {
  if (!isSessionWorkerRecord(value)
    || !hasExactKeys(value, ["messages", "page", "total"])
    || !Array.isArray(value.messages)
    || value.messages.length > SESSION_WORKER_MAX_HISTORY_ROWS
    || !isSessionWorkerPage(value.page, HISTORY_PAGE_SIZE)
    || !Number.isSafeInteger(value.total)
    || (value.total as number) < 0
    || (value.total as number) < value.messages.length) return false;

  let totalBytes = 0;
  for (const message of value.messages) {
    if (!isSessionWorkerRecord(message)
      || (!hasExactKeys(message, ["role", "text"]) && !hasExactKeys(message, ["role", "text", "id"]))
      || (message.role !== "user" && message.role !== "assistant")
      || !isBoundedSessionWorkerText(message.text, SESSION_WORKER_MAX_HISTORY_TEXT_LENGTH)
      || (Object.hasOwn(message, "id") && !isBoundedSessionWorkerText(message.id, SESSION_WORKER_MAX_ID_LENGTH))) return false;
    totalBytes += Buffer.byteLength(message.text, "utf8");
    if (totalBytes > SESSION_WORKER_MAX_HISTORY_TOTAL_BYTES) return false;
  }
  return true;
}

export function isSessionWorkerPreview(value: unknown): value is SavedHistoryPreview {
  return isSessionWorkerRecord(value)
    && hasExactKeys(value, ["text", "offset", "nextOffset", "done", "totalChars"])
    && typeof value.text === "string"
    && value.text.length <= SESSION_WORKER_MAX_PREVIEW_TEXT_LENGTH
    && Number.isSafeInteger(value.offset)
    && (value.offset as number) >= 0
    && Number.isSafeInteger(value.nextOffset)
    && (value.nextOffset as number) >= (value.offset as number)
    && Number.isSafeInteger(value.totalChars)
    && (value.totalChars as number) >= (value.nextOffset as number)
    && typeof value.done === "boolean";
}

function unavailable(): ParsedSessionWorkerResponse {
  return { ok: false, code: "unavailable" };
}

export function parseSessionWorkerResponse(value: unknown, request: SessionWorkerRequest): ParsedSessionWorkerResponse {
  if (!isSessionWorkerRecord(value) || value.version !== SESSION_WORKER_PROTOCOL_VERSION || typeof value.ok !== "boolean") return unavailable();
  if (!value.ok) {
    if (!hasExactKeys(value, ["version", "ok", "code"])) return unavailable();
    if (value.code === "wrong-project" || value.code === "stale") return { ok: false, code: value.code };
    return unavailable();
  }

  if (request.action === "list") {
    if (!hasExactKeys(value, ["version", "ok", "action", "entries", "page", "total"])
      || value.action !== "list"
      || !Array.isArray(value.entries)
      || value.entries.length > SESSION_PAGE_SIZE
      || !isSessionWorkerPage(value.page, SESSION_PAGE_SIZE)
      || (value.page as number) !== request.page
      || !Number.isSafeInteger(value.total)
      || (value.total as number) < 0
      || (value.total as number) < value.entries.length) return unavailable();
    const entries = value.entries.filter(isSavedSession);
    if (entries.length !== value.entries.length || new Set(entries.map((entry) => entry.id)).size !== entries.length) return unavailable();
    return { ok: true, kind: "list", entries, page: value.page as number, total: value.total as number };
  }

  if (request.action === "inspect") {
    const session = value.session;
    const history = value.history;
    const anchor = value.anchor;
    if (!hasExactKeys(value, ["version", "ok", "action", "session", "history", "anchor"])
      || value.action !== "inspect"
      || !isSavedSession(session)
      || !isSessionWorkerHistory(history)
      || (anchor !== null && !isSessionWorkerId(anchor))) return unavailable();
    return { ok: true, kind: "inspect", session, history, anchor };
  }

  if (request.action === "history") {
    const history = value.history;
    if (!hasExactKeys(value, ["version", "ok", "action", "history"]) || value.action !== "history" || !isSessionWorkerHistory(history)) return unavailable();
    return { ok: true, kind: "history", history };
  }

  const preview = value.preview;
  if (!hasExactKeys(value, ["version", "ok", "action", "preview"]) || value.action !== "preview" || !isSessionWorkerPreview(preview)) return unavailable();
  return { ok: true, kind: "preview", preview };
}
