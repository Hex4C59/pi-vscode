# Closed work-item history through WI-007

English | [中文](2026-09-21-closed-wi-history.zh.md)

- Type: Archive
- Status: Historical
- Created: 2026-09-21
- Authority: context only; current work remains in [`ACTIVE.md`](../../ACTIVE.md)
- Archival reason: WI-001/002/003/005/006/007 are closed; their long proposals, acceptance evidence and old handoffs no longer belong in the current-work entry point.

> Do not implement from this file. It preserves historical scope, approval, evidence and limits. Current requirements, architecture, gates, ADRs and `ACTIVE.md` take precedence.

<a id="wi-001"></a>
## WI-001 — Build baseline and runtime probe

- **Outcome:** Accepted [ADR 0001](../decisions/0001-build-baseline.md) records the extension shell, secondary-sidebar baseline and subprocess RPC direction.
- **Closed gates:** `gate-extension-host-baseline`, `gate-sidebar-chat-shell`, `gate-runtime-host`.
- **Evidence:** TypeScript/esbuild extension shell, F5 placeholder and one `get_state` subprocess probe with bounded shutdown.
- **Limit:** This did not deliver user chat, streaming, model selection, sessions or webview trust closure. Historical runtime-spike evidence was consolidated into ADR 0001; raw logs and an exact original environment record were not retained.

<a id="wi-002"></a>
## WI-002 — Versioned ping/pong webview bridge

- **Approved scope:** a nonce-CSP webview bridge with one versioned, allowlisted ping/pong round trip; no pi runtime, secrets, generic commands or chat.
- **Acceptance:** on 2026-09-19 the maintainer observed `Connected (ping/pong only)` in F5 and confirmed that the view still could not send a real chat message. Automated checks rejected malformed, unknown and expanded message shapes.
- **Decision:** `none`; `gate-webview-trust` stayed Open and no ADR was created.
- **Historical proposal:** the host treated inbound data as `unknown`, validated the exact envelope before action, and exposed no Node, filesystem, shell or pi SDK to the webview.

<a id="wi-003"></a>
## WI-003 — Project-trust technical spike

- **Decision class:** `spike-only`; the maintainer approved the scope and on 2026-09-19 accepted the technical result. `gate-project-trust` stayed Open.
- **Question:** can pinned pi `0.85.1` RPC apply explicit project-resource choices at startup and across `cwd` session changes without reading/writing pi session or trust files directly?
- **Method:** isolated temporary home/cwd/config; public `PI_CODING_AGENT_DIR`; final runs set `PI_OFFLINE=1` and `PI_TELEMETRY=0`; session fixtures and remembered trust were created only through public APIs/hooks. The spike did not call a model or install project packages.
- **Observed six scenarios:** global `always` default / `--approve` / `--no-approve`, remembered trust plus `--no-approve`, global `never` default, and global `never` plus `--approve`. Project extensions, skills, prompt templates and `APPEND_SYSTEM` markers followed the explicit choice. `--no-approve` overrode global `always` and remembered trust. Old-project commands disappeared after switching cwd; each switch emitted two resume events, so consumers must not assume one event.
- **Still-valid limits:** declining project resources still allowed global extensions and `AGENTS.md` context. Project settings effects and themes were not independently observed; project packages were deliberately not installed. System-prompt evidence came from `session_start`/`getSystemPrompt`, not a provider request. There was no OS network sandbox or independent traffic audit. Early exploratory runs predated `PI_OFFLINE`; only final reruns used it.
- **Verification:** six real-runtime scenarios plus policy/lifecycle tests, including success, timeout, failure, cancellation, spawn error, callback error and cleanup. These prove spike behavior, not complete production isolation.

<a id="wi-005"></a>
## WI-005 — Documentation health phase one

