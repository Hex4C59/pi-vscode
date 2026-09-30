# WI-060: Approved host plugin-inventory store

English | [中文](2026-10-01-wi-060-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical approved scope, not a new Build authorization for later slices
- Archival reason: WI-060 host store is implemented and tested; Settings UI remains parked.

## Approval and Traceability

The maintainer `/goal` to complete every ACTIVE.md task authorized this Build after WI-059. User-visible: none yet (REQ-010 persistence). Decision: Draft ADR 0010. No gate.

## Goal and Scope

Host file `plugin-inventory-v1.json` under `globalStorageUri`: absolute path identity plus enabled flag. Missing, damaged and too-large files stay unchanged. No secrets in the file. No runtime load, no Settings UI, no Webview messages.

## Approach

`src/extension/extension-loading/plugin-inventory.ts` owns load/replace. Validate entries at the boundary. Atomic temp+rename replace. Reuse the trusted-entry suffix and sensitive-path rules.

## Acceptance

Missing loads empty without creating the file. Round-trip stores only schemaVersion/entries/path/enabled. Duplicate, relative and sensitive paths refuse without rewrite. Damaged and oversized files refuse replace. compile/lint/full `npm test`. Native F5 not required.

## Subsequent Limits

Settings Plugins, remove/enable UI, runtime apply, composer fold, ADR 0010 acceptance.
