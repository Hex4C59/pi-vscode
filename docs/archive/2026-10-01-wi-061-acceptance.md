# WI-061: Settings Plugins empty list and add-from-disk acceptance

English | [中文](2026-10-01-wi-061-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Disposition: Accepted and closed on 2026-10-01 by the agent under the complete-ACTIVE `/goal`
- Authority: historical evidence for this Settings add slice; not remove/enable, runtime load, whole-PRD, gate or ADR acceptance
- Scope: [approved proposal](2026-10-01-wi-061-approved-proposal.md)
- Acceptance identity: agent under the maintainer’s `/goal` to finish every ACTIVE.md task; not personal maintainer testing

## Approved behavior

Settings **Plugins** lists the host inventory as basename-only `displayName` rows. **Add from disk** uses the native picker and `inspectPickedExtension` (no `confirm`) to append `{path, enabled: true}` to `plugin-inventory-v1.json`. Duplicate, invalid, cancelled, damaged and too-large cases do not rewrite a usable file except the explicit append. Live runtime and Execution profile stay unchanged.

## Verification

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | pass | Host/webview bundles and `tsc --noEmit` |
| `npm run lint` | pass | `eslint src` |
| `npm test` | 1040 pass, 0 fail/skip | Host add/empty/duplicate/cancel cases, webview Plugins parse and nav, plus existing suite |
| Vite preview `settings-review.html` | empty list, Add from disk, duplicate-path alert; English dark, Chinese light, 280px stacked nav, high-contrast | Presentation only; native picker not in preview |
| Native F5 / installed VSIX | not run | Native picker and host store covered by automated host tests |

## Limits

No remove control. No enable toggle. No `-e` apply. ADR 0010 stays Draft.

## Final disposition

WI-061 is closed. Slice 4 (remove from inventory) is next.