- **Outcome:** maintainer accepted on 2026-09-19. Technical-only repository maintenance; no product behavior or gate changed.
- **Delivered:** bilingual governance guide, project documentation-health skill, read-only `docs:health`, lifecycle metadata checks and tests.
- **Limits:** no scheduler, automatic semantic review, automatic cleanup/fix, persistent issue store, commit or PR automation. Missing lifecycle metadata does not prove freshness; historical ADRs remain historical evidence.
- **Recorded product discussion:** the maintainer confirmed D-01 through D-04 first-release directions in the Draft PRD: Ask-before-actions default with scoped read exceptions; non-persistent one-call/live-session grants; explicit project-resource refusal independent from tool approval; one local folder and one active runtime session per window, with bounded explicit text context and honest post-edit attribution. Those choices did not approve implementation WIs or make the entire PRD Accepted.

<a id="wi-006"></a>
## WI-006 — Workspace and project-resource choice UI

- **Approved scope:** display local-workspace eligibility and record an editable, memory-only allow/decline choice without starting pi. Block absent, multi-root, remote, non-file and untrusted workspaces; use native folder/trust recovery actions.
- **Security/lifecycle:** host-owned identity and generation; stale messages rejected; paths rendered with `textContent`; no webview storage, pi trust-file writes, secrets or runtime. Choice survived view rebuild but reset on workspace/eligibility change or extension-host reload.
- **Corrections:** opening a folder used public `updateWorkspaceFolders`; editor-title light/dark Pi icons restored/focused the existing view rather than toggling it.
- **Acceptance:** automated provider/DOM/contract tests passed. The maintainer verified project display, allow/decline, hidden-view restoration, reload reset through an isolated CLI profile, untrusted recovery and multi-root invalidation, then accepted the F5 checklist on 2026-09-21 with no reported issue.
- **Limits:** acceptance did not close `gate-project-trust` or `gate-webview-trust`, start pi, prove remaining project-resource categories, or deliver full REQ-001. Earlier handoffs recorded that remote-host and some theme/accessibility paths were not all separately evidenced; final acceptance reported no issue but did not create a gate-closing ADR.

<a id="wi-007"></a>
## WI-007 — Start pi RPC from the resource choice

- **Approved scope:** in an eligible workspace, start pinned pi RPC with `--no-session` and explicit `--approve` or `--no-approve`; use one successful `get_state` as readiness evidence; keep the process alive until choice/workspace/eligibility/disposal changes.
- **Architecture:** the host consumed an injected `PiRuntimeLifecycle`; the extension entry wired the subprocess adapter; the webview displayed `not-started`, `starting`, `ready`, `stopping` or `error` without receiving process capability or credentials.
- **Verification:** `npm test` passed 44/44 with compile, lint and docs checks. On 2026-09-21 the maintainer observed `Runtime connected (RPC)` and `Choice recorded: allow project resources` for a trusted local single-root workspace and declared F5 acceptance.
- **Limits:** no chat input, streaming, model UI, tool approval or session list. Both trust gates stayed Open; WI-003's unobserved categories and isolation limits still apply.

## Cross-session maintenance notes

- Integration and TypeScript playbooks were expanded in English/Chinese with reusable protocol, lifecycle, trust, isolation and upgrade rules. Generated template guides and sibling repositories were not changed without authorization.
- A Windows test fix changed the docs-health CLI test from URL `.pathname` to `fileURLToPath`; this removed the `D:\\D:\\...` path failure.
- Historical DEP0169 output disappeared when other installed extensions were disabled; its source was not proven and it was never claimed fixed by product code.

## Replacement and unresolved context

Current WI scope and approval live in [`ACTIVE.md`](../../ACTIVE.md). Current product choices live in the Draft [PRD](../product-requirements.md); structural ownership lives in the [architecture](../architecture/vscode-extension-architecture.md); actual gate state lives in [architecture gates](../reference/architecture-gates.md). This archive has no single superseding document because it combines several closed WIs; the links above are the live entry points.
