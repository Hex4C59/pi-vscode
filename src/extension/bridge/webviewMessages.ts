export const WEBVIEW_MESSAGE_VERSION = 3;
export type * from "../contracts/index.js";
import type { PingMessage, PongMessage, WebviewMessage } from "../contracts/index.js";

import { MAX_CHAT_MESSAGE_CHARS } from "./chatBounds.js";
import { isValidModelRef, isValidProviderId, isValidThinkingLevel, isCustomModelId, isEndpointDisplayName, isPublicHttpUrl } from "../contracts/index.js";



const actions: Record<string, string[]> = {
  openSettings: [], setUiLanguage: ["locale"],
  newConversation: [], refreshSessionUsage: [], renameSession: [], resumeConversation: ["id"], getSavedSessions: ["page"], getSavedHistory: ["page"], getSavedHistoryPreview: ["id", "requestId", "offset"],
  chooseExecutionProfile: ["profile"], answerInteraction: ["id", "answer"], cancelInteraction: ["id"], endOwnedRuntime: [], recoverControlledRuntime: [],
  openProviderApiKey: ["providerId"], openProviderOAuth: ["providerId"], logoutProvider: ["providerId"],
  addCustomEndpoint: ["displayName", "baseUrl", "modelId"], removeCustomEndpoint: ["providerId"],
  setDefaultModel: ["provider", "modelId"], setDefaultThinkingLevel: ["provider", "modelId", "level"], refreshProviderConfig: [],
  addPluginInventoryEntry: [], removePluginInventoryEntry: ["id"], setPluginInventoryEnabled: ["id", "enabled"],
  stopChat: [], openFolder: [], manageTrust: [], getAttachmentHistory: [], getChangeReview: [], openReviewDiff: ["id"], openReviewSource: ["id"],
  decideApproval: ["id", "decision"], revokeGrant: ["id"], chooseResources: ["choice"],
  sendChat: ["draftRevision"], addFileAttachment: ["draftRevision"], addSelectionAttachment: ["draftRevision"],
  completeCommand: ["draftRevision", "name"],
  queueChat: ["draftRevision", "mode"], recallQueuedText: ["queueRevision"],
  useRecoveredText: ["id", "draftRevision"], discardRecoveredText: ["id"],
  updateDraft: ["draftRevision", "editSequence", "text"], removeAttachment: ["draftRevision", "attachmentId"],
  getAttachmentPreview: ["requestId", "snapshotId", "offset"],
  confirmFileAttachment: ["draftRevision", "attachmentId", "snapshotId"],
  confirmSelectionAttachment: ["draftRevision", "attachmentId", "snapshotId"],
  setThinkingLevel: ["level"], setChatModel: ["provider", "modelId"],
};

function validateActionPayload(message: Record<string, unknown>): boolean {
  if (message.type === 'decideApproval' || message.type === 'revokeGrant') {

    if (message.type === 'decideApproval' && (typeof message.decision !== 'string' || !['once','session','deny'].includes(message.decision))) return false;
  }
  if (message.type === "chooseResources" && message.choice !== "allow" && message.choice !== "decline") return false;
  if (message.type === "setUiLanguage" && message.locale !== "en" && message.locale !== "zh-CN") return false;
  if (message.type === "completeCommand" && (typeof message.name !== "string" || !message.name
    || Buffer.byteLength(message.name) > 200 || /[\s/]/.test(message.name))) return false;
  if (message.type === "queueChat" && message.mode !== "steering" && message.mode !== "follow-up") return false;
  if (message.type === "updateDraft" && (typeof message.text !== "string" || message.text.length > MAX_CHAT_MESSAGE_CHARS)) return false;
  if ((message.type === "setThinkingLevel" || message.type === "setDefaultThinkingLevel")) {
    if (typeof message.level !== "string" || !isValidThinkingLevel(message.level)) return false;
  }
  if (message.type === "setChatModel") {
    if (typeof message.provider !== "string" || typeof message.modelId !== "string") return false;
    if (!isValidModelRef(message.provider, message.modelId)) return false;
  }
  if ((message.type === "setDefaultModel" || message.type === "setDefaultThinkingLevel")) {
    if (typeof message.provider !== "string" || typeof message.modelId !== "string") return false;
    if (!isValidModelRef(message.provider, message.modelId)) return false;
  }
  if (message.type === "openProviderApiKey" || message.type === "openProviderOAuth" || message.type === "logoutProvider" || message.type === "removeCustomEndpoint") {
    if (typeof message.providerId !== "string" || !isValidProviderId(message.providerId)) return false;
  }
  if (message.type === "addCustomEndpoint") {
    if (typeof message.displayName !== "string" || !isEndpointDisplayName(message.displayName)) return false;
    if (typeof message.baseUrl !== "string" || !isPublicHttpUrl(message.baseUrl)) return false;
    if (typeof message.modelId !== "string" || !isCustomModelId(message.modelId)) return false;
  }
  if (message.type === "setPluginInventoryEnabled" && typeof message.enabled !== "boolean") return false;
  if (message.type === "chooseExecutionProfile" && message.profile !== "controlled" && message.profile !== "trusted") return false;
  return true;
}

