# Contributing to pi VS Code

English | [中文](CONTRIBUTING.zh.md)

Thank you for your interest in this project. Active work is tracked in [`ACTIVE.md`](ACTIVE.md) (one work item at a time).

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

```bash
npm install
npm run compile
npm run lint
npm run docs:verify
npm run spike:runtime   # optional; subprocess RPC probe, no LLM
```

CI runs compile, lint, and docs verification on pull requests (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## pi integration

- Do not call real paid models in automated tests unless a maintainer documents an exception.
- Do not commit API keys, OAuth tokens, or pi auth file contents.
- Local `../pi` is for reading upstream source only; production builds must use pinned npm packages (see [`AGENTS.md`](AGENTS.md)).

## Security issues

Report vulnerabilities as described in [`SECURITY.md`](SECURITY.md), not in public issues.

## Questions

Use GitHub Issues for non-sensitive questions. Substantial design changes may need an ADR ([`docs/decisions/README.md`](docs/decisions/README.md)).
