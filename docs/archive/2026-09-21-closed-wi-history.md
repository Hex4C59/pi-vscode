# Closed work-item history — WI-001–007 and WI-010–012

English | [中文](2026-09-21-closed-wi-history.zh.md)

- Type: Archive
- Status: Historical
- Created: 2026-09-21
- Authority: context only; current work remains in [`ACTIVE.md`](../../ACTIVE.md)
- Archival reason: WI-001/002/003/004/005/006/007/010/011/012 are closed; their proposals, acceptance evidence and old handoffs no longer belong in the current-work entry point. WI-008/WI-009 are not closed and remain in ACTIVE.

> Do not implement from this file. It preserves historical scope, approval, evidence and limits. Current requirements, architecture, gates, ADRs and `ACTIVE.md` take precedence.

Versions, script paths and pending acceptance below are snapshots at each recorded closure. ACTIVE records the later 19:44 deferred-selection confirmation and WI-011 script regrouping; the [pi integration guide](../guides/agent/pi-integration.md) links current command entries. Original paths and acceptance observations remain historical, without implying a rerun.

<a id="wi-012"></a>
## WI-012 — Minimal public-API compatibility probes (closed 2026-09-22)

Archived after the maintainer explicitly confirmed closure of the **minimal probe slice**, followed by WI-013 standard-interaction/Stop Prepare only. [ACTIVE](../../ACTIVE.md) owns that replacement proposal. The [live compatibility investigation](../discussions/2026-09-22-pi-compatibility.md) retains the exact execution command, staged observations and still-unexecuted broader CF matrix; it is not archived wholesale. Closure accepts the investigation's bounded findings and gaps, not product compatibility, an ADR or any gate.

### Approved proposal and approval sequence

- **Classification:** technical-only, spike-only; REQ-009.3–5, REQ-006/008 and REQ-005 constraints. Related project-trust/session-streaming and webview-trust gates stayed Open; WI-010 pending ADR retained. The former frontend candidate number became WI-012; frontend engineering stayed unassigned.
- **14:50 Prepare / 14:59 Build authorization:** independently callable `scripts/spikes/` runner, worker, synthetic extension, helper and `.spec.mjs` regression using the existing runner. No production source, dependencies/lockfile, build or CI changes; an independent npm entry was permitted if needed but none added. SDK use only inside the isolated fixture process; ADR 0001 production subprocess baseline unchanged.
- **P1 (CF-05 subset):** public package APIs create/save disposable A/B sessions, list A via `SessionManager.list`, restore the returned opaque path over RPC and inspect history/project markers, empty/unavailable/error paths and no replay. No session-file parsing, ownership lock or product grant-reset claim.
- **P2 (CF-03 subset):** synthetic init/command/tool/hook, controlled-disabled versus explicit loading, active-tool exclusion and actual temporary write denial/allowance with side-effect inspection. Initially no fake or real model calls; no supported model-free execution path meant blocked, not a substitute direct-tool/mock pass.
- **P3 (CF-04/08 subsets):** select/confirm/input/editor completion, ordinary cancellation, publicly supported timeout, clear_queue/abort/disconnect, request/process-generation correlation and late/replacement answers. Ordinary cancellation is not Stop or termination of all extension code; unsupported paths are explicit gaps.
- **16:06 supplemental scope confirmation, then separate explicit code/run approval:** permit public synthetic assistant-message persistence and deterministic no-network provider output driving the real pi loop for P2; refine cancellation-before-abort, continuation/stale answers, probe generation ledger and independent natural EOF observation. This superseded only the fake-provider prohibition for these fixtures. No real model/network, local credential loading or product Build was authorized. Shared-understanding confirmation alone was not execution authorization.
- **Isolation/limits:** inspect pinned public signatures/CLI and fixtures first; unique owned temp home/config/session/cwd, environment allowlist excluding real keys, credential commands, proxies and user/global extensions; no package installs/external network. `PI_OFFLINE` alone insufficient. Establish observable isolation or block, never change global firewall/environment. Proposed and approved budgets: 10 s/request, 60 s/scenario, 5 s exit wait, 64 KiB bounded scenario diagnostics; exceedance fails, uncertain effects are not retried. Cleanup only owned resources on failure/success, record failures and actual child exits; no guarantee for all descendants.
- **Architecture review / acceptance:** Direction, spike first. Layer/scope/storage boundaries preserved; public APIs, correlation, errors, isolation, bounded diagnostics and cleanup required runtime evidence. Per-variant passed/failed/blocked/not-run, exact command/package/Node/OS, input/expected/actual, ordered events, side effects and exits required. Helper regressions cover empty input/correlation/timeouts/nonzero exits/cleanup/log budget; run relevant regressions, full tests, JS syntax and docs checks. Product UI/accessibility/install acceptance N/A. Failure is useful evidence, not compatibility success.
- **Exclusions:** full CF-01/02, CF-06/07, profile/grant-reset matrix, performance, real extensions, F5/installed VSIX, frontend engineering, production SDK/architecture/session-format changes, old trust-probe modifications, other WI/ADR/gate closure and commits.

### Historical execution, reconciliation and limits

Initial no-model run ended at 15:30 exit 0 after replacing default-root WSL execution with nobody/UID 65534 guards; two RPC processes and worker exited and cleanup passed. P1 user/custom-only persistence and P2 covered execution were blocked; P3 abort alone accepted a later affirmative answer. Historical Windows tests 101/101, Linux helpers 7/7 and five syntax checks passed. Those findings motivated the separately approved supplement, not silent scope expansion.

