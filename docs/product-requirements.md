# pi VS Code — Product requirements

English | [中文](product-requirements.zh.md)

- Type: Product requirements
- Status: **Draft**
- Created: 2026-09-19
- Authority: user-visible scope and acceptance only after explicit maintainer approval; this draft does not authorize implementation
- Related: [`../ACTIVE.md`](../ACTIVE.md), [`architecture/`](architecture/), [`guides/agent-collaboration.md`](guides/agent-collaboration.md)

> The maintainer agreed with the direction and confirmed D-01–D-04 on 2026-09-19. The whole PRD remains Draft; individually approved slices are identified in traceability, archived approval records and ACTIVE's current scope. Scope approval, technical verification, user acceptance and gate acceptance are recorded separately.

## Product direction (agreed)

Provide a local IDE agent workflow close to Claude Code / Codex, using **pi as the runtime**. Prioritize context input, task execution, process control, change review and session continuity, rather than reproducing vendor cloud services. The extension presents and orchestrates documented pi capabilities; it does not reimplement the agent loop, providers or session format.

Keep Explorer on the left and prefer the secondary sidebar for chat. Optional editor tabs do not imply changing the default layout. Reference clients inspire observable workflows, not pixel parity or unsupported security promises.

## First usable release (boundaries confirmed; detailed slices Draft)

The initial target user develops in a local VS Code folder and already has working pi provider credentials. They can identify the active project and model, attach relevant code, request a focused change, observe and stop execution, inspect modifications, and later resume the known conversation.

Confirmed D-04 limits: one local workspace folder (Git or non-Git) and one active runtime session per VS Code window; text plus explicit workspace text-file/selection context; existing pi credentials; post-edit review and restoration of this extension's known sessions in the current project. Full provider login UI, multi-root workspaces, remote environments and parallel conversations are not first-release commitments. These approved boundaries do not authorize Build or certify technical feasibility; detailed slices below remain Draft.

## Candidate requirements and acceptance

Each full requirement remains Draft; some slices have separate approval and acceptance. For a new Build, use the [collaboration guide](guides/agent-collaboration.md) to link the selected slice to one WI, resolve its decisions, define observable acceptance and record approval.

### REQ-001 — Project and trust visibility

Show the active workspace folder before running a task. With no folder, explain how to open one and do not start a project task. Unsupported multi-root cases receive a clear explanation rather than silently selecting a folder. On workspace changes, do not silently continue the old task in the new project.

Distinguish VS Code workspace trust, pi project-resource trust and tool approval. Per confirmed D-03, do not start the agent in a VS Code untrusted workspace; do not silently trust pi project resources. When VS Code trusts the workspace but pi resource trust is declined, allow the session to continue with a visible indication that project-local pi resources are not loaded. This does not prevent ordinary project-file reads or imply that all context files and user/global resources are excluded; verify the exact pi loading boundary before implementation. Never describe resource trust as filesystem/network isolation.

#### WI-006 accepted slice — Workspace and resource choice

The accepted WI-006 UI distinguishes no-folder, multi-root, remote-host, non-file, untrusted and eligible states, with native folder/trust recovery and editor-title/Command Palette focus actions. The host keeps resource choice in memory, bound to workspace identity; view recreation retains it, while identity/eligibility changes and host reload clear it. Trust is never granted automatically and the Webview supplies no arbitrary path.

WI-006 originally recorded the choice without starting pi; WI-007 then added choice-driven runtime startup. Zero runtime starts is the historical WI-006 acceptance boundary, not a current product requirement. See [WI-006/WI-007 history](archive/2026-09-21-closed-wi-history.md) for original scope and acceptance, and the [message contract](reference/webview-messages.md) for current transitions and native-action completion. Full REQ-001 and the related gates remain unaccepted.

### REQ-002 — Model readiness

Show the selected provider/model and allow selection among available configured models. Reuse existing pi authentication for the initial release. With no usable model, missing credentials or authentication failure, explain the problem and recovery path without exposing credentials in HTML, logs or webview messages. Do not silently switch provider. A successful configuration display is not proof that the next request will succeed.

#### WI-008/WI-009 approved slice — Model and thinking selection

On the WI-004 chat composer, a **single combined model · thinking chip** opens an **anchored popover** with a collapsible model list from `get_available_models` and a discrete thinking slider from `get_available_thinking_levels`. The approved WI-009 styling uses a thick slider with fixed `#168BFF` fill/thumb, no yellow focus outline, and a blue keyboard-focus halo; the remaining surface uses theme tokens.

