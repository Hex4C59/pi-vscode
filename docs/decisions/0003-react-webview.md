# ADR 0003: React and TypeScript Webview frontend

English | [中文](0003-react-webview.zh.md)

- Type: ADR
- Status: Draft
- Created: 2026-09-22
- Decision approval: 2026-09-22, React/TypeScript and integrated Vite design
- Build approval: 2026-09-22, WI-015 T015-01–06; [ACTIVE](../../ACTIVE.md) is the current scope and acceptance source
- Verification: executable migration checks recorded in ACTIVE; maintainer experience/ADR acceptance remains pending
- Related gates: [gate-webview-trust and gate-session-streaming](../reference/architecture-gates.md), remain Open
- Work item: WI-015 T015-01–06 implementation verified, pending acceptance; ACTIVE owns the subsequently resumed WI-014

## Context

The inline Webview script combines several independently changing UI responsibilities and lacks TypeScript checking inside its host-generated string. The maintainer prioritizes long-term component composition and state maintenance. [The investigation](../discussions/2026-09-22-webview-framework.md) records repository evidence and official sources; [ACTIVE](../../ACTIVE.md) owns current scope and approval.

## Decision and approval

Use React and TypeScript as the frontend direction. The maintainer confirmed a compact IDE-native visual refresh, preserving functional behavior, and browser development preview with fast refresh. WI-014 was paused while WI-015 carried the migration. On 2026-09-22, Build was approved for all six bounded WI-015 slices, T015-01–06. ACTIVE remains the source of current scope, evidence and acceptance; this approval does not accept the ADR or close any gate.

Keep the Webview presentation-only, host-owned authoritative state and current validated message semantics. Framework state holds presentation state and host projections; it does not independently implement task, approval or attachment policy. Native file picking and other VS Code capabilities remain host operations. These boundaries follow the existing architecture rather than creating a new runtime integration strategy.

The maintainer subsequently confirmed the integrated design: Vite frontend build/development preview, retained host esbuild, ordinary CSS/theme tokens, node:test with jsdom, preserved host/protocol semantics and separate browser/development-host/installed-package evidence. The React/Vite path is integrated in the implementation. Current verification evidence and pending acceptance are recorded in ACTIVE; this ADR makes no claim that application, host or package checks have passed.

## Rationale and alternatives

React components and typed boundaries fit the confirmed maintenance goal. A dedicated browser build removes the untyped string problem independently of framework selection. Native TypeScript modules would be a smaller runtime change but retain manual DOM composition; Vue, Preact and Lit remain technically possible alternatives discussed before the choice. No benchmark establishes React as faster or smaller, and fewer total lines are not promised.

## Consequences and remaining design

The migration path uses browser assets and CSP/resource loading, component/state separation, frontend typechecking and lint coverage, deterministic UI tests, and development preview fixtures. Production and preview share the application; the preview substitutes only the host boundary with nonsecret synthetic states and never invokes pi or privileged host capabilities. Production loads packaged local assets, independent of a development server.

Visual requirements belong to the PRD; current scope, verification and acceptance are recorded in ACTIVE. Browser preview is not proof of VS Code theme, lifecycle or installed-package behavior. Retain stable identity through streaming, preserve focus/expansion/scroll and draft revision behavior, clean up listeners, and reject stale host/view completions under the existing contract.

## Acceptance conditions

Remain Draft until implementation checks cover the existing behavior matrix, production assets are verified in the package, and Windows VS Code development-host and installed-VSIX evidence cover the changed UI, theme/keyboard, recreation and streaming behavior. Record dependency/runtime compatibility, frontend bundle measurements and missing evidence explicitly. Current verification and acceptance remain pending; this ADR records no passing claim for application tests, builds, packages or real-host verification. Documentation checks cannot accept the ADR or close broader gates.
