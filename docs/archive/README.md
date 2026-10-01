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

## Find a work item

[Closed WI lookup](2026-09-29-closed-wi-index.md) owns WI-number navigation: original acceptance/closure, existing standalone proposals and related historical records. This README owns archive policy and record-category navigation; it does not duplicate the per-WI table. Missing standalone material is marked in that index, never reconstructed.

WI records are historical, including old pending/open wording; current work and decisions belong to [ACTIVE](../../ACTIVE.md), [PRD](../product-requirements.md), [architecture](../architecture/vscode-extension-architecture.md), [gates](../reference/architecture-gates.md) and [ADRs](../decisions/README.md).

## Contract snapshots

- [Webview messages (workspace, chat, model settings and controlled execution)](2026-09-28-webview-contract-history.md)

## Cross-WI acceptance

- [macOS verification and personal-use acceptance (2026-09-30)](2026-09-30-macos-verification-acceptance.md)

## Runtime prerequisite evidence

- [Queued-input public RPC proof — WI-076](2026-10-01-wi-076-acceptance.md); synthetic provider, not product acceptance.
- [Text queue product slice — WI-077](2026-10-02-wi-077-acceptance.md); F5 and installed VSIX with synthetic provider; PI-GAP-01 remainder parked.
- [Composer command discovery — WI-078](2026-10-02-wi-078-acceptance.md); browser, genuine runtime, F5 and installed VSIX; loaded-context remainder parked.

## Superseded proposals and investigations

- [pi compatibility investigation](2026-09-22-pi-compatibility.md)
- [Webview frontend framework discussion](2026-09-22-webview-framework.md)

## Superseded handoffs and shared WI history

- [Closed work-item history — WI-001–007 and WI-010–012](2026-09-21-closed-wi-history.md)
- [Goal change-review checkpoint — WI-016](2026-09-22-goal-change-review-handoff.md)
- [Goal frontend and attachment checkpoints](2026-09-22-goal-frontend-attachment-handoffs.md)
- [Pre-Goal handoffs superseded by workspace recovery](2026-09-22-pre-goal-handoffs.md)
- [Goal session-continuity checkpoint — WI-017](2026-09-23-goal-session-handoff.md)
- [ACTIVE checkpoint history — candidate delivery and verification](2026-09-27-active-checkpoint-history.md)
- [ACTIVE completed-task compaction (2026-09-30)](2026-09-30-active-completed-compaction.md)

## WI record categories

Use the numbered lookup for **proposals** (including superseded/paused candidates), **acceptance and closure**, and **investigation/handoff history**. One file can serve multiple roles. WI-022 retains the superseded console investigation alongside its closure; the adopted workaround remains in the [discussion](../discussions/2026-09-28-wi-022-background-consoles.md). WI-032 pending acceptance is superseded by its final evaluation; both remain linked under WI-032. Older handoffs keep their date-specific limits rather than inheriting later acceptance. No archive files were moved for this navigation change.

## Agent rule

If archive text conflicts with current authoritative docs, ignore archive and cite the live file.

At WI close or confirmed document replacement, the agent performs affected archival under [collaboration §7](../guides/agent-collaboration.md#7-agent-obligations), without a separate save/directory question. This is not permission for bulk history cleanup. Record archival reason, historical status and replacement link (or explain why no replacement exists). Preserve still-valid requirements and unresolved questions in active documents before moving; retain a summary/link at the former entry point. Move existing translations together, repair inbound and relative links and indexes, then run `npm run docs:verify` and `npm run docs:health`. Keep ADRs in `docs/decisions/` with status and replacement links. Age or length alone does not justify archival.

Navigation maintenance: WI-073 — [numbered history](2026-09-29-closed-wi-index.md).

Navigation maintenance: WI-074 — [numbered history](2026-09-29-closed-wi-index.md).

Navigation maintenance: WI-075 — [numbered history](2026-09-29-closed-wi-index.md).
