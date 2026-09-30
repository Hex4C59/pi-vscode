# WI-064: Approved idle Trusted inventory apply

English | [中文](2026-10-01-wi-064-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical approved scope, not a new Build authorization for later slices
- Archival reason: WI-064 idle Trusted apply is implemented and tested; composer fold remains parked.

## Approval and Traceability

The maintainer `/goal` to complete every ACTIVE.md task authorized this Build after WI-063. User-visible: REQ-010 slice 6. Decision: Draft ADR 0010. No gate.

## Goal and Scope

Idle Trusted start or Execution-profile switch loads the then-enabled inventory through the public extra `-e`. Controlled never loads inventory. Native coverage confirmation stays. If more than one extra `-e` would be required, fail visibly. Failure recovery is unchanged. No skip-approvals and no auto-discovery.

## Approach

`trustedInventoryApply` reads the host file. Zero enabled entries keep the composer picker. One enabled entry skips the picker, still confirms, then starts with that canonical path. Extra enabled entries set `too-many-enabled` and leave Controlled running. A damaged store sets `inventory-unusable` instead of pretending the list is empty.

## Acceptance

Controlled start has no inventory `-e`. One enabled entry loads after confirmation without a picker. Extra enabled entries fail visibly and do not start Trusted. compile/lint/`npm test`. Native F5 not required.

## Subsequent Limits

Composer fold, download/marketplace, ADR 0010 Accepted.
