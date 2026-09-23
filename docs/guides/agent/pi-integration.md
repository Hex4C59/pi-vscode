# Upstream agent SDK / RPC integration

English | [中文](pi-integration.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Authority: patterns when the product talks to an upstream coding-agent runtime via SDK or RPC

Applies to pi runtime integration in this product. Portable rules originate in the engineering-template SDK/RPC pack; selected product behavior and evidence are listed below.

## When to load and sources of evidence

Load for runtime startup, SDK/RPC commands or events, session operations, resource loading, permissions, and upstream dependency upgrades. Read the approved architecture/ADRs, current WI, actual gate IDs, package pin and the installed version's public documentation before implementation. Local upstream source can explain behavior, but is not permission to depend on private modules or undocumented file layouts.

Record the exact package version, public entry point, relevant documentation and observed behavior. Distinguish documented guarantees, spike observations and assumptions. If an API cannot support the required behavior, record the gap and revisit the proposal; do not silently implement an upstream subsystem yourself.

For general promise handling, cancellation, resource cleanup and Node process hygiene, follow the TypeScript/Node playbook (linked below) rather than duplicating its rules here.

## Integration ownership

- Choose embedded SDK or subprocess RPC through the product's decision process. Do not switch process models incidentally. The privileged host owns workspace policy, credentials and runtime lifecycle; the adapter maps upstream results/events into documented product contracts; the UI receives only approved presentation data.
- Do not reimplement the upstream agent loop, provider stack or compaction. Product orchestration must use public SDK/RPC APIs.
- Use upstream session APIs for create, resume, switch and other supported operations. Do not read or write upstream session files for product features unless an Accepted ADR explicitly authorizes that exception. Treat returned identifiers/paths as opaque inputs to public APIs, not a reason to parse their storage format.
- Keep credentials and privileged capabilities out of UI messages. Do not forward arbitrary SDK calls, command names, shell strings or filesystem paths from a low-trust UI without a validated, narrowly scoped host operation.

## RPC and event contracts

- Implement the transport framing required by the pinned protocol. Account for partial/multiple frames per read and split text encoding; define behavior for malformed, oversized or truncated input. Separate protocol output from diagnostics; do not assume one stdout chunk equals one message.
- Validate message envelopes before consuming fields. Distinguish command responses, unsolicited events and runtime-to-client requests when supported. Correlate responses with pending request IDs and expected operations; define handling for unknown IDs, unsupported messages and protocol versions.
- Document command acknowledgement separately from operation completion and streaming termination. Preserve required event order; do not assume each logical action produces exactly one event or that repeated events are duplicates.
- Specify allowed concurrent operations and cancellation semantics from public API evidence. Do not retry a state-changing command after a timeout unless its outcome and retry safety are known. A lost response does not prove the operation failed.
- Before expanding the adapter or UI bridge, document DTOs, errors and ownership in the product reference contract. Use Planned/Outline/Living according to actual maturity; writing a schema does not prove the integration is implemented.

## Runtime and session lifecycle

- Define observable starting, ready, stopping and failed states as needed; process creation alone is not readiness. On startup failure or process loss, settle pending callers, invalidate the runtime identity and surface the failure through the host.
- During stop, restart or session/workspace switch, explicitly handle pending commands, streamed output and approval requests. Associate results with the runtime/session identity so stale callbacks cannot affect the replacement session.
- Verify the upstream meaning of session switch, resource reload and cancellation. Never assume a session switch changes cwd, reloads every resource or resets permissions without documentation and observation. Apply the product's approved permission-reset policy independently.
- Follow the TypeScript cleanup rules; integration checks must additionally observe child-process closure and resource release. Do not treat sending a termination signal as proof of exit or a short-lived probe as a production session manager.

## Trust and resource loading

- Keep host workspace eligibility, upstream project-resource approval and per-tool authorization separate. A trusted workspace is not blanket approval for project extensions or tools; a resource-loading choice is not a shell/filesystem permission.
- Inspect documented defaults and persisted/global configuration before startup. If the product requires an explicit resource choice, pass the supported explicit control and verify its precedence instead of relying on an interactive prompt or default deny assumption.
- Check relevant resource categories separately at startup and switch: extensions/packages, settings, skills/prompts, context and global resources. Report unobserved categories rather than generalizing one marker to all resources.
- Declining project resources does not necessarily stop context reads, global resources or ordinary tool access. Describe the verified scope precisely. Neither the client nor an offline flag alone constitutes an OS sandbox.

## Spikes, regression checks and upgrades

- Start with the smallest public-API probe that answers the WI question. Use temporary workspace/configuration fixtures and controlled resources; isolate credentials, user state and environment. Do not install project packages, execute real project extensions or invoke models as an incidental part of a lifecycle probe.
- Test the relevant success and failure paths: startup failure, malformed protocol, process loss, cancellation, delayed events, switching and cleanup. Assert prohibited actions do not occur (for example, no runtime launch for an ineligible workspace). Keep mock tests distinct from real runtime evidence.
- Record command, exact version/configuration, expected versus observed result and remaining limitations. If a resource or network boundary is not independently observed, say so. Persist useful findings in the existing discussion/WI record; write an Accepted ADR and close the actual product gate only after required verification and maintainer confirmation.
- Upgrades must review public API/protocol changes and rerun affected lifecycle, trust and session checks in isolation. Update the declared package pin/lockfile and relevant decision records through the approved process. Production builds must not rely on undeclared sibling-repository links.

## Maintenance

At integration handoff, retain reusable protocol or lifecycle findings in the relevant rule, with links to evidence, and synchronize translations. Keep version-specific facts and product choices in a product section, separate from portable rules and historical observations. Update the template pack only when authorized. Do not describe planned chat, streaming, session management or trust enforcement as delivered merely because a probe passed.

Related: [TypeScript/Node playbook](typescript.md).

## pi VS Code: selected approach and evidence

[ADR 0001](../../decisions/0001-build-baseline.md) establishes the subprocess RPC baseline; its `0.85.1` pin is historical verification context. Read the current exact pin from [`package.json`](../../../package.json) and compare it with the installed package. The [architecture](../../architecture/vscode-extension-architecture.md) owns the current runtime, controlled profile and environment boundary; the [contract](../../reference/webview-messages.md) owns message behavior.

| Task | Evidence entry and limits |
|------|---------------------------|
| Minimum startup/RPC/shutdown | [Runtime probe](../../../src/adapter/runtime/pi-rpc-probe.ts), `npm run spike:runtime`; historical conclusion in ADR 0001. The probe inherits the current environment and is not an isolated trust fixture. |
| Project-resource trust | [Trust harness](../../../scripts/spikes/spike-project-trust.mjs) and [helper tests](../../../scripts/spikes/project-trust.spec.mjs). The harness currently requires `0.85.1`, which differs from the manifest's `0.86.1`; it is not a passing current-version check. Re-review public APIs before upgrading it. |
| Early UI/startup/chat | [WI-006/WI-007/WI-004 history](../../archive/2026-09-21-closed-wi-history.md) and [0.85.1 RPC research](../../discussions/2026-09-21-wi-004-rpc-evidence-0.85.1.md). Historical no-runtime/no-chat/no-tools boundaries do not describe the whole current product. |
| Current activity/approval/Stop | [`pi-rpc-runtime.ts`](../../../src/adapter/runtime/pi-rpc-runtime.ts), [approval probe](../../../scripts/spikes/spike-approval.mjs), [offline inference probe](../../../scripts/spikes/spike-offline-inference.mjs). Read the relevant script and check version/isolation before running; prior outcomes belong to [WI-010](../../archive/2026-09-21-closed-wi-history.md#wi-010). |
| Package boundary | [VSIX verifier](../../../scripts/packaging/verify-vsix.mjs). Report extracted CLI/handshake checks separately from installed-VSIX activation/UI acceptance. |

### Project trust findings and remaining limits

[WI-003 history](../../archive/2026-09-21-closed-wi-history.md#wi-003) owns the six `0.85.1` scenarios, isolation method, two-resume observation and unobserved settings/themes/packages. Load it when analyzing those trust or switch behaviors; it cannot establish new-version verification or today's extension-loading policy. WI-010 controlled execution disables third-party extension discovery.

Startup must consume the host's current explicit resource choice, recheck eligibility/identity and use public controls. Workspace eligibility, resource loading and tool authorization remain separate. Resource refusal does not exclude AGENTS.md or all user context; offline is not an OS network sandbox. The [PRD](../../product-requirements.md) owns approved choices/reset rules, and the [gate table](../../reference/architecture-gates.md) owns complete validation status.

Integration handoff must record actual version, command, observations and limits. Upgrades follow ADR 0001's runtime-probe and maintainer-review requirement, plus affected trust/session checks. Preserve historical-version results and record new evidence separately. General check entries are in [Contributing](../../../CONTRIBUTING.md).
