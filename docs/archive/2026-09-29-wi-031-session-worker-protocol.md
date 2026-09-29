# WI-031 — Shared session-worker protocol

English | [中文](2026-09-29-wi-031-session-worker-protocol.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-29
- Authority: historical WI-031 scope and the maintainer's close; current work is [`ACTIVE.md`](../../ACTIVE.md)

## Closure — 2026-09-29

The maintainer said WI-031 is complete. This is personal technical acceptance of the approved slice: one shared validator for the session-worker messages, with no user-visible change and no protocol-version change. Decision: none. No new ADR or gate. This close does not authorize a commit or push, and it does not establish F5 or installed-VSIX behavior. Those were outside this slice.

The host and the worker now share [`session-worker-protocol.ts`](../../src/adapter/sessions/session-worker-protocol.ts). Protocol version remains 1. The session list page stays 16 and the history page stays 32. Error mapping, exact fields, Unicode code points and preview UTF-16 lengths are unchanged. The shared module imports host-owned session DTO types only. It does not import the pi SDK, a process entry or filesystem operations, and it has no startup side effect. The host still owns process start, environment overrides, timeouts, cancellation, shutdown wait and local errors. The worker still owns SessionManager, file identity, history projection and stream IO.

Recorded agent checks, not rerun at this close: `compile`, `lint`, `npm test` (775/775, 0 skipped), `docs:verify` (0 errors; two existing Draft ADR 0005 warnings), `git diff --check`.

## Replacement reason

ACTIVE returns to no current WI. The proposal and implementation handoff move here.
