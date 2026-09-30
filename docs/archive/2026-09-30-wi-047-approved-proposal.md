# WI-047: Approved Endpoint Write Output Budget Scope

English | [中文](2026-09-30-wi-047-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-047 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-047-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

ARCH-06 was parked after the architecture backlog. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. Purely technical; no PRD slice, ADR or gate. ADR 0007 left output-size budgeting outside WI-038.

## Goal and Scope

Validate serialized endpoint output against the 1 MiB read budget before commit. Over-limit writes keep the original file and report an error. Cover pretty-print expansion of compact JSON that was still readable.

## Approach

`changeUnderLock` refuses `too-large` when UTF-8 output exceeds `MAX_MODELS_FILE_BYTES` before creating a temporary file. `ProviderConfig` projects a fixed size-limit error and does not continue login.

## Acceptance

Oversized replacement text is not committed. Pretty-printed add of a compact file one byte under budget leaves the original bytes. compile/lint/full `npm test`.

## Subsequent Limits

ADR 0005, ARCH-02 supplement, gate and ADR remain outside.
