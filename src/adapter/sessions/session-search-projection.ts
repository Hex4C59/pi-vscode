import type { SavedSession, SavedSessionSearch } from "../../extension/contracts/index.js";
const normalized = (value: string): string => value.normalize("NFKC").toLowerCase();
/** Only the existing bounded metadata; always filter/sort before paging. */
export function searchSessionMetadata(entries: SavedSession[], search: SavedSessionSearch): SavedSession[] {
  const query = normalized(search.query.trim());
  const results = entries.filter(entry => (!search.namedOnly || !!entry.name?.trim())
    && (!query || normalized(entry.name ?? "").includes(query) || normalized(entry.firstMessage).includes(query)));
  return results.sort((a, b) => {
    const order = search.sort === "name" ? normalized(a.name?.trim() || a.firstMessage).localeCompare(normalized(b.name?.trim() || b.firstMessage), "en")
      : search.sort === "oldest" ? a.modified.localeCompare(b.modified) : b.modified.localeCompare(a.modified);
    return order || a.id.localeCompare(b.id);
  });
}
