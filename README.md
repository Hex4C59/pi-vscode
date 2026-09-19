# pi VS Code

English | [中文](README.zh.md)

VS Code extension for the [pi](https://github.com/earendil-works/pi) coding agent: **chat in the sidebar while you code**. Default layout keeps **Explorer on the left** and opens Pi in the **Secondary Side Bar (right)** when supported—similar to Copilot Chat and Codex.

This project is **open source** ([MIT](LICENSE)). It is maintained independently of Earendil Works; **pi** is a separate upstream product.

## Current status

| Shipped | Not yet |
|---------|---------|
| F5-debuggable extension shell | End-user chat or streaming UI |
| Secondary sidebar placeholder webview | VS Code Marketplace / Open VSX release |
| Runtime RPC spike (`npm run spike:runtime`) | Model picker, session list |

See [CHANGELOG.md](CHANGELOG.md) and Accepted ADR [`0001-build-baseline`](docs/decisions/0001-build-baseline.md).

## Install (from source)

There is **no published VSIX yet**. To run locally:

```bash
git clone https://github.com/Hex4C59/pi-vscode.git
cd pi-vscode
npm install
npm run compile
```

Open this folder in VS Code and press **F5** (Run Extension). Open the **Pi** view in the **Secondary Side Bar** when your build supports `secondarySidebar`.

Requires **Node.js 22+** and **VS Code 1.85+** (`engines.vscode` in `package.json`).

## Development

```bash
npm install
npm run compile
npm run spike:runtime   # pi RPC get_state probe (no LLM)
```

## Checks

```bash
npm run lint
npm run compile
npm run docs:verify
```

## Documentation

- Current work: [`ACTIVE.md`](ACTIVE.md)
- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Security: [`SECURITY.md`](SECURITY.md)
- Agents: [`AGENTS.md`](AGENTS.md)
- Architecture: [`docs/architecture/vscode-extension-architecture.md`](docs/architecture/vscode-extension-architecture.md)
- Index: [`docs/README.md`](docs/README.md)

## Layout (product default)

```text localized
[ Primary sidebar: Explorer ]  [ Editor area: your files ]
                                 [ Secondary sidebar: Pi chat webview ]
```

On hosts without `secondarySidebar`, the same webview view may appear in the primary sidebar until the user drags it right (document per release notes).

## License

[MIT](LICENSE) — Copyright (c) 2026 Hex4C59
