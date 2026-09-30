# Runtime Helpers Audit: New-File Review

English | [中文](2026-09-30-runtime-helpers-audit.zh.md)

- Type: Discussion
- Status: Draft
- Scope: Continue reviewing previously uninspected code; do not reopen files reviewed in earlier rounds, including partial reviews.
- Authority: Evidence and candidate follow-up only. Finish the code review before implementing fixes; no implementation, WI, ADR or Git commit is approved here.

Earlier findings remain in the [architecture backlog](../../ACTIVE.md) and [UI review](2026-09-30-ui-components-audit.md). This report adds findings without modifying those records.

## Confirmed Findings

### RUNTIME-01 / P1: Streaming redaction loses sensitive context

[ActivityProjection](../../src/adapter/runtime/activityProjection.ts#L18) appends new thinking deltas to the already sanitized display text held in its item map. [Its storage step](../../src/adapter/runtime/activityProjection.ts#L38) replaces the original text before the next delta arrives.

Using the real [credential redactor](../../src/extension/contracts/credentialText.ts#L19), synthetic probes produce:

- First delta `Bearer SYNTHETIC_PREFIX` becomes `Bearer [redacted]`; appending `_SYNTHETIC_TAIL` returns `Bearer [redacted]_SYNTHETIC_TAIL`.
- A private-key marker becomes `[redacted]`; appending synthetic key payload returns `[redacted]SYNTHETIC_PRIVATE_PAYLOAD`.

The context required to suppress the credential value has disappeared. Final thinking content may be sanitized again, but that does not establish that earlier projections were never exposed. The module-level output is confirmed; this round did not launch a real host or recheck the previously reviewed host/UI delivery modules.

Candidate follow-up: bounded, context-aware streaming sanitization; display text must not serve as the original incremental input. Cover chunk boundaries and private-key payload continuation without removing memory limits.

### RUNTIME-02 / P1: A quoted credential value is only partially redacted

[Field-value replacement](../../src/extension/contracts/credentialText.ts#L23) stops at whitespace even inside a quoted value.

The complete valid JSON input `{"password":"SYNTHETIC_ALPHA SYNTHETIC_BETA"}` is recognized as credential-like but becomes `{"password":"[redacted] SYNTHETIC_BETA"}`. The second part of the password remains readable. This defect exists even without streaming and differs from RUNTIME-01.

Candidate follow-up: redact whole structured credential values before presentation, and define conservative handling of quoted values in unstructured text. Regressions should cover whitespace and escaped quotes. No real credentials were used.

### RUNTIME-03 / P2: Diagnostic subprocess errors escape the failure-result path

[runPiRuntimeProbe](../../src/adapter/runtime/pi-rpc-probe.ts#L63) installs no child `error` listener. An asynchronous spawn error is not caught by the surrounding `try`/`catch`.

An isolated Node harness invokes the real helper with a verified nonexistent working directory and a dummy CLI path. The failed spawn emits unhandled `ENOENT`; the harness exits with status 1 instead of returning `ok: false`. No pi CLI starts. The effect of the same event in VS Code's extension-host error handling was not measured; do not claim that this probe proved the actual extension host crashes.

Candidate follow-up: own child and pipe error events, settle the diagnostic once, and ensure cleanup also has a bounded failure path.

### RUNTIME-04 / P2: Diagnostic success is reported without observed process exit

[stopChildProcess](../../src/adapter/runtime/pi-rpc-probe.ts#L153) sends SIGKILL after its deadline and immediately resolves, without confirming exit or checking whether the kill was accepted. [The caller](../../src/adapter/runtime/pi-rpc-probe.ts#L118) then discards the child and reports that it exited within the timeout.

A synthetic child returns a successful RPC response, refuses both kill attempts, emits no exit, and retains null exit/signal codes. After the injected deadline, the real helper nevertheless returns `ok: true` with `process exited within timeout`.

Candidate follow-up: distinguish response success, stop attempt, and observed termination. An inability to prove termination must not produce successful bounded-shutdown evidence. This finding concerns the diagnostic helper, not the previously reviewed production ownership/recovery implementation.

### RUNTIME-05 / P2: Diagnostic response success is checked by truthiness

[Response admission](../../src/adapter/runtime/pi-rpc-probe.ts#L95) matches type/id/command but does not validate `success` as a boolean. [The result check](../../src/adapter/runtime/pi-rpc-probe.ts#L111) accepts truthy nonboolean values.

A synthetic response with `success: "false"`, followed by an actually observed synthetic child exit, returns `ok: true`. This is a separate false-success route from RUNTIME-04.

Candidate follow-up: require a valid public RPC response shape and exact boolean success before reporting a successful diagnostic round-trip. It is not evidence that normal pi emits this malformed response.

## Unmeasured Resource Risks

- [Startup-model settings](../../src/adapter/runtime/piStartupModel.ts#L26) are read synchronously and without a read-size budget.
- [Diagnostic stderr](../../src/adapter/runtime/pi-rpc-probe.ts#L70) accumulates without a memory budget; slicing the eventual returned detail does not bound its accumulation.

These are implementation observations, not measured user-visible regressions. Determine invocation scope, normal cost and required budgets before assigning them the same status as the five confirmed defects.

## New Coverage Inventory

This round inspected 11 new implementation files and 3 new test files. All returned source was available for these small files. This does not mean every branch or integration was exercised. Every listed file must be excluded from subsequent rounds under the maintainer's current rule.

| New file | Review / evidence |
|---|---|
| [interaction-writer](../../src/adapter/runtime/interaction-writer.ts) | Delivery, backpressure, listener cleanup; existing tests run |
| [command-classification](../../src/adapter/runtime/command-classification.ts) | Bounded command catalogue and slash dispatch |
| [runtime-errors](../../src/adapter/runtime/runtime-errors.ts) | Bounded details and fixed user-facing error classification |
| [pi-rpc-model-parse](../../src/adapter/runtime/pi-rpc-model-parse.ts) | Labels, identities, thinking levels and catalogue parsing |
| [rpc-replies](../../src/adapter/runtime/rpc-replies.ts) | Identity matching, timeout, pause/resume and cleanup; existing tests run |
| [child-link](../../src/adapter/runtime/process/child-link.ts) | Transport listeners, loss callbacks and abandon behavior |
| [activityProjection](../../src/adapter/runtime/activityProjection.ts) | Bounded projection and real incremental-redaction probes |
| [extension-feedback](../../src/adapter/runtime/extension-feedback.ts) | Own-data-property validation, replacement and capacity limits |
| [piStartupModel](../../src/adapter/runtime/piStartupModel.ts) | Global settings path, read and fallback behavior |
| [pi-rpc-probe](../../src/adapter/runtime/pi-rpc-probe.ts) | Resolution, diagnostics, response and stop behavior; isolated probes |
| [credentialText](../../src/extension/contracts/credentialText.ts) | Shared detection/redaction rules; real synthetic-value probes |
| [rpc-replies tests](../../src/adapter/runtime/tests/rpc-replies.spec.ts) | Read and ran 14 existing tests |
| [activity-projection tests](../../src/adapter/runtime/tests/activity-projection.spec.ts) | Read existing coverage; not run because its decoder dependency was reviewed earlier |
| [interaction-writer tests](../../src/adapter/runtime/tests/interaction-writer.spec.ts) | Read and ran 3 existing tests |

## Verification and Limits

- Five finding scenarios reproduced; streaming redaction covered both Bearer continuation and private-key continuation.
- Existing reply/writer tests: 17 passed, 0 failed. They ran from in-memory bundles, not the full repository test entry.
- esbuild used `write: false`; every bundle's source inputs were checked against a strict new-file allowlist. Previously reviewed shared contracts and JSONL helpers were not traversed: only the new credential implementation was resolved, and the probe's JSONL dependency was stubbed.
- Projection probes use normalized event objects directly; they do not claim new validation coverage for the previously reviewed event decoder. Diagnostic mocks are helper-level evidence, not real-pi termination acceptance.
- No application source edits, real pi settings access, network requests, paid API calls or pi runtime startup. One isolated Node test harness was used for the asynchronous spawn failure and exited as asserted. No probe files were created on disk; fake timers were consumed and live helper timers were cleared by their completion path.
- No full test suite, compile/lint, F5, installed VSIX or browser verification. The old coverage gaps remain gaps, not completed code review.
- Only this report's English/Chinese pair is added to the repository. Documentation checks are reported separately in the handoff.
