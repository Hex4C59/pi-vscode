import type { HostMessage } from "../extension/contracts/index.js";

type DataRecord = Record<string, unknown>;

const integer = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const string = (value: unknown, limit = 65536): value is string => typeof value === "string" && value.length <= limit;
const nullableString = (value: unknown) => value === null || string(value);
const oneOf = (value: unknown, values: readonly string[]) => typeof value === "string" && values.includes(value);
const id = (value: unknown) => typeof value === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value);
const encoder = new TextEncoder();
// The code-unit limit only bounds encoding work; UTF-8 byte length is authoritative.
const relativePath = (value: unknown) => string(value, 1024) && encoder.encode(value).byteLength <= 1024;
const reviewPath = (value: unknown) => value === null || (string(value, 1024) && encoder.encode(value).byteLength <= 1024);
const codes = ["no-editor", "empty-selection", "multiple-selections", "cancelled", "busy", "stale", "ineligible", "attachment-limit", "total-too-large", "invalid-source", "outside-workspace", "unavailable", "not-text", "source-too-large", "text-too-large", "metadata-too-large", "sensitive-source", "source-changed", "history-full", "frame-too-large", "preparation-cancelled", "write-failed", "ack-timeout", "rpc-rejected", "runtime-lost"];
const reviewReasons = ["outside-project", "sensitive-source", "not-text", "too-large", "unavailable", "changed-during-capture", "no-before-snapshot", "retention-limit", "not-applied"] as const;

/** Copy own enumerable data properties without reading caller-provided accessors. */
function snapshotRecord(value: unknown): DataRecord | undefined {
  try {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return;

    const snapshot: DataRecord = {};
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") return;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value")) return;
      Object.defineProperty(snapshot, key, {
        value: descriptor.value,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return snapshot;
  } catch {
    return;
  }
}

function hasFields(value: DataRecord, required: readonly string[], optional: readonly string[] = []): boolean {
  const allowed = new Set([...required, ...optional]);
  const fields = Object.keys(value);
  return required.every(key => Object.hasOwn(value, key)) && fields.length <= allowed.size && fields.every(key => allowed.has(key));
}

function exactRecord(value: unknown, required: readonly string[], optional: readonly string[] = []): DataRecord | undefined {
  const snapshot = snapshotRecord(value);
  return snapshot && hasFields(snapshot, required, optional) ? snapshot : undefined;
}

/** Return only dense arrays of own data elements; custom fields and accessors are not DTO data. */
function snapshotArray(value: unknown, max: number): unknown[] | undefined {
  try {
    if (!Array.isArray(value)) return;
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    if (!lengthDescriptor || lengthDescriptor.enumerable || !Object.hasOwn(lengthDescriptor, "value")) return;
    const length = lengthDescriptor.value;
    if (!integer(length) || length > max) return;

    const fields = Reflect.ownKeys(value);
    if (fields.length !== length + 1 || !fields.includes("length")) return;
    const items: unknown[] = [];
    for (let index = 0; index < length; index++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value")) return;
      items.push(descriptor.value);
    }
    return items;
  } catch {
    return;
  }
}

function list<T>(value: unknown, max: number, parseItem: (item: unknown) => T | undefined): T[] | undefined {
  const items = snapshotArray(value, max);
  if (!items) return;
  const parsed: T[] = [];
  for (const item of items) {
    const projection = parseItem(item);
    if (projection === undefined) return;
    parsed.push(projection);
  }
  return parsed;
}

function parseModel(value: unknown): DataRecord | undefined {
  const model = exactRecord(value, ["provider", "modelId", "label"]);
  return model && string(model.provider, 200) && string(model.modelId, 200) && string(model.label, 1000) ? model : undefined;
}

function parseFolder(value: unknown): DataRecord | undefined {
  const folder = exactRecord(value, ["name", "path"]);
  return folder && string(folder.name) && string(folder.path) ? folder : undefined;
}

function parseChatLine(value: unknown): DataRecord | undefined {
  const line = exactRecord(value, ["role", "text"], ["id"]);
  return line && oneOf(line.role, ["user", "assistant"]) && string(line.text)
    && (!Object.hasOwn(line, "id") || string(line.id, 200)) ? line : undefined;
}

function parseSavedHistoryLine(value: unknown): DataRecord | undefined {
  const line = exactRecord(value, ["role", "text"], ["id"]);
  return line && oneOf(line.role, ["user", "assistant"]) && string(line.text, 4096)
    && encoder.encode(line.text).byteLength <= 4096 && (!Object.hasOwn(line, "id") || id(line.id)) ? line : undefined;
}

