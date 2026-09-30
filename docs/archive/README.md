# Archive (non-authoritative history)

English | [中文](README.zh.md)

- Type: Reference
- Status: Accepted
- Authority: **historical context only**—superseded PRDs, WIs, spikes, and discussions

## Purpose

Move material here when it is **no longer active** but you want to keep an audit trail:

- Superseded `product-requirements.md` revisions (link from the current PRD).
- Closed WI write-ups that are too long for `ACTIVE.md` history.
- Abandoned spikes with lessons learned.

Do **not** implement from archive files. Agents treat archive as read-only background.

## Before moving a file

1. Note **why** it was superseded (one line at the top of the archived file or in an ADR).
2. Ensure the **current** truth lives in PRD (`Accepted`), architecture, gates, ADRs, or `ACTIVE.md`.
3. Prefer `YYYY-MM-DD-original-name.md` under `docs/archive/` (flat or subfolders by year).

## Contract history

- [Superseded Webview contract snapshot](2026-09-28-webview-contract-history.md): v1/v2, single-file first slice and old acceptance text retained as history; the current v3-only Living contract remains under reference.

## WI-022 investigation history

- [Background console investigation](2026-09-28-wi-022-background-consoles.md): superseded diagnostic history and abandoned source-build route; adopted CLI workaround evidence remains in the [discussion record](../discussions/2026-09-28-wi-022-background-consoles.md). WI closed by maintainer confirmation on 2026-09-28; see [WI-022 closure](2026-09-28-wi-022-closure.md).

## Closed WI index

Numbered lookup (closed WIs only) is in the [closed WI number index](2026-09-29-closed-wi-index.md). The table below catalogs archive files.

Gate/pending wording below retains each record's historical scope; final current status belongs to the WI-010 closure and ACTIVE, not those historical blockers.

