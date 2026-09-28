# ADR 0003: React and TypeScript Webview frontend

English | [中文](0003-react-webview.zh.md)

- Type: ADR
- Status: Accepted
- Created: 2026-09-22
- Decision approval: 2026-09-22, React/TypeScript and integrated Vite design
- Build approval: 2026-09-22, WI-015 T015-01–06; [ACTIVE](../../ACTIVE.md) is the current scope and acceptance source
- Verification and acceptance: 2026-09-27 UTC, agent evaluation under the explicit task-specific decision/acceptance delegation; actual evidence below
- Related gates: [gate-webview-trust and gate-session-streaming](../reference/architecture-gates.md), remain Open
- Work item: WI-015 T015-01–06 accepted; [closure](../archive/2026-09-27-wi-015-react-acceptance.md)

> Subsequent disposition,2026-09-28: references below to Open gates retain this slice’s original decision date. [ADR0004](0004-trust-and-lifecycle.md) separately accepts the three broad boundaries; acceptance is not inferred from this ADR.

## Context

The inline Webview script combines several independently changing UI responsibilities and lacks TypeScript checking inside its host-generated string. The maintainer prioritizes long-term component composition and state maintenance. [The investigation](../archive/2026-09-22-webview-framework.md) records repository evidence and official sources; [ACTIVE](../../ACTIVE.md) owns current scope and approval.

## Decision and approval

Use React and TypeScript as the frontend direction. The maintainer confirmed a compact IDE-native visual refresh, preserving functional behavior, and browser development preview with fast refresh. WI-014 was paused while WI-015 carried the migration. On 2026-09-22, Build was approved for all six bounded WI-015 slices, T015-01–06. ACTIVE remains the source of current scope, evidence and acceptance; this approval does not accept the ADR or close any gate.

Keep the Webview presentation-only, host-owned authoritative state and current validated message semantics. Framework state holds presentation state and host projections; it does not independently implement task, approval or attachment policy. Native file picking and other VS Code capabilities remain host operations. These boundaries follow the existing architecture rather than creating a new runtime integration strategy.

The maintainer subsequently confirmed the integrated design: Vite frontend build/development preview, retained host esbuild, ordinary CSS/theme tokens, node:test with jsdom, preserved host/protocol semantics and separate browser/development-host/installed-package evidence. The React/Vite path is integrated in the implementation. The explicit current delegation permits agent acceptance based on evidence; the evaluation below does not claim personal maintainer inspection.

## Rationale and alternatives

React components and typed boundaries fit the confirmed maintenance goal. A dedicated browser build removes the untyped string problem independently of framework selection. Native TypeScript modules would be a smaller runtime change but retain manual DOM composition; Vue, Preact and Lit remain technically possible alternatives discussed before the choice. No benchmark establishes React as faster or smaller, and fewer total lines are not promised.

## Consequences and remaining design

The migration path uses browser assets and CSP/resource loading, component/state separation, frontend typechecking and lint coverage, deterministic UI tests, and development preview fixtures. Production and preview share the application; the preview substitutes only the host boundary with nonsecret synthetic states and never invokes pi or privileged host capabilities. Production loads packaged local assets, independent of a development server.

Visual requirements belong to the PRD; current scope, verification and acceptance are recorded in ACTIVE. Browser preview is not proof of VS Code theme, lifecycle or installed-package behavior. Retain stable identity through streaming, preserve focus/expansion/scroll and draft revision behavior, clean up listeners, and reject stale host/view completions under the existing contract.

## Acceptance conditions and current evidence

On September 27, 2026 UTC, the agent completed evaluation under the explicit delegation and accepts this ADR. Original conditions are satisfied individually, not replaced by document checks or historical passes:

- Compile/lint and 456 standard tests pass, covering real client/host/adapter behavior. The production dependency graph excludes preview/tests; existing host contracts still own CSP and message allowlists.
- WI-019 formal Q16, three themes/two languages, narrow columns/actual 1100×620 short windows, keyboard/focus, model/thinking, attachments, approval/review and session flows have separate native-F5 and fresh-installed-package evidence in the [WI-019 archive](../archive/2026-09-27-wi-019-formal-chat.md). Browser screenshots do not substitute for hosts.
- dist/delegated-completion-20260928/host-chat-installed/installed-lifecycle-report.json: native Developer Reload Webviews during streaming recreates presentation while retaining the host-acknowledged newer draft and active Stop authority. Identity-checked owned RPC termination then leaves a selectable readonly draft and blocked send. Explicit full Reload Window recovers to a fresh successful task. formal-runtime-loss.png was inspected. Native F5 loss/full reload is separately recorded in host-chat-lifecycle/f5-report.json. Renderer reload is not claimed as host onDidDispose; automated disposal/stale-view assertions complement that semantic boundary.
- Local JS/CSS/SVG presence, nonempty content and hash binding pass. The Vite root-URL defect was fixed and the Pi mark reverified in actual hosts. Nine installed artifacts match the current compiled tree. Production needs no preview server.

Actual versions in this run: React/React DOM 19.3.0, Vite 7.3.1, plugin-react 5.1.1, TypeScript 5.9.3, pi 0.86.1; build Node 24.12.0. JS is 371241 bytes (gzip 114818), CSS 39254 (7642), SVG 290 (185), recorded in wi015-bundle-measurements.json; these are not performance-superiority benchmarks. Official Windows VS Code 1.105.1 native F5 and 1.139.1 installed VSIX are separately tested. The declared minimum engine does not establish testing on every version or compatible fork.

Acceptance establishes only the React/TypeScript/Vite frontend choice and migration. It changes no host authority, public pi boundary, secret policy, tool authorization or session storage. gate-webview-trust and gate-session-streaming remain Open for their complete questions; the full Draft PRD is not accepted.
