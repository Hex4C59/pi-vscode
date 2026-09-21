# TypeScript / Node agent playbook

English | [中文](typescript.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Authority: conventions when the product uses TypeScript on Node (CLI, extension host, Electron main, services)

Applies to this repository’s TypeScript, Node scripts and tooling. Portable rules originate in the engineering-template TypeScript/Node pack; project details follow below.

## When to load and what to inspect

Load when editing application `.ts` / `.tsx`, Node scripts, dependencies, or TypeScript/build/lint/test configuration. Read the affected code and tests, `package.json`, lockfile, `tsconfig`, lint and bundler configuration first. Use the repository's package manager, commands and module conventions; do not migrate tooling as incidental cleanup. Apply only the sections relevant to the change.

For new public APIs, cross-layer dependencies or persistence, also use the product's architecture-governance checklist. This playbook supplements repository rules; it does not approve architectural changes.

## Types and runtime validation

- Keep strict checking enabled. Use explicit input/output types at public boundaries, infer local variables where clear, and model meaningful states with discriminated unions rather than unrelated flags and optional fields.
- Treat external JSON, messages, configuration and caught errors as `unknown` until narrowed. Type assertions, generics and interfaces do not validate runtime data. Validate required fields, allowed values and protocol versions at the receiving boundary before side effects; apply the contract's unknown-field policy.
- Prefer narrowing to `any`, non-null assertions or double casts. When an assertion is necessary for a library boundary or established invariant, keep it local and explain the evidence. Do not weaken compiler/lint settings to hide an error; document narrowly scoped suppressions and their reason.
- Keep absence, empty values and failure distinct when the domain distinguishes them. Handle all variants of a closed union so a new state cannot silently fall through.

## Modules and dependency boundaries

- Check `package.json` module mode, compiler module resolution, bundler output and the actual deployment runtime together. Preserve required import extensions and existing ESM/CJS conventions; do not assume a successful bundle proves runtime compatibility.
- Prefer `import type` for type-only dependencies and `node:` for Node built-ins. Keep Node-only modules and privileged SDKs out of browser/UI bundles unless the product architecture explicitly permits them; type sharing must not pull in runtime code.
- Put shared contracts at their documented owner, not in ad-hoc duplicate declarations. Do not add a shared directory, barrel exports, wrappers or interfaces without a concrete consumer or boundary need.
- Before adding a dependency, check existing capabilities, runtime support, bundle impact and install-time behavior. Update the manifest and lockfile with the repository's package manager. Record trust-boundary or integration changes in architecture/ADR as required; avoid private package internals and undeclared local links.

## Async work and resource ownership

- Await or return promises. Background work needs an explicit owner and rejection handler; `void` alone does not handle rejection. Event callbacks must route failures to the owning error path.
- Give listeners, subscriptions, timers, streams and child processes a cleanup owner. Release them on success, failure, cancellation and disposal, including partial initialization; use `finally` or the framework's disposal mechanism. Make cleanup safe when called more than once.
- For operations that can hang, use the existing timeout/cancellation mechanism. A timeout or `Promise.race` does not stop the underlying work: cancel it or prevent late results from changing current state. Recheck identity or generation after `await` when workspace/session/view state may have changed.
- Bound buffers and pending work for potentially unbounded streams. Respect stream backpressure; do not repeatedly append unlimited process output to memory. Avoid synchronous expensive I/O on interactive host paths.

## Errors and side effects

- Follow existing error conventions. Preserve useful cause/context internally, distinguish cancellation from failure, and give callers a recoverable outcome where required. Do not swallow errors, return fake success or retry non-idempotent actions blindly.
- Keep diagnostics free of secrets and sensitive payloads; sanitize and bound captured output before logging or presenting it. Do not expose raw exception dumps to a lower-trust UI.
- Validate inputs and permissions before filesystem/process effects. Use structured arguments rather than interpolating untrusted text into shell commands. Keep path/URI handling consistent with supported platforms and the product's trust model.

## Verification and reporting

- Run the repository's relevant lint, typecheck/build and test commands. A transpiler/bundler is not a typecheck; inspect what scripts actually cover. Reuse a combined command instead of repeating equivalent checks, and report missing checks honestly rather than inventing scripts.
- Add or update behavior-focused tests for changed logic and regressions. Cover relevant malformed input, failure/cancellation, late completion and cleanup paths; do not add tests solely to mirror implementation or for copy-only changes.
- Test through narrow seams for time, processes, filesystem or host APIs where needed. Avoid real credentials, user state, paid calls and uncontrolled network dependencies. Use temporary fixtures and clean them up.
- Distinguish unit tests, real integration checks and manual host acceptance. Mocks do not prove host lifecycle or deployment compatibility. Report commands run, outcomes, untested paths and material limits; passing checks alone does not close a product gate.

## Keeping this playbook useful

When a task reveals a recurring TypeScript/Node failure mode, an approved tooling change or a reusable verification lesson, update the relevant rule and its translation during handoff. Keep project-specific paths and commands in a product section; keep this pack portable. Update the template pack only when the task authorizes template changes. Do not append per-task logs, duplicate architecture rules or broaden implementation scope just to fill this guide.

## pi VS Code application

- Read `tsconfig.json`, `eslint.config.mjs`, `esbuild.mjs` and `package.json` for current settings. At this revision, TypeScript uses strict checking and Node16 module resolution; esbuild emits CommonJS host bundles targeting Node 22, with `vscode` external. Keep existing `.js` relative imports in TypeScript. These settings do not prove compatibility with every supported VS Code host; validate the actual host when runtime features change.
- `src/extension/` owns VS Code capabilities; `src/adapter/` owns runtime integration; `src/webview/` supplies presentation. See the [primary architecture](../../architecture/vscode-extension-architecture.md) and [pi integration](pi-integration.md) before changing boundaries. A host-side HTML builder does not grant scripts running in the webview access to Node or pi SDKs.
- Keep inbound webview validation in the host and align changes with [webview messages](../../reference/webview-messages.md). Preserve workspace-generation checks for asynchronous actions. Do not move secrets into HTML or messages, create a generic command bridge, or expand project-resource permissions through a type cast.
- Use `npm run compile` (esbuild plus `tsc --noEmit`), `npm run lint`, and `npm test` for relevant code changes. `npm run typecheck` provides the typecheck alone when needed; compile already includes it. Lint currently covers `src`, not `scripts`; review and test changed Node scripts explicitly. Run `npm run docs:verify` for documentation changes and `npm run docs:health` when required by the collaboration workflow.
- Run runtime/project-trust spikes only for the relevant integration scope, following its isolation rules. For host/UI behavior changes, report required F5 checks separately from automated tests. Keep generated `dist/` output out of source edits.
