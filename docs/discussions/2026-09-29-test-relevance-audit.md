# Test relevance audit

English | [中文](2026-09-29-test-relevance-audit.zh.md)

- Type: Discussion
- Status: Maintainer-authorized fixes verified; assertion review stopped at maintainer request; acceptance pending
- Created: 2026-09-29
- Authority: context only; no new WI or acceptance
- Related: [ACTIVE](../../ACTIVE.md), [Testing guide](../guides/agent/testing.md)

## Question and scope

The maintainer asked whether the 886 passing cases include obsolete tests after repeated iterations. This audit checks the complete collection and module reachability, then reviews selected assertions and simulation-heavy suites. It does not establish that every assertion is necessary. The initial audit left application code and tests unchanged; the subsequently authorized fixes are recorded below.

## Initial findings and proposed treatment

| Finding | Evidence | Proposed treatment |
|---|---|---|
| A clipping assertion survives a deliberately clipping style | `src/webview/tests/app.spec.ts`, test “production model popover stays unclipped”, checks only computed `overflowY !== "hidden"`. In an in-memory build, injecting `footer.style.overflow = "hidden"` leaves all 7 app cases passing. Installed jsdom reports `overflow: "hidden"` but empty `overflowY`. | Narrow the claim to DOM/style wiring and add a negative control; actual clipping requires browser/host layout evidence. |
| Preview recovery policy differs from current production | `src/webview/tests/operations-preview.spec.ts` expects both controls enabled and either action to clear recovery. `preview/preview-bridge.ts` implements that simulation. `PiChatViewProvider.recoverRuntime` and `extension/tests/provider-profiles.spec.ts` require terminal ownership and a separate recovery action. | Align or narrow the preview fixture; retain current host coverage until the approved replacement is implemented. Draft ADR 0006 does not make current tests obsolete today. |
| Later malformed inputs in one loop no longer exercise validation | `src/adapter/runtime/tests/session-runtime.spec.ts`, “compaction end never invents settlement”, sends four bad frames on one connection. WI-033 retires that connection on the first frame, so the other three cannot test their respective rejection paths. | Keep one fault case here; use fresh connections for independent cases or rely on the existing decoder matrix. Label any retained later frames as isolation checks. |
| A recent integration matrix repeats shared validation cases | `runtime/tests/runtime-protocol.spec.ts` crosses 7 operations with 6 malformed reply variants (42 cases); `rpc-replies.spec.ts` already covers these field categories. | Keep the complete field matrix at the validator; consider two representative failures per operation at integration level (14 cases, 28 fewer). Preserve both Prompt paths, both Stop stages, uncertainty, cleanup and no-retry assertions. This is a candidate reduction, not a proven minimal suite. |
| Names retain superseded UI/protocol vocabulary | `webview/tests/app.spec.ts` says “real v2 bridge” while asserting v3; `settings-dialog.spec.ts` mainly mounts the current settings page and also contains resource/folder dialogs. | Rename titles and redistribute by current behavior; do not delete useful tests based on filenames. |

## Retained value and inventory evidence

- Actual discovery returns 82 application spec files and 11 script specs. No existing `.test`/`.spec` files under `src` and `scripts` fall outside collection. The runner clears `dist/tests` and executes its explicit inventory, avoiding stale generated test bundles.
- Read-only esbuild dependency analysis compared test imports with extension, approval gate, session worker, ownership supervisor and Webview production entries. Only seven test-reached application modules were outside those production graphs: six preview modules and `runtime/process/direct-process.ts`. The preview mounts current `mountChat`; direct-process is still used by the attachment spike. This is module-level evidence, not assertion coverage or proof of no redundant code.
- `candidate-preview.spec.ts` combines current shared UI behavior with synthetic host behavior. Its age and name do not justify whole-file deletion. Split or migrate only after identifying the behavior owner and retaining meaningful UI regressions.
- Compatibility helpers still serve compatibility and attachment spikes. Production packaging graph tests enforce exclusion of preview/test/direct-process code and remain useful.
- The preceding WI-033 log reports 886 passed, 0 failed/skipped. It includes the installed pinned-pi resource probe in `scripts/spikes/project-trust.spec.mjs`; the suite is not entirely mocked. That probe does not verify the new malformed-frame behavior in a real pi process, F5, or installed VSIX.

## Initial recommendation and limits

Prioritize misleading assertions and preview-policy drift, then remove redundant combinations and refresh names. A target test count is not an acceptance criterion. No whole test file has been established as safe to delete in this audit. No full-suite rerun, real-pi malformed-input probe, F5 or VSIX acceptance was performed during this review. The in-memory negative control passed 7/7, demonstrating the clipping assertion's blind spot rather than product correctness.

Cleanup was proposed at the initial audit; subsequent authorization and implementation are recorded below. WI-033 and WI-032 acceptance states and the existing recovery-policy discussion remain unchanged.

## Authorized fixes and verification (2026-09-29)

