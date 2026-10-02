# WI-079 parallel dispatch preparation

English | [中文](2026-10-02-wi079-parallel-dispatch.zh.md)

- Type: Discussion
- Status: Local implementation verified; publication authorized, remote merge pending
- Created: 2026-10-02
- Scope: Dispatch preparation for the existing WI-079, not another product WI

> Superseded workflow (2026-10-02): the maintainer subsequently requested single-agent work and consolidation onto master. The assignments and isolation rules below are historical; follow the current [collaboration guide](../guides/agent-collaboration.md).

## Authorization and baseline (initial preparation)

The maintainer requested starting multi-agent work. The coordinator created three dedicated branches/worktrees from `origin/master` at `8fcc943a20b6893a9dba3f6184e154fd4914b95d`. The existing [WI-079](../../ACTIVE.md) remains the only product work item. This record does not authorize commits, history changes, pushes or PRs.

The primary checkout has an uncommitted `ACTIVE.md` change and `src/webview/tests/session-usage-roundtrip.spec.ts`, associated with the interrupted chat **持续推进 ACTIVE 队列**. Its owner previously intended to implement the same adapter, host and UI slice. Being idle is not an ownership handoff. None of those files are copied, staged or modified here. The new agents perform read-only preparation until the maintainer resolves ownership; no product implementation or acceptance is claimed.

## Assigned task sheets

Each agent receives its own task sheet; [collaboration](../guides/agent-collaboration.md) remains the authoritative template. Worktree paths below are relative to the primary repository directory.

| Owner | Branch | Worktree | Current exclusive assignment |
|---|---|---|---|
| Coordinator | `codex/wi079-parallel-plan` | `../pi-vscode-worktrees/wi079-parallel-plan` | This bilingual record and its bilingual discussion-index entries; host/contract sequencing review |
| Adapter planning agent | `codex/wi079-adapter-plan` | `../pi-vscode-worktrees/wi079-adapter-plan` | Read `src/adapter/**`; report exact future write paths, public-RPC seam, failure scenarios and E2E evidence plan; no edits |
| UI planning agent | `codex/wi079-ui-plan` | `../pi-vscode-worktrees/wi079-ui-plan` | Read `src/webview/**`; report exact future write paths, mounted-production E2E plan and contract dependencies; no edits |

All sheets use the same committed base, prohibit dependency installs and Git history changes, exclude the primary checkout and other agents' uncommitted work, and require reports separating verified facts from planned checks. The coordinator alone writes this record; no agent writes `ACTIVE.md`, the protocol, lifecycle interface, provider or lockfiles during preparation.

## Landing order after ownership handoff

1. Confirm the previous task owner releases WI-079 implementation ownership. If retaining its red test or handoff is necessary, ask its owner to publish an explicitly authorized baseline; do not copy uncommitted files. Confirm the integration/commit permissions separately.
2. Assign a single writer for the runtime lifecycle interface, Webview DTO and inbound/outbound validation. Review the approved WI-079 Outline and freeze the smallest compatible contract before consumer implementation. Serial changes to shared contracts do not become parallel by putting them in different worktrees.
3. Issue fresh implementation task sheets with exact disjoint file lists. Adapter and UI implementations may then run in parallel against a committed contract baseline. The host provider remains coordinator-owned; the original red test has no new writer until ownership is resolved.
4. Enumerate failure scenarios and observe targeted behavior tests failing before implementation. Produce repeatable E2E artifacts; synthetic mounts do not establish real pi, browser, F5 or installed-VSIX acceptance.
5. Obtain authorization before combining committed changes into the coordinator's task branch. Never integrate through local `master`, another worktree's uncommitted code or a force-push. Refresh only with the applicable Git permission, rerun affected checks and the PR-base gate, and retain candidate/base identities.

## Preparation checks and remaining risk

Both planning agents completed their read-only reports and were closed. Their worktrees remain clean and reserved for a potential explicitly assigned follow-up; they are not active product writers.

### Proposed future write ownership

These are proposals, not permission to edit. All unlisted files remain out of scope; existing shared helpers are read-only unless explicitly reassigned.

