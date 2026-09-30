# WI-075: DOC-ORG-03 approved proposal

English | [中文](2026-10-01-wi-075-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical scoped record; not new implementation or product authorization

## Approval and archival reason

Archived after the independent documentation WI closed. Prepare checked this scope and risks before Build. The October 1 maintainer prompt explicitly authorized sequential DOC-NAV-01, DOC-NAV-02 and DOC-ORG-03 after WI-072, WIP=1; not inherited old-goal authority. This record applies only to DOC-ORG-03.

## Scope and approach

Evaluate whether the Git convention and bilingual guide pairs should move from docs root to guides. Review actual reference owners, relative links and required-pair configuration first; a no-migration conclusion is explicitly allowed when benefit is insufficient.

Pure technical documentation maintenance: no user-visible behavior or new PRD row, gate none, decision none. Keep historical facts, approval and ADR status, the six major documentation categories and English/Chinese pairing. Do not delete/move history or build any PI-GAP candidate. Check actual inventories and all affected links before changing navigation; missing standalone evidence stays explicit.

## Acceptance and commit boundary

Retain both guide pairs at their original paths. The [evaluation](2026-10-01-wi-075-guide-placement-evaluation.md) records the reproducible bd6ed12 reference snapshot, ten external reference owners, configuration costs and alternatives. Existing routes already expose the guides; directory consistency alone does not justify migration. No guide or configuration files changed. Run docs:verify and close-time docs:health, review complete cached content and run commit:check. Commit delivered docs before the separate ACTIVE closure/promotion. No unrelated code builds or F5 required.
