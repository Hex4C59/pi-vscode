export const WEBVIEW_MESSAGE_VERSION = 2;
export type * from "../contracts/webviewProtocol.js";
import type { PingMessage, PongMessage, WebviewMessage } from "../contracts/webviewProtocol.js";

import { MAX_CHAT_MESSAGE_CHARS } from "./chatBounds.js";
import { isValidModelRef, isValidThinkingLevel } from "../models/modelCatalog.js";



export function parseWebviewMessage(value: unknown): WebviewMessage | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return undefined;
  const fields = Reflect.ownKeys(value);
  // No accessors: validation must not execute caller-provided code.
  if (fields.some((key) => !Object.getOwnPropertyDescriptor(value, key)?.enumerable
    || !Object.hasOwn(Object.getOwnPropertyDescriptor(value, key) ?? {}, "value"))) return undefined;
  const message = value as Record<string, unknown>;
  if (message.version !== WEBVIEW_MESSAGE_VERSION) return undefined;
  const actions: Record<string, string[]> = {
    newConversation: [], resumeConversation: ["id"], getSavedSessions: ["page"], getSavedHistory: ["page"], getSavedHistoryPreview: ["id", "requestId", "offset"],
    stopChat: [], openFolder: [], manageTrust: [], getAttachmentHistory: [], getChangeReview: [], openReviewDiff: ["id"], openReviewSource: ["id"],
    decideApproval: ["id", "decision"], revokeGrant: ["id"], chooseResources: ["choice"],
    sendChat: ["draftRevision"], addFileAttachment: ["draftRevision"], addSelectionAttachment: ["draftRevision"],
    updateDraft: ["draftRevision", "editSequence", "text"], removeAttachment: ["draftRevision", "attachmentId"],
    getAttachmentPreview: ["requestId", "snapshotId", "offset"],
    confirmFileAttachment: ["draftRevision", "attachmentId", "snapshotId"],
    confirmSelectionAttachment: ["draftRevision", "attachmentId", "snapshotId"],
    setThinkingLevel: ["level"], setChatModel: ["provider", "modelId"],
  };
  const bootstrap = message.type === "ping" || message.type === "getWorkspaceState";
  if (!bootstrap && (typeof message.type !== "string" || !Object.hasOwn(actions, message.type))) return undefined;
  const expected = bootstrap ? ["version", "type"] : ["version", "type", "generation", "viewId", ...actions[message.type as string]];
  for (const key of ["viewId", "attachmentId", "snapshotId", "requestId", "id"]) {
    if (expected.includes(key) && (typeof message[key] !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(message[key]))) return undefined;
  }
  for (const key of ["draftRevision", "editSequence", "offset", "page"]) {
    if (expected.includes(key) && (!Number.isSafeInteger(message[key]) || (message[key] as number) < 0)) return undefined;
  }
  if (fields.length !== expected.length || fields.some((key) => typeof key !== "string" || !expected.includes(key))) return undefined;
  if (expected.includes("generation") && (!Number.isSafeInteger(message.generation) || (message.generation as number) < 0)) return undefined;
  if (message.type === 'decideApproval' || message.type === 'revokeGrant') {

    if (message.type === 'decideApproval' && (typeof message.decision !== 'string' || !['once','session','deny'].includes(message.decision))) return undefined;
  }
  if (message.type === "chooseResources" && message.choice !== "allow" && message.choice !== "decline") return undefined;
  if (message.type === "updateDraft" && (typeof message.text !== "string" || message.text.length > MAX_CHAT_MESSAGE_CHARS)) return undefined;
  if (message.type === "setThinkingLevel") {
    if (typeof message.level !== "string" || !isValidThinkingLevel(message.level)) return undefined;
  }
  if (message.type === "setChatModel") {
    if (typeof message.provider !== "string" || typeof message.modelId !== "string") return undefined;
    if (!isValidModelRef(message.provider, message.modelId)) return undefined;
  }
  return message as WebviewMessage;
}

export function isPingMessage(value: unknown): value is PingMessage {
  return parseWebviewMessage(value)?.type === "ping";
}

export function handleWebviewMessage(value: unknown): PongMessage | undefined {
  return isPingMessage(value) ? { version: WEBVIEW_MESSAGE_VERSION, type: "pong" } : undefined;
}
