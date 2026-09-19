# AGENTS.md

English | [中文](AGENTS.zh.md)

Product overlay for **pi VS Code**. **Universal rules** are in [`AGENTS.kernel.md`](AGENTS.kernel.md) ([中文](AGENTS.kernel.zh.md))—copy that pair from engineering-template and keep it in sync when the kernel upgrades.

Detailed playbooks live under `docs/guides/agent/` (see **Load map**).

## Authority stack

On conflict: (1) `AGENTS.kernel.md` and agent playbooks; (2) `docs/product-requirements.md` when `Accepted`; (3) `docs/architecture/vscode-extension-architecture.md` for structure and owners; (4) `ACTIVE.md`; (5) `docs/discussions/` and `docs/archive/` are context only.

## Project facts

- VS Code extension that presents [pi](https://github.com/earendil-works/pi) in a **sidebar Webview** while the user codes—default **Secondary Side Bar (right)** so the **primary (left) sidebar keeps Explorer** (Copilot / Codex–style layout).
- Initialization phase: do not describe planned features as shipped (see kernel).
- **Target platform:** VS Code 1.85+ (engine TBD in WI-001); compatible forks (Cursor, Windsurf) best-effort; secondary-sidebar contribution requires newer VS Code—document fallback.
- **Sibling repos (read-only unless user requests changes):** upstream [`pi`](https://github.com/earendil-works/pi) at `../pi`; reference client [`pi-desktop`](https://github.com/earendil-works/pi-desktop) for product goals and pi boundaries—not for Electron IPC patterns.
- **Production builds** must not depend on undeclared `file:` / workspace links to `../pi`; pin npm packages from pi releases. Local `../pi` is for spike and reading source only.
- **Upstream behavior** comes from pi package docs and public APIs—do not assume undocumented session file layout or internal modules.

## Non-negotiables (L0) — product security

- **Secrets** stay in the extension host (`SecretStorage`, env as designed). Never embed in webview HTML, webview storage, or `postMessage` to the webview.
- **Webview** is presentation-only: no Node, no pi SDK, no direct `fs`/`child_process`. Host validates all inbound messages; use an allowlisted, versioned protocol before real chat (`gate-webview-trust`).
- **Do not reimplement** pi’s agent loop, provider stack, or compaction in this repo—orchestrate via documented SDK/RPC only (`docs/guides/agent/pi-integration.md`).
- **Session storage:** do not read/write pi session files for product session features unless an Accepted ADR says otherwise; use SDK/RPC session APIs.
- **Sandbox honesty:** the extension is not a security boundary against malicious workspace content; tools and shell remain governed by pi and user trust settings.

Kernel L0 (commits, judgment) still applies from `AGENTS.kernel.md`.

## Layer model (L1 summary)

- **UI:** Sidebar `WebviewView` (secondary sidebar preferred)—chat UI, streaming display, ephemeral UI state.
- **Host:** VS Code extension host—activation, commands, configuration, secrets, workspace policy, webview lifecycle, message bridge.
- **Adapter:** Maps pi SDK or subprocess RPC ↔ internal domain events for host/webview.
- **Runtime:** pi coding-agent (upstream packages or child process).

Product streaming/lifecycle rules: `docs/guides/agent/boundaries.md` when present.

## ACTIVE session pairing

Maintainer may @-mention **`ACTIVE.md` only** (or say 「继续 pi VS Code」). Agent obligations: see `AGENTS.kernel.md` § ACTIVE session pairing; collaboration guide at `docs/guides/agent-collaboration.md`.

## Before you start

Follow `AGENTS.kernel.md` § Before you start, plus this repo’s `package.json` scripts and tests once WI-001 adds them.

## Load map

| If you are… | Read first |
|-------------|------------|
| Starting implementation | `AGENTS.kernel.md`, `ACTIVE.md`, `docs/guides/agent-collaboration.md` |
| TypeScript / tooling | `docs/guides/agent/typescript.md` |
| pi SDK / RPC / spike | `docs/guides/agent/pi-integration.md` |
| Judgment / “what else” / go-no-go | `docs/guides/agent/judgment.md` |
| Architecture / boundaries / new APIs or persistence | `docs/guides/architecture-governance.md`, `docs/architecture/vscode-extension-architecture.md` |
| User-visible behavior | `docs/product-requirements.md`, architecture doc |
| Gates | `docs/reference/architecture-gates.md` |
| Creating commits or commit messages | [`docs/git-commit-convention.md`](docs/git-commit-convention.md) (English messages only) |

Index: `docs/guides/agent/README.md`.

## Task completion

Follow `AGENTS.kernel.md` § Task completion. Product-specific: `npm run docs:verify`; when extension code exists, run `npm run compile` and `npm run lint` (WI-001).

## Upstream pointers

- pi monorepo (read-only local): `../pi`
- Integration playbook: `docs/guides/agent/pi-integration.md`
- Pinned pi package versions: record in Accepted ADR after WI-001 spike (`gate-runtime-host`)
