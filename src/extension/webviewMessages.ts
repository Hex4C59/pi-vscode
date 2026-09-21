export const WEBVIEW_MESSAGE_VERSION = 1;

import { MAX_CHAT_MESSAGE_CHARS } from "./chatBounds.js";
import { isValidModelRef, isValidThinkingLevel, type ModelCatalogEntry } from "./modelCatalog.js";
import type { RuntimePhase } from "./runtimeLifecycle.js";

import type { ActivityItem } from "./runtimeLifecycle.js";
import type { ApprovalCard, SessionGrant, ApprovalDecision } from "./toolApproval.js";

export type ResourceChoice = "allow" | "decline";
export type WorkspaceStatus = "no-folder" | "multi-root" | "remote" | "non-file" | "untrusted" | "eligible";
export type ChatRole = "user" | "assistant";
export type ChatLine = { role: ChatRole; text: string; id?: string };
export type PingMessage = { version: 1; type: "ping" };
export type PongMessage = { version: 1; type: "pong" };
export type WebviewMessage = PingMessage
  | { version: 1; type: "stopChat"; generation: number }
  | { version: 1; type: "decideApproval"; generation: number; id: string; decision: ApprovalDecision }
  | { version: 1; type: "revokeGrant"; generation: number; id: string }
  | { version: 1; type: "getWorkspaceState" }
  | { version: 1; type: "openFolder" | "manageTrust"; generation: number }
  | { version: 1; type: "chooseResources"; generation: number; choice: ResourceChoice }
  | { version: 1; type: "sendChat"; generation: number; text: string }
  | { version: 1; type: "setThinkingLevel"; generation: number; level: string }
  | { version: 1; type: "setChatModel"; generation: number; provider: string; modelId: string };
export type WorkspaceStateMessage = {
  version: 1;
  type: "workspaceState";
  generation: number;
  status: WorkspaceStatus;
  folder: { name: string; path: string } | null;
  choice: ResourceChoice | null;
  busy: boolean;
  error: string | null;
  runtime: RuntimePhase;
  runtimeDetail: string | null;
  messages: ChatLine[];
  chatBusy: boolean;
  chatError: string | null;
  chatModel: string | null;
  thinkingLevel: string | null;
  thinkingLevels: string[];
  availableModels: ModelCatalogEntry[];
  /** Host-owned next-turn intent; never represents applied runtime configuration. */
  pendingModel: ModelCatalogEntry | null;
  pendingThinkingLevel: string | null;
  modelBusy: boolean;
  modelError: string | null;
  activities: ActivityItem[];
  approvals: ApprovalCard[];
  grants: SessionGrant[];
  execution: "idle" | "waiting" | "thinking" | "awaiting-approval" | "executing" | "replying" | "stopping" | "failed";
  controlledExecution: true;
};

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
  const expected = message.type === "ping" || message.type === "getWorkspaceState"
    ? ["version", "type"]
    : message.type === 'decideApproval' ? ['version','type','generation','id','decision']
    : message.type === 'revokeGrant' ? ['version','type','generation','id']
    : message.type === "openFolder" || message.type === "manageTrust" || message.type === 'stopChat'
      ? ["version", "type", "generation"]
      : message.type === "chooseResources"
        ? ["version", "type", "generation", "choice"]
        : message.type === "sendChat"
          ? ["version", "type", "generation", "text"]
          : message.type === "setThinkingLevel"
            ? ["version", "type", "generation", "level"]
            : message.type === "setChatModel"
              ? ["version", "type", "generation", "provider", "modelId"]
              : [];
  if (fields.length !== expected.length || fields.some((key) => typeof key !== "string" || !expected.includes(key))) return undefined;
  if (expected.includes("generation") && (!Number.isSafeInteger(message.generation) || (message.generation as number) < 0)) return undefined;
  if (message.type === 'decideApproval' || message.type === 'revokeGrant') {
    if (typeof message.id !== 'string' || !message.id || message.id.length > 100) return undefined;
    if (message.type === 'decideApproval' && !['once','session','deny'].includes(String(message.decision))) return undefined;
  }
  if (message.type === "chooseResources" && message.choice !== "allow" && message.choice !== "decline") return undefined;
  if (message.type === "sendChat") {
    if (typeof message.text !== "string") return undefined;
    const text = message.text.trim();
    if (!text || text.length > MAX_CHAT_MESSAGE_CHARS) return undefined;
  }
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
