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

This guide owns work approval and handoff. [Product requirements](../product-requirements.md) own user-visible scope; [architecture](../architecture/vscode-extension-architecture.md) owns boundaries.

## 2. Division of responsibility

| Maintainer | Coding agent |
|------------|----------------|
| States goals, preferences, and what feels wrong | Reads requirements, architecture, `AGENTS.md`, and `ACTIVE.md` |
| Chooses among proposed options (`yes` / `no` / `option B`) | Proposes the next work item, approach, risks, and acceptance steps |
| Accepts or rejects outcomes like an end user | Implements, runs checks, documents how to verify |
| Adds ideas to pending work | Completes approved work one WI at a time |

The maintainer is not expected to know the product stack deeply. The agent proposes **what to do next**; the maintainer approves before large or irreversible code changes.

Agent proposals may conclude **“do not do this yet”**, **“current state is sufficient for this phase”**, or **“your premise does not match the repo”**—that is a valid proposal, not a failure to help. See [judgment.md](agent/judgment.md).

## 3. Sources of truth

Use [AGENTS](../../AGENTS.md) for document responsibilities and conflict priority. The PRD is Accepted for personal-use macOS local VS Code installed VSIX; standing non-goals stay excluded. Historical slice records still bound their own evidence limits. Read the [gate table](../reference/architecture-gates.md) for status and the [ADR index](../decisions/README.md) for established technical decisions.

When a new confirmed choice in chat differs from ACTIVE, update ACTIVE to that confirmed choice while retaining unresolved conditions.

## 4. Work in progress (WIP=1)

- One agent owns implementation, review, verification and handoff for one current work item (`WI-xxx`). Finish it, or record its blocker and the next focus, before starting another. Use additional agents only when the maintainer explicitly requests them for the current task.
- New ideas go to **Pending work (待完成)** with their approval state; recording an idea does not authorize implementation. Previously approved unfinished WIs retain their scope and acceptance requirements in a sequential queue linked from `ACTIVE.md`.
- The current WI records scope, approval, dependencies, expected paths, failure modes, PRD/architecture impact, observable acceptance, verification and handoff status. Prepare must be complete before Build; existing explicit scoped authorization remains valid.
- Reuse the suitable current checkout and working branch. Inspect staged/unstaged changes and preserve uncertain ownership before editing. The agent maintains `ACTIVE.md` and its linked evidence through completion.
- `ACTIVE.md` is a live task list with two sections: **Current work (正在做)** and **Pending work (待完成)**. Use `## 正在做（WIP=1）` for one current WI or `## 正在做（WIP=0）` with a short “none” statement, followed by `## 待完成`. Current work holds scope, approval, progress, blockers and the next action; pending rows hold only unfinished scope, priority and start/acceptance conditions. Move an item between sections rather than duplicating it. Detailed proposals and evidence may live in linked WI records. Completed tasks, acceptance summaries, recent-session histories and per-WI completed links belong in `docs/archive/`, not ACTIVE. A single generic archive-index link is sufficient.
- Architecture gates, security, actual acceptance and Git authorization requirements remain unchanged.

### Progressive loading

Repository links form a routing tree, not a mandate to read every reachable file:

1. **Required entry:** follow the kernel's baseline reads; for implementation, read this guide and the current WI in `ACTIVE.md` in full.
2. **Conditionally required:** follow the matching `AGENTS.md` load-map route and the current WI's links for requirements, architecture, contracts, playbooks and upstream evidence.
3. **Background evidence:** open discussions and archive records only when the current question needs prior rationale or observations.

Stop expanding links when scope, constraints, contract and required evidence are established. Link reachability does not create authority or approval. If evidence is missing, conflicting or stale, report it rather than guessing. After context compression, if required material cannot be confidently recalled, reload from these entry points before editing.

## 5. Session rhythm

| Step | Action and completion criterion |
|------|---------------------------------|
| Open | Use kernel baseline reads, this guide and ACTIVE to establish the WI, approval, progress, next action and acceptance. Mentioning only ACTIVE uses the same entry procedure. |
| Propose (Prepare) | Complete the reviewable proposal from §4 in the linked WI record, with decision class `none` / `spike-only` / `adr-after-approval` and applicable gate. Record maintainer approval of approach/scope before Build; existing explicit approval remains valid. |
| Build | Implement the approved proposal using AGENTS task routes and run applicable checks. Completion requires reviewable behavior and verification results, not merely edited files. |
| Close | Reconcile the approved slice and acceptance; fix or explicitly defer differences. Update unfinished task status; move completed task records out of ACTIVE under §7. Keep missing maintainer acceptance or ADR conditions pending and name the gap. |