The maintainer subsequently requested fixes for every confirmed finding, recorded as WI-033 test maintenance without opening another WI. All five categories are addressed:

- The clipping guard checks overflow shorthand and X/Y longhands on menu ancestors through the footer; its title now claims style evidence. The normal app suite passes 7/7. Separate in-memory injections of hidden, clip, two-value shorthand, X hidden and Y auto each produce exactly one failure. Actual browser layout still requires separate evidence.
- Preview recovery now simulates observed exit before a separate recovery action; recovery also clears interactions. The revised test first failed once, then all 3 cases passed after the fix. The candidate harness now supplies DOM Node, removing focus-event ReferenceErrors that previously did not fail tests. Preview does not end real processes or verify native confirmation dialogs; host tests retain those policy responsibilities.
- session-runtime sends one bad phase frame to check fault cleanup; rpc-frames retains independent malformed-field checks. Same-chunk and old-connection isolation coverage remains.
- The ACK integration matrix shrinks from 42 to 14; validator field categories and each caller's uncertainty, cleanup and no-retry checks remain. One weak history-navigation test checking only that list items exist was removed; the same file already checks full pagination and content for its 128-entry scenario.
- settings-dialog becomes `settings-page.spec.ts`; folder/resource cancellation cases move to `no-folder-controls.spec.ts` and `project-setup-controls.spec.ts`. Old v2 and retired-fixture titles are updated.

There are still 93 spec files, with 886→857 cases: 28 repeated ACK combinations and one weak history-list case removed. `npm run compile`, `npm run lint`, `npm test` (857 passed, 0 failed/skipped), `npm run docs:verify` and `git diff --check` pass. Documentation retains only four existing Draft ADR 0005/0006 notices. The suite includes the pinned-pi resource probe; its later run prints one expected Git `fatal: Needed a single revision` diagnostic from the intentionally invalid-revision case in `docs-i18n-check.spec.mjs`. Local logs are under ignored `dist/test-maintenance-tests.log`, `dist/test-maintenance-style-check.log` and `dist/test-maintenance-compile.log`, not durable release evidence. No F5, installed-VSIX or real-pi malformed-frame acceptance ran; no Git commit was made, and maintainer acceptance remains pending.

## File-by-file relevance check

The follow-up checked collection, imported subjects, test names and assertion presence for every spec, then read the suspicious assertions and their production or synthetic owners. Every application top-level test has at least one direct assertion and no exact duplicate title was found. This is a file-level relevance decision, not proof that each assertion is indispensable or that a synthetic test establishes host behavior. “Keep” means no whole-file deletion is justified by the current evidence.

| File under `src/adapter/` | Current subject and disposition |
|---|---|
| `ownership/tests/recovery-store.spec.ts` | Durable fences and retirement; keep. |
| `ownership/tests/runtime-owner.spec.ts` | End control and exact exit evidence; ACK test now waits for the ACK connection to close before checking receipt independence. |
| `ownership/tests/supervisor.spec.ts` | Child observation, owner loss and control socket; keep. |
| `runtime/tests/activity-projection.spec.ts` | Bounded, redacted activity projection; keep. |
| `runtime/tests/attachment-transport.spec.ts` | One-attempt Prompt write and uncertain delivery; keep. |
| `runtime/tests/command-classification.spec.ts` | Current registered extension-command classification; keep. |
| `runtime/tests/extension-feedback.spec.ts` | Public feedback identity, replacement and redaction; keep. |
| `runtime/tests/interaction-writer.spec.ts` | Interaction write/drain, timeout and retirement; fixed a case that did not independently wait for drain. |
| `runtime/tests/pi-startup-model.spec.ts` | Pi startup model environment lookup; keep. |
| `runtime/tests/process-strategies.spec.ts` | Managed/direct process lifecycle; keep direct strategy for the attachment spike. |
| `runtime/tests/review-events.spec.ts` | Review completion through bounded runtime events; keep. |
| `runtime/tests/rpc-dialogs.spec.ts` | Dialog methods, opaque options and cancellation; keep. |
| `runtime/tests/rpc-frames.spec.ts` | Frame decoding and malformed event matrix; keep. |
| `runtime/tests/rpc-occupancy.spec.ts` | Independent ACK and agent occupancy; keep. |
| `runtime/tests/rpc-replies.spec.ts` | ID/command matching and reply validation; keep. |
| `runtime/tests/runtime-cancellation.spec.ts` | Cancelled owned launch and replacement fence; keep. |
| `runtime/tests/runtime-errors.spec.ts` | Safe provider error classification; keep. |
| `runtime/tests/runtime-protocol.spec.ts` | Cross-operation malformed reply and same-chunk isolation; reduced duplicate matrix, keep. |
| `runtime/tests/session-runtime.spec.ts` | Runtime session identity and fault lifecycle; removed unreachable bad-frame loop cases, keep. |
| `runtime/tests/trusted-runtime.spec.ts` | Trusted/controlled profile lifecycle and extension admission; keep. |
| `sessions/tests/session-backend.spec.ts` | External session worker and cancellation; fixed worker-start false pass. |
| `sessions/tests/session-history.spec.ts` | Bounded public history projection; keep. |
| `sessions/tests/session-worker-protocol.spec.ts` | Worker wire validation; corrected inconsistent preview offsets in its positive fixture. |
| `tests/controlled-environment.spec.ts` | Controlled process environment; keep. |
| `tests/trusted-approval-gate.spec.ts` | Approval-gate profile and tool admission; keep. |

