# Discussions (non-authoritative)

English | [中文](README.zh.md)

- Type: Reference
- Status: Accepted
- Authority: **context only**—does not override `AGENTS.md`, `docs/product-requirements.md` (when `Accepted`), architecture, `ACTIVE.md`, or ADRs

## Purpose

Use `docs/discussions/` for **exploratory notes** that are not yet decisions or requirements:

- Brainstorms and option comparisons before a spike.
- Summaries of substantive conversations or meetings, with source links when available.
- Maintainer questions and agent answers that should not live in chat history alone.

## What does not belong here

| Put it in… | Instead of discussions when… |
|------------|------------------------------|
| [`ACTIVE.md`](../../ACTIVE.md) **Parking lot** | It is a one-line idea for a future WI |
| [`ACTIVE.md`](../../ACTIVE.md) **Last session** | It is the handoff for the current WI |
| [`decisions/`](../decisions/) | The maintainer **confirmed** an ADR-worthy choice (Accepted only after required verification) |
| [`product-requirements.md`](../product-requirements.md) | It defines **user-visible** scope ready for acceptance |
| [`archive/`](../archive/) | The content is **superseded** but worth keeping |

## Suggested file names

- `YYYY-MM-DD-topic-slug.md` — dated threads.
- One topic per file; link related ADRs or WIs when they appear.

## Topics by purpose

Use the grouping below for retrieval, not approval or current delivery status. Each record retains its own evidence date, versions, open questions and historical status. Resolved, long or old discussions stay here unless the scoped archival rules actually apply. Current work is in [ACTIVE](../../ACTIVE.md); requirements, module boundaries and decisions belong to the [PRD](../product-requirements.md), [architecture](../architecture/vscode-extension-architecture.md), [gates](../reference/architecture-gates.md) and [ADR index](../decisions/README.md).

The [feature-gap comparison](2026-10-01-pi-feature-gaps.md) remains a candidate list, not Build authorization. Local-inventory discussion is background; current approved scope comes from REQ-010 and WI records, not historical parking wording or Draft ADR 0010. Audit findings and measurements are evidence, not approval to fix or optimize.

### Product and UI exploration

- [Encoding UI craft as rules a code agent can follow](2026-09-28-agent-ui-rules.md)
- [Claude Code vs Pi sidebar: why the other UI feels more premium](2026-09-28-claude-code-ui-comparison.md)
- [WI-024: provider settings layout (progressive disclosure)](2026-09-28-wi-024-provider-settings-layout.md)
- [Local plugin inventory in Settings](2026-10-01-local-plugin-inventory.md)
- [Composer model-chip label craft](2026-10-01-model-chip-label.md)
- [pi VS Code feature gaps against pi 0.86.1](2026-10-01-pi-feature-gaps.md)

### Architecture and responsibility boundaries

- [Live session model and Saved default orchestration](2026-09-29-live-session-saved-default.md)
- [Runtime adapter: one owned-process seam](2026-09-29-runtime-owner-seam.md)
- [Drop the owned-runtime recovery barrier](2026-09-29-drop-runtime-recovery-barrier.md)
- [ARCH-01 admission and state-transition owners](2026-09-30-arch-01-admission-owners.md)
- [ARCH-03 runtime capability combinations](2026-09-30-arch-03-runtime-capabilities.md)
- [ARCH-04 model types and Webview DTO sharing](2026-09-30-arch-04-dto-coupling.md)
- [Architecture assessment — 2026-10-01](2026-10-01-architecture-assessment.md)

### Technical research, measurements and operational evidence

- [WI-004 Prepare — pinned pi `0.85.1` RPC evidence](2026-09-21-wi-004-rpc-evidence-0.85.1.md)
- [WI-022: default CLI workaround (closed)](2026-09-28-wi-022-background-consoles.md)
- [Component motion research for the sidebar UI skill](2026-09-29-component-motion-research.md)
- [Settings redesign research](2026-09-29-settings-redesign-research.md)
- [ARCH-08 streaming and history preview cost](2026-09-30-arch-08-streaming-history-cost.md)
- [Resource and timeout measurement](2026-09-30-resource-timeout-measurement.md)

### Code audits and verification evidence

- [Test relevance audit](2026-09-29-test-relevance-audit.md)
- [Core Boundaries Audit: Attachments, Approval and Process Control](2026-09-30-core-boundaries-audit.md)
- [Runtime Helpers Audit: New-File Review](2026-09-30-runtime-helpers-audit.md)
- [UI Components Audit: New-File Review](2026-09-30-ui-components-audit.md)
- [Tooling and Configuration Audit](2026-09-30-tooling-config-audit.md)
- [Interface-risk verification: Composer flags and FileSnapshot validators](2026-09-30-interface-risk-verification.md)
- [Requirements implementation check (2026-09-30)](2026-09-30-requirements-implementation-check.md)

Cross-topic routes: [provider layout](2026-09-28-wi-024-provider-settings-layout.md) ↔ [settings research](2026-09-29-settings-redesign-research.md); [UI rules](2026-09-28-agent-ui-rules.md) ↔ [motion research](2026-09-29-component-motion-research.md); [architecture assessment](2026-10-01-architecture-assessment.md) ↔ [boundary audit](2026-09-30-core-boundaries-audit.md). Closed-WI proposals and acceptance are in the [archive lookup](../archive/2026-09-29-closed-wi-index.md).

## Agent rule

Read discussions for background only. If discussion text conflicts with `ACTIVE.md` or Accepted docs, **follow the authoritative file** and align or archive within the authorization in [collaboration §7](../guides/agent-collaboration.md#7-agent-obligations); keep unresolved decision conflicts explicit.

At meaningful discussion checkpoints, the agent creates or updates an existing topic without asking the maintainer to choose a directory. Include background, options, evidence, current leaning and open questions; distinguish proposals from confirmed decisions and verified results. Routine Q&A needs no file. Link the topic from the relevant WI summary; when an ADR follows, link it instead of duplicating the decision. A resolved discussion need not move until it is inactive and its useful content has a current home.
