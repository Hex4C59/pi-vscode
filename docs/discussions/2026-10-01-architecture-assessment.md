# Architecture assessment — 2026-10-01

English | [中文](2026-10-01-architecture-assessment.zh.md)

- Type: Discussion
- Status: Draft
- Authority: agent assessment and context; no implementation approval or acceptance change

## Scope and method

The maintainer requested architecture scores out of ten across dimensions. This assessment compares the [accepted architecture](../architecture/vscode-extension-architecture.md), [governance checklist](../guides/architecture-governance.md), current source and existing tests against the personal-use macOS local VS Code target. It is a sampled architecture review, not an exhaustive security audit or real-host acceptance run. Scores are expert judgments, not coverage percentages. The equally weighted mean rounds to **8.2/10**.

## Scores and evidence

| Dimension | Score | Assessment and evidence |
|---|---:|---|
| Layering and dependency direction | 8.8 | [Composition root](../../src/extension.ts) separates host, adapter and upstream execution. [Production browser graph test](../../scripts/packaging/production-webview.spec.mjs) excludes privileged implementations and synthetic fixtures. Domain/runtime contracts still refer to presentation DTOs in [runtimeLifecycle](../../src/extension/contracts/runtimeLifecycle.ts), so representation coupling remains. |
| Module cohesion and interface depth | 7.5 | [EditorTools](../../src/extension/editor-tools/editorTools.ts) hides approval, editor checks and optional review resources. The 890-line [host coordinator](../../src/extension/piChatViewProvider.ts) still owns workspace, task, profile, recovery and session-handoff coordination; changing a flow requires understanding several callbacks and flags. Size alone is not the deduction. |
| Contracts and identity | 8.5 | [Inbound validator](../../src/extension/bridge/webviewMessages.ts) enforces v3, exact fields and bounded values; the coordinator rejects stale view/generation pairs. The [runtime interface](../../src/extension/contracts/runtimeLifecycle.ts) combines execution, recovery, interactions and model capabilities, with multiple optional operations. |
| State and concurrency | 8.4 | [Occupancy owner](../../src/adapter/runtime/rpc-occupancy.ts) and [ordering tests](../../src/adapter/runtime/tests/rpc-occupancy.spec.ts) distinguish ACK, task completion, commands, dialogs and Stop. Host orchestration still expresses many legal combinations through separate booleans, tokens and callback order. |
| Process lifecycle and recovery | 8.7 | [RPC release](../../src/adapter/runtime/pi-rpc-runtime.ts) revokes transport synchronously; production uses managed ownership. Current tests cover exact-child receipts, owner loss, uncertain delivery and blocked replacement. Descendant termination and rollback are explicitly outside the promised conclusion. |
| Security and trust | 8.8 | [CSP shell](../../src/extension/bridge/webviewHtml.ts), exact message validation and [editor policy](../../src/extension/editor-tools/editorTools.ts) provide concrete restrictions. [Runtime errors](../../src/adapter/runtime/runtime-errors.ts) avoid projecting raw provider error bodies. Arbitrary-output redaction and path check/use guarantees retain documented limits; this score is not a security certification. |
| Data and persistence | 8.5 | Public pi APIs retain session authority; [endpoint transaction](../../src/extension/models/endpointFileTransaction.ts) provides bounded reads, cooperating-writer exclusion, replacement checks and explicit commit/cleanup outcomes. Uncooperative edits and crash leftovers have conservative limits. |
| Performance and backpressure | 7.0 | [JSONL framing](../../src/adapter/runtime/jsonl.ts), attachment limits and bounded projections prevent unbounded ordinary retention. Every text delta updates the transcript and [publish](../../src/extension/piChatViewProvider.ts) posts the complete workspace/chat snapshot. No latency, transport-volume or rendering measurement was established in this review; this is a scaling concern, not a demonstrated slowdown. |
| Testability and verification | 8.2 | Injected process/bridge seams, native-process tests, jsdom interactions and production graph tests cover different failure surfaces. All 1,027 current tests pass. These do not replace real-host acceptance; [ACTIVE](../../ACTIVE.md) retains the macOS representative-matrix evidence gap. |
| Build, delivery and compatibility | 7.8 | Explicit host/helper/browser entries, exact pi release pins and package closure tests support deterministic delivery. [CI](../../.github/workflows/ci.yml) runs Ubuntu and Windows, without the current macOS target. Public release and additional host/platform support remain outside scope rather than missing required features. |
| Documentation and maintainability | 7.5 | ADRs, gates and ownership descriptions preserve rationale. [README](../../README.md) describes remaining implementation/verification as complete while [ACTIVE](../../ACTIVE.md) records confirmed display omissions and an evidence gap. Historical scope statements increase the reading cost. Planned directory organization is not counted as implemented modularity. |

## Current leaning and options

Retain the existing layered architecture. Directory grouping can improve navigation, but it will not reduce cross-module coordination by itself. If later maintenance justifies structural work, evaluate a narrow extraction of session handoff or task lifecycle with one authoritative owner and behavior-preserving verification. Avoid creating a general event bus or additional abstract layers without a concrete varying implementation.

For performance, first measure postMessage traffic, renderer updates and interaction responsiveness during long streams; only then consider coalescing publication or changing transport. Improving macOS CI coverage and reconciling summary status with current gaps are more directly supported than changing the framework or process model. These are review recommendations, not approved Build scope or a reordered product queue.

## Verification and limits

Current runs: `npm run typecheck`, `npm run lint` and `npm test` passed; the test runner reported 1,027 passed, zero failed, cancelled or skipped. Compile/package installation, native F5, live-provider behavior and performance benchmarks were not run for this review. Existing acceptance/gate records were read as historical scoped evidence, not claimed as fresh passes. Application code, PRD, ADR and gate statuses remain unchanged.

Open questions are the measured cost of full snapshots, the smallest lifecycle extraction that actually reduces caller knowledge, and completion of the macOS representative evidence matrix already recorded in ACTIVE.
