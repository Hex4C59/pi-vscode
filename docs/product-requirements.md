# pi VS Code — Product requirements

English | [中文](product-requirements.zh.md)

- Type: Product requirements
- Status: **Draft**
- Created: 2026-09-19
- Authority: user-visible scope and acceptance only after explicit maintainer approval; this draft does not authorize implementation
- Related: [`../ACTIVE.md`](../ACTIVE.md), [`architecture/`](architecture/), [`guides/agent-collaboration.md`](guides/agent-collaboration.md)

> On 2026-09-19 the maintainer agreed with the product direction and authorized drafting this proposal. D-01 (initial approval policy), D-02 (approval scope, lifetime and Unrestricted-execution mode lifecycle), D-03 (continuing without project resources), and D-04 (first-release boundaries) were explicitly confirmed on 2026-09-19. The release boundaries are approved; detailed slice acceptance, technical validation, Build authorization and promotion of this entire PRD to Accepted remain outstanding. WI-005 was accepted by the maintainer on 2026-09-19; WI-003's technical trust spike passed its checks and was accepted by the maintainer on 2026-09-19; documented limitations remain, with no product UI delivery or gate closure. Technical scaffolding is not end-user chat delivery.

## Product direction (agreed)

Provide a local IDE agent workflow close to Claude Code / Codex, using **pi as the runtime**. Prioritize context input, task execution, process control, change review and session continuity, rather than reproducing vendor cloud services. The extension presents and orchestrates documented pi capabilities; it does not reimplement the agent loop, providers or session format.

Keep Explorer on the left and prefer the secondary sidebar for chat. Optional editor tabs do not imply changing the default layout. Reference clients inspire observable workflows, not pixel parity or unsupported security promises.

## First usable release (boundaries confirmed; detailed slices Draft)

The initial target user develops in a local VS Code folder and already has working pi provider credentials. They can identify the active project and model, attach relevant code, request a focused change, observe and stop execution, inspect modifications, and later resume the known conversation.

Confirmed D-04 limits: one local workspace folder (Git or non-Git) and one active runtime session per VS Code window; text plus explicit workspace text-file/selection context; existing pi credentials; post-edit review and restoration of this extension's known sessions in the current project. Full provider login UI, multi-root workspaces, remote environments and parallel conversations are not first-release commitments. These approved boundaries do not authorize Build or certify technical feasibility; detailed slices below remain Draft.

## Candidate requirements and acceptance

Every requirement below is Draft. IDs make discussion traceable, not implementation-ready. Before Build, assign the selected slice to one WI, resolve its open decisions and record approval in ACTIVE.

### REQ-001 — Project and trust visibility

Show the active workspace folder before running a task. With no folder, explain how to open one and do not start a project task. Unsupported multi-root cases receive a clear explanation rather than silently selecting a folder. On workspace changes, do not silently continue the old task in the new project.

Distinguish VS Code workspace trust, pi project-resource trust and tool approval. Per confirmed D-03, do not start the agent in a VS Code untrusted workspace; do not silently trust pi project resources. When VS Code trusts the workspace but pi resource trust is declined, allow the session to continue with a visible indication that project-local pi resources are not loaded. This does not prevent ordinary project-file reads or imply that all context files and user/global resources are excluded; verify the exact pi loading boundary before implementation. Never describe resource trust as filesystem/network isolation.

#### WI-006 proposed slice — Pre-runtime workspace and resource choice (Draft)

Show the current local folder and explicit blocked states for no folder, multi-root, remote extension hosts (even with file URIs), non-file workspaces and VS Code untrusted workspaces. Offer native folder selection and manage-workspace-trust entry points, with cancellation and recoverable errors. In an empty local window, add the selected folder using the public workspace API; request acceptance is not proof of completion, so render authoritative state after workspace change or host restart. Provide an editor-title Pi icon (navigation group) that reveals the existing container and focuses its view without toggling or duplication; retain the Command Palette fallback when no editor is open. Never grant VS Code trust automatically.

For an eligible workspace, offer explicit allow/decline project-resource choices with risk and residual-context explanations. Keep the choice only in host memory, bound to workspace identity/generation; preserve it across view recreation, clear it on host reload, workspace change or eligibility loss, and reject stale-page actions. Permit changing the choice before startup. Do not persist pi trust or accept arbitrary paths/commands from the webview.

**This slice never starts pi.** Both choices must visibly say that the choice is recorded but the runtime has not started; do not claim resources have loaded or a session is ready. Test zero runtime starts, invalid/stale messages, escaped paths, lifecycle cleanup and native-command cancellation/errors. Actual approve/no-approve startup integration and remaining resource-category validation require a later approved slice; WI-006 does not complete REQ-001 or close a gate. Detailed proposal and manual acceptance are in ACTIVE.

### REQ-002 — Model readiness

Show the selected provider/model and allow selection among available configured models. Reuse existing pi authentication for the initial release. With no usable model, missing credentials or authentication failure, explain the problem and recovery path without exposing credentials in HTML, logs or webview messages. Do not silently switch provider. A successful configuration display is not proof that the next request will succeed.

