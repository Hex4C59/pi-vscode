# WI-069: Approved canonical live model identity

English | [中文](2026-10-01-wi-069-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical approved scope, not a new Build authorization for later slices
- Archival reason: WI-069 canonical live-model projection is implemented and tested; remaining ACTIVE tasks are independent.

## Approval and Traceability

The maintainer `/goal` to complete every ACTIVE.md task authorized this Build after WI-068. User-visible: existing REQ-002 unique applied model when display names collide. Decision: none. No gate.

## Goal and Scope

Project the live model as `provider / modelId`, not `name`. Keep catalog labels. Do not restore the provider on the chip.

## Approach

Change `formatModelLabel` used by start and `get_state` projections. Catalog parsing is unchanged.

## Acceptance

Two models that share a display name project distinct identities. compile/lint/`npm test`. Native F5 not required.

## Subsequent Limits

REQ-009 remainder, directory organization.
