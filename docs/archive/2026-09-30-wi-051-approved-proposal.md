# WI-051: Approved Interface-Risk Verification Scope

English | [中文](2026-09-30-wi-051-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-051 caller evidence is complete; final disposition belongs to the [acceptance record](2026-09-30-wi-051-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

The parking-lot item required verifying Composer flags against workspace and FileSnapshot validator pairing before any type tightening. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. Purely technical; no PRD slice, ADR or gate.

## Goal and Scope

Record production owners and callers. Tighten only if a reproducible production mis-pair is proven. Otherwise record that none was found and close.

## Approach

Read `Candidate` flag derivation, `MessageComposer` mounts, `DraftAttachment` kind, and every `validateEditorSnapshot` / `validateSelectionDocument` call site. Do not split modules by file length or prop count.

## Acceptance

A discussion names: where production Composer flags are derived, which validator each FileSnapshot source uses, and whether a wrong pairing is confirmed. compile/lint/full `npm test` as regression when application code is unchanged.

## Subsequent Limits

Type tightening without a production error, ARCH inventories, resource measurement, WI-036, gate/ADR and push remain outside.
