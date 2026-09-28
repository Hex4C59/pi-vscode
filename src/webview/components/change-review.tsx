import { useUiText, type UiText, type UiTranslator } from "./ui-text.js";
import type { ReactElement } from "react";
import type { ChangeReviewEntry, ReviewReason } from "../../extension/contracts/index.js";
import type { ChangeReviewProps } from "./types.js";
export type { ChangeReviewProps } from "./types.js";


const reasonLabels: Record<ReviewReason, UiText> = {
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

function sourceLabel(entry: ChangeReviewEntry, t: UiTranslator): string {
  return entry.source === "tool"
    ? t("Tool-reported · {tool}", { tool: entry.tool ?? "write/edit" })
    : t("Observed workspace change");
}

function statusLabel(status: ChangeReviewEntry["status"], t: UiTranslator): string {
  const labels: Record<ChangeReviewEntry["status"], UiText> = { complete: "Complete", failed: "Failed", interrupted: "Interrupted", pending: "Pending", observed: "Observed" };
  return t(labels[status]);
}

function diffLabel(diff: ChangeReviewEntry["diff"], t: UiTranslator): string {
  const labels: Record<ChangeReviewEntry["diff"], UiText> = { ready: "Ready", unchanged: "Unchanged", pending: "Pending", unavailable: "Unavailable" };
  return t(labels[diff]);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MiB`;
}

function ReviewEntry({ entry, onDiff, onSource }: Pick<ChangeReviewProps, "onDiff" | "onSource"> & { entry: ChangeReviewEntry }): ReactElement {
  const { text: t } = useUiText();
  const canOpenDiff = entry.diff === "ready" || entry.diff === "unchanged";
  return (
    <article className="change-review__entry" data-review-entry-id={entry.id}>
      <div className="change-review__entry-heading">
        <strong className="change-review__path" title={entry.path ?? t("Path unavailable")}>{entry.path ?? "Path unavailable"}</strong>
        <span className="change-review__source">{sourceLabel(entry, t)}</span>
      </div>
      <p className="change-review__meta">
        <span>{t("Outcome: {status}", { status: statusLabel(entry.status, t) })}</span>
        <span>{t("Text difference: {diff}", { diff: diffLabel(entry.diff, t) })}</span>
      </p>
      {entry.reason !== null && <p className="change-review__notice">{t("Reason: {reason}", { reason: t(reasonLabels[entry.reason]) })}</p>}
      {entry.overlap && <p className="change-review__warning">{t("Concurrent changes overlapped this entry; attribution is not isolated.")}</p>}
      {entry.sourceChanged && <p className="change-review__warning">{t("Source changed after capture; the current source may differ from this review.")}</p>}
      <div className="change-review__actions">
        {canOpenDiff && <button className="btn-secondary" type="button" data-review-action="diff" onClick={() => onDiff(entry.id)}>{t("View captured diff")}</button>}
        {entry.path !== null && <button className="btn-secondary" type="button" data-review-action="source" onClick={() => onSource(entry.id)}>{t("Open current source")}</button>}
      </div>
    </article>
  );
}

export function ChangeReview({ pageSize, state, open, page, onToggle, onPage, onDiff, onSource, caption, introduction }: ChangeReviewProps): ReactElement {
  const { text: t } = useUiText();
  const entries = state?.entries ?? [];
  const lastPage = Math.max(0, Math.ceil(entries.length / pageSize) - 1);
  const currentPage = Math.min(Math.max(0, page), lastPage);
  const offset = currentPage * pageSize;
  const visibleEntries = entries.slice(offset, offset + pageSize);
  const pageStatus = state === null
    ? t("Review data will load when this panel is opened.")
    : entries.length === 0
      ? t("No captured changes in this live session.")
      : t("Changes {start}–{end} of {total} · Page {page} of {pages}", { start: offset + 1, end: offset + visibleEntries.length, total: entries.length, page: currentPage + 1, pages: lastPage + 1 });

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
        <span id="change-review-heading">{caption ?? t("Review changes")}</span>
        <svg className="change-review__chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6" /></svg>
      </button>
      <div id="change-review-content" className="change-review__content" hidden={!open}>
        {open && introduction}
        <p className="muted">{t("Already-applied review: inspect captured changes after a task. This is not patch approval.")}</p>
        {state?.limited && <p className="change-review__notice" role="status">{t("Review capture capacity was reached; some changes could not be retained.")}</p>}
        {state?.reset && <p className="change-review__notice" role="status">{t("Review history was reset for the current runtime or resource session.")}</p>}
        {state?.error === "unavailable" && <p className="change-review__warning" role="alert">{t("Review data is unavailable; no captured diff can be opened for missing entries.")}</p>}
        {state?.error === "stale" && <p className="change-review__warning" role="status">{t("Review data is stale; the runtime or source changed. Refresh the review before relying on it.")}</p>}
        {state && <p className="change-review__retention" role="status">{t("Review text retained: {bytes} / 8 MiB.", { bytes: formatBytes(state.retainedBytes) })}</p>}
        <p id="change-review-page-status" className="change-review__page-status" role="status" aria-live="polite">{pageStatus}</p>
        {state && entries.length > 0 && <nav className="change-review__pagination" aria-label={t("Review changes pages")}>
          <button id="change-review-first" className="btn-secondary" type="button" disabled={currentPage === 0} onClick={() => onPage(0)}>{t("First page")}</button>
          <button id="change-review-previous" className="btn-secondary" type="button" disabled={currentPage === 0} onClick={() => onPage(currentPage - 1)}>{t("Previous page")}</button>
          <button id="change-review-next" className="btn-secondary" type="button" disabled={currentPage === lastPage} onClick={() => onPage(currentPage + 1)}>{t("Next page")}</button>
          <button id="change-review-latest" className="btn-secondary" type="button" disabled={currentPage === lastPage} onClick={() => onPage(lastPage)}>{t("Latest page")}</button>
        </nav>}
        <div className="change-review__entries">
          {visibleEntries.map(entry => <ReviewEntry key={entry.id} entry={entry} onDiff={onDiff} onSource={onSource} />)}
        </div>
      </div>
    </section>
  );
}
