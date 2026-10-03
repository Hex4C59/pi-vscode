# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No additional changes recorded yet.

## [0.0.1] - 2026-10-04

### Added

- React/TypeScript sidebar chat with streaming, model/thinking selection,
  tool activity, execution approvals and Stop.
- Bounded file/selection attachments, post-edit readonly diffs and current-project
  saved-session browsing, search and restoration.
- Workspace/resource controls, provider settings, command discovery, model
  cycling, manual compaction and bounded Mermaid rendering.
- Local diagnostics and installed-version information.
- Running-task Steer/Follow up queues with bounded text attachment snapshots
  and enabled skill/prompt-template commands (WI-091).

### Fixed

- Preserve the extension's own `0.0.1` version in both the packaged extension
  manifest and VSIX identity instead of replacing it with the pi runtime version.
  The pi dependencies remain pinned to `0.86.1`.

### Scope and installation

- This is the maintainer-authorized local `v0.0.1` Git baseline for personal-use
  macOS VS Code, not a Marketplace or Open VSX publication.
- Existing acceptance evidence is recorded in the
  [macOS verification record](docs/archive/2026-09-30-macos-verification-acceptance.md),
  [eight-slice handoff](docs/archive/2026-10-03-eight-gap-goal.md) and
  [WI-091 record](docs/archive/2026-10-03-wi-091-queued-inputs.md).
  It does not establish a real paid-model run or completed account login in the
  maintainer's daily VS Code profile. The unresolved daily keychain symptom is
  retained in [ACTIVE](ACTIVE.md).
- Build with `npm run compile`, then package with
  `npm run package:vsix -- --out dist/pi-vscode-0.0.1.vsix`.
  Install that archive using VS Code's **Install from VSIX** action or
  `code --install-extension dist/pi-vscode-0.0.1.vsix --force`.
  Reload the VS Code window if prompted. Installation is not a model-connectivity
  or full runtime acceptance check.

### Historical scaffold checkpoint — 2026-09-19

- The initial `0.0.1` source scaffold contained a secondary-sidebar placeholder,
  a subprocess pi RPC spike, Accepted ADR `0001-build-baseline`, documentation,
  architecture gates, agent playbooks and compile/lint/documentation CI.
- End-user chat, streaming and public extension-store publication were absent at
  that checkpoint. The Git baseline above includes subsequent development;
  this historical note is not a separate tagged release.
