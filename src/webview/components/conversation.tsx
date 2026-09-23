import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import type { WorkspaceStateMessage } from "../../extension/contracts/webviewProtocol.js";
import type { ActivityItem } from "../../extension/contracts/webviewProtocol.js";

export interface ConversationProps {
  messages: WorkspaceStateMessage["messages"];
  activities: WorkspaceStateMessage["activities"];
}

const terminalStatuses = new Set<ActivityItem["status"]>(["complete", "failed", "interrupted"]);

function statusLabel(status: ActivityItem["status"]): string {
  return status === "preparing" ? "Preparing / checking approval" : status;
}

function activityTitle(item: ActivityItem, elapsed: number): string {
  const label = item.kind === "thinking" ? "Thinking" : item.tool ?? "Tool";
  const observed = item.kind === "tool" ? ` · ~${elapsed}s observed` : "";
  return `${label} · ${statusLabel(item.status)}${observed}`;
}

interface ActivityDetailsProps {
  item: ActivityItem;
  elapsed: number;
  expanded: boolean;
  onToggle: (id: string, open: boolean) => void;
}

function ActivityDetails({ item, elapsed, expanded, onToggle }: ActivityDetailsProps): ReactElement {
  const isTool = item.kind === "tool";
  return (
    <details
      className="activity"
      data-activity-id={item.id}
      open={expanded}
      onToggle={event => onToggle(item.id, (event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>{activityTitle(item, elapsed)}</summary>
      <div className="activity-label" hidden={!isTool}>Parameters / command</div>
      <pre hidden={!isTool}>{item.input ?? "Not provided"}</pre>
      <div className="activity-label">{item.kind === "thinking" ? "Upstream thinking" : "Output"}</div>
      <pre>{item.text}</pre>
      <div className="truncation" hidden={!item.truncated}>Truncated — only the bounded projection is shown.</div>
    </details>
  );
}

export function Conversation({ messages, activities }: ConversationProps): ReactElement {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() => new Set());
  const startedAt = useRef(new Map<string, number>());
  const endedAt = useRef(new Map<string, number>());
  const [, refreshClock] = useState(0);

  const grouped = useMemo(() => {
    const byMessage = new Map<string, ActivityItem[]>();
    for (const item of activities) {
      const existing = byMessage.get(item.messageId);
      if (existing) existing.push(item);
      else byMessage.set(item.messageId, [item]);
    }
    // Keep a row from the first thinking/tool event through the first text delta.
    // Reparenting details from an orphan list would destroy DOM focus and expansion.
    const rows = [...messages];
    const messageIds = new Set(messages.map(message => message.id));
    for (const messageId of byMessage.keys()) {
      if (!messageIds.has(messageId)) rows.push({ id: messageId, role: "assistant", text: "" });
    }
    return { byMessage, rows };
  }, [activities, messages]);

  useEffect(() => {
    const now = Date.now();
    const activeIds = new Set(activities.map(item => item.id));
    for (const item of activities) {
      if (!startedAt.current.has(item.id)) startedAt.current.set(item.id, now);
      if (terminalStatuses.has(item.status) && !endedAt.current.has(item.id)) endedAt.current.set(item.id, now);
    }
    for (const id of startedAt.current.keys()) {
      if (!activeIds.has(id)) {
        startedAt.current.delete(id);
        endedAt.current.delete(id);
      }
    }
    setExpandedIds(previous => {
      const next = new Set([...previous].filter(id => activeIds.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [activities]);

  const hasLiveTool = activities.some(item => item.kind === "tool" && !terminalStatuses.has(item.status));
  useEffect(() => {
    if (!hasLiveTool) return undefined;
    const timer = setInterval(() => refreshClock(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [hasLiveTool]);

  const elapsedFor = (item: ActivityItem): number => {
    const started = startedAt.current.get(item.id) ?? Date.now();
    const ended = endedAt.current.get(item.id) ?? Date.now();
    return Math.max(0, Math.floor((ended - started) / 1000));
  };

  const renderActivities = (items: readonly ActivityItem[]) => items.map(item => (
    <ActivityDetails
      key={item.id}
      item={item}
      elapsed={elapsedFor(item)}
      expanded={expandedIds.has(item.id)}
      onToggle={(id, open) => setExpandedIds(previous => {
        const next = new Set(previous);
        if (open) next.add(id);
        else next.delete(id);
        return next;
      })}
    />
  ));

  return (
    <>
      <div id="messages" role="log" aria-live="polite" aria-relevant="additions text">
        {grouped.rows.map((message, index) => {
          const key = message.id ?? `line-${index}`;
          const messageActivities = message.id ? grouped.byMessage.get(message.id) ?? [] : [];
          return (
            <article key={key} className={`msg msg-${message.role}`} data-message-id={message.id ?? key}>
              <div className="msg-steps">{renderActivities(messageActivities)}</div>
              <div className="msg-body">{message.text}</div>
            </article>
          );
        })}
      </div>
    </>
  );
}