Maintainer approved **while-streaming selection for the next turn only** on 2026-09-21. Selection requires ready runtime, matching generation, and neither workspace `busy` nor `modelBusy`; `chatBusy` alone does not disable it. Idle choices apply immediately. While streaming, keep the applied chip unchanged and show separate pending intent (latest choice per field wins). After `agent_settled`, apply model first, refresh capabilities, then apply the requested thinking level only if supported; block sending and further selection during application. Failures show bounded errors and read back actual state, never silently claim success or retry a mutation. No credential UI, startup-default persistence, or native Quick Pick. Precise lifecycle/error rules: [webview contract](reference/webview-messages.md).

The maintainer confirmed idle selection, baseline UI, and the deferred-selection main path at 19:44 on 2026-09-21: the current reply stays unchanged, settings apply after settlement, and the next message uses them. WI-008/WI-009 still await consolidation and explicit closure; approval/Stop interleavings, failed readback and restart cleanup lack complete independent manual coverage. See the current handoff in [`ACTIVE.md`](../ACTIVE.md).

### REQ-003 — Explicit editor context

Allow users to attach a workspace file or selected code with its path and line range, inspect the attached context and remove it before sending. Proposed behavior: capture current editor contents, including unsaved edits, at send time; explain unavailable/deleted files rather than silently substituting stale disk content. The exact context scope must be visible; do not automatically attach unrelated open files. Apply D-04's text-only workspace attachment, unsaved-content and selection-change boundaries; external-path attachments are deferred. Define exact per-attachment and aggregate size limits before implementing this slice.

### REQ-004 — Observable task execution

Send a text task and render streamed responses and tool activity. Distinguish running, awaiting approval, retrying, compacting, completed, stopped and failed states when relevant. Show tool identity, target and result with bounded output and protected secrets. An accepted prompt is not a completed task; do not display completion while queued continuation or automatic retry remains.

#### WI-004 accepted slice — Text streaming

Accept bounded plain text when the runtime is ready and display incremental assistant text. Reuse existing pi configuration; model/credential/provider failures need bounded recovery information with secrets protected. Display request acceptance separately from task completion; clear invalidated runtime transcripts and reject late events. The [message contract](reference/webview-messages.md) owns exact messages and completion boundaries.

