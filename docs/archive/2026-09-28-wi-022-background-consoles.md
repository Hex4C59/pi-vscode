# WI-022 — Windows background console diagnosis

English | [中文](2026-09-28-wi-022-background-consoles.zh.md)

- Type: Discussion
- Status: Superseded
- Created: 2026-09-28
- Authority: diagnosis/evidence, not complete acceptance; [ACTIVE](../../ACTIVE.md) owns WI-022

> Historical archive: earlier investigation and custom-source deployment proposal are superseded by the profile-independent CLI --no-daemon launcher. This does not close the upstream bug. See the [current record](../discussions/2026-09-28-wi-022-background-consoles.md) and ACTIVE.

## Approval and scope

The maintainer asked to solve blank Windows terminals appearing/disappearing during agent tasks. This authorizes focused background-launch repairs and verification, not global Terminal settings, hiding other windows, changing user profiles/credentials, adjacent repositories or Git commits. Preserve the completed original Goal and existing edits. This is a new WI, not reopening the completed queue.

## Findings and predictions

Three launch boundaries were distinguished: direct repository subprocesses, nested tooling/test invocations, and the agent execution tool's outer PowerShell. Missing `windowsHide` predicts a visible console despite piped output. An unhidden parent predicts continued flashing after children are fixed. A usable PTY alternative would avoid this outer launch path; it must be tested rather than assumed.

The native A/B baseline reproduced the symptom. A default spawned PowerShell returned a nonzero console handle and `IsWindowVisible=true`; the same launch with `windowsHide:true` returned handle0/false. Output was still captured normally. Only process IDs, window handles and class names were recorded, never user window titles/content.

The outer execution-tool PowerShell itself also returned a nonzero visible console. Disabling login/profile processing did not change that. Two `tty:true` attempts failed before command execution with CreateProcessW error -1073283067; supplying a different shell did not change the executable shown in that error. These are observations of this tool/environment, not a universal claim about Codex or Windows PTY support. Repository flags cannot change the outer process creation. No unsupported configuration switch or global terminal workaround is proposed as a verified fix.

## Implemented repository repair

Added explicit `windowsHide:true` at21 omitted background launch sites across document Git queries, test/commit-check runners and their helpers, public-runtime probes, spike helpers and the direct RPC fallback. Existing production owned-runtime/session launches already hid their windows and were retained. Two pass-through test recorders preserve production options and assert the flag before spawning instead of silently forcing a passing value. No output/error suppression, shell interpolation, new process abstraction, SDK replacement, permission or cleanup-semantic change.

Regression coverage includes a source launch-policy inventory restricted to src/scripts (no symlinks, .local-env, node_modules or dist), existing public runner/checker seams, real read-only Git metadata queries including invalid-revision handling, and runtime/session launch options. The policy inventory is explicitly not native-window proof. It failed against the omitted sites before repair; the actual seams continue verifying outputs, failure status and controlled arguments.

## Actual verification and limits

All local evidence is under dist/wi022-hidden-process-20260928/:

- baseline-status.txt, baseline-head.txt and baseline.patch preserve the starting working tree; OWNERSHIP.txt explains this single ignored evidence root.
- visibility-baseline.json / console-probe.ps1: real Windows default-versus-hidden observation.
- launch-policy-red.log, launch-policy-green.log (intermediate remaining spread-helper defect), launch-policy-fixed-green.log: exact failing inventory, then22 focused tests passing.
- compile.log, lint.log, test.log: compile/lint pass;673 tests pass, zero skipped. The new two tests are collected by the existing runner.
- native-runtime-report.json: actual released pi0.86.1, isolated empty HOME/agent/tmp/workspace, public get_state succeeds and the probe observes bounded child exit. A hidden observer attaches only to the recorded owned RPC PID and finds handle0/visible=false. This is real runtime evidence, not a mocked process or an installed-VSIX/F5 claim.
- native-runtime-observer-assumption-failure.log and native-observer-failure-cleanup.json: first observer incorrectly assumed handle0 meant it had detached from every console; AttachConsole returned access denied. Corrected by explicitly detaching only the observer before inspecting the owned child. The failed probe's exact parent, CLI and esbuild service were identified and cleaned; failure was not relabeled as a pass. The corrected observation accepts successful attachment with no visible window or an authoritative no-console result, never generic access denial.
- outer-exec-no-login.json and executor-boundary.md: the external execution-shell problem persists independently. It is not fixed by child-process changes.

