---
name: implement-spec
description: "Implement a specification in code."
disable-model-invocation: true
---

You have been provided a spec. This spec should have tickets associated with it, describing how to implement the spec.

The goal is a PR which implements the entire spec on a single branch.

The tickets are not a list of steps. They are a **task graph** with blocking relationships between them. This means there is always a **frontier** of tickets which are ready to be grabbed.

Use context pointers to the spec, tickets, research notes and previous commits. Follow the repository's current-WI approval and sequencing rules.

## Steps

1. Read the spec and tickets, including their blocking relationships. Identify the next approved, unblocked ticket.
2. Investigate the relevant code and documentation in the current session. Retain useful findings through the repository's existing recordkeeping workflow.
3. Use one suitable working branch for the approved implementation. Create a draft PR only when the task calls for one and its authorization permits it.
4. Implement and verify one ticket at a time. Update its evidence and status before selecting the next unblocked ticket within the authorized scope.
5. Once all approved tickets are complete, use /code-review on the combined diff. Review Standards and Spec sequentially and fix actionable findings.
6. Run the required combined checks and record unfinished acceptance conditions. Mark an existing PR ready only when its requirements are satisfied and that action is authorized.
