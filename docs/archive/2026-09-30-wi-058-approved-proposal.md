# WI-058: Approved Per-Window Recovery Domain Scope

English | [中文](2026-09-30-wi-058-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-058 implementation and automated evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-058-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

The maintainer `/goal` to complete every parking-lot item authorized this Build. User-visible: each VS Code window admits its own runtime. Trace REQ-005/006. ADR 0009 after approval.

## Goal and Scope

Replace ADR 0002 shared-domain admission with `recovery-v1/windows/<uuid>/`. Scan the legacy shared root and at most 32 sibling window dirs for owner-lost handoff. Do not end a live `owned` sibling. Disclose concurrent file edits. Keep ADR 0008 exact-child cleanup and in-session Stop.

## Approach

Memory-only `randomUUID()` per activate. `handoffForeignRecoveryDomains` then this window's managed-process handoff. Occupied copy names this window's domain. Trusted UI and native confirm warn about two agents on one folder.

## Acceptance

Two independent stores can reserve together. Sibling listing skips the current id and junk names and caps at 32. Foreign handoff failure does not block this window. compile/lint/full `npm test`. Dual-window macOS F5 recorded as unverified if not run.

## Subsequent Limits

No Chat Participant, remote/multi-root, skip-approvals, framework replacement, public release, or Git commit.
