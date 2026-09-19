# Git commit convention

English | [中文](git-commit-convention.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Authority: format and language for commit messages in this repository (read when creating or rewriting commits)

## Scope

Applies to all commit messages created by humans or coding agents here, including amend, reword, squash, or other history edits.

Use **Conventional Commits** with an **English** subject, body, and footers when needed.

> **Kernel reminder:** `AGENTS.kernel.md` L0 — do not commit unless the maintainer explicitly asks. When they do, follow this guide.

## Format

```text
<type>(<scope>): <summary>

<body>

<footer>
```

Requirements:

- Subject and body are **required** for human- or agent-created commits.
- Footers only when needed (breaking change, issue refs, `Co-authored-by:`, etc.).
- Blank line between subject, body, and footer sections.
- One logical change per commit.
- No credentials, secrets, full prompts, or sensitive paths in messages.

Standard Git merge/revert messages may keep their default format. If you edit a revert message manually, add a body explaining why.

## Language

- Entire message in **English** (summary, body, custom footer text).
- Do not mix English and Chinese in the message.
- Keep standard trailers (`BREAKING CHANGE:`, `Refs:`, `Closes:`, `Co-authored-by:`) as usual.
- Preserve identifiers, paths, and commands literally when needed.

## Types

| Type | Use for |
|------|---------|
| `feat` | User-visible functionality |
| `fix` | Incorrect behavior |
| `docs` | Documentation only |
| `refactor` | Structure without intended behavior change |
| `test` | Tests only |
| `build` | Dependencies, packaging, build system |
| `ci` | CI or release automation |
| `perf` | Performance without behavior change |
| `style` | Formatting only |
| `chore` | Repo maintenance not covered above |
| `revert` | Revert (when not using Git’s default revert text) |

Pick the most specific type. Do not hide unclear work under `chore`.

## Scopes

Use a **lowercase** scope for the primary stable area (domain name, not a random filename). Omit scope when the change truly spans domains with no single owner.

**Starter list for pi VS Code** — aligned with [`vscode-extension-architecture.md`](architecture/vscode-extension-architecture.md); extend when new stable boundaries appear:

| Scope | Typical paths / topics |
|-------|-------------------------|
| `host` | Extension host — `src/extension.ts`, `src/extension/` |
| `webview` | Sidebar webview presentation — `src/webview/` |
| `adapter` | pi SDK / subprocess RPC — `src/adapter/` |
| `contracts` | Shared types, `docs/reference/` message or protocol docs |
| `build` | esbuild, `tsconfig`, compile/watch scripts |
| `deps` | Dependency or lockfile-only changes |
| `docs` | Documentation tree (excluding `contracts` reference specs) |
| `ci` | GitHub Actions, release automation |

Add scopes in this section when a stable boundary appears in architecture docs. Do not invent scopes for one-off files.

## Summary (subject)

- Imperative mood; lowercase start unless the first token is case-sensitive.
- No trailing period; aim for ≤ 72 characters.
- One clear outcome; avoid `update files`, `misc`, `fix stuff`.

## Body

- English; wrap near 72 characters when practical.
- Explain **why** and important **behavior**; do not paste the diff.
- Short body is fine, but must state purpose.
- Add detail when touching: architecture, security boundaries, persistence, public contracts, upstream SDK integration, build/CI, user-visible behavior, or migrations.
- Do not claim checks passed unless you ran them.

## Footers

```text
Refs: #42
Closes: #57
Co-authored-by: Name <email@example.com>
```

Put issue references in the footer, not the subject, unless your workflow says otherwise.

## Breaking changes

1. `!` after type or scope in the subject.
2. `BREAKING CHANGE:` footer describing incompatible behavior and migration.

```text prompt
feat(contracts)!: require protocol version on webview hello

Host rejects postMessage without version so stale webviews cannot
talk to a newer bridge after upgrade.

BREAKING CHANGE: Unversioned webview messages are dropped.
```

## Before you commit

1. Review `git status` and the full staged diff.
2. Exclude unrelated changes; suggest splitting mixed work.
3. Pick type/scope from staged content.
4. Write English summary + body (+ footers).
5. Check length and secrets.
6. Do not amend/rebase/squash/force-push unless the maintainer explicitly asks.

## Examples

```text prompt
feat(host): register Pi chat webview in secondary sidebar

Wire WebviewViewProvider for WI-001 shell only; no postMessage bridge yet.
```

```text prompt
docs(decisions): accept ADR 0001 build baseline for WI-001

Close extension-host, sidebar-shell, and runtime-host gates after
maintainer F5 and spike acceptance; chat product remains gated.
```

```text prompt
build(adapter): add pi RPC get_state spike script

Prove subprocess start, one JSONL round-trip, and clean exit for
gate-runtime-host without LLM calls.
```

## Invalid

```text prompt
update docs
```

No type, scope, outcome, or body.
