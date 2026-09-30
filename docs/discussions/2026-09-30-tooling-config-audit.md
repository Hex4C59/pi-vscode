# Tooling and Configuration Audit

English | [中文](2026-09-30-tooling-config-audit.zh.md)

- Type: Discussion
- Status: Draft
- Scope: Six previously uninspected tooling scripts and seven build/debug configurations. No HTML/CSS files or previously reviewed implementations reopened.
- Authority: Review evidence only, not implementation approval, WI acceptance, ADR or Git commit. Fixes wait until review completes.

Tracking: [progress](code-audit-progress.json). Earlier round: [core boundaries](2026-09-30-core-boundaries-audit.md).

## Confirmed Finding

### TOOL-01 / P2: Commit path classification omits the actual Vite build configuration

[isImplementationPath](../../scripts/testing/commit-check.mjs#L34) classifies root build inputs such as esbuild, TypeScript and ESLint configs as implementation, but omits [vite.config.mts](../../vite.config.mts). That file controls the production Webview input, target, output and asset naming.

An isolated check with valid mocked Git name-status records for ACTIVE.md plus vite.config.mts returns ok true and says ACTIVE is paired only with docs changes. Controls with ACTIVE plus tsconfig.json or a src file return ok false; ACTIVE plus README remains allowed.

This is a confirmed mechanical classification defect. It does not authorize a real commit or bypass maintainer approval. No Git command, staging or commit was performed.

Candidate follow-up: include the repository's actual Vite configuration in build-input classification; cover addition, modification, deletion and rename records. Keep the existing docs-only allowance and manual semantic review distinct.

## Future Coverage Risk, Not Existing Missed Tests

### TOOL-02 / P3: JSX spec discovery and built-path mapping are incomplete if TSX specs are allowed

[discoverTests](../../scripts/testing/test-runner-lib.mjs#L33) discovers only .spec.ts application tests. [Built path mapping](../../scripts/testing/test-runner-lib.mjs#L92) likewise rewrites only the .ts suffix. [Test type-check configuration](../../tsconfig.tests.json#L6) includes TSX files, and [Webview compilation](../../tsconfig.webview.json#L7) supports JSX.

A mocked filesystem containing plain.spec.ts and jsx.spec.tsx discovers only the former. Filename inventory confirms no existing .spec.tsx files in src at this review point, so no current missing test run is claimed. This finding is conditional on allowing TSX specs; the broader TSX type-check include does not itself establish the naming convention.

Candidate follow-up: either explicitly constrain spec naming or support TSX in discovery and output mapping together. Changing only the discovery regex would leave incorrect built paths. No test assertion audit or existing suite execution was resumed.

## Observations and Unverified Boundaries

- Test execution uses the current Node executable, shell false, Windows hidden execution, a copied environment with NODE_TEST_CONTEXT removed, and rejects empty inventories, launch errors, signals and nonzero exit status. Isolated controls pass without changing the parent environment.
- Test cleanup checks dist and dist/tests for symlinks/non-directories and bounds output under the supplied root. Cleanup and real builds were not executed in this pass; no race-resistant filesystem security boundary is claimed.
- Asset verification checks required asset uniqueness/nonemptiness, archive payload sizes/methods, unexpected archive frontend assets and SHA-256 equality against local build artifacts. No actual stylesheet, image or archive was opened. The JavaScript wrapper was inspected, not the excluded CSS files.
- Archive and local-file reads have no explicit application byte budget. Inflate output is bounded by the size declared in ZIP metadata rather than an independently chosen resource budget. Cost for malformed or very large artifacts is unmeasured, not a demonstrated exhaustion incident.
- Synchronous test/Git execution has no explicit per-call timeout in these libraries. Actual outer CI limits and test timeout coverage were not rechecked; no current hang is claimed.
- Build/debug configurations are inspected as configuration only. No compile, lint, F5, attached debugger, installed VSIX or minimum-host compatibility acceptance is inferred.

## New Coverage

All 13 newly inspected files returned complete source in this pass and are excluded from later review rounds. Exported behavior was not followed into previous implementations.

| File | Coverage |
|---|---|
| [run-tests](../../scripts/testing/run-tests.mjs) | Entry and failure exit handling |
| [test-runner-lib](../../scripts/testing/test-runner-lib.mjs) | Discovery, cleanup, build options, child execution; isolated discovery/execution controls |
| [commit-check](../../scripts/testing/commit-check.mjs) | NUL parsing, classification, staged checks, formatting and CLI identity; mock Git classification probe |
| [verify-webview-assets-lib](../../scripts/packaging/verify-webview-assets-lib.mjs) | Archive/directory checks and hash comparison; no real assets read |
| [verify-webview-assets](../../scripts/packaging/verify-webview-assets.mjs) | CLI arguments, reporting and failure exit |
| [docs-verify](../../scripts/docs/docs-verify.mjs) | Report composition and error exit; older i18n implementation not reopened |
| [ESLint config](../../eslint.config.mjs) | Recommended rules, source globs and explicit script exclusions |
| [Vite config](../../vite.config.mts) | Preview root, production entry, target and output conventions |
| [host TS config](../../tsconfig.json) | Node target/resolution, strictness and source exclusions |
| [test TS config](../../tsconfig.tests.json) | Test includes and ambient types |
| [Webview TS config](../../tsconfig.webview.json) | Browser target typing, JSX and exclusions |
| [debug launch config](../../.vscode/launch.json) | Extension host launch/attach and default build task |
| [build task config](../../.vscode/tasks.json) | npm compile task and matcher |

## Verification

TOOL-01 and the conditional TSX discovery case were reproduced with real newly read helper code. Git and filesystem inventory were mocked; the esbuild runner probe used write false, external dependencies and a one-source allowlist. Real test processes, builds, cleanup, pi, credentials, configuration files for pi and session storage were not used. No new repository tests were run and no application files were edited. Documentation and progress consistency checks are reported in the handoff.
