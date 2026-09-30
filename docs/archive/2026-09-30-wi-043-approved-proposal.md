# WI-043: Approved Consumed-Escape Scope

English | [中文](2026-09-30-wi-043-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-043 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-043-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

UI-02 was parked after the UI-components audit. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. REQ-002; no new ADR, gate or protocol change.

## Goal and Scope

The model popover's window-level Escape listener ignores already-consumed events (`defaultPrevented` or composing). Overlapping Add-context menu and model popover: Escape on the context menu closes only that menu and restores its trigger. jsdom evidence, not macOS host keyboard acceptance.

## Approach

`ModelPickerView` returns early when Escape is composing or already prevented. `CandidateContext` already preventDefault on menu Escape.

## Acceptance

Mounted overlap: context menu gone, popover open, focus on Add context. Composing Escape leaves the popover open. Existing popover-only Escape still closes it. compile/lint/full `npm test`.

## Subsequent Limits

UI-03 localization and real-host keyboard verification remain outside.
