import type { ReactElement, RefObject } from "react";
import { SessionIcon } from "./session-icon.js";
import { useUiText } from "../components/index.js";
import type { SessionsProps } from "../components/index.js";

type HistoryProps = Pick<SessionsProps, "state" | "pageSize" | "onPage" | "onRefresh" | "onResume"> & {
  open: boolean;
  id: string;
  back: RefObject<HTMLButtonElement | null>;
  onBack: () => void;
};

/** Owns the history surface; the page owns visibility, reading position and cross-region focus. */
export function CandidateSessions({ state, pageSize, onPage, onRefresh, onResume, open, id, back, onBack }: HistoryProps): ReactElement {
  const { locale, text: t } = useUiText();
  const dateFormat = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "2-digit", timeZone: "UTC" });
  const loading = !state || state.phase === "listing" || (!state.loaded && !state.error);
  const busy = loading || state?.phase === "confirming" || state?.phase === "switching";
  const page = state?.page ?? 0;
  const lastPage = Math.max(0, Math.ceil((state?.total ?? 0) / pageSize) - 1);
  return <div className="candidate__history" id={id} role="region" aria-label={t("Conversation history")} hidden={!open}>
    <section className="candidate__catalogue" aria-label={t("Saved conversations")} aria-busy={busy}>
      <header className="candidate__history-heading">
        <button className="candidate__icon session-icon-button candidate__history-back" type="button" aria-label={t("Back to conversation")} title={t("Back to conversation")} ref={back} onClick={onBack}>
          <SessionIcon name="arrow-left" />
        </button>
        <h2>{t("Chat history")}</h2>
        <button className="candidate__icon session-icon-button" type="button" aria-label={t("Refresh saved conversations")} title={t("Refresh history")} disabled={busy} onClick={onRefresh}>
          <SessionIcon name="refresh-cw" />
        </button>
      </header>
      {(state?.error || loading || !state?.entries.length) && <div className="candidate__catalogue-feedback">
        {state?.error && <p role="alert">{t("Saved conversations: {error}. Refresh or retry the handoff. No conversation switch was made.", { error: state.error })}</p>}
        {loading && <p role="status">{t("Loading saved conversations…")}</p>}
        {!loading && !state?.error && !state?.entries.length && <p role="status">{t("No saved conversations in this project.")}</p>}
      </div>}
      <ul className="candidate__session-list">
        {state?.entries.slice(0, pageSize).map(entry => {
          const modified = new Date(entry.modified);
          const details = t("{excerpt}\nModified: {modified}", { excerpt: entry.excerpt || t("No preview available."), modified: entry.modified });
          return <li key={entry.id}>
            <button className="candidate__session" type="button" aria-label={t("Restore {title}", { title: entry.title || t("untitled conversation") })} aria-description={details}
              aria-current={state.current?.id === entry.id ? "true" : undefined} title={`${entry.title || t("Untitled conversation")}\n${details}`}
              disabled={busy || state.error === "stale"} onClick={event => { event.currentTarget.focus(); onResume(entry.id); }}>
              <span className="candidate__session-title">{entry.title || t("Untitled conversation")}</span>
              <span className="candidate__session-meta"><time dateTime={entry.modified}>{Number.isNaN(modified.getTime()) ? entry.modified : dateFormat.format(modified)}</time><span className="candidate__session-current" title={state.current?.id === entry.id ? t("Current conversation") : undefined} aria-hidden="true">
                {state.current?.id === entry.id && <SessionIcon name="check" />}
              </span></span>
            </button>
          </li>;
        })}
      </ul>
      <nav className="candidate__pages" aria-label={t("Saved conversation pages")}>
        <button className="candidate__icon session-icon-button" type="button" aria-label={t("Previous conversations")} title={t("Previous page")} disabled={busy || page === 0} onClick={() => onPage(page - 1)}>
          <SessionIcon name="chevron-left" />
        </button>
        <span role="status">{t("Page {page} of {total}", { page: page + 1, total: lastPage + 1 })}</span>
        <button className="candidate__icon session-icon-button" type="button" aria-label={t("Next conversations")} title={t("Next page")} disabled={busy || page === lastPage} onClick={() => onPage(page + 1)}>
          <SessionIcon name="chevron-right" />
        </button>
      </nav>
    </section>
  </div>;
}
