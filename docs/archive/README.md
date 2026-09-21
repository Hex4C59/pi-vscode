# Archive (non-authoritative history)

English | [中文](README.zh.md)

- Type: Reference
- Status: Accepted
- Created: <!-- date -->
- Authority: **historical context only**—superseded PRDs, WIs, spikes, and discussions

## Purpose

Move material here when it is **no longer active** but you want to keep an audit trail:

- Superseded `product-requirements.md` revisions (link from the current PRD).
- Closed WI write-ups that are too long for `ACTIVE.md` history.
- Abandoned spikes with lessons learned.

Do **not** implement from archive files. Agents treat archive as read-only background.

## Before moving a file

1. Note **why** it was superseded (one line at the top of the archived file or in an ADR).
2. Ensure the **current** truth lives in PRD (`Accepted`), architecture, gates, ADRs, or `ACTIVE.md`.
3. Prefer `YYYY-MM-DD-original-name.md` under `docs/archive/` (flat or subfolders by year).

## Closed WI index

| Record | Contents |
|--------|----------|
| [Closed work-item history through WI-007](2026-09-21-closed-wi-history.md) | WI-001/002/003/005/006/007 scope, acceptance evidence and retained limits |

## Agent rule

If archive text conflicts with current authoritative docs, ignore archive and cite the live file.

At WI close or confirmed document replacement, the agent performs affected archival under [collaboration §7](../guides/agent-collaboration.md#7-agent-obligations), without a separate save/directory question. This is not permission for bulk history cleanup. Record archival reason, historical status and replacement link (or explain why no replacement exists). Preserve still-valid requirements and unresolved questions in active documents before moving; retain a summary/link at the former entry point. Move existing translations together, repair inbound and relative links and indexes, then run `npm run docs:verify` and `npm run docs:health`. Keep ADRs in `docs/decisions/` with status and replacement links. Age or length alone does not justify archival.
