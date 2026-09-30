# WI-065: Approved composer execution-profile fold

English | [中文](2026-10-01-wi-065-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical approved scope, not a new Build authorization for later slices
- Archival reason: WI-065 composer fold is implemented and tested; remaining ACTIVE tasks are independent.

## Approval and Traceability

The maintainer `/goal` to complete every ACTIVE.md task authorized this Build after WI-064. User-visible: REQ-010 slice 7. Decision: Draft ADR 0010. No gate.

## Goal and Scope

Composer permissions show execution-profile status and recovery only. Add/remove/enable stay in Settings Plugins. Switching to Trusted no longer opens a file picker; zero enabled entries fail visibly and point at Settings. Load semantics, coverage warning and Controlled default stay.

## Approach

`selectTrustedApply` requires a single enabled inventory path. Empty, damaged and extra-enabled sets fail with fixed codes and never call `showOpenDialog`. Composer copy describes Settings-owned add.

## Acceptance

One enabled entry still confirms then loads. Zero enabled entries do not open a picker and do not start Trusted. Recovery controls remain. compile/lint/`npm test`. Native F5 not required.

## Subsequent Limits

Download/marketplace, ADR 0010 Accepted.
