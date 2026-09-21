# Testing agent playbook

English | [中文](testing.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-21
- Authority: project-local test organization, naming, collection and verification evidence

## When to load

Read this playbook before changing behavior, fixing a regression, adding or moving tests, or changing test collection/build configuration. Inspect the affected implementation, existing tests and current `package.json` scripts first. This guide owns test-file policy; [TypeScript](typescript.md) owns language/tooling rules and [pi integration](pi-integration.md) owns runtime isolation. It does not authorize a framework migration or broaden the current task.

## Ownership and file placement

- Keep application tests beside their owning source: `src/extension/webviewMessages.ts` and `src/extension/webviewMessages.test.ts`. Follow the same ownership principle for adapter and webview-related tests, but verify collection before adding a new location. Do not introduce `src/__tests__/` or a repository-wide catch-all `test/` directory.
- Keep Node script tests beside their scripts as `scripts/<subject>.test.mjs`.
- Preserve existing subject spelling; use the module or observable behavior as the name. A test file may cover a coherent behavior across multiple modules; a one-to-one source/test mapping is not mandatory.
- Put reusable setup in ordinary files such as `harness.ts` or `<subject>.test-support.ts`, not in another collected `*.test.ts` file. Importing a test can register and run its cases again.
- Keep fixture inputs and expected outputs with the owning tests (for example, an owner-local `fixtures/` or `expected/` directory when needed). Create no empty infrastructure directories. Review expected-output changes against intended behavior; do not regenerate them merely to make a test pass.
- `dist/tests/` is generated output, not the source of tests. Do not hand-edit it or treat stale bundles as evidence that current source ran.

## Naming and collection are one contract

The current automated runner is `node:test`, not Vitest. Use `*.test.ts` for application tests and `*.test.mjs` for scripts. The suffix has meaning only together with the runner's actual collection rules; renaming a file alone does not create a test tier.

At adoption, `npm test` bundles `src/extension/*.test.ts` through esbuild into `dist/tests/`, then runs `dist/tests/*.test.js` and explicitly named script tests. It does not automatically collect adapter tests, nested source tests or every new script test. Read the current script rather than assuming recursive discovery.

Before adding, moving or renaming a test:

1. Identify its owner and evidence tier.
2. Check that the source file is included in build, typecheck/lint as applicable, and test collection.
3. If collection needs changing, include the necessary scoped runner/configuration change in the approved task; otherwise report the missing collection as a blocker, not completed coverage.
4. Execute the relevant command and verify that the new case actually ran. Ensure removed or renamed tests cannot continue running from stale generated output.

Do not rename or relocate tests without a scoped migration that updates collection and verification together. The suffix vocabulary below does not authorize that migration or a switch to Vitest. The current placement and `*.test.*` rules above remain in force until the migration is implemented.

## Test suffix vocabulary and activation status

Directories identify ownership; suffixes identify the kind of evidence; runner configuration determines execution. The proposed layout is module-local `src/extension/tests/`, `src/adapter/tests/` and `src/webview/tests/`, with production files left in place and script tests beside scripts. Ordinary and end-to-end tests may share an owner's directory. This layout is a proposal, not an implemented migration; do not create empty directories or assume these paths are collected.

### Ordinary specs: `*.spec.ts` / `*.spec.mjs`

The proposed replacement for `*.test.ts` / `*.test.mjs` covers module behavior and controlled multi-module compositions. Use a module or behavior name in kebab-case, for example `webview-messages.spec.ts` or `model-selection.spec.ts`. Deterministic real implementations are preferred; narrow external seams may be mocked. A spec need not test only one function.

After migration, `npm test` is intended to collect these files without keys or paid calls. Currently it still collects the existing `*.test.*` files. The `.spec` suffix does not require Vitest: `node:test` can execute explicitly supplied compiled spec files. Existing mock-provider and VM-based Webview script tests belong here, not in a browser e2e tier.

### End-to-end: `*.e2e.ts`

Exercises a declared real entry path, such as a real pi subprocess or a VS Code test host, and asserts externally observable results. A future `runtime-startup.e2e.ts` could verify startup without any model call. E2e does not imply a paid model call or prove every product surface: RPC-process evidence does not establish VS Code UI correctness. State which entry is real and which external services, if any, are substituted.

Use `.e2e.ts`, not the previously suggested `.e2e.test.ts`, when this tier is introduced. The proposed command is `npm run test:e2e`; it does not exist yet. Its collector must be separate from default specs, with documented build/runtime prerequisites, timeouts, isolation and teardown. Existing `spike:*` scripts and manual F5 checks remain their own evidence categories; renaming them alone does not establish an automated e2e suite.

### Owner-local expected output: `*.expected.e2e.ts`

In DeepSeek Harness this denotes assembled process/CLI expectations without recorded-session replay. The driver runs behavior and compares committed outputs near its owner, typically under `tests/expected/`. Expected data files such as `*.expected.json` are comparison data, not executable tests. An ordinary spec can also assert a golden output; that alone does not make it an e2e test.

This tier is not enabled here. If introduced as a separate suite, define its command and exclude it from the general e2e collector: `*.expected.e2e.ts` also matches `*.e2e.ts`. Each file must have an explicit intended suite rather than accidental duplicate execution.

### Recorded-session replay: `*.snapshot.ts`

DeepSeek Harness reserves this suffix for recorded-session-driven replay; it is not a synonym for any test using snapshot assertions or screenshots. This repository has no such suite. Do not copy its top-level session corpus or pi session-file internals. Introducing replay infrastructure needs a separate approved design, documented public APIs, recording/replay rules, secret handling and reviewed fixture updates.

### Performance: `*.bench.ts` / `*.perf.ts`

The reference repository uses `.bench.ts` for performance budgets/gates and `.perf.ts` for diagnostic performance runs outside its default test inventory. Neither tier is enabled here. A future benchmark must define workload, environment, measurements and failure thresholds; a diagnostic must state that it is not a gate. Neither belongs in default behavior tests merely because a broad glob matches it.

### Optional subject qualifiers and support files

- `.host.spec.ts` / `.client.spec.ts` identify the tested side; `.compat.spec.ts` identifies compatibility behavior. They remain ordinary specs. Qualifiers do not automatically select Node, a DOM environment or a browser; setup and runner configuration must establish that environment. Use qualifiers only where they clarify an actual distinction.
- `.bench.client.ts` / `.perf.client.ts` similarly qualify a client-side performance subject in the reference repository; they establish no local execution capability.
- `harness.ts`, fixture helpers and expected data must not be collected as test entries. Never import a collected `.spec.ts` or `.e2e.ts` to share setup.

### Requirements before enabling a new tier

1. Add a real representative case, its runner command and explicit inclusion/exclusion rules in the same approved change. Update this guide's status and commands; do not advertise a future command as available.
2. Declare dependencies, build artifacts, tested entry, credentials policy, timeouts and resource cleanup. Keep paid calls behind explicit maintainer approval even for e2e.
3. Check recursive discovery, helper exclusion, overlapping suffixes, stale generated output and failure exit codes. Verify the intended case actually ran and was not registered twice.
4. Report passed, failed, skipped and unavailable evidence separately. Define whether missing prerequisites fail a required lane or explicitly skip an optional one; an all-skipped suite is not a passed acceptance check.

This documentation defines meanings and activation requirements only. It does not install `test:e2e`, expected-output, snapshot or performance commands, change CI, or migrate existing tests.

## Evidence tiers and safety

- **Automated tests (`npm test`):** repeatable, keyless behavior and regression checks. Prefer real deterministic implementations; substitute narrow external seams such as VS Code APIs, processes, clocks and RPC. Test relevant malformed input, errors, cancellation, late completion, generation changes and resource cleanup. Assert observable outputs and side effects, not just mock call counts or implementation-shaped strings.
- **Runtime/project-trust spikes (`spike:*`):** explicit, isolated integration evidence under the [pi integration playbook](pi-integration.md). A mock RPC test is not proof that the installed pi process behaves the same way.
- **Manual host acceptance (F5):** actual extension lifecycle and Webview interactions, including applicable keyboard, focus, theme and failure behavior. HTML/CSP assertions and scripted UI tests are useful but do not establish real host rendering or interaction correctness.

Keep Node test harnesses separate from Webview runtime code: testing a host-side HTML builder does not permit Node or pi access inside the Webview. Preserve host/adapter/UI ownership; cross-layer behavior tests do not authorize production dependency changes.

Do not use real user state, secrets, uncontrolled network calls or paid model APIs in automated tests. A paid-call exception requires explicit maintainer authorization under [Contributing](../../../CONTRIBUTING.md). Own temporary directories, listeners and child processes through cleanup on success and failure; avoid shared predictable paths and timing sleeps as synchronization. Do not copy pi session-storage internals into test infrastructure.

## Agent completion checklist

- State which changed behavior is covered, by which files and commands. Explain when no new behavioral test is warranted (for example, a documentation-only change).
- Report executed, skipped and unverified checks separately. Identify missing prerequisites and outstanding F5 acceptance; mocks, spikes and manual checks are not interchangeable.
- Use the current repository commands: relevant `npm test`, `npm run compile`, `npm run lint`; documentation changes require `npm run docs:verify`, and collaboration close/maintenance rules require `npm run docs:health` when applicable. Check their actual scope; successful commands do not prove that an uncollected test ran.
- Update this guide and its translation alongside approved changes to test layout or collection. Keep transient results in the existing handoff, not in this policy. Passing tests neither accept a product requirement nor close an architecture gate.

## Adoption scope

The maintainer approved playbook plus load-map adoption on 2026-09-21. This adopts ownership, explicit collection and evidence separation from [DeepSeek Harness testing policy](https://github.com/Hex4C59/deepseek-harness/blob/master/docs/testing.md), not its monorepo layout, runner, paid-API policy, session snapshot infrastructure or per-file 100% coverage gate. Existing test locations, filenames and commands remain unchanged by this documentation adoption.
