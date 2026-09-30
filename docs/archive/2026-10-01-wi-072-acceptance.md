# WI-072: Runtime RPC grouping acceptance

English | [中文](2026-10-01-wi-072-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical scoped record; not new implementation or product authorization

## Disposition and evidence identity

Closed October 1 by the agent under the maintainer's scoped delivery authorization, not personal maintainer testing. Implementation: `5f020b5`. [Approved proposal](2026-10-01-wi-072-approved-proposal.md). Archive retains proposal and evidence; ACTIVE advances to DOC-NAV-01 only.

## Placement and checks

Eight transport/session helpers and twelve existing specs now live in runtime/rpc. Root coordinators pi-rpc-runtime.ts and rpc-frames.ts remain with excluded collaborators; public entries, behavior, RPC and packaging semantics are unchanged. Full staged-content audit verified path-only changes. No tests were added after implementation.

- `npm run compile`: pass.
- `npm run lint`: pass.
- `npm test`: final rerun 1064 pass, zero fail/cancel/skip.
- `npm run docs:verify`: zero errors; two existing Draft ADR 0010 warnings retained.
- `npm run docs:health`: zero errors; same two existing Draft ADR 0010 notices retained.
- `npm run commit:check` and full cached-content review: pass before commits.

Initial validation caught illegal root-helper imports in the attempted ten-file placement; retaining the two coordinators resolved it without changing the checker. The same initial run failed an untouched default-save model assertion (null versus old-model); rerun passed. This is a transient observation, not a diagnosed or repaired product bug.

## Limits

No F5, installed VSIX, runtime spike, Windows or product acceptance claimed. Documentation repairs only relocate existing links, retaining historical claims. PI-GAP-01–28 remain candidates; no ADR status changes.
