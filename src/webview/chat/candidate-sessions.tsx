import { useUiText } from "../components/index.js";
import type { SessionsProps } from "../components/index.js";


/** Candidate catalogue presentation; identity and navigation eligibility stay in the client. */
export function CandidateSessions({ state, pageSize, onPage, onRefresh, onResume }: Pick<SessionsProps, "state" | "pageSize" | "onPage" | "onRefresh" | "onResume">) {
  const { locale, text: t } = useUiText();
  const dateFormat = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "2-digit", timeZone: "UTC" });
  const loading = !state || state.phase === "listing" || (!state.loaded && !state.error);
  const busy = loading || state?.phase === "confirming" || state?.phase === "switching";
  const page = state?.page ?? 0;
  const lastPage = Math.max(0, Math.ceil((state?.total ?? 0) / pageSize) - 1);
  return <section className="candidate__catalogue" aria-label={t("Saved conversations")} aria-busy={busy}>
    <header className="candidate__history-heading">
      <h2>{t("Chat history")}</h2>
      <button className="candidate__icon" type="button" aria-label={t("Refresh saved conversations")} title={t("Refresh history")} disabled={busy} onClick={onRefresh}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 7a6 6 0 1 0 0 6M16 3v4h-4" /></svg>
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
            aria-current={state.current?.id === entry.id ? "true" : undefined} title={details}
            disabled={busy || state.error === "stale"} onClick={event => { event.currentTarget.focus(); onResume(entry.id); }}>
            <span className="candidate__session-title">{entry.title || t("Untitled conversation")}</span>
            <time dateTime={entry.modified}>{Number.isNaN(modified.getTime()) ? entry.modified : dateFormat.format(modified)}</time>
          </button>
        </li>;
      })}
    </ul>
    <nav className="candidate__pages" aria-label={t("Saved conversation pages")}>
      <button className="candidate__icon" type="button" aria-label={t("Previous conversations")} title={t("Previous page")} disabled={busy || page === 0} onClick={() => onPage(page - 1)}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12 5-5 5 5 5" /></svg>
      </button>
      <span role="status">{t("Page {page} of {total}", { page: page + 1, total: lastPage + 1 })}</span>
      <button className="candidate__icon" type="button" aria-label={t("Next conversations")} title={t("Next page")} disabled={busy || page === lastPage} onClick={() => onPage(page + 1)}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m8 5 5 5-5 5" /></svg>
      </button>
    </nav>
  </section>;
}
