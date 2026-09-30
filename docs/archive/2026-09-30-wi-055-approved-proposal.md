# WI-055: Approved ARCH-03 Inventory Scope

English | [中文](2026-09-30-wi-055-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-055 inventory is complete; final disposition belongs to the [acceptance record](2026-09-30-wi-055-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

ARCH-03 required listing runtime capability combinations before any interface split. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. Purely technical; no PRD slice, ADR or gate.

## Goal and Scope

Record required versus optional `PiRuntimeLifecycle` methods and which implementations provide them. Do not split into many interfaces.

## Approach

Read the contract, production factory, noop, probe and test harnesses.

## Acceptance

A discussion names combinations and whether optionals remain necessary. compile/lint/full `npm test` as regression when application code is unchanged.

## Subsequent Limits

Interface splits, ARCH-04 implementation, WI-036, gate/ADR and push remain outside.