| Record | Contents |
|--------|----------|
| [Closed WI number index](2026-09-29-closed-wi-index.md) | Compact WI-number lookup moved out of ACTIVE on 2026-09-29; open/paused items stay in ACTIVE |
| [WI-022 background-console closure](2026-09-28-wi-022-closure.md) | Maintainer-confirmed close of default CLI `--no-daemon` workaround; not an upstream Codex ADR/gate change |
| [WI-010 remaining boundaries / original Goal closure](2026-09-28-wi-010-goal-closure.md) | ADR0004/three gates, original queue mapping,671 tests/layered actual evidence, documentation/resources |
| [WI-008 model/readiness acceptance](2026-09-28-wi-008-model-acceptance.md) | Delegated acceptance, repairs, layered host evidence and retained scope limits |
| [WI-009 thinking acceptance](2026-09-28-wi-009-thinking-acceptance.md) | Delegated evaluation, actual659 matrices and660 host fixes; later WIs and broad gates remain separate |
| [WI-014 attachment acceptance](2026-09-28-wi-014-attachment-acceptance.md) | Delegated evaluation; actual F5/installed confirmation, capacity, UTF-8 bounds and short-window interaction; later WIs/gates remain separate |
| [WI-016 review acceptance](2026-09-28-wi-016-review-acceptance.md) | Delegated dirty/readonly capture/attribution/lifecycle acceptance; actual short-window fix and separate host reruns; WI-017/gates remain separate |
| [WI-017 session acceptance](2026-09-28-wi-017-session-acceptance.md) | Delegated continuity/history/recovery acceptance; actual trusted-default reset repair,663 package and layered host evidence |
| [WI-013 delegated acceptance](2026-09-28-wi-013-acceptance.md) | Scoped implementation, layered verification, ADR0002 acceptance and retained limits |
| [WI-013 superseded candidates](2026-09-28-wi-013-superseded-candidates.md) | Historical route and proposed contract, not current implementation authority |
| [Closed work-item history — WI-001–007 and WI-010–012](2026-09-21-closed-wi-history.md) | Closed scope, acceptance evidence and retained limits; WI-008/WI-009 were subsequently closed in their separate records |
| [WI-020 public entries and type contracts](2026-09-26-wi-020-public-entries.md) | Accepted September 26; P2 repair and technical evidence; other acceptance and gates unchanged |
| [WI-021 execution and native F5 closure](2026-09-27-wi-021-execution-closure.md) | September 27 UTC delegated scoped acceptance; native F5 and installed package separately verified; gates unchanged |
| [WI-019 formal chat closure](2026-09-27-wi-019-formal-chat.md) | Delegated Q16, shared production presentation, separate native F5/installed validation; other WIs/ADRs/gates unchanged |
| [WI-015 React/Vite acceptance](2026-09-27-wi-015-react-acceptance.md) | Delegated migration/ADR 0003 acceptance, added installed lifecycle evidence; gates remain Open |
| [WI-025 sidebar visual craft closure](2026-09-29-wi-025-active-superseded.md) | Maintainer F5 visual acceptance on 2026-09-29; approved scope, layered evidence and unverified installed/full-execution limits |
| [WI-026 editor settings closure](2026-09-29-wi-026-active-superseded.md) | Maintainer F5 visual acceptance on 2026-09-29; scheme A, implementation handoff and earlier checkpoints |
| [WI-027 UiText copy consolidation](2026-09-29-wi-027-ui-text.md) | Maintainer acceptance on 2026-09-29; attachment preview-failure and interaction chrome; F5 / VSIX outside |
| [WI-028 RPC and process policy](2026-09-29-wi-028-runtime-process.md) | Maintainer technical acceptance on 2026-09-29; RuntimeProcess seam, automated checks; Linux spike / F5 / VSIX outside |
| [WI-029 RPC runtime internal modules](2026-09-29-wi-029-rpc-runtime-modules.md) | Maintainer technical acceptance on 2026-09-29; three internal modules, automated checks; real pi / F5 / VSIX outside |
| [WI-030 OAuth and custom endpoint](2026-09-29-wi-030-oauth-endpoint.md) | Maintainer settings check 2026-09-29; live isolated VSIX/OAuth/endpoint recorded 2026-09-30; ADR 0005 Accepted |
| [WI-031 session-worker protocol](2026-09-29-wi-031-session-worker-protocol.md) | Maintainer technical acceptance on 2026-09-29; shared message validation, unchanged version; F5 / VSIX outside |
| [WI-032 delegated acceptance](2026-09-30-wi-032-macos-evaluation.md) | Six-entry rules, 139 focused tests and macOS smoke; closed under final delegation, native sensitive interactions unverified |
| [WI-033 delegated acceptance](2026-09-30-wi-033-macos-evaluation.md) | Captured real pi bytes through production reader/runtime; closed under final delegation, non-JSON ignore and native fault-path limits retained |
| [WI-034 delegated acceptance](2026-09-30-wi-034-macos-evaluation.md) | Packaging, real extracted RPC/gate, native F5 and isolated installed rendering; scoped close, not full product acceptance |
| [WI-035 delegated acceptance](2026-09-30-wi-035-macos-acceptance.md) | Exact-receipt handoff, actual F5/isolated installed and live-owner evidence; ADR 0006 Accepted with failure and scope limits |
| [WI-036 delegated acceptance](2026-09-30-wi-036-macos-acceptance.md) | Exact-child cleanup on owner loss; supervisor process evidence; ADR 0008 Accepted; window-crash F5/installed recorded 2026-09-30 |
| [WI-037 delegated acceptance](2026-09-30-wi-037-macos-acceptance.md) | Bounded thinking streaming and complete quoted credential redaction; actual macOS F5/isolated installed SSE evidence |
| [WI-039 delegated acceptance](2026-09-30-wi-039-macos-acceptance.md) | Installed VSIX runtime dependency closure (PACKAGE-01); unpacked import verification and isolated installed provider loading |
| [WI-038 delegated acceptance](2026-09-30-wi-038-macos-acceptance.md) | Cross-host endpoint write exclusion; two-window contention/serial-commit evidence; ADR 0007 Accepted |
| [WI-040 delegated acceptance](2026-09-30-wi-040-macos-acceptance.md) | Eight-card approval admission under concurrent preflight (CORE-01); insert-time recheck |
| [WI-041 delegated acceptance](2026-09-30-wi-041-macos-acceptance.md) | Session-worker request affinity and preview cursor invariants (CORE-02) |
| [WI-042 delegated acceptance](2026-09-30-wi-042-macos-acceptance.md) | Model-picker applied radio uses stable identity (UI-01) |
| [WI-043 delegated acceptance](2026-09-30-wi-043-macos-acceptance.md) | Model-popover Escape ignores consumed events (UI-02) |
| [WI-044 delegated acceptance](2026-09-30-wi-044-macos-acceptance.md) | Vite config classified as commit-check implementation input (TOOL-01) |
| [WI-045 delegated acceptance](2026-09-30-wi-045-macos-acceptance.md) | Missing review-path body and tooltip share one translation (UI-03) |
| [WI-046 delegated acceptance](2026-09-30-wi-046-macos-acceptance.md) | Diagnostic probe settlement and success evidence (RUNTIME-03/04/05) |
| [WI-047 delegated acceptance](2026-09-30-wi-047-macos-acceptance.md) | Endpoint write output budget before commit (ARCH-06) |
| [WI-048 delegated acceptance](2026-09-30-wi-048-macos-acceptance.md) | Failed default save does not apply the requested live model (ARCH-02 supplement) |
| [WI-049 delegated acceptance](2026-09-30-wi-049-macos-acceptance.md) | Packaging entry fails when required helpers or CSS are missing (ARCH-07) |
| [WI-050 delegated acceptance](2026-09-30-wi-050-macos-acceptance.md) | Uncollected `.spec.tsx` fails discovery (TOOL-02) |
| [WI-051 delegated acceptance](2026-09-30-wi-051-macos-acceptance.md) | Composer flags and FileSnapshot validators have no confirmed production mis-pair |
| [WI-052 delegated acceptance](2026-09-30-wi-052-macos-acceptance.md) | Startup, diagnostic, artifact and test/Git costs need no in-repo budget now |
| [WI-053 delegated acceptance](2026-09-30-wi-053-macos-acceptance.md) | Streaming publish and history preview costs do not justify optimization now |
| [WI-054 delegated acceptance](2026-09-30-wi-054-macos-acceptance.md) | Admission owners tabulated; busy flags stay separate (ARCH-01) |
| [WI-055 delegated acceptance](2026-09-30-wi-055-macos-acceptance.md) | Runtime optionals stay on one lifecycle; not split (ARCH-03) |
| [WI-056 delegated acceptance](2026-09-30-wi-056-macos-acceptance.md) | Shared model/Webview value objects kept; DTOs not copied (ARCH-04) |
| [WI-057 delegated acceptance](2026-09-30-wi-057-macos-acceptance.md) | Saved-default apply order extracted (ARCH-02); user-visible rules frozen |
| [WI-058 delegated acceptance](2026-09-30-wi-058-macos-acceptance.md) | Per-window recovery domains; ADR 0009 Accepted; dual-window F5/installed recorded 2026-09-30 |
| [WI-059 docs-only acceptance](2026-10-01-wi-059-acceptance.md) | Local plugin-inventory product boundary; Draft ADR 0010; no store/UI/load |
| [WI-060 host-store acceptance](2026-10-01-wi-060-acceptance.md) | Profile-scoped inventory file; damaged/too-large left unchanged |
| [macOS verification and personal-use acceptance](2026-09-30-macos-verification-acceptance.md) | Dual-window F5/installed, crash cleanup, ADR 0005 live OAuth/endpoint, personal-use PRD |
| [WI-036 approved proposal](2026-09-30-wi-036-approved-proposal.md) | Complete approved owner-loss exact-child scope; historical, no new Build authorization |
| [WI-057 approved proposal](2026-09-30-wi-057-approved-proposal.md) | Complete approved Saved-default apply encapsulation; historical, no new Build authorization |
| [WI-058 approved proposal](2026-09-30-wi-058-approved-proposal.md) | Complete approved per-window recovery-domain scope; historical, no new Build authorization |
| [WI-059 approved proposal](2026-10-01-wi-059-approved-proposal.md) | Complete approved inventory product-boundary scope; historical, no new Build authorization |
| [WI-060 approved proposal](2026-10-01-wi-060-approved-proposal.md) | Complete approved host inventory-store scope; historical, no new Build authorization |
| [WI-038 approved proposal](2026-09-30-wi-038-approved-proposal.md) | Complete approved concurrency scope; historical, no new Build authorization |
| [WI-039 approved proposal](2026-09-30-wi-039-approved-proposal.md) | Complete approved packaging scope; historical, no new Build authorization |
| [WI-040 approved proposal](2026-09-30-wi-040-approved-proposal.md) | Complete approved eight-card admission scope; historical, no new Build authorization |
| [WI-041 approved proposal](2026-09-30-wi-041-approved-proposal.md) | Complete approved parser-affinity scope; historical, no new Build authorization |
| [WI-042 approved proposal](2026-09-30-wi-042-approved-proposal.md) | Complete approved model-identity scope; historical, no new Build authorization |
| [WI-043 approved proposal](2026-09-30-wi-043-approved-proposal.md) | Complete approved consumed-Escape scope; historical, no new Build authorization |
| [WI-044 approved proposal](2026-09-30-wi-044-approved-proposal.md) | Complete approved Vite commit-check scope; historical, no new Build authorization |
| [WI-045 approved proposal](2026-09-30-wi-045-approved-proposal.md) | Complete approved missing-path localization scope; historical, no new Build authorization |
| [WI-046 approved proposal](2026-09-30-wi-046-approved-proposal.md) | Complete approved diagnostic-probe settlement scope; historical, no new Build authorization |
| [WI-047 approved proposal](2026-09-30-wi-047-approved-proposal.md) | Complete approved endpoint output-budget scope; historical, no new Build authorization |
| [WI-048 approved proposal](2026-09-30-wi-048-approved-proposal.md) | Complete approved failed-default-save scope; historical, no new Build authorization |
| [WI-049 approved proposal](2026-09-30-wi-049-approved-proposal.md) | Complete approved packaging required-asset scope; historical, no new Build authorization |
| [WI-050 approved proposal](2026-09-30-wi-050-approved-proposal.md) | Complete approved spec-naming constraint; historical, no new Build authorization |
| [WI-051 approved proposal](2026-09-30-wi-051-approved-proposal.md) | Complete approved interface-risk verification; historical, no new Build authorization |
| [WI-052 approved proposal](2026-09-30-wi-052-approved-proposal.md) | Complete approved resource/timeout measurement; historical, no new Build authorization |
| [WI-053 approved proposal](2026-09-30-wi-053-approved-proposal.md) | Complete approved ARCH-08 measurement; historical, no new Build authorization |
| [WI-054 approved proposal](2026-09-30-wi-054-approved-proposal.md) | Complete approved ARCH-01 inventory; historical, no new Build authorization |
| [WI-055 approved proposal](2026-09-30-wi-055-approved-proposal.md) | Complete approved ARCH-03 inventory; historical, no new Build authorization |
| [WI-056 approved proposal](2026-09-30-wi-056-approved-proposal.md) | Complete approved ARCH-04 inventory; historical, no new Build authorization |
| [WI-035 approved proposal](2026-09-30-wi-035-approved-proposal.md) | Complete approved scope and acceptance; historical, no new Build authorization |
| [WI-034 approved proposal](2026-09-30-wi-034-approved-proposal.md) | Original single-language ACTIVE proposal retained after close; no new Build authorization |
| [Frontend investigation and candidate proposals](2026-09-22-webview-framework.md) | Archived after WI-015/019 and ADR 0003 acceptance; retains interview, sources and candidate slices |