Final complete run ended at **16:20:45 UTC+8**, pi **0.86.1**, Node **v24.12.0**, Ubuntu-24.04 / WSL Linux **6.18.33.2-microsoft-standard-WSL2**, unprivileged-user/network namespace with no interfaces/usable routes, allowlisted environment and isolated fixtures. All five RPC processes and worker exited 0; owned cleanup passed. This is not a filesystem sandbox or Windows-host verification. Exact invocation and variant observations remain in the linked investigation.

- **P1 passed for synthetic public-API seam:** assistant fixture persisted A/B; list A excluded B; RPC restored three messages with A markers, no B or task replay. Missing-path restore still returned success/empty history; real restoration failure, terminal-created history and product grant reset unverified.
- **P2 passed for synthetic interception seam:** fixed provider drove real pi loop; built-in/custom write denial left no target, allowance wrote exact expected content. Synthetic hook success does not establish the product bundled gate, every extension or real inference.
- **P3 partial / compatibility gap:** cancellation before abort resolved confirm false and rejected stale effects, but extension JavaScript continued; abort alone accepted true. Four dialogs had request/continuation/completion observations. Cross-generation checks exercised only the probe ledger. Natural EOF exited 0 before owner shutdown with no completion marker, not graceful cancellation proof. Editor timeout remained blocked. No complete Stop guarantee or product host late-answer verification follows.
- **Historical checks:** Windows 103/103, Linux helper 9/9, five script syntax checks, docs:verify and diff checks passed; ACTIVE length warnings were retained at those times. Earlier docs:health passed. No tests/probes were rerun for this documentation-only closure; current docs verification belongs to ACTIVE. No real-provider request, credential read, F5/installed VSIX, real extension, product/dependency/CI edit or commit is claimed.
- **Closure reconciliation:** the approved spike required honest per-variant evidence, not every compatibility variant passing. Remaining P3 and restoration-error gaps explicitly carry forward; no full CF fixture is accepted by these subsets. WI-008/009 remain open, WI-010 ADR pending and all three relevant gates Open. REQ-009's operation-level unsupported/terminal fallback and already-pending unconfirmed-stop/manual-termination policy remain future targets. No automatic termination/restart workaround is approved; existing failure shutdown remains. WI-013 must establish reliable separation/completion or report a blocker before Build.

<a id="wi-011"></a>
## WI-011 — Owner-local test restructuring (closed 2026-09-22)

Archived because the maintainer requested closure at 14:50 on September 22, followed by compatibility Prepare. Current work moves to [ACTIVE](../../ACTIVE.md); this record preserves the approved technical scope, not product delivery.

- **Approved scope:** move application tests into extension/adapter/webview owner-local `tests/` directories with `.spec.ts`; script specs use `.spec.mjs`. Split coherent workspace/focus/runtime/model/bounds/protocol/approval/architecture, adapter projection/environment and Webview HTML/workspace/model/execution suites with local harnesses. Preserve all original scenarios/assertions; production source stays in place.
- **Runner proposal and acceptance:** a thin runner plus import-safe recursive collector, excluding helpers/fixtures/other tiers and symlinks, preserving relative output paths and executing only the current exact inventory. Clean only `dist/tests/`; empty inventories, build and process failures fail. Temporary fixture regressions cover discovery, same-name isolation, exclusions, stale-output cleanup and failures. Preserve node:test, esbuild, production packaging/dependencies and existing CI scope; synchronize package/CI/docs references without a new tsconfig or test tier.
- **Additional approval (2026-09-21 20:33):** group scripts under docs/testing/spikes/packaging, retain filenames, public npm commands and behavior; update root calculations, imports, CI and fixtures. No extra src/tests nesting, paid calls or broadened acceptance. The original approved plan was not changed.
- **Architecture/risk review:** existing layer ownership retained; migration needed recursive discovery to avoid missing nested tests. Risks were omitted/duplicate tests, output collisions, stale bundles and cwd/VM changes; baseline names and collector regressions supplied the recorded evidence. No production boundary or requirement change; decision/gate for this WI: none.
- **Historical verification:** original baseline 73/73, zero skipped (44 application and 29 script cases). Application cases split into 14 owner-local specs; original names/scenarios/assertions retained. Eleven runner regressions gave 84/84, including Unicode and non-root cwd. Compile, lint, docs:verify, docs:health and diff checks passed at implementation and after the 19-file script regrouping. Three spike entries and VSIX entry passed syntax checks; probes and VSIX acceptance were not rerun. Scripts remain outside lint and have dedicated regression coverage.
- **Separate later maintenance evidence:** the commit-isolation checker added ten tests, yielding a recorded 94/94 with compile/lint/docs/diff checks passed. This is not eleven more WI-011 migration cases and not a new run at closure.
- **Closure limits:** this documentation-only closure relies on those recorded checks and maintainer closure authorization; it does not claim a new application-test/compile/lint/F5/VSIX run. Current documentation checks are recorded in ACTIVE. No production logic, dependency/lockfile, new e2e/snapshot/performance lane, expanded CI matrix or Git commit belongs to this closure. The historical project-trust probe's 0.85.1 guard still differs from the 0.86.1 pin; no probe result is inferred. WI-008/WI-009 remain open, WI-010's pending ADR and the three Open gates remain unchanged.

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
