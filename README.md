# pi VS Code

English | [中文](README.zh.md)

VS Code extension for the [pi](https://github.com/earendil-works/pi) coding agent: chat in the sidebar while you code. Explorer stays on the left; Pi prefers the Secondary Side Bar on the right.

This independently maintained project is open source under [MIT](LICENSE). pi is a separate upstream product.

## Current status

The extension has a React/TypeScript sidebar for the existing scoped workspace setup, draft/streaming, model/thinking, activity/approval, Stop and bounded mixed attachments (up to 20 items / 1 MiB UTF-8): whole files and fixed editor selections, with explicit confirmation of latest whole-file contents or an old selection snapshot after source changes. The complete REQ-001–REQ-009 product loop is not yet implemented. Current scope, actual verification and remaining acceptance are owned by [`ACTIVE.md`](ACTIVE.md), not this overview.

- Browser, actual F5 and installed-VSIX evidence are recorded separately. Genuine pi with a local synthetic provider is not real-model evidence or maintainer acceptance.
- Live attachment history now has bounded pagination and on-demand complete previews; no whole-PRD, architecture-gate or release acceptance follows from the existing paths.
- Model/thinking slice acceptance and the separate trust/lifecycle boundary acceptance are recorded in the [closed-WI index](docs/archive/2026-09-29-closed-wi-index.md) and [gate table](docs/reference/architecture-gates.md). Their scoped evidence does not certify the complete product loop or every environment.
- Covered built-in write/edit calls now check for unsaved editor changes before approval and again before execution authorization; blocked calls require explicit recovery, never auto-save. Shell writes and edits after the final check are not universally protected.
- Post-edit review now captures reliable write/edit before/after text in host memory and opens readonly native diffs plus current-source navigation. The expandable review panel distinguishes tool-reported targets from observed workspace changes, explains capture/attribution limits, and preserves historical pairs until runtime/project replacement; it is not patch approval or rollback. Saved sessions now use public pi APIs for a current-project catalogue, confirmed sequential New/Restore and bounded immutable history/attachment-text previews. Historical tools are not automatically loaded; confirmation is not an ownership lock. The remaining product loop and maintainer acceptance are still open; consult ACTIVE for current evidence. The [PRD](docs/product-requirements.md) remains Draft; the [gate table](docs/reference/architecture-gates.md) owns current architecture acceptance and its limits.

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

Use the chat header gear → **Interface settings → Language** to switch between **English** and **简体中文** in both the formal sidebar and browser preview. English is the default; language is mount-local and not persisted or sent to the host. Preview scenario changes and Reset retain the page language; reloading resets it. Drafts, streaming, model settings and expanded activity stay in place. Messages, code, tool/approval input, saved content and upstream error details remain literal. Add complete `UiText` packs beside `src/webview/chat/ui-zh-cn.ts` and register them in `ui-language.ts`.

In the **No folder** fixture, the candidate shows the normal welcome page and accepts a draft instead of an upfront setup card. Send/Enter opens a localized “Unable to send message” prompt; OK, Close or Escape preserves the draft. Open folder remains available in that prompt, followed by the existing resource choice. Nothing is sent automatically, and no-folder still cannot start a task.

Run the Vite preview when working on the React frontend:

```bash
npm run preview:webview
```

Open the local URL printed by Vite. Expand **Preview controls** to choose a synthetic scenario, width (280/320/360/400/600px), theme, Reset or recovery; collapse them for short-viewport inspection. Following delegated Q16 evaluation, production `main.tsx`/`mount.tsx` and the synthetic `preview/candidate-preview.ts` both mount the shared `chat` presentation through its public entry. Production uses the real VS Code bridge; preview alone owns synthetic scenarios, timers and developer controls. Production dependency-graph tests exclude preview and test modules. Current host/package acceptance remains recorded in [ACTIVE](ACTIVE.md).

Shortest review loop:

1. **New conversation / Formatted reply / Activity before reply:** edit and send, inspect safe Markdown/copy and two-level literal activity, change model/thinking for the next turn, type a newer draft and Stop. Untrusted output demonstrates inert HTML/images and blocked URLs; links open absolute HTTP(S) destinations only, with visible clipboard failure/timeout feedback.
2. **Source changed / Attachment:** use the single centered `+` for file/selection, removal, complete literal preview or attachment history. Confirm latest files and old selection snapshots individually, then explicitly Send; confirmation never sends. Failure/capacity/unavailable/uncertain-delivery fixtures preserve their bounded recovery semantics. Simulate source edit never touches an editor.
3. **Approval queue:** choose among eight independent requests (the oldest expires after 20 seconds; the others after 120). Tool, requested target, complete command and exact scope are directly available, with local scrolling and expandable literal full input. Selection never approves or renews a deadline. Allow once, eligible exact-session approval, Deny, Stop and the composer's **Permissions** inspection/revocation are operable. Controlled execution remains disclosed as not a sandbox.
4. **Captured review:** expand the compact count entry, inspect captured/tool-reported/observed/unavailable labels and page through 33 synthetic results. Diff/source actions are explicitly simulated and report native unavailability. Simulate captured changes/review loss can be combined with a running task, session browsing and Simulate pending approvals. At short height, arriving approvals collapse an open review; a deliberate reopened review scrolls locally without hiding decisions or Stop.
5. **Saved sessions / New / Restore:** history is collapsed by default and replaces only the middle message area. The history icon, Back or Escape restores reading position/focus; the composer, Stop and incoming approvals remain available. Synthetic handoff offers confirm/cancel/failure, clears work only on a committed switch, and provides bounded restored-history pages/literal chunks. Reset and hot-refresh/unmount revoke old listeners/timers and identities.

Messages, code, tool/approval input and historical snapshots stay literal. Preview scenario factories live in `scenarios.ts`, external host simulation in `preview-bridge.ts`, and developer-shell styling in `preview.css`; shared `styles.css` assembles the existing cascade. The preview does **not** start pi, use VS Code capabilities, read workspace files, call providers or prove F5/installed-VSIX behavior. Current technical evidence, pending experience confirmation and formal-cutover conditions are in [ACTIVE](ACTIVE.md).

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

`npm run compile` must run before packaging: the packager refuses a tree that is missing host JS, webview JS/CSS or any of the three helper bundles rather than producing a package that cannot activate. `npm run verify:package-files` checks the same list without assembling an archive. Then:

```bash
npm run package:vsix
```

`npm run package:vsix` assembles `dist/pi-vscode-validation.vsix` from the declared `files` entries and the pinned pi runtime subtree, including its nested production dependencies. Pass `--out <path>` to choose another destination. The output is deterministic for a fixed input tree and is not published, signed or installed by the packager itself. To install it locally into a separate extensions directory, point `--extensions-dir` at a scratch directory:

```bash
code --extensions-dir /tmp/pi-vsix-profile --install-extension dist/pi-vscode-validation.vsix
```

The CLI proves manifest installability, not activation or runtime behavior. Verify the native macOS development and installed hosts separately; Windows real-host acceptance is outside the current scope. A separate extensions directory does not isolate VS Code application-shared storage.

The packager invokes the `zip` binary. That command is not present in a default Windows shell, so packaging there fails with an explicit error rather than writing a partial archive; build the archive on a host that provides it.

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