| File under `src/extension/` | Current subject and disposition |
|---|---|
| `bridge/tests/webview-html.spec.ts` | Local assets, CSP and resource roots; keep as static host-shell evidence. |
| `bridge/tests/webview-messages.spec.ts` | Current v3 inbound action validation; corrected two v2 titles. |
| `contracts/tests/credential-text.spec.ts` | Shared credential patterns; keep. |
| `contracts/tests/model-catalog.spec.ts` | Bounded model identity; keep. |
| `draft/tests/draft-submission.spec.ts` | ACK ordering and draft retention; keep. |
| `draft/tests/file-attachment.spec.ts` | Native acquisition, snapshots, budgets and cancellation; keep. |
| `editor-tools/tests/change-review.spec.ts` | Review capture, provenance and resource cleanup; keep. |
| `editor-tools/tests/dirty-write.spec.ts` | Dirty editor write protection; keep. |
| `editor-tools/tests/editor-tools.spec.ts` | Editor-tool composition and optional review; keep. |
| `editor-tools/tests/tool-approval.spec.ts` | Approval path/scope security; keep. |
| `extension-loading/tests/extension-loading.spec.ts` | Trusted explicit extension loading; keep. |
| `interactions/tests/interaction-coordinator.spec.ts` | Form queue, answer authority and cancellation; keep. |
| `models/tests/custom-endpoints.spec.ts` | Endpoint storage and secret boundaries; removed an assertion about a secret never supplied by the fixture and cleaned temporary files. |
| `models/tests/model-selection.spec.ts` | Applied/pending model intent; keep. |
| `models/tests/model-settings.spec.ts` | Deferred settings and replacement; keep. |
| `models/tests/provider-config.spec.ts` | Provider state, defaults and secret handling; cleaned temporary files. |
| `tests/architecture-boundaries.spec.ts` | Selected source/packaging rules; narrowed titles; static evidence only. |
| `tests/extension-interaction-protocol.spec.ts` | Current v3 capability vocabulary; keep v2 rejection as compatibility guard. |
| `tests/focus-chat.spec.ts` | Command reveal/focus and fallback; keep. |
| `tests/provider-interactions.spec.ts` | Host form lifecycle through view loss and Stop; keep. |
| `tests/provider-model-sync.spec.ts` | Provider refresh and live default sync; keep. |
| `tests/provider-profiles.spec.ts` | Trusted profile and current recovery policy; keep until approved replacement ships. |
| `tests/runtime-chat.spec.ts` | Host task, ACK, Stop and failure state; keep. |
| `tests/sessions.spec.ts` | Host saved-session intents and handoff; keep. |
| `tests/settings-panel.spec.ts` | Settings editor identity and view isolation; keep. |
| `tests/workspace-policy.spec.ts` | Workspace eligibility and stale actions; keep. |

| File under `src/webview/tests/` | Current subject and disposition |
|---|---|
| `app.spec.ts` | Production mount and style guard; fixed clipping negative control. |
| `attachment-ui.spec.ts` | Mounted attachment preview and draft continuity; keep. |
| `candidate-approvals.spec.ts` | Shared approval UI with synthetic host; keep as UI evidence. |
| `candidate-combinations.spec.ts` | Shared language/review combinations; keep as UI evidence. |
| `candidate-preview.spec.ts` | Shared chat across synthetic scenarios; keep, but no real-host inference. |
| `candidate-review.spec.ts` | Shared review entry and opaque intents; keep as UI evidence. |
| `change-review.spec.ts` | Review DTO and mounted client behavior; keep. |
| `client.spec.ts` | Host DTO parser and browser client boundary; keep. |
| `context-focus.spec.ts` | Nested context focus and Escape behavior; keep. |
| `execution-ui.spec.ts` | Mounted task/activity/approval interactions; removed a duplicate weak clipping case. |
| `extension-interactions.spec.ts` | Form UI and typed responses; keep. |
| `history-navigation.spec.ts` | Full history pagination and preview cancellation; removed weaker duplicate list assertion. |
| `interaction-client.spec.ts` | Form DTO/generation validation; keep. |
| `model-selection.spec.ts` | Mounted applied/pending model controls; keep. |
| `no-folder-controls.spec.ts` | No-folder recovery and model choice; keep; owns moved folder case. |
| `operations-preview.spec.ts` | Synthetic extension/recovery behavior; aligned fixture with current host policy. |
| `pi-welcome-mark.spec.ts` | Mounted welcome animation; keep as DOM behavior evidence. |
| `preview-attachments.spec.ts` | Synthetic attachment transitions; keep as preview evidence. |
| `preview-sessions.spec.ts` | Synthetic session transitions; keep as preview evidence. |
| `production-chat.spec.ts` | Shipped chat mount and host messages; keep. |
| `production-interactions.spec.ts` | Shipped interaction UI and intents; keep. |
| `project-setup-controls.spec.ts` | Resource choice and setup; keep; owns moved resource case. |
| `provider-config-ui.spec.ts` | Mounted settings/provider intent UI; keep. |
| `saved-history.spec.ts` | History DTO, paging and literal previews; keep. |
| `session-handoff.spec.ts` | Generation commit and draft ordering; keep. |
| `session-navigation.spec.ts` | Production history navigation/focus; keep. |
| `sessions.spec.ts` | Session DTO and stale-ID client handling; keep. |
| `settings-page.spec.ts` | Current settings page; renamed from settings-dialog. |
| `sidebar-craft.spec.ts` | Shared visual/DOM style constraints; corrected dialog title; no browser-layout claim. |
| `task-status.spec.ts` | Task status presentation mapping; keep. |
| `workspace-ui.spec.ts` | Blocked/untrusted workspace UI; keep. |

