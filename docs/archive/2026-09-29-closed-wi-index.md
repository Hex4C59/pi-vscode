# Closed work-item number index

English | [中文](2026-09-29-closed-wi-index.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-29
- Authority: historical lookup only; current work remains in [`ACTIVE.md`](../../ACTIVE.md)

## Replacement reason

On 2026-09-29 the maintainer asked to compact ACTIVE. The completed-WI table had grown into a session-entry catalog. Numbered lookup belongs here; ACTIVE keeps a short pointer and the most recent closed row. Compaction itself did not close WI-023/024/026, change gates or ADRs, or authorize commits. Later the same day the maintainer confirmed F5 visual acceptance for those three, and their rows are in the table below.

Early rows that still say a gate is Open are snapshots at that WI's acceptance date, not current status. All six architecture gates are Accepted; see ADR 0001 and ADR 0004.

## How to use this index

Open the linked record for scope, evidence and limits. Do not implement from this table. File-oriented archive listings remain in the [archive README](README.md).

## Closed WI lookup

| WI | Result | Closed / accepted | History |
|----|--------|-------------------|---------|
| WI-001 | Extension shell, secondary sidebar and RPC probe; ADR 0001 | 2026-09-19 | [record](2026-09-21-closed-wi-history.md) |
| WI-002 | Versioned ping/pong Webview bridge | 2026-09-19 | [record](2026-09-21-closed-wi-history.md) |
| WI-003 | Project-trust technical spike; gate still Open in that snapshot | 2026-09-19 | [record](2026-09-21-closed-wi-history.md) |
| WI-004 | REQ-004 minimal streaming chat; gate still Open in that snapshot | 2026-09-21 | [record](2026-09-21-closed-wi-history.md) |
| WI-005 | Documentation-health phase one | 2026-09-19 | [record](2026-09-21-closed-wi-history.md) |
| WI-006 | Workspace and project-resource selection UI | 2026-09-21 | [record](2026-09-21-closed-wi-history.md) |
| WI-007 | Start pi RPC from the resource choice | 2026-09-21 | [record](2026-09-21-closed-wi-history.md) |
| WI-008 | Model selection / ready, fault / approval / Stop, safe auth errors and required host fixes | 2026-09-28 Asia/Shanghai, agent under that delegation; WI-009 and broad gates not auto-closed | [record](2026-09-28-wi-008-model-acceptance.md) |
| WI-009 | Thinking capability / next-turn intent, approval / Stop / exit recovery, keyboard focus and short-window error repair | 2026-09-28 Asia/Shanghai, agent under that delegation; full REQ and broad gates not auto-closed | [record](2026-09-28-wi-009-thinking-acceptance.md) |
| WI-010 | Thinking / controlled tools / Stop; four F5 checks; limited slice closed, ADR pending / gate Open in that snapshot | 2026-09-21 | [record](2026-09-21-closed-wi-history.md) |
| WI-010 remaining / original Goal | Remaining three gates, ADR 0004, Living contract, layered actual verification and global close | 2026-09-28 Asia/Shanghai, agent under that delegation | [record](2026-09-28-wi-010-goal-closure.md) |
| WI-011 | Owner-local test move, recursive runner and scripts grouping; limited technical slice | 2026-09-22 | [record](2026-09-21-closed-wi-history.md) |
| WI-012 | Minimal P1–P3 probe slice closed; P3 / full compatibility gaps retained, not product acceptance | 2026-09-22 | [record](2026-09-21-closed-wi-history.md) |
| WI-013 | Trusted extension loading, standard interaction, tool approval and own-runtime recovery; ADR 0002 Accepted | 2026-09-28 Asia/Shanghai, agent under that delegation; broad gates stayed Open in that snapshot | [record](2026-09-28-wi-013-acceptance.md) |
| WI-014 | Explicit file / selection mixed attachments, per-item confirm, full preview / history / capacity recovery and missing hints | 2026-09-28 Asia/Shanghai, agent under that delegation; review / session and broad gates not auto-closed | [record](2026-09-28-wi-014-attachment-acceptance.md) |
| WI-015 | React / TypeScript / Vite migration acceptance; ADR 0003 Accepted | 2026-09-27 UTC, agent under that delegation; broad gates stayed Open in that snapshot | [record](2026-09-27-wi-015-react-acceptance.md) |
| WI-016 | Controlled dirty protection / accurate readonly history diff, paging and loss recovery; short-window clip red-to-green | 2026-09-28 Asia/Shanghai, agent under that delegation; WI-017 and broad gates remain separate | [record](2026-09-28-wi-016-review-acceptance.md) |
| WI-017 | Current project / CLI-origin sessions, ordered handoff, verbatim history and exception recovery; trusted default-reset red-to-green | 2026-09-28 Asia/Shanghai, agent under that delegation; broad gates remain separate | [record](2026-09-28-wi-017-session-acceptance.md) |
| WI-019 | Q16 delegated evaluation, shared production chat, live overlay / resource fixes and separate F5 / install acceptance | 2026-09-27 UTC, agent under that delegation; ADR / gates not auto-closed | [record](2026-09-27-wi-019-formal-chat.md) |
| WI-020 | Cross-module public entries and module type contracts; the only P2 was fixed, dual-axis review found none | 2026-09-26 maintainer technical acceptance; ADR / gate unchanged | [record](2026-09-26-wi-020-public-entries.md) |
| WI-021 | REQ-004 retry / compaction / reliable terminal state and required focus-fallback repair; native F5 / install verified separately | 2026-09-27 UTC, agent under that delegation; gates unchanged | [record](2026-09-27-wi-021-execution-closure.md) |
| WI-022 | Windows background console flash; default CLI `--no-daemon` workaround; maintainer confirmed closed | 2026-09-28 maintainer confirmed resolved | [record](2026-09-28-wi-022-closure.md) |
| WI-023 | Settings layout and model picker visible; maintainer F5 visual acceptance. The only recorded remainder was this F5 check | 2026-09-29 maintainer confirmed; installed VSIX is outside this evidence | [record](2026-09-28-wi-024-paused-proposal.md) |
| WI-024 | In-extension API key and default model; maintainer F5 visual acceptance of the settings section, Add key and model-picker recovery | 2026-09-29 maintainer confirmed; OAuth, custom endpoints, paid calls and installed VSIX stay outside | [record](2026-09-28-wi-024-paused-proposal.md) |
| WI-025 | Sidebar visual craft, setup-phase corrections and pre-start thinking level; maintainer F5 visual acceptance | 2026-09-29 maintainer confirmed; VSIX / full real-model chain is outside this evidence | [record](2026-09-29-wi-025-active-superseded.md) |
| WI-026 | Editor-area settings page, scheme A; maintainer F5 visual acceptance | 2026-09-29 maintainer confirmed; installed VSIX is outside this evidence | [record](2026-09-29-wi-026-active-superseded.md) |
| WI-027 | Recollect attachment preview-failure and interaction copy into UiText; maintainer accepted the presentation slice | 2026-09-29 maintainer confirmed; F5 / installed VSIX outside this slice | [record](2026-09-29-wi-027-ui-text.md) |
| WI-028 | Separate RPC runtime from process policy; maintainer technical acceptance | 2026-09-29 maintainer confirmed; Linux-isolated spike / F5 / installed VSIX outside this evidence | [record](2026-09-29-wi-028-runtime-process.md) |
| WI-029 | RPC runtime split into request pairing, frame translation and task occupancy; maintainer technical acceptance | 2026-09-29 maintainer confirmed; real pi / F5 / installed VSIX outside this evidence | [record](2026-09-29-wi-029-rpc-runtime-modules.md) |
| WI-030 | OAuth sign-in and one OpenAI-compatible endpoint; maintainer completed the remaining settings check | 2026-09-29 maintainer confirmed; live browser login, live endpoint call and a new installed VSIX are outside this close | [record](2026-09-29-wi-030-oauth-endpoint.md) |
| WI-031 | Shared session-worker message validation; protocol version and user-visible behavior unchanged; maintainer technical acceptance | 2026-09-29 maintainer confirmed; F5 / installed VSIX were outside this slice | [record](2026-09-29-wi-031-session-worker-protocol.md) |
| WI-032 | Shared host credential rules across six entries; scoped technical acceptance | 2026-09-30 agent under final maintainer delegation; native sensitive interactions remain unverified | [record](2026-09-30-wi-032-macos-evaluation.md) |
| WI-033 | Runtime-frame validation and captured-real-pi byte injection; non-JSON ignore rule retained | 2026-09-30 agent under final maintainer delegation; not live native malformed-frame injection | [record](2026-09-30-wi-033-macos-evaluation.md) |
| WI-034 | Deterministic VSIX packaging, extracted RPC/gate and native macOS F5/isolated installed activation | 2026-09-30 agent under final maintainer delegation; not full REQ-009 or whole PRD acceptance | [record](2026-09-30-wi-034-macos-evaluation.md) |
| WI-035 | Receipt-backed startup handoff, live-owner safety, actual macOS F5/isolated installed evidence; ADR 0006 Accepted | 2026-09-30 agent under this explicit maintainer delegation; shared-domain and in-session recovery unchanged | [record](2026-09-30-wi-035-macos-acceptance.md) |
| WI-036 | Exact-child cleanup on owner loss; ADR 0008 Accepted | 2026-09-30 agent; window-crash F5/installed recorded | [record](2026-09-30-wi-036-macos-acceptance.md) |
| WI-037 | Bounded thinking streaming and complete quoted credential-value redaction (RUNTIME-01/02) | 2026-09-30 agent under this explicit native-evidence-and-close delegation; assistant-body per-delta remains out of scope | [record](2026-09-30-wi-037-macos-acceptance.md) |
| WI-039 | Delivered VSIX ships the runtime dependency closure its bundles load (PACKAGE-01) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; ARCH-07 remains parked | [record](2026-09-30-wi-039-macos-acceptance.md) |
| WI-038 | Cross-host endpoint write exclusion and explicit conflict/cleanup outcomes (ARCH-05); ADR 0007 Accepted | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; ADR 0005 and output budget remain outside | [record](2026-09-30-wi-038-macos-acceptance.md) |
| WI-040 | At most eight in-flight approval cards under concurrent preflight (CORE-01) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-040-macos-acceptance.md) |
| WI-041 | Session-worker inspect/history/preview request affinity and preview cursor invariants (CORE-02) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-041-macos-acceptance.md) |
| WI-042 | Model-picker applied radio uses stable provider/model-id identity (UI-01) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-042-macos-acceptance.md) |
| WI-043 | Model-popover Escape ignores already-consumed events (UI-02) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-043-macos-acceptance.md) |
| WI-044 | Vite config classified as a commit-check implementation input (TOOL-01) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-044-macos-acceptance.md) |
| WI-045 | Missing review-path body and tooltip share one translation entry (UI-03) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-045-macos-acceptance.md) |
| WI-046 | Diagnostic probe owns child/pipe errors, boolean success and observed exit (RUNTIME-03/04/05) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-046-macos-acceptance.md) |
| WI-047 | Endpoint write output must fit the 1 MiB read budget before commit (ARCH-06) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-047-macos-acceptance.md) |
| WI-048 | Failed default save does not apply the requested live session model (ARCH-02 supplement) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-048-macos-acceptance.md) |
| WI-049 | Packaging entry fails when required helpers or CSS are missing (ARCH-07) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-049-macos-acceptance.md) |
| WI-050 | Uncollected `.spec.tsx` fails discovery instead of being skipped (TOOL-02) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-050-macos-acceptance.md) |
| WI-051 | Composer flags and FileSnapshot validators have no confirmed production mis-pair | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-051-macos-acceptance.md) |
| WI-052 | Startup, diagnostic, artifact and test/Git costs need no in-repo budget now | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-052-macos-acceptance.md) |
| WI-053 | Streaming publish and history preview costs do not justify optimization now | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-053-macos-acceptance.md) |
| WI-054 | Admission owners tabulated; busy flags stay separate (ARCH-01) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-054-macos-acceptance.md) |
| WI-055 | Runtime optionals stay on one lifecycle; not split (ARCH-03) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-055-macos-acceptance.md) |
| WI-056 | Shared model/Webview value objects kept; DTOs not copied (ARCH-04) | 2026-09-30 agent under this session's complete-ACTIVE wrap-up-and-commit request; no gate or ADR | [record](2026-09-30-wi-056-macos-acceptance.md) |
| WI-057 | Saved-default apply order extracted; user-visible rules frozen (ARCH-02) | 2026-09-30 agent under the complete-remaining-tasks goal; no gate or ADR | [record](2026-09-30-wi-057-macos-acceptance.md) |
| WI-058 | Independent recovery domain per VS Code window; ADR 0009 Accepted | 2026-09-30 agent; dual-window F5/installed recorded | [record](2026-09-30-wi-058-macos-acceptance.md) |
| WI-059 | Local plugin-inventory product boundary (docs only); Draft ADR 0010 | 2026-10-01 agent under complete-ACTIVE `/goal`; no store/UI/load | [record](2026-10-01-wi-059-acceptance.md) |
| WI-060 | Host plugin-inventory file store | 2026-10-01 agent under complete-ACTIVE `/goal`; no Settings UI or runtime load | [record](2026-10-01-wi-060-acceptance.md) |
| WI-061 | Settings Plugins empty list and add from disk | 2026-10-01 agent under complete-ACTIVE `/goal`; no remove, enable or runtime load | [record](2026-10-01-wi-061-acceptance.md) |
| WI-062 | Remove from plugin inventory | 2026-10-01 agent under complete-ACTIVE `/goal`; disk files stay; no enable or runtime load | [record](2026-10-01-wi-062-acceptance.md) |
| WI-063 | Enable or disable inventory entries | 2026-10-01 agent under complete-ACTIVE `/goal`; live runtime unchanged; no `-e` apply | [record](2026-10-01-wi-063-acceptance.md) |
| WI-064 | Idle Trusted apply of enabled inventory entries | 2026-10-01 agent under complete-ACTIVE `/goal`; at most one extra `-e`; load consent kept | [record](2026-10-01-wi-064-acceptance.md) |
| WI-065 | Composer execution-profile fold | 2026-10-01 agent under complete-ACTIVE `/goal`; no composer picker; add stays in Settings | [record](2026-10-01-wi-065-acceptance.md) |

## Not in this index

- **WI-018** was never registered and is not reused.
