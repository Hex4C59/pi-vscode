# WI-029 — RPC runtime internal modules

English | [中文](2026-09-29-wi-029-rpc-runtime-modules.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-29
- Authority: historical WI-029 scope, implementation handoff and maintainer close; current work is [`ACTIVE.md`](../../ACTIVE.md)

## Closure — 2026-09-29

The maintainer explicitly accepted the WI-029 outcome in this conversation. This closes the approved technical split of `createPiRpcRuntime` into three internal modules. No new ADR or architecture gate was involved. The PRD remains Draft; this slice added no requirement.

The close covers the recorded automated checks and the maintainer's technical acceptance. It does not establish real pi, F5 or installed-VSIX behavior, and it does not authorize a commit or push. WI-028 stays parked with implementation complete and maintainer acceptance still pending.

### Final approved proposal moved from ACTIVE

Continue from the process-strategy split already in the worktree. Keep `PiRuntimeLifecycle`, host call sites and user-visible behavior unchanged. Add three concrete modules under `src/adapter/runtime/` and do not add a generic framework or host API:

1. **Request pairing** owns request identities, pending replies, dispatch, timeouts and cleanup. It recovers the pauseable remaining startup budget; several incomplete dialogs do not resume, and remaining time resumes only after the last reply write completes. Ordinary prompt ACK timeouts, identified extension commands without a human-wait ACK timeout, and existing request-validation differences stay. Write callback, backpressure and the one-attempt send token stay with send orchestration.
2. **Frame translation** owns JSONL parse, classification, `ActivityProjection` and ordered `RuntimeEvent` mapping. It does not access the subprocess, write streams or run approval callbacks. Ordinary event mapping is testable from JSON without a runtime process.
3. **Task occupancy** owns named transitions for send, ACK, extension-command, agent, Stop, dialog and approval occupancy. Send admission, restart checks, release classification and Stop completion share this state without collapsing into one `isIdle`. Task end and ACK arrival stay independent; ending an extension command is not agent settlement.

`pi-rpc-runtime.ts` remains the orchestrator. The five-second Stop budget, revoke-then-cleanup on connection loss and isolation of stale connection results stay. Decision: none.

### Implementation handoff moved from ACTIVE

The three modules are `rpc-replies.ts`, `rpc-frames.ts` and `rpc-occupancy.ts`; they are not exported from the runtime public entry. Architecture English and Chinese runtime-responsibility text was updated in the same change. Agent checks: compile, lint, npm test (764/764; baseline 746 plus 18 process-free module tests, including the production dependency graph), docs:verify and git diff --check. No behavior defect was recorded separately. Real pi, F5 and installed VSIX were not run. No paid model calls, commit or push.

## Replacement reason

ACTIVE compaction after maintainer close. Current runtime owners remain in the [architecture](../architecture/vscode-extension-architecture.md) RPC process-strategy section.
