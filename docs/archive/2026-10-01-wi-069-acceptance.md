# WI-069: Canonical live model identity acceptance

English | [中文](2026-10-01-wi-069-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Disposition: Accepted and closed on 2026-10-01 by the agent under the complete-ACTIVE `/goal`
- Authority: historical evidence for this projection slice; not whole-PRD, gate or ADR acceptance
- Scope: [approved proposal](2026-10-01-wi-069-approved-proposal.md)
- Acceptance identity: agent under the maintainer’s `/goal` to finish every ACTIVE.md task; not personal maintainer testing

## Approved behavior

`formatModelLabel` projects the live model as `provider / modelId`. Display names stay on catalog `label` only. Composer chip presentation (WI-066) and picker radio identity (WI-042) stay. This does not claim the runtime selected a different model.

## Verification

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | pass | Host/webview bundles and `tsc --noEmit` |
| `npm run lint` | pass | `eslint src` |
| `npm test` | 1064 pass, 0 fail/skip | Colliding display names project distinct identities; unique canonical radios remain |
| Native F5 | not run | Not required by this WI |

## Limits

A Webview `chatModel` that is only a duplicated display name still marks no radio. Production host projection no longer emits that string. Chip still omits the provider.

## Final disposition

WI-069 is closed. Remaining ACTIVE parking starts at the REQ-009 macOS evidence remainder.