| File under `scripts/` | Current subject and disposition |
|---|---|
| `docs/docs-health.spec.mjs` | Documentation age/replacement checks; keep. |
| `docs/docs-i18n-check.spec.mjs` | Bilingual marker and Git subprocess checks; keep. |
| `docs/docs-verify.spec.mjs` | WI/PRD and ACTIVE validation; keep. |
| `packaging/production-runtime.spec.mjs` | Production dependency exclusion; keep as build-graph evidence. |
| `packaging/production-webview.spec.mjs` | Shared chat without preview code in shipped bundle; keep as build-graph evidence. |
| `packaging/verify-webview-assets.spec.mjs` | Local/VSIX static asset verifier; keep. |
| `spikes/compatibility.spec.mjs` | Isolated RPC/child compatibility helpers; keep. |
| `spikes/project-trust.spec.mjs` | Isolation and pinned-pi resource probe; keep; not a malformed-frame or F5 check. |
| `testing/background-processes.spec.mjs` | Windows background-process launch policy; keep as static evidence. |
| `testing/commit-check.spec.mjs` | Staging policy and CLI errors; keep. |
| `testing/test-runner.spec.mjs` | Exact test discovery and stale-output exclusion; keep. |

The follow-up also changed two waits in `runtime-owner.spec.ts` and `session-backend.spec.ts` to require observable process readiness before asserting cancellation/exit, made the control socket fixture accept fragmented JSONL, corrected v3/shared-dialog names, and narrowed two architecture-test titles to their static evidence. A further assertion review made the interaction writer wait independently for `drain`, gave the worker preview fixture self-consistent offsets, removed a vacuous `sk-test` absence check, and registered cleanup for model-test temporary directories. The OAuth fixture now keeps one stable models path. The latest `npm run compile`, `npm run lint`, and `npm test` pass (857 passed, 0 failed/skipped); `npm run docs:verify` reports 0 errors and four existing Draft ADR notices, and `git diff --check` passes. No whole test file was removed. This is not exhaustive proof that every assertion is necessary or catches every regression. Real pi malformed-frame behavior, F5 and installed VSIX remain unverified for this task.

Further assertion review found additional test-only blind spots. The provider model-sync test now checks the exact applied model and `setModel` call against an in-memory saved-default fixture; its stronger assertion initially exposed a failing refresh case (856/857) before the fixture was isolated from local pi settings, then passed. File-attachment idle waits now have a bounded timeout and release their message hook; the Webview HTML fixture releases its provider. Mounted UI tests require nonempty button sets before asserting all are disabled, and a candidate approval assertion that only compared one input array with itself was removed with its title narrowed. Saved-history error cases now assert their respective messages rather than accepting any of three messages. Attachment and pinned-pi probe assertions explicitly require expected nonempty results. In the attachment test, reading `attachments()` itself posts a projection; the no-extra-projection baseline now follows that read, and unrelated change/close events are asserted separately. The file-level inventory still does not certify every assertion or real-host behavior.

A further pass over script specs and the larger runtime, session, approval, and host suites found no evidence that an entire file should be removed. Two more confirmed gaps were fixed: the RPC select test could return before its core assertion when the dialog method was wrong, and two approval tests could wait indefinitely for a notification after the request had already failed. The supervisor tests now check receipt timestamps against the action window instead of copying the received timestamp into the expected value. Two session backend results and the worker CLI result now assert their successful response variant before checking fields that were previously inside conditional branches. The affected tests and the complete suite pass; the latest `npm test` reports 857 passed, 0 failed/skipped, and `npm run compile` and `npm run lint` pass. `npm run docs:verify` reports 0 errors and four existing Draft ADR notices; `git diff --check` passes. This targeted review still does not establish that every assertion is necessary or that automated tests replace real pi, F5, or installed-VSIX evidence.

