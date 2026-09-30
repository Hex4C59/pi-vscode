# WI-038: Approved Cross-Host Endpoint Write Scope

English | [中文](2026-09-30-wi-038-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-038 implementation and required evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-038-macos-acceptance.md), [ADR 0007](../decisions/0007-endpoint-write-transaction.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

The maintainer confirmed WI-038 Build for ARCH-05 / REQ-002, including immediate contention refusal, conservative leftover-lock recovery, and best-effort external-write detection. This session's request to finish remaining ACTIVE work, write wrap-up records, and commit after each task is the close authorization. Native evidence was captured during Build, including the isolated installed rerun after WI-039. This close does not claim the maintainer personally reran those hosts.

## Goal and Scope

Custom endpoint add/remove against the same `models.json` is mutually exclusive across extension hosts. Contention or a detected external revision fails visibly without changing the file or starting login/logout. Clean commit, no commit, and committed-cleanup-failed are distinct; only a clean commit continues credential actions. Leftover locks stay until writing hosts close and the maintainer verifies them.

Out of scope: ARCH-06 output budget, ADR 0005 acceptance, a Webview unlock capability, automatic stale-lock takeover, and universal exclusion of nonparticipating external writers.

## Approach

`customEndpoints.ts` keeps document validation and merge. `endpointFileTransaction.ts` owns canonical path identity, the adjacent `.models.json.pi-vscode.lock` directory, replacement, and owned cleanup. `ProviderConfig` continues reload/login/logout only after a clean commit. Lock metadata is a random identity and PID. Directory aliases share the lock; ambiguous linked targets are refused.

## Acceptance

Independent-process add/add, add/remove and remove/remove; explicit contention, conflict and cleanup outcomes; failure side-effect suppression; path identity and leftover-lock tests; compile/lint/full tests/docs checks; separately recorded macOS development and isolated installed two-window evidence.

## Subsequent Limits

External writers that ignore the lock can still race the final check and rename. Crash leftovers require manual recovery. WI-039's packaging repair unblocked installed evidence; it does not change this concurrency decision.
