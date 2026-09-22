# AGENTS.md

English | [中文](AGENTS.zh.md)

Project-specific agent working rules for **pi VS Code**. **Universal rules** are in [`AGENTS.kernel.md`](AGENTS.kernel.md) ([中文](AGENTS.kernel.zh.md))—copy that pair from engineering-template and keep it in sync when the kernel upgrades.

Detailed playbooks live under `docs/guides/agent/` (see **Load map**).

## Document responsibilities and conflict priority

Use each document for the kind of question it owns. The list also gives conflict priority from highest to lowest:

1. **`AGENTS.kernel.md` and `docs/guides/agent/` playbooks** define mandatory security, engineering, testing, collaboration and agent-operation rules. A work item or historical discussion cannot bypass them.
2. **`docs/product-requirements.md`, when `Accepted`,** defines approved user-visible behavior, product scope and acceptance. While the PRD is `Draft`, its candidate text is not automatically approved scope. For individually approved slices, check the approval scope and linked requirements in `ACTIVE.md`; slice approval does not accept the entire PRD.
3. **`docs/architecture/vscode-extension-architecture.md`** defines system structure, layers, dependency direction, trust boundaries and responsibility owners. Planned architecture does not by itself prove implementation or delivery.
4. **`ACTIVE.md`** defines the current WI, phase, approved scope, acceptance and handoff. It cannot silently change higher-priority rules, Accepted product requirements or architecture boundaries.
5. **`docs/discussions/` and `docs/archive/`** preserve investigations, historical evidence and past context. Unless a conclusion is adopted by a current authoritative document or Accepted ADR, it is not current implementation authority.

A **conflict** exists only when documents impose requirements about the same question that cannot all be satisfied. Different documents answering different questions are complementary, not conflicting. For example, a PRD may require Stop, architecture may assign Stop coordination to the extension host, and `ACTIVE.md` may scope the current WI to one Stop slice; all three can be true.

When a real conflict is found:

1. Stop the conflicting part of the work and identify the exact requirements and files.
2. Apply the priority order above; do not silently guess or treat lower-priority context as current authority.
3. Correct or mark the lower-priority stale text when the authorized task permits it.
4. If resolution changes a product tradeoff or consequential architecture decision, obtain maintainer confirmation before continuing and record the decision through the normal PRD/ADR process.

## Project facts

