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
- Architecture **gates** must not be treated as shipped product until closed with an Accepted ADR.

## 5. Session rhythm

1. **Open** — Maintainer @-mentions **`ACTIVE.md` only** (or says 「继续 pi VS Code」). Agent reads `ACTIVE.md` and **this guide**, then restates: current WI, last session summary, proposed focus for today, and acceptance steps.
2. **Propose** — Agent gives a short plan plus **Decision class**: `none` | `spike-only` | `adr-after-approval` (with gate ID if applicable). No broad implementation until the maintainer confirms (e.g. 「可以」「按 A 做」).
3. **Build** — Agent follows `AGENTS.md` load map (packs, architecture governance when touching boundaries), implements, runs `package.json` checks when present, and reports results.
4. **Close** — Agent updates `ACTIVE.md` **Last session**. If a gate-closing decision was confirmed, draft or update `docs/decisions/000x-….md` and [`architecture-gates.md`](../reference/architecture-gates.md), or set `Decision: pending-adr` on the work item.

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

- Propose the next step from requirements, architecture, and `ACTIVE.md`; do not require the maintainer to memorize a multi-step workflow.
- Confirm before scaffolding, ADRs, security-boundary changes, or breaking layout.
- On session end, update `ACTIVE.md` Last session even if work is incomplete.
- Report: what changed, commands to run, what was tested, known limits.
- Follow [When to write an ADR](../decisions/README.md#when-to-write-an-adr); label each proposal with gate ID and decision class.

## 8. ADRs and gates (maintainer-friendly)

- **You approve**; the agent writes ADRs after approval when triggers apply.
- **ADR timing**: after spike/discussion is done and you confirm (not at first proposal).
- **Gate closure** needs an Accepted ADR linked from [`architecture-gates.md`](../reference/architecture-gates.md).
- In `ACTIVE.md`, use **Gate ID** (e.g. `gate-build-baseline`) and **Decision** (`none` | `pending-adr` | `0001-slug`).

### Documentation drift

After doc-heavy sessions or before closing a WI that touched gates or ADRs, run `npm run docs:verify`. For boundary reviews, use [`architecture-governance.md`](architecture-governance.md) (copied from engineering-template `workflow/architecture-governance.md`).

## 9. Phases (lightweight)

Each work item in `ACTIVE.md` is either:

- **Prepare** — scope, gates, contracts, or discussion; no feature implementation yet.
- **Build** — code and verification.

Finer steps are decided by the agent per work item and recorded in `ACTIVE.md` when relevant.

## Maintenance (session contract summary)

When §5–§8 change substantively, update the **Agent session contract** table at the top of [`ACTIVE.md`](../../ACTIVE.md) in the same change set.
