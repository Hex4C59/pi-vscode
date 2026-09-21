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

[ADR 0001](../../decisions/0001-build-baseline.md) selects subprocess RPC for the baseline and initial adapter direction, with `@earendil-works/pi-coding-agent@0.85.1` pinned from npm. The existing probe starts `dist/bundle/cli.js` with `--mode rpc --no-session`, sends `get_state` using LF JSONL, then stops. It is a probe, not a long-lived product runtime. Follow the [primary architecture](../../architecture/vscode-extension-architecture.md) and actual [gate table](../../reference/architecture-gates.md), including `gate-runtime-host`; do not invent `gate-build-baseline` for this product.

| Evidence entry | What it supports / limits |
|----------------|--------------------------|
| [Runtime probe](../../../src/adapter/pi-rpc-probe.ts), [JSONL helper](../../../src/adapter/jsonl.ts), `npm run spike:runtime`, [WI-001 evidence in ADR 0001](../../decisions/0001-build-baseline.md#spike-evidence) | Historical evidence for one request/response and shutdown; not streaming, tool approval or production concurrency. The probe inherits the process environment and is not the isolated trust harness. |
| [Trust harness](../../../scripts/spikes/spike-project-trust.mjs), [fixture/lifecycle helpers](../../../scripts/spikes/project-trust-lib.mjs), [tests](../../../scripts/spikes/project-trust.spec.mjs), `npm run spike:project-trust` | Isolated startup and cross-cwd session-switch scenarios for the fixed version. Read the harness and its limitations before execution. |
| [Archived WI-003 evidence](../../archive/2026-09-21-closed-wi-history.md#wi-003) | Recorded six-scenario trust observations and maintainer acceptance of the spike only. These are prior observations, not a claim that the current session reran them. |
| [Webview contract](../../reference/webview-messages.md), WI-006 in ACTIVE | Workspace eligibility and in-memory resource choice UI; the runtime is not started. Selection recorded does not mean resources loaded. |
| [WI-007 archive](../../archive/2026-09-21-closed-wi-history.md#wi-007), [`pi-rpc-runtime`](../../../src/adapter/pi-rpc-runtime.ts) | Long-lived subprocess RPC from host-owned choice; `get_state` readiness; no chat or streaming. |
| [WI-004 RPC evidence (0.85.1)](../../discussions/2026-09-21-wi-004-rpc-evidence-0.85.1.md) | Version-matched `prompt`, `text_delta`, `turn_end` and `--no-tools` docs for Prepare; not live WI-004 verification. |

### Project trust findings and remaining limits

- The recorded fixed-version spike uses public `--approve` / `--no-approve` overrides. It observed explicit denial overriding global `always` and remembered trust; do not reuse a bare RPC startup as a default-deny product path. Future runtime integration must consume the current host-owned choice, recheck eligibility/identity and apply the supported explicit control.
- Recorded observations cover project extensions, skills, prompt templates and APPEND_SYSTEM markers at startup and switch. Global extensions and AGENTS.md context remain on the denial path. Old project commands disappeared after switching; two resume events were observed per switch, so do not hard-code a one-event assumption.
- Settings effects and themes were not independently observed, and project packages were deliberately not installed. System-prompt observations came from public session APIs, not actual provider requests. Keep these limitations explicit before broader claims or gate closure.
- The trust harness uses temporary cwd/home/configuration, an environment allowlist, public `PI_CODING_AGENT_DIR`, `PI_OFFLINE=1` and `PI_TELEMETRY=0`; session fixtures and remembered trust are created through public APIs/hooks rather than parsing/writing session or trust files. This does not provide an OS network sandbox or independent traffic audit. ACTIVE records that early exploration lacked the offline flag; do not retroactively claim all runs were isolated from network traffic.
- Workspace eligibility, project-resource loading and tool approval remain separate. The product's detailed choices and reset rules belong to the [PRD](../../product-requirements.md) and current WI; this guide does not approve their implementation. As recorded in the gate table, `gate-project-trust`, `gate-webview-trust` and `gate-session-streaming` remain Open.

For documentation changes use `npm run docs:verify` and the collaboration workflow's `npm run docs:health`; for integration code use compile, lint and relevant tests/spikes with the isolation above. A package upgrade must follow ADR 0001's runtime-spike and maintainer-review requirement, plus affected trust/session regression checks. Update evidence and limitations without rewriting historical results.
