# WI-017 — Saved-session continuity acceptance

English | [中文](2026-09-28-wi-017-session-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: scoped delegated acceptance; ACTIVE owns remaining boundary work

## Decision and approved scope

On September 28, 2026 Asia/Shanghai, the agent completed evaluation under the maintainer's explicit delegation and accepts WI-017 T017-01–03. This replaces the completed current proposal and pending-experience condition of the [September23 checkpoint](2026-09-23-goal-session-handoff.md), not its historical results. It is not personal maintainer inspection. WI-010 wider boundary disposition, broad gates and the entire Draft PRD remain separate.

Retain the public pi SessionManager short-lived helper, public agent RPC, host-owned native confirmation/Stop/identity and opaque UI capabilities. Catalogue16/page, anchored restored history32 rows and literal8192-UTF16-unit chunks remain the simplest bounded presentation; they do not redefine the model's context. New/Restore is deliberate sequential handoff, not an exclusive lock. Cancel and precommit failures preserve the old session/draft; committed switches stop the old task, reset temporary grants/review/attachment state and start controlled. Historical extensions are not automatically loaded, and restoring dialogue does not restore code.

Root review covered the backend/worker bounds and SDK use, history projection/preview, host handoff settlement/revision checks, profile reset, mounted history/catalogue, and existing public-seam tests. It is not an independent whole-repository review. No SDK/private-storage replacement, new architectural layer or new persistence was introduced; broader boundary ADR disposition remains WI-010.

## Evidence matrix

Roots: dist/delegated-completion-20260928/wi017-installed/ and wi017-native/. installed/EVIDENCE.md owns detailed command/failure/cleanup accounting. Both use pinned public pi0.86.1, isolated secret-free HOME/profiles/projects and localhost synthetic responses. Installed is official Code1.139.1 with a real isolated CLI-installed package. Native is actual F5 using the unmodified official Code1.105.1 debugger and primary-sidebar fallback, not CLI development-host evidence.

| Scope | This run's actual evidence |
|---|---|
| Public persistence and catalogue | seed-sessions.mjs creates18 catalogue fixtures, long history and a genuinely executed terminal CLI --print session through public APIs. CLI exits before restoration; not a TUI claim. Public current-project listing excludes a separately owned foreign project. session-report verifies16-row catalogue, keyboard page2/return, native warning, Cancel/deliberate Restore and exact terminal-origin history without a replay request. |
| Bounded immutable history | session-report reads recent32, three backwards pages to the oldest retained question, seven literal chunks reconstructing51850 original UTF16 units. A different current file is not substituted; script-like text stays literal. Generic unavailable-extension/tool history, hidden custom-entry exclusion and synthetic sensitive-detail redaction are checked. Close returns preview-trigger focus and preserves draft. New Cancel preserves restored history/draft; confirmed New clears current projections without deleting saved sessions. |
| Stop, settlement and fresh permission | lifecycle-report tracks actual owned supervisor/direct RPC PIDs, including Code.exe as Node. Active-stream New Cancel retains child/draft; confirmed New observes stream closure and old RPC exit before accepting replacement. New and Restore each require fresh covered-tool approval. Stop of pending restored approval preserves newer draft and existing file effects. Actual child loss and separate receipt-based Recover do not replay tasks. |
| Real availability failure/recovery | missing-report lists a public-SDK-created unused fixture, temporarily makes its exact opaque file unavailable, then receives a native no-switch error while old runtime/draft remain. Finally restores original filename/bytes; UI Refresh and deliberate Restore recover original history without replay. This is isolated availability fault injection, not product session-file parsing/writing. |
| Default profile and historical capabilities | Both run-trusted-green logs load an explicit local public-extension fixture with native consent and real load counter, persist a deliberate turn, then prove New default reset, restoration of that formerly trusted conversation without reloading its extension, and Restore directly from trusted to controlled. Fresh covered-tool approval and Stop work. Marker counts corroborate the actual profile projection. |
| Renderer recreation | Both run-reload logs: Developer: Reload Webviews preserves the host-retained second history page and acknowledged draft without replay; reloading during one deliberate restored stream retains that task/draft and Stop settles it without an extra request. This is renderer recreation, not a separately asserted native host onDidDispose/new-view event. |
| Actual visual/keyboard | Both fixed-build visual matrices cover three actual bundled themes ×zh-CN/en, catalogue keyboard/Escape trigger return, historical literal Ctrl+End scrolling/Close focus, draft/input visibility and no document horizontal overflow. Installed289×506 and native299×320. All24 catalogue/history originals reviewed through regenerated named contact sheets plus originals. Very short native views require local scrolling; static screenshots alone do not prove state transitions. |

Both core/lifecycle/missing/visual matrices were rerun after the repair on the663 tree/new package, recorded in run-*-profile-reset.log. Earlier661 results remain under pre-profile-fix-evidence/, not relabeled. Current deterministic tests additionally cover helper bounds/cancellation, stale identities/chunks, unavailable/unsupported projections and host view-loss races; these are not claimed as independently injected real-provider faults.

## Discovered bug and repair

Actual trusted→New reloaded the old extension. trusted-new-profile-red/ retains the load counter, screenshot and actual RPC command containing the trusted -e path after New. The host reused executionProfile across changeConversation. Two public host-seam tests reproduce New and Restore failures and check that Cancel/failed inspect preserve the old trusted runtime/draft.

At the successful handoff commit point only, the host now clears the trusted loading profile/display name/error and sets controlledExecution true before starting the replacement. A first partial correction still failed the projection assertion; that failure is retained. profile-reset-green.log passes663/663 with zero skipped; compile-profile-reset and lint-profile-reset pass. No accepted security rule or gate criterion was weakened.

New wi013-package/pi-vscode-wi017-profile-reset.vsix:14085 entries, pinned extracted public RPC readiness/gate handshake and Webview assets verifier pass; profile-reset-artifact-hashes matches six current/installed assets. Only the owned installation changed. Tests and real-host failures remain distinct: initial process observer wrongly assumed node.exe; immediate keyboard-scroll check preceded browser settlement; Windows PowerShell5 could not stat the301-character SDK-returned fixture path. The corrected exact-owned-parent observer, bounded scroll wait and verified PowerShell7 literal-path helper do not bypass application guards. The latter restores the file in finally and never accesses its format.

## Limits and closeout

No global cross-project discovery, concurrent driving/lock guarantee, live takeover, branching UI, historical code rollback, automatic extension installation/loading, historical UI execution or added attachment persistence is promised. Saved text availability comes from public pi history, not today's files. Existing controlled-tool/sandbox limits remain.

Each run closes owned Code/provider and performs End→matching terminal receipt→Recover→empty. final-process-audit.json finds no owned process and no held fault file. Retain both evidence roots, their public SDK/CLI fixtures/profiles/scripts/images/failures and the new package until unique evidence is preserved/retention ends and no process depends on them. The shared official portable Code path D:/Users/hex4c59/Temp/pi-vscode-delegated-f5-1.105.1-20260928 remains for later native matrices. No worktree, user secrets/paid model/adjacent writes or user installation/session changes.

Scoped PRD/architecture/contract/index/ACTIVE updates and docs:verify/docs:health/diff checks accompany closure; logs are in this evidence root. Broader stale cross-WI traceability is assigned to WI-010. No remote CI or other OS/fork run is claimed. HEAD59dbb09 and all prior edits preserved; no staging, commit, push or publication.
