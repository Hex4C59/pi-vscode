import type { ReactElement } from "react";
import { useUiText, type UiText } from "../../components/index.js";
import type { WorkspaceStateMessage } from "../../../extension/contracts/index.js";

type Execution = WorkspaceStateMessage["execution"];

/** Glance category: shape and motion differ, not only color. */
type TaskStatusCategory = "active" | "waiting" | "completed" | "stopped" | "failed";

// Official Lucide geometry; revision and ISC attribution: assets/icons/lucide.
const markers = {
  waiting: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
  completed: <path d="M20 6 9 17l-5-5" />,
  stopped: <rect width="18" height="18" x="3" y="3" rx="2" />,
  failed: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
} satisfies Record<string, ReactElement>;

export interface TaskStatusProps {
  execution: Execution | undefined;
  chatBusy: boolean;
  stopping: boolean;
}

function resolve({ execution, chatBusy, stopping }: TaskStatusProps): { category: TaskStatusCategory; text: UiText } | null {
  if (stopping) return { category: "active", text: "Stopping… Waiting for the task to settle." };
  switch (execution) {
    case "retrying": return { category: "active", text: "Retrying…" };
    case "compacting": return { category: "active", text: "Compacting context…" };
    case "awaiting-approval": return { category: "waiting", text: "Waiting for approval…" };
    case "completed": return { category: "completed", text: "Task completed" };
    case "stopped": return { category: "stopped", text: "Task stopped · Side effects are not rolled back." };
    case "failed": return { category: "failed", text: "Task failed" };
    default:
      if (!chatBusy) return null;
      return { category: "active", text: execution === "replying" ? "Replying…" : "Working…" };
  }
}

/** Task status line: what the task is doing now, whether it needs the user, and how it ended. */
export function TaskStatus(props: TaskStatusProps): ReactElement | null {
  const { text: t } = useUiText();
  const status = resolve(props);
  if (status === null) return null;
  const marker = status.category === "active"
    ? <span className="candidate__pulse" aria-hidden="true" />
    : <svg className="candidate__status-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{markers[status.category]}</svg>;
  return <p className="candidate__progress" role="status" data-state={status.category}>{marker}{t(status.text)}</p>;
}