function parseActivity(value: unknown): DataRecord | undefined {
  const activity = exactRecord(value, ["id", "kind", "messageId", "text", "status", "truncated"], ["contentIndex", "toolCallId", "tool", "input"]);
  if (!activity || !string(activity.id, 512) || !string(activity.messageId, 200)
    || !oneOf(activity.kind, ["thinking", "tool"]) || !string(activity.text)
    || !oneOf(activity.status, ["thinking", "preparing", "executing", "complete", "failed", "interrupted"])
    || typeof activity.truncated !== "boolean") return;
  if (Object.hasOwn(activity, "contentIndex") && !integer(activity.contentIndex)) return;
  if (Object.hasOwn(activity, "toolCallId") && !string(activity.toolCallId, 200)) return;
  if (Object.hasOwn(activity, "tool") && !string(activity.tool, 200)) return;
  if (Object.hasOwn(activity, "input") && !string(activity.input)) return;
  return activity;
}

function parseApproval(value: unknown): DataRecord | undefined {
  const approval = exactRecord(value, ["id", "toolCallId", "tool", "input", "scope", "expiresAt"]);
  return approval && string(approval.id, 100) && string(approval.toolCallId, 200) && string(approval.tool, 200)
    && string(approval.input, 32768) && nullableString(approval.scope) && integer(approval.expiresAt) ? approval : undefined;
}

function parseGrant(value: unknown): DataRecord | undefined {
  const grant = exactRecord(value, ["id", "scope"]);
  return grant && string(grant.id, 100) && string(grant.scope) ? grant : undefined;
}

function parseAttachmentDetails(value: DataRecord): DataRecord | undefined {
  if (value.kind === "file") return !Object.hasOwn(value, "originalRange") && !Object.hasOwn(value, "stale") ? value : undefined;
  if (value.kind !== "selection" || typeof value.stale !== "boolean") return;
  const range = exactRecord(value.originalRange, ["start", "end"]);
  if (!range) return;
  const start = exactRecord(range.start, ["line", "character"]); const end = exactRecord(range.end, ["line", "character"]);
  if (!start || !end || !integer(start.line) || !integer(start.character) || !integer(end.line) || !integer(end.character)
    || start.line > end.line || (start.line === end.line && start.character >= end.character)) return;
  return { ...value, originalRange: { start, end } };
}

function parseDraftAttachment(value: unknown): DataRecord | undefined {
  const attachment = exactRecord(value, ["attachmentId", "snapshotId", "relativePath", "kind", "utf8Bytes", "unsaved", "state"], ["originalRange", "stale"]);
  return attachment && id(attachment.attachmentId) && id(attachment.snapshotId) && relativePath(attachment.relativePath)
    && integer(attachment.utf8Bytes) && attachment.utf8Bytes <= 262144 && typeof attachment.unsaved === "boolean"
    && oneOf(attachment.state, ["attached", "changed", "confirmation-required", "unavailable"]) ? parseAttachmentDetails(attachment) : undefined;
}

function parseAttachmentResult(value: unknown): DataRecord | undefined {
  const result = exactRecord(value, ["code"]);
  return result && oneOf(result.code, codes) ? result : undefined;
}

function parseLastSubmission(value: unknown): DataRecord | undefined {
  const submission = exactRecord(value, ["submissionId", "draftRevision", "delivery", "outcome"]);
  return submission && id(submission.submissionId) && integer(submission.draftRevision)
    && string(submission.delivery, 100) && string(submission.outcome, 100) ? submission : undefined;
}

function parseHistoryEntry(value: unknown): DataRecord | undefined {
  const entry = exactRecord(value, ["snapshotId", "relativePath", "kind", "utf8Bytes", "unsaved", "submissionId", "delivery", "outcome"], ["originalRange", "stale"]);
  return entry && id(entry.snapshotId) && relativePath(entry.relativePath)
    && integer(entry.utf8Bytes) && entry.utf8Bytes <= 262144 && typeof entry.unsaved === "boolean" && id(entry.submissionId)
    && string(entry.delivery, 100) && string(entry.outcome, 100) ? parseAttachmentDetails(entry) : undefined;
}

