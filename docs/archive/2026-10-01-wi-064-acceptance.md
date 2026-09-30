# WI-064: Idle Trusted inventory apply acceptance

English | [中文](2026-10-01-wi-064-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Disposition: Accepted and closed on 2026-10-01 by the agent under the complete-ACTIVE `/goal`
- Authority: historical evidence for this apply slice; not composer fold, whole-PRD, gate or ADR acceptance
- Scope: [approved proposal](2026-10-01-wi-064-approved-proposal.md)
- Acceptance identity: agent under the maintainer’s `/goal` to finish every ACTIVE.md task; not personal maintainer testing

## Approved behavior

Idle switch to Trusted applies at most one enabled inventory path through the public extra `-e` after the existing coverage warning. Zero enabled entries keep the composer picker. Extra enabled entries fail visibly. Controlled start never loads inventory. Load consent is not skipped.

## Verification

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | pass | Host/webview bundles and `tsc --noEmit` |
| `npm run lint` | pass | `eslint src` |
| `npm test` | 1054 pass, 0 fail/skip | Inventory apply resolver, host one/extra/unusable/controlled cases, webview too-many copy, plus existing suite |
| Native F5 / installed VSIX | not run | Host apply covered by automated tests |

## Limits

Composer still owns add when the inventory has no enabled entry. ADR 0010 stays Draft.

## Final disposition

WI-064 is closed. Slice 7 (composer entry fold) is next.
