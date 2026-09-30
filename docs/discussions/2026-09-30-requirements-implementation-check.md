# Requirements implementation check (2026-09-30)

English | [中文](2026-09-30-requirements-implementation-check.zh.md)

- Type: Discussion
- Status: Draft
- Created: 2026-09-30
- Authority: source and evidence observations only; not new requirements, Build authorization or a change to Accepted PRD/ADR/gate decisions
- Related: [PRD](../product-requirements.md), [ACTIVE](../../ACTIVE.md)

## Question and method

The maintainer asked whether every requested PRD function was implemented, after the current entry had recorded no unfinished work. This assessment reads the requirements, production composition, relevant implementation seams and existing acceptance records. No code was changed and no behavior tests or native-host runs were performed. An Accepted label or empty WI queue does not establish a requirement's actual implementation.

## Confirmed implementation gap

**REQ-001: declined project-resource visibility.** The PRD requires a visible indication when a trusted workspace continues without project-local pi resources. In [ProjectResourceConsent](../../src/webview/chat/project-resource-consent.tsx), an eligible workspace with a recorded choice enters the settled phase; that phase renders neither the chosen policy nor a declined-resource notice. The production [Candidate](../../src/webview/chat/candidate.tsx) mounts this component, not [WorkspaceSetup](../../src/webview/components/workspace-setup.tsx), whose older UI still contains the choice-status text. [MessageComposer](../../src/webview/chat/message-composer.tsx) displays execution profiles and grants in Permissions, which are separate from project-resource consent. The inspected production path therefore omits the required ongoing notice after Decline.

Project identity is also weakly disclosed: [ProjectResourcesPrompt](../../src/webview/chat/project-resources-prompt.tsx) exposes the folder path only inside initially collapsed details before the choice; [SessionNavigation](../../src/webview/chat/session-navigation.tsx) shows the conversation name. Whether that satisfies showing the active folder before a task needs a focused requirement check. This is a visibility concern, not evidence that the host executes in the wrong folder.

**REQ-002: ambiguous live model identity.** [Runtime model parsing](../../src/adapter/runtime/pi-rpc-model-parse.ts) prefers a model's display name over its provider/id pair. [ModelPickerView](../../src/webview/components/model-picker.tsx) then tries to recover identity from that string; if two configured providers use the same display name, there is no unique match and no radio is marked applied. The current chip also has no provider identity to display. This violates selected provider/model visibility and the PRD's duplicate-label statement in that scenario; it is not evidence that the runtime chose the wrong model. The [WI-042 record](../archive/2026-09-30-wi-042-macos-acceptance.md) and [existing mounted cases](../../src/webview/tests/model-selection.spec.ts) cover duplicate labels with a canonical current-model string, while explicitly retaining a host display-label projection. No new reproduction test was run in this assessment.

## Acceptance evidence gap

**REQ-009: current macOS five-category verification is not established by the cited records.** The PRD's platform requirement explicitly calls for five-category success/failure fixtures, the coding loop and recovery in macOS local VS Code, including a real extension. Its [combined acceptance reference](../archive/2026-09-28-wi-010-goal-closure.md), especially the resource-invocation supplement, records the original Windows target and Windows native/installed hosts. The underlying [trusted-extension](../archive/2026-09-28-wi-013-acceptance.md), [review](../archive/2026-09-28-wi-016-review-acceptance.md) and [session](../archive/2026-09-28-wi-017-session-acceptance.md) evidence belongs to that earlier platform scope.

Later [macOS packaging evaluation](../archive/2026-09-30-wi-034-macos-evaluation.md) explicitly excludes full REQ-009 acceptance. The [macOS verification record](../archive/2026-09-30-macos-verification-acceptance.md) adds dual-window ownership, crash cleanup, endpoint calls and device-code/browser OAuth interaction, but does not record the complete representative resource/extension/form/review/session success-failure matrix. A focused search of current documentation found no separate macOS matrix covering that remainder. This is missing evidence in the inspected records, not proof that those functions fail or that no unrecorded run exists. Historical Windows passes must remain historical Windows passes.

## Further requirement checks

REQ-008 restoration, pagination and generic historical-tool presentation are implemented. The PRD additionally asks for identifiable missing capabilities to be disclosed. [SavedHistory](../../src/webview/components/saved-history.tsx) provides a blanket warning that historical tools may not be loaded; [history projection](../../src/adapter/sessions/session-history-projection.ts) renders historical names/status, without comparing them with a current tool inventory. Specific missing-capability disclosure needs focused assessment before treating this wording as completely satisfied. Complete dependency detection is explicitly not required.

Core model/thinking, attachment transactions, streaming/execution, Stop/recovery, covered approvals, readonly review and saved-session flows have production paths and scoped historical acceptance. This assessment does not certify every branch or re-run those records. Representative trusted-extension compatibility is bounded to the recorded target and public pi version; general ecosystem compatibility, rich attachments, remote/multi-root, skipped approvals and public release remain separate non-goals.

Chinese REQ-009 also retains obsolete Prepare/pending-verification wording for trusted selection, Stop-unconfirmed recovery and standard forms where the English requirement and WI-013/ADR 0002 now record bounded acceptance. Those are translation/status drift, not newly missing implementations. Inspect both language versions against the authoritative English text before turning old phrases into tasks.

## Current leaning and next steps

The project has an implemented core workflow and historical delegated acceptance, but the stronger claim that every in-scope PRD detail and current macOS acceptance condition is fulfilled is unsupported. Record the confirmed REQ-001/002 gaps and REQ-009 evidence remainder in ACTIVE. A later scoped proposal should restore resource-state disclosure and unambiguous live model identity, assess project/missing-capability visibility, and locate or perform the missing macOS representative matrix. No new WI or implementation is authorized by this investigation; do not silently change product requirements or rewrite historical passes.