## Continued assertion-level review

The earlier 93-file table establishes file-level relevance only. A new, deeper pass read the cases, assertions and fixtures in 25 complete files, checking their tested entry points and evidence tier. The remaining 68 files still need this depth of review; previous targeted fixes in some of them do not count as a complete assertion review.

| Complete files in this pass | Result |
|---|---|
| Adapter runtime: `activity-projection`, `attachment-transport`, `command-classification`, `extension-feedback`, `interaction-writer`, `pi-startup-model`, `process-strategies`, `review-events`, `rpc-occupancy`, `runtime-cancellation`, `runtime-errors` | Current behavior remains exercised. `runtime-errors` now asserts exact trimming and truncation rather than only a maximum length. `attachment-transport` releases its runtime on assertion failure in the remaining deadline, callback-failure and Stop cases. |
| Adapter sessions: `session-history`; adapter core: `controlled-environment` | Both exercise current projection or environment behavior. The retained-text paging test now fails after a bounded number of nonterminal pages. |
| Extension contracts: `credential-text`, `model-catalog`; model owner: `model-selection`, `model-settings`; draft owner: `draft-submission` | Tests still target active validation, model selection/deferred mutation and draft acknowledgement. No whole-file deletion supported. |
| Extension host: `focus-chat`, `settings-panel`, `workspace-policy` | Host entry and eligibility cases remain relevant. The settings-panel rejection case now runs against a ready runtime and nonempty draft, verifies that each forbidden intent is a valid v3 message, and asserts no prompt/model call or state mutation. |
| Webview: `client`, `interaction-client`, `pi-welcome-mark`, `task-status` | Parser/client behavior and mounted status/mark behavior remain current; jsdom evidence does not establish browser layout or F5 behavior. |

Three additional files received focused loop inspection without a full-file deep review: `extension/draft/tests/file-attachment.spec.ts`, `extension/interactions/tests/interaction-coordinator.spec.ts`, and `webview/tests/preview-attachments.spec.ts`. Their paging or manual-clock loops now fail within a fixed bound if a regression never reaches completion. `npm run compile`, `npm run lint` and `npm test` pass after these edits (857 passed, 0 failed/skipped); no product code, recovery policy or Git commit changed in this pass. Continue with the other 68 files before claiming the requested deeper file-by-file review is complete.

The next complete pass covered ten more extension specs: `extension-interaction-protocol`, `webview-html`, `extension-loading`, `webview-messages`, `provider-interactions`, `architecture-boundaries`, `editor-tools`, `provider-model-sync`, `provider-profiles`, and `dirty-write`. They exercise current protocol, host and tool behavior. `dirty-write` alias/path-spelling cases now require the specific unsaved-editor rejection as well as no execution; a rejection for an unrelated reason no longer passes. The provider-interactions Stop test title now states only the settlement behavior it checks, and its pending abort callback is released in `finally`. After those test-only changes, compile, lint and all 857 tests passed. Complete-file depth is now 35/93; 58 remain. `rpc-replies` and `tool-approval` were subsequently read, while `rpc-dialogs` and `runtime-protocol` still need their truncated sections checked before counting that group.

A further 29 complete files bring this pass to 64/93. Adapter: `rpc-replies`, `rpc-dialogs`, `runtime-protocol`, `rpc-frames`, and `recovery-store`; extension: `tool-approval`; Webview: `context-focus`, `workspace-ui`, `session-navigation`, `settings-page`, `operations-preview`, `production-interactions`, `sessions`, `provider-config-ui`, `candidate-combinations`, `candidate-review`, `production-chat`, `change-review`, `attachment-ui`, `preview-sessions`, `session-handoff`, and `saved-history`; scripts: `production-runtime`, `production-webview`, `docs-health`, `docs-i18n-check`, `docs-verify`, `verify-webview-assets`, and `compatibility`. These still cover current entry points or explicit synthetic/structural boundaries. In `session-runtime`, repeated gate calls now require a new reply count before checking the latest decision, so a stale rejection cannot mask a missing reply; this file remains under review. The `session-navigation` UI test now re-queries rows after each update, ensuring assertions target attached DOM rather than a saved node list. Compile, lint, and 857 tests passed after the first fix; checks after the latter edit are still pending. The remaining 29 files include larger runtime, host and candidate suites. No whole-file deletion is supported by this pass.

