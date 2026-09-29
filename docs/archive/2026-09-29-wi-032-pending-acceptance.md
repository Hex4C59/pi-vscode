# WI-032 — Shared credential text (acceptance pending)

English | [中文](2026-09-29-wi-032-pending-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-29
- Authority: preserved approved proposal and handoff; current work is [ACTIVE](../../ACTIVE.md)

## Final status

On 2026-09-30 the agent accepted and closed the approved slice under the maintainer's final delegation, without independent maintainer sign-off. See the [acceptance record](2026-09-30-wi-032-macos-evaluation.md). Pending wording below is historical, not a current blocker.

## Why retained here

The maintainer prioritized WI-033 on 2026-09-29. WI-032 leaves the sole current-work slot without being closed or accepted. ACTIVE retains its pending acceptance. No new gate or ADR; Decision: none. The PRD stays Draft.

## Approved scope and acceptance

The maintainer authorized implementation, then requested a commit. Six host entries share the pure `containsCredentialLikeText` refusal and `redactCredentialLikeText` display rules from [contracts](../../src/extension/contracts/index.ts): runtime dialogs cancel, feedback uses a fixed safety notice, activity/final text redacts, tool approvals deny without cards, review snapshots become unavailable, and attachments refuse sensitive text. The rule covers the existing union of private-key markers, credential-field assignments and Bearer values, including empty field assignments after spaces. User-entered dialog answers remain literal.

The host owns the pure contract; the adapter consumes it. Existing length limits, lifecycle and entry-specific refusal results remain. Ordinary context remains visible; private-key markers hide the whole display text. Filtering is best-effort, not proof that secrets never reach the Webview. This is a user-visible consistency correction with no new capability or architecture boundary.

Acceptance covers all six entry results, ordinary text, user answers and post-redaction display truncation. Historical session redaction, authentication classification, sensitive path rules, model settings, other secret handling and already committed WI-031 are outside scope.

## Historical handoff

Implementation and automated checks completed: compile and lint passed; npm test passed 782 tests, with no failures or skips; docs:verify had no errors and two existing ADR 0005 Draft warnings; git diff --check passed. F5 and installed VSIX were not performed. Maintainer acceptance remains pending. The maintainer requested commit without push; these checks are historical, not WI-033 evidence.