- VS Code extension that presents [pi](https://github.com/earendil-works/pi) in a **sidebar Webview** while the user codes—default **Secondary Side Bar (right)** so the **primary (left) sidebar keeps Explorer** (Copilot / Codex–style layout).
- **Delivery status:** Use the current WI and verification records; planned features, partial implementations and passing tests are not full acceptance.
- **Compatibility:** The declared VS Code engine range is in [`package.json`](package.json). Compatible forks (Cursor, Windsurf) are best-effort and need separate evidence. For sidebar placement changes, verify the target host's Secondary Side Bar support and document the primary-sidebar fallback; the engine range alone does not prove placement support.
- **Reference client:** [`pi-desktop`](https://github.com/earendil-works/pi-desktop) informs product goals and pi boundaries, not Electron IPC patterns. Sibling repositories are read-only unless the maintainer requests changes; see the pi integration references below for `../pi`.

## Mandatory product security rules (L0)

- **Secrets** stay in the extension host (`SecretStorage`, env as designed). Never embed in webview HTML, webview storage, or `postMessage` to the webview.
- **Webview** is presentation-only: no Node, no pi SDK, no direct `fs`/`child_process`. Host validates all inbound messages; use an allowlisted, versioned protocol before real chat (`gate-webview-trust`).
- **Do not reimplement** pi’s agent loop, provider stack, or compaction in this repo—orchestrate via documented SDK/RPC only (`docs/guides/agent/pi-integration.md`).
- **Session storage:** do not read/write pi session files for product session features unless an Accepted ADR says otherwise; use SDK/RPC session APIs.
- **Sandbox honesty:** the extension is not a security boundary against malicious workspace content; tools and shell remain governed by pi and user trust settings.

Kernel L0 (commits, judgment) still applies from `AGENTS.kernel.md`.

## System layers and responsibilities

- **UI:** Sidebar `WebviewView` (secondary sidebar preferred)—chat UI, streaming display, ephemeral UI state.
- **Host:** VS Code extension host—activation, commands, configuration, secrets, workspace policy, webview lifecycle, message bridge.
- **Adapter:** Maps pi SDK or subprocess RPC ↔ internal domain events for host/webview.
- **Runtime:** pi coding-agent (upstream packages or child process).

When changing streaming, Stop, view recreation or runtime replacement, read the lifecycle sections in the [architecture](docs/architecture/vscode-extension-architecture.md) and the [Webview message contract](docs/reference/webview-messages.md).

## Starting a task

1. Read the baseline context required by `AGENTS.kernel.md` § Starting a task, including current repository scripts and relevant tests.
2. Before implementation or continuing a WI, read its current proposal in [`ACTIVE.md`](ACTIVE.md) and the [collaboration guide](docs/guides/agent-collaboration.md) in full. Apply the kernel's limited exception for read-only answers; do not turn every question into implementation work.
3. Follow the applicable load-map routes below. Read archived material only when the current question needs its evidence.
4. Check the recorded approval scope before editing application code. A Prepare proposal is not Build authorization; obtain and record maintainer approval before advancing.

Mentioning only `ACTIVE.md` (or saying 「继续 pi VS Code」) supplies a session entry point, not a waiver of required reading or approval. Keep one current WI (WIP=1); recording discussion does not authorize implementation. Git commits still require an explicit maintainer request.

## Conversation records

At meaningful discussion checkpoints, confirmed choices, and WI close, follow [collaboration §7](docs/guides/agent-collaboration.md#7-agent-obligations), including discussion-only sessions. The agent owns classification, recording and in-scope archival; the maintainer owns decisions and acceptance. Read that guide before recording. Do not ask the maintainer to choose a directory or reapprove routine recordkeeping.

## Load map

Use the rows that match what the current task actually changes. A task may match several rows; read all applicable routes, but do not read the table linearly by default. Baseline reads still come from `AGENTS.kernel.md`. Stop expanding links once scope, constraints, contracts and required evidence are clear; report missing or conflicting evidence instead of guessing.

| The current task involves… | Read first |
|----------------------------|------------|
| Changing TypeScript source, dependencies, compiler or build configuration | [`docs/guides/agent/typescript.md`](docs/guides/agent/typescript.md) |
| Changing behavior, fixing a regression, or adding, moving or collecting tests | [`docs/guides/agent/testing.md`](docs/guides/agent/testing.md) |
| Integrating with or verifying the pi runtime, including SDK, RPC and technical spikes | [`docs/guides/agent/pi-integration.md`](docs/guides/agent/pi-integration.md) |
| Writing or reviewing documents consumed by agents | [writing-for-agents](.agents/skills/writing-for-agents/SKILL.md) for routing, single-source rules and completion criteria |
| Checking stale documentation, repairing documentation structure or closing a WI | [`docs/guides/documentation-health.md`](docs/guides/documentation-health.md) |
| Deciding whether work is worthwhile now, what to do next, or whether to proceed | [`docs/guides/agent/judgment.md`](docs/guides/agent/judgment.md) |
| Changing system layers, module responsibilities, cross-layer interfaces, data storage or another consequential architecture boundary | [`docs/guides/architecture-governance.md`](docs/guides/architecture-governance.md), [`docs/architecture/vscode-extension-architecture.md`](docs/architecture/vscode-extension-architecture.md) |
| Changing behavior that users can see, operate or otherwise experience | [`docs/product-requirements.md`](docs/product-requirements.md), [architecture doc](docs/architecture/vscode-extension-architecture.md) |
| Adding, investigating or updating an architecture validation gate | [`docs/reference/architecture-gates.md`](docs/reference/architecture-gates.md) |
| Creating a Git commit or writing a commit message | [`docs/git-commit-convention.md`](docs/git-commit-convention.md) (commit messages in English only) |

Example: moving the Webview from inline HTML/JavaScript to an independently built TypeScript frontend involves TypeScript/build configuration, architecture boundaries, testing, and possibly gate evidence, so all matching routes apply.

Index: [`docs/guides/agent/README.md`](docs/guides/agent/README.md).

## Checks before handoff

After making changes, follow the general Checks before handoff requirements in `AGENTS.kernel.md`, then perform checks appropriate to the changes. Editing files alone is not evidence that the task is complete:

- **Documentation changes:** Run `npm run docs:verify` for structure, links and English/Chinese synchronization. At WI close or archival, also run `npm run docs:health` as required by the collaboration guide. These commands do not replace checking document meaning and supporting evidence.
- **Extension code changes:** Run `npm run compile` (build and TypeScript type checking), `npm run lint` (static code checks), and relevant behavior tests; the standard repository test entry is `npm test`. Compilation and lint success do not prove correct behavior; consult the [testing guide](docs/guides/agent/testing.md) for detailed requirements.
- **Real-host or installed-package behavior:** Perform necessary F5/installed-VSIX verification according to the task's acceptance scope. Automated tests do not substitute for unverified real-environment behavior, and development F5 is not installed-VSIX acceptance.
- **Report results:** State which checks actually ran, their results and unverified areas. Explain checks that could not run; do not present historical results as current passes. Passing checks does not automatically close a WI or gate; their acceptance and decision rules still apply.

Documentation-only changes do not require unrelated code builds or behavior tests merely because those commands exist.

## References and rules for pi integration

When a task involves pi SDKs, RPC, CLI behavior, events, tools or sessions, use these sources:

- **Inspect upstream source and documentation:** The sibling `../pi` directory is a local checkout of the pi repository. Use it only for reading, technical investigation and comparison with documented behavior. Do not modify it unless the maintainer explicitly requests changes.
- **Follow the integration guide:** Before changing pi integration code or running a related technical spike, read [`docs/guides/agent/pi-integration.md`](docs/guides/agent/pi-integration.md). Apply the product security rules above. Establish upstream behavior from package documentation and public APIs, not assumptions about session-file layouts or undocumented internal modules.
- **Confirm the current dependency version:** Treat the exact pi npm package version in [`package.json`](package.json) as the current version fact. Production builds must use declared release dependencies and must not depend on the local `../pi` path.
- **When upgrading pi:** Recheck affected public APIs, CLI flags, RPC contracts and lifecycle behavior, and record new evidence. Evidence from an older package version does not automatically establish behavior for a newer version.
- **Understand the existing architecture decision:** See [`docs/decisions/0001-build-baseline.md`](docs/decisions/0001-build-baseline.md) for why subprocess RPC was selected and what WI-001 verified. The corresponding [`gate-runtime-host`](docs/reference/architecture-gates.md) accepts only the minimum hosting conclusion—subprocess startup, one RPC round-trip and bounded shutdown—not the complete chat lifecycle.
