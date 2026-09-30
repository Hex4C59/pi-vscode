# WI-068: Declined project-resource notice acceptance

English | [中文](2026-10-01-wi-068-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Disposition: Accepted and closed on 2026-10-01 by the agent under the complete-ACTIVE `/goal`
- Authority: historical evidence for this presentation slice; not whole-PRD, gate or ADR acceptance
- Scope: [approved proposal](2026-10-01-wi-068-approved-proposal.md)
- Acceptance identity: agent under the maintainer’s `/goal` to finish every ACTIVE.md task; not personal maintainer testing

## Approved behavior

After Decline, production `ProjectResourceConsent` settled phase shows `#declined-resources` with “Project-local pi resources are not loaded.” Allow and unchosen paths omit it. No change-choice UI, no `WorkspaceSetup` card, no host-protocol change.

## Verification

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | pass | Host/webview bundles and `tsc --noEmit` |
| `npm run lint` | pass | `eslint src` |
| `npm test` | 1061 pass, 0 fail/skip | Decline shows the notice; allow/unchosen omit it; zh-CN copy |
| Native F5 | not run | Not required by this WI |
| Vite preview | pass for this slice | Synthetic `settings-review.html?state=resources`: Continue without shows the muted English notice; Chinese shows 未加载项目本地 pi 资源. Not F5 or VSIX |

## Limits

Does not add a change-choice control, restore `WorkspaceSetup`, or claim folder-identity disclosure before a task. Resource trust is still not a sandbox.

## Final disposition

WI-068 is closed. Remaining ACTIVE parking starts at the REQ-002 duplicate-label identity gap.
