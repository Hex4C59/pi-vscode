# AGENTS kernel (shared)

English | [中文](AGENTS.kernel.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Authority: cross-project rules for human contributors and coding agents
- Applies to: every product repository bootstrapped from this template, and to agents editing those repos

Copy this file (and `AGENTS.kernel.zh.md`) into each **product** repository root. The product’s `AGENTS.md` adds project facts, security L0, architecture paths, and load-map links—it does not relax this kernel.

## Authority stack (pattern)

On conflict, use this order—replace paths in items (2)–(3) in the product `AGENTS.md`:

1. This kernel and `docs/guides/agent/` playbooks for engineering constraints.
2. Product requirements document when `Accepted` (typically `docs/product-requirements.md`).
3. Primary system architecture (typically under `docs/architecture/`).
4. `ACTIVE.md` for the current work item.
5. `docs/discussions/` and `docs/archive/` are context only—not implementation authority.

For questions of fact, phase, or repository state, **evidence in the repo outweighs agreeing with the maintainer’s framing**. Product tradeoffs and whether to start work remain the maintainer’s decision.

## Phase honesty

- Do not describe planned or gated capabilities as shipped until acceptance criteria, closed gates, and maintainer confirmation say so.

## Non-negotiables (L0)

- Do not create, modify, merge, or rewrite Git commits unless the user explicitly asks.

## Judgment and honesty (L0)

- Give a **clear conclusion** when the repo allows one (`yes` / `no` / `partly` / `not yet` / `unknown`). Do not default to agreement because the question sounds like it expects praise or more work.
- Ground claims in **this repository** (`ACTIVE.md`, phase, gates, files, commands you ran). Do not invent gaps to appear helpful.
- When asked what to optimize or do next, you **may** answer that **nothing material is needed now**, that the **`ACTIVE.md` queue is sufficient**, or that an idea is **premature for the current phase**. List optional ideas only when the maintainer **explicitly** asks for brainstorming, options, or a backlog dump.
- If the maintainer’s premise conflicts with docs or facts, **say so** and cite what you checked. Be specific and professional—not dismissive.
- If evidence is insufficient, say what is missing; do not fake confidence either way.
- This section does not override product security L0 in `AGENTS.md`, explicit maintainer instructions for a **scoped task**, or “do not commit unless asked.”

**Mini-examples**

- Maintainer: “We added `docs:verify`—what else should we optimize?”  
  **Good:** “Nothing required before the current WI; optional later: CI for `docs:verify`.”  
  **Bad:** Unrelated new WIs or rewrites without evidence.

- Maintainer: “Write the Accepted ADR now?”  
  **Good:** “No—spike unconfirmed; gate stays `In spike` per `ACTIVE.md`.”  
  **Bad:** Draft Accepted ADR early to please the question.

More patterns: `docs/guides/agent/judgment.md` in product repos; `workflow/judgment.md` in engineering-template.

## Trust boundaries (abstract L0)

Product `AGENTS.md` must spell out concrete rules. Every product using this kernel should enforce the same **ideas**:

- **Low-trust UI** must not receive credentials, arbitrary host capabilities, or direct access to upstream runtime APIs.
- **High-trust host** exposes only **named, allowlisted** cross-boundary operations; validate inputs in the host.
- **Do not reimplement** upstream agent loops, session stores, or provider stacks when an SDK/RPC already owns them—stay a presentation or integration layer unless the product charter says otherwise.
- **Do not imply a sandbox** when the runtime runs as the user; trust and permissions must be visible in UI and docs.

## Layer model (pattern)

Regardless of framework (Electron, VS Code, web, CLI):

| Layer | Role |
|-------|------|
| **UI** | Views, input, short-lived UI state |
| **Host** | Privileged capabilities, lifecycle, validated API surface |
| **Adapter** | Upstream SDK/RPC → internal events; isolate version changes |
| **Runtime** | Upstream models, agents, tools, sessions |

Streaming and lifecycle details belong in product playbooks (for example `boundaries.md`), not in this kernel.

## ACTIVE session pairing

The maintainer may @-mention **`ACTIVE.md` only** to start a session. The agent must:

1. Read `ACTIVE.md` (session contract summary and current WI).
2. Read the product collaboration guide (for example `docs/guides/agent-collaboration.md`) in full **before** proposing or editing application code.

Skip step 2 only for read-only answers with no WI or code changes, unless gates, ADRs, or session-close rules apply.

## Before you start

1. Read this kernel, the product `AGENTS.md`, `ACTIVE.md`, `README.md`, the current tree, `package.json` when present, and relevant tests.
2. For implementation sessions, follow **ACTIVE session pairing** even if the maintainer did not @ the collaboration guide.
3. Preserve the user’s unrelated Git changes; use the repo’s package manager and scripts—do not swap the stack for preference.
4. If the task changes security, persistence, or upstream integration strategy, clarify impact and record the decision before large changes.

## Architecture governance

Agents do not retain chat memory. For **structure, boundaries, APIs, dependencies, contracts, ownership**, and related quality attributes (concurrency, lifecycle, security, persistence, observability, errors, tests, release), use:

1. Product architecture and modules/reference docs when they exist.
2. The portable checklist: `docs/guides/architecture-governance.md` in product repos; `workflow/architecture-governance.md` in engineering-template.

Before proposing module splits, new public surfaces, cross-layer dependencies, or claiming architectural correctness, **scan the checklist** and cite pass/gap with file paths. Do not invent owners or `Living` contracts from `Planned` shells.

## Playbooks

Detailed constraints live under `docs/guides/agent/` and load progressively. The product `AGENTS.md` load map must include architecture governance and list which playbook to open for which paths.

## Task completion (kernel)

1. End-to-end usable behavior when the WI requires it—not static UI only.
2. Types, errors, cancellation, cleanup, and empty states handled where the WI touches behavior.
3. Relevant tests added or updated and actually run; lint/typecheck pass when the repo defines them.
4. Security boundaries not expanded without explicit verification.
5. User-visible and command changes reflected in docs when applicable.

After substantive documentation changes, run the repo’s documentation verify command (for example `npm run docs:verify`).
