# Shared agent working rules

English | [中文](AGENTS.kernel.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Authority: cross-project rules for human contributors and coding agents
- Applies to: every product repository bootstrapped from this template, and to agents editing those repos

This file defines common agent working rules. Product `AGENTS.md` adds project facts, concrete security constraints, architecture paths and task-specific reading routes; it must not weaken this kernel.

This English/Chinese pair originates in engineering-template and is copied to product repository roots. When editing shared rules, record the synchronization state of the template and the local copy. A local edit does not update the template or other projects. **2026-09-22:** readability changes approved for this repository; the template source has not been updated in this task.

## Document responsibilities and conflict priority

First use the document responsible for the question. The following list also defines conflict priority from highest to lowest; concrete product paths belong in `AGENTS.md`:

1. This kernel and agent playbooks define mandatory engineering constraints.
2. An `Accepted` product requirements document defines approved user-visible behavior and acceptance.
3. The primary architecture document defines structure, boundaries and responsibility owners.
4. `ACTIVE.md` records the current WI, scope, phase and approval.
5. Discussions and archives provide background and historical evidence, not independent implementation authorization.

A conflict means incompatible requirements about the same question, not complementary descriptions of different concerns. Identify the conflicting sources and follow the priority above rather than silently overriding a document. Product tradeoffs and whether to start work remain the maintainer's decision.

## Git changes require explicit authorization (L0)

Do not create, modify, merge or rewrite Git commits unless the user explicitly asks.

## Evidence-based judgment and reporting (L0)

- Give a clear conclusion when evidence allows one: yes, no, partly, not yet or unknown. Ground it in repository files, current phase, gates and commands actually run.
- When the maintainer's premise conflicts with repository facts, identify the discrepancy and cite what you checked, specifically and professionally. Evidence determines factual claims; the maintainer decides product tradeoffs.
- State missing evidence when uncertain. Do not invent gaps to appear useful or agreement to satisfy the phrasing of a question.
- When asked what to optimize or do next, it is valid to recommend no material change, the existing ACTIVE queue, or deferring a premature idea. List optional ideas only when explicitly asked for brainstorming, options or a backlog.
- Do not describe planned or gated capabilities as shipped until the applicable acceptance criteria, gate closure and maintainer confirmation support that exact scope.
- These judgment rules do not override product security rules, explicit instructions for a scoped task, or the requirement for explicit commit authorization.

Example: asked whether more optimization is needed, a supported answer is “No additional work is required before the current WI.” Asked to mark an ADR Accepted while its spike is unconfirmed, report the missing verification and retain the current gate status.

For further judgment examples, consult the product's `docs/guides/agent/judgment.md`; the template source is `workflow/judgment.md` in engineering-template.

## Mandatory security boundaries across projects (L0)

Product `AGENTS.md` supplies concrete rules implementing these principles:

- **Low-trust UI:** must not receive credentials, arbitrary host capabilities or direct access to upstream runtime APIs.
- **Privileged host:** exposes only named, allowlisted operations across the boundary and validates incoming values before acting.
- **Upstream ownership:** use the documented SDK/RPC for agent loops, session stores and provider stacks; do not reimplement those capabilities unless the product charter says otherwise.
- **Sandbox honesty:** when the runtime executes with the user's permissions, do not imply it is a security sandbox. Make the actual trust and permission limits visible in UI and documentation.

## Common system layers and responsibilities

The same responsibility split applies across Electron, VS Code, web and CLI hosts:

- **UI:** views, input and short-lived presentation state.
- **Host:** privileged capabilities, lifecycle and validated interfaces.
- **Adapter:** maps upstream SDK/RPC to internal events and isolates version changes.
- **Runtime:** upstream models, agents, tools and sessions.

Product architecture and playbooks own streaming and lifecycle details. The product load map must point to the relevant existing documents; this kernel does not prescribe a placeholder filename.

## Starting a task

1. Read this kernel, product `AGENTS.md`, `ACTIVE.md`, `README.md`, the current directory tree, `package.json` when present, and relevant tests.
2. Read the current WI and session summary in `ACTIVE.md`. Before proposing or editing application code, read the product collaboration guide in full (typically `docs/guides/agent-collaboration.md`), even if the maintainer did not mention it.
3. Follow the product load map for task-specific playbooks. Preserve unrelated user Git changes and use the repository's package manager and scripts; do not swap the stack for preference.
4. If the task changes security, persistence or upstream integration strategy, clarify the impact and record the decision before large changes. Apply the product collaboration guide's approval requirements before implementation.

Mentioning only `ACTIVE.md` is a session entry point, not a waiver of required reading or implementation approval. The collaboration-guide read may be skipped only for a read-only answer with no WI changes and no code changes, unless gates, ADRs or session-close rules apply. This exception does not waive the other baseline requirements.

## When architecture review is required

For changes to structure, boundaries, interfaces, dependencies, contracts or ownership—and related concurrency, lifecycle, security, persistence, observability, errors, tests or release behavior—use repository documents rather than assuming previous chat context is available:

1. Read the relevant product architecture and module/reference documents when present.
2. Before proposing module splits, interfaces for other modules or external callers, or cross-layer dependencies, or claiming architectural correctness, review the applicable dimensions of the architecture checklist. Report what is satisfied and what remains a gap, with evidence paths and unresolved risks.

The checklist is `docs/guides/architecture-governance.md` in product repositories; its template source is `workflow/architecture-governance.md`. Do not invent implemented owners or `Living` contracts from `Planned` document shells.

Detailed engineering constraints remain in task-specific playbooks under `docs/guides/agent/`. The product load map must include architecture governance and state when each guide is required; it is not an instruction to read every guide for every task.

## Checks before handoff

Check the approved scope and report the evidence for completion:

1. Deliver end-to-end usable behavior when the WI requires it, not only a static UI.
2. For behavior touched by the WI, verify types, errors, cancellation, resource cleanup and empty states. Do not turn inapplicable checks into extra feature scope.
3. Add or update relevant tests and actually run them. Run the repository's applicable lint/typecheck checks and report their results; checks that could not run remain explicitly unverified, not passed.
4. Preserve security boundaries. Changes require the applicable approval and explicit verification; a successful build alone does not authorize expanded access.
5. Update documentation for affected user-visible behavior and commands. After substantive documentation changes, run the repository's documentation verification command.
6. Report which checks ran, results and unverified areas with reasons. Distinguish current runs from historical evidence. Passing checks does not automatically establish maintainer acceptance, WI closure or gate acceptance; follow the project's approval and decision rules.

Project-specific commands and acceptance procedures belong in product `AGENTS.md`, its playbooks and repository configuration, not in this shared kernel.