**PRD assessment:** the current WI's `PRD 判定` row must state `用户可见` or `纯技术` with a reason; `待定` is allowed only in Prepare. Before user-visible Build, both PRD languages need observable slice behavior, relevant empty/error states, acceptance and WI/REQ traceability, followed by maintainer scope confirmation. Technical-only work records why no new requirement is needed. Draft candidates are not approved behavior; promoting the entire PRD to Accepted requires explicit approval.

### Git ownership and concern isolation

At the start of every task, inspect `git status`, the unstaged `ACTIVE.md` diff, and the existing staged diff. Classify every observed change as **pre-existing agent work**, **current-task work**, or **user-owned work**; uncertainty means user-owned until clarified. Keep an ephemeral commit map for the session: one row per concern recording its owner, intended commit, and expected paths or hunks. The worktree may contain several concerns, but every change must have clear ownership and a destination before staging.

When staging or committing, load the [Git commit convention](../git-commit-convention.md), which owns ACTIVE isolation, overlapping-hunk recovery and full staged-content review. Keep the WI record distinct from implementation concerns, preserving the existing index and user work. Commits still require explicit authorization.

### Candidate evidence and remote checks

Task-candidate validation and PR-integration validation answer different questions:

- Validate the committed candidate after incorporating the fetched `origin/master`, resolving conflicts and running relevant checks in the current checkout.
- Before landing, validate the actual integration candidate, such as the PR merge ref or a trusted merge-queue candidate. Record its tested commit, target base and PR head, not merely the task branch name. A task result applies to another candidate only when the relevant executable tree is identical; a changed base requires updated integration evidence.
- Formal candidate evidence identifies a committed, clean source tree. Checks against uncommitted files are development evidence: record the dirty state and retain the patch/source snapshot, rather than claiming that HEAD alone passed. Changes after a run do not inherit its result.
- The [PR base workflow](../../.github/workflows/pr-base.yml) runs on all PRs targeting `master`, including documentation-only changes. The shared CLI accepts `--base <full-commit-sha> --head <full-commit-sha>` without fetching and checks those exact snapshots, not checkout HEAD, which may be a synthetic merge. The no-argument local command still fetches first. The workflow preserves fixture results and the PR ancestry log; neither proves product behavior or real-host acceptance.
- The remote check covers the PR event's base/head snapshot only. Its presence is not a configured merge requirement or continuous proof of the latest target branch. Maintainers must separately configure required checks and up-to-date-branch or trusted merge-queue protection, and rerun affected checks for a changed candidate. Do not claim these server settings or remote execution are verified from a local workflow file.

Record evidence using this identity block alongside the checks required by the [testing guide](agent/testing.md); do not create a new test tier merely to fill the template:

```text prompt
Validation stage: task-candidate | PR-integration | development
Tested candidate commit: <full SHA of the source that actually ran>
Base commit: <full SHA incorporated or used by that candidate>
PR head commit: <full SHA for integration evidence, otherwise not applicable>
Source state: clean | dirty (development evidence only)
Dirty source snapshot: <patch/source artifact if dirty, otherwise not applicable>
Checks: <exact commands/suites>
Results: <passed, failed, skipped and unverified separately>
Environment: <actual host/runtime and relevant versions>
Artifacts: <repeatable report/log locations>
```


## 6. Maintainer prompts (copy-paste)

**New chat (routine):**

```text
继续 pi VS Code。只 @ ACTIVE.md。
先复述当前 WI、未完成进度、建议今天完成什么（含验收）；我确认后再改代码。
```

**Acceptance failed:**

```text
验收不通过：期望 … / 实际 …。请只修此问题，再给验收步骤，并更新 ACTIVE。
```

**Record pending work only:**

```text
待完成：……。不要实现，只写入 ACTIVE，继续当前 WI。
```

## 7. Agent obligations

Scaffolding, security-boundary changes, breaking layout and decisions underlying ADRs require approval; recording an already approved decision needs no new permission. At session end, update the unfinished task in ACTIVE with progress, actual checks/results, blockers and next action. On completion, move the record and acceptance evidence to archive and remove the task from ACTIVE. For small completed documentation changes, report in chat and update an existing relevant record when needed; do not create a completed-task entry in ACTIVE. Use the [ADR rules](../decisions/README.md) for classification and acceptance conditions.

