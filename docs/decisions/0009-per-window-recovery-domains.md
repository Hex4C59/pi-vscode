# ADR 0009: Per-window independent recovery domains

English | [中文](0009-per-window-recovery-domains.zh.md)

- Type: ADR
- Status: Accepted
- Created: 2026-09-30
- Decision approval: 2026-09-30 maintainer `/goal` to complete every parking-lot item and implement the best coherent solution
- Verification: 2026-09-30, agent acceptance under that request; compile/lint, 1027 automated tests including dual-domain reserve, sibling scan bounds and foreign-handoff isolation; [layered evidence and limits](../archive/2026-09-30-wi-058-macos-acceptance.md)
- Gates: none closed. Supersedes only ADR 0002's shared-domain one-runtime admission. ADR 0006 observe-then-end, ADR 0008 exact-child owner-loss cleanup and in-session Stop/protocol recovery remain.
- Work item: WI-058 accepted and closed within the approved scope
- Related: [ADR 0002](0002-interaction-contract-route.md), [ADR 0006](0006-owned-runtime-handoff.md), [ADR 0008](0008-owner-loss-child-cleanup.md)

## Context

ADR 0002 admitted one Pi runtime at a time in a shared `globalStorageUri/recovery-v1` domain so a second VS Code window could not spawn. That avoided inventing a window identity. Two windows on the same folder then blocked each other even when both hosts were alive. The maintainer asked to empty the parking lot and implement the remaining product choice: independent domains.

VS Code does not expose a stable window id. `vscode.env.sessionId` is not a proven per-window key. A leftover fence at the shared root still needs ADR 0006 handoff after this change.

## Decision

1. **One domain per extension host.** Activation allocates a memory-only UUID and stores that window's fence under `recovery-v1/windows/<uuid>/`. Occupied launch means this window's domain is already fenced, not that another window exists.
2. **Foreign cleanup is observe-then-end.** Before this window's own handoff, best-effort scan the legacy shared root and at most 32 sibling UUID directories. Live `owned` runs are not ended. `owner-lost` follows ADR 0006. Foreign failure does not block this window.
3. **Disclose concurrent writers.** Two windows may run two pi processes against the same folder. Trusted-loading copy and the native confirm warn that they can change the same files.
4. **Unchanged safety.** Exact-child receipts, in-session `release("uncertain")`, no stdin-as-kill, no descendant proof, no `recovery-v1` schema version bump.

## Rationale

A memory UUID plus a bounded sibling scan is enough to stop cross-window blocking without a fake stable window registry. Legacy root handoff still retires pre-change leftovers. File-race honesty is the product cost of concurrent agents.

## Alternatives considered

- Keep the shared single-runtime domain: rejected by this parking-lot product choice.
- Use `vscode.env.sessionId` as the directory name: rejected; it is not established as per-window.
- Persistent window id in globalState: rejected; reload would reuse a domain whose previous host is gone, mixing live-owner with owner-lost.
- Unbounded directory scan or process-group kill: rejected; keep the 32-directory budget and ADR 0008 exact-child bound.

## Consequences

A second window can start its own runtime while the first still runs. They may edit the same workspace files. Reload allocates a new UUID; the previous directory is a sibling and is handed off as owner-lost. Dual-window macOS F5 is recorded separately from automated reserve tests. This ADR does not accept the whole Draft PRD or close a gate.
