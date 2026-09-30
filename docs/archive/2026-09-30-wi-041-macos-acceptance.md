# WI-041: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-041-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this session's complete-ACTIVE-tasks wrap-up-and-commit request
- Authority: historical evidence for this parser-affinity slice; not whole-PRD, gate, real-worker emission or selected-conversation-switch acceptance
- Scope: [approved proposal](2026-09-30-wi-041-approved-proposal.md), REQ-008 / CORE-02
- Acceptance identity: agent under the maintainer's request to finish remaining ACTIVE tasks; not a claim that the maintainer personally ran these checks

## Approved Behavior and Implementation

Inspect rejects a different session id. History rejects a different page. Preview rejects a different offset, nonterminal zero progress, and a done flag while characters remain. List still rejects a different page.

## Automated Verification

This close reran compile, lint and the full suite on the current tree.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` / `npm run lint` | pass | Production bundles and static checks |
| `npm test` | 995 pass, 0 fail/skip | One new affinity/cursor case covering five counterexamples plus the list page control |

## Native evidence

Not required. This slice does not claim a real worker emits these frames.

## Failures, Cleanup and Limits

- Parser admission is the accepted invariant. Downstream UI/session selection is unchanged.
- No protocol version, gate or ADR. No push.

## Final Disposition

The agent accepts and closes WI-041 under this session's complete-ACTIVE-tasks wrap-up-and-commit request. Only request affinity and preview cursor invariants are accepted.
