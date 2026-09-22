# Webview messages (workspace, chat, model settings and controlled execution)

English | [中文](webview-messages.zh.md)

- Type: Reference
- Status: Outline
- Created: 2026-09-19
- Contract ID: `contract-webview-messages`
- Owner: extension host (`src/extension/`); UI sender in `src/webview/`
- Gate: `gate-webview-trust` (Open)

> Connectivity, workspace choice, a host-owned pi RPC subprocess (WI-007), plain-text chat (WI-004), model/thinking settings (WI-008/WI-009) and controlled execution (WI-010). No secrets, pi SDK in the webview, filesystem access or generic host operations are exposed. Trust and session-streaming gates remain open.

## Envelope and allowlist

Plain objects only, numeric `version: 1`, exactly the listed own fields. The host validates `unknown` before acting. Unknown types/versions, extra fields, malformed values and stale generations cannot execute actions.

- Webview → host `ping`: `{ version: 1, type: "ping" }`; replies with `{ version: 1, type: "pong" }`.
- Webview → host `getWorkspaceState`: `{ version: 1, type: "getWorkspaceState" }`; synchronizes the current host projection.
- Webview → host `openFolder` / `manageTrust`: `{ version: 1, type: "openFolder" | "manageTrust", generation: number }`.
- Webview → host `chooseResources`: `{ version: 1, type: "chooseResources", generation: number, choice: "allow" | "decline" }`.
- Webview → host `sendChat` (WI-004): `{ version: 1, type: "sendChat", generation: number, text: string }`. `text` must be non-empty after trim and at most `8000` characters. Allowed only when `runtime === "ready"`, generation matches, workspace actions are not `busy`, `modelBusy` is false, and no chat turn is in flight.
- Webview → host `setThinkingLevel` (WI-008): `{ version: 1, type: "setThinkingLevel", generation: number, level: string }`. `level` must match the host-projected allowlist (`thinkingLevels`) and a bounded token shape. Allowed only when `runtime === "ready"`, generation matches, workspace actions are not `busy`, and `modelBusy` is false. `chatBusy` does not prohibit selection: while streaming, record next-turn intent without mutating the running model/thinking settings.
- Webview → host `setChatModel` (WI-008): `{ version: 1, type: "setChatModel", generation: number, provider: string, modelId: string }`. `provider` and `modelId` must match a bounded token shape and an entry in the host-projected `availableModels` list. Same eligibility as `setThinkingLevel`.

Rejected malformed messages receive no response. Stale or ineligible valid actions only resynchronize state. Ping has no business side effects. No action accepts a path, command, trust boolean or runtime request from the webview.

## Host state projection

The host sends `version: 1, type: "workspaceState"`. [`WorkspaceStateMessage`](../../src/extension/webviewMessages.ts) owns the complete field/type declaration; this table defines semantic groups. The UI renders this projection instead of inventing authoritative state.

| Fields | Meaning and limits |
|--------|--------------------|
| `generation`, `status`, `folder` | Nonnegative safe-integer generation; status is `no-folder`, `multi-root`, `remote`, `non-file`, `untrusted` or `eligible`. Folder is `{ name, path }` for one folder or null. |
| `choice`, `busy`, `error` | Choice is null/`allow`/`decline`; busy tracks unfinished workspace actions; error is null or a fixed bounded recovery message, without raw exceptions. |
| `runtime`, `runtimeDetail` | Phase is `not-started`/`starting`/`ready`/`stopping`/`error`; failure detail is a bounded host diagnostic or null, without raw exception dumps. |
| `messages`, `chatBusy`, `chatError` | Ordered host-owned `{ role: "user" \| "assistant", text, id? }` entries, with optional correlation id. Busy starts at submission and lasts until settlement/failure. Chat errors are bounded, without raw stderr or credentials. |
| `chatModel`, `thinkingLevel`, `thinkingLevels`, `availableModels` | Applied model label/level can be null; capability lists are bounded, with at most 64 `{ provider, modelId, label }` model entries. |
| `pendingModel`, `pendingThinkingLevel` | Null or a pending catalog entry/valid level; host-memory intent is distinct from applied values. |
| `modelBusy`, `modelError` | Catalog loading, serialized application and recovery block sends and further selections; failure text is bounded or null. |
| `activities`, `approvals`, `grants`, `execution`, `controlledExecution` | Execution projections defined below; `controlledExecution: true` identifies the profile, not readiness or gate acceptance. |

## Controlled execution contract

Execution actions use the envelope rules above and these inbound shapes:

- `stopChat`: `{ version: 1, type: "stopChat", generation: number }`; only an active chat not already stopping is acted on.
- `decideApproval`: `{ version: 1, type: "decideApproval", generation: number, id: string, decision: "once" | "session" | "deny" }`.
- `revokeGrant`: `{ version: 1, type: "revokeGrant", generation: number, id: string }`.

