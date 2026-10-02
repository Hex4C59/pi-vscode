# WI-089 — PI-GAP-27 installed version information

English | [中文](2026-10-02-wi-089-version-information.zh.md)

- Type: Discussion
- Status: Active
- Created: 2026-10-02
- Authority: scoped Prepare/Build and evidence, not acceptance
- Related: [ACTIVE](../../ACTIVE.md), [eight-item Goal](2026-10-03-eight-gap-goal.md), [PRD](../product-requirements.md)

## Scope and current facts

Current execution request approves actual extension/bundled pi versions and corresponding local notes; missing/unavailable explicit, no newest-version promise or implicit network/update/install. No dependency upgrade. WI-088 actual-manifest public installedVersions already supplies bounded name/version checks. Native read-only TextDocumentContentProvider/showTextDocument matches existing report flow. No version report exists. Source extension0.0.1, installed archive0.86.1 under the existing packager mapping; bundled pi0.86.1. Do not change package versioning to fit notes or label source as installed. Root CHANGELOG has0.0.1 and Unreleased,1581bytes; upstream local CHANGELOG569032bytes starts exact0.86.1. Root CHANGELOG is not currently selected by package files; add just that fixed local document for this slice, not download/market scope. Public file reads are limited to installation manifests and those two local notes files. Upstream source is read-only.

## Prepare design and boundaries

One host version-information module uses public installedVersions, fixed paths only; lazy native command. Show actual extension/pi/VS Code versions distinctly, unknown when missing/invalid. For each version, read at most64KiB prefix plus one byte, find one exact version heading, include only its complete section <=8KiB. Unreleased/other versions never presented as corresponding notes. If matching section is incomplete/budget-exceeded, duplicated, absent, unreadable or version unknown, explicit localized status; no fallback to another version. Plain read-only text, no Markdown/HTML evaluation or automatic links/images/network, no runtime start/prompt/trust changes. Preview reflects one fresh package snapshot, bounded document <=20KiB, single opening owner, dispose/late suppression and fixed bilingual native failure recovery. No persisted UI state. Root notes may be unavailable for installed0.86.1; this is honest missing state, not a scope blocker requiring invented notes.

## Failure modes before code

- Source/dependency declaration masquerades as actual installed version; guessed newest/automatic update/network.
- Wrong/Unreleased notes presented for installed version; missing/duplicate/truncated/out-of-budget notes look successful.
- Whole huge changelog loaded/rendered; arbitrary workspace paths or unsafe rich resources; error leaks absolute paths.
- Old async open after dispose or overlapping commands; native failure cannot recover.
- Packaging omits root notes, or adding notes changes runtime dependencies/versioning/delivery scope.

## Approval, requirements, evidence

REQ-009 local support information; no architecture/ADR/gate or major trust/data decision. User bounded Goal approves Build after this Prepare. Expected writes host version-information/public wiring/command/package files, pre-code composition/packaged-note assertions and paired README/PRD/WI. Write production composition failures first: exact actual version selection, different versions/Unreleased exclusion, unknown/missing/duplicate/huge/truncated/unreadable states, literal plain source, disposal/overlap/open retry/no runtime calls; real fixed package notes and packaged archive checks separate from simulated native APIs. Baseline clean5f2135f1261checks passed. Then compile/lint/behavior/docs, scoped reviewed commit, clean candidate/package; native en/zh read-only report and installed presentation required separately. Existing isolated Code binding blocker means no acceptance/closure; retain all eight Goal native items pending if it persists.

Prepare complete for this bounded design. Next pre-code composition red then implementation. No version report or native acceptance yet.
