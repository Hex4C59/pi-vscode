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
| 0002 | Trusted extension interactions and owned-runtime recovery (WI-013) | Related broad gates: separately Accepted by ADR0004 | [0002-interaction-contract-route.md](0002-interaction-contract-route.md) |
| 0003 | React/TypeScript/Vite Webview frontend (WI-015) | Related gates: separately Accepted by ADR0004 | [0003-react-webview.md](0003-react-webview.md) |
| 0004 | End-to-end trust and session lifecycle boundaries (WI-010) | `gate-webview-trust`, `gate-project-trust`, `gate-session-streaming` | [0004-trust-and-lifecycle.md](0004-trust-and-lifecycle.md) |

## Draft ADRs

| ID | Title | Gate | File |
|----|-------|------|------|
| 0005 | Custom OpenAI-compatible endpoints in models.json (WI-030) | none | [0005-custom-endpoint-file.md](0005-custom-endpoint-file.md) |
| 0006 | End a leftover owned runtime before the next conversation | none closed | [0006-owned-runtime-handoff.md](0006-owned-runtime-handoff.md) |

0005 stays Draft. The maintainer closed WI-030 after checking the settings controls. A live browser sign-in and a live endpoint call are still unrecorded, so this ADR does not accept a gate.

0006 stays Draft. The maintainer confirmed the leftover-runtime rule on 2026-09-29. It has no implementation or host verification, so it does not supersede ADR 0002 and does not accept a gate.

## Agent workflow

After explicit confirmation of an ADR-worthy choice, automatically record it under [collaboration §7](../guides/agent-collaboration.md#7-agent-obligations); no separate permission to save is needed. If required verification is missing, keep the ADR Draft and record pending conditions in ACTIVE (`Decision: pending-adr`); do not close the gate. If approval is ambiguous, ask about the decision, not the directory. Update this index, relevant gate links and ACTIVE when acceptance conditions are met. Keep historical ADRs here; mark superseded decisions and link their replacements without rewriting the original rationale or moving them merely because they are old.
