# ADR 0004: End-to-end trust and session lifecycle boundaries

English | [中文](0004-trust-and-lifecycle.zh.md)

- Type: ADR
- Status: Accepted
- Created: 2026-09-28
- Decision approval: 2026-09-27 UTC, explicit maintainer delegation of scoped decisions and evidence-based acceptance; not personal maintainer inspection
- Verification and decision: 2026-09-28 Asia/Shanghai, agent evaluation under that delegation
- Gates: `gate-webview-trust`, `gate-project-trust`, `gate-session-streaming`
- Work item: WI-010 remaining broad boundaries; [closed scope and final Goal record](../archive/2026-09-28-wi-010-goal-closure.md)

## Context

The earlier WI-010 controlled-execution slice and ADRs 0001–0003 did not settle these three complete boundary questions. Subsequent attachment, review, session and trusted-extension work expanded both directions of the protocol. Tests alone, a screenshot, or closing those WIs cannot establish the combined conclusion. This decision reviews the exact questions in the [gate register](../reference/architecture-gates.md), with the current [Living v3 contract](../reference/webview-messages.md), source and layered evidence.

## Decision and rationale

1. **Low-trust presentation, privileged host authority.** Use the existing exact, versioned v3 named-intent allowlist. Host validates unknown input, current view/generation, IDs and operation eligibility; browser checks bounded host projections before rendering. No generic command, path, filesystem, shell or SDK capability crosses this bridge. Restrict assets/CSP to the packaged renderer. Credentials remain in host/runtime configuration, never UI projections. v1/v2 Webview envelopes are rejected; the independent approval-gate protocol stays v1. Paired package replacement is the migration boundary, not an old-protocol adapter.
2. **Three distinct authorizations.** Only one trusted, local file-scheme folder in a local extension host is execution-eligible. No folder, multiple roots, remote host and non-file URI remain explicit refusal states, not partial support. Resource choice is host-memory, workspace-generation scoped and invokes public pi resource flags: allow is not per-tool authorization; decline is not exclusion of every context file or an OS sandbox. Workspace changes invalidate admission and require a fresh choice. Do not fabricate/persist upstream project trust. Controlled versus explicitly loaded trusted code follows ADR0002, not a claim that approval hooks sandbox arbitrary extensions.
3. **One authoritative lifecycle.** Public pi RPC owns agent execution, retries, compaction and durable sessions. Host owns product state; adapter correlates requests/events and treats prompt acknowledgment separately from authoritative `agent_settled`. Bounded projections preserve ordering and reject stale work; Stop cancels approval/interaction admission, clears queued continuation and requests abort, with bounded waits and no task replay. Failure/uncertain completion must not report success or silently retry side effects.
4. **Honest cleanup and recovery.** Retain ADR0002's exact owned-child observation and durable unknown-runtime fence after ownership/transport loss. Do not automatically kill uncertain work, infer termination from PID absence, or clear the fence on reload. Explicit End, native warning, matching terminal receipt, then separate Recover govern recovery. End/Recover may clean up that retained child even when the workspace is now untrusted/empty; they cannot start a new runtime or grant eligibility/resource consent. Normal provider teardown still has its explicit bounded stop owner. Descendant-process cancellation and rollback are not guaranteed.

These are the simplest existing boundaries that satisfy approved REQ-001–009 without rebuilding pi or adding competing persistence. No new framework, distributed owner registry, implicit trust, retry engine or session-file implementation is introduced.

## Alternatives considered

- Accept each gate from prior WI closure or screenshots: rejected because neither examines all producers nor proves async ownership, trust transitions or process cleanup.
- A permissive bridge, compatibility fallback or UI-side runtime: rejected because it broadens privilege and weakens version/error ownership.
- Auto-kill on trust change/uncertain Stop, or auto-recover on reload: rejected because it changes ADR0002's user-visible side-effect and uncertainty contract. The observed restricted-cleanup bug was fixed in the narrow host guard instead.
- Require all providers, operating systems, forks or every possible interleaving before any architectural conclusion: rejected as a different universal-support claim, not the recorded gate questions. Covered refusal policies, concrete event classes and failure transitions are verified; new dependency/host support requires new evidence.

