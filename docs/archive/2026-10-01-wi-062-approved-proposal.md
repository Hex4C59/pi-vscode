# WI-062: Approved remove from plugin inventory

English | [中文](2026-10-01-wi-062-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical approved scope, not a new Build authorization for later slices
- Archival reason: WI-062 remove-from-inventory is implemented and tested; enable remains parked.

## Approval and Traceability

The maintainer `/goal` to complete every ACTIVE.md task authorized this Build after WI-061. User-visible: REQ-010 slice 4. Decision: Draft ADR 0010. No gate.

## Goal and Scope

Settings **Plugins** can remove each row. The host drops that entry from `plugin-inventory-v1.json`. Visible copy discloses that disk files stay. Does not delete extension files, uninstall pi global packages, mutate a live runtime, or open load confirmation.

## Approach

Projection adds opaque `id` derived from the absolute path, not the path itself. `removePluginInventoryEntry` carries `{id}`. The host maps then `replacePluginInventory`. Unknown ids error without rewrite. Damaged or oversized files stay `existing-unusable`. The Webview never receives paths.

## Acceptance

Removing the last remaining extra entry leaves the other row and shortens the file. Disk files stay. Unknown ids do not rewrite. busy and existing-unusable disable remove. compile/lint/full `npm test`. Preview confirms remove and the disk-stays disclosure. Native F5 not required.

## Subsequent Limits

Enable UI, runtime `-e`, composer fold, ADR 0010 acceptance.
