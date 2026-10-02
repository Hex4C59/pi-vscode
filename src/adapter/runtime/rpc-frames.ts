import { parseGateEnvelope, type ExtensionExecutionProfile, type RuntimeEvent } from "../../extension/contracts/index.js";
import { sameNativePath } from "../index.js";
import { ActivityProjection, displayText } from "./activityProjection.js";
import { decodeRuntimeEvent, isRecord, type RuntimeFrameEvent } from "./rpc/rpc-events.js";
import { formatRuntimeError } from "./runtime-errors.js";

type HelloEnvelope = Extract<NonNullable<ReturnType<typeof parseGateEnvelope>>, { kind: "hello" }>;

/** VS Code URI drives are lowercase; saved pi cwd may retain an uppercase drive.
 * Normalize separators/dot segments and the drive only, not potentially case-sensitive directory names. */
export function sameGateCwd(candidate: string, owned: string): boolean {
  if (candidate === owned) return true;
  if (process.platform !== "win32") return false;
  return sameNativePath(candidate, owned);
}

export type FrameContext = {
  session: number;
  aborting: boolean;
  gateId: string;
  cwd: string;
  executionProfile: ExtensionExecutionProfile;
};

export type InterpretedFrame =
  | { kind: "ignored" }
  | { kind: "rpc"; parsed: Record<string, unknown> }
  | { kind: "protocol-error" }
  | { kind: "extension_error" }
  | { kind: "hello"; envelope: HelloEnvelope }
  | { kind: "feedback"; parsed: Record<string, unknown> }
  | { kind: "interaction"; parsed: Record<string, unknown> }
  | { kind: "approval"; id: string; envelope: ReturnType<typeof parseGateEnvelope> }
  | {
      kind: "runtime";
      events: RuntimeEvent[];
      conversationTouched?: boolean;
      agentStarted?: boolean;
      agentSettled?: boolean;
      manualCompactionEnded?: { aborted: boolean };
    };

const FEEDBACK_METHODS = ["notify", "setStatus", "setWidget", "setTitle", "set_editor_text"];
const DIALOG_METHODS = ["select", "confirm", "input", "editor"];

function appendAssistantEvents(parsed: RuntimeFrameEvent, context: FrameContext, activity: ActivityProjection, events: RuntimeEvent[]): void {
  const session = context.session;
  const finalMessage = "message" in parsed ? parsed.message : undefined;
  if (parsed.type === "message_end" && finalMessage?.role === "assistant" && Array.isArray(finalMessage.content)) {
    const text = finalMessage.content.filter((p) => p.type === "text" && typeof p.text === "string").map((p) => p.text).join("");
    const projected = displayText(text);
    const bodyCopyEligible = !context.aborting && finalMessage.stopReason === "stop" && !!text.trim()
      && text.length <= 65536 && projected === text;
    events.push({ kind: "message_final", session, messageId: activity.currentMessageId(), text: projected.slice(0, 65536),
      ...(bodyCopyEligible ? { bodyCopyEligible: true } : {}) });
  }
  if (parsed.type === "message_end" && finalMessage?.role === "assistant" && finalMessage.stopReason === "error") {
    events.push({ kind: "stream_error", session, detail: formatRuntimeError(typeof finalMessage.errorMessage === "string" && finalMessage.errorMessage.trim() ? finalMessage.errorMessage : "Assistant request failed.") });
  }
  if (parsed.type === "message_update") {
    const assistantMessageEvent = parsed.assistantMessageEvent;
    if (assistantMessageEvent?.type === "text_delta" && typeof assistantMessageEvent.delta === "string") {
      events.push({ kind: "text_delta", delta: displayText(assistantMessageEvent.delta).slice(0, 65536), session, messageId: activity.currentMessageId() });
    }
  }
}

function appendWorkflowEvents(parsed: RuntimeFrameEvent, context: FrameContext, events: RuntimeEvent[]): void {
  const session = context.session;
  if (parsed.type === "compaction_start") {
    events.push({ kind: "workflow", session, phase: "compacting" });
    return;
  }
  if (parsed.type === "compaction_end" && typeof parsed.aborted === "boolean" && typeof parsed.willRetry === "boolean") {
    if (typeof parsed.errorMessage === "string" && parsed.errorMessage.trim() && !parsed.willRetry && !parsed.aborted) {
      events.push({ kind: "stream_error", session, detail: formatRuntimeError(parsed.errorMessage) });
    } else events.push({ kind: "workflow", session, phase: "waiting" });
    return;
  }
  if (parsed.type === "auto_retry_start" && Number.isSafeInteger(parsed.attempt) && (parsed.attempt as number) >= 1 && Number.isSafeInteger(parsed.maxAttempts) && (parsed.maxAttempts as number) >= (parsed.attempt as number) && typeof parsed.delayMs === "number" && Number.isFinite(parsed.delayMs) && parsed.delayMs >= 0) {
    events.push({ kind: "workflow", session, phase: "retrying" });
    return;
  }
  if (parsed.type === "auto_retry_end" && parsed.success === true) {
    events.push({ kind: "workflow", session, phase: "waiting" });
    return;
  }
  if (parsed.type === "auto_retry_end" && parsed.success === false) {
    if (context.aborting && parsed.finalError === "Retry cancelled") return;
    const detail = typeof parsed.finalError === "string" && parsed.finalError.trim()
      ? parsed.finalError
      : "Assistant request failed.";
    events.push({ kind: "stream_error", session, detail: formatRuntimeError(detail) });
  }
}

