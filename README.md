# pi VS Code

English | [中文](README.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Authority: entry point for this product repository

VS Code extension for the [pi](https://github.com/earendil-works/pi) coding agent: **chat in the sidebar while you code**. Default layout keeps **Explorer on the left** and opens pi in the **Secondary Side Bar (right)** when supported—similar to Copilot Chat and Codex.

> **Status:** WI-001 scaffold — F5-debuggable extension with a Secondary Side Bar chat placeholder; runtime RPC probe via `npm run spike:runtime`.

## Documentation

- Current work: [`ACTIVE.md`](ACTIVE.md)
- Agents: [`AGENTS.md`](AGENTS.md)
- Architecture: [`docs/architecture/vscode-extension-architecture.md`](docs/architecture/vscode-extension-architecture.md)
- Index: [`docs/README.md`](docs/README.md)

## Development

```bash
npm install
npm run compile
npm run spike:runtime   # pi RPC get_state probe (no LLM)
```

Press **F5** (Run Extension) to open the Extension Development Host. Open the **pi** view in the **Secondary Side Bar** (right) when your VS Code build supports `secondarySidebar`; otherwise see release notes for moving the view.

## Checks

```bash
npm run lint
npm run compile
npm run docs:verify
```

## Layout (product default)

```text localized
[ Primary sidebar: Explorer ]  [ Editor area: your files ]
                                 [ Secondary sidebar: pi chat webview ]
```

On hosts without `secondarySidebar`, the same webview view may appear in the primary sidebar until the user drags it right (document per release notes).
