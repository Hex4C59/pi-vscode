# ADR 0007: Cross-host endpoint file transactions

English | [中文](0007-endpoint-write-transaction.zh.md)

- Type: ADR
- Status: Accepted
- Created: 2026-09-30
- Decision approval: maintainer confirmed entry into WI-038 Build, approving the complete ACTIVE proposal including external-write limits and conservative stale-lock recovery
- Verification: 2026-09-30, agent acceptance under this session's complete-ACTIVE wrap-up-and-commit request; implementation `d485cc4`, compile/lint and 993 tests (63 new WI-038 cases plus later packaging regressions), independent-process failure/cleanup, native FIFO rejection, host call-chain result gate, and macOS development plus isolated installed two-window contention/serial-commit evidence after WI-039 unblocked provider loading; [layered evidence and limits](../archive/2026-09-30-wi-038-macos-acceptance.md)
- Gates: no new gate; existing `gate-webview-trust` remains Accepted within ADR 0004.
- Work item: WI-038 accepted and closed within the approved ARCH-05 / REQ-002 scope
- Related: [ADR 0005](0005-custom-endpoint-file.md), [contract](../reference/webview-messages.md#endpoint-write-transaction-wi-038-accepted-contract), [acceptance](../archive/2026-09-30-wi-038-macos-acceptance.md)

## Context

The existing endpoint writer reads and merges `models.json`, then renames a temporary file over it. Atomic replacement prevents partial JSON, but does not serialize two hosts reading the same old revision. `ProviderConfig.saving` protects only one instance. ADR 0005's documented endpoint format and credential authority remain unchanged; its outstanding live-login/endpoint evidence is separate from this concurrency repair.

## Decision

The host `models` module owns one exclusive lock directory beside the canonical `models.json`, `.models.json.pi-vscode.lock`. Add/remove acquire it once before reading and hold it through replacement. Contention fails immediately; there is no queued wait or automatic mutation retry. Directory aliases resolve to the same lock. Ambiguous linked target files are refused. Lock metadata contains only a random identity and PID.

The transaction owns temporary output and releases only its matching lock. Missing files may be created; existing regular-file permissions are preserved. A fresh byte/identity comparison before rename detects intervening external changes. Nonparticipating external writers can still race the final check and rename; no universal external-write exclusion is claimed.

Results distinguish no commit, clean commit and commit with cleanup failure. Only clean commits continue provider reload/login/logout. A committed cleanup failure reports the actual saved/removed state and requires explicit follow-up, never rollback or mutation replay. Uncommitted cleanup failure is also visible. Crash leftovers remain barriers: age or PID is not sufficient authority to remove them. Recovery requires closing relevant writing hosts and maintainer verification before manual cleanup. No Webview filesystem/unlock capability is introduced.

## Rationale and alternatives

A process-local mutex cannot protect separate VS Code hosts. Re-reading alone cannot make a filesystem read-modify-rename atomic. An adjacent exclusive lock uses standard Node filesystem operations without a new dependency and keeps transaction ownership with the existing host writer. Rejecting contention is simpler and bounded without creating a waiting queue. Automatic stale-lock takeover was rejected because uncertain identity or active writes could permit overlapping writers; this intentionally trades automatic crash recovery for conservative preservation.

## Consequences and acceptance

A crashed writer or failed release can require manual recovery. External manual edits should happen while extension writers are closed. File replacement does not promise crash-durable directory fsync or protection against hostile lock manipulation. Output-size budgeting (ARCH-06), provider credential storage, pi version, session files, runtime lifecycle and ADR 0005 acceptance remain outside WI-038.

Acceptance requires deterministic same-process and independent-process add/add, add/remove and remove/remove coverage; explicit contention/conflict and cleanup outcomes; failure side-effect suppression; path identity and leftover-lock tests; compile/lint/full tests/docs checks; and separately recorded macOS development/isolated installed host verification. Those conditions are recorded in the [acceptance archive](../archive/2026-09-30-wi-038-macos-acceptance.md). This ADR does not accept ADR 0005 or close a gate.
