# Architecture gates

English | [中文](architecture-gates.zh.md)

- Type: Reference
- Status: Living
- Created: 2026-09-19
- Last reviewed: 2026-09-22 (clarified status semantics and gate scopes; no status changes)
- Authority: which architectural risks require evidence plus an Accepted ADR before their conclusions may be treated as established
- Related: [`../architecture/vscode-extension-architecture.md`](../architecture/vscode-extension-architecture.md), [`ACTIVE.md`](../../ACTIVE.md)

## What an architecture gate means

An architecture gate is a tracked question about a consequential technical risk or boundary. It records when the repository has enough evidence and an explicit decision to rely on a narrowly stated architectural conclusion in later work.

A gate is not a test, a work item, or a synonym for feature completion:

- **Tests** provide evidence for the scenarios they cover; they do not prove every host, package, provider, lifecycle interleaving or security property.
- **A spike** is a bounded experiment used to discover uncertain behavior in a real dependency, host, build or process boundary. It supplies facts; it is not automatically product code or acceptance.
- **A work item (WI)** defines a scoped unit of work and its acceptance. One gate may collect evidence across several WIs, and a completed WI does not automatically accept a related gate.
- **Manual acceptance** supplies evidence that cannot be established by isolated tests, such as behavior in a real VS Code Extension Development Host or an installed VSIX. Its scope must be recorded rather than generalized.
- **An ADR** records the maintainer-confirmed architectural choice, rationale, alternatives, consequences, evidence and known limits. The ADR must be `Accepted` before a gate can be `Accepted`.

Evidence supports a decision, but no single evidence type automatically changes gate status. In particular, passing tests do not automatically complete a WI or accept a gate, and working F5 behavior does not verify an installed package or the complete boundary.

People may informally say that an Accepted gate is "closed." The canonical status stored in this table is `Accepted`. Acceptance applies only to the exact gate scope; it must not be expanded into a claim that adjacent product features, security properties or deployment environments are complete.

## Status values

### `Open`

The architectural conclusion is not yet established. The solution may be undecided, partially implemented, or apparently working while evidence, boundary analysis, maintainer confirmation or an Accepted ADR is still missing.

`Open` does **not** mean that no code or tests exist. It means later work must not rely on the full gate conclusion as settled, and documentation must not describe that scope as architecturally accepted.

### `In spike`

A bounded technical investigation is active. The spike must state the question, version/environment, success and failure observations, and limits of what it proves. Examples include verifying an upstream API, subprocess shutdown, Webview CSP/resource loading, or the behavior of a packaged artifact.

`In spike` does not mean "almost Accepted" or user-visible delivery. A failed or inconclusive spike may return the gate to `Open`; a successful spike is evidence to review, not an automatic status transition.

### `Accepted`

The exact gate conclusion has sufficient scoped evidence, known limitations are recorded, the maintainer has confirmed the architectural choice, and the ADR column links an **Accepted** ADR. Acceptance permits later work to rely on that narrow conclusion until superseded; it does not erase the ADR's exclusions or prove broader product maturity.

Changing a gate to `Accepted` therefore requires both the evidence appropriate to its risk and the formal decision record described in [`../decisions/README.md`](../decisions/README.md). If verification or approval is incomplete, keep the gate `Open` or `In spike` and record the missing condition in `ACTIVE.md`.

## Status summary

| Gate ID | Question tracked | Status | ADR | ACTIVE |
|---------|------------------|--------|-----|--------|
| `gate-extension-host-baseline` | Can the extension build, activate and run under the supported VS Code extension-host baseline? | `Accepted` | [0001](../decisions/0001-build-baseline.md) | — |
| `gate-sidebar-chat-shell` | Can the Pi Webview View be contributed and displayed in the Secondary Side Bar, with the documented fallback direction? | `Accepted` | [0001](../decisions/0001-build-baseline.md) | — |
| `gate-runtime-host` | Which pi hosting boundary is used, and can it start, complete an RPC round-trip and shut down within a bound? | `Accepted` | [0001](../decisions/0001-build-baseline.md) | — |
| `gate-webview-trust` | Is the low-trust Webview ↔ privileged extension-host boundary completely specified and sufficiently verified? | `Open` | — | — |
| `gate-project-trust` | Are VS Code workspace trust, pi project-resource consent and tool approval separated and mapped through public APIs? | `Open` | — | — |
| `gate-session-streaming` | Is the end-to-end chat stream and its completion, cancellation, replacement and failure lifecycle sufficiently verified? | `Open` | — | — |

