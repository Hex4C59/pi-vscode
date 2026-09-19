# pi VS Code — Architecture review guide (optional)

English | [中文](architecture-review-guide.zh.md)

- Type: Guide
- Status: **Draft**
- Created: <!-- date -->
- Authority: **optional long-form review narrative** for this product; checklist enforcement remains [`guides/architecture-governance.md`](guides/architecture-governance.md)
- Related: primary architecture under [`architecture/`](architecture/), [`reference/architecture-gates.md`](reference/architecture-gates.md)

> **Optional:** Skip this file until you need a product-specific review story (onboarding reviewers, release audits). Agents must still use the portable **architecture-governance** checklist for pass/gap/N/A tables.

## When to maintain this guide

- You repeat the same architecture review explanation every release.
- You need examples bound to **this** repo’s modules, paths, and gate IDs.
- You want a human-readable companion to ADRs without duplicating the checklist.

## Relationship to other docs

| Need | Use |
|------|-----|
| Mandatory agent checklist (dimensions, evidence) | [`guides/architecture-governance.md`](guides/architecture-governance.md) |
| Structure, owners, trust boundaries | Primary doc in [`architecture/`](architecture/) |
| Irreversible choices | [`decisions/`](decisions/) ADRs + [`reference/architecture-gates.md`](reference/architecture-gates.md) |
| Current WI and acceptance | [`../ACTIVE.md`](../ACTIVE.md) |
| User-visible scope | [`product-requirements.md`](product-requirements.md) when `Accepted` |

## Product review narrative (Draft)

<!-- Replace with your story: major subsystems, typical failure modes, review order for PRs, links to runbooks. -->

### Review order (example)

1. Confirm WI and gates in `ACTIVE.md`.
2. Walk authority chain (see architecture-governance § Authority chain).
3. Module / contract / persistence sections as touched by the change.
4. Record gaps in chat using the governance table format; update docs before closing gates.

### Worked examples (this product)

<!-- Link or embed short examples: “good PR description”, “bad boundary crossing”, local gate IDs. -->

## Promoting to `Accepted`

Set **Status** to `Accepted` when maintainers agree this guide is the default onboarding path for architecture review. Run `npm run docs:verify` and add bilingual pairs if required.
