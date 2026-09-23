# Goal session-continuity checkpoint — WI-017

English | [中文](2026-09-23-goal-session-handoff.zh.md)

- Type: Reference
- Status: Historical checkpoint
- Recorded: 2026-09-23 UTC
- Authority: historical scope and executable evidence only
- Replacement: [ACTIVE](../../ACTIVE.md) owns the paused current-work entry, remaining scope and pending acceptance.

## Why archived

WI-017 code and executable verification are complete. On September 23, 2026 the maintainer asked to pause implementation and finish documentation only; no next WI has started. This replaces its interim handoff, **not formal WI, PRD, ADR, gate or maintainer experience acceptance**. Current behavior and boundaries remain in the [PRD](../product-requirements.md), [architecture](../architecture/vscode-extension-architecture.md) and [message contract](../reference/webview-messages.md).

## Approved scope and boundaries

The maintainer's 2026-09-22 UTC Goal authorized REQ-008 and dependent REQ-004/005/006 lifecycle work after WI-016 executable delivery. T017-01 provides native pi persistence, current-project listing and New. T017-02 restores a selected saved conversation after native confirmation that its other entry point is closed, settled Stop and current draft revision checks. T017-03 projects anchored history in 32-row pages and 8192-UTF-16-unit literal preview chunks, including verifiable retained original attachment text.

The host owns validation, confirmation, cancellation and generation. The adapter uses declared pi 0.86.1 public SessionManager APIs in a bounded helper and public RPC for the agent. No session-file-format parsing, alternate persistence, copied agent loop, historical extension auto-loading or cross-project selection is introduced. Confirmation is not an exclusive lock. Restoring replaces temporary approvals/grants, review captures, attachment state and pending model settings; it does not roll back file effects. Unsupported historical content is explicit, hidden custom entries are omitted, and missing original text is not reconstructed from current files.

## Executable checks and review

Evidence root: `dist/goal-evidence-20260923/wi017-t01/` (repository-owned ignored output, not another task ledger).

- `compile-integrated-final.log` and `lint-integrated-final.log` passed; `tests-integrated-final.log`: **308/308 passed, zero failures/skips**. Standard-entry public seams cover backend bounds/cancellation/identity, runtime startup, host handoff/Stop/draft/view scheduling, literal history and mounted client behavior.
- Two-axis follow-ups have zero unresolved findings in `review-final.json`. Fixes include actual helper settlement (not unresolved modal settlement), listing cancellation on view loss, exact host-owned preparation cancellation revisions, stale attachment notices, drive-letter-only Windows path normalization and Windows CI tests. Parent integration added blocked-read, recreated-view-read and queue/barrier-cycle regressions. A partial worker patch was completed by the parent, not treated as independent completion.
- RED/GREEN logs retain regressions. CI now specifies Windows/Ubuntu; no remote CI run is claimed. Concurrent runtime-spike maintenance's earlier two picker failures are superseded by the integrated 308-pass run, not hidden or skipped.
- `adapter-session-integration.json` uses genuine SDK/production-helper/RPC. `terminal-session-integration.json` uses genuine terminal **CLI print mode**, not TUI: one synthetic loopback model request creates a saved session, then the production backend lists/resumes it without replay. Long-history anchors survive append and retain original historical attachment text.

## Layered UI and installed evidence

Native runs use Windows Node 24.12.0, declared pi 0.86.1 and isolated dummy profiles. Synthetic loopback responses are **not real-model evidence**.

- Browser-only `browser-sessions.json`: three themes × 280/360/600px, short viewport, keyboard chunk navigation, literal HTML and reachable composer. Synthetic preview is not native confirmation evidence.
- Direct development host: `native/dev-*.json`, not F5.
- Actual F5: `native/f5-launch.json` records key-triggered parent/child. Under `native/`, `f5-final-client-handoff.json`, `f5-history-matrix.json` and `f5-active-stop-handoff.json` cover Cancel preserving draft, committed New/Restore clearing draft, three history pages/seven original-text chunks, renderer replacement retaining draft/history, no replay and active-stream shutdown before New.
- Ordinary installed VSIX: under `native/`, `installed-final-client-handoff.json`, `installed-history-matrix.json`, `installed-active-stop-handoff.json`, `installed-runtime-loss.json` and `installed-grant-reset.json` cover the same handoff/history plus owned-runtime crash, preserved unsent draft/no replay, a genuine approval-gated write, fresh grants after New and cancelled pending approval. Completed file effects remain.
- Final README-only repack was installed and started again: `native/installed-final-package-smoke.json` proves ordinary installed activation, real runtime, terminal-created catalog entry, production asset URLs and identical executable hashes to the fully exercised candidate.
- Earlier automation failures/timeouts remain in logs. A native-confirmation timeout was followed by a successful focused rerun; no root cause is claimed. Earlier F5 code134 workaround evidence remains separate, not a proven product fix.

## Documentation closeout

At the maintainer-requested pause, docs:verify and docs:health passed: zero errors, four existing Draft ADR warnings, no translation errors/stale notices. Scoped documentation diff checking passed. Whole-worktree diff checking still reports a pre-existing extra blank line at EOF in src/extension/piChatViewProvider.ts:926; source was left untouched during this documentation-only closeout. The closeout did not rerun code builds/tests. Logs: `docs-closeout.log`, `docs-health-closeout.json`, `docs-diff-closeout.log`, `worktree-diff-closeout.log`. Concurrent UI preview planning was preserved; its earlier missing-translation-metadata check failure is now resolved by this archive pair. The Goal remains incomplete, and no WI-018 implementation was started.

## Final package

`pi-vscode-wi017-final.vsix`: **146,608,296 bytes / 14,083 entries**, SHA-256 **952535225a3b470fb5576823c6ff93169353aa2a9f62302fc9650e124ea241e2**. `package-final.log`, `package-assets-final.log`, `install.log` and `package-content.json` establish packaging, assets, isolated installation and exact local/archive/installed host, gate, session-helper, Webview JS/CSS identity. Manifest comparison excludes installer metadata. Packaged README wording was checked after VSCE link rewriting. Source, evidence and private material are excluded; no preview server is required. Older VSIXs are intermediate evidence, not the current package. Nothing was published.

## Cleanup, retention and manual acceptance

`cleanup-final.json` at 2026-09-23T02:50:21Z records the final 12 owned processes gone, six ports free, no remaining owned pi RPC and restored Goal-owned model/settings/server configuration. It links separate development, browser, F5 and installed cleanup records. Ownership was checked using command line and creation time. Isolated launcher configuration and result fixture were restored; repository launch configuration was not changed. No worktree was created.

Retain `dist/goal-evidence-20260923/` (logs, packages, isolated profiles/workspace and synthetic SDK/CLI sessions) and `dist/session-integration-adapter.cjs` until maintainer acceptance or retention ends and unique evidence is preserved. No test services remain live. No credentials, paid models, sibling changes, staging or commits were used.

Maintainer experience acceptance still needs narrow-sidebar/keyboard catalog and long-history navigation; Cancel/New/Restore draft behavior; other-entry-exit disclosure; approval/grant reset and failure recovery. Gates/ADRs are unchanged. REQ-004 execution states, remaining REQ-001/002/005 failure matrices and trusted-extension REQ-006/009 work still prevent overall Goal completion; they are not relabeled as manual acceptance.
