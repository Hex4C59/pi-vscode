# WI-021 — execution states and native F5 closure

English | [中文](2026-09-27-wi-021-execution-closure.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-27
- Authority: historical scoped acceptance; [ACTIVE](../../ACTIVE.md) owns current work

## Closure and delegation

WI-021 is closed on September 27, 2026 (UTC; recorded host timestamps are September 28 in Asia/Shanghai) after the agent completed evaluation under the maintainer's explicit task-specific delegation. The maintainer did not personally run these checks. This closes REQ-004's observable retry/compaction and reliable completed/stopped/failed slice, including delivery ACK independence, draft preservation and the necessary host-focus compatibility repair. It does not accept the complete Draft PRD, WI-019 Q16, third-party extension interactions, every host/version, or any architecture gate.

## Approved proposal preserved

The slice maps public pi 0.86.1 automatic retry/compaction events through the existing runtime adapter into host-owned execution state. Only agent_settled ends the turn; intermediate completion events and delivery ACK do not. Failure remains failure after late settled/ACK; Stop stays pending until settlement or explicit failure. Newer drafts survive. The host's DraftSubmission and execution coordinator retain distinct ownership; the UI only renders validated v2 projections. Tests use the approved public runtime/host/client/bridge boundaries, not private implementation mocks. No new provider loop, compaction implementation, credential access or session-file product API is introduced.

A necessary dependency fix discovered in native F5 queries the registered VS Code commands: reveal a dedicated Pi container only if present, then focus the existing view. Existing-container and discovery errors propagate. This supports the observed Explorer fallback in fixed official VS Code 1.105.1 without changing the modern-host Secondary Side Bar default. It is recorded in both PRD languages; no new architectural choice or dependency is introduced.

## Acceptance evidence

All paths below are under dist/delegated-completion-20260928/ and describe this run, not historical passes.

| Requirement / evidence lane | Actual observation |
|---|---|
| Standard tests | test-reviewed.log: 450/450, zero skipped; compile-reviewed.log, lint-reviewed.log and webview-reviewed.log pass. Includes ACK/settled/error/Stop/stale interleavings and the new fallback/error propagation tests. |
| Native F5 | host-stable/matrix-first-report.json and matrix-repeat-report.json: normal completion, Stop, retry, nonretryable failure, model delayed until settlement, exact grant/write/native captured diff/revoke, compaction and compaction Stop. F5 is initiated through the isolated parent UI and the unmodified built-in debugger attaches. |
| Native failure recovery | host-stable/f5-report.json and lifecycle.log: previous matrix plus Stop during retry, identity-checked owned RPC termination, failed/readonly draft/send-disabled projection and deliberate full-host reload recovery. |
| Installed VSIX | host-installed/installed-compaction-report.json: independently installed current package and the complete main matrix on 1.139.1; current-install-hashes.json matches eight production artifacts to the current compiled tree. package/dependency-audit.json freshly compares 14,070 dependency files; package/webview-vsix.log passes. |
| Browser candidate | workflow-browser/browser.json: 150 real Chrome samples across five widths, three themes and two languages at 500px height; retry/compaction/terminals, reachable Stop and retained newer draft. Screenshot opened for 280px Chinese high contrast. Synthetic bridge only, not runtime evidence or full Q16. |
| Review | Standards found one insufficiently discriminating discovery-error assertion, fixed and independently reread as resolved; Spec zero findings. Review scope was this run's source/requirement diff against 59dbb09, not a new whole-history review. |
| Documentation | docs-verify-fixed.log: zero errors, four existing Draft-ADR notices; bilingual zero errors/warnings/stale. docs-health-fixed.log: zero errors. diff-check.log passes. Final archive check is recorded in ACTIVE. |
| Cleanup | failed-inspector-cleanup.json confirms four owned paused inspectors exited. Final targeted process audit found no owned node/Code processes after verification. No user installation, secrets or pre-existing evidence touched. |

The agent inspected both native screenshots, found the fallback view too short in the first image, resized it using the real sash and re-ran the matrix. These screenshots establish only visible layout/state; assertions, debugger logs and file readback establish behavior. The original 1.139.1 debugger defect is not claimed fixed: the selected official isolated 1.105.1 environment satisfies genuine native F5, while 1.139.1 has separate installed-host evidence. Diagnosis and failed experiments remain in the [investigation](../archive/2026-09-27-wi-021-native-f5.md).

## Retained limits and resources

No paid model, external extension, release, sandbox, universal rollback or all-descendant cancellation claim follows. Streaming/trust gates remain Open pending their full formal decisions. Other WIs remain visible in ACTIVE.

Retain the evidence directory and its OWNERSHIP.txt. The official extracted host was moved, with no dependent process, to D:/Users/hex4c59/Temp/pi-vscode-delegated-f5-1.105.1-20260928 because bundled third-party README links polluted repository-wide documentation discovery. No checker was weakened; the original ZIP/hash and relocation record remain. Clean only the explicitly owned extraction after no future F5 verification needs it and all processes exit. Preserve unique logs/screenshots until no longer needed. Git remains uncommitted and unpushed.
