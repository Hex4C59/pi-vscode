# Requirements implementation check (2026-09-30)

English | [中文](2026-09-30-requirements-implementation-check.zh.md)

- Type: Discussion
- Status: Draft; REQ-001 declined-notice gap closed by WI-068 and REQ-002 duplicate-label identity closed by WI-069 on 2026-10-01; REQ-009 evidence remainder remains
- Created: 2026-09-30
- Authority: source and evidence observations only; not new requirements, Build authorization or a change to Accepted PRD/ADR/gate decisions
- Related: [PRD](../product-requirements.md), [ACTIVE](../../ACTIVE.md), [WI-068](../archive/2026-10-01-wi-068-acceptance.md), [WI-069](../archive/2026-10-01-wi-069-acceptance.md)

## Question and method

The maintainer asked whether every requested PRD function was implemented, after the current entry had recorded no unfinished work. This assessment reads the requirements, production composition, relevant implementation seams and existing acceptance records. No code was changed and no behavior tests or native-host runs were performed. An Accepted label or empty WI queue does not establish a requirement's actual implementation.

## Confirmed implementation gap

**REQ-001: declined project-resource visibility (closed by WI-068).** The 2026-09-30 inspection found that settled `ProjectResourceConsent` omitted the notice. WI-068 added `#declined-resources` after Decline. Folder-identity disclosure before a task remains a separate visibility concern, not evidence that the host executes in the wrong folder.

Project identity is also weakly disclosed: [ProjectResourcesPrompt](../../src/webview/chat/project-resources-prompt.tsx) exposes the folder path only inside initially collapsed details before the choice; [SessionNavigation](../../src/webview/chat/session-navigation.tsx) shows the conversation name. Whether that satisfies showing the active folder before a task needs a focused requirement check. This is a visibility concern, not evidence that the host executes in the wrong folder.

**REQ-002: ambiguous live model identity (closed by WI-069).** The 2026-09-30 inspection found that runtime parsing preferred display names, so duplicate labels could leave no applied radio. WI-069 projects `provider / modelId`. Catalog labels and the composer chip stay presentation-only. This is not evidence that the runtime chose the wrong model.

## Acceptance evidence gap

**REQ-009: current macOS five-category verification is not established by the cited records.** The PRD's platform requirement explicitly calls for five-category success/failure fixtures, the coding loop and recovery in macOS local VS Code, including a real extension. Its [combined acceptance reference](../archive/2026-09-28-wi-010-goal-closure.md), especially the resource-invocation supplement, records the original Windows target and Windows native/installed hosts. The underlying [trusted-extension](../archive/2026-09-28-wi-013-acceptance.md), [review](../archive/2026-09-28-wi-016-review-acceptance.md) and [session](../archive/2026-09-28-wi-017-session-acceptance.md) evidence belongs to that earlier platform scope.

Later [macOS packaging evaluation](../archive/2026-09-30-wi-034-macos-evaluation.md) explicitly excludes full REQ-009 acceptance. The [macOS verification record](../archive/2026-09-30-macos-verification-acceptance.md) adds dual-window ownership, crash cleanup, endpoint calls and device-code/browser OAuth interaction, but does not record the complete representative resource/extension/form/review/session success-failure matrix. A focused search of current documentation found no separate macOS matrix covering that remainder. This is missing evidence in the inspected records, not proof that those functions fail or that no unrecorded run exists. Historical Windows passes must remain historical Windows passes.

## Further requirement checks

REQ-008 restoration, pagination and generic historical-tool presentation are implemented. The PRD additionally asks for identifiable missing capabilities to be disclosed. [SavedHistory](../../src/webview/components/saved-history.tsx) provides a blanket warning that historical tools may not be loaded; [history projection](../../src/adapter/sessions/session-history-projection.ts) renders historical names/status, without comparing them with a current tool inventory. Specific missing-capability disclosure needs focused assessment before treating this wording as completely satisfied. Complete dependency detection is explicitly not required.

Core model/thinking, attachment transactions, streaming/execution, Stop/recovery, covered approvals, readonly review and saved-session flows have production paths and scoped historical acceptance. This assessment does not certify every branch or re-run those records. Representative trusted-extension compatibility is bounded to the recorded target and public pi version; general ecosystem compatibility, rich attachments, remote/multi-root, skipped approvals and public release remain separate non-goals.

Chinese REQ-009 also retains obsolete Prepare/pending-verification wording for trusted selection, Stop-unconfirmed recovery and standard forms where the English requirement and WI-013/ADR 0002 now record bounded acceptance. Those are translation/status drift, not newly missing implementations. Inspect both language versions against the authoritative English text before turning old phrases into tasks.

## Current leaning and next steps

The project has an implemented core workflow and historical delegated acceptance. REQ-001 declined-resource visibility is closed by WI-068. REQ-002 duplicate-label identity is closed by WI-069. The stronger claim that every in-scope PRD detail and current macOS acceptance condition is fulfilled remains unsupported for the REQ-009 macOS matrix remainder.
