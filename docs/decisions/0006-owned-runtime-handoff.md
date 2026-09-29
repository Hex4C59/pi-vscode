# ADR 0006: End a leftover owned runtime before the next conversation

English | [中文](0006-owned-runtime-handoff.zh.md)

- Type: ADR
- Status: Draft
- Created: 2026-09-29
- Decision approval: 2026-09-29, maintainer chose to end a leftover owned runtime before the next conversation
- Verification: not started. No implementation, no F5, no installed VSIX.
- Gates: none closed. This choice supersedes the owned-runtime recovery ceremony in [ADR 0002](0002-interaction-contract-route.md) only after this ADR is Accepted.
- Work item: none. WI-032 was current when this choice was recorded and is now closed; Build still requires a later approved item.

## Context

ADR 0002 keeps a recovery fence under the extension’s global storage. Reload, a missing process, and an empty window do not clear it. The sidebar shows “Runtime outcome is uncertain” and waits for End owned runtime, then Recover controlled execution.

On 2026-09-29 the maintainer asked for the same opening behavior as Claude Code and Codex: no recovery banner, and no End/Recover step. They then chose the leftover-process rule: end it before the conversation starts.

## Decision

1. **No recovery step in the sidebar.** Opening, reloading, or using a window with no folder does not show the recovery banner and does not wait for Recover controlled execution.
2. **End the leftover run first.** When the host starts and a previous owned child is still recorded, the host ends that child, waits for the observed exit, retires that fence, and then shows the normal empty or no-folder page. The user does not confirm those steps.
3. **One owned child.** A replacement is not started while the previous owned child is still the recorded run.

## Rationale

The banner blocks a window that never started this conversation. Ending the leftover child before the page is ready removes that step and leaves one owned `pi` for the next conversation.

## Alternatives considered

- Keep the banner and the two recovery actions: rejected. The maintainer does not want that flow.
- Hide the banner and leave the fence in place: rejected. The next launch would still be blocked.
- Ignore the fence and leave the old child running: rejected. The maintainer chose to end it before the conversation.

## Consequences

A leftover owned child can be stopped when the host starts, without a dialog. Work it had not finished is lost. Exit of that child still does not prove its descendants stopped or that file changes were rolled back. If ending it produces no observed exit, that page is not specified here. ADR 0002 stays Accepted until this ADR is Accepted. No application code changed with this record.
