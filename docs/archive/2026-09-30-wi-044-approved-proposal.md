# WI-044: Approved Vite Commit-Check Scope

English | [中文](2026-09-30-wi-044-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-044 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-044-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

TOOL-01 was parked after the tooling-config audit. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. Purely technical; no PRD slice, ADR or gate.

## Goal and Scope

Classify the repository's actual Vite configuration as an implementation/build input in commit checks. Cover add, modify, delete and rename. Keep the docs-only ACTIVE pairing. Do not replace manual semantic review.

## Approach

`isImplementationPath` matches root `vite.config.*` the same way it matches esbuild, tsconfig and ESLint configs.

## Acceptance

ACTIVE staged with Vite config add/modify/delete/rename fails. ACTIVE with ordinary docs still passes. compile/lint/full `npm test`.

## Subsequent Limits

TOOL-02 TSX spec discovery remains outside.
