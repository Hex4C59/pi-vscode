import { redactCredentialLikeText, type ActivityItem } from "../../extension/contracts/index.js";
import type { RuntimeFrameEvent } from "./rpc-events.js";

const LIMIT = 16_384;
const ITEM_LIMIT = 63;
type ThinkingUpdate = Extract<RuntimeFrameEvent, { type: "message_update" }>["assistantMessageEvent"];
type ToolEvent = Extract<RuntimeFrameEvent, { toolCallId: string }>;
type ThinkingBuffer = { raw: string; truncated: boolean };

export function displayText(value: string): string { return redactCredentialLikeText(value); }

export class ActivityProjection {
  private sequence = 0;
  private messageId = "message-0";
  private messageComplete = false;
  private items = new Map<string, ActivityItem>();
  private thinking = new Map<string, ThinkingBuffer>();

  currentMessageId(): string { return this.messageId; }

  reset(): void {
    this.sequence = 0;
    this.messageId = "message-0";
    this.messageComplete = false;
    this.items.clear();
    this.thinking.clear();
  }

  parse(event: RuntimeFrameEvent): ActivityItem[] {
    if (event.type === "message_start" && event.message.role === "assistant") {
      this.messageId = `message-${++this.sequence}`;
      this.messageComplete = false;
      this.thinking.clear();
    }
    if (event.type === "message_update") return this.parseThinking(event.assistantMessageEvent);
    if (event.type === "message_end" && event.message.role === "assistant") {
      this.messageComplete = true;
      this.thinking.clear();
      return event.message.content?.flatMap((part, index) => part.type === "thinking" && typeof part.thinking === "string"
        ? this.put({ id: `${this.messageId}-thinking-${index}`, kind: "thinking", messageId: this.messageId,
          contentIndex: index, text: part.thinking, status: "complete", truncated: false })
        : []) ?? [];
    }
    if (event.type === "tool_execution_start" || event.type === "tool_execution_update" || event.type === "tool_execution_end") {
      return this.parseTool(event);
    }
    return [];
  }

  private parseThinking(update: ThinkingUpdate): ActivityItem[] {
    const index = update.contentIndex;
    if (!["thinking_start", "thinking_delta", "thinking_end"].includes(update.type)
      || typeof index !== "number" || !Number.isSafeInteger(index) || index < 0) return [];
    const id = `${this.messageId}-thinking-${index}`;
    const previous = this.items.get(id);
    const final = update.type === "thinking_end" && typeof update.content === "string";
    if (this.messageComplete || (!final && previous?.status === "complete")) return previous ? [previous] : [];
    if (!previous && this.items.size >= ITEM_LIMIT) return this.overflow();
    let text = update.content ?? "";
    let truncated = false;
    if (final) this.thinking.delete(id);
    else {
      const buffer = this.thinking.get(id) ?? { raw: "", truncated: false };
      const delta = update.type === "thinking_delta" ? update.delta ?? "" : "";
      const remaining = LIMIT - buffer.raw.length;
      // Preserve raw context independently; redaction must never reclaim its bounded capacity.
      buffer.raw += delta.slice(0, remaining);
      buffer.truncated ||= delta.length > remaining;
      this.thinking.set(id, buffer);
      text = buffer.raw;
      truncated = buffer.truncated || (previous?.truncated ?? false);
    }
    return this.put({ id, kind: "thinking", messageId: this.messageId, contentIndex: index,
      text, status: update.type === "thinking_end" ? "complete" : "thinking", truncated });
  }

  private parseTool(event: ToolEvent): ActivityItem[] {
    const id = `tool-${event.toolCallId}`;
    const prior = this.items.get(id);
    const text = event.content ? event.content.filter((part) => part.type === "text").map((part) => part.text).join("\n") : prior?.text ?? "";
    return this.put({ id, kind: "tool", messageId: prior?.messageId ?? this.messageId,
      toolCallId: event.toolCallId, tool: typeof event.toolName === "string" ? event.toolName.slice(0, 100) : prior?.tool,
      text, input: prior?.input ?? event.input,
      status: event.type === "tool_execution_start" ? "preparing" : event.type === "tool_execution_end" ? event.isError ? "failed" : "complete" : "executing",
      truncated: prior?.truncated ?? false });
  }

  private overflow(): ActivityItem[] {
    const id = "activity-overflow";
    const notice: ActivityItem = this.items.get(id) ?? { id, kind: "tool", tool: "Activity display limit", messageId: this.messageId,
      text: "Additional activity is omitted from this display. Execution and approval checks continue; this is a display limit, not a tool result.",
      status: "complete", truncated: true };
    this.items.set(id, notice);
    return [notice];
  }

  private put(item: ActivityItem): ActivityItem[] {
    // Reserve the final slot for a host notice, not invented model thinking.
    if (!this.items.has(item.id) && this.items.size >= ITEM_LIMIT) return this.overflow();
    const text = displayText(item.text);
    const input = item.input ? displayText(item.input) : undefined;
    item = { ...item, text: text.slice(0, LIMIT), input: input?.slice(0, LIMIT),
      truncated: item.truncated || text.length > LIMIT || (input?.length ?? 0) > LIMIT };
    this.items.set(item.id, item);
    return [item];
  }
}
