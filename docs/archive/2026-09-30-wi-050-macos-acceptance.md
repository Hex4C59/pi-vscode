# WI-050: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-050-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this session's complete-ACTIVE-tasks wrap-up-and-commit request
- Authority: historical evidence for this spec-naming slice; not whole-PRD, gate or ADR acceptance
- Scope: [approved proposal](2026-09-30-wi-050-approved-proposal.md), TOOL-02
- Acceptance identity: agent under the maintainer's request to finish remaining ACTIVE tasks; not a claim that the maintainer personally ran these checks

## Approved Behavior and Implementation

Application specs under collected `tests/` directories must use `.spec.ts`. A sibling `.spec.tsx` fails discovery and is not mapped into `dist/tests`. No existing production spec used that suffix.

## Automated Verification

This close reran compile, lint and the full suite on the current tree.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` / `npm run lint` | pass | Production bundles and static checks |
| `npm test` | 1016 pass, 0 fail/skip | One new case: collected `.spec.tsx` fails discovery and names the path |

## Native evidence

Not required.

## Failures, Cleanup and Limits

- Does not add TSX spec execution. Does not restart the assertion audit. No gate. No push.

## Final Disposition

The agent accepts and closes WI-050 under this session's complete-ACTIVE-tasks wrap-up-and-commit request. Only the `.spec.tsx` naming refusal is accepted.
