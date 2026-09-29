# WI-028 — Separate RPC runtime from process policy

English | [中文](2026-09-29-wi-028-runtime-process.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-29
- Authority: historical WI-028 scope, implementation handoff and maintainer close; current work is [`ACTIVE.md`](../../ACTIVE.md)

## Closure — 2026-09-29

The maintainer explicitly accepted the WI-028 outcome in this conversation. This closes the approved split of RPC orchestration from process strategy. No new ADR or architecture gate was involved; ADR 0002 remains the hosting/recovery authority. The PRD remains Draft; this slice added no requirement.

The close covers the recorded automated checks and the maintainer's technical acceptance. It does not establish Linux-isolated attachment-spike execution, F5 or installed-VSIX behavior, and it does not authorize a commit or push. WI-027 stays parked pending maintainer close.

### Final approved proposal moved from ACTIVE

Required `RuntimeProcess` (`launch` / `release` / `inspect` / `end` / `recover`), with managed, direct and in-memory test implementations. Production entry and the attachment spike migrate to explicit strategies; owner/spawn branches leave the RPC runtime.

RPC uses one five-second Stop observation budget. Managed uncertain work must not end automatically; idle cleanup keeps end → recover. Interface and concurrency/lifecycle evidence is in the [discussion](../discussions/2026-09-29-runtime-owner-seam.md) WI-028 section. Decision: none; follow ADR 0002. No pi, protocol or storage upgrade; no commit.

### Implementation handoff moved from ACTIVE

`createPiRpcRuntime` holds only stdin / stdout / loss subscription. Production composes the managed strategy; the attachment spike selects the direct strategy explicitly. Strategies own cleanup and recovery barriers. Ordinary tests share the in-memory connection; native-strategy and production-composition tests are separate, including the cancel gap after launch returns and before attach. Agent checks at implementation: compile, lint, npm test (746/746, including the production dependency graph), docs:verify, docs:health, git diff --check, `spike-attachment --build` and script syntax. Existing operations-preview cases printed two `Node is not defined` jsdom diagnostics; all tests passed. Webview was not changed. Linux-isolated spike, F5 and installed VSIX were not run. No new real-pi or model evidence. No commit or push.

Later the same day, WI-029 extracted three internal RPC modules on top of this seam; that close is recorded separately.

Current owners remain in the [architecture](../architecture/vscode-extension-architecture.md) RPC process-strategy section.

## Replacement reason

ACTIVE compaction after maintainer close. The discussion record stays as investigation history, not current-work authority.
