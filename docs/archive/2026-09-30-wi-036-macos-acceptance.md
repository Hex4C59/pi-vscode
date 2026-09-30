# WI-036: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-036-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under the complete-remaining-tasks goal; ADR 0008 promoted to Accepted
- Authority: historical evidence for this owner-loss exact-child slice; not whole-PRD, release, gate or per-window-domain acceptance
- Scope: [approved proposal](2026-09-30-wi-036-approved-proposal.md), REQ-005 / REQ-006, [ADR 0008](../decisions/0008-owner-loss-child-cleanup.md)
- Acceptance identity: agent under the maintainer's 2026-09-30 `/goal` to finish remaining ACTIVE tasks; not a claim that the maintainer personally reran these checks

## Approved Behavior and Implementation

After spawn, host IPC disconnect, parent stdin end/close/error, or parent stdout close/error requests the same bounded SIGTERM (5 s) then SIGKILL (5 s) as explicit End. The supervisor does not close pi stdin as the kill. Matching terminal receipts still own retirement. `release("uncertain")`, Stop deadlines and live-owner observe are unchanged.

Implementation is `src/adapter/ownership/supervisor.ts` (`requestOwnedChildEnd` from `markOwnerLost`).

## Automated Verification

This close reran compile, lint and the full suite on the current tree.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` / `npm run lint` | pass | Production bundles and static checks |
| `npm test` | 1016 pass, 0 fail/skip, 13 359 ms | Includes supervisor IPC disconnect, parent stdin end and stdout destroy ending the exact child without closing its stdin; live-owner observe, explicit End and pre-initialize never-spawned remain |

## Native evidence

macOS 27.0.0 (arm64). Real Node supervisor worker processes remain the original native evidence for this slice. Window-crash F5 and isolated installed VSIX were recorded on 2026-09-30: SIGKILL of one window's `node.mojom.NodeService` owner ended that domain's exact `pi` child (`child-exited`); the sibling stayed `owned`. [Evidence](2026-09-30-macos-verification-acceptance.md).

## Failures, Cleanup and Limits

- Exact-child exit does not prove tool descendants, detached process groups or file rollback.
- Per-window independent domains are implemented (WI-058 / ADR 0009).
- No gate closed. No Git commit or push.

## Final Disposition

The agent accepts and closes WI-036 and promotes ADR 0008 to Accepted under the complete-remaining-tasks goal. Only owner-loss cleanup of the exact owned child is accepted.
