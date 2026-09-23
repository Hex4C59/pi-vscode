# ADR 0001: Build and extension baseline (WI-001)

English | [中文](0001-build-baseline.zh.md)

- Type: Decision
- Status: Accepted
- Created: 2026-09-19
- Accepted: 2026-09-19
- Gates: `gate-extension-host-baseline`, `gate-sidebar-chat-shell`, `gate-runtime-host`
- Supersedes: none
- Related: [vscode-extension-architecture](../architecture/vscode-extension-architecture.md), [archived WI-001 record](../archive/2026-09-21-closed-wi-history.md#wi-001)

## Context

WI-001 required a **F5-debuggable VS Code extension** with pi chat in the **Secondary Side Bar** as **placeholder UI only**, plus evidence that the upstream pi runtime can start, complete one RPC round-trip, and exit cleanly—**not** end-user chat.

The maintainer accepted F5 visual check and the runtime spike on **2026-09-19**.

## Decision

1. **Extension host baseline**: TypeScript strict (`tsc --noEmit`), **esbuild** bundle to `dist/extension.js`; `package.json` `"main"` points at that file; **VS Code engine** `^1.85.0`; quality via `npm run compile`, `npm run lint`, `npm run docs:verify`. F5 launch via `.vscode/launch.json` + default build task.
2. **Sidebar chat shell**: Register `WebviewViewProvider` on `viewsContainers.secondarySidebar` (`pi-vscode` container, view `pi-vscode.chat`); placeholder HTML with strict CSP, **no scripts**, **no secrets**, **no pi SDK in webview**; `enableScripts: false` for WI-001.
3. **Runtime host (spike / future adapter)**: For WI-001 proof and initial adapter direction, use **subprocess RPC**—spawn `@earendil-works/pi-coding-agent` `dist/bundle/cli.js` with `--mode rpc --no-session`, one **`get_state`** command over LF-only JSONL, then **SIGTERM** within timeout (see `src/adapter/runtime/pi-rpc-probe.ts`, `npm run spike:runtime`). Do **not** embed pi’s agent loop in the extension host.
4. **Pinned dependency**: **`@earendil-works/pi-coding-agent@0.85.1`** (npm registry; no undeclared `file:` link to `../pi` in production builds).
5. **Source layout**: `src/extension/`, `src/webview/`, `src/adapter/` per architecture doc; spike script entry originally `src/spike-runtime.ts` → `dist/spike-runtime.js`. On 2026-09-23, the maintainer moved the entry to [`scripts/spikes/spike-runtime.mjs`](../../scripts/spikes/spike-runtime.mjs); esbuild still produces `dist/spike-runtime.js` for `npm run spike:runtime`. The probe implementation and runtime behavior are unchanged.

## Out of scope (explicit)

Closing these three gates does **not** deliver user chat, streaming UI, session list, model picker, or a versioned webview `postMessage` product protocol. Those remain **`gate-webview-trust`**, **`gate-project-trust`**, and **`gate-session-streaming`** (Open).

## Consequences

- Product features must keep secrets and pi SDK usage in the **extension host** until a future Accepted ADR changes trust boundaries.
- Long-lived pi sessions in the extension are **not** part of this baseline; WI-002+ will add bridge and streaming on top of this scaffold.
- Upgrading `@earendil-works/pi-coding-agent` requires re-running `npm run spike:runtime` and maintainer review before updating the pin in `package.json`.

## Spike evidence

Historical WI-001 verification summary, consolidated from the separate spike note on 2026-09-19. This consolidation does not rerun the probe or change the accepted decision.

- **Date and package**: 2026-09-19; `@earendil-works/pi-coding-agent@0.85.1`.
- **Goal**: verify runtime startup, one RPC request/response and shutdown for the baseline.
- **Command and recorded result**: `npm run spike:runtime` → **OK** (`get_state succeeded; process exited within timeout`).
- **Recorded mechanism**: spawn `dist/bundle/cli.js --mode rpc --no-session`, send `get_state` over LF JSONL, then SIGTERM within the recorded 5-second timeout. Source entry points: [runtime probe](../../src/adapter/runtime/pi-rpc-probe.ts) and [JSONL helper](../../src/adapter/runtime/jsonl.ts); current source is not an immutable snapshot of that run.
- **Recorded scope**: no LLM/provider calls. This verifies neither end-user chat, streaming, tool approval, project-resource trust nor long-lived session management.
- **Evidence limits**: the original note retained a success summary, not raw execution logs or exact OS/Node/VS Code versions. Those details are not reconstructed here, and no network-isolation guarantee is inferred.
- **Maintainer acceptance**: F5 Extension Development Host showed the Pi placeholder in the Secondary Side Bar; the maintainer accepted that visual check and the runtime spike on 2026-09-19. Gate closure is recorded by this ADR and the [gate table](../reference/architecture-gates.md).
