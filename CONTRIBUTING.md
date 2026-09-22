# Contributing to pi VS Code

English | [中文](CONTRIBUTING.zh.md)

Active work is tracked in [`ACTIVE.md`](ACTIVE.md) (one work item at a time).

## Before you open a PR

1. Read [`AGENTS.md`](AGENTS.md) for engineering and security constraints (extension host vs webview, pi integration).
2. Read the [Agent collaboration guide](docs/guides/agent-collaboration.md) for work items, gates, and ADRs.
3. Follow [`docs/git-commit-convention.md`](docs/git-commit-convention.md) (English messages, Conventional Commits).
4. Align with the **current WI** in `ACTIVE.md`—avoid large unrelated feature PRs without maintainer agreement.

## What to contribute now

- Documentation fixes (keep English/Chinese pairs in sync when required; see [`docs/bilingual-documentation.md`](docs/bilingual-documentation.md)).
- Work that matches the current WI or parking lot items once a WI is opened for them.
- Tests and CI improvements that match existing scripts in `package.json`.

## Local checks

Use [README](README.md) to prepare a source checkout. Match checks to the change:

| Change | Required checks |
|--------|-----------------|
| Documentation only | `npm run docs:verify`; also `npm run docs:health` for WI close, archival or documentation-health maintenance |
| Extension code | `npm run compile`, `npm run lint`, `npm test` and affected documentation checks |
| Node scripts | Relevant script tests and documentation checks; `scripts/` is outside the current lint scope |
| Host/package behavior | F5 or installed-VSIX verification required by acceptance; automated tests do not replace it |

Completion means reporting the commands actually run, their results, and skipped or unverified areas with reasons. Use the [testing guide](docs/guides/agent/testing.md) for collection and evidence tiers. The [workflow](.github/workflows/ci.yml) defines actual CI coverage; do not assume all local tests run in CI.

Run integration probes separately under the [pi integration guide](docs/guides/agent/pi-integration.md), within the authorized scope and isolation rules. `spike:runtime` inherits the current environment; absence of model calls does not make it an isolated trust fixture.

## pi integration

- Do not call real paid models in automated tests unless a maintainer documents an exception.
- Do not commit API keys, OAuth tokens, or pi auth file contents.
- Local `../pi` is for reading upstream source only; production builds must use pinned npm packages (see [`AGENTS.md`](AGENTS.md)).

## Security issues

Report vulnerabilities as described in [`SECURITY.md`](SECURITY.md), not in public issues.

## Questions

Use GitHub Issues for non-sensitive questions. Substantial design changes may need an ADR ([`docs/decisions/README.md`](docs/decisions/README.md)).
