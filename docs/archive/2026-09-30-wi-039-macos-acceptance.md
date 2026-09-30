# WI-039: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-039-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this session's complete-ACTIVE-tasks wrap-up-and-commit request
- Authority: historical evidence for this approved packaging slice; not whole-PRD, release, gate, WI-038 or ADR 0007 acceptance
- Scope: [approved proposal](2026-09-30-wi-039-approved-proposal.md), REQ-009 delivered VSIX runtime closure, REQ-002 provider configuration in an installed host
- Acceptance identity: agent under the maintainer's 2026-09-30 request to finish remaining ACTIVE tasks, write wrap-up records, and commit after each task; not a claim that the maintainer personally reran these checks

## Approved Behavior and Implementation

A shipped host bundle may leave outside itself only `vscode` and pinned `@earendil-works/pi-coding-agent`. Declared `@earendil-works/pi-ai` 0.86.1 is inlined in `dist/extension.js`. Packaging refuses a delivered bundle whose bare runtime specifiers are not staged or host-provided. The archive verifier actually imports each specifier from the unpacked extension root. Provider settings, endpoint add/remove and the model catalogue therefore load in an isolated installed host the same way they do in development. No Webview DTO, gate, ADR, module responsibility or user-visible settings clause changed.

Implementation is `9d9259d` (`build(packaging): bundle pi-ai and guard VSIX runtime deps`). Architecture and PRD slices are `f9fcd45`.

## Automated Verification

Build recorded 993 tests (3 new packaging regressions). This close reran the same suite on the current tree.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | pass | Production bundles and TypeScript; `dist/extension.js` is 982 KB with pi-ai inlined |
| `npm run lint` | pass | Static checks |
| `npm test` | 993 pass, 0 fail/skip | Includes specifier scan, missing-dependency rejection, staged-tree pass, and unpacked import verification coverage |
| Implementation commit | `9d9259d` | esbuild externals, `packageVsix` rejection, `verify-vsix` real imports |

A pre-fix archive of 149,815,375 bytes (`dist/wi038-native/pi-vscode-prepackage01.vsix`, SHA-256 `0b2abc72fe523df6bc89ab930179444acdf230967194517ed9a53ef30e2949f0`) failed unpacked import verification: `@earendil-works/pi-ai` was required from `dist/extension.js` and was not packaged. The post-fix archive of 149,921,300 bytes (`dist/wi038-native/pi-vscode-final.vsix`, SHA-256 `1a70dd777a92fbcf5205d3f927e87482e347835b23130e3caa123b93ab22f6c9`, 15,535 entries, pi 0.86.1) passed. Those ignored local artifacts are not checked-in proof; the hashes and sizes are the durable summary.

## Native Environment and Provenance

macOS 27.0.0 (arm64); released pi 0.86.1. Isolated owned root `/private/tmp/pi-w038-4cmFzI` held distinct parent/dev/installed user-data and a dedicated agent directory. Synthetic endpoints only; no real login, model or paid call. The accepted installed run used `pi-vscode-final.vsix` (149,921,300 bytes). VS Code reported `Extension 'pi-vscode-final.vsix' was successfully installed.`

## Actual installed-provider evidence

The blocking installed failure, recorded before this WI, showed both isolated windows reporting `Could not load provider configuration.` A diagnostic build logged `Cannot find package '@earendil-works/pi-ai' imported from <extension>/dist/extension.js` (`ProviderConfig.ensureRuntime` → `createRuntime`). Unpacking that archive staged only `node_modules/@earendil-works/pi-coding-agent`.

After the packaging fix, the same isolated installed two-window path loaded provider configuration (`provider-loaded: true` on the first attempt after empty error strings). Add and remove contention both showed the fixed lock error and left `ids: ["fixture-endpoint"]` unchanged. After release, each window committed cleanly and retained every entry (`installed-holder`, `installed-add-0`, `installed-add-1`, then `installed-holder-2` on the remove retry). `failures` was empty. Owned processes were gone (`cleanupRemaining: []`). Local report: `dist/wi038-native/report-pi-w038-4cmFzI.json`.

That run also captured development-host contention for WI-038. Those observations do not close WI-038.

## Failures, Cleanup and Limits

- Earlier installed attempts against the pre-fix archive are not passes.
- Wiring the verifier into `package:vsix`/CI remains parked ARCH-07.
- This close does not accept WI-038, ADR 0007, ADR 0005, a gate, or the whole Draft PRD.
- Windows native F5/install remain outside the current macOS platform decision.
- No push.

## Final Disposition

The agent accepts and closes WI-039 under this session's complete-ACTIVE-tasks wrap-up-and-commit request. Implementation, 993 automated tests, red/green unpacked import verification, and isolated installed provider loading satisfy the approved packaging slice. ARCH-07 and WI-038 remain separate.
