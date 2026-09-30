# ADR 0006: End a leftover owned runtime before the next conversation

English | [中文](0006-owned-runtime-handoff.zh.md)

- Type: ADR
- Status: Accepted
- Created: 2026-09-29
- Decision approval: 2026-09-29 leftover-runtime choice; 2026-09-30 WI-035 Build and evidence-based agent acceptance delegated by the maintainer
- Verification: 2026-09-30, agent acceptance under this delegation; 895 tests, compile/lint, actual macOS F5/isolated installed handoff and documentation checks; [layered evidence and limits](../archive/2026-09-30-wi-035-macos-acceptance.md)
- Gates: none closed. Supersedes only ADR 0002's startup recovery ceremony; shared-domain admission and in-session recovery remain.
- Work item: WI-035 accepted and closed within the approved scope

## Context

[ADR 0002](0002-interaction-contract-route.md) retains a fence and an independent exact-child observer after owner loss. Previously a later host showed the uncertainty banner and required End followed by Recover, even in a window without a folder. The maintainer chose to end a previous host's leftover before opening normally. WI-035 specifies the failure and live-owner cases; implementation approval does not accept the whole Draft PRD.

## Decision

1. **Handoff on extension activation.** Provider construction starts one handoff. Activation currently occurs through `onView:pi-vscode.chat`, not necessarily when the VS Code application launches. A new runtime waits for this handoff and rechecks disposal, workspace identity, eligibility and resource choice afterward. Handoff grants neither workspace trust nor resource consent and never replays a task.
2. **Observe before ending.** A terminal exact-child receipt permits retirement without an end request. Otherwise query the matching supervisor through the existing bounded, validated control channel. Only `owner-lost` permits an automatic end request. `owned` means a live host elsewhere: do not end or retire its run, and do not show End/Recover actions in this window. A launch attempted there reports the occupied shared domain and creates no replacement.
3. **Receipt before retirement.** End acknowledgment and signal delivery are not exit evidence. Require the durable receipt matching both run and child before retiring. `exited`/`never-spawned` control states still require the receipt. End observation is bounded to 10,500 ms; terminal-receipt flushing to 1,000 ms; the control exchange retains its 1,500 ms and 4 KiB bounds.
4. **Normal page after verified cleanup.** Empty or successfully retired domains show the normal empty/no-folder page, without a recovery banner or two-step ceremony. Starting a new runtime still requires an eligible local workspace and a fresh resource choice.
5. **Honest failure.** Unreachable supervision, unconfirmed exit, invalid records or failed retirement retain the barrier and the existing explicit recovery page. No arbitrary PID termination, time-based expiration or clear-unknown bypass. If another window completed retirement, reobserving an empty domain clears an obsolete recovery page. Exclusive retirement admits one writer, not immediate success for every concurrent caller.
6. **Retain the existing boundaries.** One runtime per shared global-storage domain; unchanged `recovery-v1` schemas and Webview v3 DTOs. Same-host Stop/protocol failures retain explicit End/Recover. Managed-process handoff is serialized with cleanup, refuses active/in-flight launches and cannot clear a newer generation's blocked state.

## Rationale

Opening a later host should not require manual cleanup of a verified leftover. Observation distinguishes an abandoned run from another window's active work; exact receipts preserve the accepted admission safety. The renderer still has no authority to clear a fence.

## Alternatives Considered

- Retain the startup banner and two actions: rejected by the maintainer.
- Hide the banner while retaining an unresolved fence, or ignore the fence and launch concurrently: rejected; neither satisfies the requested safe handoff.
- Automatically end a live owner in another window: rejected; shared storage does not make its run a leftover.
- Independent per-window domains or cleanup immediately on owner loss: separate future decisions, recorded as WI-036 candidates in ACTIVE, not implemented here.

## Consequences

A previous owner's direct child may be interrupted without a dialog at the next activation. Its exit does not prove descendants stopped, commands succeeded, or file changes rolled back. A full host crash still loses memory-only drafts. A crashed retirement writer remains a conservative barrier; this work does not bypass its marker or migrate records. Actual F5/installed, live-owner safety and cleanup evidence, failed setup/tool attempts and retained limits are recorded in the [WI-035 delegated acceptance](../archive/2026-09-30-wi-035-macos-acceptance.md).
