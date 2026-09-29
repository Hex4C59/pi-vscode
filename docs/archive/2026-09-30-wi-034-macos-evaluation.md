# WI-034 macOS delegated evaluation

English | [中文](2026-09-30-wi-034-macos-evaluation.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical scoped delegated acceptance and closure; current work remains in [ACTIVE](../../ACTIVE.md)

## September 30 final delegated acceptance

After the initial evidence handoff, the maintainer explicitly delegated final judgment for WI-032/033/034 to the agent, saying that no independent maintainer acceptance should be required after agent review. This is **agent-delegated acceptance and closure**, not a claim of maintainer-performed testing. Earlier evaluation-only/pending wording below is retained as capture-time history, not a current blocker. Both language records were archived together because this WI is closed.

Accepted and closed for the approved deterministic VSIX packaging slice. Packaging specifications, actual archive verification with extracted real RPC/gate readiness, isolated extension installation and native macOS F5/installed activation and rendering passed. Real-model chat and full REQ-009 acceptance remain outside this close. Application-shared storage is not fully isolated by user-data directories; the disclosed extension-installation isolation is sufficient for this approved slice.

Only the approved WI slice is accepted; no whole Draft PRD, gate, ADR or Git commit change follows. Delegation does not convert unverified native behavior into a pass.


## Authorization and conclusion

The September 30 authorization delegates this WI to the agent on macOS. Windows is outside acceptance scope. This is **agent-delegated evaluation**, not maintainer acceptance, WI closure, whole-PRD acceptance or gate change.

Packaging, native F5 activation/rendering and independently installed activation/rendering passed. Both host screenshots show the actual Pi sidebar in a no-folder window; they do not establish a real-model call, trusted-workspace runtime lifecycle or the WI-032/WI-033 fault paths.

## Current evidence

Platform: macOS 27.0 (26A428), arm64; VS Code 1.139.1, commit `04c0d99f4fb0d8afe6ce4f0c58e31e183ac3e4b1`; pi 0.86.1. Local artifacts live under `dist/delegated-macos-20260930/wi-034/` (ignored build evidence, not committed).

| Check | Observed result |
|---|---|
| `npm run compile` | Passed current build and all three TypeScript scopes |
| `node --test scripts/packaging/package-vsix.spec.mjs` | 11 passed, zero failed/skipped |
| `npm run package:vsix -- --out dist/delegated-macos-20260930/wi-034/pi-vscode.vsix` | 14,100 source entries; 149,811,688 archive bytes |
| Archive SHA-256 | `b89582b84edbe4b7df59e0c1f1c26d870cc470eade38393995de432316d94aba` |
| `node scripts/packaging/verify-vsix.mjs dist/delegated-macos-20260930/wi-034/pi-vscode.vsix` | 15,535 archive entries; extracted real pi RPC readiness and gate handshake passed |
| `code --user-data-dir <owned installed-user> --extensions-dir <owned installed-extensions> --install-extension <evaluated VSIX> --force` | Exit 0, successfully installed |
| `code --extensions-dir <owned installed-extensions> --list-extensions --show-versions` | Exactly `pi-vscode-dev.pi-vscode@0.86.1` |
| Native F5 | Real F5 key in repository parent launched Extension Development Host; Pi native tab loaded actual Webview; `f5-pi.png` visually inspected; `f5-exthost.log` records `onView:pi-vscode.chat` activation |
| Installed host | Separate native process without `--extensionDevelopmentPath`; Pi tab loaded actual Webview; `installed-pi.png` visually inspected; `installed-exthost.log` records activation |
| `npm run lint`; `npm test` | Passed; 867 passed, zero failed/skipped |

The installation extensions directory is the absolute repository path ending in `dist/delegated-macos-20260930/wi-034/installed-extensions`. Actual GUI user-data directories are `/tmp/pi-w034.BE9NIf/dev-user` and `/tmp/pi-w034.BE9NIf/installed-user`, with a separate empty development extensions directory `/tmp/pi-w034.BE9NIf/dev-ext`. No extension was installed into the maintainer's existing profile. Native host ports 19434/19435 were used only for this run's renderer inspection and screenshots.

## Failed setup attempts and limits

Initial GUI launches inherited `ELECTRON_RUN_AS_NODE=1`, so no native window appeared despite the launcher returning zero. A direct native launch with that variable removed failed with `EINVAL` because the repository-local user-data path exceeded the macOS Unix socket length limit. A short owned temporary user-data root solved that failure. These are setup failures, not passed host evidence.

A synthesized command-palette shortcut did not select Pi and instead reached the built-in Copilot UI. No sign-in was performed; its dialog was dismissed. The passing reveal evidence uses the actual Pi native tab, not that failed shortcut. F5 itself was dispatched through the real workbench key event, not substituted by CLI `--extensionDevelopmentPath` startup.

Final checks: docs:verify and docs:health returned zero errors; only the four existing Draft ADR 0005/0006 notices remain. Seven installed production artifacts (host, supervisor, worker, gate and three Webview assets) matched the current build byte-for-byte. Browser.close disconnected the inspection clients before replying (client exit 13), but both owned native jobs subsequently exited 0; host logs report parent/development/installed extension-host exits, and executable-filtered process inspection found no owned GUI process. Temporary profiles and installed artifacts are retained for evidence; no existing window was closed.

Isolation limit: VS Code 1.139.1 itself initializes application-shared storage under the existing user HOME (`.vscode-shared/sharedStorage/state.vscdb`), as shown by both owned main logs. Separate user-data/extensions directories therefore prove isolated extension installation, **not** complete HOME/application-state isolation. Recent-item metadata is visible in the screenshots; no sign-in or model call was performed.

Maintainer acceptance remains pending; no production code, PRD, ADR, gate or Git commit changed in this evaluation.
