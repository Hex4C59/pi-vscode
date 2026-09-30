# WI-042: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-042-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this session's complete-ACTIVE-tasks wrap-up-and-commit request
- Authority: historical evidence for this presentation-identity slice; not whole-PRD, gate, protocol or runtime-selection acceptance
- Scope: [approved proposal](2026-09-30-wi-042-approved-proposal.md), REQ-002 / UI-01
- Acceptance identity: agent under the maintainer's request to finish remaining ACTIVE tasks; not a claim that the maintainer personally ran these checks

## Approved Behavior and Implementation

The picker prefers a unique canonical `provider / modelId` match over display labels, so a second entry whose label equals that pair is not also checked. Duplicate labels with a canonical current model still mark one radio.

## Automated Verification

This close reran compile, lint and the full suite on the current tree.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` / `npm run lint` | pass | Production bundles and static checks |
| `npm test` | 997 pass, 0 fail/skip | Two new mounted collision/duplicate-label cases |

## Native evidence

Not required. jsdom mounted production chat is the accepted evidence.

## Failures, Cleanup and Limits

- Host `chatModel` remains a display label from the runtime; uniqueness is a picker presentation invariant.
- No gate, ADR or protocol change. No push.

## Final Disposition

The agent accepts and closes WI-042 under this session's complete-ACTIVE-tasks wrap-up-and-commit request. Only applied-radio uniqueness is accepted.