Subsequent review covered the other 29 files, completing a source-level review of all 93 collected specs. These larger adapter, host, attachment, interaction, Webview and script suites still exercise current entry points or explicitly synthetic boundaries. Two additional confirmed test defects were corrected: the custom-endpoint cancellation fixture now actually supplies a synthetic key before checking that neither `models.json` nor the projection contains it, and the supervisor exit test clears its deadline timer when the child exits early. Earlier changes also made consecutive approval replies and re-rendered session rows assert the new observable result. These fixes do not change production behavior or the number of collected cases. The full suite now passes 857/857, with compile and lint passing. Source review and the 93-file relevance inventory do not prove that every individual assertion is indispensable or detects every regression; browser layout, real pi malformed frames, F5, and installed VSIX are separate evidence.

The latest focused pass strengthened `rpc-frames.spec.ts`: the long text-delta test now checks the exact truncated, redacted value; assistant completion checks final text; valid empty content checks its empty final text; undisplayed content checks thinking text and source index. Its malformed/unknown-frame title now matches the two distinct outcomes. A scan of conditional assertions and asynchronous waits found no further confirmed false pass in this pass: the inspected branches are preceded by assertions of their required variants or nonempty collections. After the last assertion edit, `npm run compile`, `npm run lint`, and `npm test` passed (857/857, none failed or skipped). This still does not establish that all 857 assertions are necessary or sufficient.

On 2026-09-30, the deeper pass rechecked `execution-ui`, `app`, `model-selection`, `runtime-owner`, `recovery-store`, and `supervisor` against their current UI or ownership implementations. `execution-ui` still contained a second clipping claim using only computed `overflowY !== "hidden"`; the same jsdom blind spot was already demonstrated for the former `app` assertion. Its streaming model control is exercised elsewhere, and `app.spec.ts` now guards all overflow forms through the footer, so the duplicate weak case was removed. A runtime-loss title also claimed absence of retained chat without supplying any chat; it now describes only the checked draft/action behavior. The `runtime-owner` ACK case previously checked pending state before the server sent its ACK; it now waits for that connection to close before verifying that no receipt means no completed `end()`. `recovery-store` and `supervisor` retained their current assertions. The complete run is now 856 passed, 0 failed/skipped; compile and lint pass. Browser clipping and real-host/runtime behavior remain separate evidence.

The next file-by-file pass compared `trusted-runtime.spec.ts` and `runtime-chat.spec.ts` with the adapter checkpoint and host task implementations. Many checkpoint/dialog tests ignored the result of their prerequisite `start()` call: a startup failure could make an expected `unavailable` result pass without exercising the intended state. Each ready-runtime case now asserts startup success. The shared `readySettings()` fixture also fails and disposes its provider if host readiness was not reached. In `runtime-chat`, the Stop case now requires its abort callback to be installed and called once, and the deferred thinking-level write to occur exactly once; the workspace-change case now checks an actual runtime `stop()` call rather than only the projected UI state. No test file became obsolete. Compile, lint, and the full 856-case suite pass after these changes, with no failures or skips. The assertion review remains active; these checks do not establish real pi, F5, or installed-VSIX behavior.

A further host pass reviewed `provider-profiles.spec.ts`, `sessions.spec.ts`, `provider-model-sync.spec.ts`, and `models/tests/model-selection.spec.ts` against profile switching, session handoff, and model mutation. The checkpoint-rejection test in `provider-profiles` could pass if the profile action was ignored: it checked only the unchanged ready state. It now requires the `state-changed` error projection and ready prerequisites. The shared session fixture now requires runtime readiness before supplying a selected saved session. The model-sync test for a permanently pending provider refresh now requires a second runtime start and an accepted new Prompt; its previous ready/idle assertions could have described the old conversation. The other reviewed cases retain current observable coverage. Compile, lint, and all 856 tests pass after these edits; no collected file or case was removed in this pass. The full assertion-quality audit remains in progress.

The next pass compared `candidate-approvals.spec.ts`, `history-navigation.spec.ts`, and `session-runtime.spec.ts` with the current preview bridge, mounted UI, and runtime fixture. Two candidate queue cases checked only the number of approvals: removing the wrong request or restoring an old eight-item queue could pass. They now require the exact remaining or replacement request IDs, and the custom-tool case checks its complete outbound decision. The history update case now requires its initial path before comparing it after re-render, preventing an absent path on both sides from passing. The inspected session-runtime assertions retained their existing prerequisites and expected outcomes. Compile, lint, and all 856 tests pass after these changes; no case was removed. This is still automated UI/fixture evidence, not real-host acceptance.

The following pass reviewed `candidate-combinations.spec.ts`, `candidate-review.spec.ts`, and `preview-sessions.spec.ts` against the current preview bridge. The combination case now requires the saved-session catalogue to load and identifies the expired approval, while the attachment-expiry case establishes a pending admitted attachment and an eight-card queue before claiming expiry caused failure. The preview-session handoff case now checks that New and Restore preserve the old generation before commit and advance it exactly once afterward; its title no longer implies a confirmation callback absent from that fixture. `candidate-review` retains its existing assertions. Compile, lint, and all 856 tests pass after the test edits; no production behavior or collected case changed.

