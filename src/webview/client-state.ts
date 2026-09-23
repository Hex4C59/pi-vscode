import type { AttachmentHistoryEntry, AttachmentStateMessage, ChangeReviewStateMessage, SessionStateMessage, WebviewMessage, WorkspaceStateMessage } from "../extension/webviewProtocol.js";
import type { SavedHistorySnapshot } from "./saved-history-client.js";

type WithoutEnvelope<T> = T extends { generation: number; viewId: string } ? Omit<T, "generation" | "viewId" | "version"> : never;
export type Intent = WithoutEnvelope<WebviewMessage>;
export const ATTACHMENT_HISTORY_PAGE_SIZE = 16;
export const CHANGE_REVIEW_PAGE_SIZE = 16;
export const SESSION_PAGE_SIZE = 16;
export type Preview = { snapshotId: string; requestId: string; offset: number; text: string; error: string | null };
export type ClientSnapshot = SavedHistorySnapshot & {
  workspace: WorkspaceStateMessage | null;
  attachments: AttachmentStateMessage | null;
  sessions: SessionStateMessage | null;
  changeReview: ChangeReviewStateMessage | null;
  changeReviewOpen: boolean;
  changeReviewPage: number;
  text: string;
  synchronizing: boolean;
  submitting: boolean;
  stopRequested: boolean;
  history: AttachmentHistoryEntry[];
  historyOpen: boolean;
  historyPage: number | null;
  preview: Preview | null;
  error: string | null;
};
export function attachmentError(code: string, kind?: "file" | "selection"): string {
  if (code === "source-changed" && kind === undefined) return "Sources changed. Send checks all attachments; confirm each marked snapshot or remove and reattach.";
  if (code === "source-changed" && kind === "selection") return "Source changed. Selection text stays fixed; Send checks the source before you choose Use old snapshot, or remove and reattach.";
  const messages: Record<string, string> = {
    "no-editor": "Open a workspace text editor and select code first.", "empty-selection": "Select a nonempty range of code first.", "multiple-selections": "Select one range at a time, then attach it.",
    cancelled: "Selection cancelled. Draft retained.", busy: "Wait for the current operation.", stale: "Draft changed; synchronized with the host.",
    ineligible: "A trusted local workspace and ready runtime are required.", "attachment-limit": "At most 20 attachments. Remove an item before attaching more.", "total-too-large": "Attachment text exceeds 1 MiB. Reduce or remove attachments before sending.",
    "sensitive-source": "Credential-like source blocked. Attach only nonsecret code.",
    "history-full": "Attachment history is full. Inspect history, or use Developer: Reload Window to restart (current chat, attachment snapshots and unsent draft will be lost). Plain chat remains available.",
    "source-changed": "Source changed. Send refreshes the snapshot; confirm Use latest contents before sending. Remove and reattach if unavailable.", "preparation-cancelled": "Preparation cancelled. Draft retained.",
    "runtime-lost": "Runtime/session ended. In-memory attachment history ended; reattach for the new session.",
    "write-failed": "Delivery uncertain. No retry was made. Stop or restart before retrying.",
    "ack-timeout": "Acknowledgement timed out. No retry was made. Stop or restart.",
    "rpc-rejected": "Runtime rejected this submission. Inspect history before trying again.",
  };
  return messages[code] ?? "File could not be attached or sent. Remove and reattach a smaller eligible workspace text file.";
}
export function availability(s: ClientSnapshot) {
  const w = s.workspace;
  const stopping = s.stopRequested || w?.execution === "stopping" || w?.runtime === "stopping";
  const ready = !!w && w.runtime === "ready" && !w.busy;
  const sessionTransitioning = s.sessions?.phase === "confirming" || s.sessions?.phase === "switching";
  const chatDisabled = !ready || !!w?.chatBusy || !!w?.modelBusy || stopping || !!s.error || sessionTransitioning;
  return {
    stopping,
    sessionTransitioning,
    settingsDisabled: !ready || !!w?.modelBusy || stopping || !!s.error || sessionTransitioning,
    sendDisabled: chatDisabled || !w?.chatModel || !!s.attachments?.draft.attachments.some(a => ["unavailable", "confirmation-required"].includes(a.state)) || s.synchronizing || s.submitting || s.attachments?.preparation !== "idle" || !s.text.trim(),
    attachmentDisabled: chatDisabled || s.synchronizing || s.submitting || s.attachments?.preparation !== "idle",
    showStop: !!w?.chatBusy || stopping || (!!s.attachments && s.attachments.preparation !== "idle"),
  };
}