### Proactive recordkeeping

Apply this checkpoint when a discussion reaches a meaningful interim conclusion, the maintainer confirms a choice, and a WI closes or affected documentation is replaced. It also applies to discussion-only sessions; do not wait for an implementation request or a directory instruction.

| Trigger | Agent action |
|---------|--------------|
| A comparison, tradeoff, investigation or unresolved question is worth retaining across sessions | Create or update one topic in `docs/discussions/`: background, options, evidence, current leaning and open questions. Summarize rather than transcribe chat. |
| The maintainer explicitly confirms a choice covered by the ADR criteria | Create or update `docs/decisions/` with context, decision, rationale, alternatives, consequences and evidence. Record approval separately from verification; use Accepted only after required approval and verification. Otherwise retain the pending state and missing conditions. |
| WI close or a confirmed replacement leaves inactive material worth retaining | Archive affected old discussions, proposals or long closed-WI records under `docs/archive/`, with reason, historical status and a replacement link (or an explicit explanation when none exists). Keep historical ADRs in `docs/decisions/` with status and replacement relationships. |
| Routine Q&A, a small change or a one-line future idea | No standalone document; update an existing relevant record or pending row if needed; completed small changes need no ACTIVE entry. |

Before writing, find and update the existing topic; avoid empty files, duplicate reports and multiple copies of the same facts. Keep the complete current-WI proposal, approval state, unresolved blockers and brief handoff in the linked per-WI record; link detailed background and decisions on demand; find closed history through the archive index rather than per-WI links in ACTIVE. At WI close, move the inactive proposal, long acceptance evidence and superseded handoffs to archive, then update the completed WI index under `docs/archive/` and remove the task from ACTIVE. Only unfinished scope remains in ACTIVE; approval pending, blocked or partially verified work is not complete. The approved current scope and acceptance must remain readily reviewable from ACTIVE.

This rule provides standing authorization for recordkeeping and archival **within the discussion or work already authorized**, without asking whether to save or where to put it. It does not approve a proposal, broaden implementation scope, start a bulk historical cleanup, authorize deletion or create Git commits. An explicit read-only request takes precedence. If approval is ambiguous, ask only about the specific decision; never infer approval from an agent recommendation or a successful test.

Before archiving, preserve still-valid requirements and unresolved questions in an active document and link them; do not hide blockers or rewrite historical decisions. Move existing translations together, repair inbound and relative links and indexes, and retain navigation through the appropriate index. In ACTIVE, retain only a generic archive-index link, not a completed-task summary. Age or length alone is not an archival trigger. Follow the directory rules and [documentation health](documentation-health.md); run `npm run docs:verify` and, at WI close or archival, `npm run docs:health`.

In the final handoff, briefly report what was saved or updated, its path, and any decision or verification still pending. No qualifying content means no new document.

## 8. ADRs and gates

After the maintainer confirms an architectural choice, use the [ADR rules](../decisions/README.md) to record the decision and verification. The [gate table](../reference/architecture-gates.md) defines gate acceptance; retain current status and record gaps while evidence or approval is missing. ACTIVE uses `Gate ID` and `Decision` (`none` / `pending-adr` / ADR identifier).

### Documentation drift

At every WI close, inspect affected documents for superseded content and run `npm run docs:health`; record updates, retained history or deferred findings in the existing handoff. Follow [documentation health](documentation-health.md). This is a manual review obligation, not an installed weekly scheduler, and permits only the scoped recordkeeping in §7, not unrelated cleanup or commits.

After doc-heavy sessions or before closing a WI that touched gates or ADRs, run `npm run docs:verify`. For boundary reviews, use [`architecture-governance.md`](architecture-governance.md) (copied from engineering-template `workflow/architecture-governance.md`).

## 9. Phases

Use the Prepare/Build boundaries in §5. Record finer task steps and missing conditions in ACTIVE when relevant; a phase label is not implementation authorization or acceptance.

## Maintenance

This guide is the single source for ACTIVE writing rules; do not copy a session-contract table into ACTIVE. When the required structure changes, update `scripts/docs/docs-verify-lib.mjs` and its relevant tests together. Use plain task names, distinguish pending from current work, and remove completed content at closure. This 2026-10-03 layout is a project-local maintainer-approved adaptation; no sibling/template repository was changed.
