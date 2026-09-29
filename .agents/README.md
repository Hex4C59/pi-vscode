# `.agents` — engineering skills catalog

English | [中文](README.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-28
- Last reviewed: 2026-09-29
- Authority: human-oriented catalog of skills under this repository’s `.agents/skills/`; not a substitute for each skill’s own `SKILL.md`

This folder holds **Agent Skills** used while developing **pi VS Code**. Each skill is a directory under `.agents/skills/<name>/` with a `SKILL.md` the agent loads when that skill is selected.

**Canonical behavior** lives in each skill’s `SKILL.md`. This README is the **human index**: what each skill is for, when to reach for it, and how to invoke it.

Project product rules, WIP, and gates still live in [`AGENTS.md`](../AGENTS.md) / [`ACTIVE.md`](../ACTIVE.md). Skills do not replace those.

## How skills are invoked

| Kind | How you use them |
|------|------------------|
| **Slash / explicit** | Type `/skill-name` (or the host’s equivalent “run skill”) when the skill sets `disable-model-invocation: true`, or whenever you want that flow on purpose. |
| **Auto-suggested** | Skills without that flag may be picked when your message matches their `description`. Prefer naming the skill if you care which one runs. |
| **Router** | Unsure which skill fits → `/ask-matt`. |

Always prefer reading the skill’s `SKILL.md` after invocation; this catalog is orientation, not a second procedure.

## Main flow (idea → ship)

Recommended path for most feature work (from `/ask-matt`):

1. **`/grill-with-docs`** — sharpen the idea; leave `CONTEXT.md` / ADRs when in a working tree.
2. Optional: **`/prototype`** when you need a runnable answer before locking the design.
3. Multi-session build → **`/to-spec`** → **`/to-tickets`**, then **`/implement`** per ticket (often with fresh context). Small job → **`/implement`** (or **`/tdd`**) in the same thread.
4. Review with **`/code-review`** before commit when you want a Standards + Spec pass.

Keep grilling → spec → tickets in one context window when possible; start implement tickets fresh.

## Codebase health (structure)

Use this path when the question is **module depth, seams, and dependencies**, not a new feature spec:

1. **`/improve-codebase-architecture`** — scan `src/` for shallow modules and leakage; write a **temporary HTML report** (not in the repo); you pick one candidate.
2. **`/grilling`** (or `/grill-with-docs` if the decision should land in `CONTEXT.md` / an ADR) — settle constraints, what sits behind the seam, and tests before any diff.
3. **`/implement`** or a small direct change — only after maintainer **Build** authorization in [`ACTIVE.md`](../ACTIVE.md) when the repo requires it.

Vocabulary for steps 1–2: **`/codebase-design`** (module, interface, depth, seam, adapter, leverage, locality). Layer rules and public `index.ts` entries for this repo: [`docs/architecture/vscode-extension-architecture.md`](../docs/architecture/vscode-extension-architecture.md); automated public-entry checks live in `src/extension/tests/architecture-boundaries.spec.ts`.

`/diagnosing-bugs` may hand off here when the real fix is a missing seam, not a one-line patch.

## Catalog

### Router and session hygiene

#### `ask-matt`

- **What:** Router over this skill set; explains main flow, on-ramps, and standalones.
- **When:** You do not know which skill or sequence to use.
- **How:** `/ask-matt`. Explicit only.

#### `wait-what`

- **What:** Stop and re-pitch the last message that did not land.
- **When:** Confusion, talk-past each other, or “that didn’t make sense.”
- **How:** `/wait-what`. Explicit only.

#### `retro`

- **What:** Retrospective on a coding session (what worked, what to change).
- **When:** End of a meaningful session; process improvement.
- **How:** `/retro`. Explicit only.

### Spec → tickets → implement

#### `grill-with-docs`

- **What:** Relentless interview that also produces docs (ADRs, glossary) as you go.
- **When:** Working in a repo and you want a paper trail while sharpening a plan.
- **How:** `/grill-with-docs`. Explicit only. Uses the `grilling` primitive underneath.

#### `grill-me`

- **What:** Same interview intensity as grilling, without requiring doc artifacts.
- **When:** No working directory / you do not want ADRs yet; still want stress-testing.
- **How:** `/grill-me`. Explicit only.

#### `grilling`

- **What:** Shared grilling primitive: design-tree rounds, frontier questions, recommended answers.
- **When:** User asks to “grill” a plan/decision, or another grill skill dispatches it.
- **How:** Usually via `/grill-me` or `/grill-with-docs`; may auto-match grill language.

#### `to-spec`

- **What:** Turn the current conversation into a published spec (no new interview).
- **When:** After grilling (or equivalent shared understanding); ready to freeze a spec for agents.
- **How:** `/to-spec`. Explicit only. Needs tracker setup from `/setup-matt-pocock-skills` if not configured.

#### `to-tickets`

- **What:** Break a plan/spec into tracer-bullet tickets with blocking edges.
- **When:** Spec exists (or conversation is enough) and work should be parallelizable / session-sized.
- **How:** `/to-tickets`. Explicit only.

#### `to-questionnaire`

- **What:** Turn undecidable questions into a questionnaire for someone else.
- **When:** You cannot answer every decision in chat; need async human input.
- **How:** `/to-questionnaire`. Explicit only.

#### `implement`

- **What:** Implement work from a spec or tickets (typically drives TDD and review).
- **When:** Agent-ready ticket/spec exists; ready to change code.
- **How:** `/implement`. Explicit only. Still obeys this repo’s `ACTIVE.md` approval rules.

#### `implement-spec`

- **What:** Implement a specification in code (spec-focused variant).
- **When:** You have a concrete spec and want implementation without the full ticket machinery.
- **How:** `/implement-spec`. Explicit only.

#### `tdd`

- **What:** Test-driven development (red → green → refactor).
- **When:** Building or fixing a behavior test-first; “red-green-refactor”; integration tests.
- **How:** Ask for TDD / invoke `tdd`; often nested inside `/implement`.

#### `prototype`

- **What:** Throwaway prototype to answer a design question (state/UI feel).
- **When:** Conversation cannot settle a question without something runnable.
- **How:** Auto or by name.

#### `wayfinder`

- **What:** Plan work larger than one session as a map of decision tickets; resolve one at a time.
- **When:** Ambiguous mega-initiative; path to destination unclear.
- **How:** `/wayfinder`. Explicit only.

#### `loop-me`

- **What:** Grill you about specs for workflows you want to build in this workspace.
- **When:** Defining recurring agent/human workflows rather than a single feature.
- **How:** `/loop-me`. Explicit only.

### Design and architecture

#### `pi-sidebar-ui`

- **What:** Quiet, tool-like sidebar visual craft: empty session, monochrome π, closed spacing/type, VS Code surfaces.
- **When:** Editing webview CSS/TSX, empty state, composer, session bar, or visual polish.
- **How:** Auto when those files or terms match, or ask explicitly. Does not authorize Build.

#### `codebase-design`

- **What:** Vocabulary for deep modules, seams, testability, AI-navigable design.
- **When:** Designing/improving a module interface or placing a seam; other skills need this vocabulary.
- **How:** Auto when design language matches, or ask explicitly.

#### `improve-codebase-architecture`

- **What:** Scan for **deepening opportunities** (shallow modules, seam leakage, weak test surfaces); emit a self-contained HTML report under the OS temp directory; then **grill** whichever candidate you choose. Does not propose final interfaces in the report phase.
- **When:** Periodic codebase health, before a refactor slice, or after `/diagnosing-bugs` finds structural root cause.
- **How:** `/improve-codebase-architecture`. Explicit only (`disable-model-invocation`). Uses **`/codebase-design`** vocabulary; may call **`/grilling`** and **`/domain-modeling`** after you pick a candidate.

#### `domain-modeling`

- **What:** Sharpen domain language; CONTEXT.md / ADR work.
- **When:** Terminology debates, writing or editing domain docs or ADRs.
- **How:** Auto or by name.

#### `diagnosing-bugs`

- **What:** Discipline for hard bugs/perf: build a tight red loop before hypothesizing.
- **When:** “Diagnose”, “debug this”, broken/throwing/failing/slow.
- **How:** Auto on bug reports, or ask explicitly.

### Review, docs, research

#### `code-review`

- **What:** Dual-axis review since a fixed point: Standards vs Spec (parallel sub-agents).
- **When:** Review a branch/PR/WIP, or “review since X”.
- **How:** Auto or by name; often after `/implement`.

#### `documentation-health`

- **What:** Evidence-based, read-only documentation health review.
- **When:** Explicitly asked to inspect stale docs or run docs maintenance review.
- **How:** Auto when that ask is clear; prefer naming it for scoped reviews.

#### `writing-for-agents`

- **What:** How to write skills and agent-facing docs (`AGENTS.md`, pointers, hierarchy).
- **When:** Creating/editing skills or agent entry docs.
- **How:** Auto or by name. See also `SKILL-MECHANICS.md` beside that skill.

#### `research`

- **What:** Investigate against high-trust primary sources; write findings as Markdown in-repo.
- **When:** Docs/API facts, delegated reading, background research.
- **How:** Auto or by name.

#### `pr`

- **What:** Write a PR body.
- **When:** Opening or drafting a pull request description.
- **How:** Auto or by name when asking for a PR body.

### Git and repo tooling

#### `resolving-merge-conflicts`

- **What:** Resolve an in-progress merge/rebase conflict.
- **When:** Merge/rebase is stuck on conflicts.
- **How:** Auto or by name.

#### `setup-pre-commit`

- **What:** Husky + lint-staged (Prettier) + typecheck/tests at commit time.
- **When:** Adding or fixing pre-commit hooks in this repo.
- **How:** Auto or by name.

#### `setup-matt-pocock-skills`

- **What:** One-time setup: issue tracker and domain doc layout for this skill pack.
- **When:** Before first use of tracker-backed skills (`to-spec`, `to-tickets`, …).
- **How:** `/setup-matt-pocock-skills`. Explicit only.

#### `setup-ts-deep-modules`

- **What:** Wire dependency-cruiser so packages are deep modules (impl only via entry points).
- **When:** Enforcing deep-module boundaries in a TypeScript repo.
- **How:** `/setup-ts-deep-modules`. Explicit only.

#### `migrate-to-shoehorn`

- **What:** Replace `as` assertions in tests with `@total-typescript/shoehorn`.
- **When:** Shoehorn migration or partial test data without unsafe casts.
- **How:** Auto or by name.

#### `scaffold-exercises`

- **What:** Scaffold course exercise trees (sections/problems/solutions/explainers) that lint.
- **When:** Building course/exercise content, not product features.
- **How:** Auto or by name.

#### `wizard`

- **What:** Generate an interactive bash wizard for steps only a human can perform.
- **When:** Dashboards, secrets, one-off cutovers the agent cannot click through alone.
- **How:** Auto or by name. Do not use for steps the agent can do itself.

### Teaching and long-form writing

#### `teach`

- **What:** Teach a skill or concept in this workspace.
- **When:** Learning mode, not shipping product code.
- **How:** `/teach`. Explicit only.

#### `writing-fragments`

- **What:** Explore: mine raw writing fragments, no structure yet.
- **When:** Early article/essay exploration.
- **How:** `/writing-fragments`. Explicit only.

#### `writing-beats`

- **What:** Exploit: assemble material into a journey of beats; ground terms before use.
- **When:** Mid-stage nonfiction/structure work.
- **How:** `/writing-beats`. Explicit only.

#### `writing-shape`

- **What:** Exploit: shape material into an article, paragraph by paragraph.
- **When:** Final assembly of prose.
- **How:** `/writing-shape`. Explicit only.

## Relationship to pi VS Code process

| Concern | Owner |
|---------|--------|
| Current WI, approval, gates | [`ACTIVE.md`](../ACTIVE.md), [`AGENTS.md`](../AGENTS.md) |
| Collaboration Prepare/Build/Close | [`docs/guides/agent-collaboration.md`](../docs/guides/agent-collaboration.md) |
| Layer model, module owners, trust boundaries | [`docs/architecture/vscode-extension-architecture.md`](../docs/architecture/vscode-extension-architecture.md) |
| Architecture review checklist (before claiming “correct”) | [`docs/guides/architecture-governance.md`](../docs/guides/architecture-governance.md) |
| Domain glossary (`CONTEXT.md`) | [`CONTEXT.md`](../CONTEXT.md) |
| Test file layout | [`docs/guides/agent/testing.md`](../docs/guides/agent/testing.md) |
| Skill procedures | `.agents/skills/<name>/SKILL.md` |

Invoking `/implement` or `/to-spec` does **not** by itself authorize Build in this repository. Maintainer approval recorded in `ACTIVE.md` still applies.

## Maintenance

- Adding a skill: create `.agents/skills/<name>/SKILL.md` with frontmatter (`name`, `description`, optional `disable-model-invocation`), then update **this catalog** in the same change.
- Prefer `/ask-matt` over duplicating routing advice elsewhere.
- Do not put secrets, credentials, or private paths in skill docs.

## Index of skill directories

```text
ask-matt
code-review
codebase-design
diagnosing-bugs
documentation-health
domain-modeling
grill-me
grill-with-docs
grilling
implement
implement-spec
improve-codebase-architecture
loop-me
migrate-to-shoehorn
pi-sidebar-ui
pr
prototype
research
resolving-merge-conflicts
retro
scaffold-exercises
setup-matt-pocock-skills
setup-pre-commit
setup-ts-deep-modules
tdd
teach
to-questionnaire
to-spec
to-tickets
wait-what
wayfinder
wizard
writing-beats
writing-for-agents
writing-fragments
writing-shape
```
