# WI-077: text steering, follow-up and recall approved proposal

English | [中文](2026-10-02-wi-077-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: scoped historical proposal; not whole-PRD or whole PI-GAP-01 acceptance

## Approval and archival reason

Closed October 2 by the agent under the 2026-10-01 continuous product-slice `/goal`. That goal authorized serial Prepare→Build of in-bound PI-GAP slices without repeated nomination. This WI delivered the plain-text steering/follow-up, visible queue, recall and Stop/recovery slice of PI-GAP-01. Attachments and slash/skill/template expansion remain parked. Gate none, decision none. User-visible PRD rows were synchronized before Build. WIP=1, no push, Draft ADR 0010 unchanged.

## Scope and approach

Reuse public pi 0.86.1 `steer`, `follow_up`, `queue_update` and `clear_queue`. Adapter translates; host `QueuedTextCoordinator` owns the bounded in-memory ledger, session/view generations and Stop/recall serialization; `DraftSubmission` remains the only acknowledged-draft owner; the Webview names intents and renders `queuedTextState`. Refuse attachments, leading slash/skills/templates and recognizable credentials. Recovery is an explicit Use-in-draft/discard surface that never auto-sends or overwrites a nonempty draft.

## Acceptance and failure modes

Before implementation: mixed queue semantics, ACK treated as execution, busy/idle admission races, duplicate clicks/late ACK, recall versus consumption, Stop clear/abort failure, async draft overwrite, view/runtime/session pollution, capacity loss, unknown-state auto-resend. Observable send → distinct pending queues → consume/recall, Stop and disconnect design, compile/lint/npm test, browser en/zh/narrow/theme/keyboard, actual pi with a synthetic provider, macOS F5 and installed VSIX with reproducible artifacts. Delivery commits exclude ACTIVE; archive/close/promote is a separate `docs(active)` commit.

## Remaining scope and superseded handoff

PI-GAP-01 attachments and command/template expansion stay unimplemented. Disconnect recovery is designed and composition-tested; a live host disconnect was not separately exercised. Composer widths 320/400 px were not recaptured. Follow-up shares the mounted busy-composer path; F5/installed evidence clicked Steer, not Follow-up. Next slice is WI-078 composer `/` discovery (PI-GAP-02), not a reload of this queue work. Draft ADR 0010 remains Draft.
