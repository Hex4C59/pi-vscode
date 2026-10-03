# WI-088 — PI-GAP-26 bounded local diagnostic export

English | [中文](2026-10-02-wi-088-local-diagnostics.zh.md)

- Type: Discussion
- Status: Active
- Created: 2026-10-02
- Authority: scoped Prepare/Build and evidence, not acceptance
- Related: [ACTIVE](../../ACTIVE.md), [eight-item Goal](2026-10-03-eight-gap-goal.md), [PRD](../product-requirements.md)

## Approval and scope

The current user execution request approves PI-GAP-26 only as reviewable, cancellable bounded local export. No upload, source, complete session, credentials or new sensitive-content collection. Routine reversible choices and local commits are delegated; native acceptance is separately required. Upload remains unapproved pending scope. This record uses the current UTC date; older Goal names retain local dates.

## Prepare — current implementation and public APIs

Provider already owns lifecycle flags and native read-only resource reports. No diagnostic exporter exists. Inspect src/extension.ts, PiChatViewProvider, resourceReport and host harness. Actual extension/runtime manifests are fixed files beneath the installation root (4870/4041 bytes at this source); versions must be checked, not inferred from dependency declarations. VS Code public TextDocumentContentProvider/showTextDocument gives an immutable read-only snapshot; nonmodal showInformationMessage action permits review before explicit export, showSaveDialog permits destination cancellation. Node fs fixed manifests and exclusive local atomic file publication suffice; no RPC, model/account, workspace reads or webview protocol changes.

## Bounded design and ownership

Host diagnostics module projects only allowlisted actual package/host versions (missing/invalid => null), platform/architecture and existing fixed lifecycle enums/booleans: workspace eligibility, runtime state, task/model/session busy, controlled profile and presence of bounded error flags. Exclude names, identifiers, paths, content, endpoints, errors/log bodies, env, plugin inventory, providers/models and conversation details. Tiny JSON schema <=4096 bytes. Preview exact frozen bytes, explicit Export reviewed snapshot or Cancel, then local file-only destination. Refuse existing destinations (including symlinks); private temporary file in chosen directory then exclusive atomic link, cleanup owned temporary data. Cancellation is effective before final publication; no promise to undo an already published file. Dispose revokes pending authority; single owner rejects overlapping commands. Failures fixed bilingual notices and repeat-command recovery, no sensitive exception strings. No background collection/persistence; export only chosen local artifact. Remote host export excluded.

## Failure modes before code

- Declare version as actual despite missing/invalid installed manifest; unbounded manifest or arbitrary path reading.
- Accidentally serialize state messages/error text/session/model/source/path/credential content or inherit object extras.
- Export before genuine review; change frozen bytes after consent; preview writable content mistaken for exported bytes.
- Cancel review/save/dispose but still write; simultaneous exports overwrite active snapshot; remote destination.
- Overwrite existing/symlink destination; partial failed publication; owned temp survives failure; leak sensitive errors.
- Start/send/stop runtime, trust grants or collection triggered by export; lack bilingual failure/cancel recovery.

## Requirements/architecture and observable acceptance

REQ-009 bounded support diagnostics, no new trust/data/upload decision or adapter boundary. Command palette native host flow; no settings/Webview visual change. Pre-code composition exercises production owner/native API seams plus actual isolated filesystem: literal excluded sentinels absent, exact preview/export identity, both cancels/dispose, overlapping requests, package-version unknown, file-only/existing destination, failed-write recovery/temp cleanup and no runtime calls. retain repeatable JSON/log artifacts. compile/lint/npm test/docs checks, reviewed scoped commit, clean committed candidate/package; actual native review/save cancellation and export separately. Existing isolated Code binding blocker cannot be called acceptance; continue PI-GAP-27 if still blocked.

Expected writes: src/extension/diagnostics, provider/activation/command manifests, pre-code host composition tests, paired PRD/README/WI records. No post-code unit tests. Baseline clean candidate4eb8d38 checks passed; actual diagnostics tests not yet written or run.

Prepare complete for this bounded design; next pre-code composition red then Build under the current scoped authorization. No implementation or acceptance at this checkpoint.


