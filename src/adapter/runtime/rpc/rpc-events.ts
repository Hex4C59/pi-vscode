/** Only fields consumed by live projections are decoded; upstream metadata stays opaque. */
export type ContentPart = { type: string; text?: string; thinking?: string };
type Message = { role: string; content?: ContentPart[]; stopReason?: string; errorMessage?: string };
type MessageUpdate = { type: string; contentIndex?: number; delta?: string; content?: string };
export type RuntimeFrameEvent =
  | { type: "agent_start" | "agent_settled" }
  | { type: "message_start" | "message_end"; message: Message }
  | { type: "message_update"; assistantMessageEvent: MessageUpdate }
  | { type: "tool_execution_start" | "tool_execution_update" | "tool_execution_end"; toolCallId: string; toolName?: string; input?: string; content?: ContentPart[]; isError?: boolean }
  | { type: "compaction_start" | "compaction_end"; reason: "manual" | "threshold" | "overflow"; aborted?: boolean; willRetry?: boolean; errorMessage?: string }
  | { type: "auto_retry_start"; attempt: number; maxAttempts: number; delayMs: number }
  | { type: "auto_retry_end"; success: boolean; finalError?: string };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
const optionalString = (value: unknown): value is string | undefined => value === undefined || typeof value === "string";
const index = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

function content(value: unknown): ContentPart[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const parts: ContentPart[] = [];
  for (const part of value) {
    if (!isRecord(part) || typeof part.type !== "string" || !part.type) return undefined;
    if (part.type === "text") {
      if (typeof part.text !== "string") return undefined;
      parts.push({ type: part.type, text: part.text });
    } else if (part.type === "thinking") {
      if (typeof part.thinking !== "string") return undefined;
      parts.push({ type: part.type, thinking: part.thinking });
    } else parts.push({ type: part.type }); // Keep indexes for undisplayed image/toolcall blocks.
  }
  return parts;
}

type DecodedEvent = { kind: "event"; event: RuntimeFrameEvent } | { kind: "ignored" } | { kind: "protocol-error" };
const invalid = { kind: "protocol-error" } as const;
export function decodeRuntimeEvent(raw: Record<string, unknown>): DecodedEvent {
  const type = raw.type;
  switch (type) {
    case "agent_start": case "agent_settled":
      return { kind: "event", event: { type } };
    case "message_start": case "message_end": {
      const message = raw.message;
      if (!isRecord(message) || typeof message.role !== "string" || !message.role) return invalid;
      if (message.role !== "assistant") return { kind: "event", event: { type, message: { role: message.role } } };
      const parts = message.content === undefined && type === "message_start" ? undefined : content(message.content);
      if ((parts === undefined && (type === "message_end" || message.content !== undefined))
        || !optionalString(message.stopReason) || !optionalString(message.errorMessage)) return invalid;
      return { kind: "event", event: { type, message: { role: message.role, content: parts, stopReason: message.stopReason, errorMessage: message.errorMessage } } };
    }
    case "message_update": {
      const update = raw.assistantMessageEvent;
      if (!isRecord(update) || typeof update.type !== "string") return invalid;
      if (!["text_delta", "thinking_start", "thinking_delta", "thinking_end"].includes(update.type)) return { kind: "ignored" };
      if ((update.type.startsWith("thinking_") || update.contentIndex !== undefined) && !index(update.contentIndex)) return invalid;
      if ((update.type === "text_delta" || update.type === "thinking_delta") && typeof update.delta !== "string") return invalid;
      if (update.type === "thinking_end" && typeof update.content !== "string") return invalid;
      return { kind: "event", event: { type, assistantMessageEvent: {
        type: update.type, contentIndex: index(update.contentIndex) ? update.contentIndex : undefined,
        delta: typeof update.delta === "string" ? update.delta : undefined,
        content: typeof update.content === "string" ? update.content : undefined,
      } } };
    }
    case "tool_execution_start": case "tool_execution_update": case "tool_execution_end": {
      if (typeof raw.toolCallId !== "string" || !raw.toolCallId || raw.toolCallId.length > 200 || !optionalString(raw.toolName)) return invalid;
      if (type === "tool_execution_end" && typeof raw.isError !== "boolean") return invalid;
      const result = type === "tool_execution_update" ? raw.partialResult : type === "tool_execution_end" ? raw.result : undefined;
      const parts = result === undefined && type === "tool_execution_start" ? undefined : isRecord(result) ? content(result.content) : undefined;
      if (type !== "tool_execution_start" && parts === undefined) return invalid;
      let input: string | undefined;
      // JSON.parse can admit nesting that JSON.stringify cannot project. Fail before state mutation.
      try { input = raw.args ? JSON.stringify(raw.args) : undefined; } catch { return invalid; }
      return { kind: "event", event: { type, toolCallId: raw.toolCallId, toolName: raw.toolName, input, content: parts, isError: typeof raw.isError === "boolean" ? raw.isError : undefined } };
    }
    case "compaction_start": case "compaction_end": {
      if (raw.reason !== "manual" && raw.reason !== "threshold" && raw.reason !== "overflow") return invalid;
      if (type === "compaction_end" && (typeof raw.aborted !== "boolean" || typeof raw.willRetry !== "boolean" || !optionalString(raw.errorMessage))) return invalid;
      return { kind: "event", event: { type, reason: raw.reason,
        aborted: typeof raw.aborted === "boolean" ? raw.aborted : undefined,
        willRetry: typeof raw.willRetry === "boolean" ? raw.willRetry : undefined,
        errorMessage: typeof raw.errorMessage === "string" ? raw.errorMessage : undefined,
      } };
    }
    case "auto_retry_start":
      if (!index(raw.attempt) || raw.attempt < 1 || !index(raw.maxAttempts) || raw.maxAttempts < raw.attempt
        || typeof raw.delayMs !== "number" || !Number.isFinite(raw.delayMs) || raw.delayMs < 0) return invalid;
      return { kind: "event", event: { type, attempt: raw.attempt, maxAttempts: raw.maxAttempts, delayMs: raw.delayMs } };
    case "auto_retry_end":
      if (typeof raw.success !== "boolean" || !optionalString(raw.finalError)) return invalid;
      return { kind: "event", event: { type, success: raw.success, finalError: raw.finalError } };
    default: return { kind: "ignored" };
  }
}
