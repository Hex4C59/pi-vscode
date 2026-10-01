# WI-076: queued-input RPC acceptance

English | [中文](2026-10-01-wi-076-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: scoped historical evidence; not product UI acceptance

## Disposition

Closed October 1 by the agent under the continuing scoped goal, not maintainer personal testing. Delivery commit `49fd804`; [approved proposal](2026-10-01-wi-076-approved-proposal.md). No gate closed and no product candidate marked complete.

## Evidence and reproduction

Run `npm run spike:queued-input` from this checkout with installed declared dependencies. It starts the actual pinned pi CLI, not a mocked runtime, against a synthetic loopback OpenAI-compatible provider. Report: `dist/wi076-queue-rpc/report.json` (generated, gitignored; rerun to reproduce). Node v25.9.0, darwin arm64, pi 0.86.1. CLI SHA256: `e79626f2dd6f94aa45d30f3fa63cd84319a6eefcd150b353cfaf274366926774`.

Busy ordinary prompt rejected. Two queued messages acknowledged and visible as pending count 2, without provider execution. clear_queue returned exact steering/follow-up strings including Chinese/U+2028; clear→abort settled with pending count 0. The next task produced base→steering→follow-up provider requests with no recalled/rejected-message replay. Four requests total in the main scenario. The separate live held-provider deadline rejected, with actual process close and owned fixture removal; successful scenario likewise observed close/removal. All assertions passed on the final explicit run.

## Checks and semantic review

- `npm run compile`: passed.
- `npm run lint`: passed.
- `npm test`: 1064 passed, zero failed/cancelled/skipped.
- `npm run spike:queued-input`: passed, including negative deadline cleanup.
- `npm run docs:verify` / `npm run docs:health`: zero errors; two existing Draft ADR 0010 notices retained, bilingual zero warnings/stale notices.
- `npm run commit:check` and full cached review before delivery: passed; repeat for records commit.

Reviewed runner/helper, script registration and bilingual integration route against the actual report and local public RPC documentation. New function bodies remain below 50 physical lines. No unrelated source, public DTO, dependency or lockfile changes. This reusable opt-in runner is not collected by npm test.

## Limits and next item

Actual runtime with synthetic provider only: not a real-model test, extension-host/F5 or installed-VSIX acceptance. No product queue UI, attachments or full PI-GAP-01 delivery. WI-077 prepares a coherent plain-text steering/follow-up, visible queue, recall and Stop/recovery slice; its UI/host evidence must be new. Draft ADR 0010 warnings retained. No secrets, push, session-file product operations or excluded scope.