An attachment pass reviewed `file-attachment.spec.ts`, `attachment-ui.spec.ts`, and `preview-attachments.spec.ts` against host admission, mounted UI, and the synthetic bridge. The shared host fixture now requires a ready runtime and cleans up if startup fails, so rejection cases cannot pass because no runtime started. Runtime-loss UI coverage now requires the history trigger to disappear. Long-history preview coverage requires both file and selection records and compares retained metadata after rejected admission with an independent copy. Compile, lint, and all 856 tests pass. No whole-file deletion is supported; real-host attachment behavior remains outside this automated evidence.

The runtime ownership pass reviewed `runtime-cancellation.spec.ts`, `rpc-occupancy.spec.ts`, and `process-strategies.spec.ts` against the current occupancy and process implementations. The stale-completion case now checks command occupancy after an agent settles and checks that a wrong-session ACK still blocks sending after the live command finishes; previously the valid cleanup could hide either stale callback defect. The owner-exception case now counts launch attempts, so a second owner call that merely fails again cannot satisfy the claimed barrier. The cancellation tests retain their existing late-transport checks. Compile, lint, and all 856 tests pass; no collected case changed.

The next host pass reviewed `workspace-policy.spec.ts`, `focus-chat.spec.ts`, and `extension-interaction-protocol.spec.ts`. Invalid folder selections now require one actual native picker invocation, so a silently ignored Open action cannot pass. The fallback-focus failure case now identifies the attempted view command, rather than accepting a failure from any command. The eligibility-matrix title now states the three actions it exercises. The v3 interaction intent and v2 rejection cases retain their current assertions. Compile, lint, and all 856 tests pass; no file or case was removed.

The provider/model pass found three more assertion gaps. The cancelled API-key case could pass without ever opening a login prompt; it now requires one login and one secret prompt. The failed thinking-level save case now records the settings mutations and proves that overlapping thinking/model actions make no writes. The deferred model case now checks the applied model projection, cleared pending thinking level, and absence of a model error, in addition to call order. `custom-endpoints.spec.ts` already checks its current file, cancellation and redaction behavior and needed no edit. After these test-only changes, `npm run compile`, `npm run lint`, and all 856 tests passed. No whole-file deletion is supported; green tests do not certify every assertion or replace real pi, F5, and installed-VSIX evidence.

The next pass compared `draft-submission`, `model-selection`, `review-events`, `change-review`, `activity-projection`, and `custom-endpoints` with their current owners. The OAuth endpoint case previously excluded only a device code and a token-bearing URL from its provider projection; it now also excludes the ordinary authorization URL, device URL, and browser instructions while requiring the instructions to reach the host notice. Endpoint merge/removal cases now compare preserved provider objects, and native-provider removal must leave the file byte-for-byte unchanged. The first model-selection title now claims only its tested busy-operation rejection; stale page actions remain covered in the later view-recreation case. The other inspected cases retained their direct preconditions and observable results; no file was removed. After these test-only edits, compile, lint, and 856/856 tests passed. The audit continues and does not claim exhaustive assertion effectiveness.

The mounted Webview pass reviewed `production-chat`, `sessions`, `provider-config-ui`, `production-interactions`, `change-review`, and `model-selection` against their current component and client paths. Two model-focus cases previously injected host busy/applied state without proving that the model click sent an intent; both now require the exact `setChatModel` message. Thinking keyboard focus cases now require the exact `setThinkingLevel: high` message before simulating host application. The unnamed current-session check now asserts the actual empty label instead of accepting either an empty string or unrelated fallback wording. The remaining inspected tests retained their existing direct messages or DOM-state checks; no file was removed. Compile, lint, and all 856 tests passed after the edits. The review remains open for further assertion-level checks.

The next client/history pass reviewed `client`, `interaction-client`, `saved-history`, `history-navigation`, `session-handoff`, and `context-focus`. In `client.spec.ts`, three blocked-submit cases could pass because draft synchronization was still pending, regardless of the model or attachment condition under test. They now require the exact draft update, a host attachment acknowledgement, the accepted draft text, completed synchronization, and a sendable baseline before each blocker is applied. The busy-host recovery case also checks the resumed draft's exact outbound text and identity. The other inspected tests retain direct request IDs, generation checks, focus targets, and bounded paging assertions; no whole file was removed. Compile, lint, and 856/856 tests passed after this test-only change. Assertion review continues; these client fixtures do not establish real-host acceptance.

The adapter pass reviewed `runtime-errors`, `rpc-dialogs`, `interaction-writer`, `extension-feedback`, `command-classification`, and `pi-startup-model` against their current implementations. The interaction writer's callback/drain case now counts the exact frame written and checks all three observer types are released; retirement checks that a later rejected write never reaches the stream. The feedback capacity case now compares the complete snapshot when clearing an evicted key, and long-lived replacement checks the updated status entry and its new local ID rather than only entry counts. The other four files retained their direct result, boundary, and failure assertions. No collected file was removed. Compile, lint, and all 856 tests passed after these test-only edits. The assertion audit remains open.

