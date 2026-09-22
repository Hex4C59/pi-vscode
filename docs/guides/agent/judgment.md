# Judgment and honest answers

English | [中文](judgment.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Authority: response patterns for agents; does not override `AGENTS.kernel.md`, PRD, or maintainer decisions

- Provenance: local revision of engineering-template `workflow/judgment.md`. The maintainer authorized this project documentation review on 2026-09-22; the template is not synchronized. Reconcile local changes before future sync.

## Answer procedure

1. **Identify the request.** Distinguish judgment, proposal, execution and explicit brainstorming, checking existing authorization. A read-only question is complete when answered; an implementation request requires completing the authorized work.
2. **Check evidence.** Follow kernel baseline reads and task routes to ACTIVE and the relevant requirements, gates, code or verification record. Separate observation, inference and unknowns. Finish when factual conclusions have cited support and missing evidence has a concrete checking action.
3. **Decide.** Lead with yes, no, partly, not yet or unknown; give decisive evidence and the necessary next step. No additional work needed for this phase is a valid conclusion.
4. **Record the handoff.** Product tradeoffs belong to the maintainer; investigation and proposals belong to the agent. Save conclusions worth retaining under [collaboration §7](../agent-collaboration.md#7-agent-obligations). Recording an idea does not authorize implementation or a parallel WI.

## Apply by question

| Question | Completion criterion |
|----------|----------------------|
| What else needs optimization? | Compare observed gaps with current-WI acceptance; say when no material change is needed. List optional ideas only for an explicit options/brainstorm request. |
| Please brainstorm | Label ideas optional/deferred and distinguish exploration from commitments; record them under the collaboration rules. |
| Tests passed; is it delivered? | Check technical verification, the approved slice, required manual acceptance and applicable gates separately. Claim completion only for supported scope. |
| Does the host support this integration? | Support the answer with a public API or controlled spike; otherwise identify the unknown and smallest verification step. |
| This feature already exists, right? | Check current implementation and acceptance; state the supported part and limits. Historical scaffold examples cannot establish today's state. |
| Will the Draft PRD be filled later? | Check the Prepare→Build PRD assessment and slice proposal; identify a missing trigger instead of promising automatic completion. |
| Can we implement the archived design? | Compare current authority and approval; a useful historical design can inform a proposal, not authorize implementation. |
| What should happen next? | Recommend from ACTIVE's WI, phase and open conditions; keep unapproved new scope in Prepare. |
| Am I right? | Answer the exact claim with yes/partly/no, evidence and missing conditions. |

## Evidence boundaries

Examples define a reasoning method only. Obtain WI status, versions and acceptance from the current files and checks; unrun checks remain unverified. Maintainer approval does not replace factual evidence, and agent advice or passing tests do not replace product decisions, gate acceptance or explicit commit authorization.
