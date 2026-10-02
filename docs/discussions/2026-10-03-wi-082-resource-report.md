# WI-082: actual resource loading report

English | [中文](2026-10-03-wi-082-resource-report.zh.md)

- Type: Reference
- Status: Blocked
- Created: 2026-10-03
- Authority: bounded PI-GAP-02 Prepare, Build and verification record

## Prepare and approval

Scope: PI-GAP-02, REQ-004/009. PRD assessment: user-visible; add native command `pi: Show Resource Loading Report` and a live read-only text report. Approval: [this eight-gap goal](2026-10-03-eight-gap-goal.md). Phase: Prepare complete, Build authorized; Gate ID: none; Decision: none. Report evidence only; no runtime start/reload, context-body reads, trust/dependency/persistence change.

Baseline: WI-078's adapter validates public `get_commands`; host `commandProjection` gates the snapshot by runtime/session identity. Catalogue is bounded to 512 rows, names/optional descriptions sanitized, paths withheld. Declared/installed pi is `0.86.1`. Installed `docs/rpc.md` and `dist/modes/rpc/rpc-mode.js` show registered extension commands, loaded templates and skill definitions as sources. The documentation example retains legacy `path/location`; implementation uses `sourceInfo`, both handled by existing parsing. Public RPC does not enumerate AGENTS.md or every extension file; never substitute a separate ResourceLoader for the running process.

## Design and boundaries

Reuse the host snapshot in a native read-only document with four categories: AGENTS.md actual loading unknown; loaded template definitions/names (not invocation); loaded skill definitions/names (not proof that bodies entered context); registered extension commands/names, with the complete extension-file loading state still unknown. Separately show local inventory registered/enabled counts; neither means loaded. Distinguish no runtime, starting, empty, unavailable and stale identity; restart/replacement/language changes update the report. Show at most 100 names per category with omitted count. Exclude source paths, bodies, prompts and credentials. Native text avoids message script/HTML/external-resource execution; reopening recovers an open failure.

Owners: adapter retains validated public RPC snapshot; host owns identity, counts, localization and read-only document lifecycle; Webview gains no capability or content. Expected paths: extension registration/provider, new host report module, end-to-end-style host composition verification and separate actual-host verification scripts, package commands, bilingual PRD/docs. No persistence/trust boundary change or ADR. Architecture dimensions 1–5, 7–15 retain existing ownership/identity/bounds; 16–19 evidence is still pending, not claimed passed.

## Failure modes before code

Inventory mistaken for loading; skill discovery mistaken for body loading; no extension commands mistaken for no extensions; invented AGENTS state; old runtime/workspace snapshot remains available; unavailable becomes zero; reading report starts runtime; names/paths leak; unbounded report; language changes lose state; unhandled native-open failure; updates after disposal; reading changes draft, sends or grants permissions.

## Observable acceptance and artifacts

Prepare cross-layer behavior checks through the existing host entry before implementation; do not add unit tests after code. Exercise four evidence categories, inventory separation, empty/error/stale identity, both languages, limits, open failure and disposal with reproducible TAP/JSON. Actual pi uses isolated HOME/agent/project fixtures containing known template, skill and extension commands, without paid model calls; retain observed-exit evidence. Separately run the native command in macOS F5 and installed VSIX, observing read-only report, keyboard/readability/close/refresh with screenshots/logs/source identity. Run compile, lint, npm test, docs:verify and docs:health at close. Candidate evidence uses an independently clean committed source after commit; the pre-existing dirty tree is not clean evidence.

Artifact root: `dist/goal-eight/wi082/`. Implemented, acceptance pending. Development compile, lint, 1224 standard behavior checks, three pre-code report composition scenarios and docs:verify passed (two existing ADR 0010 notices retained). Isolated actual pi controlled/trusted catalogue and observed-exit checks passed without model calls. The first regression exposed premature native provider registration affecting an existing path; lazy first-open registration restored the full pass. The source tree includes pre-existing user changes, so these are development results only. Next: independently committed clean candidate, F5/installed VSIX and delegated acceptance; closure conditions are not yet met.

## Current blocker and serial handoff (2026-10-03)

Local commits: Prepare/authorization `712abb9`, implementation `d03d7c4`, inventory-race guard `0633e9f`, verifier refinements `796de78`/`33a13d5`. Independent candidate `33a13d5d38e8e64225da185be88620b38c8bcb4f` (base `bc1a2d7b9c5174434036445db6c5f85624072a72`) has clean source; compile, lint, 1224 tests, docs:verify, isolated actual pi and packaging each passed. Historical local artifacts were mounted for link validation only, not current evidence. The final zsh wrapper failed because `status` is readonly; individual passes are supported by the successful package reached through the `&&` chain and each log, not the wrapper exit code. Artifacts copied to `dist/goal-eight/wi082/candidate-evidence/`; original candidate path is in `candidate-path.txt`.

F5/installed VSIX acceptance is missing: initial fixture launch failed because its Unix socket path was too long, then shortened. Current CUA could not bind the running isolated Code instance; a relabeled copy failed signature/dynamic-library validation. An unchanged signed copy of the installed app starts, but CUA binding still times out. No synthetic resource-consent click, report visual acceptance or installed-package pass exists. Task-owned test instances were ended without touching user Code. Do not loosen signature/execution permissions to remove this condition.

Minimum unlock: bind an actual Code window using isolated user data, exercise project consent and the native command, then complete F5/installed-VSIX report and visual/keyboard observation. This WI remains unclosed/unarchived without delegated acceptance. After recording this blocker, switch the current focus to independent PI-GAP-04 (WI-083) under collaboration rules; revisit the native environment later. All eight goal closure conditions remain intact.
