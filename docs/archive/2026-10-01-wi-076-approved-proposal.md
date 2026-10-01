# WI-076: queued-input RPC approved proposal

English | [中文](2026-10-01-wi-076-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: scoped historical evidence; not product UI acceptance

## Approval and archival reason

Closed after the technical prerequisite was verified. The October 1 continuing goal explicitly authorized serial Prepare→Build promotion of existing PI-GAP candidates without repeated nomination. This scoped WI selects PI-GAP-01's actual public-RPC evidence before a separate user-visible WI; it does not finish that candidate. Gate none, decision spike-only, pure technical PRD assessment. WIP=1, no push, no ADR status change.

## Scope and approach

Run the declared and installed pi 0.86.1 CLI against an isolated synthetic loopback provider. Reuse the production LF JSONL reader; isolate HOME, agent state, cwd and environment. Verify busy ordinary-prompt rejection, steering/follow-up acknowledgment versus actual delivery, clear_queue exact returned text, and clear-before-abort. Observe public state, request order, agent_settled and process close; remove owned temporary fixtures. No real credentials, paid model, product session-file access or production contracts change.

## Acceptance and failure modes

Before implementation, identify wrong busy admission, mixed queue semantics, acknowledgment mistaken for execution, damaged/lost recalled text, abort replay, old-message contamination, Unicode framing, leaked processes/files on failure, and accidental real-user/network access. Require observable assertions and nonzero failure, including a held-provider deadline case with observed child close and fixture removal. Write an auditable gitignored report at dist/wi076-queue-rpc/report.json with exact version/hash, host and limits. Run compile, lint, npm test, explicit spike, docs:verify and close-time docs:health. No F5 required for this pure technical scope. Delivery excludes ACTIVE; archive/close/promote in a separate docs(active) commit.

## Remaining scope and superseded handoff

User-visible queue admission, display, recall, Stop and failure/recovery require the next independent WI with bilingual PRD before Build. No attachments or UI acceptance is inferred from this probe. Downloads/market, extra ecosystems/platforms, Chat Participant, remote/multi-root, approval bypass and public release remain excluded. Draft ADR 0010 remains Draft.

Archived October 1 WI-074 handoff: 26 discussion pairs were indexed by purpose without moving/archiving them; see [acceptance](2026-10-01-wi-074-acceptance.md). WI-072 compile/lint/1064-test evidence belongs to its [acceptance](2026-10-01-wi-072-acceptance.md), not new documentation-WI test runs.
