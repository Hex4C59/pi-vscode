# WI-052: Approved Resource and Timeout Measurement Scope

English | [中文](2026-09-30-wi-052-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-052 measurement is complete; final disposition belongs to the [acceptance record](2026-09-30-wi-052-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

The parking-lot item required measuring startup settings, diagnostic stderr, artifact inflate, and test/Git timeouts separately from ARCH-08. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. Purely technical; no PRD slice, ADR or gate.

## Goal and Scope

Record actual costs and outer constraints. Add a budget only if measurement shows it is necessary. This slice does not implement budgets or claim a stall.

## Approach

Read the four production/script paths and time representative files and synthetic payloads on this tree. Do not optimize ARCH-08.

## Acceptance

A discussion names: behavior of each path, measured sizes/times, outer CI/job limits, and whether a budget is necessary. compile/lint/full `npm test` as regression when application code is unchanged.

## Subsequent Limits

Implementing budgets, ARCH-08 optimization, ARCH inventories, WI-036, gate/ADR and push remain outside.
