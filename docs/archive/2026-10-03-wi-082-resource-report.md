# WI-082: actual resource loading report

English | [中文](2026-10-03-wi-082-resource-report.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-03
- Authority: historical bounded PI-GAP-02 Prepare/Build and delegated acceptance only

## Prepare and approval

Scope: PI-GAP-02, REQ-004/009. PRD assessment: user-visible; add native command `pi: Show Resource Loading Report` and a live read-only text report. Approval: [this eight-gap goal](../discussions/2026-10-03-eight-gap-goal.md). Phase: Prepare complete, Build authorized; Gate ID: none; Decision: none. Report evidence only; no runtime start/reload, context-body reads, trust/dependency/persistence change.

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

## Resumed native focus after WI089 closure — October 3, 2026

WI089/PI27 has separate actual F5 and installed version UI acceptance; this does not accept PI02. Current native launcher repairs585bd06/f2b4462/1011afa have clean compile/lint1271/docs/package evidence. Memory-only secrets restore isolated binding without touching keychains; atomic options restore a single synthetic project; native edit success boolean is recorded while unchanged bytes/reopen are still asserted. F5 actually observed unavailable→ready, one template/skill definition, registered commands and unknown bodies/context/files, English/Chinese report and English keyboard refusal. Its review-marker wait timed out during the separate version UI review. Installed actual package activated and initial report opened, but resource-consent/catalogue wait timed out; both failed results retained. No PI02 acceptance or finish marker fabricated.

The owned installed process exited. A non-fixture Code process/title `pi-vscode` subsequently appeared; its origin is not established, no user-window actions or user-state inspection continue. Do not call app selection/state when the owned test has already exited: macOS tools may resolve/launch the default application instead. Before every future native action, verify the owned process is live and current window remains fixture-identified; stop on identity changes. Do not quit a non-fixture instance or reset keys/security. Minimum next step: a safely bindable isolated instance, focus the resource-only review within its bound, capture both languages/readonly/close/refresh and finalize the actual F5 and installed driver results. Seven Goal slices remain unfinished. Prior blocker paragraphs above are historical, not claims that isolated binding is still impossible when Code is alone.


October 3 retry from clean2d4b871: no pre-existing Code in binary-only inventory, isolated F5 parent14301 starts, but native tool reports Mac locked and cannot auto-unlock. No driver or UI action took place. Owned parent stopped, terminal exit observed; native-locked-2d4b871 artifacts retained. Current minimum unlock is manual Mac unlock, not a keychain reset or termination of a user app. After unlock, confirm no competing Code instance and fresh owned liveness/fixture identity before starting the same bounded resource-only F5 review. This is not PI02 acceptance.


Current blocker confirmed across three consecutive Goal turns: native inventory explicitly reports locked Mac, no live owned verification job. Goal blocked pending manual unlock; WI082 remains unfinished in Build, native review/driver acceptance required. No keychain/security changes authorized.


Resumed October 3: Mac now unlocked, but binary-only inventory confirms non-fixture Code9702. Earlier Electron-only process filters missed actual MacOS/Code; absence claims corrected in Goal. Do not relaunch/select input while safe isolated binding is unavailable. Current minimum unlock is save/close non-fixture Code or safe macOS window/PID binding, not a keychain reset. No new native acceptance; seven slices unfinished.


Safe-binding blocker confirmed in three resumed turns: non-fixture9702 persists, no live owned test. Goal blocked, WI082 unfinished. Keep actual F5/installed requirements; user save/close of Code or safe macOS binding is required.


## Authorized normal quit and native review deadline Prepare — October 3

The human explicitly authorized normal quit of daily Code, never force-kill, auto-save/discard unrelated work, and stop at unsaved/running-task confirmation. Actual Cmd+Q exited9702 with no intervening confirmation; binary-only inventory empty and original three Git changes unchanged. No user source/credentials were inspected or saved. Fresh safe-binding blocker is removed; Goal engine may retain its blocked flag until user resumes it, but authorized verification can proceed.

A wrong shell cwd caused a candidate self-fetch of its stale master d03d7c4 and an unintended old launcher invocation32087. It exited1 before native binding; no UI actions/consent or acceptance. Preserve this failure; correct by absolute root fetch, confirm57eac54 clean and executable tree identical1011afa, docs checks pass before new launcher32359. Actual F5 reaches ready catalogue, API unchanged bytes/reopen, English native keyboard replacement leaves text intact, English/Chinese readable report screenshots. Review-marker240s expired before full Chinese keyboard/reopen; preserve failed result and ended owned parent, no finish fabricated.

Bounded verification-only repair: leave resource-consent deadline240s, permit review900s and overall owned process1800s (then existing TERM/KILL cleanup). No product/permissions/runtime changes. Failure modes before code: review expires during safe per-action liveness/AX round trips; infinite wait/orphan; marker accepted without agent review; delayed-review composition mislabeled native. Prewrite generated-driver composition with virtual time and review marker only available after300s, retaining mutation rejection; observe old240s red before edit. Test proves deadline behavior only; repeat actual UI before acceptance.


Delayed-marker composition goes red against240s and green after900s, mutation still fails. Four focused cases, script syntax, compile/lint, full standard1271, docs verify/health pass; review-deadline logs preserve commands/results. This changes only bounded verification time, not acceptance criteria. Next reviewed tooling commit and clean committed candidate checks, then actual F5/installed resource-only review.


## Closure — agent acceptance under this authorization (October 3, 2026)

**PI-GAP-02 only accepted and closed under the human's explicit eight-item Goal delegation; not personal maintainer testing.** No gate/ADR, runtime/load permission, storage, dependency or platform change. PI27 was previously accepted; six other slices remain unfinished, and PI26 upload/sensitive collection remains unapproved.

- **Identity/checks:** clean committed9d7a3f8 candidate compile/lint/full1271/docs:verify/docs:health/package:vsix pass, empty before/after Git status. App implementation remains d03d7c4+0633e9f; later native-launcher repairs do not change report behavior. `dist/goal-eight/wi082/review-deadline/candidate/` retains full source, commands/results and VSIX SHA256 `05b9f9d70a8f342bb2cc72d87d29804f343deb04f3b2d7b3718637f9a944fcda`.
- **Actual F5 and installation:** independent native drivers both result passed, initial unavailable (not zero-loaded)→ready, real pi0.86.1 `get_commands`, one synthetic template/skill definition, registered llama command; AGENTS.md, skill bodies and arbitrary extension files remain unknown. Inventory0 registered/enabled stays separate and is not proof of loading. Sentinel fixture bodies/paths do not occur in reports. Source version0.0.1 vs installed0.86.1 matches existing packaging. Installed product root `/private/tmp/pi-resource-native-CX2Azy/extensions/pi-vscode-dev.pi-vscode-0.86.1`; development instrumentation contains verifier only, not product source.
- **Interaction/visual:** four actual screenshots reviewed: readable native dark Plain Text report, wrapped explanations, loaded definitions vs registration vs unknown clearly distinct, no custom Webview/CSS certification. Actual English/Chinese select-all+synthetic-paste attempts preserve exact AX report text in both lanes. API edit return true is recorded separately; unchanged bytes/reopen assert readonly rather than relying on that boolean. Live language switch refreshes report; Chinese close and native-command reopen matches exact text in both lanes. Native keyboard evidence is unchanged content, not a claimed captured refusal toast.
- **Bounds/lifecycle:** pre-code production compositions cover current/stale identity, unavailable/empty, bounded names/omission, counts, dispose/open-retry and non-mutating behavior. Prior isolated actual RPC evidence remains separately recorded; native fixtures cover the above real entry and transitions, not every injected failure or a nonzero inventory matrix. No prompt/model call was requested, real account/credentials used or user source read. No exhaustive OS/network, theme, other-host/platform or release certification.

Native artifacts `dist/goal-eight/wi082/native-f5-9d7a3f8/` and `native-installed-9d7a3f8/` contain screenshots, full AX, exact text equality review JSON and broker fixture/initial/loaded/install/observed/result/process-exit logs. Finish markers were written only after actual bilingual review while owned process remained live; both harness sessions exited0 and native processes ended. Earlier failed/time-out and wrong-ref artifacts stay failed, not overwritten.

Reproduce from a clean checked candidate: `node scripts/spikes/resource-report-native.mjs f5`, actual F5, or `installed <locally built VSIX>`. With isolated fixture title and owned liveness confirmed, Add context→Add file→inspect synthetic project path→Allow resources (no message). Review loaded report, English keyboard replacement, plugin General→Language→Chinese, live report/keyboard/close/reopen, retain screenshot/AX/text equality; only then write that fixture's finish marker and observe passed/exit. Resource-consent240s, review900s and overall1800s remain bounded. Never use daily Code or real state for acceptance.

Archival preserves original Prepare and chronological blockers/repairs as history; current requirements are REQ-004/009, next WI083 owns manual-compaction native acceptance. Human normal-quit permission is limited to graceful quit with no forced termination, unrelated save/discard, or proceeding past unsaved/running-task confirmation. Actual9702 normal quit had no confirmation and original Git modifications remain. No system-keychain repair or blanket absence of prompts is claimed.
