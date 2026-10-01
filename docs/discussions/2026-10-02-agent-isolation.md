# Agent isolation adoption

English | [中文](2026-10-02-agent-isolation.zh.md)

- Type: Discussion
- Status: Approved scope; historical rollout record
- Created: 2026-10-02
- Scope: repository workflow only; no product behavior or shared-kernel changes

## Approval and ownership

The maintainer approved the proposed isolation rollout on 2026-10-02, including the `codex/agent-isolation` branch and a dedicated worktree based on `origin/master`. No repository commit, history rewrite, push or PR is authorized. The existing primary-checkout WI-079 changes remain untouched; the remote baseline's older WI record is not current product approval for this task.

Adopt isolation, conflict handling and delivery ordering only, not PI-Desktop's architecture or test infrastructure. The [collaboration guide](../guides/agent-collaboration.md) owns the process and task sheet; [AGENTS](../../AGENTS.md) owns the short entry rules. Preserve one product WI, with disjoint approved subtasks and one coordinator for shared records. This separately authorized workflow maintenance does not replace the current product WI.

## Failure modes to verify before implementation

Task ownership: this agent is the sole writer for the bilingual AGENTS and collaboration guide, the Cursor pointer, `package.json`'s gate entry, `scripts/testing/pr-base.*`, this discussion pair, and only the session-contract summary in this worktree's `ACTIVE.md`. Product code, lockfile, shared kernel, primary checkout, WI proposals and other agents' work are excluded. Targeted Git CLI tests, applicable repository checks and the JSON report are required; commit/history/push/PR permissions remain denied.

- A current branch is incorrectly rejected, or a branch with task commits is incorrectly rejected.
- A stale local remote-tracking ref hides a newly advanced remote base.
- A behind or diverged branch is incorrectly accepted.
- A failed fetch, missing remote, missing remote branch or non-repository directory is reported as success.
- Checking the base changes task files, the index, HEAD or another worktree.
- Git subprocesses hang indefinitely or leak fixture repositories.

Exercise the real CLI against disposable local Git remotes and dedicated worktrees, without accessing user data or external services. These fixture commits are test data only, not commits on the task branch. Emit a repeatable JSON report under `out/work/agent-isolation/pr-base.json`. Cursor rule loading and server-side PR enforcement remain separate, unverified concerns.

## Handoff

Follow-up scope approved on 2026-10-02: add the remote PR base workflow and bind candidate validation evidence to exact tested commits and base revisions. Continue this task's worktree; no commit/history/push/PR authorization is added. This agent additionally owns `.github/workflows/pr-base.yml`, the bilingual testing guide's evidence pointer, and the corresponding rule/session-contract summaries. Before implementation, verify that CI cannot mistakenly check checkout HEAD instead of the PR head, accept missing/malformed snapshot IDs, or require a network fetch for an explicit snapshot. Preserve the local fresh-fetch behavior. Documentation must distinguish dirty-tree development checks from committed-candidate acceptance and ancestry checks from behavioral integration evidence.

The rules, bilingual task sheet, thin Cursor `alwaysApply` pointer and `check:pr-base` CLI are implemented only in the `codex/agent-isolation` worktree. Its `ACTIVE.md` changes only the two session-contract summary rows required by the guide; no WI proposal or product source was changed. The primary checkout still has its existing `ACTIVE.md` modification and untracked usage test. No task changes are staged, committed, pushed or merged, and no PR was created.

### Initial rollout verification

Verification on 2026-10-02, using Node 25.9.0 and the locked dependencies installed by `npm ci`:

- The eight CLI end-to-end cases failed before the gate existed and passed after implementation. `npm test` actually collects them; the JSON report is `out/work/agent-isolation/pr-base.json`.
- `npm run compile`, `npm run lint`, both script syntax checks, `git diff --check`, and static Cursor pointer/metadata checks passed. Cursor runtime rule loading and server-side PR enforcement were not tested or configured.
- First full test run: 1,147 passed, one existing default-model save case failed. That unchanged suite passed all four cases in isolation; a full rerun passed all 1,148 cases. This task does not claim to fix the observed intermittent failure. Both full-run logs and the focused log are retained under `out/work/agent-isolation/`.
- `npm run docs:verify` and `npm run docs:health` exited 1. There are eight existing missing links to ignored WI-035 acceptance artifacts and two existing Draft ADR 0010 warnings. An untouched `git archive HEAD` snapshot reproduced exactly the same verify diagnostics; the health-only scan had zero errors/notices, but its combined documentation checks still failed. Do not copy another worktree's artifacts or rewrite historical evidence to make this pass.
- The live base gate correctly exited 1: this worktree started at `b24d641`, and fetched `origin/master` advanced to `dd33b5d` (14 commits ahead). No automatic rebase/merge was attempted. Obtain explicit commit/history-change authorization, refresh only this private task worktree, resolve only task-changed paths and rerun affected checks before any PR. These rules are not yet on the shared base.