## Gate details

### `gate-extension-host-baseline`

**Question.** Establish a reproducible extension-host foundation: strict TypeScript checking, esbuild output at the manifest entry, F5 activation in the Extension Development Host, and the baseline build/package direction for VS Code 1.85+.

**Accepted evidence and decision.** WI-001 recorded the build configuration and maintainer-observed F5 activation; [ADR 0001](../decisions/0001-build-baseline.md) accepted that baseline on 2026-09-19.

**Does not establish.** It does not prove every compatible fork, operating system or installed-VSIX scenario; it does not accept end-user chat, Webview trust, runtime streaming or release readiness. Later packaging evidence belongs to its own recorded scope and does not rewrite WI-001 evidence.

### `gate-sidebar-chat-shell`

**Question.** Establish that the extension can register `pi-vscode.chat` through `WebviewViewProvider` in the preferred Secondary Side Bar, with a documented primary-sidebar fallback direction, and display the initial Webview shell.

**Accepted evidence and decision.** WI-001 included maintainer-observed F5 display of the Pi placeholder view; [ADR 0001](../decisions/0001-build-baseline.md) accepted the shell and placement decision.

**Does not establish.** This gate covered the initial shell, not the later full chat UI. It does not accept the complete `postMessage` trust boundary, streaming, controlled execution, accessibility matrix or current visual implementation.

### `gate-runtime-host`

**Question.** Choose the boundary by which the extension hosts pi and prove a minimum lifecycle: locate and start the pinned runtime, exchange one LF-delimited JSON RPC request/response, and terminate within a bound.

**Accepted evidence and decision.** The WI-001 runtime spike exercised `get_state` and bounded shutdown against the then-pinned package. [ADR 0001](../decisions/0001-build-baseline.md) selected a subprocess RPC boundary rather than reimplementing the agent loop in the extension host.

**Does not establish.** It does not prove long-lived sessions, every provider, complete Stop semantics, retry/compaction ordering, tool approvals, crash recovery or cancellation of every descendant process. Package-version-specific historical evidence remains limited to the recorded version and environment.

### `gate-webview-trust`

**Question.** Establish the trust boundary between browser-like Webview code and the privileged extension host. The intended conclusion includes a versioned and allowlisted message contract; runtime validation of all inbound `unknown` values; restrictive CSP and controlled local resources; no credentials, Node APIs, filesystem/shell access or pi SDK in the Webview; bounded host-owned outbound DTOs; rejection of stale views/generations; and no generic command or RPC bridge.

**Evidence expected.** Contract and parser tests, malformed/unknown/oversized/stale message coverage, CSP and resource-loading checks, secret-isolation review, lifecycle cleanup checks, and applicable F5 or packaged-host verification. Ownership must remain UI intent in `src/webview/` and privileged validation/state in `src/extension/`. See [`webview-messages.md`](webview-messages.md).

**Current status and limits.** Substantial protocol, CSP, generation, bounded-projection and UI evidence exists, but the contract remains `Outline`, architecture records retain unverified real-host/fork and lifecycle/security boundaries, and no Accepted ADR closes the complete trust conclusion. Therefore this gate remains `Open`; existing chat behavior must not be generalized into full Webview trust verification.

### `gate-project-trust`

**Question.** Establish how a VS Code workspace maps to pi project-resource consent using public APIs while keeping three concepts distinct: VS Code workspace trust, pi project-resource consent, and per-tool approval. The boundary must address no-folder, multi-root, remote extension host, non-file URI, trust changes, workspace generation/replacement, and allow/decline behavior without fabricating or persisting upstream trust.

**Evidence expected.** Public-API evidence for supported pi resource flags/behavior, host-state and stale-operation tests, real VS Code trust/reload and folder-transition checks, and an explicit decision describing what allow and decline do and do not authorize.

