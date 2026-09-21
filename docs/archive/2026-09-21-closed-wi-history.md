# Closed work-item history — WI-001–007 and WI-010

English | [中文](2026-09-21-closed-wi-history.zh.md)

- Type: Archive
- Status: Historical
- Created: 2026-09-21
- Authority: context only; current work remains in [`ACTIVE.md`](../../ACTIVE.md)
- Archival reason: WI-001/002/003/004/005/006/007/010 are closed; their proposals, acceptance evidence and old handoffs no longer belong in the current-work entry point. WI-008/WI-009 are not closed and remain in ACTIVE.

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

<a id="wi-004"></a>
## WI-004 — First end-to-end chat (minimal streaming slice)

- **PRD:** REQ-004 minimal Draft slice (user text + assistant `text_delta` streaming); not full REQ-002/003/005/006/008.
- **Approved scope:** `sendChat` when `runtime === ready`; host `prompt` with `--no-tools` RPC; `text_delta` projection and `agent_settled` for busy state; in-memory transcript; bilingual [`webview-messages`](../reference/webview-messages.md) chat outline. Evidence: [WI-004 RPC (0.85.1)](../discussions/2026-09-21-wi-004-rpc-evidence-0.85.1.md).
- **Build delivery (2026-09-21):** `PiRuntimeLifecycle.prompt`/event subscription; long-lived `pi-rpc-runtime` JSONL; `--model` from `~/.pi/agent/settings.json`; `chatModel` display; bounded `chatError` on `auto_retry_end` or empty assistant reply.
- **Acceptance:** Maintainer closed WI-004 on 2026-09-21. F5: fast character streaming; Send → Sending… → Send; provider 503 surfaced; stable after saving pi startup default model (e.g. gpt-5.6-luna). Automated `npm test` 49/49, compile, lint, `docs:verify` passed.
- **Limits:** `gate-session-streaming`, `gate-webview-trust`, `gate-project-trust` remain Open; no in-extension model picker (REQ-002), Stop, tool approval, or session history; provider errors may include short JSON; model follows pi startup default, not ephemeral TUI selection.

<a id="wi-010"></a>
## WI-010 — Thinking display and controlled tool execution