### REQ-003 — Explicit editor context

Allow users to attach a workspace file or selected code with its path and line range, inspect the attached context and remove it before sending. Proposed behavior: capture current editor contents, including unsaved edits, at send time; explain unavailable/deleted files rather than silently substituting stale disk content. The exact context scope must be visible; do not automatically attach unrelated open files. Apply D-04's text-only workspace attachment, unsaved-content and selection-change boundaries; external-path attachments are deferred. Define exact per-attachment and aggregate size limits before implementing this slice.

### REQ-004 — Observable task execution

Send a text task and render streamed responses and tool activity. Distinguish running, awaiting approval, retrying, compacting, completed, stopped and failed states when relevant. Show tool identity, target and result with bounded output and protected secrets. An accepted prompt is not a completed task; do not display completion while queued continuation or automatic retry remains.

#### WI-004 proposed slice — First user text and assistant text streaming (Draft)

After WI-007 runtime readiness (`workspaceState.runtime === "ready"`), allow sending **bounded plain user text** and show **incremental assistant text** in the sidebar webview. Use the pinned pi `0.85.1` subprocess JSONL RPC: host sends `prompt`; adapter maps `message_update` events where `assistantMessageEvent.type === "text_delta"` into host-owned transcript state; end the visible streaming turn on `turn_end` (or an equivalent documented event). Treat the `prompt` command `response` as acceptance/rejection only, not completion.

Start the runtime with public `--no-tools` until REQ-006 approval UI exists; label the UI as no-tools / not a full agent and do not claim sandbox isolation. Reuse existing pi credentials/configuration; show bounded recovery text on model/credential/provider failure without secrets in the webview or logs. Clear in-memory transcript on workspace identity/eligibility change, runtime stop or provider dispose; reject stale webview sends and late events from a prior runtime generation.

**This slice does not deliver:** model picker (REQ-002), editor attachments (REQ-003), Stop (REQ-005), tool approval UI (REQ-006), tool activity/retry/compaction states, session history (REQ-008), `abort`/`steer`, images or extension-command bridging. Detailed proposal, gates and Build approval live in [`ACTIVE.md`](../ACTIVE.md). Public RPC evidence for the pin is in [WI-004 RPC evidence (0.85.1)](discussions/2026-09-21-wi-004-rpc-evidence-0.85.1.md).

### REQ-005 — Stop and recovery

Provide a stop-all action that clears queued continuation and requests cancellation of active work. Show stopping until the runtime settles or a shutdown failure is reported. Cancellation does not undo completed side effects. A disconnected/crashed runtime must leave an explicit interrupted state; preserve unsent input and do not automatically repeat a possibly side-effecting task. Restart/retry actions must be deliberate.

### REQ-006 — Execution approval strategies

Propose two initial strategies: **Ask before actions** and **Unrestricted execution**. The former uses a confirmed policy to allow, ask or deny covered tool calls; the latter skips per-tool prompts but retains project trust and secret protections. The default policy is confirmed in D-01 below; exact tool coverage still needs verification, while approval scope and lifetime are confirmed in D-02. No automatic-risk classifier or Codex-equivalent sandbox is promised.

For a covered approval-required call, do not execute before approval. Show the tool, target/command and meaningful input. Rejecting, dismissing or timing out must not approve it. Stop/disconnect must cancel pending approvals; late replies must not authorize a different call. Offer one-call approval and, where the scope can be reliably displayed and matched, approval for the current live session as defined in D-02. Session approval is not Unrestricted execution. A mode change must not silently approve an already pending action.

Third-party extensions can execute code outside ordinary tool calls. Their trust and coverage must be disclosed; do not claim all extension code, shell subprocesses or network activity is constrained by the approval UI. Approval coverage must pass a spike before this requirement can be accepted.

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
| WI-001 | None — technical spike | See ACTIVE; no user chat |
| WI-002 | None — ping/pong scaffold | See ACTIVE; no user chat |
| WI-003 | Technical-only trust spike informing REQ-001 / D-03; no product delivery | Maintainer accepted 2026-09-19; six scenarios passed, limits retained in ACTIVE; gate Open |
| WI-005 | None — documentation tooling | Checks passed; maintainer accepted 2026-09-19 |
| WI-006 | REQ-001 pre-runtime workspace/resource-choice UI slice (Draft) | Build approved 2026-09-19; maintainer F5 accepted 2026-09-21; no runtime startup |
| WI-007 | REQ-001 runtime startup from in-memory resource choice (Draft) | Build approved; maintainer F5 accepted 2026-09-21; `get_state` readiness only; no chat |
| WI-004 | REQ-004 | Closed 2026-09-21; minimal streaming slice accepted — see [archive](archive/2026-09-21-closed-wi-history.md#wi-004) |
| Unassigned | REQ-002, REQ-003, REQ-005–REQ-008 (full slices) | First-release proposal only; assign approved slices before Build |

| REQ-004 | WI-004 slice: bounded user text send when RPC runtime is ready; incremental assistant text; `--no-tools` startup; bounded errors without secrets | Draft slice delivered WI-004; full REQ-004 still deferred |

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
