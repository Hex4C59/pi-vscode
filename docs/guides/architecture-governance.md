# Architecture governance (agent checklist)

English | [中文](architecture-governance.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Last reviewed: 2026-09-22
- Authority: architecture review criteria; product architecture and ADRs own the decisions
- Provenance: adapted from engineering-template `workflow/architecture-governance.md`. The maintainer authorized this project-local documentation review on 2026-09-22; the template is not synchronized. Reconcile this local revision before any future template sync.

## When to load

Read before proposing module splits, public APIs, cross-layer dependencies, shared types, persistence, large refactors or gate closure, and before claiming architectural correctness or release readiness. Copy-only edits and changes with no boundary impact need no architecture review.

## Review procedure

1. **Establish scope.** Read the current proposal and approval in [ACTIVE](../../ACTIVE.md), applicable [requirements](../product-requirements.md) and [architecture](../architecture/vscode-extension-architecture.md). Finish with the changed boundaries, owners and acceptance criteria identified. If a required decision or contract is missing, record that gap in Prepare.
2. **Select dimensions.** Inspect every dimension below for applicability. Report the relevant rows; explain N/A for a dimension that appears relevant but is excluded. Each reported row needs `pass`, `gap` or `N/A`, a repository evidence location, and the risk or next check. Planned text proves a proposed design, not its implementation.
3. **Resolve gaps.** Check the [message contract](../reference/webview-messages.md), applicable code/tests and [gates](../reference/architecture-gates.md). Every gap must have a scoped resolution, explicit deferral or blocking condition before the proposal is ready for approval. Follow [ADR criteria](../decisions/README.md) for consequential choices.
4. **Conclude.** State `implement now`, `spike first`, `document first` or `blocked on ADR/gate`, the decision class (`none`, `spike-only`, `adr-after-approval`), and the maturity justified below. Implementation still requires the [collaboration](agent-collaboration.md) approval and verification process.

Use the authority and conflict rules in [AGENTS](../../AGENTS.md). Cite existing files; a missing optional module catalog or shared-types directory is not by itself a requirement to create one.

## Structural dimensions

| Dimension | Completion criterion and evidence |
|-----------|-----------------------------------|
| 1. Module decomposition | Each changed module has a primary duty, related logic stays together, and independent tests are feasible. Explain overlapping responsibilities or changes that ripple across unrelated layers. Cite architecture owners and affected modules. |
| 2. Public interfaces | Named use-case operations have explicit inputs/outputs that can be validated and substituted in tests. Callers use capabilities rather than storage/framework internals. Low-trust UI receives no generic host, filesystem, shell or SDK bridge. Cite the operation and receiving validator. |
| 3. Dependencies | Imports and calls follow the documented layer direction without cycles; framework handlers stay at the edge. Shared types remain at their documented owner and do not pull privileged runtime code into the UI. Cite imports and the layer model. |
| 4. Contracts | At least Outline before claiming implementation alignment: data, preconditions, errors, empty/illegal states, ordering, correlation, completion, timeouts, cancellation and retry/idempotency are explicit. Living contracts change with their owning types and tests. A signature alone does not establish behavior. |
| 5. Ownership | Every touched resource has a named creator, state owner and cleanup owner. Adapters translate upstream data; host policy owns product state and UI renders projections. Explain lifecycle handoff instead of giving two modules independent mutation authority. |

## Behavior and runtime dimensions

| Dimension | Completion criterion and evidence |
|-----------|-----------------------------------|
| 6. Requirements and scope | Behavior and acceptance trace to an approved WI slice; Draft candidates and out-of-scope ideas remain separately identified. Cite PRD IDs, approval and open gates. |
| 7. Domain model | Workspace, view, runtime and session have distinct meanings, stable identities and stated invariants. Cite the owning types and architecture/contract definitions. |
| 8. State machines | Legal transitions, rejected operations, terminal states and recovery actions are specified. Cite the state owner, contract and transition tests. |
| 9. Concurrency | Parallel versus serialized work is explicit. Late events after cancellation, replacement or reload cannot mutate current state; background work has a cleanup owner. Cite generation/correlation guards and interleaving tests. |
| 10. Errors and recovery | User-fixable, host and upstream failures have observable outcomes and recovery paths. The owning boundary handles diagnostics once; timeouts do not silently retry uncertain side effects. Cite failure contracts and tests. |
| 11. Lifecycle and cleanup | Subscription, pending request and subprocess cleanup covers initialization failure, cancellation, replacement, crash and disposal. Define shutdown order and verify actual closure; a termination request alone is insufficient. Cite owners and lifecycle evidence. |

## Quality and delivery dimensions

| Dimension | Completion criterion and evidence |
|-----------|-----------------------------------|
| 12. Security and trust | Boundaries follow [product L0](../../AGENTS.md): secrets remain in the host, inputs are validated, untrusted output is safely rendered, and actual user permissions are disclosed. Report uncovered paths; credentials never enter the Webview, even temporarily. |
| 13. Data and persistence | Each stored datum has one authority, writer, lifetime and migration strategy. Preserve workspace data through apply/discard. Use public pi session APIs under L0; consequential storage changes follow ADR/gate rules. |
| 14. Observability and privacy | Diagnostics are bounded and owned at boundaries. Ordinary logs exclude credentials, full prompts, tokens and sensitive authentication paths. Cite the logging/projection paths. |
| 15. Performance and backpressure | Streams, payloads and queues are bounded; limits and truncation are observable. Interactive paths avoid blocking I/O and preserve composer/layout stability. Cite limits, overflow behavior and relevant measurements. |
| 16. Test strategy | New public operations and state transitions have behavior tests; actually run the applicable scripts. Separate mocks, real-runtime probes, F5 and installed-package evidence using the [testing guide](agent/testing.md). |
| 17. Build, release and upgrade | Read pins/build entries from [package.json](../../package.json) and build configuration. Verify the needed development and packaged runtime paths without undeclared sibling dependencies; use [pi integration](agent/pi-integration.md) for upgrades. |
| 18. Compatibility and versioning | Breaking message/schema changes identify consumers, version/reset or migration behavior, and applicable ADR decisions. Cite contract versions and supported-host evidence. |
| 19. UX and accessibility | For visible changes, define loading, empty, error, streaming and stopping states; expose project identity and consequential actions. Verify relevant keyboard, focus, theme and accessibility behavior in the intended host. |

## Report and maturity

Use this table for the selected dimensions; a bare “pass” without evidence is incomplete.

| Dimension | Status | Evidence on disk | Gap or risk if proceeding |
|-----------|--------|------------------|---------------------------|
| Affected dimension | pass / gap / N/A | File, section, test or gate ID | Missing condition and its disposition |

State the level justified for the reviewed scope, keeping design and runtime evidence separate:

| Level | Required evidence |
|-------|-------------------|
| Direction | Proposed/agreed boundaries and owners; implementation may not exist |
| Implementable | Contracts and owners are detailed enough to implement without inventing behavior |
| Verifiable | Living contracts, tests and CI enforce the claimed constraints |
| Evolvable | ADRs and gates retain the reasons and verification needed to review later change |

For example, a narrow `stopChat` message can satisfy the interface criterion while cancellation still has a gap: the report must name the missing settlement or shutdown evidence. Neither the interface shape nor a successful unit test proves complete Stop behavior.

After governance edits, synchronize the translation and run `npm run docs:verify`. Keep task results in the existing handoff; this checklist carries reusable criteria.