IDs must be nonempty and at most 100 characters. Existing exact-own-field validation, active-view, generation and workspace-busy checks apply. IDs select host-owned pending requests/grants, never a webview-supplied command or path. Unknown/expired decisions cannot revive a removed request. `session` creates a grant only when a non-null reliable scope exists; absent scope provides no reusable authorization and UI must offer Allow once only.

Execution projection fields:

- `activities`: at most 64 host-owned `ActivityItem` entries: `{ id, kind: "thinking" | "tool", messageId, contentIndex?, toolCallId?, tool?, text, input?, status, truncated }`. Status is `thinking`, `preparing`, `executing`, `complete`, `failed` or `interrupted`. Thinking correlates by message/content index; tools by tool-call ID. Text and displayed input are bounded to 16,384 characters per item (bounded aggregate by item count). Text or input overflow sets `truncated`, retained across tool updates. The 64-entry cap reserves a stable `activity-overflow` notice: additional activity is omitted from display, not execution/approval checks. The UI renders truncation notices and incremental stable-ID details, preserving expansion/focus/scroll. `tool_execution_start` projects `preparing`, not side-effect confirmation. `partialResult` replaces cumulative output. `message_end` reconciles final text/thinking; no synthetic thinking when absent.
- `approvals`: at most 8 `{ id, toolCallId, tool, input, scope: string | null, expiresAt }` cards. `input` is the full JSON argument snapshot, at most 32,768 characters; oversized or credential-like inputs are denied before projection. Default host/gate timeout is 120 seconds. Denial, expiry, cancellation and late replies never confer approval.
- `grants`: at most 64 `{ id, scope }` entries. Existing regular-file scope encodes `[tool, canonicalPath]`; shell scope encodes `[tool, canonicalCwd, completeInput]`. Scope equality is exact; no implicit directory/command-prefix grants. Nonexistent/unresolvable targets have null scope. Inspect/revoke affects subsequent calls, not past effects.
- `execution`: `idle`, `waiting`, `thinking`, `awaiting-approval`, `executing`, `replying`, `stopping` or `failed`; a presentation state, not evidence of sandboxing. `controlledExecution` describes the selected profile, not proof of runtime readiness or gate closure.

`toolApproval.ts` auto-allows only canonical in-workspace regular-file `read`. Search/list still ask, as do edits/writes, shell and external paths; unknown tools fail closed. Windows ambiguous paths are not auto-authorized; realpath checks cover symlink/junction escapes but cannot prevent check/use races. Same-live-session grants survive view recreation, ordinary settlement and successful Stop; workspace/eligibility change, runtime replacement/disconnect and provider disposal cancel requests and clear grants.

Host cancels pending approvals before `abortTask`; adapter cancels outstanding dialog waits, sends `clear_queue` then `abort` with bounded waits. Success requires settlement; failure or lack of settlement shuts down runtime and reports failure. Host keeps `stopping` through cancellation and delays pending settings application until it completes. Runtime loss marks unfinished activity interrupted; no automatic task replay. Stop does not undo side effects or guarantee cancellation of every descendant process.

The adapter accepts only the bundled gate's product envelope `protocol: "pi-vscode-approval", version: 1`, with runtime/cwd matching the current subprocess and `kind: "hello"` via notify before readiness. Calls carry `request`, `toolCallId`, `tool`, `input`; the bundled asynchronous `tool_call` handler waits via public `ctx.ui.confirm` and checks the full argument snapshot again after confirmation. RPC dialog IDs correlate `extension_ui_response`; title text is not authority. This is not a generic `approve_tool_call` RPC. The controlled tool allowlist is `read,write,edit,bash,powershell,grep,find,ls` with `--no-extensions -e <bundled gate>`; third-party extension discovery is disabled for either project-resource choice. Missing bundle blocks startup; missing hello/readiness terminates it, with no usable no-tools fallback promised. The offline load-failure fixture separately uses `--no-tools`.

Forward only bounded presentation fields, never raw RPC objects/stderr, signatures or credential stores. Pattern filtering is best-effort and cannot guarantee arbitrary thinking/tool output is secret-free. [Architecture §7](../architecture/vscode-extension-architecture.md) owns process permissions and environment controls; verification records are linked under Evidence boundaries below.

## Deferred model/thinking settings (WI-008 / WI-009)

