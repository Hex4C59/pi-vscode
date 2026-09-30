# WI-063: Enable/disable inventory flags acceptance

English | [中文](2026-10-01-wi-063-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Disposition: Accepted and closed on 2026-10-01 by the agent under the complete-ACTIVE `/goal`
- Authority: historical evidence for this enable slice; not runtime load, whole-PRD, gate or ADR acceptance
- Scope: [approved proposal](2026-10-01-wi-063-approved-proposal.md)
- Acceptance identity: agent under the maintainer’s `/goal` to finish every ACTIVE.md task; not personal maintainer testing

## Approved behavior

Each Plugins row has an Enabled switch. The host rewrites `{path, enabled}` for the opaque `id`. Enable is next-idle Trusted eligibility, not this-session load. Live runtime and Execution profile stay unchanged.

## Verification

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | pass | Host/webview bundles and `tsc --noEmit` |
| `npm run lint` | pass | `eslint src` |
| `npm test` | 1045 pass, 0 fail/skip | Host disable/unknown cases, webview switch intent, plus existing suite |
| Vite preview `settings-review.html` | toggle off in English dark; Chinese light 280px with switch and Remove | Presentation only |
| Native F5 / installed VSIX | not run | Host store covered by automated tests |

## Limits

No `-e` apply. ADR 0010 stays Draft.

## Final disposition

WI-063 is closed. Slice 6 (apply enabled entries at runtime) is next.
