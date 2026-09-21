# Agent and Maintainer Collaboration Guide

English | [中文](agent-collaboration.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Applies to: day-to-day development with coding agents and human product decisions
- Authority: collaboration process, session handoff, and work-item tracking conventions
- Related: [Documentation index](../README.md), [`ACTIVE.md`](../../ACTIVE.md), [`AGENTS.md`](../../AGENTS.md)

## 1. Purpose

**pi VS Code** is built through discussion between a maintainer (product judgment and acceptance) and coding agents (technical sequencing and implementation). Chat context does not persist across new windows or compression; **repository files** carry the current work item and handoff.

This guide does not define product behavior or system architecture. Those remain in `docs/product-requirements.md` (when present) and your primary architecture document under `docs/architecture/`.

## 2. Division of responsibility

| Maintainer | Coding agent |
|------------|----------------|
| States goals, preferences, and what feels wrong | Reads requirements, architecture, `AGENTS.md`, and `ACTIVE.md` |
| Chooses among proposed options (`yes` / `no` / `option B`) | Proposes the next work item, approach, risks, and acceptance steps |
| Accepts or rejects outcomes like an end user | Implements, runs checks, documents how to verify |
| Adds ideas to the parking lot | Keeps a single work in progress (WIP=1) |

The maintainer is not expected to know the product stack deeply. The agent proposes **what to do next**; the maintainer approves before large or irreversible code changes.

Agent proposals may conclude **“do not do this yet”**, **“current state is sufficient for this phase”**, or **“your premise does not match the repo”**—that is a valid proposal, not a failure to help. See [judgment.md](agent/judgment.md).

## 3. Sources of truth

| Question | Authority |
|----------|-----------|
| Security and repo rules | `AGENTS.md` kernel and `docs/guides/agent/` playbooks (see kernel load map) |
| User-visible scope and acceptance | `docs/product-requirements.md` when `Accepted` |
| Structure, boundaries, owners | Primary doc in `docs/architecture/` |
| **What we are doing right now** | [`ACTIVE.md`](../../ACTIVE.md) at repository root |
| Why a past choice was made | Accepted ADRs in `docs/decisions/` |
| Architecture gate status | [`docs/reference/architecture-gates.md`](../reference/architecture-gates.md) |

If chat and `ACTIVE.md` disagree, update `ACTIVE.md` after alignment.

## 4. Work in progress (WIP=1)

- Exactly **one** active work item (`WI-xxx`) in `ACTIVE.md` at a time.
- New ideas go to **Parking lot** in `ACTIVE.md`, not into implementation, until the maintainer reprioritizes.
- Each active WI has a persistent, fully reviewable proposal in `ACTIVE.md` covering goal and scope, approach and risks, observable acceptance, out of scope, applicable gate ID and decision class, **PRD assessment**, and approval status. A proposal can be incomplete during Prepare, but Build requires recorded maintainer approval.
- `ACTIVE.md` is the current-work entry point, not an append-only history. Its stable sections are: session entry, exactly one Current work section, Current focus and open items, Parking lot, at most two recent handoffs, and a compact Completed WI index. Closed-WI proposals, long acceptance checklists and older handoffs belong under `docs/archive/`, with a link from the index.
- Architecture **gates** must not be treated as shipped product until closed with an Accepted ADR.

### Progressive loading

Repository links form a routing tree, not a mandate to read every reachable file:

1. **Required entry:** follow the kernel's baseline reads; for implementation, read this guide and the current WI in `ACTIVE.md` in full.
2. **Conditionally required:** follow the matching `AGENTS.md` load-map route and the current WI's links for requirements, architecture, contracts, playbooks and upstream evidence.
3. **Background evidence:** open discussions and archive records only when the current question needs prior rationale or observations.

Stop expanding links when scope, constraints, contract and required evidence are established. Link reachability does not create authority or approval. If evidence is missing, conflicting or stale, report it rather than guessing. After context compression, if required material cannot be confidently recalled, reload from these entry points before editing.

## 5. Session rhythm

1. **Open** — Maintainer @-mentions **`ACTIVE.md` only** (or says 「继续 pi VS Code」). Agent reads `ACTIVE.md` and **this guide**, then restates: current WI, last session summary, proposed focus for today, and acceptance steps.
2. **Propose** — In Prepare, agent writes the reviewable WI proposal to `ACTIVE.md` and gives a short plan plus **Decision class**: `none` | `spike-only` | `adr-after-approval` (with gate ID if applicable). **PRD assessment is mandatory:** classify the WI as user-visible or technical-only, with a reason recorded in `ACTIVE.md`. For user-visible behavior, draft observable requirements (including relevant empty/error states), acceptance and a WI traceability row in `docs/product-requirements.md` and its translation; ask the maintainer to confirm the scope before Build. For technical-only work, record why no new PRD requirement is needed. Set the active WI's `PRD 判定` row to `用户可见` or `纯技术` with a reason; leave it `待定` only in Prepare. For user-visible Build, the PRD traceability row must name the WI and linked REQ IDs. Draft text is not shipped behavior; do not mark the PRD `Accepted` without explicit maintainer approval. Maintainer confirms (e.g. 「可以」「按 A 做」); record approval and chosen approach before moving to Build. A chat-only plan or one-line goal is not sufficient.
3. **Build** — After confirmation, agent follows `AGENTS.md` load map (packs, architecture governance when touching boundaries), implements, runs `package.json` checks when present, and reports results.
4. **Close** — Compare delivered user-visible behavior against the approved PRD slice and WI acceptance; reconcile differences or explicitly defer them before claiming delivery. Agent updates `ACTIVE.md` **Last session**. If a gate-closing decision was confirmed, draft or update `docs/decisions/000x-….md` and [`architecture-gates.md`](../reference/architecture-gates.md), or set `Decision: pending-adr` on the work item.

### Git ownership and concern isolation

At the start of every task, inspect `git status`, the unstaged `ACTIVE.md` diff, and the existing staged diff. Classify every observed change as **pre-existing agent work**, **current-task work**, or **user-owned work**; uncertainty means user-owned until clarified. Keep an ephemeral commit map for the session: one row per concern recording its owner, intended commit, and expected paths or hunks. The worktree may contain several concerns even though product work remains WIP=1, but every change must have clear ownership and a destination before staging.

Treat `ACTIVE.md` as an isolated record stream:

- An implementation commit must not contain `ACTIVE.md`.
- The current WI record belongs in a separate `docs(active)` commit.
- Unrelated `ACTIVE.md` maintenance belongs in a separate `fix(docs)` or `docs` commit, according to whether it corrects an error or only updates documentation.

Stage by path and hunk, preserving the pre-existing index. If concerns overlap so that hunk staging is unsafe, save a complete, non-destructive work copy, reconstruct and commit the first concern from its baseline, then restore the remaining work with a three-way apply and inspect the result. Never stash, drop, overwrite, reset, or commit user-owned work without explicit authorization.

Before any commit, follow the staged-content review in [Git commit convention](../git-commit-convention.md). Commit authorization is unchanged: these isolation rules never authorize creating or rewriting a commit.

## 6. Maintainer prompts (copy-paste)

**New chat (routine):**

```text
继续 pi VS Code。只 @ ACTIVE.md。
先复述当前 WI、Last session、建议今天完成什么（含验收）；我确认后再改代码。
```

**Acceptance failed:**

```text
验收不通过：期望 … / 实际 …。请只修此问题，再给验收步骤，并更新 ACTIVE。
```

**Parking lot only:**

```text
停车场：……。不要实现，只写入 ACTIVE，继续当前 WI。
```

## 7. Agent obligations

- Propose the next step from requirements, architecture, and `ACTIVE.md`; do not require the maintainer to memorize a multi-step workflow. If the WI proposal is missing, complete it in Prepare before asking to build.
- Obtain approval for scaffolding, security-boundary changes, breaking layout, and the decisions underlying ADRs. Recording an already approved decision requires no separate permission.
- On session end, update `ACTIVE.md` Last session even if work is incomplete.
- Report: what changed, commands to run, what was tested, known limits.
- Follow [When to write an ADR](../decisions/README.md#when-to-write-an-adr); label each proposal with gate ID and decision class.

### Proactive recordkeeping

Apply this checkpoint when a discussion reaches a meaningful interim conclusion, the maintainer confirms a choice, and a WI closes or affected documentation is replaced. It also applies to discussion-only sessions; do not wait for an implementation request or a directory instruction.

| Trigger | Agent action |
|---------|--------------|
| A comparison, tradeoff, investigation or unresolved question is worth retaining across sessions | Create or update one topic in `docs/discussions/`: background, options, evidence, current leaning and open questions. Summarize rather than transcribe chat. |
| The maintainer explicitly confirms a choice covered by the ADR criteria | Create or update `docs/decisions/` with context, decision, rationale, alternatives, consequences and evidence. Record approval separately from verification; use Accepted only after required approval and verification. Otherwise retain the pending state and missing conditions. |
| WI close or a confirmed replacement leaves inactive material worth retaining | Archive affected old discussions, proposals or long closed-WI records under `docs/archive/`, with reason, historical status and a replacement link (or an explicit explanation when none exists). Keep historical ADRs in `docs/decisions/` with status and replacement relationships. |
| Routine Q&A, a small change or a one-line future idea | No standalone document; use the existing handoff or parking lot if needed. |

Before writing, find and update the existing topic; avoid empty files, duplicate reports and multiple copies of the same facts. Keep the complete current-WI proposal, approval state, unresolved blockers and brief handoff in `ACTIVE.md`; link detailed background, decisions and closed history instead of copying them back. At WI close, move the inactive proposal, long acceptance evidence and superseded handoffs to archive, then replace them with one row in the Completed WI index. The approved current scope and acceptance must remain readily reviewable from ACTIVE.

This rule provides standing authorization for recordkeeping and archival **within the discussion or work already authorized**, without asking whether to save or where to put it. It does not approve a proposal, broaden implementation scope, start a bulk historical cleanup, authorize deletion or create Git commits. An explicit read-only request takes precedence. If approval is ambiguous, ask only about the specific decision; never infer approval from an agent recommendation or a successful test.

Before archiving, preserve still-valid requirements and unresolved questions in an active document and link them; do not hide blockers or rewrite historical decisions. Move existing translations together, repair inbound and relative links and indexes, and leave a summary/link at the former entry point. Age or length alone is not an archival trigger. Follow the directory rules and [documentation health](documentation-health.md); run `npm run docs:verify` and, at WI close or archival, `npm run docs:health`.

In the final handoff, briefly report what was saved or updated, its path, and any decision or verification still pending. No qualifying content means no new document.

## 8. ADRs and gates (maintainer-friendly)

- **You approve**; the agent writes ADRs after approval when triggers apply.
- **ADR timing**: after spike/discussion is done and you confirm (not at first proposal).
- **Gate closure** needs an Accepted ADR linked from [`architecture-gates.md`](../reference/architecture-gates.md).
- In `ACTIVE.md`, use **Gate ID** (e.g. `gate-build-baseline`) and **Decision** (`none` | `pending-adr` | `0001-slug`).

### Documentation drift

At every WI close, inspect affected documents for superseded content and run `npm run docs:health`; record updates, retained history or deferred findings in the existing handoff. Follow [documentation health](documentation-health.md). This is a manual review obligation, not an installed weekly scheduler, and permits only the scoped recordkeeping in §7, not unrelated cleanup or commits.

After doc-heavy sessions or before closing a WI that touched gates or ADRs, run `npm run docs:verify`. For boundary reviews, use [`architecture-governance.md`](architecture-governance.md) (copied from engineering-template `workflow/architecture-governance.md`).

## 9. Phases (lightweight)

Each work item in `ACTIVE.md` is either:

- **Prepare** — scope, gates, contracts, or discussion; persist the WI proposal and seek maintainer approval; no feature implementation yet.
- **Build** — code and verification against the approved proposal recorded in `ACTIVE.md`.

Finer steps are decided by the agent per work item and recorded in `ACTIVE.md` when relevant.

## Maintenance (session contract summary)

When §5–§8 change substantively, update the **Agent session contract** table at the top of [`ACTIVE.md`](../../ACTIVE.md) in the same change set.