function projectRuntimeFrame(parsed: RuntimeFrameEvent, context: FrameContext, activity: ActivityProjection): InterpretedFrame {
  const session = context.session;
  if (!session) return { kind: "ignored" };
  const events: RuntimeEvent[] = [];
  const conversationTouched = parsed.type === "agent_start" || parsed.type === "message_start" || parsed.type === "message_end";
  if (parsed.type === "tool_execution_end" && typeof parsed.toolCallId === "string" && parsed.toolCallId.length > 0 && parsed.toolCallId.length <= 200 && typeof parsed.isError === "boolean") {
    events.push({ kind: "tool_finished", session, toolCallId: parsed.toolCallId, failed: parsed.isError });
  }
  for (const item of activity.parse(parsed)) events.push({ kind: "activity", session, item });
  appendAssistantEvents(parsed, context, activity, events);
  appendWorkflowEvents(parsed, context, events);
  return {
    kind: "runtime",
    events: parsed.type === "agent_settled" ? [...events, { kind: "agent_settled", session }] : events,
    ...(parsed.type === "compaction_end" && parsed.reason === "manual" && typeof parsed.aborted === "boolean" ? { manualCompactionEnded: { aborted: parsed.aborted } } : {}),
    ...(conversationTouched ? { conversationTouched } : {}),
    ...(parsed.type === "agent_start" ? { agentStarted: true } : {}),
    ...(parsed.type === "agent_settled" ? { agentSettled: true } : {}),
  };
}

function interpretExtensionRequest(parsed: Record<string, unknown>, context: FrameContext, id: string | undefined): InterpretedFrame {
  let envelope;
  try { envelope = parseGateEnvelope(JSON.parse(typeof parsed.message === "string" ? parsed.message : "null")); } catch { /* Invalid request is denied below. */ }
  if (envelope?.runtime === context.gateId && sameGateCwd(envelope.cwd, context.cwd) && envelope.kind === "hello" && parsed.method === "notify") {
    return { kind: "hello", envelope };
  }
  if (context.executionProfile.kind === "trusted" && typeof parsed.method === "string" && FEEDBACK_METHODS.includes(parsed.method)) {
    return { kind: "feedback", parsed };
  }
  if (id && typeof parsed.method === "string" && DIALOG_METHODS.includes(parsed.method) && envelope?.kind !== "call") {
    return { kind: "interaction", parsed };
  }
  if (id && parsed.method === "confirm") return { kind: "approval", id, envelope };
  return { kind: "ignored" };
}

function interpretRecord(parsed: Record<string, unknown>, context: FrameContext, activity: ActivityProjection): InterpretedFrame {
  const id = typeof parsed.id === "string" ? parsed.id : undefined;
  if (parsed.type === "extension_error") return { kind: "extension_error" };
  if (parsed.type === "extension_ui_request") return interpretExtensionRequest(parsed, context, id);
  if (parsed.type === "response" && id) return { kind: "rpc", parsed };
  const decoded = decodeRuntimeEvent(parsed);
  if (decoded.kind !== "event") return decoded;
  const event = decoded.event;
  if (event.type === "queue_update" || event.type === "user_message_start") {
    if (!context.session) return { kind: "ignored" };
    return event.type === "queue_update"
      ? { kind: "runtime", events: [{ kind: "queue_updated", session: context.session, steering: event.steering, followUp: event.followUp }] }
      : { kind: "runtime", conversationTouched: true, events: [{ kind: "user_message_started", session: context.session, text: event.text }] };
  }
  return projectRuntimeFrame(event, context, activity);
}

export function createRpcFrames() {
  const activity = new ActivityProjection();
  return {
    reset(): void {
      activity.reset();
    },
    interpret(line: string, context: FrameContext): InterpretedFrame {
      if (!line.trim()) return { kind: "ignored" };
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        return { kind: "ignored" };
      }
      if (!isRecord(parsed)) return { kind: "ignored" };
      return interpretRecord(parsed, context, activity);
    },
  };
}
