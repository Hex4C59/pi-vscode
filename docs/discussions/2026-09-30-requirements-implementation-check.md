# Requirements implementation check (2026-09-30)

English | [中文](2026-09-30-requirements-implementation-check.zh.md)

- Type: Discussion
- Status: Draft; REQ-001 declined-notice gap closed by WI-068, REQ-002 duplicate-label identity closed by WI-069, and REQ-009 macOS five-category remainder closed by WI-070 on 2026-10-01
- Created: 2026-09-30
- Authority: source and evidence observations only; not new requirements, Build authorization or a change to Accepted PRD/ADR/gate decisions
- Related: [PRD](../product-requirements.md), [ACTIVE](../../ACTIVE.md), [WI-068](../archive/2026-10-01-wi-068-acceptance.md), [WI-069](../archive/2026-10-01-wi-069-acceptance.md), [WI-070](../archive/2026-10-01-wi-070-acceptance.md)

## Question and method

The maintainer asked whether every requested PRD function was implemented, after the current entry had recorded no unfinished work. This assessment reads the requirements, production composition, relevant implementation seams and existing acceptance records. No code was changed and no behavior tests or native-host runs were performed. An Accepted label or empty WI queue does not establish a requirement's actual implementation.

## Confirmed implementation gap

**REQ-001: declined project-resource visibility (closed by WI-068).** The 2026-09-30 inspection found that settled `ProjectResourceConsent` omitted the notice. WI-068 added `#declined-resources` after Decline. Folder-identity disclosure before a task remains a separate visibility concern, not evidence that the host executes in the wrong folder.

Project identity is also weakly disclosed: [ProjectResourcesPrompt](../../src/webview/chat/workspace/project-resources-prompt.tsx) exposes the folder path only inside initially collapsed details before the choice; [SessionNavigation](../../src/webview/chat/sessions/session-navigation.tsx) shows the conversation name. Whether that satisfies showing the active folder before a task needs a focused requirement check. This is a visibility concern, not evidence that the host executes in the wrong folder.

**REQ-002: ambiguous live model identity (closed by WI-069).** The 2026-09-30 inspection found that runtime parsing preferred display names, so duplicate labels could leave no applied radio. WI-069 projects `provider / modelId`. Catalog labels and the composer chip stay presentation-only. This is not evidence that the runtime chose the wrong model.

## Acceptance evidence gap

**REQ-009: current macOS five-category verification (closed by WI-070, with recorded limits).** The 2026-09-30 inspection found that cited records were Windows or incomplete macOS dual-window/OAuth evidence. WI-070 ran an isolated installed VSIX on Darwin 27 / VS Code 1.139.1 and recorded the five-category table, a send/stream/complete turn and owned-child recovery, including reviewed `pi-system-prompt-manager` 0.1.1. Historical Windows passes stay Windows. Skill-body invocation, attachment/review and terminal sequential handoff were not re-run on that host; see the [WI-070 limits](../archive/2026-10-01-wi-070-acceptance.md).

## Further requirement checks

REQ-008 restoration, pagination and generic historical-tool presentation are implemented. The PRD additionally asks for identifiable missing capabilities to be disclosed. [SavedHistory](../../src/webview/chat/sessions/saved-history.tsx) provides a blanket warning that historical tools may not be loaded; [history projection](../../src/adapter/sessions/session-history-projection.ts) renders historical names/status, without comparing them with a current tool inventory. Specific missing-capability disclosure needs focused assessment before treating this wording as completely satisfied. Complete dependency detection is explicitly not required.

Core model/thinking, attachment transactions, streaming/execution, Stop/recovery, covered approvals, readonly review and saved-session flows have production paths and scoped historical acceptance. This assessment does not certify every branch or re-run those records. Representative trusted-extension compatibility is bounded to the recorded target and public pi version; general ecosystem compatibility, rich attachments, remote/multi-root, skipped approvals and public release remain separate non-goals.

Chinese REQ-009 also retains obsolete Prepare/pending-verification wording for trusted selection, Stop-unconfirmed recovery and standard forms where the English requirement and WI-013/ADR 0002 now record bounded acceptance. Those are translation/status drift, not newly missing implementations. Inspect both language versions against the authoritative English text before turning old phrases into tasks.

## Current leaning and next steps

The project has an implemented core workflow and historical delegated acceptance. REQ-001 declined-resource visibility is closed by WI-068. REQ-002 duplicate-label identity is closed by WI-069. REQ-009's current macOS installed five-category remainder is closed by WI-070 within that record's limits. Remaining parking is directory organization, not this matrix.