Logs and the baseline comparison are retained under `out/work/agent-isolation/`; the baseline snapshot was moved outside the repository to avoid being scanned as extra documentation, with its location recorded in `baseline-location.txt`. The primary checkout, its local branch and WI-079 work remain outside this task's write scope. This handoff does not replace their current product record.

### Activation authorization

On 2026-10-02 the maintainer requested enabling the completed configuration and continuing the remaining operations. This authorizes explicit-path task commits, refreshing this private branch, pushing it, opening and merging its PR through the applicable gates, and configuring the corresponding GitHub required check/up-to-date-base protection. It does not authorize discarding primary-checkout work, modifying product code, force-pushing, bypassing failing required checks or silently fixing unrelated baseline failures. Implementation and the `ACTIVE.md` session-contract summary remain separate commits. Remote `master` currently has no branch protection or rulesets; the authenticated account has administrator permission. Existing master CI already fails before this task, including documentation links and Windows behavior tests; record actual task/PR results separately.

Activation checkpoint: implementation and session-contract changes were committed separately and rebased without conflicts onto `dd33b5de667a180c0ac0fe30c34ae394dd5d7101`. Clean candidate `5b8b5aebdbb6da60395253d4f6c19012a627818f` passed compile, lint, webview/package-file verification and all 1,171 tests. Documentation checks still report the original historical-artifact failures. PR #1 was opened from `codex/agent-isolation`. GitHub protection was verified to require `PR head contains base snapshot` from GitHub Actions app 15368 with strict up-to-date-base checking, apply to administrators, require PR delivery with zero external approvals, and disallow force pushes/deleting `master`. Existing checks were not disabled or made less restrictive; no previous protection/rulesets existed. Detailed PR CI diagnostics could not be retrieved through the app's disconnected integration; the PR aggregate state is UNSTABLE, not proof of complete CI success. Any merge must use normal GitHub enforcement, never an administrator bypass. This checkpoint and any later PR merge event describe activation; earlier verification paragraphs below retain their historical source states. Primary-checkout work remains untouched and local `master` synchronization must wait for its owner to make that checkout safe.

### Follow-up verification

The new PR workflow targets every PR to `master`, tests the gate and checks explicit event base/head commit IDs rather than checkout HEAD, then preserves its fixture report and ancestry log. The bilingual collaboration guide owns the candidate/base/source-state evidence template and distinguishes task candidates, actual PR integration candidates and dirty-tree development checks; the testing guide and session-contract summary point to that requirement. No PI-Desktop process, dependency-environment or product test infrastructure was adopted.

Six new real-Git CLI cases first failed while the original eight passed, then all fourteen passed after implementation. YAML parsing and static workflow wiring, script syntax and diff checks passed. `npm run compile`, `npm run lint` and a fresh full `npm test` passed (1,154 tests, zero failures). The documentation commands still exit 1 with exactly the initial baseline diagnostics; no historical artifacts or Draft ADR status were altered.

These are development results, not committed-candidate or remote acceptance. Tested source baseline: `b24d641888a4dee8c50993097a353e1aac41aad4`; incorporated base is that same commit, while fetched target `master` is `dd33b5de667a180c0ac0fe30c34ae394dd5d7101`. Source state was dirty. The changed tracked and untracked source snapshot is `out/work/agent-isolation/ci-development-source.tar`, SHA-256 `b6fb0bec5dde837c88fbc391687453b89f2bae00b0e98131834d5a663ae01af5`; the tracked patch, source status, logs and identity report `ci-validation.json` are retained beside it. This snapshot identifies the source at the check run, before this final handoff update.

The live no-argument base gate still fails because the fetched target is not incorporated. GitHub execution, required-check configuration and branch/merge-queue protection remain unverified and unconfigured by this task. All changes remain only in this worktree, unstaged and uncommitted; no rebase, push, merge or PR was performed. Primary-checkout status remains its existing `ACTIVE.md` change and untracked usage test.