[WI-004 history](archive/2026-09-21-closed-wi-history.md#wi-004) preserves approval, acceptance and exclusions for the minimal slice. Its original `--no-tools` profile was replaced by WI-010 controlled execution. Model selection, Stop and approvals came from later approved slices; attachments and session history remain outside this delivery. Original version research remains in [0.85.1 RPC evidence](discussions/2026-09-21-wi-004-rpc-evidence-0.85.1.md).

### REQ-005 — Stop and recovery

Provide a stop-all action that clears queued continuation and requests cancellation of active work. Show stopping until the runtime settles or a shutdown failure is reported. Cancellation does not undo completed side effects. A disconnected/crashed runtime must leave an explicit interrupted state; preserve unsent input and do not automatically repeat a possibly side-effecting task. Restart/retry actions must be deliberate.

### REQ-006 — Execution approval strategies

Propose two initial strategies: **Ask before actions** and **Unrestricted execution**. The former uses a confirmed policy to allow, ask or deny covered tool calls; the latter skips per-tool prompts but retains project trust and secret protections. The default policy is confirmed in D-01 below; exact tool coverage still needs verification, while approval scope and lifetime are confirmed in D-02. No automatic-risk classifier or Codex-equivalent sandbox is promised.

For a covered approval-required call, do not execute before approval. Show the tool, target/command and meaningful input. Rejecting, dismissing or timing out must not approve it. Stop/disconnect must cancel pending approvals; late replies must not authorize a different call. Offer one-call approval and, where the scope can be reliably displayed and matched, approval for the current live session as defined in D-02. Session approval is not Unrestricted execution. A mode change must not silently approve an already pending action.

Third-party extensions can execute code outside ordinary tool calls. Their trust and coverage must be disclosed; do not claim all extension code, shell subprocesses or network activity is constrained by the approval UI. Approval coverage must pass a spike before this requirement can be accepted.

#### WI-010 approved slice — Thinking and controlled execution (closed, 2026-09-21)

This REQ-004/REQ-005/REQ-006 slice approves actual tool execution under D-01/D-02. The controlled profile loads only the bundled approval extension and disables third-party extension discovery; project-resource consent cannot re-enable it or authorize tools. Full Unrestricted execution remains deferred; other context and trusted user configuration are not all excluded.

Show only upstream-provided thinking text/summary. Collapsible thinking/tool cards use stable incremental rendering that preserves expansion, focus and scroll; final messages reconcile text and cumulative output replaces prior snapshots. Tool start means preparing, not proof of side effects. Approvals show complete meaningful input; bounded output discloses truncation, and aggregate overflow never skips approval. Stop preserves unsent drafts.

The approved automatic allowance covers only canonical in-workspace regular-file `read`. Search/list, edits/writes, shell and external paths ask; unknown tools deny. Nonexistent or unresolvable targets allow one-call approval only. Session file grants match tool category and canonical path; shell grants match tool, canonical cwd and complete input/conditions, without directory or command-prefix widening. Grants are inspectable/revocable and follow D-02 lifetimes.

Missing approval components or unverified handshake block startup; the UI cannot claim readiness. Oversized, unreviewable or credential-like approval inputs deny execution. Stop cancels pending approvals, clears queued continuation and requests abort; display stopping until settled or explicit failure/shutdown, without automatic replay of potentially side-effecting work. Canonicalization cannot remove filesystem replacement races; Stop neither rolls back nor guarantees every descendant exits. This is an execution policy, not a sandbox. Output filtering is best-effort; trusted user credential commands remain outside tool-approval coverage.

[WI-010 closure](archive/2026-09-21-closed-wi-history.md#wi-010) owns the four F5 observations and historical automated/offline/package evidence. Those F5 checks support scoped closure; the full grant/lifecycle matrix, installed-VSIX acceptance and boundary ADR remain pending in ACTIVE. [Architecture §7](architecture/vscode-extension-architecture.md) owns responsibilities; the [contract](reference/webview-messages.md) owns messages, bounds, handshake and cancellation ordering. This slice does not promote the whole PRD or gates to Accepted.

### REQ-007 — Post-edit change review

Expose affected files and a way to inspect relevant differences and navigate to source. Clearly say changes have already been applied; do not present post-edit diff as pre-edit approval. Preserve existing user modifications and do not attribute the entire dirty working tree to the agent. When command-induced changes cannot be reliably attributed, disclose that limitation instead of claiming complete task-only coverage. No universal undo or automatic Git reset/stash is included.

### REQ-008 — Session continuity

Support a new conversation and deliberate restoration of a known session previously used by this extension, including history and project identity. Reloading the view must not silently start a duplicate task. Missing/unavailable sessions receive a recoverable error. Do not resume a session into a different project silently. Use pi session APIs; do not parse or rewrite session files. Full pi-history discovery, concurrent sessions and branching UI are deferred.

## Product decisions and open questions

- **D-01 — Initial approval policy (confirmed by the maintainer, 2026-09-19).** Default to Ask before actions; automatically allow covered read-only workspace file operations, ask for edits/writes, shell execution and external-path access. This is a tool policy, not a guarantee that shell cannot escape or use the network. Exact tool coverage and failure behavior need verification.
- **D-02 — Approval scope and lifetime (confirmed by the maintainer, 2026-09-19).** Offer **Allow once** and **Allow this scope for this session**; no persistent allowlist in the first release. Display the scope independently from its lifetime. These are this product's rules informed by reference tools, not a claim of identical behavior across their clients.
  - One-call approval binds to the pending call and its arguments; it cannot authorize another call.
  - Session file grants bind to an explicit operation category and file path within the active workspace/session identity. They permit subsequent matching operations, not only the original diff; no implicit directory-wide or shell authorization. External-path access must separately show the target and read/write category and cannot inherit an in-workspace grant.
  - Session shell grants bind to the working directory, complete command and relevant execution conditions; do not automatically widen them to command prefixes. Matching a command does not prove its referenced scripts or effects are unchanged. If scope cannot be reliably represented and matched, offer Allow once only.
  - A session means the current running agent-session instance in its workspace, not a permanently saved transcript. Hiding/reopening the sidebar preserves grants only while that backend session remains alive. Turn completion or Stop does not itself clear granted session permissions; Stop still cancels pending requests.
  - New/switch session, workspace switch or runtime restart clears grants. Restoring a historical session requires fresh approval; do not restore temporary grants from the transcript. Users can inspect and revoke grants; revocation affects subsequent calls, not completed side effects.
  - Acceptance must verify same-scope reuse, re-prompting on changed scope, expiry on the lifecycle events above and protection against late approval replies. The exact matching implementation remains subject to the approval spike. Unrestricted execution is a separate mode governed by the confirmed D-02 addendum below, not inferred from session grants.
  - **Mode lifecycle addendum (confirmed by the maintainer, 2026-09-19):** newly created or re-established runtime sessions start in Ask before actions. Historical-session restoration, runtime restart, extension-host reload and workspace switch do not automatically restore Unrestricted execution. An optional notice may mention the previous mode, but enabling it requires explicit user selection and a warning about direct file/command execution under the user's environment permissions, not isolation.
  - While the same backend session remains alive, hiding/reopening the sidebar, ordinary turn completion and Stop preserve the current mode. Keep Unrestricted execution visibly indicated and allow switching back at any time.
  - Switching to Unrestricted execution must not automatically approve already pending requests. Switching back to Ask before actions applies to subsequent tool calls; it does not undo side effects or stop an already running operation. Use Stop for cancellation.
  - The first release has no permanent Unrestricted-execution default. Project configuration and conversation history must not silently enable it. Acceptance must test reset and preservation boundaries, pending-request handling and the visible mode/warning.
- **D-03 — Resource trust refusal (confirmed by the maintainer, 2026-09-19).** Allow a clearly labeled session without project-local pi resources when VS Code itself trusts the workspace; otherwise do not start. Keep tool approval independent. Verify resource-loading boundaries at startup and session switch; this product decision does not certify runtime behavior.
- **D-04 — Release boundaries (confirmed by the maintainer, 2026-09-19).** Deliver a local workflow covering explicit context, model selection, streaming execution, approval/stop, post-edit review and known-session restoration within the following boundaries:
  - One local workspace folder, with or without Git. No-folder and multi-root states must be explained rather than silently choosing a project. Remote SSH, Dev Containers and WSL extension-host environments are deferred. This project boundary is not filesystem isolation; external-path tool access remains governed by D-01/D-02.
  - Reuse existing pi credentials and model configuration; defer full login/configuration UI. Explain missing credentials, unavailable models and authentication failures, link to pi configuration instructions, and provide an explicit refresh/reconnect recovery path after external configuration. Do not reimplement credential storage or expose secrets to the webview.
  - One active runtime session per VS Code window, not one saved conversation. Support new conversations and choosing among sessions previously used by this extension in the current project. Before switching, stop active work and wait for a settled state; leave no hidden task running. Restore history under D-02's permission/mode reset rules, not historical code state. Parallel sessions, branching UI and global pi-history discovery are deferred.
  - Post-edit review complements, rather than replaces, pre-action approval. Provide affected-file entry points, relevant text diffs and source navigation; label changes as already applied. No per-hunk accept/reject workflow, universal undo, automatic Git reset/stash or checkpoint rollback is promised.
  - Attach only explicit workspace text files or selections with visible paths/ranges, preview and removal. Do not automatically attach unrelated open files. Images, PDFs, recursive directory attachments and external-path attachments are deferred. Unsaved editor contents may be context but must not be automatically saved; disclose possible differences from runtime disk reads. Track changed selections reliably or require reattachment, never silently reuse stale line ranges. Enforce per-attachment and aggregate limits with actionable rejection, not silent truncation; determine exact values in REQ-003 Prepare before Build.
  - Distinguish tool-confirmed target files from workspace changes observed during a task. Preserve pre-existing user changes; Git-versus-HEAD diffs are workspace diffs, not automatically task-only diffs. Show before/after text differences where reliable capture is possible, and disclose shell/concurrent-edit attribution limits. Complete task-only attribution is not promised, but merely linking to Git does not satisfy review. Resolve concrete attribution acceptance in REQ-007 Prepare before Build.

## Technical evidence and validation gates

The capability review used the installed pi `0.85.1` public README and docs (`rpc.md`, `sdk.md`, `extensions.md`, `skills.md`), not a latest-branch assumption. It was documentation research, not end-to-end runtime verification.

RPC documents prompting, streaming/tool events, queue clearing and abort, model selection, compaction/statistics, session switching/history and extension UI dialogs. Public SDK documents session enumeration and authentication operations that are not equivalent to built-in RPC commands. Editor attachments and review UI are host responsibilities. Permission prompts, plan mode, MCP and code checkpoints are extension work, not built-in equivalent features. Session fork is not code rollback.

Before accepting the relevant slices, verify: project trust at startup and session switch; covered tool interception with denial/cancellation/late responses; stop-all behavior; safe known-session restoration; dirty-workspace diff attribution. Use approved spikes and public APIs. An SDK helper or bundled pi extension needs an explicit boundary assessment; this PRD does not change the current subprocess decision or close any gate. See [architecture gates](reference/architecture-gates.md).

## Traceability to work

A release direction may span future WIs, but only one implementation WI is active. Unassigned requirements are proposals, not a backlog authorization.

| WI ID | PRD scope | Acceptance / status |
|-------|-----------|---------------------|
| WI-001 | None — technical spike | See [archive](archive/2026-09-21-closed-wi-history.md); no chat in that historical slice |
| WI-002 | None — ping/pong scaffold | See [archive](archive/2026-09-21-closed-wi-history.md); no chat in that historical slice |
| WI-003 | Technical-only trust spike informing REQ-001 / D-03; no product delivery | Maintainer accepted 2026-09-19; six scenarios passed, limits in archive and ACTIVE; gate Open |
| WI-005 | None — documentation tooling | Checks passed; maintainer accepted 2026-09-19 |
| WI-006 | REQ-001 pre-runtime workspace/resource-choice UI slice (Draft) | Build approved 2026-09-19; maintainer F5 accepted 2026-09-21; no runtime startup |
| WI-007 | REQ-001 runtime startup from in-memory resource choice (Draft) | Build approved; maintainer F5 accepted 2026-09-21; `get_state` readiness only; no chat |
| WI-004 | REQ-004 | Closed 2026-09-21; minimal streaming slice accepted — see [archive](archive/2026-09-21-closed-wi-history.md#wi-004) |
| WI-008 | REQ-002 | Idle and deferred-selection main paths F5 confirmed; boundary matrix and formal closure still pending — see ACTIVE |
| WI-009 | REQ-004, REQ-002 (restyle plus approved deferred-selection behavior) | Baseline UI and deferred-selection main path F5 confirmed; boundary matrix and formal closure still pending — see ACTIVE |
| WI-010 | REQ-004 / REQ-005 / REQ-006 (thinking, controlled execution and Stop) | Closed 2026-09-21 after four maintainer F5 checks; historical automated/offline/package evidence in archive; installed VSIX and remaining manual matrix pending; ADR pending, gates Open |
| Unassigned | REQ-003, REQ-007–REQ-008 and remaining full REQ-004–REQ-006 scope | First-release proposal only; assign approved slices before Build |

| REQ ID | Observable acceptance target | Scope |
|--------|------------------------------|-------|
| REQ-001 | Show project/trust before execution; block ineligible workspaces | Workspace/startup slices separately accepted |
| REQ-002 | Display/select available model/thinking; show next-turn intent while busy | WI-008/WI-009; full requirement remains Draft |
| REQ-003 | Explicitly attach, preview and remove workspace text/selections | No WI assigned |
| REQ-004 | Show streamed text, actual activity and bounded errors; separate acceptance from completion | WI-004/WI-009/WI-010 slices |
| REQ-005 | Stop queued/active work, show stopping and its outcome, preserve drafts | WI-010 slice |
| REQ-006 | Review full input before execution, grant exact once/session scope and revoke grants | WI-010 slice; Unrestricted execution postponed |
| REQ-007 | Review applied changes and available diffs with attribution limits | No WI assigned |
| REQ-008 | Deliberately create/restore this extension's known sessions in the correct project | No WI assigned |

## Non-goals and deferred capabilities

- Vendor cloud execution, account subscriptions and billing replication.
- Reimplementing pi's agent loop, provider stack, compaction or session storage.
- Automatic risk approval, sandbox guarantees, universal rollback or pre-edit line-by-line approval in this proposal.
- Full authentication UI, global history search, multiple concurrent sessions, multi-root and remote-environment support as initial release commitments.
- Native plan mode, subagents, MCP marketplace, rich attachments and checkpoint UX until separately scoped and verified.
- Editor-tab chat as the default, or native VS Code Chat Participant as the sole UI; optional surfaces remain deferred.

## Requirement lifecycle and approval

Draft behavior before requesting approval; lack of approval is not a reason to leave the PRD empty. Before a WI enters Build, record whether it is user-visible, link its selected requirements and observable acceptance, resolve relevant decisions, and obtain maintainer confirmation. Technical-only WIs record why no new product requirement is needed. At Close, reconcile actual behavior against the approved slice and record deferred differences.

Do not promote this mixed, unresolved proposal wholesale. Before promotion, separate unresolved/deferred candidates from the explicitly approved scope and make approval boundaries unambiguous in both languages. Only then mark the agreed scope Accepted with maintainer authorization, update WI traceability, and run `npm run docs:verify`. Gate closure and user acceptance remain separate. If a requirement is superseded, preserve the reason and replacement reference following [archive rules](archive/README.md).
