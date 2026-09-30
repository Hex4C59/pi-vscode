# WI-040: Approved Eight-Card Approval Admission Scope

English | [中文](2026-09-30-wi-040-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-040 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-040-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

CORE-01 was parked after the core-boundaries audit. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. REQ-006; no new ADR or gate.

## Goal and Scope

At most eight in-flight approval cards. Concurrent preflights must not admit a ninth. Cancel and error release the slot. This is the local admission invariant, not an approval bypass or a claim about invalid projections, disconnect, or memory exhaustion.

## Approach

`ToolApprovals.evaluate` rechecks `pending.size >= 8` at the card-insert site after the asynchronous safety and scope awaits. Duplicate request IDs still deny without inserting. Auto-allow and existing session grants do not occupy a card slot.

## Acceptance

Nine concurrent custom-tool preflights waiting in the initial safety hook yield eight cards and one denial. Cancel clears the queue so a later request can be offered. compile/lint/full `npm test`. Native nine-way approval UI is not required.

## Subsequent Limits

ARCH-01 state-table work, CORE-02, and Webview protocol changes remain outside.
