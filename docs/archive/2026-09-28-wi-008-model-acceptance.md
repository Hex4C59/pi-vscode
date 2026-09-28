# WI-008 — Model selection and readiness acceptance

English | [中文](2026-09-28-wi-008-model-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: historical scoped delegated acceptance; ACTIVE owns remaining work

## Delegated acceptance

On September 28, 2026 Asia/Shanghai, the agent completed evaluation under the maintainer's explicit delegation and closes WI-008's approved model-selection/readiness slice. This is not personal maintainer inspection. REQ-002 remains a Draft full requirement; WI-009 thinking and WI-014/016/017, WI-010 boundary disposition and three broad gates remain separate work. Do not infer their acceptance from shared controls or this closure.

The closure audit matched current public model APIs, host state coordination, named Webview intents, tests and actual evidence to idle selection, next-turn intent, approval/Stop interleavings, safe errors, absent models, missing credentials, runtime loss/recovery, keyboard/focus and bounded presentation. Existing accepted paths were retained, not rebuilt. Final local review found no remaining scoped implementation defect in the model coordinator, late-result invalidation, focus ownership, classified errors, empty-model mapping or narrow untouched-conversation recovery. This is a root review, not an independent whole-repository review.

## Evidence and version boundaries

All paths below are under dist/delegated-completion-20260928/. Long evidence, failures and exact commands remain in wi008-installed/EVIDENCE.md and wi008-readiness/EVIDENCE.md, not a second task ledger.

| Requirement | Actual evidence and limit |
|---|---|
| Current automated tree | wi008-readiness/compile-auth-rejection.log, lint-auth-rejection.log, tests-auth-rejection.log: compile/lint and 656/656 tests pass, no skips. Deterministic tests cover stale/replaced sessions/views, failed mutation/readback, pending clearing, safe event/rejection mapping and no replay. Those injected failures are not claimed as real provider faults. |
| Idle, streaming, Stop, approvals, failure recovery | wi008-native/report.json and wi008-installed/report.json: actual F5 and installed649 tree separately verify model request identity, old applied model through denied-tool continuation, next-turn application, Stop/draft preservation, explicit retry, keyboard and checkmark. |
| Authentication and ownership faults | wi008-native/fault-report.json and wi008-installed/fault-report.json: actual651 tree independently verifies synthetic401 safe guidance, approval Stop with zero unapproved write, actual owned exit clearing pending intent, no replay and separate controlled recovery. |
| No model, missing key, empty recovery | wi008-readiness/report.json and wi008-readiness-native/report.json: installed656 and actual native F5 current tree each verify no-model guidance/disabled Send/zero request, untouched empty recovery, missing-key rejection before provider request, and explicitly confirmed New after synthetic configuration followed by one deliberate request. |
| Presentation | Six installed short-window model-menu images across three actual themes and two locales were individually opened and inspected; six formal-presentation samples additionally exercise overlays, focus and Enter. Window1100×620, Webview about289×506. Actual computed pseudo-element content confirms the checkmark. Approval screenshot during close animation is not a stable-layout claim. |
| Package identity | wi008-readiness/package-auth-rejection.log: 14085 entries plus extracted RPC/gate check. Latest package is wi013-package/pi-vscode-wi008-auth-rejection.vsix; 656-artifact-hashes.json confirms six installed production assets match current build. Native counterpart records the same built assets. |
| Resource lifecycle | Both readiness roots' explicit-owner-cleanup.json plus final-cleanup.log: owned child End, matching terminal receipt, then explicit recovery. Four WI008 final-process-audit.json files are empty. |

These are incremental, scoped records: 649/651 host results are not relabeled as full656 reruns. Their exercised model-selection/presentation paths are retained, while subsequent error/startup/recovery changes have their own actual656 evidence and full current regressions. Actual F5 used official unmodified Code1.105.1; ordinary installed testing used Code1.139.1. CLI development hosts, mocked browsers and installed packages were not substituted for F5. Localhost synthetic providers establish controlled behavior, not all-provider compatibility or external credential setup.

## Decisions and repairs

- Retain host-authoritative current/pending model state, public RPC readback, serialized model-before-thinking application, strict stale-result invalidation and no mutation retry/default persistence.
- Restore focus lost when Chromium disables the model trigger during its own idle selection; do not steal a newer draft focus. Fix the literal CSS escape to a real selected checkmark. Both defects had regressions and actual-host confirmation.
- Never forward provider error bodies to Webview. Classify authentication/availability/rate-limit/generic failures to fixed guidance. Missing-key prompt rejection carries only an internal allowlisted authentication reason; delivery remains rpc-rejected, with no new Webview capability/version or replay.
- Recognize only pi0.86.1's zero-capability unknown model sentinel, not every real model named unknown. Direct public RPC evidence establishes the sentinel; no session files were inspected.
- [ADR0002](../decisions/0002-interaction-contract-route.md) records the narrow delegated recovery correction: after positively observed owned exit, a new controlled, non-resumed, never-submitted session can be replaced empty because its identity/path need not be persisted. Submitted, trusted, resumed and uncertain cases remain strict; no fallback after failed resume. After a rejected submission the readiness test intentionally uses explicit New with existing loss disclosure, not silent empty recovery.
- Correct a discovered test-fixture millisecond race by comparing every approval expiry with its own initial value, not another card's independently sampled timestamp; no tolerance or weakened expiration rule.

## Limits, retained resources and cleanup

Full thinking acceptance belongs to WI-009; attachment/review/session acceptance and broad gates remain open. This does not provide a filesystem/network sandbox, arbitrary extension compatibility, process-descendant guarantees, rollback, machine-wide locking or draft persistence after a host crash. Failed mutation/readback race cases use deterministic public-seam injection; actual-host authentication/exit cases and assertions are separately identified above.

Retain wi008-installed/, wi008-native/, wi008-readiness/, wi008-readiness-native/ and their failed/passed reports, helpers, screenshots, clean profiles/HOME, public RPC observations and named wi013-package/ VSIX files. These paths are agent-owned evidence, not user configuration; no live process dependency remained at audit. Remove only after preserving unique evidence and rechecking process dependencies. Earlier WI-021's official external F5 tool follows its own archive cleanup condition. No .local-env traversal, real secrets, paid model calls, sibling changes, staging, commit, push or publication occurred. Baseline HEAD remains59dbb09; pre-existing ACTIVE compression/archive work is preserved.

## Approved proposal before closure (historical)

WI-008 Verify: model-selection complete fault matrix and delegated acceptance. REQ-002 with related004/005/006; three broad gates Open. The explicit delegation authorizes decisions, necessary fixes and actual evaluation, not acceptance of the entire Draft PRD. Use public pi model APIs, host-owned state and v3 bridge; no provider stack or global default persistence.

### Goal and scope

Finish accurate current/pending projection, idle and next-turn selection, failures, approval waits, Stop and disconnect/recovery without false success, changing the running request or losing unsent draft. Audit existing source/tests/evidence rather than reimplementing accepted paths; thinking remains WI-009.

### Approach and architecture review

Public RPC/readback plus deterministic failure/race tests and separate native F5/installed localhost matrices. Check request records, state, approval/Stop ordering and actual screenshots for narrow/short/theme/language/menu/keyboard focus. Never label earlier evidence as a current rerun.

### Acceptance

Traceable approved-path and fault/approval/Stop evidence, readback/provider agreement, recoverable errors and usable draft/focus; red-green fixes with compile/lint/tests and new host/package checks. Record delegated evaluation, bilingual docs/archive, documentation checks and diff review before switching WI.

### Exclusions and approval boundaries

No new provider/agent loop, paid model, real credential access, weakened trust/tool approval, global persistence, other-WI closure or broad gate closure. No Git staging/commit/push/publication.
