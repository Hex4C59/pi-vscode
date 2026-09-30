# WI-046: Approved Diagnostic Probe Settlement Scope

English | [中文](2026-09-30-wi-046-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-046 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-046-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

RUNTIME-03/04/05 were parked after the runtime-helpers audit. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this diagnostic batch. Purely technical; no PRD slice, ADR or gate.

## Goal and Scope

The diagnostic helper owns child and pipe asynchronous errors and settles once; ENOENT returns failure. Distinguish RPC success, the stop attempt and observed exit; refused kill without exit evidence must not report bounded-shutdown success. `success` must be a boolean. Do not replace production ownership/recovery or call an isolated process crash an extension-host crash.

## Approach

`pi-rpc-probe.ts` injects spawn and stop timeout for tests. It listens for child and stdio errors, requires `success === true`, and reports `ok: true` only after observed `exit`/`close` or a non-null exit/signal code.

## Acceptance

Synthetic ENOENT returns `ok: false`. Refused kill without exit does not report success. String `"false"` success is not successful evidence. compile/lint/full `npm test`.

## Subsequent Limits

Stderr memory budget, production ownership/recovery, ARCH-06, gate and ADR remain outside.
