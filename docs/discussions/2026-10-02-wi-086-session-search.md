# WI-086 — current-project saved-session search

English | [中文](2026-10-02-wi-086-session-search.zh.md)

- Type: Reference
- Status: Active
- Created: 2026-10-02
- Authority: bounded PI-GAP-24 Prepare; no delivery or acceptance claim
- Related: [ACTIVE](../../ACTIVE.md), [goal](2026-10-03-eight-gap-goal.md), [requirements](../product-requirements.md)

## Prepare, current implementation and approval

The bounded goal approves current-project search, named filtering and sorting without global discovery or automatic restoration. WI-085 is committed/clean-candidate verified but retains its native blocker; this is the sole current WI. Inspected SessionBackend/worker protocol, public pi 0.86.1 SessionManager.list signature, worker metadata/limits, host catalogue and restoration owner, client pagination and production CandidateSessions. The worker already uses public SessionManager.list(cwd, undefined, progress, signal) for the whole current-project catalogue, validates each cwd against canonical project identity, projects bounded name/first-message metadata and then pages 16 rows, recent-first. It does not use listAll or parse session files. Existing restoration performs explicit confirmation and sequential stop/inspect/start; preserve it unchanged.

## Proposed contract and requirement/architecture impact

Search existing bounded titles/names and first-message previews across the whole approved catalogue, not just the page; explicitly label this metadata search, not transcript/full-text search. Do not add allMessagesText, full session bodies, indexes or persistent query storage. Literal Unicode-normalized case-insensitive matching, optional named-only (nonblank name), sorts recent/oldest/name with stable id tie-break. Apply filter/sort before 16-row pagination; returned total is filtered count, pages clamp to the last valid page after catalogue changes. Search query up to 256 UTF-16 characters, fixed boolean/sort enum, exact allowlisted host validation.

A named version-3 searchSavedSessions intent stages query/named/sort only; host owns applied search criteria. It resets page/catalogue to zero for a new search. Existing refresh/pagination/rename-refresh use the same applied host criteria. Session state projects applied criteria as optional additive DTO metadata, retaining old fixture/default compatibility. Dedicated compact form with explicit Search/Enter, Clear, named checkbox and sort select; no implicit typing requests or automatic restore. Busy controls disabled; no-results differs from no sessions, errors retain recoverable controls. New failed search must not show old rows under new criteria. Workspace/generation replacement, cancellation/disposal and pending restore keep existing serialization/ownership rules.

Bound complete enumeration to 5000 sessions using public progress/cancellation plus final array check and the existing 15-second worker deadline. Above-budget/unknown scan completion is an explicit catalogue-too-large/unavailable failure, never a truncated search presented as complete. No cross-project list, additional session directory, body search, resource consent or persistence changes. REQ-008/009 user-visible slice; architecture owners stay worker translation, host state/admission, presentation-only UI. UI uses existing VS Code tokens; no new theme/spacing system.

## Failure modes before code

Filtering only current page; paging old criteria; wrong filtered total or unstable ties; stale out-of-range page; named whitespace; Unicode/case mismatch; regex/script interpretation; oversized/malformed/extra fields; over-budget scan silently truncated; cancelled/late result becoming current; switching workspace exposing another project's rows; missing/invalid metadata or failed scan shown as empty; failed new search displaying old rows; restored conversation automatically; restore confirmation/Stop/rename coordination lost; search persisted/logged or full bodies collected; Enter accidentally sends chat; translated/narrow/HC controls clip, lose focus or cannot be operated.

## Observable acceptance and artifacts

Before code prepare worker→public SDK boundary composition over >16 synthetic sessions, cross-page query/named/sorts/count/clamp, malformed query and >5000 failure; provider→backend search/page/refetch/error/late isolation and unchanged restore confirmation; mounted production input/apply/clear/controls/empty/error/keyboard with allowlisted client intents. No post-code unit tests. Run compile/lint/npm test/docs:verify and clean committed candidate checks/packaging. Actual isolated SDK worker reads synthetic sessions created through public SessionManager; observe owned child close and retain JSON/TAP. Real browser captures English/Chinese, 280/320/400, three themes and keyboard are synthetic-host rendering only. Actual F5/installed VSIX separately require current-project search/filter/sort/pagination and explicit restore consent; isolated-Code binding remains a blocker, not acceptance. Evidence root dist/goal-eight/wi086/. No implementation or pass at Prepare.