The generation-isolation case in `execution-ui.spec.ts` used a malformed late `workspaceState`, which the parser rejected before the generation guard could be exercised. It now constructs a complete generation-1 frame, asserts that the parser accepts it, and checks that its message, thinking activity, and approval cannot reappear after generation 2. Compile, lint, and all 856 tests passed after this test-only correction. This establishes the fixture reaches the intended boundary; it does not prove every assertion in the suite is necessary or that real-host behavior was verified.

The next file pass compared `workspace-ui.spec.ts`, `sidebar-craft.spec.ts`, `operations-preview.spec.ts`, and the host `settings-panel.spec.ts` with their current owners; it also checked the overlapping `settings-page` and `provider-config-ui` cases. The workspace blocked-state loop previously accepted any nonempty notice for all three statuses, so swapped or repeated copy could pass. It now checks each exact title and detail. The settings craft case now identifies all three categories, the selected Providers page, the opened OpenAI detail, and the exact refresh intent. The preview recovery cases retain their explicitly synthetic scope, and the host settings cases retain ready-runtime, valid-intent, and isolation checks; no new defect was confirmed in those files. These test-only edits passed compile, lint, and all 856 tests. Browser layout and real-host acceptance remain separate evidence.

A closer pass on `settings-page.spec.ts` found that its accepted generation-2 frame displayed the same model as generation 1, so the later one-model assertion could pass even if generation 2 was ignored. It now gives generation 2 a distinct catalogue, confirms that model appears, and checks after each stale or foreign frame that it remains. The invalid locale is also checked against the page language. Compile, lint, and all 856 tests passed after this test-only change.

The next file pass compared `pi-welcome-mark.spec.ts`, `task-status.spec.ts`, `context-focus.spec.ts`, and `extension-interactions.spec.ts` with their mounted components. The welcome-sequence case now checks the gold stage it names. The task-status node-reuse case previously passed even if both later status renders left the original text unchanged; it now checks the Working, Replying, Working text transitions on the same node. The nested Escape and interaction form cases already check focus targets, typed answers, blocked actions, and observable feedback; no new defect was confirmed in those files. Compile, lint, and all 856 tests passed after the test-only edits. DOM and mock-timer evidence does not establish browser motion or real-host acceptance.

The architecture and packaging pass reviewed `architecture-boundaries.spec.ts`, `production-runtime.spec.mjs`, `production-webview.spec.mjs`, and `verify-webview-assets.spec.mjs` against the current source and build graph. The public-entry scanner previously saw only `from` imports: a new static `import("../client-state.js")` counterexample failed as expected (855/856), then passed after the scanner covered literal dynamic imports. The selected-file forbidden-capability check and public-entry fixture now also cover literal `require()` calls. The production graph tests still exclude direct/test/preview modules, and the asset tests retain current bundle and archive checks; no whole-file deletion is supported. Compile, lint, and all 856 tests passed after this test-only correction. The source scanner remains a static check, not proof about computed import paths or installed-VSIX behavior.

The next boundary pass reviewed `controlled-environment.spec.ts`, `trusted-approval-gate.spec.ts`, `webview-messages.spec.ts`, and `webview-html.spec.ts` against their current implementations. The environment case now checks that the complete inherited object is unchanged and that the returned copy contains exactly the intended overrides. The trusted gate's late-mutation case now independently changes a top-level field and a nested field after the approval prompt, requiring both to deny the call. The v3 message parser and packaged HTML cases retain direct validation and CSP/resource-root checks; no new defect was confirmed in those two files. Compile and lint passed. Two overlapping full-suite runs produced different file-level Webview failures without assertion stacks; each failed file passed alone, and a full run after the other runner exited passed 865/865. The shared runner rebuilds `dist/tests`, so concurrent runs are a plausible source of that interference, but the exact cause was not proved. WI-034 has added `package-vsix.spec.mjs`, bringing the current collected file inventory to 94; that new file still needs a separate relevance review before any all-current-files conclusion.

## Audit handoff (2026-09-30)

The maintainer asked to stop reviewing test files. The source-level relevance review covered the 93 specs that existed before WI-034; it found no evidence for deleting a whole file and fixed the confirmed false-pass assertions described above. WI-034 then added `package-vsix.spec.mjs` as a 94th collected file. Its packaging exclusions test was strengthened with declared `.local-env`, `.git`, `skills-lock.json`, and an old VSIX: the counterexample first exposed `.local-env/secret.json` in the archive. The packager now filters those paths even if `files` selects them; a declared `../outside` path is also rejected. The focused packager suite passed 11/11 after the fix. This new spec was checked for these WI-034 cases, but was not part of the earlier 93-file relevance inventory. No further assertion-by-assertion audit is queued. Passing tests do not prove every assertion is necessary or sufficient, and WI-033 maintainer acceptance remains pending.
