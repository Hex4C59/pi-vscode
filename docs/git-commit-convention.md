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

Commit authorization remains unchanged: do not create or rewrite a commit unless the maintainer explicitly asks. For each authorized commit:

1. State the commit's concern in one sentence and list its expected paths or hunks from the session's ephemeral commit map.
2. Inspect `git status`, the unstaged `ACTIVE.md` diff, and the existing staged diff. Preserve all pre-existing index entries unless their owner explicitly authorizes changing them.
3. Stage only that concern by path and hunk. If ownership or overlap is unclear, stop; use the non-destructive baseline/work-copy/three-way recovery procedure in the [collaboration guide](guides/agent-collaboration.md) rather than stash, reset, or overwrite work.
4. Inspect the **full** cached patch with `git diff --cached`, not only `--stat` or a file list. Compare every staged hunk with the stated concern and expected paths.
5. Stop and split if `ACTIVE.md` is mixed with implementation. Implementation commits exclude `ACTIVE.md`; current-WI records use a separate `docs(active)` commit, while unrelated ACTIVE correction or maintenance uses a separate `fix(docs)` or `docs` commit.
6. Pick type/scope from the verified staged content; write the English summary + body (+ footers), then check length and secrets.
7. After committing, report the concern still remaining in the worktree or index, including ownership when relevant.
8. Do not amend/rebase/squash/force-push unless the maintainer explicitly asks.

`npm run commit:check`, when the repository provides it, is only a mechanical guard: it rejects staging `ACTIVE.md` with implementation paths, but cannot judge whether documentation, tests, or adjacent hunks are semantically mixed. Passing it never replaces the full cached-diff review. No Git hook is installed by this repository; run the command explicitly when available.

## Isolation examples

**Good — separate concerns:**

```text prompt
feat(host): add project trust gate

Prevent runtime startup until VS Code reports a trusted workspace.
```

```text prompt
docs(active): record project trust verification

Capture WI acceptance evidence separately from the host implementation.
```

**Bad — implementation and ACTIVE mixed:**

```text prompt
feat(host): add project trust gate and update ACTIVE

Implement the trust gate and record WI progress in the same commit.
```

The bad example defeats independent review and rollback even if a mechanical check misses semantic mixing elsewhere.

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
