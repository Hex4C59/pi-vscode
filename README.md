# pi VS Code

English | [中文](README.zh.md)

VS Code extension for the [pi](https://github.com/earendil-works/pi) coding agent: chat in the sidebar while you code. Explorer stays on the left; Pi prefers the Secondary Side Bar on the right.

This independently maintained project is open source under [MIT](LICENSE). pi is a separate upstream product.

## Current status

The extension has a React/TypeScript sidebar for the existing scoped workspace setup, draft/streaming, model/thinking, activity/approval, Stop and bounded mixed attachments (up to 20 items / 1 MiB UTF-8): whole files and fixed editor selections, with explicit confirmation of latest whole-file contents or an old selection snapshot after source changes. The complete REQ-001–REQ-009 product loop is not yet implemented. Current scope, actual verification and remaining acceptance are owned by [`ACTIVE.md`](ACTIVE.md), not this overview.

- Browser, actual F5 and installed-VSIX evidence are recorded separately. Genuine pi with a local synthetic provider is not real-model evidence or maintainer acceptance.
- Live attachment history now has bounded pagination and on-demand complete previews; no whole-PRD, architecture-gate or release acceptance follows from the existing paths.
- WI-010 closed after four maintainer F5 checks. Isolated installed-VSIX activation is now verified in the Goal evidence; the full approval/lifecycle matrix and maintainer acceptance remain incomplete.
- WI-008/WI-009 have confirmed idle and next-turn selection main paths; their final closure remains pending.
- Covered built-in write/edit calls now check for unsaved editor changes before approval and again before execution authorization; blocked calls require explicit recovery, never auto-save. Shell writes and edits after the final check are not universally protected.
- Post-edit review now captures reliable write/edit before/after text in host memory and opens readonly native diffs plus current-source navigation. The expandable review panel distinguishes tool-reported targets from observed workspace changes, explains capture/attribution limits, and preserves historical pairs until runtime/project replacement; it is not patch approval or rollback. Saved sessions now use public pi APIs for a current-project catalogue, confirmed sequential New/Restore and bounded immutable history/attachment-text previews. Historical tools are not automatically loaded; confirmation is not an ownership lock. The remaining product loop and maintainer acceptance are still open; consult ACTIVE for current evidence. The [PRD](docs/product-requirements.md) is Draft and the architecture gates listed in [`ACTIVE.md`](ACTIVE.md) remain Open.

There is no release acceptance recorded for Marketplace or Open VSX. The validation VSIX documented in the [history](docs/archive/2026-09-21-closed-wi-history.md) is an extracted-package check, not an installed-package acceptance result.

## Run from source

Use the Node and VS Code engine ranges declared in [`package.json`](package.json), then:

```bash
git clone https://github.com/Hex4C59/pi-vscode.git
cd pi-vscode
npm ci
npm run compile
```

`npm run compile` builds the extension host, approval gate, bounded public-session helper and runtime entry points with esbuild, builds the browser Webview with Vite, and runs strict typechecks for the host, browser frontend and tests in their separate TypeScript configurations.

### Browser frontend preview

Run the Vite preview when working on the React frontend:

```bash
npm run preview:webview
```

Open the local URL printed by Vite. The preview mounts the production application with a synthetic host and offers fixture scenarios, theme choices and sidebar widths. It supports browser hot refresh, but it does not start pi, use the VS Code API, read workspace files or make provider requests. Preview behavior is not F5 or installed-VSIX acceptance.

`npm run watch` watches the extension host and approval gate with esbuild and rebuilds the production Webview output. It is a production rebuild watcher; it does not start the browser preview server or provide browser HMR. Use `npm run preview:webview` for that.

Open the repository in a local VS Code window and press **F5** (Run Extension). In the Extension Development Host, run **pi: Focus Chat** from the Command Palette or use the Pi editor-title icon.

Open one trusted local folder and choose whether to allow project-local pi resources. The host starts pi and displays readiness or a bounded error. Chat reuses your existing pi provider configuration and credentials; a live provider request may incur its normal charges. No-folder, multi-root, remote and untrusted workspaces cannot start the runtime.

The controlled profile asks before covered actions, with an automatic allowance for canonical in-workspace regular-file reads. Resource consent is separate from tool approval. Stop requests cancellation; it does not undo completed changes. The extension is not a sandbox. See the [approved execution slice](docs/product-requirements.md#req-006--execution-approval-strategies) for the precise limits.

## Development and verification

Use the checks that match the change:

```bash
npm run lint
npm test
npm run build:webview
npm run verify:webview
```

`npm test` uses `node:test` and esbuild to collect the owner-local `*.spec.ts` files. Webview specs mount the React application through jsdom with a synthetic bridge/host; they do not use the removed inline-string VM harness. The browser preview is useful for layout and interaction observation, but it is not automated test or host-acceptance evidence.

`npm run build:webview` writes the packaged frontend to `dist/webview`. `npm run verify:webview` checks that the local static bundle contains non-empty `webview.js` and `webview.css` with no unexpected JavaScript chunks. Pass a VSIX path to inspect the archive too:

```bash
npm run verify:webview -- path/to/pi-vscode.vsix
```

The optional VSIX argument checks for `extension/dist/webview/webview.js` and `extension/dist/webview/webview.css`. These are static asset checks; they do not install the VSIX, start a development server or run pi. Production Webviews load the packaged local assets and do not depend on a dev server.

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
