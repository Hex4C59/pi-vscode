# Core Boundaries Audit: Attachments, Approval and Process Control

English | [中文](2026-09-30-core-boundaries-audit.zh.md)

- Type: Discussion
- Status: Draft
- Scope: Previously uninspected implementation and relevant new tests only. HTML/CSS and files inspected in earlier rounds remain excluded.
- Authority: Evidence and candidate follow-up only. Complete review before fixing; no application edits, implementation approval, WI, ADR or Git commit.

Earlier findings: [architecture backlog](../../ACTIVE.md), [UI audit](2026-09-30-ui-components-audit.md), [runtime helper audit](2026-09-30-runtime-helpers-audit.md). Remaining-file tracking: [audit progress](code-audit-progress.json).

## Confirmed Findings

### CORE-01 / P2: Concurrent preflights bypass the pending approval limit

[ToolApprovals](../../src/extension/editor-tools/toolApproval.ts#L62) checks `pending.size >= 8` before asynchronous safety and scope checks. [Card insertion](../../src/extension/editor-tools/toolApproval.ts#L71) does not recheck or reserve capacity.

Nine ordinary custom-tool requests can all pass the initial empty-map check and wait in the initial safety hook. Releasing that hook admits nine pending cards simultaneously. An isolated probe using the real manager confirms 9 cards against the intended maximum of 8. Cancelling denies all nine and clears their timers.

The confirmed defect is the local admission invariant, not an approval bypass. This round did not reopen the earlier host/UI validators, so invalid projection, disconnect or actual memory exhaustion is not claimed as reproduced production behavior.

Candidate follow-up: reserve capacity before awaiting, or enforce the limit at atomic admission with cleanup on every cancellation/error path. Cover concurrent preflights and slot release, not merely sequential insertion.

### CORE-02 / P2: Worker response validation omits request affinity and cursor semantics

[parseSessionWorkerResponse](../../src/adapter/sessions/session-worker-protocol.ts#L162) validates inspect/history/preview shapes but does not bind inspect session id, history page or preview offset to the supplied request. The list branch already compares its returned page to the requested page.

[Preview validation](../../src/adapter/sessions/session-worker-protocol.ts#L121) enforces numeric ordering but accepts nonterminal zero progress and an end flag inconsistent with remaining characters.

Five valid-shaped synthetic responses are accepted with `ok: true`:

1. Inspect requests `requested-session` but receives `other-session`.
2. History requests page 0 but receives page 4.
3. Preview requests offset 0 but receives offset 10.
4. Preview has empty text, offset/nextOffset 0, totalChars 20 and done false.
5. Preview advances to 5 of 20 characters but declares done true.

A mismatched list page is rejected as a control case. Existing pure protocol tests also pass, but do not cover these counterexamples.

The confirmed behavior is parser admission of inconsistent responses. It does not prove that the real worker emits them, that a selected conversation is switched incorrectly, or that an earlier-reviewed downstream consumer has no additional protection. Those integrations were deliberately not revisited.

Candidate follow-up: specify and validate request/response affinity plus progress/end invariants. Keep parser-level counterexamples separate from real-worker integration acceptance.

## Interface Risk, Not a Confirmed Workflow Bug

[captureSelection](../../src/extension/draft/fileAttachment.ts#L95) returns a selected-text source typed as the same `FileSnapshot` used by whole-file capture. [validateEditorSnapshot](../../src/extension/draft/fileAttachment.ts#L66) and whole-file revalidation compare the whole document to snapshot text, while selection validation is separate. The type permits pairing a selection source with the wrong validator.

The earlier-reviewed caller was not reopened, and no actual wrong pairing was established. Consider distinct snapshot types or a discriminant during the later repair/design stage; do not count this as an additional confirmed production defect.

## New Coverage Inventory

40 new implementation files and 3 new test files, including the supplementary interface/entry sweep below. This inventory becomes an exclusion list for subsequent rounds. Source inspection is not exhaustive branch or integration acceptance.

| New file | Coverage / evidence |
|---|---|
| [fileAttachment](../../src/extension/draft/fileAttachment.ts) | Full returned implementation; mocked-FS capture and validation checks |
| [toolApproval](../../src/extension/editor-tools/toolApproval.ts) | Full returned implementation; concurrent capacity probe |
| [control-client](../../src/adapter/ownership/control-client.ts) | Full returned implementation; mocked-net validation and cleanup checks |
| [control-protocol](../../src/adapter/ownership/control-protocol.ts) | Full returned implementation; used by control checks |
| [launch-supervisor](../../src/adapter/ownership/launch-supervisor.ts) | Full returned implementation; native failed-spawn handling probe |
| [direct-process](../../src/adapter/runtime/process/direct-process.ts) | Full returned implementation; spike-only strategy, no production behavior claim |
| [pathIdentity](../../src/adapter/pathIdentity.ts) | Full returned implementation; native spelling comparison responsibility |
| [session-worker-protocol](../../src/adapter/sessions/session-worker-protocol.ts) | Full returned implementation; affinity/cursor probes and pure tests |
| [approvalProtocol](../../src/extension/contracts/approvalProtocol.ts) | Full returned parser and contracts |
| [ownership types](../../src/adapter/ownership/types.ts) | Full returned capability contracts |
| [chatBounds](../../src/extension/bridge/chatBounds.ts) | Full returned constant |
| [webviewProtocol](../../src/extension/contracts/webviewProtocol.ts) | Full returned DTO definitions |
| [webview bridge](../../src/webview/client/bridge.ts) | Full returned transport implementation |
| [sessionBackend](../../src/extension/contracts/sessionBackend.ts) | Full returned contract and unavailable implementation |
| [tool-approval tests](../../src/extension/editor-tools/tests/tool-approval.spec.ts) | Partial returned source; not run because they depend on previously reviewed helpers |
| [file-attachment tests](../../src/extension/draft/tests/file-attachment.spec.ts) | Partial read, lines 1–200; no assertion-by-assertion audit or execution |
| [session-worker-protocol tests](../../src/adapter/sessions/tests/session-worker-protocol.spec.ts) | Partial returned source; 3 pure tests run, 1 worker integration test explicitly skipped |

## Supplementary Interface and Entry Sweep

26 additional source files were inspected in the same pass, with complete returned content and no additional independently confirmed defect:

- Contracts / host types: [extensionInteractions](../../src/extension/contracts/extensionInteractions.ts), [providerConfig](../../src/extension/contracts/providerConfig.ts), [runtime types](../../src/adapter/runtime/types.ts), [editor-tool types](../../src/extension/editor-tools/types.ts), [extension-selection types](../../src/extension/extension-loading/types.ts), [saved-history types](../../src/extension/sessions/types.ts).
- Adapter export entries: [adapter](../../src/adapter/index.ts), [ownership](../../src/adapter/ownership/index.ts), [runtime](../../src/adapter/runtime/index.ts), [sessions](../../src/adapter/sessions/index.ts).
- Host export entries: [extension](../../src/extension/index.ts), [contracts](../../src/extension/contracts/index.ts), [bridge](../../src/extension/bridge/index.ts), [draft](../../src/extension/draft/index.ts), [editor-tools](../../src/extension/editor-tools/index.ts), [extension-loading](../../src/extension/extension-loading/index.ts), [interactions](../../src/extension/interactions/index.ts), [models](../../src/extension/models/index.ts), [sessions](../../src/extension/sessions/index.ts).
- Browser export entries: [chat](../../src/webview/chat/index.ts), [components](../../src/webview/components/index.ts), [webview](../../src/webview/index.ts).
- Browser type definitions: [chat types](../../src/webview/chat/types.ts), [component props](../../src/webview/components/types.ts), [transport/client types](../../src/webview/types.ts).
- [Webview boot](../../src/webview/main.tsx): surface selection, one API acquisition, bridge construction, pagehide disposal and generic startup fallback. Imports were not followed into earlier-reviewed components; CSS was not inspected. No real-browser acceptance claim.

Earlier partial reads remain excluded. The two other newly read test files also had display-truncated sections; executing the three pure tests does not constitute inspecting every assertion. Their partial coverage is tracked explicitly rather than represented as complete test review.

## Verification and Boundaries

- CORE-01 and all five CORE-02 variants reproduced in memory with real new-file implementations and source-input allowlists.
- Attachment checks passed: dirty whole-file snapshot, document-version rejection, cancellation, selection-only reads without a full-document read, and selection revision validation. FS and credential detection are stubbed; credential rules were reviewed earlier and are not revalidated here. Only ordinary synthetic text is used.
- Control checks passed: observe emits only observe, end admission, invalid-state rejection, wrong-run rejection, 4096-byte budget, and cleanup of all five mocked sockets. No real socket endpoints are created.
- Native supervisor spawn with a verified nonexistent cwd returns startup-unconfirmed and invokes the never-spawned writer once. Observer persistence is stubbed: no claim that a real durable receipt was written. The candidate startup-event ordering concern was not reproduced and is not filed as a confirmed defect.
- Pure protocol tests: 3 passed, 0 failed; 1 CLI integration test skipped to avoid loading the previously reviewed worker.
- esbuild used write false and strict source allowlists. Previously reviewed contract barrels, write normalization, child-link, recovery observer, worker and host composition were not reopened or loaded by probes. No real pi runtime, command execution, credentials, sessions or configuration were used. Probe timers and pending approvals were cleaned up; no disk fixtures were created.
- No full suite, compile/lint, F5, installed VSIX or real-browser acceptance. HTML/CSS excluded by maintainer direction.
- Only the bilingual report and machine-readable review progress are added; application code remains unchanged. Documentation validation is reported in the handoff.
