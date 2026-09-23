# Archive (non-authoritative history)

English | [中文](README.zh.md)

- Type: Reference
- Status: Accepted
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
| [Closed work-item history — WI-001–007 and WI-010–012](2026-09-21-closed-wi-history.md) | Closed scope, acceptance evidence and retained limits; WI-008/WI-009 remain open in ACTIVE |

## Superseded handoffs

| Record | Contents |
|--------|----------|
| [Pre-Goal handoffs superseded by workspace recovery](2026-09-22-pre-goal-handoffs.md) | Historical approvals/evidence; not a WI closure or current task ledger |
| [Goal frontend and attachment checkpoints](2026-09-22-goal-frontend-attachment-handoffs.md) | Executable WI-015 / WI-014 handoffs replaced by the next Goal slice; maintainer acceptance and gates remain open |
| [Goal change-review checkpoint](2026-09-22-goal-change-review-handoff.md) | WI-016 code/executable handoff replaced by session continuity; maintainer acceptance and gates remain open |
| [Goal session-continuity checkpoint](2026-09-23-goal-session-handoff.md) | WI-017 executable delivery and maintainer-requested pause; next implementation not started, acceptance and gates remain open |

## Agent rule

If archive text conflicts with current authoritative docs, ignore archive and cite the live file.

At WI close or confirmed document replacement, the agent performs affected archival under [collaboration §7](../guides/agent-collaboration.md#7-agent-obligations), without a separate save/directory question. This is not permission for bulk history cleanup. Record archival reason, historical status and replacement link (or explain why no replacement exists). Preserve still-valid requirements and unresolved questions in active documents before moving; retain a summary/link at the former entry point. Move existing translations together, repair inbound and relative links and indexes, then run `npm run docs:verify` and `npm run docs:health`. Keep ADRs in `docs/decisions/` with status and replacement links. Age or length alone does not justify archival.
