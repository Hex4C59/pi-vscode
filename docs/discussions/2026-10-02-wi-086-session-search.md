# WI-086 — current-project saved-session search

English | [中文](2026-10-02-wi-086-session-search.zh.md)

- Type: Reference
- Status: Draft
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


## Development checkpoint

Six worker/host/mounted scenarios were prepared before code. Initial host and mounted red were valid missing-feature failures; the worker fixture initially passed arguments in the wrong order. Corrected the fixture and replayed the prepared scenarios against archived pre-implementation commit e4b3e35: all six fail for missing search behavior/schema. Keep red.log and red-corrected-baseline.log distinct; do not pretend the initial worker failure proved the feature. Current six scenarios pass. No post-code unit tests were added. Standard checks caught the old list signal identity expectation: preserve exact legacy signal forwarding and use the new bounded composite cancellation only for search requests. A spike recording forwarder required explicit windowsHide last; fixed without weakening its policy test.

Compile/lint/all 1248 checks passed under curated environment with isolated HOME, empty auth, PI agent/tmp and no inherited tokens/proxy/options (compile-isolated.log, lint-isolated.log, tests-isolated.log, check-isolated-exit.txt). Earlier standard runs inherited the shell environment and are not evidence of isolated user-state checks. Future clean candidates must use the curated environment too. Worker/backend metadata tests are composition, not native host evidence. SDK probe node scripts/spikes/spike-session-search.mjs uses public SessionManager creation and production worker/backend: 40 synthetic current-project sessions plus foreign-project sentinels, 20 named rows, cross-page match, sorting/count/page clamp, zero-match and >5000 explicit refusal. All seven owned workers observed closed; zero inference or real accounts. JSON/TAP in dist/goal-eight/wi086/.

Real browser captures cover English/Chinese, 280/320/400 and light/dark/high contrast. Long staged query, named and sort controls have no form overflow; neutral checkbox and unapplied-criteria status clarify that visible results/paging still use the previous applied search. PreviewBridge does not implement the new search operation: captures prove rendered controls/staging/focus only, not applied search results. Production mounted client/host/worker evidence is separate. Native F5/installed search, paging and restore-consent acceptance remain blocked by isolated-Code binding, not waived. Implementation remains uncommitted; next scoped review/local commit and clean candidate checks.


## Committed candidate and handoff

Implementation 4bb653cfc6e01676183a5183de76aec10907ae1a; full scoped staged diff and commit:check reviewed, user gap discussion/ACTIVE grouping preserved. Final review restricted the 5000 cap to search requests so legacy non-search inspection/list semantics stay unchanged. Two development full-suite rechecks failed the unchanged frozen-history test's last-message assertion; focused test, previous 66ba52b full baseline and subsequent current full run passed. Keep failed logs and focused/baseline logs; intermittent cause not established, no assertion weakened.

Clean source candidate at /tmp/pi-resource-candidate-vQqd8G: compile/lint/1248 checks/docs:verify (two existing ADR warnings)/docs:health/actual SDK probe/package:vsix passed under curated isolated HOME/empty auth/agent/tmp. Status before/after empty, source SHA/commands/version/logs in dist/goal-eight/wi086/candidate-evidence/verified-candidate and candidate-identity.json. Seven workers closed, zero inference. Packaged VSIX is not installed evidence. Candidate browser en/zh 280px HC captures and keyboard focus confirm staged controls with no overflow; previous 18-image development matrix remains separately identified, not post-commit matrix. Preview does not apply the search operation.

Delegated acceptance under this authorization: composition/public SDK and bounded candidate checks support the slice; native F5/installed search/filter/sort/page/restore-confirmation and native visual acceptance remain unverified. No maintainer personal test or WI closure. Retain PI-GAP-24 as blocked pending the same safe isolated native app binding unlock; continue independent Mermaid investigation with WIP=1.


## Resumed native Prepare — 2026-10-03

The old app-binding blocker is resolved; WI-085 is closed. This is the sole WI under the original bounded authorization, with no new product scope. Existing implementation 4bb653c remains unchanged. Public pi 0.86.1 SessionManager.create / appendMessage / appendSessionInfo / appendModelChange / appendThinkingLevelChange will seed 40 owned current-project sessions and three distinguishable foreign-project sentinels in isolated HOME/agent state. No direct session-file editing, listAll, credentials, inference or automatic restoration. Existing explicit native restoration confirmation remains the only consent path.

Before harness code, prepare subprocess contracts for isolated F5/install launch, public SDK seed receipt, missing case review, failed installation, nonzero native exit, zero inference and provider cleanup. Failure modes: seed wrong project/model, invisible foreign leakage, only current-page matching, draft criteria mistaken for applied criteria, wrong page/count/tie/order, cancellation mutating current session, restore before confirmation, silent SDK failure, observer acceptance without evidence, stale app binding and owned job leak. Ordinary observer requires explicit per-case review; it neither replaces VS Code APIs nor approves UI.

Observable native acceptance: 40-project-only catalogue; cross-page literal query; named filtering; name/recent/oldest order; filter-before-pagination and refresh consistency; clear/no-match; cancellation preserving current session; explicit synthetic restoration and no auto-restore; English/Chinese keyboard and affected narrow/theme visuals. Independent F5 and installed VSIX lanes require actual source/package identity, PNG/AX artifacts, zero loopback inference, successful owned normal exit and provider closure. Mock contracts, actual public SDK, F5 and installed evidence stay separate. Native checks remain pending.


## Native harness checkpoint

Five pre-code contracts initially fail for missing tooling (red.log). First implementation failed four synthetic subprocess cases because the fake repository ESM package marker changed the fake Code executable loading; corrected the marker to the fake SDK directory only. Five contracts now pass, including SDK create calls for 40 current/three foreign sessions, missing review, failed install and nonzero exit with cleanup. Development compile/lint/1292/docs checks pass; native and committed-candidate checks remain pending. Logs: dist/goal-eight/wi086/native-harness/.
