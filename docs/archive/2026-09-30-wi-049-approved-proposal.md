# WI-049: Approved Packaging Required-Asset Scope

English | [中文](2026-09-30-wi-049-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-049 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-049-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

ARCH-07 was parked after the architecture backlog. The maintainer's 2026-09-30 request to finish remaining ACTIVE tasks authorized this Build. Purely technical; no PRD slice, ADR or gate. Unpack-run `verify-vsix` stays a separate evidence lane.

## Goal and Scope

The packaging collection entry and CI delivery path fail when required runtime helpers or Webview CSS are missing. Keep unpack-run verification distinct from build tests.

## Approach

`collectPackageFiles` requires host JS, webview JS/CSS and the three helper bundles. `npm run verify:package-files` stats the same list. CI runs that check and `verify:webview` after compile. `package:vsix` does not invoke `verify-vsix`.

## Acceptance

An isolated file set that selects only host and webview JS fails collection. Omitting helpers while selecting CSS also fails. compile/lint/full `npm test`.

## Subsequent Limits

WI-036 Build, investigation-first parking items, ADR 0005, gate and ADR, whole PRD and push remain outside.