**Current status and limits.** Workspace eligibility and in-memory resource choice are implemented and tested in bounded slices, but real-host coverage and the complete boundary decision remain incomplete. Allowing resources is not tool authorization; declining resources does not imply that all project context is excluded. Neither choice is a filesystem/network sandbox. The gate remains `Open`.

### `gate-session-streaming`

**Question.** Establish the end-to-end lifecycle over `Webview → host → adapter → runtime` and back: prompt acceptance versus completion, event correlation and ordering, bounded projections, the authoritative settled boundary, retries/compaction/queued continuation, Stop and cancellation, runtime failure, session/runtime replacement, stale events, cleanup and recoverable errors.

**Evidence expected.** Adapter and host tests for event ordering, late completion, cancellation and replacement; real-runtime probes for upstream semantics; F5 checks for observable streaming/Stop/failure behavior; applicable packaged-host evidence; and an Accepted decision fixing the completion and ownership boundaries.

**Current status and limits.** Plain-text streaming, activity projection, `agent_settled`, controlled execution and Stop have bounded implementation and recorded automated/spike/F5 evidence. However, installed-VSIX validation, external-provider breadth, exhaustive lifecycle interleavings and the pending boundary ADR remain incomplete. A visible text delta or a completed WI does not by itself accept the full session lifecycle, so this gate remains `Open`.

## Adding or replacing a gate

Add a gate only when a newly identified issue is a consequential architectural risk or boundary that later work must be prevented from treating as settled too early. Typical candidates involve trust, process or deployment models, persistence, upstream integration, lifecycle/concurrency, or another hard-to-reverse foundation that is likely to need evidence across more than one change. Ordinary feature tasks, visual choices, refactors and isolated regressions belong in a WI and tests, not in a new gate.

Before adding one:

1. **Check existing coverage.** Prefer clarifying an existing gate when the new question is part of the same risk and would share its decision. Do not create gates named after a WI, framework or proposed answer merely to track implementation work.
2. **Define a stable question.** Use `gate-<architectural-topic>` and phrase the summary as the risk to establish, not the desired solution—for example a delivery boundary rather than `gate-use-react`.
3. **Define evidence and exclusions.** The detailed entry must state the question, evidence expected, current status/limits, and what acceptance would not establish. Evidence should match the risk rather than follow a universal checklist.
4. **Link active ownership.** Record the gate ID, decision class and missing conditions in the relevant current WI in `ACTIVE.md`. A gate may span several WIs, but only one current WI remains active under WIP=1.
5. **Start conservatively.** A new gate normally starts `Open`. Use `In spike` only when a bounded investigation with a stated question, environment and limits is actually active. Do not create a gate directly as `Accepted` merely because implementation already exists.
6. **Require the formal decision.** Move to `Accepted` only after the maintainer confirms the architectural choice, sufficient scoped verification is recorded, and the summary links an Accepted ADR.

A framework choice or other ADR-worthy decision does not automatically need its own gate. If the choice is contained by an existing gate or can be accepted within one WI without becoming a reusable cross-WI risk boundary, record the decision in the appropriate ADR/WI instead. For example, Webview framework evaluation should first be checked against `gate-webview-trust`; a separate delivery gate is justified only if investigation establishes an independent packaging/deployment risk with its own acceptance boundary.

When a gate is merged, split, renamed or superseded, do not erase history. Keep the old ID and disposition discoverable, link the replacement gate and ADR, update references and `ACTIVE.md`, and preserve version-specific evidence with its original limits.

## Status-change rule

Only update a gate after checking its exact scope against current evidence and limits. `Accepted` requires an Accepted ADR linked in the summary. Record active investigation or missing acceptance conditions in `ACTIVE.md`; preserve version-specific spike evidence rather than silently treating it as timeless.

**WI-001:** The three baseline gates above were accepted by [ADR 0001](../decisions/0001-build-baseline.md) on 2026-09-19. End-user chat remains constrained by the still-open `gate-webview-trust`, `gate-project-trust` and `gate-session-streaming` conclusions.
