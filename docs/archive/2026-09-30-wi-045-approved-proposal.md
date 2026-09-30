# WI-045: Approved Missing-Path Localization Scope

English | [中文](2026-09-30-wi-045-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-045 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-045-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

UI-03 was parked after the UI-components audit. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. REQ-007; no new ADR or gate.

## Goal and Scope

A missing review path uses the same translation entry for visible body text and tooltip. English and Chinese both apply. This is localization consistency, not file access or authorization.

## Approach

`ReviewEntry` renders `entry.path ?? t("Path unavailable")` for both the body and `title`.

## Acceptance

A null-path entry shows matching English then Chinese body and tooltip. compile/lint/full `npm test`. Native review UI is not required.

## Subsequent Limits

RUNTIME-03 diagnostic work remains outside.
