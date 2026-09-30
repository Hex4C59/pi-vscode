# WI-071: Approved Webview directory organization

English | [中文](2026-10-01-wi-071-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical approved scope, not a new Build authorization for later slices
- Archival reason: WI-071 grouped presentation files by the Webview README tree; remaining ACTIVE tasks are independent.

## Approval and Traceability

The maintainer `/goal` to complete every ACTIVE.md task authorized this Build after WI-070. Pure technical: group existing Webview files, no user-visible behavior, protocol or contract change. Decision: none. No gate. No new PRD row.

## Goal and Scope

Move `src/webview/` onto the README tree: `chat/{composer,conversation,sessions,execution,workspace}`, `client/`, `i18n/`, `ui/` for confirmed shared presentation, and keep `components/` as the public presentation entry. Preserve production/preview split. Do not rename `candidate-*`. Do not change CSS cascade semantics beyond required path updates.

## Approach

`git mv` by feature, rewrite relative imports, keep stylesheet order in `styles.css`, and satisfy `architecture-boundaries` public-entry rules without adding feature-folder modules. Client-owned types live in `client/types.ts`; the Webview layer `types.ts` re-exports them. `UiLanguageState` lives with `i18n/ui-language.ts`; `chat/types.ts` re-exports it.

## Acceptance

`npm run compile`, `npm run lint`, `npm test`. Production still mounts from `main.tsx`. No user-visible behavior change. `docs:verify` after path updates.

## Subsequent Limits

Runtime rpc grouping. Docs directory navigation and PI-GAP candidates stay parked unless separately promoted.
