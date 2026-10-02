# WI-084 — PI-GAP-06 workspace file completion

English | [中文](2026-10-03-wi-084-file-completion.zh.md)

- Type: Reference
- Status: Blocked
- Created: 2026-10-03
- Authority: bounded PI-GAP-06 Prepare under the eight-gap goal; implementation and evidence pending

## Scope, approval and current implementation

The October 3 bounded goal explicitly approves PI-GAP-06 within ACTIVE, actual verification, delegated acceptance and local commits. WIP=1; WI-082/083 retain unfinished native acceptance, not closure. Decision: none; Gate ID: none; PRD: user-visible REQ-004/009 attachment discovery. Prepare complete, Build authorized by that scoped request; this record is not evidence of delivery.

Existing DraftSubmission owns acknowledged draft revision, preparation cancellation, attachment limits and atomic capture/revalidation. Whole-file attachment uses host native selection followed by captureFile, realpath/workspace containment, sensitive-path/content rejection, editor snapshots and size checks; changed sources require existing confirmation at send. CommandInput already owns slash completion and IME/Enter handling; WebviewClient sends named, versioned, identity-bound operations. No current @ file completion was found.

Public VS Code declarations in the installed @types/vscode expose workspace.findFiles with RelativePattern scoped to one folder, default files.exclude when exclude is undefined (not search.exclude), bounded maxResults and cancellation token. Native createQuickPick supports initial value, fuzzy label/path matching, keyboard selection and explicit cancellation. These are public host APIs, not pi agent-loop code; selected content must still pass the existing capture owner. No dependency/upstream upgrade, source-content index, persistent catalogue, watcher or new execution/loading authority.

## Approved approach and ownership

A standalone @ token at the composer caret offers explicit Tab/file-discovery completion; do not intercept email-like text, IME, slash completion or ordinary Enter submission. A localized, quiet hint explains the key. Tab opens host-native fuzzy/path QuickPick seeded with the token query. Native selection is explicit: no automatic attachment on typing. The renderer sends only a bounded caret plus its current draft revision and existing generation/view envelope, never a filesystem path or arbitrary read request. Host derives the token from acknowledged draft text and refuses stale/invalid requests.

Discover only the one eligible, trusted local workspace using a RelativePattern and default file exclusions. Enumerate at most 3001 paths, present at most 3000 safe relative names, and explicitly disclose truncation and that filtering is within that bounded list, not a complete project search. No source bodies are read for discovery. Sensitive/invalid/outside path names are excluded using the existing attachment path policy; symlink targets and actual contents are authoritatively checked on explicit selection by captureFile. Existing native full-file selection stays available when a bounded discovery list cannot find a file. Native QuickPick keeps file paths out of the Webview.

Run discovery inside DraftSubmission's existing preparation lease. On successful capture/revalidation only, atomically attach the whole file and remove the exact @ query token from that acknowledged draft; retain all other draft text and existing attachments. On cancellation, no result, failure, source rejection, bounds or changed identity/text, keep the draft and do not append a partial attachment. Existing whole-file change confirmation, send, recovery and history rules are unchanged. Deadline/cancellation/disposal invalidate search and QuickPick listeners; no automatic retry or send. New host operation is allowlisted/documented in the bundled message contract; no browser filesystem access.

Expected paths: named protocol/parser/client; composer input and localized hint using existing tokens; host file-discovery owner and DraftSubmission capture integration; pre-code composition/mounted checks; paired requirements/README/contract notes. Host owns filesystem capabilities, renderer only explicit intent. Architecture trust, identity, cancellation, bounds and owner directions remain; actual host/visual evidence is pending. Do not promote native-window binding limitations to UI passes.

## Failure modes before code

Typing/email/IME triggers unwanted reads; Enter sends rather than completes or slash behavior regresses; unacknowledged edits or forged caret/path causes attachment; another project/view/session receives results; out-of-workspace/sensitive/symlink/content source bypasses capture; enumeration implies a complete catalogue after truncation; hidden/excluded files or no match misreported; thousands of names/listeners/timeouts grow without bounds; picker cancel loses draft; attachment/source change during capture appends a partial or stale item; query removal consumes surrounding text or a later edit; repeated Tab duplicates attachment; preparation, busy task, Stop and model/session/profile changes race; missing native APIs or failed discovery has no recovery; long names/languages/themes/keyboard focus become unusable.

## Observable acceptance and artifacts

Before application code, prepare host-to-draft attachment composition and mounted composer/client interaction scenarios. Verify @ at caret, email/IME/slash/Enter separation, literal query/path fuzzy native selection, default excludes/one-folder bound, explicit truncation, no source read before choice, sensitive/outside/symlink/changed/oversize rejection, cancellation/stale/edit/duplicate/timeout/disposal, atomic draft preservation and inherited source-change confirmation. Use isolated synthetic files only and reproducible TAP/JSON; never enumerate the user's real sensitive files for verification.

Run compile/lint/npm test/docs:verify, isolated clean committed-candidate checks and packaging. Separately exercise actual macOS F5 and installed VSIX, native picker keyboard/Cancel/selection and attachment flow, and affected rendered hints at 280/320/400px, light/dark/high contrast and English/Chinese with screenshots. Real pi delivery can use synthetic loopback only if needed, not real accounts/paid models. Native acceptance currently has the retained isolated-Code binding blocker; absent evidence remains unverified. Artifacts: dist/goal-eight/wi084/. At Prepare, no code or verification pass existed; the development checkpoint below records subsequent implementation.


## Development checkpoint

Before code, four host/draft composition checks and two mounted-production scenarios were prepared. Expected red showed the missing discovery/Tab intent; after implementation all six passed. Compile, lint, 1235 standard checks and docs:verify passed. Full checks caught private cross-module imports and a browser value import from host contracts: fixed through public entries and an independent renderer-only affordance parser, preserving authoritative host derivation. No boundary test was weakened. The final hint-availability/docs rerun also passed compile, lint, all 1235 checks and docs:verify. Browser captures precede that availability refinement and are development evidence, not committed-candidate acceptance.

Real-browser synthetic-host screenshots cover 18 combinations of 280/320/400, dark/light/high contrast, English/Chinese and long paths. Inspected contact sheet/geometry show no horizontal composer overflow, reachable Send and a quiet wrapped hint. Some existing welcome animations are mid-frame, not motion evidence. Artifacts: dist/goal-eight/wi084/browser/{matrix.json,contact-sheet.jpg,*.png}. Native picker remains host-composition evidence, not F5/installed VSIX; the isolated-Code binding condition remains. Search/picker deadlines are 15 seconds/2 minutes; stale leases/disposal release controls. No acceptance, closure or clean-candidate claim. Next: scoped diff review/local commit and clean-candidate/native verification.


## Clean candidate and serial handoff

Implementation commit `fa1d18d97ef80ba95b0f814548a8b8cb56da7907` was checked in the isolated clean candidate: compile, lint, all 1235 checks, docs:verify, docs:health and VSIX packaging passed; before/after source status empty. Evidence: `dist/goal-eight/wi084/candidate-evidence/verified-candidate/` and `candidate-identity.json`. The candidate checkout is reusable; saved identity, not its later HEAD, identifies this run. The native isolated-window binding blocker remains unchanged. F5/installed native file picker, keyboard and attachment interaction are unverified; no agent acceptance or closure. Retain PI-GAP-06 unfinished and move the single current WI to independent WI-085 / PI-GAP-14.