function validateInteractionPayload(message: Record<string, unknown>): boolean {
  if (message.type === "answerInteraction") {
    const answer = message.answer;
    if (!answer || typeof answer !== "object" || Array.isArray(answer)) return false;
    const prototype: unknown = Object.getPrototypeOf(answer);
    if (prototype !== Object.prototype && prototype !== null) return false;
    const keys = Reflect.ownKeys(answer);
    if (keys.some(key => !Object.getOwnPropertyDescriptor(answer, key)?.enumerable || !Object.hasOwn(Object.getOwnPropertyDescriptor(answer, key) ?? {}, "value"))) return false;
    const value = answer as Record<string, unknown>;
    const field = value.method === "select" ? "optionId" : value.method === "confirm" ? "value" : value.method === "input" || value.method === "editor" ? "text" : undefined;
    if (!field || keys.length !== 2 || !keys.includes("method") || !keys.includes(field)) return false;
    if (field === "optionId" && (typeof value.optionId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(value.optionId))) return false;
    if (field === "value" && typeof value.value !== "boolean") return false;
    if (field === "text" && (typeof value.text !== "string" || value.text.length > 32768 || Buffer.byteLength(value.text, "utf8") > 32768)) return false;
  }
  return true;
}

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
  const bootstrap = message.type === "ping" || message.type === "getWorkspaceState";
  if (!bootstrap && (typeof message.type !== "string" || !Object.hasOwn(actions, message.type))) return undefined;
  const expected = bootstrap ? ["version", "type"] : ["version", "type", "generation", "viewId", ...actions[message.type as string]];
  for (const key of ["viewId", "attachmentId", "snapshotId", "requestId", "id"]) {
    if (expected.includes(key) && (typeof message[key] !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(message[key]))) return undefined;
  }
  for (const key of ["draftRevision", "editSequence", "offset", "page", "queueRevision"]) {
    if (expected.includes(key) && (!Number.isSafeInteger(message[key]) || (message[key] as number) < 0)) return undefined;
  }
  if (fields.length !== expected.length || fields.some((key) => typeof key !== "string" || !expected.includes(key))) return undefined;
  if (expected.includes("generation") && (!Number.isSafeInteger(message.generation) || (message.generation as number) < 0)) return undefined;
  if (!validateActionPayload(message)) return undefined;
  if (!validateInteractionPayload(message)) return undefined;
  return message as WebviewMessage;
}

export function isPingMessage(value: unknown): value is PingMessage {
  return parseWebviewMessage(value)?.type === "ping";
}

export function handleWebviewMessage(value: unknown): PongMessage | undefined {
  return isPingMessage(value) ? { version: WEBVIEW_MESSAGE_VERSION, type: "pong" } : undefined;
}
