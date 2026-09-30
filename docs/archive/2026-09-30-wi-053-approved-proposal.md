# WI-053: Approved ARCH-08 Measurement Scope

English | [中文](2026-09-30-wi-053-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-053 measurement is complete; final disposition belongs to the [acceptance record](2026-09-30-wi-053-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

ARCH-08 required measuring streaming publish and history preview cost before any optimization. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. Purely technical; no PRD slice, ADR or gate.

## Goal and Scope

Measure publish bytes, parse counts and latency on representative bounded loads. Keep public SDK and identity/anchor checks. Do not optimize or parse session files.

## Approach

Read hot paths; time `JSON.stringify`, `Lexer.lex`, conversation regroup, and `projectSavedHistoryPreview` in-process. Do not claim VS Code IPC or a UI stall.

## Acceptance

A discussion names workloads, numbers, and whether optimization is justified. compile/lint/full `npm test` as regression when application code is unchanged.

## Subsequent Limits

Streaming/history optimization, session-file parsing, ARCH inventories, WI-036, gate/ADR and push remain outside.
