# WI-062: Remove from plugin inventory acceptance

English | [中文](2026-10-01-wi-062-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Disposition: Accepted and closed on 2026-10-01 by the agent under the complete-ACTIVE `/goal`
- Authority: historical evidence for this remove slice; not enable, runtime load, whole-PRD, gate or ADR acceptance
- Scope: [approved proposal](2026-10-01-wi-062-approved-proposal.md)
- Acceptance identity: agent under the maintainer’s `/goal` to finish every ACTIVE.md task; not personal maintainer testing

## Approved behavior

Each Plugins row can remove. The host drops `{path, enabled}` for the opaque `id` and does not delete the extension file. Copy discloses that disk files stay. Unknown ids report `unknown-entry` without rewrite. Live runtime and Execution profile stay unchanged.

## Verification

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | pass | Host/webview bundles and `tsc --noEmit` |
| `npm run lint` | pass | `eslint src` |
| `npm test` | 1043 pass, 0 fail/skip | Host remove/unknown/damaged cases, webview remove intent, plus existing suite |
| Vite preview `settings-review.html` | add then remove; English dark, Chinese light 280px stacked nav with disclosure and Remove | Presentation only |
| Native F5 / installed VSIX | not run | Native picker and host store covered by automated host tests |

## Limits

No enable toggle. No `-e` apply. ADR 0010 stays Draft.

## Final disposition

WI-062 is closed. Slice 5 (enable/disable) is next.
