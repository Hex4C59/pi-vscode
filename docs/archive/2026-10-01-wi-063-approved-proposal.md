# WI-063: Approved enable/disable inventory flags

English | [中文](2026-10-01-wi-063-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical approved scope, not a new Build authorization for later slices
- Archival reason: WI-063 enable/disable is implemented and tested; runtime apply remains parked.

## Approval and Traceability

The maintainer `/goal` to complete every ACTIVE.md task authorized this Build after WI-062. User-visible: REQ-010 slice 5. Decision: Draft ADR 0010. No gate.

## Goal and Scope

Settings **Plugins** can toggle each entry's `enabled` flag in `plugin-inventory-v1.json`. Visible copy discloses that enable means the next idle Trusted apply and that a live runtime does not change until idle rebuild/switch. Does not load, confirm load, or mutate a live runtime.

## Approach

Projection includes `enabled: boolean`. `setPluginInventoryEnabled` carries `{id, enabled}`. The host maps the opaque id and rewrites the flag. Unknown ids error without rewrite. Damaged or oversized files stay `existing-unusable`. The Webview never receives paths.

## Acceptance

Toggling changes the stored flag and the list. Live runtime and Execution profile stay unchanged. Unknown ids do not rewrite. busy and existing-unusable disable the switch. compile/lint/full `npm test`. Preview confirms the switch and disclosure. Native F5 not required.

## Subsequent Limits

Runtime `-e`, composer fold, ADR 0010 acceptance.
