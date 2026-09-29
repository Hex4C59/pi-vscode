# Runtime adapter: one owned-process seam

English | [中文](2026-09-29-runtime-owner-seam.zh.md)

- Type: Discussion
- Status: WI-028 implementation; earlier design below superseded by the explicitly approved process-strategy plan
- Created: 2026-09-29
- Authority: **context only** — does not override [`ACTIVE.md`](../../ACTIVE.md), the PRD, or ADRs 0001–0004
- Related: [ADR 0002](../decisions/0002-interaction-contract-route.md) (owned-runtime recovery), [architecture](../architecture/vscode-extension-architecture.md)

## Background

An architecture review of `src/adapter/` (2026-09-29) found that `createPiRpcRuntime` in `src/adapter/runtime/pi-rpc-runtime.ts` supports two process modes and branches on `environment.owner` 21 times:

- **Owned** (production): `src/extension.ts` always passes a `RuntimeOwner`. Uncertain shutdown is marked unconfirmed and never auto-killed, as ADR 0002 requires.
- **Unowned**: the runtime spawns pi itself and, on stop or fault, sends SIGTERM then SIGKILL and treats shutdown as confirmed. No product path uses this. Only runtime tests and `scripts/spikes/spike-attachment.mjs` do.

Consequences: two stop semantics are interleaved in one 750-line closure; error copy is written twice; several tests (`session-runtime`, `attachment-transport`, `review-events`, part of `trusted-runtime`) verify a mode that does not ship; five hand-written fake child processes or owners exist across runtime tests. The ADR 0002 "abandon" sequence (disconnect, drain stdout/stderr, never close stdin) is repeated at `pi-rpc-runtime.ts:298-299`, `:360-362` and `launch-supervisor.ts:33-35`.

## Earlier confirmed design (superseded)

1. **Remove the unowned path.** `PiRpcRuntimeEnvironment.owner` becomes required. Delete the `spawn` injection, the runtime's `stopChildProcess`, and every `environment.owner` branch. Tests use an in-memory fake owner; production uses the real `RuntimeOwner`. Two adapters make this a real seam.
2. **Freeze production behavior.** Owned-mode behavior stays identical, including error copy, the clean-stop `end()` → `recover()` order, marking busy stops unconfirmed, and `shutdownUnconfirmed` blocking the next start. Any suspicious semantics found during the work is recorded separately, not changed in this slice.
3. **Recording.** Recorded while WI-027 is Build: design only, parking-lot entry, no new WI and no application-code change. Opening the WI requires an explicit maintainer request.
4. **Narrow the launch result.** `RuntimeOwner.launch` returns a `RuntimeLink` `{ stdin, stdout, onLost(cb), abandon() }` instead of a `ChildProcess`. The abandon sequence lives only in ownership. The runtime can no longer call `kill()`, so "no automatic termination" is enforced by the type.
5. **Owner decides how to release.** The runtime only judges whether a stop is clean and calls `RuntimeOwner.release({ clean }): Promise<{ confirmed: boolean }>`. The owner performs `end` → `recover` when clean and `abandon` otherwise. `end` and `recover` remain for the user's explicit End / Recover actions. The runtime keeps `shutdownUnconfirmed` and its copy.
6. **Spike.** `spike-attachment.mjs` supplies a small script-local owner that spawns pi directly; `end`/`recover` are no-ops and `abandon` drains output. The spike keeps verifying attachment framing and ACK timing, not ownership.
7. **Tests that assert direct kill.** `session-runtime.spec.ts:53`, `attachment-transport.spec.ts:50` and `:71` are rewritten to owned semantics (no kill, no `end`, runtime blocked, explicit recovery required), or deleted where `trusted-runtime.spec.ts` already covers the same owned scenario.
8. **One fixture.** `src/adapter/runtime/tests/fake-owner.ts` (non-spec helper) replaces the five fakes: scripted pi responses with per-type overrides/holds; recorded frames and `release`/`abandon`/`end`/`recover` calls; frame injection and link loss; deferred `launch`. Tests enter only through `createPiRpcRuntime`.
9. **Names.** `RuntimeLink`, `release({ clean })`, `abandon`. Implementation names only; no `CONTEXT.md` entry.
10. **Scope.** Only this candidate. Removing `PiRuntimeLifecycle.prompt()` and moving interaction types into `contracts/` stay separate (see below). The host (`src/extension/`) is untouched.
11. **Acceptance.** `npm run compile`, `npm run lint`, `npm test` with all owned-mode cases passing; one manual run of `scripts/spikes/spike-attachment.mjs`; maintainer F5 smoke covering start and send, clean replacement (profile or session switch), Stop during a task, End then Recover after an unconfirmed stop, and the recovery fence surviving window reload. No installed-VSIX acceptance: packaging manifest is unchanged.

