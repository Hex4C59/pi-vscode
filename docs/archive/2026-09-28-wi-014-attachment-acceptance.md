# WI-014 — Explicit context and retained attachment acceptance

English | [中文](2026-09-28-wi-014-attachment-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: historical scoped delegated acceptance; ACTIVE owns remaining work

## Delegated acceptance and decision

On September 28, 2026 Asia/Shanghai, the agent completed evaluation under the maintainer's explicit delegation and closes the approved WI-014 T014-01–05 slice. This is not personal maintainer inspection and does not accept the entire Draft PRD, WI-016/017, WI-010 boundary disposition or broad gates.

Retain the implemented host-owned draft, explicit native text-file/selection acquisition, per-item confirmation, public pi prompt transport and formal shared React context UI. Keep 256KiB UTF-8 per attachment, 1MiB aggregate and20 items; retained live history remains128 snapshots with the existing8MiB charged storage bound. These are admission/presentation budgets, not a guarantee of model context capacity. No unrelated input formats or persistence expansion were added.

Root review matched draft capture/revalidation, named bridge actions, immutable admitted records, bounded preview/history client, runtime delivery and registered tests to the approved scope. It found one disclosure gap: New/Restore cleared memory-only sent attachment history but the native warning named only unsent attachments and grants/review snapshots. The warning now explicitly names that history; a red→green regression covers both New and Restore cancellation through the existing public host-intent/native-dialog seam. No API, architecture ownership or session-storage access changed. This is a root review, not an independent whole-repository review.

## Evidence matrix

Paths are under dist/delegated-completion-20260928/. Detailed commands, failures and cleanup are in wi014-installed/EVIDENCE.md; corresponding native evidence lives in wi014-native/.

| Acceptance | Actual evidence |
|---|---|
| Current source | compile.log/lint.log/tests.log: compilation, lint and661/661 tests pass, zero skipped. disclosure-red.log→disclosure-green.log covers the warning correction. Current deterministic cases cover transactional capture, byte/history budgets, cancellation, stale contexts, protected sources, uncertain delivery and late results; they are not claimed as independently injected real-provider faults. |
| Explicit fixed selection | Installed660 report.json/run.log: actual editor selection, exact literal preview/Escape, unsaved edit, explicit old-snapshot confirmation without request, then deliberate Send delivers original text; disk unchanged and accepted/settled history remains exact. |
| Mixed latest file plus fixed selection | Both660 mixed-report.json/run-mixed.log: actual native file picker, ordered selection/file draft, independent confirmations, no send on confirmation, real provider receives original selection then exact latest unsaved whole file, disk unchanged. The same mixed flow also runs in both661 visual matrices. |
| Count, history, recovery | Both661 final capacity-report.json/run-capacity.log: seven batches20/20/20/20/20/20/8, exact128 history; twelve later plain turns evict first body from32-message live chat while old snapshots stay accessible.129th Send blocked atomically, no request, draft retained; oldest/latest pages and exact oldest preview work. Native New warning names history loss; Cancel preserves128+draft; confirmed New frees capacity without replay; a deliberate new attachment succeeds. |
| Full UTF-8/transport/preview limit | Both661 byte-boundary-report.json/run-byte-boundary.log: each of four files is87381 Chinese characters plusx, exactly262144 UTF-8 bytes. Complete chunked preview equals source and Ctrl+End/Escape returns focus. Extra one-byte input refused atomically. Actual provider receives all four exact texts, totaling1048576 attachment bytes, without truncation. |
| Errors and editing recovery | Both661 edge-report.json/run-edge.log: native pickerCancel preserves draft,262145-byte source refuses admission without changing prior context, an actual later editor revision needs fresh confirmation, missing source blocks Send while retained preview remains literal. Remove returns Add-context focus; deliberate plain Send contains exactly the draft text block and no old attachment. |
| Short-window interaction | Both661 visual-report.json/run-visual.log: three actual bundled themes×two locales, per-item Tab→Preview/Enter/Escape focus return, draft preserved, no horizontal document overflow, input inside viewport. Installed289×506; native primary-sidebar fallback299×320. Context is locally scrollable. Six installed originals and six native originals inspected through the named contact sheets and individual views. Static screenshots do not prove transport/lifecycle. |
| Installed artifact | wi013-package/pi-vscode-wi014-disclosure.vsix:14085 entries, extracted RPC readiness/private gate handshake;661-artifact-hashes.json matches six installed production assets. |
| Cleanup | Each run closes owned host/provider and separately Ends retained runtime, observes matching terminal receipt and recovers. Both final-process-audit.json files are empty. |

Actual native F5 uses official unmodified Code1.105.1 and an isolated Debug Start/F5 launcher; installed Code1.139.1 uses a genuine VSIX. Both use public pi0.86.1 and a localhost synthetic provider, clean HOME/profile/workspace and no paid model or real credentials.660 results are versioned, not relabeled as661 reruns. The sole subsequent production change is disclosure wording, with full current tests and661 native/installed recovery/visual/transport evidence. The earlier660 and initial661 capacity runs are separately retained.

## Failed evidence and conclusions

Retain failed probes rather than erasing them. Initial selection helper Escape collapsed the selection; an unnecessary startup Control+w opened a dirty-editor Save dialog; early preview/removal assertions outran host projection; plain pi request content used a text-block array rather than a string. Corrections preserve exact-content/count assertions and observe completed public behavior. A disk rewrite followed immediately by Send did not establish that the open editor had reloaded: the requirement is current editor text. The repeated-change matrix therefore drives actual editor revisions instead of guessing a watcher delay. Native resize uses exact current development-page title plus owned PID/root, because opening an editor changes the title. No process targeting or product checks were relaxed.

Installed visual evidence is attachment-short-contact-sheet.png. Native acceptance uses attachment-short-six-originals.png; an earlier derived contact sheet accidentally included its prior derived output, so it is not the six-sample acceptance record. All original screenshots remain retained. Native fallback space is deliberately short: some metadata/actions require local scrolling, while confirmation, keyboard navigation and input remain operable.

## Superseded proposal and exclusions

The former ACTIVE proposal required explicit text file/fixed selection, mixed order, unsaved/no automatic save, per-item changes/confirmation/cancel/removal, complete literal preview and exact sent history. Changes or unavailable/oversized sources must block the whole send without truncation; history remains reachable beyond bounded chat, full history blocks without eviction, and deliberate reset discloses loss. Native F5, installed package, provider content, current tests and actual short-window interaction were required separately. Those scoped conditions are now satisfied; the old checkpoint's remaining Q16 formal integration is already covered by accepted WI-019/015.

No images/PDFs/tables, recursive directories, external-path attachments, automatic unrelated editor context, syntax highlighting, persisted full attachment history, rollback or full model-context guarantee is accepted. Shared New/Restore warning coverage does not close WI-017's broader session behavior. [ACTIVE](../../ACTIVE.md) remains the sole entry for WI-016/017 and boundary/gate work.

## Retention and close checks

Retain wi014-installed/, wi014-native/ and the named package as agent-owned unique evidence and isolated reproducibility profiles. Preserve pass/failure evidence and confirm no dependent process before cleanup; never delete by name. The edge test deletes only its exact newly created synthetic source to verify unavailability. No user state or adjacent repository was changed. No Git staging, commit, push, merge or publication occurred. Close verification records docs:verify, docs:health and diff-check under the WI014 evidence root; document checks do not substitute for this semantic acceptance review.
