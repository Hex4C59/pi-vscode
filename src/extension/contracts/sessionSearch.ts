import type { SavedSessionSearch } from "./webviewProtocol.js";
export const DEFAULT_SESSION_SEARCH: Readonly<SavedSessionSearch> = { query: "", namedOnly: false, sort: "recent" };
/** Exact host/worker criteria validation; no paths, regex or session bodies. */
export function isSavedSessionSearch(value: unknown): value is SavedSessionSearch {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const search = value as Record<string, unknown>;
  return Object.keys(search).length === 3 && Object.hasOwn(search, "query") && Object.hasOwn(search, "namedOnly") && Object.hasOwn(search, "sort")
    && typeof search.query === "string" && search.query.length <= 256
    && !Array.from(search.query).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
    && typeof search.namedOnly === "boolean" && typeof search.sort === "string" && ["recent", "oldest", "name"].includes(search.sort);
}