- Adapter: `src/adapter/runtime/pi-rpc-runtime.ts`; new `src/adapter/runtime/rpc/session-usage.ts` and `src/adapter/runtime/rpc/tests/session-usage-transport.spec.ts`.
- UI composition: `src/webview/chat/candidate.tsx`, `src/webview/chat/composer/message-composer.tsx`; new `src/webview/chat/composer/session-usage-panel.tsx` and `src/webview/chat/composer/session-usage-panel.css`.
- UI projection/client: `src/webview/client/types.ts`, `src/webview/client/client-state.ts`, `src/webview/client/parse-host-message.ts`, `src/webview/client/webview-client.ts`.
- UI presentation/evidence: `src/webview/i18n/ui-text.tsx`, `src/webview/i18n/ui-zh-cn.ts`, `src/webview/styles.css`; new `src/webview/tests/session-usage-mounted.spec.ts`.
- Coordinator proposal: lifecycle interface and exported types, Webview DTO/validators, host provider/refresh owner and integration records. Exact additional host-module paths must be assigned before implementation. No writer is assigned to the previous owner's uncommitted roundtrip spec.

### Failure-first evidence plan

The adapter proposal uses existing request correlation and idle/session fences, not generic RPC. A named usage capability would validate conversation identity around public RPC reads and share one total five-second deadline. Before implementation, the transport E2E should fail on wrong identity, busy transitions, replacement/disposal, malformed or nonfinite/negative numbers, nullable context, unknown zero-cost pricing, deadline/connection failure and late replies. Exercise the real runtime entry through JSONL with only the process transport substituted; retain a proposed `dist/wi079-session-usage/adapter-report.json` with actual per-case outcomes and cleanup.

The UI proposal reuses composer popup coordination and mounts production `mountChat` through its real client/parser. Before implementation, the mounted E2E should fail on current/cumulative confusion, unknown-to-zero coercion, unsafe extra fields, stale revisions, repeated refresh, replacement, unavailable states, lost drafts/focus, conflicting popups and accidental sends. Retain a proposed `dist/wi079-session-usage-ui/mounted-report.json`. Browser width/theme/language checks and real pi/F5/installed-VSIX checks remain separate coordinator-owned evidence, not implied by jsdom or synthetic transport.

The coordinator must settle numeric bounds, required-invalid versus nullable policy, reset/revision rules, busy admission and conservative pricing interpretation in the shared contract before these implementations. The package pins pi `0.86.1`; the read-only sibling source reports `0.87.1` and its public commands documentation has moved. That newer source is not evidence of the pinned version's behavior. Fresh planning worktrees have no installed dependencies; no packages were installed or lockfiles changed.

The committed base passes the explicit-snapshot PR ancestry check. `npm run docs:verify` before and after this record produces identical output: eight existing missing links to ignored WI-035 native artifacts in its bilingual archive. No new documentation diagnostics were introduced; the overall check still fails. `git diff --check` passes. No product tests or runtime checks ran for this preparation, and none are reported as new passes.

The remaining decision is whether this coordinator should take over WI-079 from **持续推进 ACTIVE 队列**. Until that handoff is explicit, the prepared worktrees are not concurrent product writers. After handoff, replace planning assignments with implementation sheets rather than treating this historical record as standing ownership authority.

## Confirmed handoff and independent-task checkpoint

The maintainer subsequently confirmed both WI-079 takeover and replacing WIP=1 with at most three independent tasks. The previous chat was notified under that authorization and confirmed stopping WI-079 writes and automatic queue promotion, leaving the primary checkout untouched. This supersedes the pending ownership/single-WI scheduling statements above, not their evidence limits. Concurrency approval is not blanket Build approval for the parking lot and does not authorize commits, history changes, pushes or PRs.

Three different jobs ran: the coordinator implemented bounded-parallel policy and compatible documentation checks; Dirac audited ancillary single-WI assumptions; Curie assessed independent candidate tasks outside WI-079. Each used its own branch/worktree. The audit agents remained read-only, returned their reports and were closed. Their clean worktrees are retained for explicit same-task follow-up, not active product writers.

