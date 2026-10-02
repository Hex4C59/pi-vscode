# ACTIVE historical handoff archive (2026-10-03)

English | [中文](2026-10-03-active-handoff-cleanup.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-03
- Authority: historical handoff only; current work belongs to [ACTIVE](../../ACTIVE.md)

## Archival reason and replacement

The maintainer requested further cleanup of completed work. The October 2 handoff was superseded by the October 3 closure of WI-079–081 and moved out of ACTIVE. Preserve its synchronization history, branch recovery map, checks and then-outstanding acceptance; old failures are not rewritten as passes. Final acceptance remains in the [closed WI index](2026-09-29-closed-wi-index.md). The original Chinese handoff is retained in the paired document. Earlier unpushed, divergent and pending statements are not current status.

## Historical handoff

### 2026-10-02 — Single-agent workflow restored; acceptance gaps retained

The maintainer requested commit/push, local/remote alignment and only master. Remote `5033907` and its eight unique commits were normally merged into `9cfb34a`, preserving CI/history and resolving obsolete isolation/parallel rules. Remote protection required a PR and base checks; a temporary synchronization branch delivered the changes, after which it and `codex/wi079-parallel-plan` were deleted. No force push or protection downgrade occurred. GitHub merge records and synchronization checks own the final remote result; the earlier unpushed/divergent observations below describe prior stages.

The maintainer requested removal of multi-agent work rules. AGENTS, collaboration, PRD sequencing references and repository skills adopted sequential single-agent work; execution slots, A/B/C assignments, dedicated execution branches and automatic delegation requirements were removed. WI-079 was then current, with WI-080/081 approved and awaiting acceptance. Historical team evidence remained. This documentation change did not alter product behavior or acceptance.

Documentation verification, health and diff checks passed with two existing Draft ADR 0010 notices. Nine edited skill frontmatters parsed; five passed quick validation, while four were rejected only because the validator did not support their pre-existing `disable-model-invocation` field. That field matched HEAD and invocation settings were unchanged.

Earlier integration fast-forwarded local master from `dd33b5d` to `752992c` and removed the temporary `codex/final-wi079-081` branch, which had no unique commits. That stage did not push, rewrite history or delete original branches/worktrees. Existing worktrees were clean; all three features had integrated equivalents. Rename patch differences were usage-composition context, checked with `git range-diff`. CI/PR/isolation-rule branches were retained within their approval; local master and the existing origin/master tracking ref still diverged without a fresh network check.

At the subsequent non-master cleanup request, twelve local branches were preserved as `archive/2026-10-02/<original-branch-name>` tags before removing branch names. Nine clean worktrees switched to detached HEAD, retaining directories and ignored acceptance artifacts. Only local master remained; remote branches were not changed in that stage. Recovery mapping: [branch cleanup](../../dist/final-integration/branch-cleanup.json).

At `752992c`, compile, lint, 1206/1206 tests and genuine pi 0.86.1 usage/rename probes passed. The first rename probe used a nested output directory and missed its sibling approval gate; rebuilding at the recorded `dist/wi080-real-runtime.cjs` path passed, without a product change. The rebuilt [VSIX](../../dist/final-integration/pi-vscode-final.vsix) passed extraction/dependency/RPC/gate checks and installed into isolated `/tmp/pi-final-*` extension directories, proving installability only. [Artifacts](../../dist/final-integration/) preserve logs. `dist/team-three-wi-native/report.json` was a failed native report; the tools only found an existing user window, so isolated F5/installed interactions remained unverified. None of the three WIs closed at that checkpoint.

## Final acceptance handoff (moved out of ACTIVE)

### 2026-10-03 — WI-079–081 acceptance completed

The maintainer requested completion of missing acceptance and continuation after unlocking macOS. Genuine F5 and installed-package scenarios passed for usage open/Refresh/New, rename/catalogue updates, and exact original Markdown/code-block system clipboard readback. Refresh now focuses the existing panel before temporarily disabling its button; Escape returned focus in both hosts. Refresh did not increase provider requests. The three WIs closed, with PRD, Living contracts and indexes synchronized.

Historical checks passed: compile, lint, 1220 tests and VSIX packaging/verification. The tested source was `eb0ca432f58d6132e74940668b2c893fa9335243` plus `source.patch`; the focus fix was subsequently committed as `db9f6d1`. The maintainer authorized committing all changes, with acceptance documents and ACTIVE recorded separately, not pushed at that checkpoint. VSIX SHA-256: `08fa10df47679c81baf1110f836bd718a5ae0a2fa0709bda5463092688007513`. Artifacts: `dist/wi079-081-acceptance/`. Evidence used an independently identified, ad-hoc-signed VS Code 1.140.0 clone, pi 0.86.1 and a loopback synthetic provider without paid requests. App/provider shutdown produced seven child-exit receipts and zero owned application processes; temporary fixtures and scoped trust remained for replay. These remain development checks, not retroactive clean-candidate, remote-integration, other-platform, paid-provider, original-signature or path-alias-readiness acceptance.

The October 3 cleanup removed completed documentation candidates and PI-GAP-03/12/20 from ACTIVE, narrowed PI-GAP-01/02 to unfinished scope, consolidated superseded authorization and archived the earlier handoff. Bilingual feature-gap discussion pointers were updated. Review covered ACTIVE and related discussion, PRD/contract and acceptance entries, not a document-by-document repository audit. Documentation verification, health and diff checks passed with only the two existing Draft ADR 0010 notices. The paired Chinese document retains the original final handoff.

## ACTIVE writing-rule change — 2026-10-03

The maintainer requested plain “Current work / Pending work” sections and no completed tasks in ACTIVE. Removed the copied session-contract table, completed summaries/index and remaining handoffs; preserved all 25 unfinished rows and approval/acceptance boundaries. Collaboration rules now own this format, with bilingual navigation and archival rules synchronized. The verification CLI accepts the new empty/current layouts, still rejects missing task details and missing PRD approval, and rejects obsolete history sections. This is documentation/tooling maintenance, not a new product WI or feature authorization.

Failure cases were recorded and tests updated before changing the checker. The focused run failed against the old checker, then passed 14/14; the full `npm test` passed 1221/1221 on the uncommitted working tree. Reproducible CLI fixtures verify exit codes and unchanged source; reports are in `out/work/active-layout/` and `out/work/parallel-active/cli-report.json`. Documentation verification, health and diff checks passed with the two existing Draft ADR 0010 notices. No extension behavior changed; no F5 or installed-VSIX rerun was needed or claimed. No Git commit or template/sibling edit was made.
