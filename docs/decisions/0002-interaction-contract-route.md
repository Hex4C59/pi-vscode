# ADR 0002: Local interaction contract and upstream capability proposal

English | [中文](0002-interaction-contract-route.zh.md)

- Type: ADR
- Status: Draft
- Created: 2026-09-22
- Decision approval: 2026-09-22, route and document deliverables only
- Verification: pending; no implementation or new runtime verification
- Related gates: [gate-webview-trust, gate-session-streaming, gate-project-trust](../reference/architecture-gates.md) — all remain Open
- Work item: WI-013 **Paused**, not closed; [retained proposal](../discussions/2026-09-22-pi-compatibility.md#wi-013-paused-proposal-retained-2026-09-22); decision class `adr-after-approval`, `pending-adr`. The September 22 reprioritization moves the sole current Prepare to WI-014 in [ACTIVE](../../ACTIVE.md); prior route approval remains, this ADR is not Accepted.

## Context

REQ-004/005/009 need honest standard-interaction state, local answer invalidation and supported-operation Stop boundaries. The [pi 0.86.1 investigation](../discussions/2026-09-22-pi-compatibility.md) identifies missing inbound operation association, dialog-close/result observations and general idle-command completion/cancellation. Local child-exit evidence can be improved, but host reload loses process ownership. Correlation alone cannot create remote facts. Existing controlled chat and official example observations do not establish general compatibility.

## Decision and approval scope

The maintainer explicitly selected **route 1 as the local candidate contract, together with route 3 as a local upstream-facing proposal; route 2 only if a narrow pilot is separately selected**, and requested these document deliverables. Record the candidate in the existing bilingual [Webview message reference](../reference/webview-messages.md#planned-wi-013-local-interaction-contract), with upstream-facing requests in the existing investigation. This is an integration-strategy direction within the [ADR 0001](0001-build-baseline.md) subprocess baseline, not a replacement process model.

Approval covers this route and its documentation, not all proposed field spellings, numeric limits, exact supported operations, product Build, probes, dependency changes, trusted loading, publication or release. This ADR remains Draft until the required verification and acceptance conditions below are satisfied. WI-010's separate pending ADR remains unresolved.

## Direction amendment (2026-09-22)

The maintainer clarified the goal: use unmodified standard released pi and support existing and AI-authored pi extensions. [PRD product direction and REQ-009](../product-requirements.md) own the confirmed scope and trust rules. The earlier route 1 + 3 selection remains historical approval for document deliverables; it does **not** make upstream protocol work a delivery dependency. The main direction is now to evaluate a finite current-release loading/standard-interaction slice using documented public APIs and honest local evidence. Route 3 is optional future upstream work; route 2 remains an optional separately approved pilot, not a mandatory protocol for all extension authors.

Rationale for amendment: earlier framing elevated desirable remote observability into a project-wide prerequisite, beyond the confirmed product goal. Missing remote consumption/closure/source facts still limit claims and dependent operations, but universal authenticated origin, exact remote completion and a new protocol are not required to begin scoped feasibility assessment. Local invalidation/write/owned-child-exit evidence remains valid at its actual scope. No core modification, fork, safety waiver or compatibility certification follows. This ADR remains Draft; loading mechanics, approval coverage, operation separation where needed, budgets and Stop/manual-exit/reload recovery still require scoped design, evidence and Build approval.

## Rationale

The local host owns eligibility and product recovery; the adapter maps validated public evidence and owns transport/process observation; the Webview presents bounded forms and sends named intents; pi owns remote execution and dialog arbitration. This division can prevent stale local actions without falsely reporting remote success. Missing runtime facts are best requested from their upstream owner rather than inferred from notifications or recreated agent internals. Keeping the upstream proposal local permits review without implying upstream agreement.

## Alternatives considered

- **Route 1 alone:** necessary bookkeeping but cannot supply remote source, lifecycle or completion facts; rejected as a sufficient general-compatibility claim.
- **Route 2, cooperative author protocol:** potentially useful for a separately disclosed narrow pilot, but transport/control feasibility and author cooperation remain unverified. Not enabled by this decision and not a universal interceptor or authentication mechanism.
- **Route 3 alone:** upstream capabilities cannot replace local validation/lifecycle policy; it also depends on upstream agreement, release and pinned-version evidence. Combine with route 1 as documentation now, not a delivery promise.

No fork, private API import, SDK-host switch, automatic compatibility kill/restart, sandbox or universal JavaScript/descendant cancellation is selected.

## Consequences and remaining design

The reference owns candidate local discriminants, operation coverage/evidence, one-shot local reply reservation, queue/deadline behavior and exit-versus-loss recovery; the investigation owns minimal upstream capabilities and optional encodings. Both remain proposed, not Living implementation. Do not duplicate their field lists here.

Numeric budgets remain unapproved. A bounded recent diagnostic ring must not become an arbitrary 256-interaction lifetime stop; non-reused epoch/monotonic local IDs with live-token validation are a candidate, while remote replay retention/exhaustion policy still needs resolution. Host-reload recovery lacks an approved observable boundary and durable enforcement design: memory-only local invalidation does not prove old execution ended. This blocks the affected recovery design until resolved, rather than making upstream enhancement a project-wide prerequisite or authorizing persistence or automatic termination.

Architecture assessment: **document first / Direction**, not Implementable. Ownership/dependencies/domain/requirements/storage pass at proposal level under architecture §2/§4/§5 and REQ-004/005/006/009. Contracts/concurrency/errors/lifecycle/versioning now have local candidate semantics but still have remote-capability and ownership-loss gaps. Security, observability, performance, tests and accessibility need evidence; build/release changes are N/A for this documentation slice. Existing source and tests are seams, not new behavior verification.

## Verification and acceptance conditions

Before Build, resolve the selected current-release loading/interaction slice, its observable public-API evidence and honest unknown outcomes, unknown-origin admission where separation is needed, numeric bounds/ID retention, version migration, cancellation noncooperation and manual-exit/reload recovery. Additional remote capabilities or a cooperative protocol are conditions only for claims that actually depend on them, not universal entry requirements. Reconcile any user-visible scope change with both PRD languages and record explicit scoped implementation authorization. Trusted loading and approval coverage require their own approval.

Required later evidence is enumerated in the local contract and upstream proposal: deterministic local validation/races/cleanup; separately authorized pinned public-runtime lifecycle/outcome/cancellation and exit/loss tests; Windows VS Code F5 and installed-VSIX interaction/recovery checks; a reviewed pinned real extension. No such new tests ran for this ADR. Historical synthetic pi 0.86.1 results retain only their recorded scope. Documentation checks belong to the current ACTIVE handoff and cannot accept this ADR or close gates.

Accept only after the maintainer confirms the resolved decision scope and required verification is recorded; record that approval and evidence separately. No acceptance date is assigned now.