The coordinator's sole write scope is bilingual AGENTS/collaboration, ACTIVE registry, this record/index, document entry routing and the documentation-health skill, the PRD/gate scheduling sentences, `scripts/docs/docs-verify-lib.mjs` and new `scripts/docs/parallel-active.spec.mjs`. The shared kernel, product behavior, dependency manifests/lockfiles, other worktrees and primary changes remain excluded. No template or sibling repository is updated.

### Failure-first validation and findings

The ancillary audit confirmed that the existing docs verifier hardcoded a single current WI and could skip PRD checking after a registry migration. The implementation retains legacy input compatibility while validating the new registry: at most three unique execution slots, unique IDs and declared branch/worktree pairs, valid owners/phases, registered inline WI proposals and each Build WI's PRD assessment/traceability. It does not validate actual executor processes, path aliases, approvals' semantic adequacy or real Git ownership.

Before implementation, three real CLI fixture suites failed on `active-current-boundary`, after fixing fixture-only language switchers. Before tightening validation, the missing-header case incorrectly passed; it was observed failing before that fix. The completed CLI suites cover nineteen valid/invalid scenarios, including a second Build WI with pending/missing PRD traceability, and preserve ACTIVE input. The generated development artifact is `out/work/parallel-active/cli-report.json`. This exercises the real docs CLI against isolated synthetic repositories, not product behavior or real VS Code.

Twenty-five targeted docs/i18n/health/legacy/parallel tests pass. `git diff --check` passes. `docs:verify` and `docs:health` still fail only on the eight existing WI-035 missing artifact links (sixteen combined duplicate diagnostics); Draft ADR 0010 warnings remain, and ACTIVE exceeding the 180-line guidance adds a size warning. The new ACTIVE/PRD gate reports no errors. `npm test` was attempted but cannot start because this worktree has no installed `esbuild`; dependencies were not installed, and the full application suite is not a pass. All results are uncommitted development evidence at base `8fcc943a20b6893a9dba3f6184e154fd4914b95d`, not clean committed-candidate acceptance.

### Independent next-task candidates

The selection audit recommends WI-079 plus a read-only PR-base evidence audit and a separate PI-GAP-20 whole-reply-copy Prepare. Neither additional task has started Build. The PR-base audit needs no product write scope; a future scoped report would be its only output. Reply-copy Prepare can inspect conversation/clipboard behavior independently, but a future implementation would touch the same UI translation files as WI-079; serialize their ownership before Build. Do not invent cleanup or reopen completed DOC-NAV/DOC-ORG work to fill slots.

WI-079 remains recorded as approved but not executing: the old red test/handoff is still uncommitted in the primary checkout. Its ownership is now clear, but its publication/integration permissions are not. Publish an authorized baseline or explicitly choose an implementation that does not depend on those uncommitted files; do not transfer them as a shortcut. This concurrency change is currently prepared only in the coordinator's dedicated worktree, not committed or enabled on remote `master`. New editing agents must not import its uncommitted policy/code as their baseline.

## Publication authorization and verification checkpoint

On 2026-10-02 the maintainer explicitly authorized committing, pushing and merging this configuration through a PR. That authorization does not include migrating or publishing WI-079's primary-checkout changes, rewriting history, force-pushing, bypassing protection or deleting other tasks' resources. The previous pending-publication statements above describe the earlier checkpoint; remote activation still requires a successful normal PR merge and its receipt.

Dependencies were installed in this task worktree with `npm ci --ignore-scripts --no-audit --no-fund`; neither manifest nor lockfile changed. A subsequent full `npm test` run passed all 1174 tests, including the new CLI scenarios. The earlier missing-esbuild result is retained as historical setup evidence, not the final test result. Documentation diagnostics were compared to an untouched Git archive of base `8fcc943a20b6893a9dba3f6184e154fd4914b95d`: the same eight archive artifact links fail, with the separately reported ACTIVE-size warning. No unrelated archived evidence or ADR status was changed.

Use separate implementation, policy-documentation and `docs(active)` commits. Preserve exact candidate/base IDs and clean-source checks in the task artifacts/PR evidence, rerun the PR-base gate immediately before push, and require normal GitHub protection for merge. Do not present successful local tests as all CI checks or product/runtime/native acceptance. The primary checkout remains untouched and may still contain stale scheduling rules until its owned changes are safely handed off.
