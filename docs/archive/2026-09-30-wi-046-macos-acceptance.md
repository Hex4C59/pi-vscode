# WI-046: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-046-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this session's complete-ACTIVE-tasks wrap-up-and-commit request
- Authority: historical evidence for this diagnostic-probe slice; not whole-PRD, gate, production-ownership or extension-host crash acceptance
- Scope: [approved proposal](2026-09-30-wi-046-approved-proposal.md), RUNTIME-03 / RUNTIME-04 / RUNTIME-05
- Acceptance identity: agent under the maintainer's request to finish remaining ACTIVE tasks; not a claim that the maintainer personally ran these checks

## Approved Behavior and Implementation

`runPiRuntimeProbe` owns child and pipe errors, settles once, requires boolean `success === true`, and reports bounded-shutdown success only after observed process exit. Spawn ENOENT and refused kill without exit return `ok: false`.

## Automated Verification

This close reran compile, lint and the full suite on the current tree.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` / `npm run lint` | pass | Production bundles and static checks |
| `npm test` | 1006 pass, 0 fail/skip | Five new probe cases: ENOENT, stdout EPIPE, `success: "false"`, refused kill, boolean success with exit |

## Native evidence

Not required. This does not rerun `npm run spike:runtime` against a real pi CLI.

## Failures, Cleanup and Limits

- Diagnostic helper only; not production `runtime-owner` recovery. Stderr accumulation budget is unchanged. No gate or ADR. No push.

## Final Disposition

The agent accepts and closes WI-046 under this session's complete-ACTIVE-tasks wrap-up-and-commit request. Only diagnostic probe settlement and success evidence are accepted.
