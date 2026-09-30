---
name: quality-code
description: "Implement features, fix bugs, and make intentional behavior changes with focused scope, clear responsibilities, strong types, and behavior-based tests. Use for behavior-changing implementation tasks; route behavior-preserving refactoring to refactor instead. Not for read-only explanations, reviews, or documentation-only tasks."
---

# Quality Code

Apply the small-step discipline of refactoring to implementation. New features and fixes change behavior intentionally; unrelated behavior stays stable. Optimize for correctness and maintainability, not checklist scores.

## Authority and Scope

Follow the repository's instructions, approved requirements, architecture, and tooling. This skill supplies implementation discipline, not permission to expand scope, change product decisions, install dependencies, or create Git commits. Preserve pre-existing work.

Use this process for new features, bug fixes, and intentional behavior changes. For a task whose goal is restructuring existing code while preserving behavior, use `refactor` instead of this skill. In a mixed task, separate any necessary behavior-preserving preparation from the behavior change: use `refactor` for that preparation and this skill for implementation, rather than stacking both workflows on the same phase. Follow applicable testing, language, security, and domain-specific skills rather than duplicating their policies here.

## Workflow

### 1. Establish the Contract

- Read the affected implementation, callers, types, and relevant tests before editing.
- State the intended behavior change and the existing behavior that must remain stable.
- Identify relevant inputs, outputs, invalid states, side effects, and ownership of resources.
- Check approval when the change affects a product rule, persistence, dependency, or architectural boundary.

Done when the expected behavior is concrete enough to test and the permitted change scope is clear. Resolve consequential ambiguity before implementation; use existing conventions for routine choices.

### 2. Choose the Smallest Coherent Change

- Prefer existing APIs and local patterns. Locate upstream or standard-library capabilities before implementing replacements.
- Keep each responsibility with its established owner. Separate computation from effects where doing so makes the affected behavior easier to understand or test.
- Introduce an abstraction when it removes demonstrated duplication, hides meaningful complexity, or represents a real domain boundary. Choose the simplest representation that does the job.
- Keep preparatory refactoring separate and behavior-preserving. Limit it to what the approved change needs.

Done when every planned edit has a purpose tied to the contract. If a broader redesign is needed, explain the tradeoff and obtain the applicable approval.

### 3. Implement in Verifiable Steps

- Make one coherent change at a time, then run focused checks before building further on it.
- Use names that communicate intent, domain meaning, units, and ownership. Name constants when they carry meaning or must remain consistent.
- Keep every new or modified function below 50 physical body lines, including comments and blank lines, unless a higher-priority repository rule explicitly sets another limit. Check the count during final review; split longer functions along named responsibilities and verify preserved ordering, effects, and cleanup.
- Use early returns when they clarify branching while preserving validation order and side effects.
- Use the project's type system to express valid states. Validate external data at boundaries and narrow it before internal use.
- Handle failures at the layer that can make the decision. Preserve useful error context; expose incomplete or uncertain outcomes honestly.
- Make cleanup explicit for owned resources. For asynchronous work, account for cancellation, timeout, repeated calls, and stale results where applicable.
- Remove code made obsolete by this change after checking its callers. Explain only non-obvious intent or invariants in comments.

Done when the intended behavior is implemented, affected error paths are accounted for, and unrelated behavior remains intact.

### 4. Prove the Behavior

- Add or update focused tests for the observable contract, including relevant edge and failure cases. Exercise implementation through its normal boundary where practical.
- For a bug fix, reproduce the failure first when feasible and show the regression test fails against the old behavior. If reproduction is unavailable, record that limit.
- Use distinguishable inputs in isolation, ordering, and stale-result tests so the wrong behavior would produce a different result.
- Keep mocks at real boundaries. Ensure test setup reaches the behavior the assertion claims to check.
- Run repository-defined type/build checks, lint, and relevant tests. Broaden testing with the affected surface and risk.
- Verify real-host, UI, process, or integration behavior when acceptance requires it; simulated tests are not substitutes for those observations.

Done when checks have actually run and their results support the claimed behavior. Report blocked checks and unverified behavior rather than declaring them passed.

### 5. Review and Hand Off

Review the final diff, including interaction with pre-existing changes:

- Does the change satisfy the contract without unrelated edits?
- Are responsibilities and dependencies consistent with the surrounding code?
- Is every new or modified function below the function-length limit?
- Were baseline and verified-step Git checkpoints handled under the authorization rules below?
- Are types truthful, including failure and nullable states?
- Do affected resource and async paths have clear ownership and cleanup?
- Would the tests detect the relevant wrong behavior?
- Have affected contracts or user-facing documentation been updated as required?

Done when each applicable question has evidence, or a named limitation requiring follow-up. Summarize the behavior change, checks actually run, and residual risks. Follow the repository's recordkeeping and commit authorization rules.

## Git Checkpoints

Before implementation or preparatory refactoring, inspect the worktree and staged changes, run the relevant baseline checks, and establish a recoverable baseline. When the maintainer explicitly authorizes checkpoint commits, commit the in-scope baseline before edits, each small verified step, and the final verified state. Inspect the staged diff before each commit and follow repository commit conventions.

If authorization is absent, request it when checkpoint commits are needed and keep changes uncommitted until granted. Loading this skill or asking to edit it does not authorize commits. Preserve unrelated work; do not stage it, rewrite history, or create a branch without the applicable approval. Record failing baseline checks separately from regressions introduced by the change.

## Design Patterns

Evaluate patterns when the affected code has one of these shapes. Read [pattern examples](PATTERNS.md) when applying a pattern; they are implementation references, not an instruction to rewrite unaffected code.

| Shape | Candidate pattern | Intended benefit |
| --- | --- | --- |
| Several interchangeable algorithms behind repeated conditionals | Strategy | Isolate each algorithm behind a stable contract. |
| Complex construction with ordered steps or optional configuration | Builder | Make construction intent and valid final state explicit. |
| Ordered handlers where one may handle or reject a request | Chain of Responsibility | Make handler order and short-circuit behavior explicit. |

State which problem the selected pattern solves. Preserve error behavior, ordering, and side effects; choose a simpler function or data structure when it solves the same problem with less complexity.

## Conditional Checks

Apply these only when the corresponding behavior is touched:

| Area | Check |
| --- | --- |
| External input | Validate shape, bounds, and authorization before effects; keep secrets within their trusted owner. |
| Persistence | Account for existing records, partial writes, and migration or rollback needs. |
| Concurrency | Define ordering, identity, exclusivity, and what happens to late results. |
| Retry | Establish repeat safety and limits; distinguish failure from unknown completion. |
| Performance | Check realistic bounds and obvious regressions; measure before introducing optimization complexity. |
| Public API | Preserve compatibility or explicitly approve and document the change. |

## Quality Bar

A change is ready when behavior is correct for the approved scope, its structure is understandable in context, and verification supports the claims. More helpers, classes, patterns, tests, or stronger-looking types are useful only when they improve that outcome.
