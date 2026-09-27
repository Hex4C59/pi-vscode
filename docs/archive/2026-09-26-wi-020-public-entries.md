# WI-020 public-entry and type-contract archive

English | [中文](2026-09-26-wi-020-public-entries.zh.md)

- Type: Historical record
- Status: Archived
- Archived: 2026-09-26
- Reason: the maintainer explicitly accepted and closed WI-020, then resumed WI-019 / UIP-01.
- Authority: historical technical scope and evidence only; [ACTIVE](../../ACTIVE.md) owns current work.

## Closure

The maintainer accepted the public-entry migration, module-owned type contracts and the sole P2 repair on September 26. Standards and Spec reviews each found zero unresolved issues after repair. This closes only the technical WI: PRD acceptance, other WIs, ADRs and architecture gates are unchanged. WI-019 resumes with UIP-01 only. The seven uncommitted source/test repairs remain unstaged; no commit was created. HEAD remains fbf6767066715d5b18bd3c85f2350fe86fff9a7b.

The original Chinese ACTIVE proposal and handoff checkpoints, including the pre-existing user additions, are preserved in the companion archive as historical source records. Their former pending-review and paused wording describes the original checkpoints, not the closure above.

## Approved proposal

### Entry scope

WI-020 was authorized on September 23 while WI-019 was paused. It is technical-only, Decision none: preserve product behavior, protocols, trust, storage, state ownership and build behavior. A module is a directory with external consumers and an independent responsibility, not every source/test directory. Cross-module imports use small explicit index.ts entries; module-local implementation imports and internal tests may remain direct. Only existing consumed capabilities are exported; types use type-only exports. Browser code must not acquire host or Node capabilities through a barrel. Standalone approval-gate and session-worker build files remain explicit entries.

### Type-contract follow-up

The authorized follow-up concentrated caller-facing module-owned types in local types.ts files and exported them through index.ts. It referenced the read-only upstream agent types file without copying upstream policy. Cross-layer Webview, runtime and session contracts retain their single host-owned source in extension/contracts. No empty type files, speculative modules or general-purpose framework were required.

### Acceptance and exclusions

Acceptance required compile, lint, all tests, Webview assets, documentation checks, runtime-cycle/type-value consistency checks, production Webview isolation and independent build entries. Additional F5 or installed-package validation was not required for this behavior-preserving slice. Passing automation alone did not close the WI; the September 26 maintainer acceptance did. No ADR or gate acceptance was included.

## Implementation checkpoints

### Entry and type checkpoints

Twelve entries covered adapter / runtime / sessions, host / bridge / contracts / draft / editor-tools / models / sessions, and Webview / presentation modules. Eight caller-contract files covered runtime, session adapter, draft, editor tools, models, host sessions, Webview and presentation. The initial entry checkpoint passed 319 tests, and the follow-up type checkpoint passed 320 tests on Windows Node 24.12.0. Compilation, lint and Webview assets passed. Static scans covered 62 and later 70 production files without runtime cycles. The historical documentation runs had no structural errors or stale translations but failed overall on an unrelated local setup-ts-deep-modules example link; that local skill was not changed. No browser, F5, installed-VSIX or genuine-pi validation was claimed.

### Initial P2 review

On September 26, the first review used 078569c...fbf6767 (705baf2 and fbf6767). Standards found zero issues; Spec found one P2: components/types.ts bypassed its parent's entry, and the presentation-to-parent class exemption in architecture-boundaries.spec.ts concealed the omission. Fresh 320-test/build/static/bundle evidence did not eliminate that spec gap. The original review records, including its corrected bundle path-matching probe, remain historical evidence.

## P2 repair and acceptance evidence

### Repair design and baseline

Repair baseline was fbf6767066715d5b18bd3c85f2350fe86fff9a7b, with four pre-existing added ACTIVE lines and an empty index. The user additions were retained and excluded from the repair review. components/types.ts now imports the parent type through index.ts using import type. Four displays receive the existing parent-owned pagination limits through pageSize Props; no value dependency returns to the parent barrel. No ownership change, new module, behavioral change or spec exception was added.

### Verification and review

The checker now reports the same violations for positive/negative source fixtures and the application scan, without the class exemption. One regression first failed because the old exemption returned an empty result; after the necessary repair all four structure cases passed. Twenty-eight existing display/client regressions passed before and after repair. Fresh compile, lint, all 321 tests (zero skipped), verify:webview and diff checks passed. Seventy production TS/TSX files and 72 runtime edges had no cycles, bypasses, privileged browser imports or presentation-to-parent value edges. Production Vite metadata excluded host, adapter, Node and preview inputs and matched disk output. The unchanged explicit gate and session-worker entries produced byte-identical output to the pinned baseline under the same toolchain. An initial evidence assertion mistook Git LF versus worktree CRLF for a build-config change; only that probe assertion was corrected, and its failure log was retained. Artifact byte comparisons were not normalized.

Documentation verification used the normal entry with only the prohibited .local-env directory additionally excluded in-process: zero errors, five existing notices and zero stale translations; no checker configuration was edited. Two independent read-only reviewers examined baseline-to-worktree code, the current-task ACTIVE delta and untracked inventory, excluding user changes. Standards: zero hard violations and zero heuristic smells. Spec: zero findings; original P2 resolved. Neither reviewer claimed to have rerun root-agent checks. The original commit range was background only, not the repair diff.

Governance dimensions 1–3 and 5 preserved responsibilities, interface and ownership; 16–17 had scoped automated evidence. Other dimensions introduced no new design. No browser visual, real pi, F5 or installed-VSIX evidence was produced by this repair. These limits and pending product/ADR/gate acceptance survive technical closure.

## Retained evidence

The ignored dist/wi020-p2-fix-20260926/ and dist/wi020-review-20260926/ directories retain baselines, red/green and build logs, dependency/bundle evidence and review reports. Remove only when the maintainer no longer needs their unique evidence, never based on their names. No temporary worktree was created. Current closure/archival documentation checks are reported in ACTIVE, not inferred from these historical passes.
