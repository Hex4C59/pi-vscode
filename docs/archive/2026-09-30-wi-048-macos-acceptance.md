# WI-048: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-048-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this session's complete-ACTIVE-tasks wrap-up-and-commit request
- Authority: historical evidence for this default-save result slice; not whole-PRD, gate or ADR 0005 acceptance
- Scope: [approved proposal](2026-09-30-wi-048-approved-proposal.md), ARCH-02 supplement
- Acceptance identity: agent under the maintainer's request to finish remaining ACTIVE tasks; not a claim that the maintainer personally ran these checks

## Approved Behavior and Implementation

`setDefaultModel` reports committed, failed, not-run or stale. The host applies the live session model only from a committed identity. A flush failure keeps the old default projection and does not call `applyConfiguredModel` with the requested model.

## Automated Verification

This close reran compile, lint and the full suite on the current tree.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` / `npm run lint` | pass | Production bundles and static checks |
| `npm test` | 1012 pass, 0 fail/skip | Three new cases: flush failure keeps old projection, superseded save reports stale, host injects flush failure so live apply does not receive new-model |

## Native evidence

Not required.

## Failures, Cleanup and Limits

- Does not encapsulate the original ARCH-02 apply order. Does not accept ADR 0005. No gate. No push.

## Final Disposition

The agent accepts and closes WI-048 under this session's complete-ACTIVE-tasks wrap-up-and-commit request. Only the failed-default-save live-model rule is accepted.
