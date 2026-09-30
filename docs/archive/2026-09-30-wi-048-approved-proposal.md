# WI-048: Approved Default-Save Failure Scope

English | [中文](2026-09-30-wi-048-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-048 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-048-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

ARCH-02 supplement was parked after the architecture backlog. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. Purely technical; no PRD slice, ADR or gate. Original ARCH-02 sequence encapsulation stays outside.

## Goal and Scope

A default-model save that did not commit must not apply the requested model to the live session. The save result distinguishes committed, failed, not-run and stale; later live-session actions use only a committed result.

## Approach

`ProviderConfig.setDefaultModel` returns a discriminated save result. `configureProvider` applies `syncSessionModelsAfterProviderConfig` with the saved identity only when `kind` is `committed`.

## Acceptance

Inject a settings flush failure: the default projection keeps the old model and reports the save error; live `applyConfiguredModel` does not receive the new model. compile/lint/full `npm test`.

## Subsequent Limits

Original ARCH-02 sequence encapsulation, ARCH-07, ADR 0005, gate and ADR remain outside.
