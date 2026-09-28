# WI-015 — React/Vite migration acceptance

English | [中文](2026-09-27-wi-015-react-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-27
- Authority: scoped closed-WI history; [ACTIVE](../../ACTIVE.md) owns current work

## Approved scope and acceptance

The agent completed evaluation under the explicit delegation, closes the already approved WI-015 T015-01–06, and accepts [ADR 0003](../decisions/0003-react-webview.md) on September 27, 2026 UTC. This is not personal maintainer inspection. Retain implemented React/TypeScript/Vite, host esbuild and public client/bridge rather than repeating migration. Formal presentation follows WI-019; business/security policies are unchanged. Prior Q16/formal-integration material is archived; the initial framework investigation becomes non-authoritative history.

## Actual evidence

Evidence root: dist/delegated-completion-20260928/. Reuse [WI-019 verification](2026-09-27-wi-019-formal-chat.md) from the same run/current source and package, not a prior historical pass: 456 standard tests, compile/lint, nine installed artifact hashes, local JS/CSS/SVG package assets, separate native F5/installed three-theme/two-language/keyboard/short-window and core behavior checks. Additional host-chat-installed/installed-lifecycle-report.json and lifecycle.log fully pass: actual Developer Reload Webviews during streaming recreates the renderer while retaining acknowledged draft/Stop authority; identity-checked owned RPC termination retains a selectable readonly draft and blocks Send; explicit Reload Window recovers to a successful fresh task. The failure screenshot was inspected. Native F5 loss/reload is a separate real run. Renderer reload is not represented as host onDidDispose; applicable deterministic lifecycle tests supply that semantic evidence.

wi015-bundle-measurements.json records current build Node, dependencies and raw/gzip JS/CSS/SVG byte counts, listed in the ADR. No framework performance superiority is claimed. The resource-URL defect is fixed and displayed in real hosts without a preview-server dependency. Documentation checks and targeted process audits are recorded in ACTIVE; mechanical checks do not themselves accept the ADR.

## Retained limits and resources

Only the frontend choice/migration is accepted. The full Draft PRD, WI-013, other WIs and broad gates do not close with it. Official Windows 1.105.1 F5 and 1.139.1 installed evidence does not establish every declared version/fork. Renderer recreation is distinct from host disposal; memory drafts are not persistent. Accepted ADR/architecture/PRD and ACTIVE own current authority; this record grants no new implementation scope.

Retain WI-019-owned evidence, failure records, isolated profiles, packages and external fixed F5 tool. Stop services and clean only when later WIs no longer need them and unique evidence is preserved. No extra user-environment installation, commit or push.
