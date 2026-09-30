# WI-042: Approved Model-Picker Identity Scope

English | [中文](2026-09-30-wi-042-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-042 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-042-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

UI-01 was parked after the UI-components audit. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. REQ-002; no new ADR, gate or protocol change.

## Goal and Scope

The model list marks an applied radio by stable provider/model-id identity. Duplicate display labels and a label that collides with another model's canonical pair still mark at most one radio. This is presentation uniqueness, not a claim that the runtime received the wrong model.

## Approach

`appliedCatalogIdentity` prefers a unique `provider / modelId` match, then a unique display label. Duplicate labels mark none from the label path.

## Acceptance

Mounted collision and duplicate-label catalogues show one `aria-checked="true"`. Unique labels and canonical `provider / id` chatModel values still mark the matching entry. compile/lint/full `npm test`. Native macOS model-picker interaction is not required.

## Subsequent Limits

UI-02 Escape/focus, protocol changes, and runtime-selection claims remain outside.
