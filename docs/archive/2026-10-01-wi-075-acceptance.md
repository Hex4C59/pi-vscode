# WI-075: DOC-ORG-03 acceptance

English | [中文](2026-10-01-wi-075-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical scoped record; not new implementation or product authorization

## Disposition

Closed October 1 by the agent under the maintainer's explicit scoped documentation authorization; not personal maintainer testing. Delivery commit: `0e75fe0`. [Proposal](2026-10-01-wi-075-approved-proposal.md). Historical record, not later Build authorization.

## Result and verification

Retain both guide pairs at their original paths. The [evaluation](2026-10-01-wi-075-guide-placement-evaluation.md) records the reproducible bd6ed12 reference snapshot, ten external reference owners, configuration costs and alternatives. Existing routes already expose the guides; directory consistency alone does not justify migration. No guide or configuration files changed.

- `npm run docs:verify`: zero errors, two existing Draft ADR 0010 warnings; bilingual check zero errors/warnings/stale notices.
- `npm run docs:health`: combined zero errors; existing two ADR notices retained. Manual semantic review restricted to this WI's files.
- `npm run commit:check` and complete cached-content review before each commit: pass.

## Limits

No product behavior, history deletion/relocation, PRD acceptance or ADR status change. No code tests, F5 or installed-VSIX evidence claimed for documentation-only work. Product candidates remain parked. The original parking-lot authorization remains historical; this session supplied the independent promotion authority.