## Superseded handoffs

| Record | Contents |
|--------|----------|
| [ACTIVE completed-task compaction](2026-09-30-active-completed-compaction.md) | Closed focus checklist, per-WI delegated-acceptance table, closed audit/ARCH parking rows and duplicated completed-WI table moved out of ACTIVE on 2026-09-30; live limits stay in ACTIVE |
| [WI-033 stopped audit handoffs](2026-09-30-wi-033-audit-handoffs.md) | Original single-language ACTIVE checkpoints retained after the maintainer stopped the audit; not WI closure or renewed audit authorization |
| [WI-032 acceptance pending](2026-09-29-wi-032-pending-acceptance.md) | Preserved scope and historical checks after WI-033 priority; pending wording is historical, superseded by the [final delegated close](2026-09-30-wi-032-macos-evaluation.md) |
| [Pre-Goal handoffs superseded by workspace recovery](2026-09-22-pre-goal-handoffs.md) | Historical approvals/evidence; not a WI closure or current task ledger |
| [Goal frontend and attachment checkpoints](2026-09-22-goal-frontend-attachment-handoffs.md) | Executable WI-015 / WI-014 handoffs replaced by the next Goal slice; maintainer acceptance and gates remain open |
| [Goal change-review checkpoint](2026-09-22-goal-change-review-handoff.md) | WI-016 code/executable handoff replaced by session continuity; maintainer acceptance and gates remain open |
| [Goal session-continuity checkpoint](2026-09-23-goal-session-handoff.md) | WI-017 executable delivery and maintainer-requested pause; next implementation not started, acceptance and gates remain open |
| [WI-024 paused proposal](2026-09-28-wi-024-paused-proposal.md) | Provider/model configuration scope and pause-time handoff; maintainer F5 closure for WI-023 and WI-024 is at the top of the same file |
| [ACTIVE candidate and verification checkpoint history](2026-09-27-active-checkpoint-history.md) | Superseded entry narratives and preserved Chinese source; WI-019/021 acceptance, F5 blockers and pending decisions remain in ACTIVE |
| [WI-025 historical Build rounds and handoffs](2026-09-29-wi-025-active-superseded.md) | Full Build rounds 2–5, round-6 evidence and superseded handoffs; closure recorded at the top of the same file |
| [WI-026 superseded copy-deletion and research handoffs](2026-09-29-wi-026-active-superseded.md) | Scheme-A proposal, implementation handoff and earlier checkpoints; closure is at the top of the same file |

## Agent rule

If archive text conflicts with current authoritative docs, ignore archive and cite the live file.

At WI close or confirmed document replacement, the agent performs affected archival under [collaboration §7](../guides/agent-collaboration.md#7-agent-obligations), without a separate save/directory question. This is not permission for bulk history cleanup. Record archival reason, historical status and replacement link (or explain why no replacement exists). Preserve still-valid requirements and unresolved questions in active documents before moving; retain a summary/link at the former entry point. Move existing translations together, repair inbound and relative links and indexes, then run `npm run docs:verify` and `npm run docs:health`. Keep ADRs in `docs/decisions/` with status and replacement links. Age or length alone does not justify archival.

## Resolved investigations

- [Compatibility and old candidates](2026-09-22-pi-compatibility.md): preserves historical CF/Prepare states; accepted WIs and ADR0004 own current scope.
- [Representative extension research](2026-09-27-wi-013-target-research.md): public sources/version and original failures behind WI-013/ADR0002.
- [Native F5 diagnosis](2026-09-27-wi-021-native-f5.md): failed debugger route and official isolated-host selection; WI-021 is accepted.
