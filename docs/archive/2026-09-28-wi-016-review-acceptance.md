# WI-016 — Controlled writes and captured review acceptance

English | [中文](2026-09-28-wi-016-review-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: scoped delegated acceptance; ACTIVE owns remaining work

## Decision and approved scope

On September 28, 2026 Asia/Shanghai, the agent completed evaluation under the maintainer's explicit delegation and accepts WI-016 T016-01/02. This archives its completed proposal and verification, not personal maintainer inspection. WI-017 session acceptance, WI-010 wider boundary disposition, broad gates and the entire Draft PRD are not accepted by this closure.

Retain public pi pre-execution hooks, host-owned dirty-editor checks, bounded memory-only before/after snapshots and native readonly diff. The approved scope requires dirty built-in write/edit denial both before approval and immediately before execution, including grant reuse; no automatic Save. Clean deliberate retries can proceed. Historical captured pairs remain exact when current source changes or disappears; source navigation is explicitly current, not code restoration. Tool-reported changes and observed workspace events must remain distinguishable. Review pagination, keyboard, draft/Stop, recreation and loss/recovery must remain operable.

Root review matched editor-tools, write protection, approval orchestration, review capture/retention, readonly content provider, shared React presentation and registered seam tests to this scope. No further host/adapter implementation was needed. This is not an independent full-repository review. The architecture owner/dependency direction remains unchanged; no new ADR is required for the local CSS correction.

## Actual evidence

Roots: dist/delegated-completion-20260928/wi016-native/ and wi016-installed/. The latter EVIDENCE.md contains exact scripts, failure records and cleanup conditions. Both use public pi0.86.1 and a localhost synthetic provider with isolated secret-free HOME/profile/workspace. Native is actual F5 with the unmodified official Code1.105.1 debugger and primary-sidebar fallback; installed is official Code1.139.1 with an isolated CLI-installed VSIX. Neither substitutes for the other.

| Acceptance | This run's evidence |
|---|---|
| Dirty buffers and deliberate recovery | history-report and visual-report: actual native editor unsaved text remains unchanged, disk unchanged, no approval and actual tool denial; explicit native Save then new task/Allow once succeeds. guard-report: editing while approval waits is refused by final check; exact session grant never bypasses dirty guard; clean retry works. Built-in edit has its own successful and dirty-denied cases. |
| Exact readonly captured review | History flow opens actual native diff with exact saved before and tool-written after. Typing into the visible modified diff editor is refused and displayed text/disk stay unchanged. Later external write does not replace the pair; current-source action reads latest content. Exact owned target deletion leaves historical pair available and source navigation reports unavailable without recreating it. |
| Failures and attribution | fault-report: actual public edit mismatch is Failed+Unchanged, native diff and disk agree. A filesystem write during a slow active task is explicitly Observed workspace change/No before snapshot, without a captured-diff action or fabricated tool attribution. Stop preserves external content and newer draft. |
| Pagination, grants and lifecycle | lifecycle-report:18 actual writes, stable first page and keyboard Next/First; actual Developer: Reload Webviews retains review IDs/draft without request replay. Revocation requires approval again; Stop cancels an unapproved write. Actual owned-child End clears review, invalidates already-open native snapshot content and preserves draft; separate Recover does not replay or fabricate old captures. |
| Narrow/short keyboard and visual | Both post-fix visual-report matrices: three actual bundled themes ×zh-CN/en; Enter toggle, focus return, Tab/Enter native diff, Focus Chat, draft/input and no horizontal document overflow. Installed289×506, native299×320; native loss probe299×304. All twelve originals were inspected through review-six-current-crops.png and individual originals; both short-loss images were inspected. Local scrolling is necessary, not a claim that all content fits at once. |
| Current checks and artifact | compile-layout.log/lint-layout.log pass; tests-layout.log661/661, zero skipped. New wi013-package/pi-vscode-wi016-review-layout.vsix has14085 entries, extracted pinned public RPC readiness/gate handshake and Webview assets verification pass. layout-artifact-hashes/layout-build-hashes match all six current executables/assets. |

Post-fix run-guard-layout, run-lifecycle-layout, run-fault-layout and run-visual-layout logs pass in both domains; the last also repeats history/readonly/source-change/delete. The current deterministic suite covers bounds, unsafe capture, overlap, late results, host view disposal/new identity and watcher/provider cleanup. Real Reload Webviews proves renderer recreation, not separately an actual host onDidDispose/new view. Deterministic races and capacity cases are not mislabeled as actual provider faults. Session-switch acceptance is additionally owned by WI-017.

## Diagnosed defect and minimal correction

The first short runtime-loss probe passed viewport-only geometry but visual inspection exposed ancestor clipping. At304px native height, operations had only17.125px: one fragment of the loss notice. The retained loss-clipping-red/ regression intersects every scrolling/clipping ancestor and requires at least two complete lines; it failed before correction. candidate.css now applies the existing compact context/textarea budget when a review exists without an approval. No error message or host state was removed. Native green exposes50.578px and all three notice lines with the draft still visible; installed passes the same assertion in the new package. The executable regression/harness is retained with the real-host evidence, not claimed as jsdom layout coverage.

Other retained automation failures: Workspace Trust modal intercept; NBSP in Monaco text; short approval intentionally collapsing review; native diff container preceding text rendering. Harness corrections use actual close/reopen actions, literal normalization and bounded expected-text waits. They neither force hidden clicks nor relax acceptance. Earlier reports and failure screenshots are retained separately.

## Limits, cleanup and closeout

Coverage is identifiable controlled built-in write/edit, not shell/custom tools/all concurrent writers. The final dirty check and write are not an atomic lock. Captures remain bounded (256KiB per text image,8MiB retained,128 metadata entries); unavailable/overlap/observation limits stay explicit. No per-hunk decision, automatic Save, rollback, Git reset/stash, universal task attribution or cross-runtime snapshot persistence is introduced.

Each run closed owned Code/provider and used owner End→matching terminal receipt→Recover→empty. final-process-audit.json found no process in either owned root. Retain these two roots and the new package for unique reports/scripts/images/failures, isolated profiles and synthetic fixtures until evidence is preserved/retention ends and no process depends on them. Shared official portable Code at D:/Users/hex4c59/Temp/pi-vscode-delegated-f5-1.105.1-20260928 remains needed by later native matrices; do not remove it during WI-016 cleanup. No worktree was created. No user install/session, credentials, paid model or adjacent repository was used.

Scoped semantic review updates PRD traceability, archive indexes and ACTIVE. docs:verify/docs:health and diff checks are recorded in this WI's evidence root. Broader stale cross-WI traceability is retained for the authorized WI-010 reconciliation, not silently treated as accepted. HEAD remains59dbb09; index empty, pre-existing edits preserved, no commit/push/publication.
