export const WEBVIEW_MESSAGE_VERSION = 1;

export type ResourceChoice = "allow" | "decline";
export type WorkspaceStatus = "no-folder" | "multi-root" | "remote" | "non-file" | "untrusted" | "eligible";
export type PingMessage = { version: 1; type: "ping" };
export type PongMessage = { version: 1; type: "pong" };
export type WebviewMessage = PingMessage
  | { version: 1; type: "getWorkspaceState" }
  | { version: 1; type: "openFolder" | "manageTrust"; generation: number }
  | { version: 1; type: "chooseResources"; generation: number; choice: ResourceChoice };
export type WorkspaceStateMessage = {
  version: 1;
  type: "workspaceState";
  generation: number;
  status: WorkspaceStatus;
  folder: { name: string; path: string } | null;
  choice: ResourceChoice | null;
  busy: boolean;
  error: string | null;
  runtime: "not-started";
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
    : message.type === "openFolder" || message.type === "manageTrust"
      ? ["version", "type", "generation"]
      : message.type === "chooseResources" ? ["version", "type", "generation", "choice"] : [];
  if (fields.length !== expected.length || fields.some((key) => typeof key !== "string" || !expected.includes(key))) return undefined;
  if (expected.includes("generation") && (!Number.isSafeInteger(message.generation) || (message.generation as number) < 0)) return undefined;
  if (message.type === "chooseResources" && message.choice !== "allow" && message.choice !== "decline") return undefined;
  return message as WebviewMessage;
}

export function isPingMessage(value: unknown): value is PingMessage {
  return parseWebviewMessage(value)?.type === "ping";
}

export function handleWebviewMessage(value: unknown): PongMessage | undefined {
  return isPingMessage(value) ? { version: WEBVIEW_MESSAGE_VERSION, type: "pong" } : undefined;
}