function parseChangeReviewEntry(value: unknown): DataRecord | undefined {
  const entry = exactRecord(value, ["id", "taskId", "path", "source", "tool", "status", "diff", "reason", "sourceChanged", "overlap"]);
  return entry && id(entry.id) && id(entry.taskId) && reviewPath(entry.path)
    && oneOf(entry.source, ["tool", "observed"])
    && (entry.tool === null || oneOf(entry.tool, ["write", "edit"]))
    && oneOf(entry.status, ["pending", "complete", "failed", "interrupted", "observed"])
    && oneOf(entry.diff, ["pending", "ready", "unchanged", "unavailable"])
    && (entry.reason === null || oneOf(entry.reason, reviewReasons))
    && typeof entry.sourceChanged === "boolean" && typeof entry.overlap === "boolean" ? entry : undefined;
}

function parseSessionCurrent(value: unknown): DataRecord | undefined {
  const current = exactRecord(value, ["id", "name"]);
  return current && id(current.id) && nullableString(current.name) ? current : undefined;
}

function parseSessionEntry(value: unknown): DataRecord | undefined {
  const entry = exactRecord(value, ["id", "title", "excerpt", "modified"]);
  return entry && id(entry.id) && string(entry.title, 160) && string(entry.excerpt, 256) && string(entry.modified, 40) ? entry : undefined;
}

