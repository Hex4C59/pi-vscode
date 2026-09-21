# Webview messages (WI-002 / WI-006)

English | [中文](webview-messages.zh.md)

- Type: Reference
- Status: Outline
- Created: 2026-09-19
- Contract ID: `contract-webview-messages`
- Owner: extension host (`src/extension/`); UI sender in `src/webview/`
- Gate: `gate-webview-trust` (Open)

> Connectivity, workspace choice and a host-owned pi RPC subprocess (WI-007). No chat, secrets, pi SDK in the webview, filesystem access or generic host operations are exposed. Both trust gates remain open.

## Envelope and allowlist

Plain objects only, numeric `version: 1`, exactly the listed own fields. The host validates `unknown` before acting. Unknown types/versions, extra fields, malformed values and stale generations cannot execute actions.

- Webview → host `ping`: `{ version: 1, type: "ping" }`; replies with `{ version: 1, type: "pong" }`.
- Webview → host `getWorkspaceState`: `{ version: 1, type: "getWorkspaceState" }`; synchronizes the current host projection.
- Webview → host `openFolder` / `manageTrust`: `{ version: 1, type: "openFolder" | "manageTrust", generation: number }`.
- Webview → host `chooseResources`: `{ version: 1, type: "chooseResources", generation: number, choice: "allow" | "decline" }`.
- Host → webview `workspaceState`: `{ version: 1, type: "workspaceState", generation, status, folder, choice, busy, error, runtime, runtimeDetail }`. Generation is a nonnegative safe integer. Status is `no-folder`, `multi-root`, `remote`, `non-file`, `untrusted` or `eligible`. Folder is null or `{ name, path }` for a single folder. Choice is null, `allow` or `decline`; busy is boolean; error is null or a fixed, bounded user-facing retry message (never raw exception text). `runtime` is `not-started`, `starting`, `ready`, `stopping` or `error`; `runtimeDetail` is null or a bounded host-owned diagnostic when `runtime` is `error` (never raw exception dumps).

Rejected malformed messages receive no response. Stale or ineligible valid actions only resynchronize state. Ping has no business side effects. No action accepts a path, command, trust boolean or runtime request from the webview.

## Trust and lifecycle

- `PiChatViewProvider` owns the in-memory workspace identity, monotonic generation, choice and subscriptions. It observes folder changes and trust grants; every action re-reads actual workspace folders, `workspace.isTrusted` and `env.remoteName`. Remote hosts are blocked even with file URIs. Multi-root and non-file workspaces are blocked. Only a trusted single local file folder permits a choice.
- Workspace changes or eligibility changes reset choice and advance generation; repeated reads and view rebuilds retain choice. Extension-host reload resets everything. VS Code trust revocation reloads the window; the host also detects trust loss on every request. No settings, trust files, secrets or webview storage are used.
- `openFolder` is allowed only in an empty local window (`no-folder`). It opens a native single-folder picker, then rechecks generation and eligibility before calling public `workspace.updateWorkspaceFolders(0, 0, { uri: selected })` with the native file URI. Cancellation leaves state unchanged; a false return or exception shows a bounded retry / File > Open Folder recovery hint. A true return keeps the action busy until authoritative workspace change or host restart, preventing repeated updates; it is only request acceptance: the UI never fabricates a folder or successful state. Adding the first folder can restart the extension host without a folder-change event; the new provider constructor reads authoritative workspace state and starts with no resource choice. `manageTrust` is allowed only for an otherwise supported untrusted folder and invokes only `workbench.trust.manage`; it never grants trust itself.
- The editor-title navigation icon and Command Palette command `pi-vscode.focusChat` reveal the existing Pi container, then focus `pi-vscode.chat`; they do not toggle visibility or create another panel. The default remains `secondarySidebar`. The editor-title entry uses separate light/dark Pi SVGs; the Command Palette remains available when no editor title is shown.
- Native actions are serialized per active view. Pending work is invalidated on workspace change, view replacement/disposal or provider disposal. Results are checked again before subsequent commands or state updates. Failures show a fixed retry hint; cancel is not an error. Post failures are handled without leaking exception data; reopening the view resynchronizes.
- Allow/decline is editable and memory-only until workspace identity or eligibility changes. After a choice in an eligible workspace, the extension host starts pi in RPC mode with public `--approve` or `--no-approve` for that run only; changing choice restarts runtime. Allow warns of project extension/package execution; decline still permits AGENTS.md context and user/global resources per upstream docs. Neither is a sandbox or tool authorization. Chat and streaming are not exposed; the webview never imports pi or spawns processes.
- View listeners are disposed on replacement/disposal; workspace listeners on provider disposal. Each page gets a fresh script nonce and restrictive CSP. Names and paths arrive only in state messages and are rendered with `textContent`, never interpolated into HTML. Native buttons have clear text labels, keyboard activation and visible focus; state/errors use live regions.
- This is not full chat trust verification or gate closure. Native dialogs, trust/reload behavior, remote hosts and keyboard/screen-reader behavior still require F5 verification in supported VS Code builds/forks.
