# WI-013 — Trusted loading, standard interactions and recovery acceptance

English | [中文](2026-09-28-wi-013-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: scoped delegated acceptance and evidence; [ACTIVE](../../ACTIVE.md) owns remaining work

## Acceptance and approved scope

On September 28, 2026 Asia/Shanghai, the agent completed evaluation under the maintainer's explicit decision/acceptance delegation and closes WI-013. This is not personal maintainer inspection. Accept [ADR 0002](../decisions/0002-interaction-contract-route.md)'s bounded trusted-loading, standard-interaction and owned-runtime recovery decision. The full Draft PRD and broader Webview/project-trust/session-streaming gates are not automatically accepted; WI-008/009/014/016/017 and WI-010's broader boundary disposition remain explicit remaining work.

Approved REQ-006/009 slice: one explicitly picked local extension entry with native trust consent; controlled default and separate resource/tool consent; pinned pi 0.86.1 public CLI/RPC; reviewed MIT pi-system-prompt-manager 0.1.1 at commit 9c8f546b875f929ad5d573fe30e7a7fd6e3ae924; select/confirm/input/editor and bounded literal feedback; known custom-tool per-call approval; finite queue/replay/transport budgets; distinct command-handler/agent/dialog obligations; honest Stop-unconfirmed and separately confirmed End/controlled recovery across renderer/host loss. Exact DTOs and numeric policy have one authority in the message contract/ADR.

## Evidence audit

All paths below are under dist/delegated-completion-20260928/ unless stated otherwise. Passing automated checks do not replace the separate actual-host rows.

| Requirement | Executed evidence and conclusion |
|---|---|
| Build, types, lint, deterministic behavior | wi013-recovery-tests/compile-custom-layout.log, lint-custom-layout.log, tests-custom-layout.log: final integration passes all 646 tests, no skips. Includes exact DTOs, stale/repeated replies, overflow/identity budgets, bounded feedback/writes, startup failures, late launch, one absolute Stop deadline, empty-session checkpoint, ownership/store failures and cleanup. |
| Real third-party target and public outcomes | wi013-real-target/ and wi013-owned-adapter/ pin provenance/license and exercise unmodified target/public RPC. Native/installed reports below additionally perform all four forms, editor readback, both confirmations, cancellation continuation and Stop. |
| Actual runtime failures and literal replies | wi013-real-dialog-faults/report.json: handler throw and pending-form extension_error retain ownership until explicit End; three registered-command paths prove automatic cancellation, 17-second human wait and exact synthetic literal answer delivery. late-launch-report.json proves a cancelled real launch remains detached and does not auto-End. Unsupported awaited-startup results remain separately preserved, not counted as passes. |
| Custom tools through real pi | wi013-custom-tool-probe/attempt2/: exactly eight selected built-ins plus known custom tool; Deny executes zero, Allow once executes once, identical repeated Deny leaves total one. Original --tools filtering failure is in attempt1. No gate protection was weakened. |
| Actual native F5 | wi013-native-review/f5-report.json: official unmodified Code 1.105.1 debugger, native F5, fresh-empty profile switches, real-target four-form/Stop/End/recovery, custom-tool native UI Deny/once/Deny. The 646 presentation correction is separately verified by f5-layout-report.json, including visible literal-input bounds and execution readback. Not CLI-development-host substitution. |
| Installed package | wi013-installed-review/installed-visual-report.json: Code 1.139.1, independently installed package, full target/recovery/custom-approval flows. installed-layout-report.json binds the final 646 presentation correction to actual 1100×620, readable complete fixed input and reachable decisions; three themes/two languages and keyboard/model-setting checks pass. 646-artifact-hashes.json matches current build; pi-vscode-wi013-custom-layout.vsix asset verification passes. |
| Visual/interaction evaluation | The agent captured and viewed screenshots, including narrow/short forms, English/Chinese/light/dark/high contrast, oversized-answer editing/cancellation, corrected refocus, custom approval warning/input/actions and recovery draft. Exact sample scopes are in the reports; screenshots alone do not prove delivery, persistence or exit. |
| Renderer/whole-host recovery | wi013-installed/renderer-recreation-report.json and host-reopen-report.json: actual Reload Webviews replaces frame and restores the outstanding form; whole-host reopening sees unresolved owner, requires native End, observed exit and separate controlled recovery/resource choice. No automatic replay or silent regrant. These earlier-version reports cover unchanged seams, not later presentation corrections. |
| Shared-domain concurrent windows | wi013-multiwindow/report.json: second simultaneous owned workspace/window cannot admit a runtime; exact run/host/child fence unchanged. Closing only that window leaves first usable for a new deliberate request, still on the same run. Not a continuous process-creation trace. archive-installed-hashes.json independently matches ten installed artifacts to its specified 645 archive. |
| Cleanup and package identity | Owned host/provider processes closed; explicit owner End, matching terminal receipt and separate retirement are recorded. Final exact-path audits are empty, including the custom provider listener. Package manifests/hashes distinguish 643/645/646 evidence instead of assigning old passes to newer code. |

## Decisions, failures and corrections

[Target investigation](../archive/2026-09-27-wi-013-target-research.md) preserves reproducible red/green failures and exact version scope. Independent Standards and Spec reviews found four distinct issues: late owned-launch reattachment, cumulative Stop deadlines, silently discarded literal answers and oversized replies disabling forms. All were reproduced and fixed. Actual tests additionally exposed unpersisted fresh-session resume, clipped focus/combined recovery layouts, custom-tool CLI filtering and cramped custom approval details; corrected assertions were rerun without weakening acceptance.

Fresh profile replacement uses public state/stats/state, not session-file access or unbounded history. Trusted launch omits the CLI built-in-only allowlist so public registered inventory can be gated; controlled retains exactly eight names. Custom warning and input share scrollable details, while decisions remain reachable. No synthetic production runtime or compatibility patch to pi was introduced.

## Exclusions and honest limits

Not arbitrary TUI rendering, universal extension compatibility, authenticated extension origin, remote exactly-once delivery, cancellation of detached code/descendants, rollback, a security sandbox, power-loss durability, malicious same-user recovery-store protection or simultaneous observer-crash recovery. An observer that cannot supply matching evidence remains blocked. pi 0.86.1 awaits extension binding before attaching its input reader, so awaited UI inside session_start is not generally serviceable; that failure is disclosed in ADR 0002, not misreported as success. The selected target's required forms run in registered commands and passed.

No paid/external model provider, user credential, .local-env traversal, adjacent-repository edit, existing user profile/session modification, publication or Git commit/push was used. Localhost synthetic-provider evidence is not an OS network-sandbox claim or every-provider certification.

## Retention and documentation disposition

Keep unique failed/passing reports, screenshot sets, package/CLI hashes, fixture source, isolated profiles/HOME and recovery diagnostics under the named wi013-* paths. Additional focused outputs are dist/wi013-checkpoint-evidence/, dist/wi013-answer-ui-tests/ and dist/wi013-runtime-review-tests/; older retained failed supervisor fixtures remain recorded in the investigation. External official F5 tool ownership/cleanup follows WI-021's archive. No live process depends on the final paths. Remove retained resources only after unique evidence is preserved and process dependencies are rechecked, not by name alone.

Superseded route/candidate prose is in the [candidate archive](2026-09-28-wi-013-superseded-candidates.md); the ADR remains in decisions with current scope/status. Post-change docs:verify/docs:health and diff results belong to ACTIVE. No staging, commit, push or gate closure is implied by this archive.

## Preserved approved proposal at closure (historical, not current work)

### Work item

WI-013 Build tracked REQ-006/009 and related REQ-004/005. The explicit delegation authorized target, DTO, queue, overflow and recovery choices; the three broad gates remained Open and ADR0002 required actual evidence before acceptance.

### Goal and scope

Implement explicit trusted loading, idle switching, failure recovery and standard interactions for the pinned MIT target specified above, on pi0.86.1 public APIs with an isolated HOME. Existing controlled chat was not a substitute for extension acceptance.

### Approach and architecture review

Compare feasible loading, tool admission, operation/interaction correlation, one-attempt replies, finite replay/queue/transport budgets and honest owner-loss recovery. Record the selected v3 DTO and nineteen-dimension governance review before implementation. Upstream capability gaps remain unknown, never inferred from local tokens; no upstream enhancement is a general prerequisite.

### Acceptance

Record product and architecture decisions, implement test-first through public seams, independently review defects, then verify deterministic races/budgets/cleanup and actual unmodified pi/target behavior. Native F5 and a newly installed package separately establish UI, keyboard, approvals, recovery and resource release. Compile, lint, tests, packaging, documentation checks and diff checks apply. Design approval alone is not runtime acceptance.

### Exclusions and approval boundaries

No paid calls, real secrets, sibling writes, publication or Git operations; no private pi internals, replacement loop/provider/compaction or session-file product access. Loading is not a sandbox; correlation is not authentication. Do not add unrelated persistence or automatically terminate unknown ownership. WI-008/009/014/016/017 remain separate work.
