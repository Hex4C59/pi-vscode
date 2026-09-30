# WI-054: Approved ARCH-01 Inventory Scope

English | [中文](2026-09-30-wi-054-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-054 inventory is complete; final disposition belongs to the [acceptance record](2026-09-30-wi-054-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

ARCH-01 required tabulating admission owners before any coordinator split. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. Purely technical; no PRD slice, ADR or gate.

## Goal and Scope

Record who owns send, model, Stop, profile, session and folder admission. Do not merge busy flags or split by file length.

## Approach

Read the coordinator, ModelSettings, rpc-occupancy and injected draft/tools callbacks.

## Acceptance

A discussion names owners, operation gates, and duplication versus drift. compile/lint/full `npm test` as regression when application code is unchanged.

## Subsequent Limits

Merging busy, file-length splits, ARCH-03/04 implementation, WI-036, gate/ADR and push remain outside.
