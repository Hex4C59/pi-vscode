# Discussions (non-authoritative)

English | [中文](README.zh.md)

- Type: Reference
- Status: Accepted
- Created: <!-- date -->
- Authority: **context only**—does not override `AGENTS.md`, `docs/product-requirements.md` (when `Accepted`), architecture, `ACTIVE.md`, or ADRs

## Purpose

Use `docs/discussions/` for **exploratory notes** that are not yet decisions or requirements:

- Brainstorms and option comparisons before a spike.
- Session exports or meeting notes (paste or link).
- Maintainer questions and agent answers that should not live in chat history alone.

## What does not belong here

| Put it in… | Instead of discussions when… |
|------------|------------------------------|
| [`ACTIVE.md`](../../ACTIVE.md) **Parking lot** | It is a one-line idea for a future WI |
| [`ACTIVE.md`](../../ACTIVE.md) **Last session** | It is the handoff for the current WI |
| [`decisions/`](../decisions/) | The maintainer **confirmed** an irreversible choice (write an Accepted ADR) |
| [`product-requirements.md`](../product-requirements.md) | It defines **user-visible** scope ready for acceptance |
| [`archive/`](../archive/) | The content is **superseded** but worth keeping |

## Suggested file names

- `YYYY-MM-DD-topic-slug.md` — dated threads.
- One topic per file; link related ADRs or WIs when they appear.

## Agent rule

Read discussions for background only. If discussion text conflicts with `ACTIVE.md` or Accepted docs, **follow the authoritative file** and propose aligning or archiving the discussion.
