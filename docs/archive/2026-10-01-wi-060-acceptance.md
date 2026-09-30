# WI-060: Host inventory-store acceptance

English | [中文](2026-10-01-wi-060-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Disposition: Accepted and closed on 2026-10-01 by the agent under the complete-ACTIVE `/goal`
- Authority: historical evidence for this host-store slice; not Settings UI, runtime load, whole-PRD, gate or ADR acceptance
- Scope: [approved proposal](2026-10-01-wi-060-approved-proposal.md)
- Acceptance identity: agent under the maintainer’s `/goal` to finish every ACTIVE.md task; not personal maintainer testing

## Approved behavior

`loadPluginInventory` / `replacePluginInventory` persist `{ schemaVersion: 1, entries: [{ path, enabled }] }` at `globalStorageUri/plugin-inventory-v1.json`. Missing is empty. Damaged and too-large files are left unchanged.

## Verification

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | pass | Host/webview bundles and `tsc --noEmit` |
| `npm run lint` | pass | `eslint src` |
| `npm test` | 1033 pass, 0 fail/skip | Six new inventory store cases plus existing suite |
| Native F5 / installed VSIX | not run | No UI in this slice |

## Limits

No Settings category. No webview inventory projection. No `-e` apply. ADR 0010 stays Draft.

## Final disposition

WI-060 is closed. Slice 3 (Settings empty list + add from disk) is next.
