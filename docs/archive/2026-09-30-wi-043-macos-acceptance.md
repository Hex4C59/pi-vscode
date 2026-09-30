# WI-043: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-043-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this session's complete-ACTIVE-tasks wrap-up-and-commit request
- Authority: historical evidence for this consumed-Escape slice; not whole-PRD, gate or macOS host keyboard acceptance
- Scope: [approved proposal](2026-09-30-wi-043-approved-proposal.md), REQ-002 / UI-02
- Acceptance identity: agent under the maintainer's request to finish remaining ACTIVE tasks; not a claim that the maintainer personally ran these checks

## Approved Behavior and Implementation

Window-level model-popover Escape ignores `defaultPrevented` and composing events. An overlapping Add-context menu can consume Escape without closing the popover or moving focus to the model trigger.

## Automated Verification

This close reran compile, lint and the full suite on the current tree.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` / `npm run lint` | pass | Production bundles and static checks |
| `npm test` | 999 pass, 0 fail/skip | Overlap and composing Escape cases added |

## Native evidence

Not required. jsdom mounted production chat is the accepted evidence.

## Failures, Cleanup and Limits

- Not macOS host keyboard acceptance. No gate, ADR or protocol change. No push.

## Final Disposition

The agent accepts and closes WI-043 under this session's complete-ACTIVE-tasks wrap-up-and-commit request. Only consumed-Escape ownership is accepted.
