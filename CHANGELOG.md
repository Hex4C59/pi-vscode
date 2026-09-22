# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Versioned Webview messaging, workspace eligibility/resource choices and host-owned RPC startup (WI-002/006/007).
- Bounded text streaming, model/thinking selection and chat-first UI, including next-turn settings (WI-004/008/009).
- Thinking/tool cards, controlled execution approvals and Stop (WI-010).
- Documentation-health checks and module-owned automated tests (WI-005/011).

### Acceptance limits

These entries describe development changes. Current approval, F5 acceptance and remaining work are in [ACTIVE](ACTIVE.md); closed slices and their original evidence are in the [archive](docs/archive/2026-09-21-closed-wi-history.md). WI-008/WI-009/WI-011 closure, installed-VSIX acceptance and three architecture gates remain pending. This section does not announce a Marketplace or Open VSX release.

## [0.0.1] - 2026-09-19

### Added

- VS Code extension scaffold: secondary sidebar `WebviewView` with placeholder UI (WI-001).
- Subprocess pi RPC spike (`npm run spike:runtime`) and Accepted ADR `0001-build-baseline`.
- Documentation, architecture gates, agent playbooks, and git commit convention.
- GitHub Actions: documentation verification; extension compile and lint (see repository CI workflow).

### Notes

- **Not included:** end-user chat, streaming UI, or Marketplace publication.
