# Architecture decision records

English | [中文](README.zh.md)

- Type: Reference
- Status: Accepted
- Authority: when and how to write ADRs in this repository

## When to write an ADR

Record an ADR after the maintainer confirms a choice below. Keep it Draft until required verification is complete; use **Accepted** only with both approval and verification:

- Closes an architecture gate in [`architecture-gates.md`](../reference/architecture-gates.md);
- Changes trust boundaries, persistence, or integration strategy;
- Chooses between irreversible technical options (framework, process model).

Initial proposals and unexplained spike failures retain their pending state and missing conditions.

## Format

- File: `docs/decisions/0001-short-slug.md` (English authoritative; optional `.zh.md`)
- Metadata records the actual status (`Draft`, `Accepted`, or `Superseded`) and applicable gate links. Accepted requires maintainer approval and required verification; record their dates and evidence separately.
- Include context, decision, rationale, alternatives considered, consequences and related discussion/verification evidence. Do not invent alternatives or approval; state unknowns.

## Accepted ADRs

| ID | Title | Gate | File |
|----|-------|------|------|
| 0001 | Build and extension baseline (WI-001) | `gate-extension-host-baseline`, `gate-sidebar-chat-shell`, `gate-runtime-host` | [0001-build-baseline.md](0001-build-baseline.md) |

## Draft ADRs

- [0003 — React and TypeScript Webview frontend](0003-react-webview.md): framework direction confirmed for WI-015 Prepare; visual refresh and browser preview requested. Build and required verification pending; WI-014 Paused, gates remain Open.

- [0002 — Local interaction contract and upstream capability proposal](0002-interaction-contract-route.md): document route approved on 2026-09-22, then amended to prioritize unmodified released pi; upstream enhancement is optional. Detailed scoped design, implementation and required verification pending. WI-013 Paused, not completed; ADR remains Draft and gates remain Open. Does not resolve WI-010's pending ADR.

## Agent workflow

After explicit confirmation of an ADR-worthy choice, automatically record it under [collaboration §7](../guides/agent-collaboration.md#7-agent-obligations); no separate permission to save is needed. If required verification is missing, keep the ADR Draft and record pending conditions in ACTIVE (`Decision: pending-adr`); do not close the gate. If approval is ambiguous, ask about the decision, not the directory. Update this index, relevant gate links and ACTIVE when acceptance conditions are met. Keep historical ADRs here; mark superseded decisions and link their replacements without rewriting the original rationale or moving them merely because they are old.
