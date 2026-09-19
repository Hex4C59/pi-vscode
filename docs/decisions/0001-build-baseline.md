# ADR 0001: Build and extension baseline (WI-001)

English | [中文](0001-build-baseline.zh.md)

- Type: Decision
- Status: Accepted
- Created: 2026-09-19
- Accepted: 2026-09-19
- Gates: `gate-extension-host-baseline`, `gate-sidebar-chat-shell`, `gate-runtime-host`
- Supersedes: none
- Related: [vscode-extension-architecture](../architecture/vscode-extension-architecture.md), [WI-001](../../ACTIVE.md), [wi-001-runtime-spike](../discussions/wi-001-runtime-spike.md)

## Context

WI-001 required a **F5-debuggable VS Code extension** with pi chat in the **Secondary Side Bar** as **placeholder UI only**, plus evidence that the upstream pi runtime can start, complete one RPC round-trip, and exit cleanly—**not** end-user chat.

The maintainer accepted F5 visual check and the runtime spike on **2026-09-19**.

## Decision

1. **Extension host baseline**: TypeScript strict (`tsc --noEmit`), **esbuild** bundle to `dist/extension.js`; `package.json` `"main"` points at that file; **VS Code engine** `^1.85.0`; quality via `npm run compile`, `npm run lint`, `npm run docs:verify`. F5 launch via `.vscode/launch.json` + default build task.
2. **Sidebar chat shell**: Register `WebviewViewProvider` on `viewsContainers.secondarySidebar` (`pi-vscode` container, view `pi-vscode.chat`); placeholder HTML with strict CSP, **no scripts**, **no secrets**, **no pi SDK in webview**; `enableScripts: false` for WI-001.
3. **Runtime host (spike / future adapter)**: For WI-001 proof and initial adapter direction, use **subprocess RPC**—spawn `@earendil-works/pi-coding-agent` `dist/bundle/cli.js` with `--mode rpc --no-session`, one **`get_state`** command over LF-only JSONL, then **SIGTERM** within timeout (see `src/adapter/pi-rpc-probe.ts`, `npm run spike:runtime`). Do **not** embed pi’s agent loop in the extension host.
4. **Pinned dependency**: **`@earendil-works/pi-coding-agent@0.85.1`** (npm registry; no undeclared `file:` link to `../pi` in production builds).
5. **Source layout**: `src/extension/`, `src/webview/`, `src/adapter/` per architecture doc; spike script entry `src/spike-runtime.ts` → `dist/spike-runtime.js`.

## Out of scope (explicit)

Closing these three gates does **not** deliver user chat, streaming UI, session list, model picker, or a versioned webview `postMessage` product protocol. Those remain **`gate-webview-trust`**, **`gate-project-trust`**, and **`gate-session-streaming`** (Open).

## Consequences

- Product features must keep secrets and pi SDK usage in the **extension host** until a future Accepted ADR changes trust boundaries.
- Long-lived pi sessions in the extension are **not** part of this baseline; WI-002+ will add bridge and streaming on top of this scaffold.
- Upgrading `@earendil-works/pi-coding-agent` requires re-running `npm run spike:runtime` and maintainer review before updating the pin in `package.json`.

## Spike evidence

- **Command**: `npm run spike:runtime` → OK (`get_state succeeded; process exited within timeout`).
- **Record**: [wi-001-runtime-spike.md](../discussions/wi-001-runtime-spike.md).
- **Maintainer**: F5 Extension Development Host; Pi view in Secondary Side Bar with placeholder copy only.
