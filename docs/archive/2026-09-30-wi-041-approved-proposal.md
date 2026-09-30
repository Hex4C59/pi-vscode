# WI-041: Approved Session-Worker Affinity Scope

English | [中文](2026-09-30-wi-041-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-041 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-041-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

CORE-02 was parked after the core-boundaries audit. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. REQ-008; no new ADR or gate.

## Goal and Scope

Inspect, history and preview successes bind session id, history page and preview offset to the request. Nonterminal preview must advance the cursor; a done flag must not contradict remaining characters. Keep the existing list page comparison. Parser counterexamples stay separate from real-worker emission or wrong-session-switch claims.

## Approach

`parseSessionWorkerResponse` compares inspect `session.id`, history `page` and preview `offset` to the request. `isSessionWorkerPreview` requires `done === (nextOffset === totalChars)` and progress when not done.

## Acceptance

Five synthetic counterexamples plus the list page control parse as `ok: false`. Existing legal round-trips and worker CLI list output still parse. compile/lint/full `npm test`. Native worker contradiction emission is not required.

## Subsequent Limits

ARCH-08 preview cost, protocol version change, and product claims about selected-conversation switching remain outside.