## Evidence and corrections

Current detailed index: dist/delegated-completion-20260928/wi010-installed/EVIDENCE.md. Its dated sections preserve earlier 665/669 runs; the final producer/menu build has **671 passing tests**, compile and lint, with no skipped tests. Logs are producer-menu-green.log, producer-menu-compile.log and producer-menu-lint.log. This is not a claim that historical host runs used a later artifact.

- **Source/test boundary review:** exact inbound/outbound validators, DTO producers, host-state guards, attachment/review/session limits and stale-operation tests. The review found and repaired model fallback >200 characters, redaction expansion beyond final65536/activity16384 bounds, UTF-8 trusted-extension display labels, and workspace display labels. Native full path/cwd remain intact. Red tests and fixed runs are preserved. Model-trigger/menu overflow was repaired and checked in actual hosts, not merely snapshots.
- **Public upstream boundary:** pi0.86.1 six-scenario resource matrix in wi010-pi-resources/run.log, actual public SDK/RPC and context readback; existing execution/interaction/session probes in the scoped archives below. No paid provider, SDK internals or product session-file manipulation.
- **Native F5 lane:** wi010-native reports use unmodified official VS Code1.105.1 and actual F5 attach, not CLI development-host launch. The modern1.139.1 debugger defect is not represented as repaired upstream. Supported official1.105.1 provides the actual native-F5 lane.
- **Installed lane:** wi010-installed reports use official VS Code1.139.1 and isolated installed VSIX. trust-report.json, workspace-full-report.json, security-report.json, security-full-report.json and streaming-report.json separately establish actual trust/folder transitions, explicit cleanup, CSP, an observed DTO canary and normal/Stop/retry/error/compaction behavior. CSP/DOM observations alone are not a complete secret-isolation proof; source and parser review are required too.
- **Current package mapping:** wi013-package/pi-vscode-wi010-producer-menu.vsix, assembly-wi010-producer-menu.json, producer-artifact-hashes.json and audit-producer-artifacts.ps1. 14070 pinned dependency entries were re-audited; 14085 total package entries. Public runtime startup/approval handshake and renderer checks are in wi010-pi-resources/verify-vsix-menu.log and verify-webview-menu.log. Installed manifest adds VS Code metadata; declared manifest content is compared separately, not falsely byte-identical.
- **Artifact differences disclosed:** functional bounds-report.json ran the producer-layout artifact. Hash evidence establishes identical host/runtime/renderer JS and SVG in the final producer-menu artifact; only CSS changed. Final bounds-visual-report.json independently verifies that CSS in both actual lanes, three themes/two languages, narrow/short viewports, settled menu screenshots, full labels, visible thinking control, keyboard scroll/focus return and draft retention. Images were opened and inspected; process/readback assertions establish behavior.
- **Cleanup evidence:** explicit-owner-cleanup.json records End → terminal → Recover. final-process-audit.json records zero live/CIM owned processes for these roots. A separately identified abandoned browser GPU helper was terminated only after matching its recorded owner; this was not runtime-fence recovery by PID inference.

Earlier accepted slices retain their own version/date and evidence limits: [execution/native F5](../archive/2026-09-27-wi-021-execution-closure.md), [trusted interactions/recovery](../archive/2026-09-28-wi-013-acceptance.md), [attachments](../archive/2026-09-28-wi-014-attachment-acceptance.md), [review](../archive/2026-09-28-wi-016-review-acceptance.md), and [sessions](../archive/2026-09-28-wi-017-session-acceptance.md). They supplement, not replace, the fresh WI-010 checks.

## Architecture governance review

