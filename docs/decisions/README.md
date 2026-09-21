# Architecture decision records

English | [中文](README.zh.md)

- Type: Reference
- Status: Accepted
- Created: <!-- date -->
- Authority: when and how to write ADRs in this repository

## When to write an ADR

Write an **Accepted** ADR after the maintainer confirms a decision that:

- Closes an architecture gate in [`architecture-gates.md`](../reference/architecture-gates.md);
- Changes trust boundaries, persistence, or integration strategy;
- Chooses between irreversible technical options (framework, process model).

Do **not** write Accepted ADRs at first proposal or before a failed spike is understood.

## Format

- File: `docs/decisions/0001-short-slug.md` (English authoritative; optional `.zh.md`)
- Metadata records the actual status (`Draft`, `Accepted`, or `Superseded`) and applicable gate links. Accepted requires maintainer approval and required verification; record their dates and evidence separately.
- Include context, decision, rationale, alternatives considered, consequences and related discussion/verification evidence. Do not invent alternatives or approval; state unknowns.

## Accepted ADRs

| ID | Title | Gate | File |
|----|-------|------|------|
| 0001 | Build and extension baseline (WI-001) | `gate-extension-host-baseline`, `gate-sidebar-chat-shell`, `gate-runtime-host` | [0001-build-baseline.md](0001-build-baseline.md) |

## Agent workflow

After explicit confirmation of an ADR-worthy choice, automatically record it under [collaboration §7](../guides/agent-collaboration.md#7-agent-obligations); no separate permission to save is needed. If required verification is missing, keep the ADR Draft and record pending conditions in ACTIVE (`Decision: pending-adr`); do not close the gate. If approval is ambiguous, ask about the decision, not the directory. Update this index, relevant gate links and ACTIVE when acceptance conditions are met. Keep historical ADRs here; mark superseded decisions and link their replacements without rewriting the original rationale or moving them merely because they are old.
