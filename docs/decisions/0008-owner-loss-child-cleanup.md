# ADR 0008: End the exact owned child when the host is lost

English | [中文](0008-owner-loss-child-cleanup.zh.md)

- Type: ADR
- Status: Accepted
- Created: 2026-09-30
- Decision approval: 2026-09-30 maintainer `/goal` to complete remaining ACTIVE tasks, entering the recorded WI-036 Build slice
- Verification: 2026-09-30, agent acceptance under that request; compile/lint, 1016 automated tests, and real Node supervisor process tests for IPC disconnect, parent stdin end and stdout pipe loss; [layered evidence and limits](../archive/2026-09-30-wi-036-macos-acceptance.md)
- Gates: none closed. Supersedes only ADR 0002's owner-loss keep-alive rule for the exact child. ADR 0006 startup handoff and in-session recovery remain. Shared-domain admission was later replaced by [ADR 0009](0009-per-window-recovery-domains.md).
- Work item: WI-036 accepted and closed within the approved scope
- Related: [ADR 0002](0002-interaction-contract-route.md), [ADR 0006](0006-owned-runtime-handoff.md)

## Context

ADR 0002 kept observing the exact pi child after owner loss and did not terminate it. A later host could still clean up through ADR 0006's startup handoff, but the child kept running in between—observed when a leftover fence outlived its extension host. The maintainer asked for Codex-style cleanup of the host's own processes on disconnect or crash. pi 0.86.1 has no public API to stop tool descendants; macOS `child.kill` targets the exact child. Per-window independent recovery domains were a separate product choice and are now [ADR 0009](0009-per-window-recovery-domains.md).

## Decision

1. **Owner-loss ends the exact child.** When the supervisor detects host IPC disconnect, parent stdin end/close/error, or parent stdout close/error after spawn, it requests the same bounded SIGTERM (5 s) then SIGKILL (5 s) used by explicit End. It does not close pi stdin as the kill mechanism.
2. **Receipts still own retirement.** Signal delivery is not exit. The supervisor writes the matching terminal receipt when the exact child exits, or `never-spawned` if loss happens before spawn. Unconfirmed exit remains `termination-unconfirmed`. ADR 0006 still observes before ending at the next activation and still refuses to end a live `owned` run in another window.
3. **In-session uncertainty is unchanged.** Managed-process `release("uncertain")` still detaches without automatically ending the child. Stop deadlines still do not auto-kill. Trust revocation still does not auto-kill.
4. **Honesty about descendants.** Exact-child exit does not prove tool subprocesses, detached process groups or file rollback. No process-group kill is added in this slice.

## Rationale

Leaving the child running after the host is gone was the leftover-process incident. Using the existing End path avoids a second termination protocol. Independent domains and killpg were rejected for this slice because they need extra product and macOS-tree evidence; independent domains later landed as ADR 0009.

## Alternatives considered

- Keep observe-only owner-loss and rely on the next host's ADR 0006 handoff: rejected; the child keeps running until a later window opens.
- Kill the process group / all descendants: rejected; no public pi API and no verified macOS tree bound.
- Per-window recovery domains: deferred in this slice; later accepted as [ADR 0009](0009-per-window-recovery-domains.md).

## Consequences

A lost host interrupts its exact pi child without a dialog. A later activation can retire a matching receipt and show the normal page. Failed or unconfirmed cleanup still blocks replacement. Tool descendants may remain. VS Code window-crash F5 and installed-VSIX evidence are recorded separately from supervisor process tests; this ADR does not accept the whole Draft PRD or close a gate.
