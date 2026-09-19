# Architecture gates

English | [中文](architecture-gates.zh.md)

- Type: Reference
- Status: Living
- Created: 2026-09-19
- Last reviewed: 2026-09-19 (ADR 0001)
- Authority: which architectural risks require spike + Accepted ADR before treated as delivered
- Related: [`../architecture/vscode-extension-architecture.md`](../architecture/vscode-extension-architecture.md), [`ACTIVE.md`](../../ACTIVE.md)

Status values: `Open` | `In spike` | `Accepted`

| Gate ID | Topic | Status | ADR | ACTIVE |
|---------|-------|--------|-----|--------|
| `gate-extension-host-baseline` | Extension activates, F5 debug, `vsce package` (or equivalent) succeeds | `Accepted` | [0001](../decisions/0001-build-baseline.md) | — |
| `gate-sidebar-chat-shell` | Webview View in Secondary Side Bar (fallback: primary sidebar); placeholder UI only | `Accepted` | [0001](../decisions/0001-build-baseline.md) | — |
| `gate-runtime-host` | pi SDK or subprocess: start, one RPC round-trip, clean exit | `Accepted` | [0001](../decisions/0001-build-baseline.md) | — |
| `gate-webview-trust` | Versioned `postMessage` contract, CSP, no secrets in webview | `Open` | — | — |
| `gate-project-trust` | Map workspace folder open to pi project trust (public API only) | `Open` | — | — |
| `gate-session-streaming` | End-user chat streaming over webview bridge | `Open` | — | — |

Closing a gate requires an **Accepted** ADR linked in the ADR column. See [`../decisions/README.md`](../decisions/README.md).

**WI-001:** Closed by Accepted ADR [0001-build-baseline](../decisions/0001-build-baseline.md) (2026-09-19). End-user chat remains gated by `gate-session-streaming`.