No F5/package matrix is claimed for this narrow automation-console repair; production owned-launch behavior was already hidden, and no UI surface was changed. The broader user symptom **is not yet fully resolved**: the execution tool must launch its outer shell without a visible console, or provide a functioning nonvisible execution transport. That implementation/configuration is outside this repository and not exposed as a working option by the available tool. Do not close WI-022 or claim every flash is eliminated merely because repository tests pass.

## Retention and next boundary

Keep this evidence root's unique baseline, failed/passing observations and synthetic fixtures until no longer needed or durably preserved; recheck exact process dependencies before removal. No user process was closed. Final process/check receipts are kept in the same root. No staging, commit or push. ACTIVE remains the sole task ledger; the next necessary fix is at the execution-tool outer launch boundary, not another round of identical repository retries or an alteration to global Windows Terminal preferences.

## Follow-up: process attribution and usable mitigation (2026-09-28)

The interrupted observer completed normally (PID7096). Its saved entry-window-monitor.json caught transient WindowsTerminal windows, but their service-parent chain alone did not identify the requesting client. No user process was stopped.

A bounded 20-second name/PID-only snapshot and window poll (process-window-trace.json) found the two persistent OpenConsole processes, PID6460 and PID20708, parented by Code.exe PID15132. These are distinct from the controlled flash; the screenshot alone does not identify exact instances. Idle polling saw no visible terminal windows. Polling can miss short-lived processes and does not inspect titles, command lines or secrets.

The controlled-exec-trace.json comparison invoked one harmless ordinary exec command: at09:49:00 UTC, codex.exe PID12964 created pwsh.exe PID22720, which created conhost.exe PID22920. New OpenConsole/WindowsTerminal processes appeared in the same interval; a visible WindowsTerminal window (PID22696) and PseudoConsoleWindow owned by PID22720 were observed. Service-parented WindowsTerminal is correlated by timing, not falsely presented as a direct codex child. Together with the earlier own-console probe, this reproduces the ordinary execution-path flash, not every possible message-submit trigger.

A working alternative is now available: mcp__node_repl directly reads files and calls child_process.execFile with windowsHide:true. node-repl-hidden-entry.json records five launches with own console handle0/visiblefalse and preserved stdout, stderr and exit7. One trial also saw unrelated transient windows, so this does not prove global silence. AGENTS now records the alternative for this repository, subject to the same permissions and safety rules; do not use another tool to bypass a denial. This supersedes the earlier statement that no usable nonvisible transport exists, but does not repair the client's ordinary launcher. WI-022 remains open for complete message-submit/client-level acceptance. No user-terminal settings or installations were changed.

## New causal lead: earlier terminal repair

The user reports that flashing began only after Codex repaired a previously non-opening VS Code terminal. This is a causal lead, not proof of a specific changed setting. Normal OpenConsole ownership does not exclude a repair-induced launch regression. The two running hosts resolve to the VS Code installation’s node-pty/build/Release/conpty/OpenConsole.exe. Allowlisted checks of known settings files found defaultProfile.windows=PowerShell in the C-drive user settings, but no evidence that this setting was changed by that repair. Current-user Console ForceV2 is1 and the checked delegation values were absent; there is no before-state to justify resetting them. No user settings, registry values or installation files were changed. Retrieval of prior Codex task history failed because its localhost MCP transport was unavailable. Identifying the earlier repair task or its change summary is needed for a targeted rollback; do not substitute killing healthy terminal hosts or blindly resetting configuration.

## Isolated terminal comparison (2026-09-28)

User authorized a clean-profile comparison without resetting the existing installation/settings. Evidence and ownership are in dist/wi022-hidden-process-20260928/isolated-terminal-comparison/. The actual installed VS Code1.139.1 ran eight isolated cases using a local probe extension, empty extension directory, synthetic HOME/appdata/workspace, offline preferences and NoProfile shells. Every case executed a marker-writing command, observed its exact readback, closed the terminal with exit0, and quit the owned Code instance with exit0. The final audit excludes the observer itself and finds no remaining owned hosts/monitors. Profiles and unique evidence remain retained, with cleanup conditions in OWNERSHIP.txt.

