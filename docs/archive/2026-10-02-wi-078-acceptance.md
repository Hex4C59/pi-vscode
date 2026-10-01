# WI-078: composer command discovery acceptance

English | [中文](2026-10-02-wi-078-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-02
- Authority: scoped historical evidence, not whole PI-GAP-02 delivery

## Disposition

Closed by the agent on October 2, 2026 under the continuing goal, not personal maintainer testing. [Approved proposal](2026-10-02-wi-078-approved-proposal.md). Implementations include `a927a91`, `b2e84b7` and `bdc9f5b`; implementation commits exclude ACTIVE. No gate closed; no ADR status changed. PI-GAP-02 loaded-context reporting remains parked. The spacing ambiguity was explicitly resolved before implementation: bare completion adds exactly one space, existing suffixes remain literal.

## Evidence and reproduction

Current pin pi **0.86.1**, VS Code **1.140.0**, Darwin **27.0.0 arm64**. Native runs use isolated HOME, configuration, workspace and synthetic loopback provider. Native VSIX SHA-256 `fa61b6b435d2d2f3da3e364cfc66e2c2208fd25c9299677790e6800631cc08a3`. Artifacts below are gitignored under `dist/`; source regression cases remain committed.

| Tier | Observed scope | Artifacts / entry |
|---|---|---|
| Host/client composition and mounted production UI | Bare `/fi`→`/fix-tests `; unchanged literal tabs/newlines; repeated completion no-op; no prompt/queue side effect; revision guards; keyboard, synthetic IME, popup mutex, empty/error and stale cases | `src/extension/tests/command-discovery.spec.ts`, `src/webview/tests/command-discovery-{client,mounted}.spec.ts`; `wi078-command-catalogue/{completion-space,client-host-roundtrip,mounted-discovery,mounted-empty-exclusive}.json` |
| Browser preview, actual installed Chrome | 18 cases: widths 280/320/400, dark/light/high-contrast, en/zh-CN; three source rows, no overflow; keyboard bare completion, literal arguments, zero-match Enter no send, Escape preserves text | `wi078-command-catalogue/{replay-browser.cjs,browser-matrix.json,browser-space-log.txt}` plus screenshots; loopback preview port 5188 |
| Genuine pi and production adapter | Controlled decline/approve, Trusted explicit fixture command, replacement back to decline; no paths projected; explicit harmless command prompt RPC-accepted with literal arguments; catalogue discovery itself does not execute; 4 starts and 4 observed closes, fixture removed | `wi078-command-catalogue/{runtime-replay.mjs,runtime-report.json,runtime-space-log.txt}`; rebuilt `wi078-command-probe.cjs` from `wi078-runtime-entry.ts` |
| Installed VSIX | Three catalogue rows, source/location; `/dis`→`/discover ` and `/dis keep arguments`→`/discover keep arguments`; provider request count unchanged; zero-match Enter no send; Escape preserves `/`; cleanup empty | `wi078-native/{installed-space-report.json,installed-bare-completed.png,installed-commands.png,installed-completed.png,installed-no-match.png}` |
| macOS F5 | Actual `[Extension Development Host] A` and matching Webview parent target; same bare/suffix/no-match/Escape checks; F5 dispatched; cleanup empty | `wi078-native/{f5-space-report.json,f5-bare-completed.png,f5-commands.png,f5-completed.png,f5-no-match.png}` |

Reproduction: `npm run compile`, `npm run lint`, `npm test`; start `npm run preview:webview -- --host 127.0.0.1 --port 5188` and run the browser replay using installed Chrome and local Playwright (no downloads). Rebuild the runtime probe using esbuild and run the runtime replay from the repo root. Run `npm run package:vsix`, then `ACCEPT_PHASE=queue node dist/wi078-native/run.mjs` for installed and `ACCEPT_PHASE=queue-f5 node dist/wi078-native/run.mjs` for actual F5. The runner stages/verifies a private local VSIX and copies its report to the lane-specific paths; no public publishing. The runner and machine-specific paths are local artifacts, not portable CI entries.

## Failed attempts and correction

The archived red bundles in `wi078-space-red/` reproduce missing-space assertion failures (`actual: /fix-tests`, `expected: /fix-tests `); current collected tests pass. A prior browser replay attempt timed out on suffix selection; the current replay completed all 18 cases.

Two current F5 attempts timed out waiting for the menu. Instrumentation confirmed the correct development-host Webview with draft `/` but menu closed. The harness focused the development host and then sent a CLI focus command to the **parent** user-data directory, stealing focus. Removing that parent CLI fallback only for the F5 lane restored the native loop; the final report is `ok: true`. Failed reports are retained as `f5-space-failed-report.json` and `f5-space-second-failed-report.json`; their cleanup arrays are empty. No product workaround or fake focus/menu event was introduced.

## Checks and semantic review

Compile (including three TypeScript configs), lint and **1157 tests** passed; zero failed/cancelled/skipped. Packaging and unpacked-VSIX verifier passed. Browser 18/18, real-runtime 4 closes and both native reports passed. `git diff --check` passed. At closure docs:verify and docs:health report zero errors; the two pre-existing Draft ADR 0010 notices are retained, not resolved by accepting it.

Reviewed affected PRD rows, Living Webview contract, plugin-parts evidence and archive indexes. Completion spacing and current acceptance status are aligned; older WI/runtime records retain historical limits. REQ-008/Chinese REQ-009 drift is not new implementation scope.

## Limits and handoff

Not personal maintainer testing, a real/paid model call, OS IME verification, all third-party extension compatibility, or additional-host/platform acceptance. Synthetic IME coverage is not OS IME coverage. No loaded AGENTS.md report, downloads, storage/trust expansion or sibling pi edits. PI-GAP-01 attachments/slash expansion and PI-GAP-02 loaded-context remainder stay parked. Next in-bound candidate is read-only session/context usage (PI-GAP-03); new behavior has its own PRD approval and evidence, not inherited acceptance.
