# Drop the owned-runtime recovery barrier

English | [中文](2026-09-29-drop-runtime-recovery-barrier.zh.md)

- Type: Discussion
- Status: Maintainer confirmed ending a leftover owned runtime before the next conversation. Recorded as Draft [ADR 0006](../decisions/0006-owned-runtime-handoff.md). No Build.
- Created: 2026-09-29
- Authority: **context only** — does not override [`ACTIVE.md`](../../ACTIVE.md), the PRD, or ADR 0002
- Related: [ADR 0002](../decisions/0002-interaction-contract-route.md)

## Background

On 2026-09-29 the maintainer said the sidebar should behave like Claude Code and Codex: no “Runtime outcome is uncertain” banner, and no End owned runtime / Recover controlled execution step. They do not want that flow.

The same day, VS Code user global storage `pi-vscode-dev.pi-vscode/recovery-v1/fence.json` was created at 18:05:37 with no exit receipt. A `pi` child started then, with working directory `/Users/hex4c59/Downloads`, from this repo’s `dist/runtime-supervisor.mjs`. Around 22:07 that child was still running and its original extension host was gone. A later window with no folder still showed the banner because the fence remained. Opening a folderless window does not create the fence. The host writes it only when starting a runtime after a trusted local folder and a project-resource choice. Model and auth data stay in `~/.pi/agent`. The fence is not a saved conversation.

## Constraint

ADR 0002 accepts the fence. Reload and “no process is visible” do not clear it, and the extension does not kill the child automatically. Hiding the banner while that rule stays leaves the next launch blocked. Matching Claude Code and Codex supersedes that recovery rule and needs a new ADR. ADR 0002 stays Accepted until the new ADR is accepted.

## Options

1. **Hide the banner only.** The fence still blocks the next runtime. This does not match the request.
2. **End the previous owned child when the host starts, retire the fence, and show the normal empty or no-folder page.** No End/Recover step. A still-running child can be stopped without a dialog.
3. **Ignore the fence and leave the old process running.** The empty page appears immediately. Two `pi` processes can change files at the same time.

## Confirmed

On 2026-09-29 the maintainer chose option 2: end the leftover owned child, then enter the conversation. Options 1 and 3 are closed. Draft ADR 0006 records the choice. It does not replace ADR 0002 until it is Accepted.

## Open

- No work item. WI-032 was current at capture and is now closed; no replacement Build is authorized.
- The page shown when ending the leftover child produces no observed exit is not specified.
- Do not implement while ADR 0002’s recovery rule is the accepted rule.