## Evidence

- Production wiring: `src/extension.ts:10-11` (`createRuntimeOwner` → `createPiRpcRuntime({ owner })`). The host never calls `RuntimeOwner` directly; all four methods are reached through the runtime.
- Unowned-only consumers: `src/adapter/runtime/tests/{attachment-transport,session-runtime,review-events,trusted-runtime}.spec.ts`, `scripts/spikes/spike-attachment.mjs:43`.
- Existing fakes: `trusted-runtime.spec.ts:8-61`, `runtime-cancellation.spec.ts:9-43`, plus fake `spawn` in the three other runtime specs.

## Other review findings (not confirmed; no decision)

Recorded so a later review does not rediscover them from scratch:

- `createPiRpcRuntime` could be split internally into request/response correlation, frame translation and task busy state; "idle / can send" is defined four times (`stop`, `checkpointRestart`, `prompt`, `preparePrompt`). Easier after this slice.
- Session worker protocol (request types, limits, validators) is duplicated between `sessions/pi-session-backend.ts` and `sessions/sessionWorker.ts`, with drift (history page size literal `32` vs `HISTORY_PAGE_SIZE`).
- Credential-pattern regexes are copied six times across `src/adapter/runtime/` and `src/extension/`, with drift (`activityProjection.ts` redaction lacks `authorization` and private-key patterns).
- Ownership control messages (`initialize`, `spawned`, control request/response) are hand-validated on both sides; `control-protocol.ts` only owns the socket path.
- `PiRuntimeLifecycle.prompt()` is unused by the production host (`src/extension/tests/harness.ts:132-137` still uses it); eight lifecycle methods are optional although production implements all.
- `pi-rpc-runtime.ts:5` and `rpc-dialogs.ts:1` import types from `src/extension/interactions/`, not `contracts/`.
- SIGTERM → SIGKILL helpers exist four times; some wait for `close`, others for `exit`. ADR 0002 distinguishes the two, so any merge must keep that distinction.

## Earlier leaning (historical)

Design settled for a later technical WI. When opened, update the adapter row of the architecture doc if the `RuntimeOwner` shape is described there. No ADR: this removes an unshipped mode and narrows an internal seam to enforce ADR 0002; it does not change trust, hosting or recovery semantics.

## Current WI-028 decision and evidence

The maintainer explicitly requested implementation of the complete process-strategy plan in this session. This supersedes items 1, 4–6 and 10–11 of the earlier design: `PiRpcRuntimeEnvironment.process` is mandatory; `RuntimeOwner` remains unchanged behind a managed strategy; an explicit direct strategy remains available for the Linux attachment spike. The production entry composes the managed strategy. All strategies use the production five-second RPC Stop observation budget, as separately confirmed by the maintainer. Strategy-owned failure text replaces owner branches in RPC. The shared memory process replaces the ordinary fake child fixtures; native process policy tests and managed/RPC composition tests remain separate.

WI-027 was already implemented with automated evidence but awaited maintainer closure. Its proposal and pending confirmation are preserved in ACTIVE while WI-028 becomes the one current work item. Decision: none; no new product scope, protocol, persistence, dependency or architecture-gate acceptance.

| Architecture dimensions | Assessment | Evidence / remaining limit |
|---|---|---|
| 1–5: decomposition, interface, dependencies, contract, ownership | pass | Required RuntimeProcess and narrow RuntimeLink; managed/direct policies own process cleanup; production graph excludes direct/tests. |
| 6–11: scope, identities, state, concurrency, failure, lifecycle | pass at automated tier | Existing RPC tests plus process-strategies and runtime-cancellation cover five-second Stop, deferred launch, the resolved-before-attach gap, serialized release, failure barriers and deliberate recovery. |
| 12–15: security, persistence, privacy, bounds | preserved | ADR0002 fence/receipt owner unchanged; no new UI capability, raw stderr projection or retry; bounded direct shutdown. |
| 16–18: tests, build, compatibility | automated evidence; runtime gap | Current commands/results in ACTIVE; Linux-isolated attachment probe cannot run on this Mac. No package/version/schema change. |
| 19: UX/accessibility | N/A for this technical slice | Production user-visible semantics unchanged; F5 and installed-VSIX were not performed. |

Maturity: implemented with automated regression evidence; no new real-pi, host or installed-package acceptance. Compile/lint/test and documentation checks are reported with actual results in ACTIVE. The spike verification bundle is built separately; that is not execution of its Linux-isolated probe.
