import type { ReactElement } from "react";
import { ATTACHMENT_HISTORY_PAGE_SIZE } from "../client.js";
import type { AttachmentHistoryEntry, AttachmentStateMessage, AttachmentDetails } from "../../extension/webviewProtocol.js";

export interface AttachmentPreview {
  snapshotId: string;
  text: string;
  error: string | null;
}

export interface AttachmentPanelProps {
  state: AttachmentStateMessage | null;
  history: AttachmentHistoryEntry[];
  historyOpen: boolean;
  historyPage: number | null;
  preview: AttachmentPreview | null;
  disabled: boolean;
  status: string;
  onAdd: () => void;
  onAddSelection: () => void;
  onRemove: (attachmentId: string) => void;
  onConfirm: (attachmentId: string) => void;
  onHistory: () => void;
  onHistoryPage: (page: number) => void;
  onPreview: (snapshotId: string) => void;
  onClosePreview: () => void;
}

function kindLabel(attachment: AttachmentDetails): string {
  if (attachment.kind === "file") return "whole file";
  const { start, end } = attachment.originalRange;
  return `selection · original L${start.line + 1}:${start.character + 1}–L${end.line + 1}:${end.character + 1} (end exclusive)${attachment.stale ? " · old snapshot" : ""}`;
}

function draftLabel(attachment: AttachmentStateMessage["draft"]["attachments"][number]): string {
  return `${attachment.relativePath} · ${kindLabel(attachment)} · ${attachment.utf8Bytes} bytes${attachment.unsaved ? " · unsaved snapshot" : ""} · ${attachment.state}`;
}

function historyLabel(entry: AttachmentHistoryEntry): string {
  return `${entry.relativePath} · ${kindLabel(entry)} · ${entry.utf8Bytes} bytes${entry.unsaved ? " · unsaved snapshot" : ""} · ${entry.delivery} / ${entry.outcome}`;
}

export function AttachmentPanel({
  state,
  history,
  historyOpen,
  historyPage,
  preview,
  disabled,
  status,
  onAdd,
  onAddSelection,
  onRemove,
  onConfirm,
  onHistory,
  onHistoryPage,
  onPreview,
  onClosePreview,
}: AttachmentPanelProps): ReactElement {
  const attachments = state?.draft.attachments ?? [];
  const preparing = state?.preparation !== undefined && state.preparation !== "idle";

  const lastPage = Math.max(0, Math.ceil(history.length / ATTACHMENT_HISTORY_PAGE_SIZE) - 1);
  const offset = (historyPage ?? 0) * ATTACHMENT_HISTORY_PAGE_SIZE;
  const visibleHistory = historyPage === null ? [] : history.slice(offset, offset + ATTACHMENT_HISTORY_PAGE_SIZE);
  const submissions = new Map<string, number>();
  for (const entry of history) if (!submissions.has(entry.submissionId)) submissions.set(entry.submissionId, submissions.size + 1);
  return (
    <section id="attachment-controls">
      <p className="muted">Attach only nonsecret workspace code. Snapshots are memory-only; restarting or changing resources loses attachment history. Unsaved text is not saved to disk.</p>
      <button id="add-file" className="btn-secondary" type="button" disabled={disabled || !state || preparing || attachments.length >= 20} onClick={onAdd}>Attach file</button>
      <button id="add-selection" className="btn-secondary" type="button" disabled={disabled || !state || preparing || attachments.length >= 20} onClick={onAddSelection}>Attach selection</button>
      <button id="attachment-history" className="btn-secondary" type="button" disabled={!state} onClick={onHistory}>Attachment history</button>
      <p id="attachment-status" role="status">{status}</p>
      <p className="muted">{attachments.length}/20 attachments · {attachments.reduce((bytes, a) => bytes + a.utf8Bytes, 0)} / 1048576 UTF-8 bytes</p>
      <div id="attachment-entry">
        {attachments.map(attachment => (
          <div key={attachment.attachmentId} className="activity" data-attachment-id={attachment.attachmentId}>
            <p>{draftLabel(attachment)}</p>
            {attachment.state === "changed" && <p className="muted">{attachment.kind === "selection" ? "Selection text stays fixed. Send checks the source, then choose the old snapshot or remove and reattach." : "Send will refresh this file and ask you to confirm its latest contents."}</p>}
            {attachment.state === "confirmation-required" && <p className="muted">Confirm this snapshot, then press Send. Preview is optional; another edit requires confirmation again.</p>}
            {attachment.state === "confirmation-required" && <button className="btn-secondary" type="button" data-attachment-action="confirm" disabled={disabled || preparing} onClick={() => onConfirm(attachment.attachmentId)}>{attachment.kind === "selection" ? "Use old snapshot" : "Use latest contents"}</button>}
            <button className="btn-secondary" type="button" data-snapshot-id={attachment.snapshotId} data-attachment-action="preview" onClick={() => onPreview(attachment.snapshotId)}>Preview complete snapshot</button>
            <button className="btn-secondary" type="button" data-attachment-action="remove" onClick={() => onRemove(attachment.attachmentId)}>Remove</button>
          </div>
        ))}
      </div>
      <div id="attachment-history-list" hidden={!historyOpen}>
        <p id="history-page-status" role="status">{historyPage === null ? "Loading retained attachment history…" : history.length ? `Snapshots ${offset + 1}–${offset + visibleHistory.length} of ${history.length} · Page ${historyPage + 1} of ${lastPage + 1}` : "No retained attachment submissions in this live session."}</p>
        <nav aria-label="Attachment history pages">
          <button id="history-first" type="button" className="btn-secondary" disabled={historyPage === null || historyPage === 0} onClick={() => onHistoryPage(0)}>First page</button>
          <button id="history-previous" type="button" className="btn-secondary" disabled={historyPage === null || historyPage === 0} onClick={() => onHistoryPage((historyPage ?? 0) - 1)}>Previous page</button>
          <button id="history-next" type="button" className="btn-secondary" disabled={historyPage === null || historyPage === lastPage} onClick={() => onHistoryPage((historyPage ?? 0) + 1)}>Next page</button>
          <button id="history-latest" type="button" className="btn-secondary" disabled={historyPage === null || historyPage === lastPage} onClick={() => onHistoryPage(lastPage)}>Latest page</button>
        </nav>
        {visibleHistory.map((entry, index) => (
            <div key={`${entry.submissionId}:${entry.snapshotId}`} className="activity" data-submission-id={entry.submissionId}>
              <p className="muted">Submission {submissions.get(entry.submissionId)}{index === 0 && offset > 0 && history[offset - 1].submissionId === entry.submissionId ? " · continued from previous page" : ""}</p>
              <p>{historyLabel(entry)}</p>
              <button className="btn-secondary" type="button" data-snapshot-id={entry.snapshotId} data-attachment-action="preview" onClick={() => onPreview(entry.snapshotId)}>Preview complete snapshot</button>
            </div>
          ))}
      </div>
      <section id="attachment-preview" hidden={preview === null}>
        <button id="close-preview" className="btn-secondary" type="button" onClick={onClosePreview}>Close preview</button>
        <pre id="attachment-preview-text" className="approval-input">{preview?.error ?? preview?.text ?? ""}</pre>
      </section>
    </section>
  );
}