- **Approval and closure:** Build and the controlled profile were approved on 2026-09-21. After confirming the four F5 checks below, the maintainer requested closure (“进入收尾吧”) on the same date. This closes the scoped WI, not the complete PRD or architecture gates. Decision class `adr-after-approval`; Decision `pending-adr` remains tracked in ACTIVE.
- **PRD and approved proposal:** user-visible REQ-004 / REQ-005 / REQ-006 slice under D-01/D-02. Keep pinned pi `0.86.1` subprocess JSONL RPC; display actual upstream thinking and tool results, enable controlled built-in tools and Stop without reimplementing the agent loop. Foldable stable-ID cards, cumulative-output replacement, final-message reconciliation, bounded per-item output and a reserved notice within the 64-item cap preserve expansion/focus/scroll; omitted activity never skips approval. Complete approval inputs, inspectable/revocable grants and draft-preserving Stop are implemented.
- **Pre-execution boundary:** the bundled async `tool_call` hook waits through public `ctx.ui.confirm`; a versioned envelope binds runtime/cwd, request/tool-call IDs and full arguments. Gate hello and `get_state` are required for readiness. Missing bundle/handshake blocks startup, not a usable no-tools fallback; `tool_execution_start` alone is not interception.
- **Policy and lifecycle:** only canonical in-workspace regular-file `read` auto-allows; search/list, writes/edits, shell and external paths ask; unknown tools deny. Existing file grants match tool + canonical path; shell grants match tool + canonical cwd + complete input. Nonexistent/unresolvable targets are once-only. Memory-only grants survive ordinary settlement/Stop in the same live session; replacement/workspace changes clear them. Stop invalidates pending approvals before `clear_queue` + `abort`, waits for settlement or reports failure/shutdown, and never replays side effects. No rollback or universal descendant-process cancellation guarantee.
- **Controlled configuration:** `--no-extensions` with only the explicitly bundled gate, regardless of project-resource consent; production forces `PI_OFFLINE=1` / `PI_TELEMETRY=0`. Trusted user provider configuration, environment credentials and credential commands remain available. Offline limits startup networking/missing-package installation, not inference HTTP or tool networking. Canonicalization cannot remove filesystem replacement races; output filtering is best-effort; credential commands are outside tool-gate coverage. Not a sandbox.
- **Maintainer F5 acceptance (2026-09-21):** (1) thinking/state display normal; (2) file reads and tool cards normal; (3) rejected write had no side effect, then allowed writes worked; (4) Stop worked during a long harmless command. These four observations are the manual closure evidence, not an exhaustive approval/lifecycle/theme matrix or installed-VSIX test.
- **Previously reported automation, not rerun at documentation closure:** `npm test` 73/73, compile/lint; nine real pi approval fixtures: allow, deny, timeout (including late replies), stop, shell-allow, shell-deny, shell-stop, shell-running-stop and load-failure. Running PowerShell was stopped after output and did not create the later marker; discovered/settings/local-package third-party extension markers were absent. Fixture provider used no real provider credentials; load-failure used `--no-tools`, unlike production startup rejection.
- **Previously reported offline/package evidence:** `scripts/spike-offline-inference.mjs` used `--offline`, skipped missing-package installation and made one actual loopback HTTP inference returning `loopback-ok`; production environment overrides have separate unit coverage. Dependencies-inclusive `dist/pi-vscode-validation.vsix` was 139.71 MB / 14,080 entries. `scripts/verify-vsix.mjs` extracted it into an isolated directory and verified pinned CLI, production dependencies and bundled gate hello/`get_state` independently of repo paths, with a no-tools probe. This is not installed-VSIX activation/F5 acceptance or exhaustive external-provider verification.
- **Reconciled/deferred acceptance:** retain grant reuse/revocation/reset, changed-scope and remaining approval/lifecycle/UI matrix as unconfirmed manual coverage; do not infer it from the four checks. WI-008/WI-009 deferred model/thinking selection, including approval/Stop ordering, still awaits its own F5 and remains open. Search/list conservatively asking and startup failing closed are the final contract, not broad read-only auto-approval or chat fallback. Installed-VSIX validation and full boundary validation/ADR remain open in ACTIVE.
- **Out of scope:** terminal emulator, arbitrary Webview shell/RPC, comprehensive third-party extension approval, persistent grants, full Unrestricted mode, Markdown/highlighting, attachments, session history and rollback. Ownership is recorded in [architecture §7](../architecture/vscode-extension-architecture.md); the [message contract](../reference/webview-messages.md) remains Outline. Architecture stays Proposed/Direction; `gate-project-trust`, `gate-webview-trust`, `gate-session-streaming` remain Open.
- **Superseded handoffs:** earlier implementation documentation recorded UI implementation and all F5 as pending; only the four observations above now supersede that blanket F5 gap. That documentation pass reported `docs:verify` with zero errors/warnings/stale notices and removed the ACTIVE length warning. Code, package files and the approved plan were not changed by documentation closure; no commit was requested.

## Cross-session maintenance notes

- Integration and TypeScript playbooks were expanded in English/Chinese with reusable protocol, lifecycle, trust, isolation and upgrade rules. Generated template guides and sibling repositories were not changed without authorization.
- A Windows test fix changed the docs-health CLI test from URL `.pathname` to `fileURLToPath`; this removed the `D:\\D:\\...` path failure.
- Historical DEP0169 output disappeared when other installed extensions were disabled; its source was not proven and it was never claimed fixed by product code.

## Replacement and unresolved context

Current WI scope and approval live in [`ACTIVE.md`](../../ACTIVE.md). Current product choices live in the Draft [PRD](../product-requirements.md); structural ownership lives in the [architecture](../architecture/vscode-extension-architecture.md); actual gate state lives in [architecture gates](../reference/architecture-gates.md). This archive has no single superseding document because it combines several closed WIs; the links above are the live entry points.