- Idle valid selections apply immediately. During `chatBusy`, selection only overwrites its own pending field (latest model and latest thinking independently win); no settings RPC runs during the active session-level run. The combined chip always shows applied values; a separate status shows `Next turn (pending)` / `Applying next turn`, including when the popover is closed.
- On the current runtime session's `agent_settled`, `applyPendingSettings` sets `modelBusy` before releasing the UI to send, applies `set_model` first, accepts its refreshed state/catalog/capabilities, and revalidates the pending thinking level before `set_thinking_level`. Unsupported or unapplied thinking produces a bounded error, not a silent clamp or fallback. The model may already have changed; this is not an atomic rollback transaction.
- Failure triggers one projection readback, not mutation retry. If readback fails, applied model/level and available levels are cleared instead of showing guessed success. Pending fields and `modelBusy` clear when the current application finishes; model errors remain visible outside the popover. Prompt rejection clears pending intent.
- Workspace identity/eligibility changes, runtime restart (including resource-choice changes), and provider disposal invalidate pending work. Generation, runtime session and catalog token prevent late completion from updating a replacement runtime. View replacement preserves host-owned pending/in-flight settings and resynchronizes the new view; old-view actions are rejected.
- Session completion uses `agent_settled`: no remaining automatic retry, compaction retry or queued continuation. `turn_end` or low-level `agent_end` is insufficient. Use the [pi integration guide](../guides/agent/pi-integration.md) for current-version and upgrade evidence; historical WI-004 observations apply only to their recorded version.

## Trust and lifecycle

- `PiChatViewProvider` owns the in-memory workspace identity, monotonic generation, choice and subscriptions. It observes folder changes and trust grants; every action re-reads actual workspace folders, `workspace.isTrusted` and `env.remoteName`. Remote hosts are blocked even with file URIs. Multi-root and non-file workspaces are blocked. Only a trusted single local file folder permits a choice.
- Workspace changes or eligibility changes reset choice and advance generation; repeated reads and view rebuilds retain choice. Extension-host reload resets everything. VS Code trust revocation reloads the window; the host also detects trust loss on every request. No settings, trust files, secrets or webview storage are used.
- `openFolder` is allowed only in an empty local window (`no-folder`). It opens a native single-folder picker, then rechecks generation and eligibility before calling public `workspace.updateWorkspaceFolders(0, 0, { uri: selected })` with the native file URI. Cancellation leaves state unchanged; a false return or exception shows a bounded retry / File > Open Folder recovery hint. A true return keeps the action busy until authoritative workspace change or host restart, preventing repeated updates; it is only request acceptance: the UI never fabricates a folder or successful state. Adding the first folder can restart the extension host without a folder-change event; the new provider constructor reads authoritative workspace state and starts with no resource choice. `manageTrust` is allowed only for an otherwise supported untrusted folder and invokes only `workbench.trust.manage`; it never grants trust itself.
- The editor-title navigation icon and Command Palette command `pi-vscode.focusChat` reveal the existing Pi container, then focus `pi-vscode.chat`; they do not toggle visibility or create another panel. The default remains `secondarySidebar`. The editor-title entry uses separate light/dark Pi SVGs; the Command Palette remains available when no editor title is shown.
- Native actions are serialized per active view. Pending work is invalidated on workspace change, view replacement/disposal or provider disposal. Results are checked again before subsequent commands or state updates. Failures show a fixed retry hint; cancel is not an error. Post failures are handled without leaking exception data; reopening the view resynchronizes.
- Allow/decline is editable and memory-only until workspace identity or eligibility changes. After a choice in an eligible workspace, the extension host starts pi in RPC mode with public `--approve` or `--no-approve` for that run only; changing choice restarts runtime. WI-010 replaces historical `--no-tools` startup with the controlled allowlist and exclusively bundled gate described above. Either choice disables third-party extension discovery; resource consent does not override it. Decline can still permit AGENTS.md context and other user/global resources per upstream docs. Neither is a sandbox or tool authorization.
- WI-004 chat: when `runtime === "ready"`, the host may send a bounded `prompt` over RPC and project `text_delta` events into `messages` until session-level `agent_settled`. The webview never imports pi, spawns processes, or sends arbitrary RPC. Transcript is memory-only; workspace identity/eligibility changes, runtime stop/restart or provider disposal clear `messages` and reject stale `sendChat` and late RPC events for prior runtime sessions.
- View listeners are disposed on replacement/disposal; workspace listeners on provider disposal. Each page gets a fresh script nonce and restrictive CSP. Names and paths arrive only in state messages and are rendered with `textContent`, never interpolated into HTML. Native buttons have clear text labels, keyboard activation and visible focus; state/errors use live regions.

## Evidence boundaries

[WI-010 closure](../archive/2026-09-21-closed-wi-history.md#wi-010) owns the four development F5 checks and historical automated/integration/extracted-package results. The WI-008/WI-009 deferred-selection main path was confirmed at 19:44 on 2026-09-21; [ACTIVE](../../ACTIVE.md) owns its current handoff. That confirmation does not establish independent manual coverage of approval/Stop interleavings, recovery or the full grant/lifecycle/accessibility matrix.

Check existing F5 records for the particular native-dialog, trust/reload and host/fork scope being claimed; uncovered scenarios and installed-VSIX behavior require independent verification. The contract remains Outline and the three gates remain Open.
