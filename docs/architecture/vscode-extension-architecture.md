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
| **UI (Webview)** | Chat layout, streaming display, local UI state only | `src/webview/` |
| **Extension host** | Activation, commands, configuration, `SecretStorage`, workspace trust policy, webview lifecycle, validated `postMessage` bridge | `src/extension/` |
| **Adapter** | pi SDK or RPC subprocess → internal domain events consumed by host + webview | `src/adapter/` |
| **Runtime (upstream)** | Models, tools, sessions, project resources | pi packages / subprocess |

The diagram shows the target boundaries; edge labels distinguish the current scaffold from later work. WI-001 selected subprocess RPC for the runtime probe, not end-user chat.

<!-- docs-i18n: localized-mermaid -->
```mermaid
flowchart TD
    U["User"] --> W["UI: sidebar Webview<br/>src/webview/"]
    W <-->|"postMessage: WI-002 ping; WI-006 workspace"| H["Extension host<br/>src/extension/"]
    H <-->|"Chat and controlled execution: WI-010 closed"| A["Adapter<br/>src/adapter/"]
    A <-->|"Subprocess RPC: WI-007 lifecycle"| P["Upstream pi runtime<br/>npm dependency, outside this repo's src/"]
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

## 7. Controlled execution ownership (WI-010 closed, 2026-09-21)

- **Host policy:** `src/extension/toolApproval.ts` owns pending approval cards and session grants. Only canonical in-workspace regular-file `read` auto-allows. Search/list ask; nonexistent/unresolvable targets are once-only. Existing file grants bind tool + canonical path; shell grants bind tool + canonical cwd + complete input. No persistent grants or Unrestricted mode. Canonicalization is not protection against all check/use races.
- **Execution boundary:** `src/adapter/approvalGate.ts` is bundled as `dist/approval-gate.mjs` (build and package declarations include it). Its public asynchronous `tool_call` hook waits on `ctx.ui.confirm`; product protocol v1 binds runtime/cwd, request/tool-call IDs and complete input. `src/adapter/pi-rpc-runtime.ts` owns dialog replies and validates hello/readiness. There is no generic approval RPC or title-based authority. Missing bundle refuses startup; failed hello/get_state stops startup, not a usable no-tools fallback.
- **Exclusive profile:** CLI uses `--tools read,write,edit,bash,powershell,grep,find,ls --no-extensions -e <bundled gate>` with the existing resource flag. Third-party extension discovery is disabled even when resources are approved. Other context/resource categories are not thereby all excluded. The bundled extension runs as user code; this is not a sandbox and cannot promise complete shell/network containment.
- **Projection and lifecycle:** `runtimeLifecycle.ts` defines activity/final-message/runtime-error events and narrow `abortTask` / approval-handler injection. `activityProjection.ts` correlates actual thinking by message/content index and tools by tool-call ID, replaces cumulative outputs, and bounds display fields. `PiChatViewProvider` owns projected timeline, execution state and approval lifetime. Stop cancels pending approvals before adapter `clear_queue` + `abort`; no settlement/failure causes runtime shutdown and explicit error. Successful Stop retains same-live-session grants; replacement/disconnect clears them. Deferred settings wait for settlement and completion of stopping. No side-effect rollback or automatic task retry.
- **Contract/security:** [contract-webview-messages](../reference/webview-messages.md) records exact inbound actions and bounded DTOs. No generic commands or raw runtime/stderr forwarding; credential-pattern filtering is best-effort, not complete secret removal from arbitrary outputs. Incremental UI, per-item and reserved aggregate overflow notices, stable expansion/focus/scroll, full approval input, grant revocation and draft-preserving Stop are implemented and covered by UI tests. Four development F5 checks were confirmed by the maintainer: thinking/state, read/tool cards, denied write without side effects then allowed writes, and Stop during a long harmless command. The scoped WI is closed; installed-VSIX and exhaustive manual matrix acceptance are not implied.

**Evidence and maturity:** offline `scripts/spike-approval.mjs` targets installed `0.86.1`, using isolated fixture provider/configuration without real provider credentials. Two write calls test allow/deny, timeout plus late replies, Stop and load failure; load-failure fixture uses `--no-tools`, separately from production startup rejection. The extra fixture extension is test-only, not product third-party loading. Reported checks pass 73 tests, compile/lint and all nine real approval fixtures, now including PowerShell running Stop and discovered/settings/package extension exclusion markers. `controlledEnvironment.ts` overrides inherited values with `PI_OFFLINE=1`, `PI_TELEMETRY=0`, retaining trusted user provider configuration and credential commands, which are outside tool-gate coverage. Offline is a startup-network/package-install restriction, not inference/network isolation: `scripts/spike-offline-inference.mjs` uses `--offline` with a missing package and actual loopback HTTP inference; environment override is separately unit-tested. Dependencies-inclusive `dist/pi-vscode-validation.vsix` (139.71 MB, 14,080 entries) passed `scripts/verify-vsix.mjs`: extracted pinned CLI, production dependencies and gate hello/get_state independently of repository paths, using a no-tools probe. These are prior reported checks, not reruns at documentation closure. Installed-VSIX activation/runtime validation, exhaustive external-provider and grant/lifecycle/security validation remain gaps; the four development F5 observations above are separate closure evidence. WI-008/WI-009 deferred-selection F5, including approval/Stop ordering, remains pending. Architecture remains Proposed/Direction; `gate-project-trust`, `gate-webview-trust`, `gate-session-streaming` stay Open and the boundary ADR remains pending in ACTIVE.

## 8. Implementation snapshot (WI-008 / WI-009 Build; not gate closure)

The sidebar Webview uses a **chat-first redesign**: compact header with runtime status dot, card-style setup empty states, right-aligned user message pills, and a bottom rounded composer card containing a **single combined model · thinking chip**, anchored popover and icon send button. The popover has a collapsible model list and thick discrete thinking slider: fixed `#168BFF` fill/thumb, no yellow outline, blue keyboard-focus halo; other styling uses theme tokens.

The approved next-turn-only extension is behavioral, not merely presentation: `PiChatViewProvider` owns `pendingModel` / `pendingThinkingLevel`, independently replacing the latest intent while `chatBusy` without changing applied settings. Idle choices apply immediately. After the current session's `agent_settled`, `applyPendingSettings` serializes model mutation, refreshed capabilities and validated thinking mutation under `modelBusy`; sends and selections are blocked during application. Failures read back actual state without mutation retry, report bounded errors and clear pending intent. Generation/session/catalog tokens reject obsolete completions; host-owned intent survives view recreation but not workspace/eligibility change, runtime replacement or provider disposal. The Webview only renders applied versus pending state and sends the existing allowlisted commands; the adapter maps public RPC. See [message contract](../reference/webview-messages.md).

Current manifest and installed pi are `0.86.1`; its public `docs/rpc.md` defines `agent_settled` as no remaining automatic retry, compaction retry or queued continuation. `turn_end` / low-level `agent_end` are not this completion boundary. WI-004's `0.85.1` evidence remains historical. WI-008/WI-009 themselves retained bounded plain text, host-owned in-memory transcript and `--no-tools`; deferred selection alone did not add Stop. WI-010 now supersedes that startup profile with controlled execution in §7.

Maintainer F5 accepted idle model/thinking changes followed by streaming, folding/Esc/keyboard/light theme and no-folder/untrusted/resource setup. New deferred selection still awaits F5; WI-008/WI-009 remain open. Earlier bridge/workspace/runtime slices remain in place; trust and session-streaming gates stay Open per [`architecture-gates.md`](../reference/architecture-gates.md).
