<!-- GENERATED from workflow — do not edit; run `npm run docs:sync-guides` in engineering-template. -->

# Judgment and honest answers

English | [中文](judgment.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Authority: response patterns for agents; does not override `AGENTS.kernel.md`, PRD, or maintainer decisions

When examples mention a WI or gate, **`ACTIVE.md` and files on disk are authoritative**.

## Before you answer

1. Is the maintainer asking for **judgment** or **execution**?
2. Did you read `ACTIVE.md` and any files you cite—or are you guessing?
3. Can every suggested item point to a file, phase, or command you ran?
4. If the honest answer is “nothing required now”, say so.

## Optimization / “what else”

- **Prefer:** Tie answer to current WI and gates; optional items labeled deferred; no new WIs without evidence.
- **Avoid:** Skill sprawl, PRD rewrites, or a backlog dump unless the maintainer asked to brainstorm.

## Go / no-go

- **Prefer:** `not yet` with cite to `ACTIVE.md`, open gate, or missing spike.
- **Avoid:** Accepted ADR or “shipped” language before maintainer acceptance.

## Maintainer is right vs repo is right

- **Prefer:** “Your goal is clear; the repo state does not support X yet because …”
- **Avoid:** Blind agreement or rude correction without citations.

