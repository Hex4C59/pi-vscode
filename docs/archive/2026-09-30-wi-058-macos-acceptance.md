# WI-058: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-058-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under the parking-lot completion goal
- Authority: historical evidence for this per-window recovery-domain slice; not whole-PRD, gate or extra-OS acceptance
- Scope: [approved proposal](2026-09-30-wi-058-approved-proposal.md), [ADR 0009](../decisions/0009-per-window-recovery-domains.md)
- Acceptance identity: agent under the maintainer's `/goal` to complete every parking-lot item; not a claim that the maintainer personally ran these checks

## Approved Behavior and Implementation

Activation stores this window's fence at `recovery-v1/windows/<uuid>/`. A second window uses a different UUID and can reserve at the same time. Startup best-effort hands off the legacy shared root and sibling window dirs without ending a live `owned` run. Occupied launch text names this window's domain. Trusted-loading copy and the native confirm disclose that two windows can change the same files.

## Automated verification

This close re-ran compile, lint and the full suite on the current worktree.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | exit 0 | esbuild + three `tsc --noEmit` projects |
| `npm run lint` | exit 0 | `eslint src` |
| `npm test` | 1027 pass, 0 fail/skip, 12 583 ms | Dual-domain reserve, sibling skip/cap, foreign-handoff isolation, occupied copy, trusted-profile UI |
| Dual-window macOS F5 / installed VSIX | Recorded 2026-09-30 | Two live hosts, one isolated folder; [native evidence](2026-09-30-macos-verification-acceptance.md) |

## Limits

`vscode.env.sessionId` is not used as a window key. At most 32 sibling directories are scanned. Foreign cleanup is best-effort. Exact-child honesty, in-session uncertainty and descendant non-claims are unchanged. No Git commit.