The first API cases demonstrated working terminals but did not establish selected-profile resolution: createTerminal with shellArgs fell back to powershell.exe. Follow-up workbench.action.terminal.new cases establish actual profile behavior. A same-name PowerShell user definition was merged with the default source=PowerShell despite its custom path, and launched powershell.exe in repeated tests. A uniquely named profile resolved to the specified D:/APP/base/PowerShell/7/pwsh.exe; explicit shellPath independently did too. Both worked. Thus clean settings do not necessarily break the terminal, and the profile label/path alone cannot establish which executable ran. This isolated mismatch is not evidence of who made the earlier repair, nor proof of the Codex flash root cause.

One initial selected case captured conda.exe parented by the test terminal PowerShell and a corresponding visible console; subsequent same-name and unique-profile UI runs captured no visible terminal windows or conda child. Keep this intermittent observation, not a universal causal claim. Window polling has gaps; no user shell scripts, credentials or user terminal state were examined. No existing user settings, registry entries or installation binaries were changed. The independently reproduced Codex ordinary-exec flash remains unresolved; WI-022 is not closed.

## User-requested switch away from OpenConsole (2026-09-28)

The user explicitly requested that newly opened VS Code terminals not create OpenConsole.exe. This is distinct from eliminating every Codex command-launch flash. The installed VS Code1.139.1 setting definition and bundled message identify terminal.integrated.windowsUseConptyDll (default true) as selecting bundled versus Windows conpty.dll. In isolated ui-system-conpty with the value false, the real New Terminal command launched pwsh.exe and system conhost.exe, no owned OpenConsole.exe was sampled, no visible terminal window was observed, the synthetic command readback succeeded, and terminal/owned Code exited0. Evidence: isolated-terminal-comparison/system-conpty-acceptance.json and accompanying trace/report. Polling cannot prove absence of arbitrarily short processes.

Following that pass, changed only terminal.integrated.windowsUseConptyDll to false in C:/Users/hex4c59/AppData/Roaming/Code/User/settings.json under this explicit request. Parsed equality excluding this key and exact file readback verified no unrelated setting changes; comments/format were preserved by a targeted text insertion. The key was previously absent. user-system-conpty-setting-change.json records hashes and key-only rollback (remove the added key), not a copy of private user settings. No registry changes, executable deletion, profile renaming or user-process termination. Existing live terminals keep their existing hosts; no claim that their OpenConsole processes disappear immediately or that the active user window was reloaded/validated. New terminals should use the new setting; if the existing pty host caches it, a user-controlled restart after saving work is needed. The original Codex outer-launch flash remains separately open.

## Codex daemon launch isolation: decisive A/B (2026-09-28)

Local CLI evidence identifies the running managed binary as0.157.1. Official documentation transport was unavailable; the local fallback skill permits exact-version CLI and commit-pinned official Git source. Fetched openai/codex tag rust-v0.157.1 at ac0e23e5232692b95268583c8278c50b8c436d2b into the owned sparse reference codex-source-reference (no user repo/history changes). The latest stable tag observed was0.158.0 at54e1bd264b4122fe9471ee7d54c4d021a76bb8ff; its pipe implementation still lacks a Windows hide flag, so an upgrade is not accepted as a fix. Initial source API retrieval was rate-limited; only subsequent Git-object content was used.

The owned codex-launch-repro uses an empty CODEX_HOME and public command/exec, no thread, model, credentials or paid calls. With the actual0.157.1 app-server started using windowsHide:true and not detached, the probe reports handle0/visiblefalse; the same server/command/environment with detached:true reports a nonzero visible console and WindowsTerminal window. Both exit0. A portable PowerShell PTY also succeeds invisibly. Both owned servers exited0. This corrects any inference that the missing pipe flag alone guarantees a flash regardless of parent state. Source pid_start.rs explicitly uses DETACHED_PROCESS | CREATE_BREAKAWAY_FROM_JOB, which matches the failing launch condition.

A durable repair must preserve managed-daemon job breakaway, identity, updater, socket and reconnect semantics while preventing visible consoles; the isolated hidden stdio server is not such a replacement. No Codex installation/service configuration was modified, and no user daemon was stopped. Deployment requires a scoped repair of the shared Codex launch component and a maintenance restart, which can interrupt this and other sessions. Request consent for that interruption instead of silently killing the service. The existing VS Code setting is unrelated and remains as explicitly requested. WI-022 stays open. Evidence/provenance/owned exits: codex-detached-root-cause.json, codex-launch-repro/, codex-source-reference/OWNERSHIP.txt; retain unique evidence and source until no longer needed, then check exact dependencies before removal.
