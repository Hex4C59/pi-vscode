# WI-061: Approved Settings Plugins empty list and add from disk

English | [中文](2026-10-01-wi-061-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical approved scope, not a new Build authorization for later slices
- Archival reason: WI-061 Settings Plugins empty list and add-from-disk is implemented and tested; remove/enable remain parked.

## Approval and Traceability

The maintainer `/goal` to complete every ACTIVE.md task authorized this Build after WI-060. User-visible: REQ-010 slice 3. Decision: Draft ADR 0010. No gate.

## Goal and Scope

Settings gains a **Plugins** category. An empty inventory is visible. **Add from disk** opens the native file picker and writes identity-checked absolute entry paths into `plugin-inventory-v1.json` (default `enabled: true`). The Webview projection is `{displayName}` only (basename, ≤512 UTF-8). Empty, duplicate and invalid-path states are visible. Add does not start, stop or mutate a live runtime and does not open load confirmation.

## Approach

New `pluginInventoryState` and payload-less `addPluginInventoryEntry`. The settings panel allowlists that intent. Reuse pick plus realpath/suffix/regular-file/not-symlink/not-sensitive-path checks; do not call `confirm`. Damaged or oversized inventories stay unchanged and report `existing-unusable`. The host owns paths; the Webview renders the projection.

## Acceptance

Empty list. Successful add shows the basename and appends one file entry. Cancel does not write. Duplicate and invalid paths do not write and report an error. Runtime and execution profile stay unchanged after add. compile/lint/full `npm test`. Preview confirms the Plugins category. Native F5 not required.

## Subsequent Limits

Remove, enable UI, runtime `-e`, composer fold, ADR 0010 acceptance.
