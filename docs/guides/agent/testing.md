# Testing agent playbook

English | [中文](testing.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-21
- Authority: project-local test organization, naming, collection and verification evidence

## When to load

Read this playbook before changing behavior, fixing a regression, adding or moving tests, or changing test collection/build configuration. Inspect the affected implementation, existing tests and current `package.json` scripts first. This guide owns test-file policy; [TypeScript](typescript.md) owns language/tooling rules and [pi integration](pi-integration.md) owns runtime isolation. It does not authorize a framework migration or broaden the current task.

## Ownership and file placement

- Keep application tests in their owner's `tests/` directory: `src/extension/tests/**/*.spec.ts`, `src/adapter/tests/**/*.spec.ts` or `src/webview/tests/**/*.spec.ts`. Production source stays in place; for example, `src/extension/webviewMessages.ts` is covered by `src/extension/tests/webview-messages.spec.ts`. Do not introduce `src/__tests__/` or a repository-wide catch-all `test/` directory.
- Keep Node script tests beside their scripts as `scripts/**/*.spec.mjs`.
- Use kebab-case module or observable-behavior names. A test file may cover a coherent behavior across multiple modules; a one-to-one source/test mapping is not mandatory.
- Put reusable setup in ordinary files such as `harness.ts` or `<subject>.test-support.ts`, not in another collected `*.spec.ts` file. Importing a test can register and run its cases again.
- Keep fixture inputs and expected outputs with the owning tests (for example, an owner-local `fixtures/` or `expected/` directory when needed). Create no empty infrastructure directories. Review expected-output changes against intended behavior; do not regenerate them merely to make a test pass.
- `dist/tests/` is generated output, not the source of tests. Do not hand-edit it or treat stale bundles as evidence that current source ran.

Scripts are grouped by purpose: `scripts/docs/` owns documentation checks and their helpers/configuration; `scripts/testing/` owns the test runner and collection helpers; `scripts/spikes/` owns integration probes and project-trust helpers; `scripts/packaging/` owns VSIX verification. Keep `*.spec.mjs` beside the scripts they cover. These purpose folders do not introduce nested `src/` or `tests/` subdirectories; application tests retain the owner-local layout above.

## Naming and collection are one contract

The current automated runner is `node:test`, not Vitest. Use `*.spec.ts` for application tests and `*.spec.mjs` for scripts. The suffix has meaning only together with the runner's actual collection rules; renaming a file alone does not create a test tier.

`npm test` invokes `scripts/testing/run-tests.mjs`, backed by the import-safe `scripts/testing/test-runner-lib.mjs`. It recursively discovers and sorts the exact application and script inventories from the owner-local paths above, skips symbolic links and directories named `fixtures` or `expected`, and fails if either inventory is empty. Helpers and other test-tier suffixes are not entries.

The runner cleans only `dist/tests/`, preserving other bundles under `dist/`, then uses esbuild to bundle application specs while preserving their source-relative directories: `src/extension/tests/webview-messages.spec.ts` becomes `dist/tests/extension/tests/webview-messages.spec.js`. It passes only the exact compiled-output list and discovered script specs to `node:test`, with the repository root as cwd; stale bundles and broad output globs are not execution inputs. Build and test-process failures fail the command.

Read type/lint scope from repository configuration; script `.mjs` files currently remain outside lint. The [workflow](../../../.github/workflows/ci.yml) defines actual CI checks; the local runner does not imply full CI collection.

Before adding, moving or renaming a test:

1. Identify its owner and evidence tier.
2. Check that the source file is included in build, typecheck/lint as applicable, and test collection.
3. If collection needs changing, include the necessary scoped runner/configuration change in the approved task; otherwise report the missing collection as a blocker, not completed coverage.
4. Execute the relevant command and verify that the new case actually ran. Ensure removed or renamed tests cannot continue running from stale generated output.

Keep future test moves and renames scoped, updating collection and verification together. The suffix vocabulary below does not authorize additional tiers or a switch to Vitest.

## Test suffixes and new tiers

Directories express ownership, suffixes express evidence type, and the runner determines execution. **Only ordinary `.spec` files are currently collected.** Consult the other rows when proposing a new tier; they authorize neither empty directories nor new suites.

| Suffix | Meaning and activation boundary |
|--------|---------------------------------|
| `*.spec.ts` / `*.spec.mjs` | Module behavior or controlled multi-module composition, collected by `npm test`. Mock-provider and VM Webview tests belong here; specs are not limited to single functions and do not require Vitest. |
| `*.e2e.ts` | A declared real entry with observable outcomes; name the real entry and substituted services. RPC evidence does not prove VS Code UI, and e2e does not imply paid calls. Use `.e2e.ts`, not `.e2e.test.ts`, when introduced. Proposed `test:e2e` does not exist; collection must be separate from default specs. |
| `*.expected.e2e.ts` | Assembled process/CLI behavior compared with reviewed owner-local output, without session replay; `*.expected.json` is data. This also matches `.e2e.ts`, so a separate suite must be excluded from general e2e collection. Golden assertions alone do not make a spec e2e. |
| `*.snapshot.ts` | Reserved for recorded-session replay, not all snapshot assertions or screenshots. Enabling requires a separate design for public APIs, recording/replay, secret handling and fixture review; do not copy pi storage internals or an external session corpus. |
| `*.bench.ts` / `*.perf.ts` | Reserved respectively for performance budgets with failure thresholds and non-gating diagnostics; declare workload, environment and measurements. Neither is enabled or part of default behavior tests. |

Optional `.host.spec.ts` / `.client.spec.ts` / `.compat.spec.ts` qualifiers identify a tested side or compatibility subject and remain ordinary specs; `.bench.client.ts` / `.perf.client.ts` only qualify performance subjects. Qualifiers do not provide Node, DOM or browser environments. Share setup through ordinary helpers, not imported test entries.

### Completion criteria for a new tier

1. The same approved change includes a representative case, real runner command and explicit inclusion/exclusion rules, with this guide updated. Future commands remain labeled unavailable.
2. Prerequisites cover dependencies, artifacts, real entry, credential policy, timeouts and cleanup. Paid calls still require explicit authorization.
3. Verify recursive discovery, helper exclusion, overlapping suffixes, stale outputs and failure exit codes; the intended case must actually run without duplicate registration.
4. Report passed, failed, skipped and unavailable evidence separately. Missing prerequisites fail or explicitly skip according to the lane's declared policy; an all-skipped suite is not passed acceptance.

## Evidence tiers and safety

- **Automated tests (`npm test`):** repeatable, keyless behavior and regression checks. Prefer real deterministic implementations; substitute narrow external seams such as VS Code APIs, processes, clocks and RPC. Test relevant malformed input, errors, cancellation, late completion, generation changes and resource cleanup. Assert observable outputs and side effects, not just mock call counts or implementation-shaped strings.
- **Runtime/project-trust spikes (`spike:*`):** explicit, isolated integration evidence under the [pi integration playbook](pi-integration.md). A mock RPC test is not proof that the installed pi process behaves the same way.
- **Manual host acceptance (F5):** actual extension lifecycle and Webview interactions, including applicable keyboard, focus, theme and failure behavior. HTML/CSP assertions and scripted UI tests are useful but do not establish real host rendering or interaction correctness.

Keep Node test harnesses separate from Webview runtime code: testing a host-side HTML builder does not permit Node or pi access inside the Webview. Preserve host/adapter/UI ownership; cross-layer behavior tests do not authorize production dependency changes.

Do not use real user state, secrets, uncontrolled network calls or paid model APIs in automated tests. A paid-call exception requires explicit maintainer authorization under [Contributing](../../../CONTRIBUTING.md). Own temporary directories, listeners and child processes through cleanup on success and failure; avoid shared predictable paths and timing sleeps as synchronization. Do not copy pi session-storage internals into test infrastructure.

## Agent completion checklist

- State which changed behavior is covered, by which files and commands. Explain when no new behavioral test is warranted (for example, a documentation-only change).
- Report executed, skipped and unverified checks separately. Identify missing prerequisites and outstanding F5 acceptance; mocks, spikes and manual checks are not interchangeable.
- Select applicable commands from [Contributing](../../../CONTRIBUTING.md) and inspect actual collection; successful commands do not prove an uncollected test ran.
- Update this guide and its translation alongside approved changes to test layout or collection. Keep transient results in the existing handoff, not in this policy. Passing tests neither accept a product requirement nor close an architecture gate.

## Adoption scope

The maintainer approved playbook plus load-map adoption on 2026-09-21. This adopts ownership, explicit collection and evidence separation from [DeepSeek Harness testing policy](https://github.com/Hex4C59/deepseek-harness/blob/master/docs/testing.md), not its monorepo layout, runner, paid-API policy, session snapshot infrastructure or per-file 100% coverage gate.

Historical note: the initial documentation-only adoption retained adjacent `*.test.ts` files, `*.test.mjs` script files and the flat extension-only collection command. The subsequent approved WI-011 migration implements the owner-local `.spec` layout and recursive runner described above, retaining `node:test` and esbuild. It does not enable additional evidence tiers.
