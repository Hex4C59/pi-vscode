# WI-035: Approved Leftover-Runtime Handoff Scope

English | [中文](2026-09-30-wi-035-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-035 implementation and required evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-035-macos-acceptance.md), [ADR 0006](../decisions/0006-owned-runtime-handoff.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

The maintainer requested the parking-lot leftover-runtime handoff first on 2026-09-30, approving WI-035 Build. Later they explicitly chose agent acceptance and promotion of ADR 0006 under this delegation. The WI traces REQ-005/REQ-006; it neither accepts the entire Draft PRD nor changes a gate. No Git commit or push was authorized. Required native platform: macOS VS Code; Windows native F5/installed checks are outside this acceptance scope.

## Goal and Scope

When a recovery domain records an owned run left behind by a lost host, the next host ends it, waits for real terminal evidence, retires the fence, and shows the normal empty conversation/no-folder page without the yellow recovery banner or two End/Recover actions.

Include ownership's observe-only control and handoff decisions; the managed process/runtime lifecycle capability; startup coordination; focused tests; bilingual ADR/architecture/message-contract synchronization; macOS actual F5 and fresh isolated installed-VSIX evidence.

Exclude Webview protocol and preview fixtures, `errorCode` rendering, changes to ADR 0002's shared single-runtime restriction, independent per-window domains, and the existing in-session Stop/protocol-fault recovery path. Do not resume the stopped assertion-by-assertion test audit.

## Architecture and Safety Check

| Dimension | Required behavior | Limit |
|---|---|---|
| Modules, interfaces, dependencies, owners | Observation belongs to control-client; decisions to runtime-owner; managed-process and host lifecycle delegate | No renderer DTO or reversed dependency |
| Requirements, state, concurrency, cleanup | Only owner-lost may be automatically ended; owned remains untouched; retirement requires exact receipts | Exclusive retirement permits one writer, not success for all windows; a losing host rereads an empty domain |
| Security and observability | Bounded control exchange, exact shape/run validation, honest invalid/unreachable results | No clear-unknown or arbitrary-PID bypass |
| Tests, compatibility, delivery | Decision table, observe-without-end, busy/serialization and host startup regressions | Native unreproduced branches retain automated-only evidence |
| Storage and presentation | Unchanged recovery-v1 schemas; normal startup has no recovery banner | Unresolved retained work keeps explicit recovery |

## Acceptance Criteria

1. Normal leftover: next activation has no recovery banner; exact previous child exits with a matching receipt; fence retires; a resource choice starts one new runtime.
2. Live-owner safety: another window's run and PIDs remain unchanged before/after this window opens; this window sends no end request.
3. Honest failure: unconfirmed exit, unreachable supervisor or corrupt storage retains the fence and explicit recovery page; recovery still requires terminal evidence.
4. No regression: in-session Stop/protocol uncertainty unchanged; compile, lint, full tests, documentation verification, bilingual check, documentation health and whitespace checks pass.
5. Native evidence: actual macOS F5 and fresh isolated installed-VSIX handoff recorded separately. Do not claim a native no-receipt branch reproduction.

## Subsequent Limits

Activation means provider construction through the Pi view, not unconditional VS Code application launch. WI-036's separate-domain/owner-loss cleanup candidates remain parking-lot-only. Initial native setup/tool failures are diagnostic history, not acceptance passes; the acceptance record discloses actual workspace selection, installed provider warning and cleanup method.
