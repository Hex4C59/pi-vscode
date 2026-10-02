import { useEffect, useId, useState, type ReactElement } from "react";
import type { SavedSessionSearch } from "../../../extension/contracts/index.js";
import { useUiText } from "../../components/index.js";
const empty: SavedSessionSearch = { query: "", namedOnly: false, sort: "recent" };

/** Staged metadata criteria; only explicit submit/Clear produces a host intent. */
export function SessionSearch({ search = empty, busy, onSearch }: {
  search?: SavedSessionSearch; busy: boolean; onSearch: (search: SavedSessionSearch) => void;
}): ReactElement {
  const { text: t } = useUiText(); const id = useId();
  const [draft, setDraft] = useState(search);
  useEffect(() => { setDraft(search); }, [search.query, search.namedOnly, search.sort]);
  const unapplied = draft.query !== search.query || draft.namedOnly !== search.namedOnly || draft.sort !== search.sort;
  return <form className="candidate__session-search" onSubmit={event => { event.preventDefault(); event.stopPropagation(); if (!busy) onSearch(draft); }}>
    <label htmlFor={id}>{t("Search names and first-message previews")}</label>
    <input id={id} type="search" maxLength={256} disabled={busy} value={draft.query}
      aria-label={t("Search names and first-message previews")} onChange={event => setDraft({ ...draft, query: event.target.value })} />
    <div className="candidate__session-search-options">
      <label><input type="checkbox" disabled={busy} checked={draft.namedOnly} onChange={event => setDraft({ ...draft, namedOnly: event.target.checked })} />{t("Named only")}</label>
      <select aria-label={t("Session sort order")} disabled={busy} value={draft.sort} onChange={event => {
        const sort = event.target.value; if (sort === "recent" || sort === "oldest" || sort === "name") setDraft({ ...draft, sort });
      }}><option value="recent">{t("Most recent first")}</option><option value="oldest">{t("Oldest first")}</option><option value="name">{t("Name order")}</option></select>
    </div>
    <div className="candidate__session-search-actions">
      <button type="submit" disabled={busy} aria-label={t("Apply session search")}>{t("Search")}</button>
      <button type="button" disabled={busy} aria-label={t("Clear session search")} onClick={() => { setDraft(empty); onSearch({ ...empty }); }}>{t("Clear")}</button>
      <span>{t("Names and previews only.")}</span>
    </div>
    {unapplied && <span role="status">{t("Criteria not applied yet. Results use the previous search.")}</span>}
  </form>;
}
