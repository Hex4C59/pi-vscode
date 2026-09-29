# WI-026 — Superseded ACTIVE handoffs

English | [中文](2026-09-29-wi-026-active-superseded.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-29
- Authority: historical WI-026 scope, handoffs and the 2026-09-29 maintainer F5 closure; current work is [`ACTIVE.md`](../../ACTIVE.md)

## Closure — 2026-09-29

The maintainer explicitly confirmed F5 visual acceptance for WI-026 in this conversation: they tested the development host and were satisfied. This closes the approved scheme-A slice. It is personal maintainer inspection, distinct from the agent's earlier browser preview and the failed ScreenCaptureKit capture. No new ADR or architecture gate was involved. The PRD remains Draft, with this slice individually accepted.

The approved work replaced the sidebar settings dialog with one editor-area settings page while chat stays in the sidebar. Categories are General, Default model and Providers. Default models are a searchable list with an explicit saved selection. Credential actions appear in provider detail and still use native host prompts. Language changes update both views in memory until the extension host restarts. Execution profile choices sit in the composer permissions disclosure. Closing settings retains chat, drafts and running work. Model application, credential storage, thinking level, execution permission and recovery rules stay as previously accepted. The final proposal and the implementation handoff are below. Recorded implementation checks were compile, lint, npm test (736/736), verify:webview and docs:verify; the acceptance-recording task did not rerun them.

The same conversation later confirmed F5 visual acceptance for paused WI-023 and WI-024. That confirmation is recorded on the [WI-024 proposal](2026-09-28-wi-024-paused-proposal.md). This WI-026 confirmation does not establish installed-VSIX behavior, and it does not authorize a commit or push.

### Final approved proposal moved from ACTIVE

Delete the annotated explanations and implement maintainer-selected A: settings open independently in the editor area, chat stays visible, and each category presents one task. SettingsPanel owns the single instance, view identity and narrow allowlist, and projects only non-secret provider state plus language. It reuses ProviderConfig and the existing model-apply path. `main` mounts settings or chat from the host surface marker. Execution configuration stays in the composer permissions disclosure. Language is host memory only. Closing settings does not touch chat or the runtime. Decision none: the existing low-trust Webview and privileged-host boundary, persistence and runtime integration strategy continue.

### Implementation handoff moved from ACTIVE

The production settings surface is one editor-area WebviewPanel. Formal mount and host tests covered page navigation, state and language projection, identity isolation, repeat open, close/reopen and draft retention. Browser checks covered the 800px English dark provider list and detail, plus 280/320/400px Chinese ready in dark, light and high contrast. Those checks were not system forced-colors. The English narrow long-copy, error, loading and execution-disclosure visual matrix was not completed. F5 launched and the window title became Pi · Settings, but accessibility and screenshots stayed on Welcome; after rebuilding the UI connection, macOS ScreenCaptureKit reported -3811. The maintainer's later personal check supersedes that capture gap for visual acceptance. One unsent test draft may remain in that development host. No chat was sent, and credentials, models and execution grants were not changed by the agent. Preview remained at 127.0.0.1:5178/settings-review.html. No commit or push. Parallel CONTEXT, saved-default discussion, architecture-skill and webview-client readability edits stayed in the worktree.

## Replacement reason

On 2026-09-29 the maintainer asked to compact ACTIVE. At that moment WI-026 was still Build / WIP=1, so the copy-label deletion round and the redesign-research round moved here ahead of the live scheme-A handoff. The closure above is later the same day. The checkpoint text below keeps its original "not yet accepted" wording as that earlier snapshot.

## Copy-label deletion checkpoint

This round deleted the annotated explanations called out in screenshots: language notes, default-model / session-model / provider-summary copy, credential status text, and idle-runtime hints inside settings. Fields, actions, and error / loading / switch / restore feedback stayed. Idle copy and styles were cleaned; production-mount tests, bilingual PRD and the pi-sidebar-ui skill were updated. Local Codex settings screenshots use a wider layout with a separate copy column; they do not justify stacking explanations beside narrow-sidebar controls. The skill now defaults to label plus control, keeping only explanations that change a choice.

Recorded checks at that round: compile, lint, npm test (732/732), verify:webview, docs:verify (0 errors / 0 warnings), git diff --check and skill quick_validate. Chrome synthetic-host render checks: 280 / 320 / 400px Chinese ready in dark / light / high-contrast, plus English high-contrast error. Annotated copy was gone, controls wrapped, error feedback remained. English high-contrast ready also had an accessibility-tree check. This was synthetic-host evidence, not F5 / installed VSIX / system forced-colors. Preview remained at 127.0.0.1:5178. No commit or push. Parallel CONTEXT bilingual edits and the live-session-saved-default discussion were left in the worktree.

Those 732 tests prove only the deletion round, not redesign acceptance.

## Redesign research checkpoint

The maintainer rejected further compression of the old form and required first-hand research then a fundamental redesign. VS Code, Claude Code and Cline docs were read; local Codex settings screenshots were inspected. Conclusions and limits are in the [research note](../discussions/2026-09-29-settings-redesign-research.md). The skill visual library gained two operable structure candidates: A, an editor-area settings page; B, a full-width sidebar overview with task detail. The agent first recommended B; the maintainer later chose A. Credential actions belong in provider detail; execution entry stays near the composer. Native Settings is the official baseline; reasons and costs for diverging are recorded there.

The research round did not change application code, host semantics or commits. Chrome spot-checks covered 280 / 320 / 400px, dark / light / high-contrast, plus actual model search, selection and detail navigation; not a full matrix or F5. The study page remains at 127.0.0.1:8769/assets/settings-redesign-study.html (`variant=A|B`). Documentation structure and script syntax checks passed at that round.
