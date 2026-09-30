# WI-047: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-047-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this session's complete-ACTIVE-tasks wrap-up-and-commit request
- Authority: historical evidence for this output-budget slice; not whole-PRD, gate or ADR 0005 acceptance
- Scope: [approved proposal](2026-09-30-wi-047-approved-proposal.md), ARCH-06
- Acceptance identity: agent under the maintainer's request to finish remaining ACTIVE tasks; not a claim that the maintainer personally ran these checks

## Approved Behavior and Implementation

Serialized `models.json` output is checked against the 1 MiB read budget before replacement. Over-budget pretty-print expansion returns `too-large`, keeps the original file and does not continue credential login.

## Automated Verification

This close reran compile, lint and the full suite on the current tree.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` / `npm run lint` | pass | Production bundles and static checks |
| `npm test` | 1009 pass, 0 fail/skip | Three new cases: explicit oversized replacement, pretty-print add, ProviderConfig size-limit error without login |

## Native evidence

Not required.

## Failures, Cleanup and Limits

- Does not accept ADR 0005 or change ADR 0007 exclusion semantics. No gate. No push.

## Final Disposition

The agent accepts and closes WI-047 under this session's complete-ACTIVE-tasks wrap-up-and-commit request. Only the endpoint write output budget is accepted.
