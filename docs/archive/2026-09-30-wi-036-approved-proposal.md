# WI-036: Approved Owner-Loss Exact-Child Cleanup Scope

English | [中文](2026-09-30-wi-036-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-036 implementation and required evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-036-macos-acceptance.md), [ADR 0008](../decisions/0008-owner-loss-child-cleanup.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

The maintainer `/goal` to complete remaining ACTIVE tasks entered the recorded WI-036 Build slice. User-visible: REQ-005/REQ-006. Decision class `adr-after-approval` → ADR 0008. Does not accept the whole Draft PRD or change a gate. No Git commit or push was authorized. Required native platform: macOS; Windows F5/installed VSIX are outside.

## Goal and Scope

When the host is released, crashes, or loses IPC/pipes, the supervisor ends this run's exact owned child with the existing SIGTERM (5 s) then SIGKILL (5 s), then writes a matching receipt. ADR 0006 startup handoff can then retire the fence. Ordered `dispose` / idle `stop` still use end+recover. Do not close child stdin as a kill. Do not terminate other windows, terminals or external processes.

## Approach

`markOwnerLost` requests the same `beginTermination` used by explicit End after spawn. Never-spawned remains if loss happens before spawn with a ready control plane. Shared `recovery-v1`, single-domain admission, live-owner protection, in-session Stop/protocol uncertainty and ADR 0006 observe-then-end stay. No per-window domains, no cancelling the shared single-runtime limit, no `recovery-v1` migration.

## Acceptance

Real supervisor child processes: IPC disconnect, parent stdin end and stdout destroy each exit the exact child with a matching receipt and without closing child stdin. Live-owner observe does not end the child. Explicit End and pre-initialize disconnect never-spawned still pass. compile/lint/full tests. VS Code window-crash F5 and installed VSIX, if not run, stay unverified.

## Subsequent Limits

Per-window independent domains, in-session Stop auto-kill, killpg, arbitrary-PID kill, pending-fence migration, gates and Git commits remain outside. Signal delivery or child exit is not proof that descendants stopped.
