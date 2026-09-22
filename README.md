# pi VS Code

English | [中文](README.zh.md)

VS Code extension for the [pi](https://github.com/earendil-works/pi) coding agent: chat in the sidebar while you code. Explorer stays on the left; Pi prefers the Secondary Side Bar on the right.

This independently maintained project is open source under [MIT](LICENSE). pi is a separate upstream product.

## Current status

The development build implements workspace/resource choices, text streaming, model/thinking selection, thinking/tool cards, execution approvals and Stop. These are scoped development capabilities, with acceptance and outstanding work recorded in [`ACTIVE.md`](ACTIVE.md).

- WI-010 closed after four maintainer F5 checks. Installed-VSIX activation and the remaining approval/lifecycle matrix are still unverified.
- WI-008/WI-009 have confirmed idle and next-turn selection main paths; their final closure remains pending.
- Editor attachments, post-edit review and session-history UI remain proposed work. The [PRD](docs/product-requirements.md) is Draft and three [architecture gates](docs/reference/architecture-gates.md) remain Open.

There is no release acceptance recorded for Marketplace or Open VSX. The validation VSIX documented in the [history](docs/archive/2026-09-21-closed-wi-history.md) is an extracted-package check, not an installed-package acceptance result.

## Run from source

Use the Node and VS Code engine ranges declared in [`package.json`](package.json), then:

```bash
git clone https://github.com/Hex4C59/pi-vscode.git
cd pi-vscode
npm ci
npm run compile
```

Open the repository in a local VS Code window and press **F5** (Run Extension). In the Extension Development Host, run **pi: Focus Chat** from the Command Palette or use the Pi editor-title icon.

Open one trusted local folder and choose whether to allow project-local pi resources. The host starts pi and displays readiness or a bounded error. Chat reuses your existing pi provider configuration and credentials; a live provider request may incur its normal charges. No-folder, multi-root, remote and untrusted workspaces cannot start the runtime.

The controlled profile asks before covered actions, with an automatic allowance for canonical in-workspace regular-file reads. Resource consent is separate from tool approval. Stop requests cancellation; it does not undo completed changes. The extension is not a sandbox. See the [approved execution slice](docs/product-requirements.md#req-006--execution-approval-strategies) for the precise limits.

## Development and verification

Follow [Contributing](CONTRIBUTING.md) for checks matched to the change. Integration probes require the [pi integration playbook](docs/guides/agent/pi-integration.md); they are separate from the default automated tests.

## Documentation

- Current work and acceptance: [`ACTIVE.md`](ACTIVE.md)
- Contributors and agents: [`CONTRIBUTING.md`](CONTRIBUTING.md), [`AGENTS.md`](AGENTS.md)
- Security reporting: [`SECURITY.md`](SECURITY.md)
- Task routes: [documentation index](docs/README.md)
- Change history: [`CHANGELOG.md`](CHANGELOG.md)

## Sidebar compatibility

The manifest contributes the Pi Webview View to `secondarySidebar`. Host/fork support needs its own verification; the declared engine range alone does not prove placement. The fallback direction is to use the same view in the primary sidebar and move it right where supported. This is not a verified automatic fallback on every host.

## License

[MIT](LICENSE) — Copyright (c) 2026 Hex4C59
