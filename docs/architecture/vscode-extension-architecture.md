# pi VS Code system architecture

English | [中文](vscode-extension-architecture.zh.md)

- Type: Architecture
- Status: Proposed
- Created: 2026-09-19
- Authority: structure, boundaries, and owners (not implemented features)
- Related gates: [`../reference/architecture-gates.md`](../reference/architecture-gates.md)
- Sibling reference: [`pi-desktop`](https://github.com/earendil-works/pi-desktop) (Electron presentation layer; same pi integration principles, different host)
- Upstream: [pi](https://github.com/earendil-works/pi) coding-agent runtime (read-only sibling checkout `../pi` during development)

> Proposed architecture. Do not describe capabilities as shipped until spikes and Accepted ADRs close the related gates.

## 1. Context

**pi VS Code** is a VS Code extension that presents [pi](https://github.com/earendil-works/pi) as a **sidebar chat companion** while the user edits code—similar in placement to GitHub Copilot Chat and OpenAI Codex: **Explorer stays on the primary (left) sidebar**; pi chat lives in a **Webview View**, preferring the **Secondary Side Bar** (right) when the host supports it.

The extension is a **presentation and orchestration layer**. It does not reimplement pi’s agent loop, providers, tools, compaction, or session file semantics.

## 2. Layer model

| Layer | Responsibility | Owner (this repo) |
|-------|----------------|-------------------|
| **UI (Webview)** | Chat layout, streaming display, local UI state only | `src/webview/` (planned) |
| **Extension host** | Activation, commands, configuration, `SecretStorage`, workspace trust policy, webview lifecycle, validated `postMessage` bridge | `src/extension/` (planned) |
| **Adapter** | pi SDK or RPC subprocess → internal domain events consumed by host + webview | `src/adapter/` (planned) |
| **Runtime (upstream)** | Models, tools, sessions, project resources | pi packages / subprocess |

The diagram shows the target boundaries; edge labels distinguish the current scaffold from later work. WI-001 selected subprocess RPC for the runtime probe, not end-user chat.

```mermaid
flowchart TD
    U["User"] --> W["UI: sidebar Webview<br/>src/webview/"]
    W <-->|"postMessage: planned for WI-002"| H["Extension host<br/>src/extension/"]
    H <-->|"Chat integration: not yet connected"| A["Adapter<br/>src/adapter/"]
    A <-->|"Subprocess RPC: WI-001 probe only"| P["Upstream pi runtime<br/>npm dependency, outside this repo's src/"]
    E["Extension entry point<br/>src/extension.ts"] -->|"Registers view and command"| H
```

## 3. UI placement (product default)

| Surface | Role | Default |
|---------|------|---------|
| **Primary sidebar** | Explorer, SCM, etc. | Unchanged (user keeps file tree on the left) |
| **Secondary Side Bar** | pi chat **Webview View** | **Preferred** default dock (VS Code `viewsContainers.secondarySidebar`) |
| **Primary sidebar fallback** | Same webview view container | When Secondary Side Bar API or host fork does not support aux bar |
| **Editor-area panel** | Full-tab chat | **Parking lot** (optional later; not MVP default) |

Commands (planned): open/focus pi sidebar; on older VS Code, document drag-to-right workflow.

## 4. Trust boundaries

- **Secrets** (API keys, tokens): extension host only (`SecretStorage` / env policy). **Never** pass to webview HTML/JS or webview `localStorage`.
- **Webview**: no `require`, no direct pi SDK, no filesystem or shell. Only structured messages defined in `docs/reference/` (outline before WI-002+).
- **Workspace access**: host reads/writes files per user action and VS Code workspace trust; webview requests capabilities via messages, host validates.
- **Sessions**: do not read/write pi session files for product session features unless an Accepted ADR explicitly allows; prefer SDK/RPC session APIs.
- **Honesty**: do not describe the webview or extension host as a security sandbox against untrusted code; pi retains tool and shell capabilities per upstream design.

## 5. Main flows (target)

1. **Open**: user opens pi view in secondary sidebar → host creates/retains `WebviewView` → webview loads bundled script with strict CSP.
2. **Chat (later WIs)**: webview sends user input message → host → adapter → pi runtime stream → host forwards sanitized events to webview.
3. **Shutdown**: deactivate extension / dispose webview → adapter stops runtime / child process with timeout; no zombie subprocess (WI-001 spike proves clean exit).

## 6. Open decisions (gates)

See [`../reference/architecture-gates.md`](../reference/architecture-gates.md):

- `gate-extension-host-baseline` — build, F5, package
- `gate-sidebar-chat-shell` — secondary-sidebar webview placeholder
- `gate-webview-trust` — message schema, CSP, secret isolation (before real chat)
- `gate-runtime-host` — pi in-process SDK vs subprocess RPC