Pre-code six composition cases failed red on the absent public diagnostics entry, then passed through the implemented production owner and isolated filesystem. Review snapshots use unique URIs with at most eight immutable previews; expired preview reads say unavailable, never substitute another report. Cancellation/disposal revokes authority before the exclusive atomic publication request; once that irreversible request is issued, no rollback is promised. Standard current-tree checks are in progress; no candidate/native acceptance yet.


## Committed candidate handoff — native pending

Implementation5f2135f95329cdbdd4b4c3e230f2a627f70d4e42 reviewed/committed separately from ACTIVE. Current development and clean isolated committed candidate compile/lint/1261 behavior/docs:verify(two existing ADR warnings)/docs:health/package:vsix pass. Candidate-evidence retains exact reviewed/exported host JSON, cancellation/overlap/no-overwrite/recovery composition and fixed manifests extracted from the generated VSIX. Actual archive extension and pi versions are both0.86.1 because the existing packager uses dependencyVersion for the extension manifest; source extension remains0.0.1. Report actual manifests, never substitute source/declaration versions. Extraction is not installation. Native read-only review, nonmodal notification, save/cancel and real-host visuals remain unverified under the same isolated Code binding blocker. No native/delegated acceptance or WI closure.

Immutable previews are capped at8; expired reads are explicitly unavailable. Cleanup failure after successful publication is reported as already exported, not as no file; pre-publication errors stay retryable. A standard lint run caught unsafe-finally throw during development, corrected without changing test assertions; preserve failed vs final logs. No sensitive collection/upload/model calls. Retain local slice pending; upload remains separately unapproved. Proceed serially to independent PI-GAP-27.


## Resumed native Prepare — October 3, 2026

WI087 closed35fefec; WI088 alone remains under original local-only authorization. Inspected production LocalDiagnostics, diagnosticSnapshot, packageVersions, exclusive publication and command/provider registration. Preserve fixed installation-manifest reads, enum/boolean projection, <=4096bytes, immutable unique readonly preview, eight-preview retention, single live operation, explicit nonmodal review then native local Save, exclusive new-file publication and owned cleanup. Export does not start a runtime or grant project resources. Versions must match the actual product manifest: F5source0.0.1 versus packaged0.86.1. No package/API/dependency/permission change.

Native observer uses only public VS Code document-open observation for the isolated diagnostic scheme and fixed installed manifest reads; saves exact allowlisted preview bytes as evidence, never replaces APIs, automatically consents/exports, starts a runtime or reads user documents. Fresh isolated empty auth/HOME/agent, no account extensions/memory SecretStorage, no provider or model service. Synthetic source/env strings live only in the owned fixture and must be absent from the report; no actual secrets. Actual UI cases: eligible not-started metadata; readonly preview; Cancel review; Cancel Save; overlapping command no second preview; English export exact frozen bytes; repeat command recovery; Chinese review/Cancel; Chinese Save/export equality; English/Chinese native keyboard/visual. Native readonly editor and nonmodal feedback/save must be inspected separately in both F5 and independent installed lanes. Existing no-overwrite/symlink/error/dispose races remain separately labeled composition/filesystem evidence; do not approve a native Replace/delete prompt or fake adverse UI success.

Before new tool code, contracts will reject missing per-case review, nonzero actual process, failed installation, wrong isolation, missing ordinary observer, altered exports or invalid report shape and prove actual observer preview/export identity at synthetic VS Code boundary. Native wrapper50-minute reviewer/60-minute owned deadline and normal UI exit; no user process force kill or lock bypass. Record precise candidate SHA, VSIX digest, exported bytes/hash/mode/size, native screenshots/AX/read-only prompt, cancelled empty owned export directory, source manifests and zero inference. Prepare complete for these verification-only tools; next pre-code RED before Build.


Eight pre-code subprocess/ordinary-observer contracts failed on missing tools, then passed: isolation/F5/install/failure, missing native review, exact valid preview/export bytes, tampered-export and sensitive-extra rejection. This is synthetic tool-boundary evidence only, not native acceptance. No provider starts; driver observes only actual diagnostic document events, <=8 previews and exact bilingual exports with private0600 mode. Native candidate and actual F5/installed remain next. Logs dist/goal-eight/wi088/native-harness/.
