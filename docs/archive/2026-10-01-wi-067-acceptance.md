# WI-067: Composer picker mutex acceptance

English | [中文](2026-10-01-wi-067-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Disposition: Accepted and closed on 2026-10-01 by the agent under the complete-ACTIVE `/goal`
- Authority: historical evidence for this presentation slice; not whole-PRD, gate or ADR acceptance
- Scope: [approved proposal](2026-10-01-wi-067-approved-proposal.md)
- Acceptance identity: agent under the maintainer’s `/goal` to finish every ACTIVE.md task; not personal maintainer testing

## Approved behavior

Composer shows at most one of the model picker and Execution profile. Add-context, history and Settings are unchanged. Host protocols are unchanged.

## Verification

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | pass | Host/webview bundles and `tsc --noEmit` |
| `npm run lint` | pass | `eslint src` |
| `npm test` | 1060 pass, 0 fail/skip | Opening one surface closes the other |
| Native F5 | not run | Not required by this WI |
| Vite preview | pass for this slice | Opening Permissions closed the model picker; chip stayed collapsed. Synthetic host, not F5 or VSIX |

## Limits

Does not mutex the Add-context menu or session history against these cards.

## Final disposition

WI-067 is closed. Remaining ACTIVE parking starts at the REQ-001 declined-resource notice.
