# WI-040: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-040-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this session's complete-ACTIVE-tasks wrap-up-and-commit request
- Authority: historical evidence for this admission-cap slice; not whole-PRD, gate, native nine-way UI or CORE-02 acceptance
- Scope: [approved proposal](2026-09-30-wi-040-approved-proposal.md), REQ-006 / CORE-01
- Acceptance identity: agent under the maintainer's request to finish remaining ACTIVE tasks; not a claim that the maintainer personally ran these checks

## Approved Behavior and Implementation

Card insertion in `ToolApprovals.evaluate` denies when `pending.size >= 8` after the asynchronous preflight. Nine delayed custom-tool initials therefore cannot offer a ninth card. Cancel still clears occupied slots.

## Automated Verification

This close reran compile, lint and the full suite on the current tree.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` / `npm run lint` | pass | Production bundles and static checks |
| `npm test` | 994 pass, 0 fail/skip | One new concurrent-preflight case; the same spec first failed against the old insert path (5s timeout / 9 unresolved cards) then passed after the insert recheck |

## Native evidence

Not required for this slice. No F5 or installed nine-way approval UI was run.

## Failures, Cleanup and Limits

- Concurrent preflights may still run nine initial safety hooks; the cap is on offered cards.
- Invalid projection, disconnect and memory exhaustion remain unclaimed.
- No gate or ADR. No push.

## Final Disposition

The agent accepts and closes WI-040 under this session's complete-ACTIVE-tasks wrap-up-and-commit request. Only the eight-card admission invariant is accepted.
