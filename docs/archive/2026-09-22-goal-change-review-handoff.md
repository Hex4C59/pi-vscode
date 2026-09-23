# Goal change-review checkpoint — WI-016

English | [中文](2026-09-22-goal-change-review-handoff.zh.md)

- Type: Reference
- Status: Historical checkpoint
- Recorded: 2026-09-22 UTC
- Authority: historical scope and executable evidence only
- Replacement: [ACTIVE](../../ACTIVE.md) owns the next serial Goal slice and pending acceptance.

## Why archived

The Goal-authorized dirty-editor protection and already-applied review code/executable checks are complete and replaced as the current Build by session-continuity work. This is **not formal WI, PRD, ADR, gate or maintainer experience acceptance**. The [PRD](../product-requirements.md), [architecture](../architecture/vscode-extension-architecture.md) and [message contract](../reference/webview-messages.md) retain current requirements and ownership.

## Approved scope

WI-016 covers REQ-007 and dependent REQ-005/006 lifecycle/policy. T016-01 blocks identifiable built-in write/edit targets with unsaved editor changes, including changes during approval and grant reuse; it never saves buffers. T016-02 captures reliable before/after text in host memory and opens readonly native diffs/current source. It distinguishes tool reports from workspace observations and discloses overlap, capture limits and runtime loss.

Only public pi 0.86.1 hooks/RPC are used. No copied agent loop, session-file parsing, secret-bearing Webview bridge, arbitrary filesystem/command capability, patch approval, rollback, Git reset/stash, full-disk monitoring or cross-runtime snapshot persistence is added. A public pre-execution hook is not an atomic editor/write lock; opaque shell/extension writes and concurrency prevent complete task attribution.

## T016-01 checkpoint

Repository-owned ignored evidence: `dist/goal-evidence-20260923/wi016-t01/`. Fixed file baseline and red/green logs preserve the local comparison without prohibited Git operations. Tests 210/210, zero skipped; compile/typecheck, lint, docs and diff passed; Standards/Spec findings fixed. Actual F5 and ordinary installed VSIX used genuine pi plus a synthetic loopback provider for dirty buffers, edits during approval, clean/dirty grants, write/edit, recovery and Stop drafts—not a real-model claim.

T01 final VSIX: SHA-256 `e43c64e5f45a6b11627413ede0c3e58be1f3a727a68217a99f33e46356e4ceb9`, 146,585,023 bytes / 14,082 entries. It is now an older checkpoint; the earlier non-final T01 package is only intermediate. Cleanup recorded 35 owned processes gone, six ports free and restored launch/fixtures.

## T016-02 checkpoint

Evidence: `dist/goal-evidence-20260923/wi016-t02/`.

- `tests-final.log`: 229/229, zero skipped; `compile-final.log` / `lint-final.log` passed. Host 14/14 and adapter 1/1 cover exact pairs, failed partial effects, unsafe/oversize refusal, no-eviction retention, lifecycle invalidation and completion beyond activity-display limits.
- Independent initial Standards/Spec review found unbounded watcher work, duplicate native opens, retained denied preflight captures and missed preflight overlap. Red/green fixes bound/coalesce work, single-flight opens, discard denied captures and preserve overlap intervals. Follow-up `host-review.json` and UI review have no unresolved findings.
- Full integration exposed a bad null-path test fixture and DTO expectation; jsdom assertion reporting exhausted an allocation. The test was fixed, not skipped. Actual-host runtime loss exposed a hidden loss notice; the UI correction has mounted and native verification.
- `browser-evidence.json`: synthetic browser only; three themes × 280/360/600px, 480px short viewport, 16-row paging, streaming focus/page/draft retention. Not native/pi evidence.
- `f5-evidence.json`: actual F5, readonly text/typing refusal, historical/current/deleted source, failed edit, observation, Stop draft, renderer reload and runtime loss. Initial F5 exited code134; retry succeeded with the installed debugger network-view option disabled in temporary owned settings. This is a workaround observation, not a proven root cause. Reload Webviews retains the provider; host tests separately cover new-view identity rejection.
- `installed-evidence.json`: ordinary isolated installed profile, no development path; genuine packaged pi/synthetic provider; readonly review, 18 actual write operations/page stability beyond 16, current/deleted source, failed edit, pending-approval Stop, renderer reload and visible runtime loss.
- `pi-vscode-t01602.vsix`: SHA-256 `f2d04b598453dfc522601ba1b21085e02201f9030b3f3b89ac276ad035b268ca`, 146,590,937 bytes / 14,082 entries. `package-content.json` / `package-assets.log` establish current local/archive/installed host, gate and Webview identity. Manifest matches excluding installer metadata; packaged README is current; preview/evidence/secrets are absent. No preview server is required.
- `cleanup.json`: 38 recorded owned processes gone; six ports free; launch/debug settings and result fixture restored; new observation fixture removed. No user credentials, paid model, sibling edits, Git index/commit/history operation or publication.

## Retained conditions

Retain the Goal evidence root/profiles/install plus older `dist/wi015-evidence/`, `dist/component-check/` and `D:/DevCaches/pi-vscode-ui-20260922` until maintainer acceptance/retention ends and unique evidence is preserved. No worktree was created. Underlying filesystem reads are not abortable after their response deadline; eventual handle cleanup and epoch checks prevent late replacement-state mutation.

Maintainer acceptance remains for narrow-sidebar/keyboard experience, dirty recovery and review/loss wording, ADR 0003 and open gates. Session continuity and other explicit REQ-001–009 gaps remain required, not manual-only acceptance. [ACTIVE](../../ACTIVE.md) remains the sole current entry.
