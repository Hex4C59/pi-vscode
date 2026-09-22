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

## Agent rule

Read discussions for background only. If discussion text conflicts with `ACTIVE.md` or Accepted docs, **follow the authoritative file** and align or archive within the authorization in [collaboration §7](../guides/agent-collaboration.md#7-agent-obligations); keep unresolved decision conflicts explicit.

At meaningful discussion checkpoints, the agent creates or updates an existing topic without asking the maintainer to choose a directory. Include background, options, evidence, current leaning and open questions; distinguish proposals from confirmed decisions and verified results. Routine Q&A needs no file. Link the topic from the relevant WI summary; when an ADR follows, link it instead of duplicating the decision. A resolved discussion need not move until it is inactive and its useful content has a current home.
