# WI-009 — Thinking selection acceptance

English | [中文](2026-09-28-wi-009-thinking-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: historical scoped delegated acceptance; ACTIVE owns remaining work

## Decision and acceptance

On September 28, 2026 Asia/Shanghai, the agent completed evaluation under the maintainer's explicit delegation and closes WI-009. This is not personal maintainer inspection. The approved thinking slice of REQ-002/004 is accepted, not the entire Draft PRD or the broad gates. WI-014/016/017 and WI-010 boundary/gate disposition remain separate.

Retain public pi thinking capabilities and mutation/readback, host-owned applied values and next-turn intent, model-first capability refresh, and the already accepted formal slider design. Pointer motion previews continuously; release submits a supported discrete level. Keyboard changes remain discrete. No provider logic, global defaults persistence, session-file access or new authentication surface was added.

The root review matched ModelSettings, runtime projection, shared component focus/preview ownership and registered regression tests to the approved acceptance. No remaining scoped implementation defect was found. This is a root review, not an independent whole-repository review. Failed mutation/readback, stale generation/session, view recreation, queued clearing and late completion are covered by deterministic tests; do not present injected races as independent real-provider fault evidence.

## Evidence and version boundaries

Paths below are under dist/delegated-completion-20260928/. Commands, failures and detailed provenance are retained in wi009-installed/EVIDENCE.md and the corresponding wi009-native files.

| Scope | Actual evidence and limits |
|---|---|
| Current checks | compile-visual.log, lint-visual-final.log, tests-visual-final.log: compile/lint and 660/660 tests pass, zero skipped. Both focus and duplicate-error regressions have retained red/green evidence. |
| Core thinking, 659 tree | Installed matrix-report.json/run-matrix.log and native report.json/run.log: two consecutive keyboard changes without refocusing; draft retained; Escape returns trigger; actual pointer preview does not change applied value until release. Provider parameters confirm medium/high. Streaming off→high→medium is latest-wins pending, current request remains high, Stop preserves draft and deliberate next request uses medium. Model change to nonreasoning plain refreshes off-only capabilities, explicitly rejects pending high, disables range and omits reasoning_effort from the actual next request. |
| Approval and actual loss, 659 tree | Each root's fault-report.json/run-faults.log: Deny continues the current medium request without applying pending high early; approval Stop cancels unapproved write and applies medium only for the next request. Actual owned-child End clears pending high, keeps draft, requires separate recovery and never replays. Provider readback and absence of result.txt support the assertions. |
| Stable presentation, 660 tree | Each root's visual-report.json/run-visual.log: actual short native window, three host themes × two UI locales, unsupported model/error, disabled range, menu geometry, retained draft and Escape. Six installed images individually viewed. Official native F5's primary-sidebar fallback is shorter; complete error is reached by actual scrolling, with geometry assertions and six -error-scroll images inspected in the pi contact sheet. English host diagnostic text remains literal in Chinese presentation; no complete diagnostic-localization claim. |
| Package | wi013-package/pi-vscode-wi009-visual.vsix; package-visual.log verifies 14085 entries and extracted RPC readiness/private gate handshake. 660-artifact-hashes.json matches six installed production assets. |
| Lifecycle | Both roots explicitly End the retained owned child, observe matching terminal receipt and recover after each run. Latest final-process-audit.json files are empty. Host/provider cleanup is separate from actual child ownership cleanup. |

Actual native F5 uses official unmodified Code1.105.1 and its Debug Start/F5 launch, not CLI development-host substitution. Installed Code1.139.1 uses an isolated profile and a real VSIX. All requests use clean isolated configuration and the localhost synthetic provider with pi0.86.1. Tests, runtime requests, native F5, installed package and screenshots are distinct evidence layers. The 659 core/fault matrices are not relabeled as full660 reruns: the only subsequent production change removes duplicate error placement while the menu is open, with current regression and new native/installed visual evidence.

## Defects, failures and tradeoffs

- First actual thinking keyboard application disabled the range and Chromium blurred it to BODY. Restore only the control owning that application; respect a newer draft focus, and redirect Escape to the trigger. Streaming selections do not take delayed focus ownership.
- At installed Webview289×506, duplicated outside/inside error text pushed the Chinese popover top to -5.4375px. Keep one visible error in the open popover and restore outside error on close. This preserves error visibility without broad layout redesign. Current geometry is within the viewport.
- Preserve initial closed-label observation failure, original focus failure, visual clipping samples and native resize/profile-theme probe failures. Fix observation by using the visible applied trigger, identify the exact development window, and choose bundled themes through the actual native picker. Failed probes are not product passes. The first native contact sheet accidentally cropped built-in Chat; it is explicitly not pi evidence, and the corrected pi contact sheet retains the real fallback view.
- An existing mounted-model test required duplicate outside error visibility while the menu was open. Its replacement explicitly asserts the open popover contains the same error; error checks were not removed to manufacture a pass.

## Superseded proposal and handoff

The former ACTIVE proposal scoped idle thinking changes, latest-wins deferred intent, refreshed model capability/unsupported-level failure, approval/Stop interleavings, runtime-loss clearing, continuous preview/discrete release, keyboard/focus and narrow/short themes/locales. Verification required actual localhost request parameters, public RPC projection, separate native F5 and installed evidence, red/green fixes and documentation checks. Those conditions are now met for this slice. The intermediate 659 handoff's missing approval/loss and stable-layout evidence is superseded by the records above.

No provider/agent-loop reimplementation, secrets, paid models, global default persistence, unrelated scope or broad gate closure is included. The remaining attachment, review, session and cross-cutting boundary work stays in [ACTIVE](../../ACTIVE.md).

## Retention and close checks

Keep wi009-installed/, wi009-native/ and the named WI009 packages as agent-owned unique pass/failure evidence, clean profiles and reproducibility helpers. No process currently depends on them. Cleanup requires preserving unique evidence and confirming no dependent process; never delete by directory name. The shared official F5 host path and its cleanup conditions remain in the WI-021 acceptance record. No Git staging, commit, push, merge or publication occurred. Closure runs docs:verify, docs:health and diff-check; records remain with the WI009 evidence rather than becoming a second task ledger.
