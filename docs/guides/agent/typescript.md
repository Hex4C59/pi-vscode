# TypeScript / Node agent playbook

English | [中文](typescript.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Authority: conventions when the product uses TypeScript on Node (CLI, extension host, Electron main, services)

Copy into the product repo as `docs/guides/agent/typescript.md` when WI touches `src/` TypeScript.

## Defaults

- Prefer strict `tsconfig` and explicit types on public module boundaries.
- Run the repo’s `lint`, `typecheck`, and `test` scripts before claiming a WI is verifiable.
- Do not add dependencies without noting them in architecture or ADR when they affect trust boundaries.

## Boundaries

- Keep UI/renderer code from importing Node-only or SDK modules unless architecture and `AGENTS.md` L0 allow it.
- Shared types belong in a documented contract location (reference doc or `src/shared/`), not ad-hoc duplicates.

## Session

- Load this file when editing `.ts` / `.tsx` under application paths; pair with `docs/guides/architecture-governance.md` for new public surfaces.
