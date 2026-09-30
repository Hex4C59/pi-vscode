# WI-050: Approved Spec Naming Constraint Scope

English | [中文](2026-09-30-wi-050-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-050 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-050-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

TOOL-02 was parked as a conditional P3 after the tooling audit. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. Purely technical; no PRD slice, ADR or gate.

## Goal and Scope

Do not allow `.spec.tsx` as a collected application spec. Discovery fails when such a file sits under a collected `tests/` directory. Do not add TSX output-path mapping.

## Approach

`discoverTests` lists matching `.spec.tsx` paths and throws before building. Files outside collected test directories remain ignored. Existing `.spec.ts` / `.spec.mjs` discovery is unchanged.

## Acceptance

A tree with both `.spec.ts` and a collected `.spec.tsx` fails and names the TSX path. compile/lint/full `npm test`.

## Subsequent Limits

Allowing TSX specs, assertion-audit restart, ARCH inventories, WI-036, gate/ADR and push remain outside.
