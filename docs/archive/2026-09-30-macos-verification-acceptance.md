# macOS verification and personal-use acceptance (2026-09-30)

English | [中文](2026-09-30-macos-verification-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Agent-delegated close of the remaining macOS verification and acceptance items under the maintainer `/goal` to finish them all
- Authority: historical evidence for WI-058 dual-window F5/installed, WI-036 window-crash F5/installed, ADR 0005 live OAuth/endpoint/VSIX, and personal-use PRD acceptance; not public release, Windows, Cursor, skip-approvals, extra OS, or a gate change
- Acceptance identity: agent under that `/goal`; not a claim that the maintainer personally ran these hosts

## Scope this record closes

| Item | Result |
|---|---|
| WI-058 dual-window macOS F5 + isolated installed VSIX on one folder | Two `recovery-v1/windows/<uuid>/` domains, two owned `pi` children, two extension-host owner PIDs |
| WI-036 window-crash F5 + isolated installed VSIX | SIGKILL of one window's `node.mojom.NodeService` owner; victim `child-exited` receipt; sibling stayed `owned` with `endRequested: false` |
| ADR 0005 live endpoint + live OAuth interaction + new installed VSIX | Custom `live-loopback` written without `apiKey`; one `/chat/completions` returned `live-endpoint-ok`; GitHub Copilot Sign in showed native device code and opened a browser |
| Whole Draft PRD as personal-use macOS installed VSIX | Accepted with standing non-goals unchanged |

Windows real-host F5/VSIX stay out of scope. No Git commit or push. Automated `compile` / `lint` / `npm test` were **not rerun** in this verification session; native evidence below is the new fact.

## Shared package and host

- macOS 27.0.0 arm64, VS Code 1.139.1 (`/Applications/Visual Studio Code.app`)
- Isolated VSIX `dist/macos-acceptance-20260930/pi-vscode.vsix` (gitignored runner artifact): 149 922 470 bytes, SHA-256 `9ea45ac170e86036324b87490d7d3036612a484a54a90a1ddae1911278121271`
- `verify-vsix` PASS: 15 535 entries, pinned pi **0.86.1**
- Isolated `--user-data-dir` under `/private/tmp/pi-acc-*`; `PI_CODING_AGENT_DIR` in that tree; `--use-inmemory-secretstorage`

F5 used the parent workbench **F5** key (CDP + osascript) against a generated `launch.json` **Run Extension** configuration, producing `[Extension Development Host] A`. It was not a CLI `--extensionDevelopmentPath` substitute for the first window.

## WI-058 / WI-036 native runs

Same-profile two windows. Recovery fences live under `User/globalStorage/pi-vscode-dev.pi-vscode/recovery-v1/windows/`. The second window often titled **Untitled (Workspace)** after Duplicate Workspace or native Open folder (VS Code reused folder A instead of retitling a second `A` window). Both windows still admitted independent domains and `pi` children.

| Phase | Owned root | Dual domains | Crash |
|---|---|---|---|
| Installed (first pass) | `/private/tmp/pi-acc-e6iQve` | window ids `460840cd-…` / `e477fefc-…`; owners 14329 / 14490 | victim child gone; sibling alive; receipt `child-exited` code 143 |
| Installed (runner reorder confirm) | `/private/tmp/pi-acc-02BBf7` | `ok: true`, `victimGone: true`, `siblingAlive: true` | same assertions |
| F5 | `/private/tmp/pi-acc-csw5Bn` | window ids `d58963cb-…` / `fa1ad5be-…`; owners 18651 / 18625 | victim child gone; sibling alive; receipt `child-exited` code 143 |

Local JSON snapshots from those runs: `dist/macos-acceptance-20260930/{installed,f5}-{dual,crash}.json` (gitignored).

## ADR 0005 native run

Owned root `/private/tmp/pi-acc-ywKbpR` (installed VSIX, isolated `auth-user`).

**Live custom endpoint.** Settings Add endpoint committed `live-loopback` with `api: "openai-completions"`, `baseUrl: http://127.0.0.1:<port>/v1`, model id `offline-fixture`, **no `apiKey` in `models.json`**. After project-resource decline and a real send, the loopback server recorded **one** `/chat/completions` request and the chat body contained `live-endpoint-ok`.

**Live browser sign-in.** Settings Providers → GitHub Copilot → Sign in. Native prompt: GitHub Enterprise URL/domain (blank for github.com). After Enter, VS Code showed **Sign-in code: C649-184F** and `browserOpened: true`. Isolated `auth.json` keys stayed empty: GitHub account completion in that throwaway profile was not finished. Tokens, codes and authorization URLs were not placed in the Webview. This records the live host OAuth interaction required by the ADR, not a stored Copilot session in the isolated profile.

## Personal-use PRD

Accepted as the 2026-09-22 personal target on **macOS local VS Code**, including dual-window recovery, owner-loss exact-child cleanup, custom endpoint write + live call, and the live OAuth device-code/browser path. Standing non-goals remain excluded: extra extension ecosystems, Chat Participant, remote/multi-root, extra OS, skip-approvals, public release, images/PDF/tables/syntax highlighting, history rollback, framework replacement.

## Limits

- Second-window titles were often Untitled (Workspace), not a second title `A`; folder identity was still the isolated workspace `A` / duplicated roots, not two unrelated folders.
- F5 second window used the parent profile's installed VSIX so an Untitled window could activate Pi; the first window remained Extension Development Host.
- Device-code GitHub Copilot login was not driven through to a populated `auth.json`.
- No Windows host. No gate closed. No commit.
