import { useUiText } from "../components/index.js";
import type { ReactElement } from "react";
import type { ActivityItem, WorkspaceStateMessage } from "../../extension/contracts/index.js";
import { ReplyMarkdown } from "./reply-markdown.js";

const liveStatuses = new Set<ActivityItem["status"]>(["thinking", "preparing", "executing"]);

type ConversationProps = Pick<WorkspaceStateMessage, "messages" | "activities" | "chatBusy">;

function ActivitySummary({ items }: { items: readonly ActivityItem[] }): ReactElement {
  const { text: t } = useUiText();
  if (!items.length) return <p className="candidate__activity-summary">{t("No activity reported")}</p>;
  const tools = items.filter(item => item.kind === "tool").length;
  const thinking = items.length - tools;
  const working = items.some(item => liveStatuses.has(item.status));
  const failed = items.filter(item => item.status === "failed").length;
  const interrupted = items.filter(item => item.status === "interrupted").length;
  const truncated = items.filter(item => item.truncated).length;
  const summary = [failed ? t("{count} failed", { count: failed }) : "", interrupted ? t("{count} interrupted", { count: interrupted }) : "", truncated ? t("{count} truncated", { count: truncated }) : "", working ? t("Working") : "", t(tools === 1 ? "{count} tool" : "{count} tools", { count: tools }), t("{count} thinking", { count: thinking })].filter(Boolean).join(" · ");
  return <details className="candidate__activity" aria-label={t("Message activity")}>
    <summary title={summary}>{summary}</summary>
    {items.map(item => <details key={item.id} aria-label={item.kind === "tool" ? t("Tool details") : t("Thinking details")}>
      <summary>{item.kind === "tool" ? item.tool ?? t("Tool") : t("Thinking")} · {t(item.status)}</summary>
      {item.kind === "tool" && <><div className="candidate__notice">{t("Parameters / command")}</div><pre tabIndex={0} aria-label={t("Tool input")}>{item.input ?? t("Not provided")}</pre></>}
      <div className="candidate__notice">{item.kind === "thinking" ? t("Upstream thinking") : t("Output")}</div>
      <pre tabIndex={0} aria-label={item.kind === "thinking" ? t("Upstream thinking") : t("Tool output")}>{item.text}</pre>
      {item.truncated && <p className="candidate__notice">{t("Truncated — only the bounded projection is shown.")}</p>}
    </details>)}
  </details>;
}

/** Message identity keeps early activity in the same row when the first body delta arrives. */
export function CandidateConversation({ messages, activities, chatBusy }: ConversationProps): ReactElement {
  const { text: t } = useUiText();
  const grouped = new Map<string, ActivityItem[]>();
  for (const item of activities) grouped.set(item.messageId, [...grouped.get(item.messageId) ?? [], item]);
  const rows = [...messages];
  const ids = new Set(messages.map(message => message.id));
  for (const id of grouped.keys()) if (!ids.has(id)) rows.push({ id, role: "assistant", text: "" });
  return <>{rows.map((message, index) => {
    const items = message.id ? grouped.get(message.id) ?? [] : [];
    const waitingForBody = chatBusy && message.role === "assistant" && (items.length ? items.some(item => liveStatuses.has(item.status)) : index === rows.length - 1);
    return <article className={`candidate__message candidate__message--${message.role}`} key={message.id ?? `unidentified-${index}`}>
      <span className="candidate__speaker">{message.role === "user" ? t("You") : "pi"}</span>
      {message.role === "assistant" && <ActivitySummary items={items} />}
      <div className="candidate__text">{message.role === "assistant" && message.text ? <ReplyMarkdown text={message.text} /> : message.text || (waitingForBody ? t("Thinking…") : "")}</div>
    </article>;
  })}</>;
}