/** Narrow and copy the complete v2 DTO before the browser consumes host data. */
export function parseHostMessage(value: unknown): HostMessage | undefined {
  const message = snapshotRecord(value);
  if (!message || message.version !== 2 || !integer(message.generation) || !id(message.viewId)) return;
  const envelope = ["version", "type", "generation", "viewId"];

  switch (message.type) {
    case "pong":
      return hasFields(message, envelope) ? message as unknown as HostMessage : undefined;

    case "workspaceState": {
      const required = [...envelope, "status", "folder", "choice", "busy", "error", "runtime", "runtimeDetail", "messages", "chatBusy", "chatError", "chatModel", "thinkingLevel", "thinkingLevels", "availableModels", "pendingModel", "pendingThinkingLevel", "modelBusy", "modelError", "activities", "approvals", "grants", "execution", "controlledExecution"];
      if (!hasFields(message, required)
        || !oneOf(message.status, ["no-folder", "multi-root", "remote", "non-file", "untrusted", "eligible"])
        || (message.choice !== null && !oneOf(message.choice, ["allow", "decline"]))
        || typeof message.busy !== "boolean" || typeof message.chatBusy !== "boolean" || typeof message.modelBusy !== "boolean"
        || message.controlledExecution !== true
        || !oneOf(message.runtime, ["not-started", "starting", "ready", "stopping", "error"])
        || !oneOf(message.execution, ["idle", "waiting", "thinking", "awaiting-approval", "executing", "replying", "stopping", "failed"])
        || ![message.error, message.runtimeDetail, message.chatError, message.chatModel, message.thinkingLevel, message.pendingThinkingLevel, message.modelError].every(nullableString)) return;

      const folder = message.folder === null ? null : parseFolder(message.folder);
      const pendingModel = message.pendingModel === null ? null : parseModel(message.pendingModel);
      const thinkingLevels = list(message.thinkingLevels, 64, item => string(item, 100) ? item : undefined);
      const availableModels = list(message.availableModels, 64, parseModel);
      const messages = list(message.messages, 32, parseChatLine);
      const activities = list(message.activities, 64, parseActivity);
      const approvals = list(message.approvals, 8, parseApproval);
      const grants = list(message.grants, 64, parseGrant);
      if ((message.folder !== null && !folder) || (message.pendingModel !== null && !pendingModel)
        || !thinkingLevels || !availableModels || !messages || !activities || !approvals || !grants) return;

      return {
        ...message,
        folder,
        pendingModel,
        thinkingLevels,
        availableModels,
        messages,
        activities,
        approvals,
        grants,
      } as unknown as HostMessage;
    }

    case "attachmentState": {
      const required = [...envelope, "draft", "preparation", "result", "historyCount", "retainedBytes", "lastSubmission"];
      if (!hasFields(message, required) || !oneOf(message.preparation, ["idle", "picking", "preparing"])
        || !integer(message.historyCount) || !integer(message.retainedBytes)) return;

      const draft = exactRecord(message.draft, ["revision", "text", "acceptedEditSequence", "attachments"]);
      const result = message.result === null ? null : parseAttachmentResult(message.result);
      const lastSubmission = message.lastSubmission === null ? null : parseLastSubmission(message.lastSubmission);
      if (!draft || !integer(draft.revision) || !string(draft.text, 8000) || !integer(draft.acceptedEditSequence)
        || (message.result !== null && !result) || (message.lastSubmission !== null && !lastSubmission)) return;
      const attachments = list(draft.attachments, 20, parseDraftAttachment);
      if (!attachments || new Set(attachments.map(a => a.attachmentId)).size !== attachments.length
        || new Set(attachments.map(a => a.snapshotId)).size !== attachments.length
        || attachments.reduce((bytes, a) => bytes + (a.utf8Bytes as number), 0) > 1048576) return;
      return {
        ...message,
        draft: { ...draft, attachments },
        result,
        lastSubmission,
      } as unknown as HostMessage;
    }

    case "attachmentHistory": {
      const required = [...envelope, "entries"];
      if (!hasFields(message, required)) return;
      const entries = list(message.entries, 128, parseHistoryEntry);
      return entries ? { ...message, entries } as unknown as HostMessage : undefined;
    }

    case "changeReviewState": {
      const required = [...envelope, "entries", "retainedBytes", "limited", "reset", "error"];
      if (!hasFields(message, required) || !integer(message.retainedBytes) || message.retainedBytes > 8_388_608
        || typeof message.limited !== "boolean" || typeof message.reset !== "boolean"
        || (message.error !== null && !oneOf(message.error, ["unavailable", "stale"]))) return;
      const entries = list(message.entries, 128, parseChangeReviewEntry);
      return entries && new Set(entries.map(entry => entry.id)).size === entries.length
        ? { ...message, entries } as unknown as HostMessage : undefined;
    }

    case "sessionState": {
      const required = [...envelope, "phase", "current", "loaded", "entries", "page", "total", "error"];
      if (!hasFields(message, required) || !oneOf(message.phase, ["idle", "listing", "confirming", "switching", "error"])
        || typeof message.loaded !== "boolean" || !integer(message.page) || !integer(message.total)
        || (message.error !== null && !oneOf(message.error, ["unavailable", "cancelled", "stale", "wrong-project", "stop-failed", "restore-failed"]))) return;

      const current = message.current === null ? null : parseSessionCurrent(message.current);
      const entries = list(message.entries, 16, parseSessionEntry);
      if (message.current !== null && !current || !entries || new Set(entries.map(entry => entry.id)).size !== entries.length) return;
      return { ...message, current, entries } as unknown as HostMessage;
    }

    case "savedHistoryState": {
      const required = [...envelope, "available", "phase", "messages", "page", "total", "error"];
      if (!hasFields(message, required) || typeof message.available !== "boolean"
        || !oneOf(message.phase, ["idle", "loading", "error"]) || !integer(message.page) || !integer(message.total)
        || (message.error !== null && !oneOf(message.error, ["unavailable", "stale", "cancelled"]))) return;
      const messages = list(message.messages, 32, parseSavedHistoryLine);
      if (!messages) return;
      const ids = messages.filter(line => Object.hasOwn(line, "id")).map(line => line.id);
      return new Set(ids).size === ids.length ? { ...message, messages } as unknown as HostMessage : undefined;
    }

    case "savedHistoryPreview": {
      const common = [...envelope, "requestId", "id"];
      if (!id(message.requestId) || !id(message.id)) return;
      if (Object.hasOwn(message, "code")) {
        return hasFields(message, [...common, "code"]) && oneOf(message.code, ["unavailable", "stale", "cancelled"])
          ? message as unknown as HostMessage : undefined;
      }
      return hasFields(message, [...common, "text", "offset", "nextOffset", "done", "totalChars"])
        && string(message.text, 8192) && integer(message.offset) && integer(message.nextOffset)
        && integer(message.totalChars) && typeof message.done === "boolean" ? message as unknown as HostMessage : undefined;
    }

    case "attachmentPreview": {
      const common = [...envelope, "requestId"];
      if (!id(message.requestId)) return;
      if (Object.hasOwn(message, "code")) {
        const errorFields = [...common, "code"];
        return hasFields(message, errorFields) && oneOf(message.code, codes) ? message as unknown as HostMessage : undefined;
      }
      const contentFields = [...common, "snapshotId", "offset", "nextOffset", "done", "text"];
      return hasFields(message, contentFields) && id(message.snapshotId) && integer(message.offset)
        && integer(message.nextOffset) && typeof message.done === "boolean" && string(message.text, 16384)
        ? message as unknown as HostMessage : undefined;
    }
  }
}
