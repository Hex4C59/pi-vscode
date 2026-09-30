# ACTIVE completed-task compaction (2026-09-30)

English | [中文](2026-09-30-active-completed-compaction.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical ACTIVE text only; current work remains in [`ACTIVE.md`](../../ACTIVE.md)
- Archival reason: the maintainer asked to move completed tasks out of ACTIVE so the entry is not a closed-WI catalog

## Replacement reason

On 2026-09-30 the maintainer asked to archive completed ACTIVE tasks. The focus checklist, per-WI delegated-acceptance table, closed audit/ARCH parking rows and the duplicated completed-WI table were session history, not current work. Numbered lookup stays in the [closed WI index](2026-09-29-closed-wi-index.md). Compaction does not reopen those WIs, change gates or ADRs, authorize WI-036 Build, or create Git commits.

## Live remainder in ACTIVE

ACTIVE keeps: session contract, WIP=0, the macOS self-test platform decision and delegated-acceptance identity, open parking (WI-036 Prepare-only, ARCH-02 sequence encapsulation without an automatic WI, audit stop, out-of-scope queue), at most two handoffs, and a one-row completed index pointer.

Per-WI delegated acceptance never was a standing pass for new work.

## Delegated acceptance table (historical)

The macOS self-test platform change and the 2026-09-30 identity (“agent accepts under the complete-ACTIVE request; not a claim the maintainer personally tested”) still apply as recorded in each WI’s acceptance file. The table itself is not current authorization. The original Chinese table is in the [source appendix](2026-09-30-active-completed-compaction.zh.md#original-chinese-source-appendix).

| WI | Authorized evaluation | Platform | How accepted |
|---|---|---|---|
| WI-031 | Already closed; not reopened | — | Maintainer technical acceptance (2026-09-29) |
| WI-032 | Shared credential-text rules across six host entries + macOS host evidence | macOS | Agent under later delegation |
| WI-033 | Runtime-frame validation + captured-real-pi bad-frame injection + macOS host evidence | macOS | Agent under later delegation |
| WI-034 | VSIX packaging + macOS F5 and isolated installed evidence | macOS | Agent under later delegation |
| WI-035 | Legacy-runtime startup handoff, live-owner protection + macOS F5/isolated install; ADR 0006 | macOS | Agent under that explicit delegation |
| WI-037 | RUNTIME-01/02 bounded thinking context and quoted-credential redaction + macOS F5/isolated install | macOS | Agent under that explicit native-evidence close |
| WI-039 | PACKAGE-01 installed runtime dependency closure | macOS | Agent under the complete-ACTIVE wrap-up-and-commit request |
| WI-038 | ARCH-05 cross-host endpoint write exclusion; ADR 0007 | macOS | Same request |
| WI-040 | CORE-01 eight-card approval admission under concurrent preflight | Automated | Same request |
| WI-041 | CORE-02 session-worker request affinity and preview cursor | Automated | Same request |
| WI-042 | UI-01 model-picker stable identity | Automated | Same request |
| WI-043 | UI-02 consumed Escape | Automated | Same request |
| WI-044 | TOOL-01 Vite commit-path classification | Automated | Same request |
| WI-045 | UI-03 missing review-path localization | Automated | Same request |
| WI-046 | RUNTIME-03/04/05 diagnostic helper settlement and success evidence | Automated | Same request |
| WI-047 | ARCH-06 endpoint write output budget | Automated | Same request |
| WI-048 | ARCH-02 supplement: failed default save does not change the live model | Automated | Same request |
| WI-049 | ARCH-07 packaging entry fails when required assets are missing | Automated | Same request |
| WI-050 | TOOL-02 reject uncollected `.spec.tsx` | Automated | Same request |
| WI-051 | Interface-risk: verify Composer and FileSnapshot first | Automated | Same request |
| WI-052 | Resource/timeout: measure first | Automated | Same request |
| WI-053 | ARCH-08: measure streaming and history-preview cost first | Automated | Same request |
| WI-054 | ARCH-01 admission and state-transition owner inventory | Automated | Same request |
| WI-055 | ARCH-03 runtime interface capability inventory | Automated | Same request |
| WI-056 | ARCH-04 internal model vs Webview DTO coupling inventory | Automated | Same request |

Authorization bounds from that session: per-WI only; not whole-PRD, gate, or public-release acceptance; no push.

## Closed focus checklist (historical)

Every 2026-09-30 focus row was `[x]` closed. Open the WI’s acceptance record from the [closed WI index](2026-09-29-closed-wi-index.md). Non-WI notes (architecture-doc sync, quality-code skill, `src/extension.ts` readability, stopped assertion audit, test-relevance audit) are historical and do not authorize new Build. The original Chinese bullets are in the [source appendix](2026-09-30-active-completed-compaction.zh.md#original-chinese-source-appendix).

## Closed audit and architecture parking items (historical)

RUNTIME-01/02, CORE-01/02, UI-01–03, TOOL-01/02, RUNTIME-03–05, interface-risk, resource/timeout measurement, ARCH-01/03–08, ARCH-02 supplement, and PACKAGE-01 were closed with those WIs. ARCH-02 **sequence encapsulation** was not closed and remains parked in ACTIVE (design confirmed 2026-09-29; do not auto-open a WI).

Evidence entries remain: [runtime helpers](../discussions/2026-09-30-runtime-helpers-audit.md), [core boundaries](../discussions/2026-09-30-core-boundaries-audit.md), [UI](../discussions/2026-09-30-ui-components-audit.md), [tooling](../discussions/2026-09-30-tooling-config-audit.md).

## Historical review notes

Coverage limits from the audit (partial long-file reads, no full-repo assertion audit restart, historical `npm test` counts) stay in those discussion files. They are not current test evidence.

## Follow-up entry cleanup (2026-09-30)

The maintainer subsequently asked to clean ACTIVE again after the approved queue and macOS personal-use acceptance had completed. The entry now keeps the session contract, WIP=0, current acceptance scope and identity, standing non-goals, one short documentation handoff and history pointers. The earlier open-item wording in this archive is a snapshot of the first compaction, not current work: WI-057 and WI-058 are closed in the [closed WI index](2026-09-29-closed-wi-index.md).

Material removed from the entry is retained here or in its existing evidence owner:

- **macOS verification handoff:** dual-window F5/installed ownership, crash cleanup, custom-endpoint call and OAuth device-code/browser interaction are in the [verification record](2026-09-30-macos-verification-acceptance.md). It records agent-delegated personal-use acceptance, not personal maintainer testing or an authenticated Copilot session in the isolated profile. That verification session did not rerun compile/lint/test or create Git commits.
- **Parking-lot closure handoff:** WI-058 per-window recovery and ADR 0009 were accepted. Sidebar comparison closed under WI-025 and the UI skill without adopting Claude Code's coral color; see the [discussion](../discussions/2026-09-28-claude-code-ui-comparison.md). The remaining eleven-file audit closed: production copy was covered by WI-058, and the other files were preview-only. Excluded capabilities became standing non-goals; the stopped assertion audit was not restarted.
- **Documentation correction checkpoint:** the English/Chinese README was synchronized to the accepted personal-use macOS status and existing evidence. Before those edits, `master` HEAD was `5bea9ae`, with `0 / 0` commit differences against locally recorded `origin/master`; no fetch was run. Documentation verification and health both passed with zero errors/notices, and `git diff --check` passed. These are historical observations, not current Git or behavior-test evidence. No compile/lint/test, commit or push was performed in that documentation task.

The duplicated WI-057/WI-058 rows now resolve through the closed WI index. Current gate status resolves through the [gate table](../reference/architecture-gates.md). This cleanup changes entry organization only; it creates no WI, product requirement, acceptance or Git authorization.

## Original Chinese source appendix

The [Chinese source appendix](2026-09-30-active-completed-compaction.zh.md#original-chinese-source-appendix) preserves the original ACTIVE paragraphs for the authorization table, closed focus checklist, closed parking-lot audit/ARCH rows and the duplicated completed-WI table. Only relative Markdown links were kept. There was no English counterpart to that ACTIVE record; this English page owns the archival explanation, not a new translation of every historical observation.
