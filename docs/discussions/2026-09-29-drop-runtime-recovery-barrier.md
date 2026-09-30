# Drop the owned-runtime recovery barrier

English | [中文](2026-09-29-drop-runtime-recovery-barrier.zh.md)

- Type: Discussion
- Status: WI-035 accepted and closed on 2026-09-30 under the explicit agent delegation; [ADR 0006](../decisions/0006-owned-runtime-handoff.md) is Accepted. [Actual macOS F5/isolated installed evidence and limits](../archive/2026-09-30-wi-035-macos-acceptance.md).
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

## Subsequent Resolution and Codex Comparison

The preceding constraints and confirmation preserve the 2026-09-29 decision point. On 2026-09-30 the maintainer approved WI-035 and delegated evidence-based acceptance. [ADR 0006](../decisions/0006-owned-runtime-handoff.md) now specifies both live-owner safety and honest failure: only a lost owner is automatically ended, retirement needs exact receipts, and unconfirmed cleanup retains the existing explicit recovery page. The [acceptance record](../archive/2026-09-30-wi-035-macos-acceptance.md) separates automated branches from actual F5/installed evidence and documents initial native/tool failures. ADR 0002 retains its shared domain, direct-child evidence and in-session uncertainty rules; only its startup ceremony is replaced when ADR 0006 is Accepted.

Read-only Codex comparison used local source commit `58ac2a8773da0ac6eb21471e6d3da5744d9e9e0c` (2026-03-18), the installed CLI 0.156.1 and VS Code extension 26.917.62051. These are different version facts, not one matching build. [spawn.rs](https://github.com/openai/codex/blob/58ac2a8773da0ac6eb21471e6d3da5744d9e9e0c/codex-rs/core/src/spawn.rs#L81-L124) uses `kill_on_drop(true)` and requests a parent-death SIGTERM **only on Linux**; that conditional does not prove macOS crash cleanup or termination of every descendant. The installed extension owns an in-memory subprocess and performs teardown/kill checks while treating interrupted requests as outcome-unknown. App-server EOF/ConnectionClosed alone is not proof that the full process tree stopped. No universal Codex no-leftovers guarantee, cross-window coordination guarantee or Claude Code implementation claim follows from this evidence.

The maintainer's later Codex-type direction is recorded as WI-036 in ACTIVE: cleanup on owner loss and possible per-window domains are future questions, not WI-035 changes. Required approval includes their admission, failure and old-record migration tradeoffs. Neither this discussion nor the comparison authorizes those changes or arbitrary record deletion.