All 19 dimensions were considered. `pass` is for this boundary decision, not universal product/release maturity. The module paths below are repository evidence; the report filenames above resolve under the two WI-010 host roots.

| Dimension | Status | Evidence on disk | Remaining risk / disposition |
|---|---|---|---|
| 1 Decomposition | pass | src/extension/, src/adapter/runtime/, src/webview/; architecture owner table | Host coordinator remains central; unrelated refactoring excluded |
| 2 Public interfaces | pass | src/extension/bridge/webviewMessages.ts; contracts/webviewProtocol.ts | Named intents only, no generic capability |
| 3 Dependencies | pass | build outputs and verify-webview-menu.log; architecture layer direction | Browser cannot import privileged runtime; future changes recheck bundle |
| 4 Contracts | pass | Living webview-messages.md; exact validators/tests | Old envelopes archived, not supported |
| 5 Ownership | pass | piChatViewProvider.ts; ADR0002; explicit-owner-cleanup.json | Exact child only, not every descendant |
| 6 Requirements/scope | pass | Draft PRD's approved REQ-001–009 slices and linked closure archives | Whole Draft PRD is not accepted |
| 7 Domain model | pass | workspace/view/runtime/session types and contract identity rules | Identities are not interchangeable |
| 8 State machines | pass | host/adapter lifecycle tests; trust/workspace reports | Unknown runtime remains fenced until valid receipt |
| 9 Concurrency | pass | generation/view/request guards; 671 tests; streaming/session evidence | Not exhaustive enumeration of all schedules |
| 10 Errors/recovery | pass | restricted-cleanup red/green; ADR0002; streaming-report.json | No retry of uncertain mutation or rollback |
| 11 Lifecycle/cleanup | pass | explicit-owner-cleanup.json; final-process-audit.json; lifecycle tests | OS/user-owned processes outside scope |
| 12 Security/trust | pass | validators, producer audit/fixes; CSP/DTO reports; public resource matrix | Extension is not an OS sandbox; trusted code is privileged |
| 13 Data/persistence | pass | public session APIs; WI017 archive; attachment/review host-memory ownership | No new product session-file reader/writer; memory loss disclosed |
| 14 Observability/privacy | pass | activityProjection.ts, producer redaction tests, bounded error projections | Synthetic evidence canary only; no real secrets collected |
| 15 Backpressure | pass | adapter limits, attachment/interaction budgets; bounds reports | Explicit refusal/truncation, not unlimited history |
| 16 Tests | pass | 671-test log; separate public-runtime/F5/installed reports | Simulation does not substitute for actual host lanes |
| 17 Build/release/upgrade | pass | declared package pins, assembly audit, VSIX public-runtime probe | Local acceptance, no publishing/release or other-platform claim |
| 18 Compatibility/versioning | pass | v3-only contract; pi0.86.1; Code1.105.1 F5 /1.139.1 installed | Forks and other host/version combinations require separate evidence |
| 19 UX/accessibility | pass | bounds-visual-report.json; opened screenshots; accepted WI014/016/017 matrices | Keyboard/theme evidence, not a universal assistive-technology certification |

**Conclusion:** document-first reconciliation is complete for these boundaries; decision class `adr-after-approval`, approval supplied by explicit delegation. The reviewed boundaries are **Evolvable**: living contracts, enforcing tests, real dependency/host/package evidence and retained ADR rationale exist. Accept the three exact gate conclusions. This does not automatically close final Goal recordkeeping or claim every product feature/environment is delivered.

## Consequences and revalidation

Keep host ownership, precise v3 validation, bounded redacted producers, public pi integration and receipt-based recovery as mandatory change constraints. Revisit this ADR/gates on protocol privilege expansion, storage/owner changes, pi upgrades or lifecycle-semantic changes. New supported providers/platforms/forks need their own applicable verification. Historical failing harness assumptions and product regressions remain evidence; they must not be silently relabeled as passes. No credentials, paid calls, adjacent-repository modifications, Git commits or publishing were authorized by this decision.
