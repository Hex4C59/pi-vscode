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
