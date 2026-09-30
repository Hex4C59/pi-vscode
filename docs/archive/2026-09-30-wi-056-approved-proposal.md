# WI-056: Approved ARCH-04 Inventory Scope

English | [中文](2026-09-30-wi-056-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-056 inventory is complete; final disposition belongs to the [acceptance record](2026-09-30-wi-056-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

ARCH-04 required checking model/Webview type sharing before any duplication. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. Purely technical; no PRD slice, ADR or gate.

## Goal and Scope

Record shared value objects versus host-only admission types. Do not copy DTOs for a hypothetical extra client.

## Approach

Read `models/types.ts`, `runtimeLifecycle.ts` and `webviewProtocol.ts`.

## Acceptance

A discussion names shared fields, propagation cost, and whether a split is needed. compile/lint/full `npm test` as regression when application code is unchanged.

## Subsequent Limits

DTO duplication, WI-036, gate/ADR and push remain outside.
