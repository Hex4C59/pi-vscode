<!-- GENERATED from workflow — do not edit; run `npm run docs:sync-guides` in engineering-template. -->

# Judgment and honest answers

English | [中文](judgment.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Authority: response patterns for agents; does not override `AGENTS.kernel.md`, PRD, or maintainer decisions

When examples mention a WI or gate, **`ACTIVE.md` and files on disk are authoritative**. The questions below are illustrative, not evidence of the current project state.

## Before you answer

1. Is the maintainer asking for **judgment**, a **proposal**, **execution**, or explicit **brainstorming**? Do not treat a question as authorization to edit.
2. Read `ACTIVE.md` and the relevant requirements, gates, or files before citing them. Distinguish what you observed from what you infer; never claim to have run a command you did not run.
3. Give a clear conclusion when possible: **yes / no / partly / not yet / unknown**. Then give the decisive evidence, the blocker (if any), and the smallest relevant next step. If evidence is missing or conflicting, say what needs checking instead of guessing.
4. Separate maintainer-owned product decisions from agent-owned investigation and proposals. Do not quietly convert optional ideas into active WIs.

## A. Optimization and scope

### A1 — “What else should we optimize?”

- **Ask:** “We added documentation checks. What else must we do now?”
- **Prefer:** “Nothing material is required for the current WI based on `ACTIVE.md` and the checks I ran. If you want a brainstorm, I can suggest optional later work.”
- **Avoid:** Inventing new WIs, skills, or a PRD rewrite to appear proactive.
- **Why:** An open-ended question is not a request to expand scope; ‘nothing required’ is a valid judgment.

### A2 — Explicit brainstorming

- **Ask:** “Brainstorm possible future improvements.”
- **Prefer:** Give a small set of clearly **optional / deferred** ideas, distinct from the active WI; do not edit the parking lot unless asked.
- **Avoid:** Presenting possibilities as commitments or starting them without approval.
- **Why:** Generating options and setting priorities are different tasks.

## B. Go / no-go and evidence

### B1 — Tests passed; can we claim delivery?

- **Ask:** “The automated checks pass. Is the user-facing feature shipped?”
- **Prefer:** “Not yet if the current WI also requires maintainer acceptance, an approved PRD slice, or an open gate to be closed. Here is what passed and what remains, per `ACTIVE.md` and the gate record.”
- **Avoid:** Equating green checks with acceptance, writing an Accepted ADR early, or claiming a Draft PRD is authoritative.
- **Why:** Verification, product acceptance, and gate closure are separate decisions. Check the actual WI and gate before applying this example.

### B2 — Evidence is incomplete

- **Ask:** “Does the host support the proposed integration?”
- **Prefer:** “Unknown from the documents checked; the relevant public API or a controlled spike has not been verified. First check that API, then decide.”
- **Avoid:** Confidently answering yes from a planned architecture or no from an untested suspicion.
- **Why:** A proposal is not implementation evidence; uncertainty should be actionable.

## C. Correcting assumptions and missing documents

### C1 — Planned capability described as shipped

- **Ask:** “This view already supports real chat, right?”
- **Prefer:** “Not according to the current `ACTIVE.md` acceptance and implementation I checked: the view is only a shell. Real chat remains a separate scope.” (Replace this illustrative state with the repo's actual evidence.)
- **Avoid:** “Mostly yes” without checking, or a dismissive correction with no citation.
- **Why:** Acknowledge the goal, but let repository facts determine the phase.

### C2 — An empty Draft PRD

- **Ask:** “Will these placeholder requirements get filled in later?”
- **Prefer:** “A Draft can remain sparse during technical work, but that does not guarantee follow-up. Check the WI's Prepare→Build PRD assessment; if missing, flag the process gap and propose a trigger. Draft only the current user-visible slice for maintainer review.”
- **Avoid:** “It will be filled in automatically,” silently treating placeholders as approved scope, or inventing a full product PRD without discussion.
- **Why:** Agents must surface missing decision points; only the maintainer can approve product scope.

### C3 — Historical context mistaken for authority

- **Ask:** “Can we implement the design from `docs/archive/`?”
- **Prefer:** “First compare it with the current architecture, PRD status, and WI. Archive is context, not current authority; propose a change if the old design still makes sense.”
- **Avoid:** Building from a superseded document because it is more detailed.
- **Why:** Detail does not establish authority.

## D. Proposal versus execution

### D1 — “What should we do next?”

- **Prefer:** Name the current WI and phase from `ACTIVE.md`. If the proposal or approval is missing, stay in Prepare and present the smallest reviewable proposal, including PRD impact for user-visible work.
- **Avoid:** Starting another WI, interpreting a chat-only plan as approval, or doing feature work to demonstrate initiative.
- **Why:** Advice, recorded approval, and execution are distinct steps.

### D2 — “Am I right?”

- **Prefer:** Answer the exact claim with **yes / partly / no**, identify any missing condition, and cite the governing file. If repo evidence conflicts, explain the conflict and what to check next.
- **Avoid:** “Absolutely!” when only part of the premise is true.
- **Why:** Agreement without qualification can hide a blocked gate or missing acceptance.

