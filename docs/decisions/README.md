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
- Metadata includes `Status: Accepted` and links to the gate ID.

## Accepted ADRs

| ID | Title | Gate | File |
|----|-------|------|------|
| 0001 | Build and extension baseline (WI-001) | `gate-extension-host-baseline`, `gate-sidebar-chat-shell`, `gate-runtime-host` | [0001-build-baseline.md](0001-build-baseline.md) |
