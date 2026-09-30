# WI-057: Approved Saved-Default Apply Encapsulation Scope

English | [中文](2026-09-30-wi-057-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-057 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-057-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

ARCH-02 sequence encapsulation was a confirmed design (2026-09-29). The maintainer `/goal` to complete remaining ACTIVE tasks authorized this Build after WI-036. Purely technical; no PRD slice, ADR or gate.

## Goal and Scope

Move “refresh RPC catalogue → apply Saved default → request one restart if the session still has no model” into a module under `src/extension/models/`. Freeze user-visible rules. ProviderConfig and ModelSettings stay separate collaborators.

## Approach

`SavedDefaultApply` owns `loadAfterReady` (no restart) and `syncAfterWrite` (restart once via coordinator callback if still empty). The coordinator keeps `reconcileRuntime`. `setDefaultThinkingLevel` stays persist-only.

## Acceptance

Module tests cover no-restart ready load, post-write restart-if-empty, skip when a model exists, and skip when not ready or stale. Coordinator tests still prove committed `setDefaultModel` / refresh forwarding and WI-048 failed-save. compile/lint/full `npm test`. Native F5 not required.

## Subsequent Limits

No catalog-parser merge, PreviewBridge rewrite, streaming/Stop extract, gate, ADR or Git commit.
