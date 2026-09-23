import type { ReactElement } from "react";
import { CHANGE_REVIEW_PAGE_SIZE } from "../client-state.js";
import type { ChangeReviewEntry, ChangeReviewStateMessage, ReviewReason } from "../../extension/webviewProtocol.js";

export interface ChangeReviewProps {
  state: ChangeReviewStateMessage | null;
  open: boolean;
  page: number;
  onToggle: () => void;
  onPage: (page: number) => void;
  onDiff: (id: string) => void;
  onSource: (id: string) => void;
}

const reasonLabels: Record<ReviewReason, string> = {
  "outside-project": "Outside the selected project",
  "sensitive-source": "Sensitive source was not captured",
  "not-text": "Source is not text",
  "too-large": "Source is too large",
  unavailable: "Captured source is unavailable",
  "changed-during-capture": "Source changed during capture",
  "no-before-snapshot": "No before snapshot was available",
  "retention-limit": "Review retention limit reached",
  "not-applied": "The operation was not applied",
};

function sourceLabel(entry: ChangeReviewEntry): string {
  return entry.source === "tool"
    ? `Tool-reported · ${entry.tool ?? "write/edit"}`
    : "Observed workspace change";
}

function statusLabel(status: ChangeReviewEntry["status"]): string {
  return status === "observed" ? "Observed" : status[0].toUpperCase() + status.slice(1);
}

function diffLabel(diff: ChangeReviewEntry["diff"]): string {
  return diff === "ready" ? "Ready" : diff === "unchanged" ? "Unchanged" : diff === "pending" ? "Pending" : "Unavailable";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MiB`;
}

function ReviewEntry({ entry, onDiff, onSource }: Pick<ChangeReviewProps, "onDiff" | "onSource"> & { entry: ChangeReviewEntry }): ReactElement {
  const canOpenDiff = entry.diff === "ready" || entry.diff === "unchanged";
  return (
    <article className="change-review__entry" data-review-entry-id={entry.id}>
      <div className="change-review__entry-heading">
        <strong className="change-review__path" title={entry.path ?? "Path unavailable"}>{entry.path ?? "Path unavailable"}</strong>
        <span className="change-review__source">{sourceLabel(entry)}</span>
      </div>
      <p className="change-review__meta">
        <span>Outcome: {statusLabel(entry.status)}</span>
        <span>Text difference: {diffLabel(entry.diff)}</span>
      </p>
      {entry.reason !== null && <p className="change-review__notice">Reason: {reasonLabels[entry.reason]}</p>}
      {entry.overlap && <p className="change-review__warning">Concurrent changes overlapped this entry; attribution is not isolated.</p>}
      {entry.sourceChanged && <p className="change-review__warning">Source changed after capture; the current source may differ from this review.</p>}
      <div className="change-review__actions">
        {canOpenDiff && <button className="btn-secondary" type="button" data-review-action="diff" onClick={() => onDiff(entry.id)}>View captured diff</button>}
        {entry.path !== null && <button className="btn-secondary" type="button" data-review-action="source" onClick={() => onSource(entry.id)}>Open current source</button>}
      </div>
    </article>
  );
}

export function ChangeReview({ state, open, page, onToggle, onPage, onDiff, onSource }: ChangeReviewProps): ReactElement {
  const entries = state?.entries ?? [];
  const lastPage = Math.max(0, Math.ceil(entries.length / CHANGE_REVIEW_PAGE_SIZE) - 1);
  const currentPage = Math.min(Math.max(0, page), lastPage);
  const offset = currentPage * CHANGE_REVIEW_PAGE_SIZE;
  const visibleEntries = entries.slice(offset, offset + CHANGE_REVIEW_PAGE_SIZE);
  const pageStatus = state === null
    ? "Review data will load when this panel is opened."
    : entries.length === 0
      ? "No captured changes in this live session."
      : `Changes ${offset + 1}–${offset + visibleEntries.length} of ${entries.length} · Page ${currentPage + 1} of ${lastPage + 1}`;

  return (
    <section id="change-review-panel" className="change-review" aria-labelledby="change-review-heading">
      <button
        id="change-review-toggle"
        className="change-review__toggle"
        type="button"
        aria-expanded={open}
        aria-controls="change-review-content"
        onClick={onToggle}
      >
        <span id="change-review-heading">Review changes</span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      <div id="change-review-content" className="change-review__content" hidden={!open}>
        <p className="muted">Already-applied review: inspect captured changes after a task. This is not patch approval.</p>
        {state?.limited && <p className="change-review__notice" role="status">Review capture capacity was reached; some changes could not be retained.</p>}
        {state?.reset && <p className="change-review__notice" role="status">Review history was reset for the current runtime or resource session.</p>}
        {state?.error === "unavailable" && <p className="change-review__warning" role="alert">Review data is unavailable; no captured diff can be opened for missing entries.</p>}
        {state?.error === "stale" && <p className="change-review__warning" role="status">Review data is stale; the runtime or source changed. Refresh the review before relying on it.</p>}
        {state && <p className="change-review__retention" role="status">Review text retained: {formatBytes(state.retainedBytes)} / 8 MiB.</p>}
        <p id="change-review-page-status" className="change-review__page-status" role="status" aria-live="polite">{pageStatus}</p>
        {state && entries.length > 0 && <nav className="change-review__pagination" aria-label="Review changes pages">
          <button id="change-review-first" className="btn-secondary" type="button" disabled={currentPage === 0} onClick={() => onPage(0)}>First page</button>
          <button id="change-review-previous" className="btn-secondary" type="button" disabled={currentPage === 0} onClick={() => onPage(currentPage - 1)}>Previous page</button>
          <button id="change-review-next" className="btn-secondary" type="button" disabled={currentPage === lastPage} onClick={() => onPage(currentPage + 1)}>Next page</button>
          <button id="change-review-latest" className="btn-secondary" type="button" disabled={currentPage === lastPage} onClick={() => onPage(lastPage)}>Latest page</button>
        </nav>}
        <div className="change-review__entries">
          {visibleEntries.map(entry => <ReviewEntry key={entry.id} entry={entry} onDiff={onDiff} onSource={onSource} />)}
        </div>
      </div>
    </section>
  );
}
