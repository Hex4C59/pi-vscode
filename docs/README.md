# pi VS Code documentation index

English | [中文](README.zh.md)

- Type: Reference
- Status: Accepted
- Created: <!-- date -->
- Authority: navigation for this product repository

## Entry points and task routes

This index is a routing tree, not a read-everything order. Repository rules and mandatory baseline reads come from [`../AGENTS.md`](../AGENTS.md) and its kernel.

- **Current session:** read [`../ACTIVE.md`](../ACTIVE.md) in full for the one current WI, approval state, open limits and latest handoff; then follow its task-relevant links.
- **User-visible behavior:** read [`product-requirements.md`](product-requirements.md) and the primary document under [`architecture/`](architecture/).
- **Architecture or contracts:** read the primary architecture, the relevant file under [`reference/`](reference/), and [`guides/architecture-governance.md`](guides/architecture-governance.md).
- **Implementation playbooks:** choose the matching route in [`../AGENTS.md`](../AGENTS.md) or [`guides/agent/`](guides/agent/); do not open unrelated playbooks by default.
- **WI close and documentation maintenance:** read [`guides/agent-collaboration.md`](guides/agent-collaboration.md), [`guides/documentation-health.md`](guides/documentation-health.md), and the [`archive/`](archive/) policy.
- **Historical evidence only:** use [`discussions/`](discussions/) and [`archive/`](archive/) when the current question needs prior rationale or observations. These files are not implementation authority.

Stop expanding links when the current task's scope, constraints, contract and required evidence are established. Report missing or conflicting evidence instead of treating link reachability as approval or authority.

## Agent: commits only

Read [`git-commit-convention.md`](git-commit-convention.md) when creating, editing, or reviewing commit messages—not for ordinary coding sessions.

## Documentation checks

Run `npm run docs:verify` after substantive doc changes. For manual lifecycle checks and evidence-based agent review, see [documentation health](guides/documentation-health.md) and run `npm run docs:health`. No weekly scheduler or automatic cleanup is installed.
