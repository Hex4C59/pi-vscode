<!-- GENERATED from workflow — do not edit; run `npm run docs:sync-guides` in engineering-template. -->

# Architecture governance (agent checklist)

English | [中文](architecture-governance.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Last reviewed: 2026-09-19 (worked examples / few-shot)
- Authority: when and how agents apply architecture dimensions; portable checklist—not a substitute for product architecture or ADRs
- Related: [AGENTS.kernel.md](../../AGENTS.kernel.md); optional product `docs/architecture-review-guide.md` for long-form review narrative

Agents do not “remember” prior chats. **This file + product docs** are how governance stays consistent.

This document is a **working checklist**. A one-word “pass” per row is not enough. For each dimension you touch, state **pass / gap / N/A**, **evidence** (path, §, gate, contract ID), and **risk if ignored**.

---

## When to open this checklist

Open and cite evidence **before**:

- Proposing module splits, new public APIs, IPC/commands, shared types, or persistence layout.
- Claiming a design is “correct,” “production-ready,” or “aligned with architecture.”
- Large refactors, new cross-layer dependencies, or closing an architecture gate.

Skip for typo fixes, copy-only doc edits, or tasks explicitly scoped to one file with no boundary impact.

---

## The governing question

> Does this repository have **executable architecture governance**—documented constraints with an **authority chain** that implementation and review can check?

Answer using **files on disk**, not chat memory. If the product has no architecture doc yet, say so and propose Prepare-phase work (see [agent-collaboration.md](agent-collaboration.md) §9).

---

## How to report (required format for architecture-heavy proposals)

Include a table like this in the chat (only rows relevant to the WI; mark others N/A):

| Dimension | Status | Evidence on disk | Gap or risk if proceeding |
|-----------|--------|------------------|---------------------------|
| Module decomposition | pass / gap / N/A | e.g. `docs/modules/README.md` § owner | … |

Then give a **short conclusion**: implement now | spike first | document first | blocked on ADR/gate.

---

## Authority chain (typical product repo)

```text localized
AGENTS.kernel.md + AGENTS.md + playbooks
        ↓
product-requirements.md (when Accepted)
        ↓
primary architecture (e.g. docs/architecture/*.md)
        ↓
docs/modules/* (ownership, must-not)
        ↓
docs/reference/* contracts (when Outline / Living)
        ↓
src/shared/contracts + tests (when Living)
        ↓
architecture-gates.md + Accepted ADRs
```

If a layer is missing or contract status is `Planned`, state the gap—**do not invent** owners, DTOs, or `Living` behavior from empty shells.

---

## I. Structural dimensions (the “five core”)

### 1. Module decomposition

**Answers:** What are the parts of the system? What is each part for? What does it explicitly **not** do?

**Pass when:**

- Each module has a **single primary duty** and **high cohesion** (related logic together).
- **Low coupling**: modules do not need deep knowledge of each other’s internals.
- **Reasons for change** align with boundaries (a pi upgrade should not force unrelated UI refactors).
- Boundaries are **testable** without booting the entire stack when feasible.
- **Permissions match duties** (low-trust code cannot reach high-privilege APIs).

**Red flags:**

- God modules (`Manager`, `Utils`) that grow without owner.
- Multiple modules can **mutate the same runtime or session** directly.
- One field change ripples across unrelated layers.
- **Dependency cycles** between modules.

**Cite:** architecture § module groups; `docs/modules/README.md` owner table; module stub `Doc` links.

**Do not say only:** “Structure is clear.” **Say:** principles used, which boundaries are fixed, where responsibility overlaps, what is missing for independent test.

---

### 2. Public interfaces (published API)

**Answers:** Through which **named operations** may other modules use this module? (IPC, commands, preload bridge, service ports—not only TypeScript `export`.)

**Pass when:**

- Interfaces are **narrow** and **use-case shaped** (not `invoke(method, args)`).
- Callers depend on **capabilities**, not internal storage or framework types.
- Inputs and outputs are **explicit** enough for validation and test doubles.
- Renderer/low-trust callers cannot request **generic host power** (arbitrary paths, shell, credentials).

**Red flags:**

- Leaking pi SDK / Node / filesystem types into UI packages.
- “Temporary” public exports that become permanent glue.
- Interfaces too wide to mock or replace (blocks RPC/subprocess ADR later).

**Cite:** contract pages (`contract-ipc`, etc.); module doc for `IpcRegistration` or equivalent; code-style charter on IPC naming.

**Remember:** **Interface ≠ contract**—a signature can exist while abort semantics, timeouts, and concurrent session replacement remain undefined.

---

### 3. Dependencies (dependency direction)

**Answers:** Who may import, call, or know whom? What is the **allowed direction** of control and data flow?

**Pass when:**

- **One dominant direction** (e.g. UI → host → adapter → upstream).
- **No cycles** in the dependency graph (especially adapter ↔ controller loops).
- **Business rules** do not depend on framework handlers; frameworks sit at the **edge**.
- Shared types live in a **contracts** layer both sides may depend on—not on host internals.

**Red flags:**

- UI imports upstream SDK or host singletons.
- High-level orchestration imports IPC handler modules directly.
- Bidirectional imports between runtime control and adapter.

**Cite:** architecture layering diagram; `boundaries.md`; import paths in the proposed diff.

---

### 4. Contracts (behavior + data shapes)

**Answers:** What must be true before and after each cross-boundary call? What are payloads, errors, ordering, and idempotency rules?

**Pass when:**

- Contract docs have status **Outline** or **Living** before implementation claims alignment.
- **Living** contracts change in the **same change set** as `src/shared/contracts` and tests.
- Error codes, empty states, and **illegal state** handling are specified—not only happy path.
- Event streams define correlation (IDs, indexes, authoritative “message complete”).

**Red flags:**

- Implementing DTOs while reference page is still `Planned`.
- Types without semantics (“`abort()` resolves” but queue/session state undefined).
- Duplicate conflicting definitions (doc vs code vs tests).

**Cite:** `docs/reference/README.md` catalog; specific contract file; gate if persistence/IPC not closed.

---

### 5. Ownership (resource ownership)

**Answers:** For each resource (task record, runtime slot, subscription, worktree, credential, journal, attachment token), **who is the single owner** for create / update / delete / cleanup?

**Pass when:**

- Architecture lists **one owner per resource** and **forbidden dual ownership**.
- Module table **Must not** column is honored in the proposal.
- **Adapters translate**; they do not own business truth.
- Lifecycle (dispose, cancel scopes, shutdown order) is assigned to a named owner.

**Red flags:**

- Two modules both subscribe to upstream events and mutate the same catalog.
- Renderer or UI store treated as source of truth for durable state.
- Cleanup only documented in comments, not in an owner module.

**Cite:** architecture §8; `docs/modules/*`; cleanup matrix if present.

---

## II. Behavior and runtime

### 6. Requirements and scope

**Answers:** What is in the **current WI / first release**? What is explicitly **out of scope**? What is success?

**Pass when:**

- Proposal does not smuggle full-product scope into a spike WI.
- Out-of-scope ideas go to **parking lot**, not implementation.
- User-visible claims match PRD status (`Draft` vs `Accepted`).

**Red flags:** “While we’re here, also build …” without WI change. Describing gated features as shipped.

**Cite:** `product-requirements.md`; `ACTIVE.md` WI; open gates.

---

### 7. Domain model

**Answers:** What are the core entities, IDs, and relationships? (e.g. workspace ≠ runtime ≠ session ≠ view.)

**Pass when:**

- Terms match **glossary** and architecture.
- Identifiers stable across layers (task id, session id, incarnation/generation if used).
- Invariants stated (e.g. at most one main agent per top-level session).

**Red flags:** Same word used for two concepts in UI vs persistence vs SDK.

**Cite:** glossary; architecture domain section; PRD.

---

### 8. State machines

**Answers:** What states exist? Which transitions are legal? What happens on illegal ops?

**Pass when:**

- Task/runtime/UI states documented or referenced in contract-states.
- Illegal transitions fail visibly (not silent corruption).
- Terminal states (error, disposed) have defined recovery or user action.

**Red flags:** Boolean `isLoading` only, with no model for aborting/switching/crashed.

**Cite:** `task-and-runtime-states` or equivalent; module owner for state authority.

---

### 9. Concurrency model

**Answers:** What may run in parallel? What must be serialized? How do abort, switch, and shutdown interact?

**Pass when:**

- Rules for **late events** after cancel/switch/reload are defined.
- No unbounded fire-and-forget without owner cleanup.
- Generation/incarnation or equivalent stale-event guard if multiple runtimes exist.

**Red flags:** “We’ll add mutex later.” Shared mutable singleton without queue.

**Cite:** architecture concurrency section; WI spike notes; ADR if process model undecided.

---

### 10. Errors and recovery

**Answers:** How do failures surface? Retry? Desync between UI and host? Crash recovery?

**Pass when:**

- User-visible errors distinguish user fixable vs system vs upstream.
- Recovery path documented (reload, resync, discard worktree, etc.).
- No empty `catch` at boundaries; log once at owning boundary.

**Red flags:** Swallow errors in helpers; UI stuck without failed state.

**Cite:** PRD failure scenarios; code-style error rules; module test focus.

---

### 11. Lifecycle and cleanup

**Answers:** Who subscribes? Who disposes? What is shutdown order on exit/crash?

**Pass when:**

- Listeners and child processes cleaned on abort, switch, window close, deactivate.
- Application exit order documented (e.g. stop runtimes before fs flush).
- Pending IPC/request scopes cancelled.

**Red flags:** Leaked subscriptions; zombie subprocess; “exit hook TODO.”

**Cite:** `application-lifecycle` module; architecture § lifecycle; boundaries streaming cleanup.

---

## III. Quality and delivery

### 12. Security and trust model

**Answers:** What is trusted? What runs as the user? What must never cross into UI/logs?

**Pass when:**

- Trust boundaries match architecture; **no false sandbox** marketing.
- Credentials use dedicated, minimal channels; cleared from UI state after submit.
- Untrusted content (markdown, tool output, repo files) rendered safely.

**Red flags:** Secrets in renderer storage, telemetry, or generic logs.

**Cite:** `security.md`; architecture security §; L0 in `AGENTS.md`.

---

### 13. Data and persistence

**Answers:** What is persisted? By whom? Schema? Migration? Source of truth?

**Pass when:**

- Persistence owner module identified; UI is projection not authority.
- Schema changes linked to gate/ADR when required.
- Apply/discard flows do not corrupt target workspace.

**Red flags:** Ad-hoc JSON files without owner; dual writers to same path.

**Cite:** `persistence-layout` contract; `gate-task-persistence`; module owners.

---

### 14. Observability and privacy

**Answers:** What may be logged or metered? What is PII/secrets forbidden?

**Pass when:**

- Logging at boundaries; not every helper.
- Model prompts, tokens, auth paths excluded from ordinary logs.

**Red flags:** `console.log` of message bodies or env keys.

**Cite:** security playbook; PRD privacy expectations.

---

### 15. Performance and backpressure

**Answers:** Streaming, large payloads, queue depth, UI jank rules?

**Pass when:**

- Streaming does not unbound memory; composer/layout stable per UI playbook.
- Attachment/size limits align with gate when present.

**Red flags:** Buffer entire stream; synchronous FS on UI thread path.

**Cite:** PRD; architecture; WI acceptance metrics if any.

---

### 16. Test strategy

**Answers:** What must this WI prove automatically? What stays manual?

**Pass when:**

- Contract or module tests planned for new public surfaces.
- Agent ran repo scripts and reports results—not “should pass.”

**Red flags:** No tests for new IPC or state transitions; claiming verified without commands.

**Cite:** `testing.md`; module stub “test focus”; CI config.

---

### 17. Build, release, upgrade

**Answers:** Toolchain pins? Package vs dev Node? Clean packaged startup?

**Pass when:**

- Spike WIs prove build baseline before feature WIs depend on it.
- Upstream version pins explicit; upgrade path noted.

**Red flags:** Implicit `../` dependency in production build.

**Cite:** `package.json`; gate-build-baseline; ADR 0001 when accepted.

---

### 18. Compatibility and versioning

**Answers:** Breaking IPC/schema changes? Migration for on-disk data?

**Pass when:**

- Breaking changes recorded; `change-policy` followed.
- Version fields or feature flags if needed.

**Red flags:** Silent contract break without ADR.

**Cite:** decisions/; contract version notes.

---

### 19. UX and accessibility (when WI is user-visible)

**Answers:** States visible? Keyboard? Dense tool UI rules?

**Pass when:**

- Loading, error, empty, streaming, aborting states designed.
- Working directory and dangerous actions visible.

**Red flags:** Marketing layout for a developer tool; hidden run state.

**Cite:** `ui.md`; PRD UX sections.

---

## IV. Nine-lens summary (quick second pass)

After the sections above, optionally scan:

| Lens | Ask |
|------|-----|
| **Structure** | Parts and modules identifiable? |
| **Boundaries** | Trust lines drawn and enforced in code paths touched? |
| **Direction** | Dependencies aim inward to domain, outward to adapters? |
| **Behavior** | Dynamic scenarios in WI covered by contracts/state? |
| **Responsibility** | Every touched resource has one owner? |
| **Time** | Lifecycle, ordering, concurrency addressed? |
| **Data** | Truth and persistence paths clear? |
| **Risk** | Open gates/ADRs block “done” claims? |
| **Verification** | Tests/docs:verify/acceptance steps defined? |

---

## Architecture maturity (do not over-claim)

| Level | Meaning |
|-------|---------|
| **Direction** | Diagrams and owners agreed—implementation may not exist |
| **Implementable** | Contracts and modules detailed enough to code without guessing |
| **Verifiable** | Living contracts + tests + CI enforce key rules |
| **Evolvable** | ADRs and gates track change without erosion |

State the level you are claiming for this WI.

---

## Agent obligations

1. **Name the dimension** when raising a risk—not only “messy” or “risky.”
2. **Cite** architecture §, module owner, contract ID, or gate ID—or mark **undocumented**.
3. **Decision class:** `none` | `spike-only` | `adr-after-approval`.
4. On session close, if governance docs changed, run `npm run docs:verify` (product repo).

---

## Maintainer one-liner (architecture-heavy session)

```text
@ ACTIVE.md。本次涉及架构/边界。请按 workflow/architecture-governance.md 对相关维度逐项给出 pass/gap/N/A、磁盘证据与风险，再提案；我确认后再改代码。
```

---

## Worked examples (few-shot)

Agents should **imitate the shape and evidence style** of these examples. Replace product names and paths with the repo you are in. Deeper narrative: optional product `docs/architecture-review-guide.md`.

### Example 1 — Filled governance table (WI-001: toolchain + SDK spike)

**Context:** Initialization phase; WI-001 only proves `package` + import pinned SDK + minimal runtime probe—no chat UI, no real model.

**Conclusion:** `spike-only` — proceed with scaffold; do **not** claim product features or close `gate-build-baseline` until maintainer acceptance.

| Dimension | Status | Evidence on disk | Gap or risk if proceeding |
|-----------|--------|------------------|---------------------------|
| Module decomposition | N/A | No app modules yet; only bootstrap | Premature to split `src/main` services before spike passes |
| Public interfaces | gap | No `contract-ipc` Living | OK for WI-001 if no renderer IPC; gap if adding IPC in same PR |
| Dependencies | pass | `AGENTS.md` L1; planned renderer ↛ SDK | Enforce in first real UI WI |
| Contracts | gap | `reference/ipc-channels.md` = `Planned` | Do not invent channel list in code |
| Ownership | N/A | Architecture §8 owners not implemented | Document owners before multi-task code |
| Requirements & scope | pass | `ACTIVE.md` WI-001 one-line goal | Expanding scope → parking lot |
| Build, release, upgrade | gap | `gate-build-baseline` = `In spike` | Must run `npm run package` and report Node vs SDK minimum |
| Test strategy | pass | `npm test` / spike script in WI acceptance | Agent must paste command output |
| Security & trust | N/A | No credentials in WI-001 | Revisit when IPC + secrets land |

**Maturity claimed:** **Direction** for product architecture; **Verifiable** only for WI-001 acceptance commands.

---

### Example 2 — Filled governance table (proposal: first allowlisted IPC)

**Context:** Maintainer approved WI-002 slice “send text to runtime”; agent proposes `task:send-message` channel.

**Conclusion:** `adr-after-approval` only if gate policy requires it; otherwise `none` after table—**implement only after maintainer OK**.

| Dimension | Status | Evidence on disk | Gap or risk if proceeding |
|-----------|--------|------------------|---------------------------|
| Public interfaces | gap | Proposed narrow handler vs generic invoke | Must update `ipc-channels` to at least `Outline` before merge |
| Contracts | gap | Payload not in `domain-events` / IPC page | Risk: renderer and main drift on DTO shape |
| Dependencies | pass | Handler calls application service, not SDK from preload | Verify imports in diff |
| Ownership | gap | Unclear if `TaskRuntimeController` or `IpcRouter` owns validation | Cite `docs/modules/task-runtime-controller.md` or ask Prepare |
| State machines | gap | No legal states for “send while aborting” | Must define or defer feature |
| Security & trust | pass | `security.md`: validate in host; no secrets in payload | Add schema validation in host |

**Bad follow-up (do not):** “IPC is straightforward; I added fifteen channels.”  
**Good follow-up:** “Two channels in this WI; `contract-ipc` Outline updated; states for `aborting` deferred to WI-003 with gap documented in ACTIVE.”

---

### Example 3 — Judgment dialogues (maintainer ↔ agent)

**3a — “What else should we optimize?”**

- **Maintainer:** “We added architecture-governance.md—what else?”
- **Good:** “Nothing required for current WI-001. Optional later: copy this file to `docs/guides/` and add one row to `path-triggers` when `src/` exists. I would not open new WIs without you asking.”
- **Bad:** Six-item roadmap mixing docs, skills, and refactors with no `ACTIVE.md` link.

**3b — “Write the Accepted ADR now?”**

- **Maintainer:** “Spike looks fine in chat—please Accepted ADR for build baseline.”
- **Good:** “Not yet—need maintainer to run packaged app and confirm log lines in ACTIVE acceptance; until then gate stays `In spike`, Decision `none`.”
- **Bad:** Draft Accepted ADR to please the request.

**3c — Architecture session open**

- **Maintainer:** “@ ACTIVE.md — add Webview chat panel.”
- **Good:** Restate WI, then partial table (dependencies, security, contracts, UX) with pass/gap, decision class `spike-only` if Webview↔host protocol undefined.
- **Bad:** Jump to `Chat.tsx` without boundary or CSP gaps listed.

**3d — Premise vs repo**

- **Maintainer:** “Ship multi-project parallel tasks this week.”
- **Good:** “PRD/architecture describe that; `gate-runtime-host` and task persistence are Open. Recommend parking lot or Prepare WI—cannot claim shipped.”
- **Bad:** “Great, I’ll implement parallel tasks now.”

**3e — Explicit brainstorm**

- **Maintainer:** “Brainstorm only: observability tools we might use later.”
- **Good:** Bulleted **optional / deferred** ideas; “not in ACTIVE; no implementation.”
- **Bad:** Present brainstorm as next sprint commitments.

---

### Example 4 — Public interface: too wide vs narrow (code)

Portable host/UI split review pattern:

Too wide (forbidden pattern):

```typescript
interface HostApi {
  invoke(method: string, args: unknown[]): Promise<unknown>;
}
```

Narrower (directionally correct; still needs **contract** for errors, cancel, concurrency):

```typescript
interface AgentApi {
  prompt(input: PromptInput): Promise<CommandResult<PromptAcceptance>>;
  abort(): Promise<CommandResult<void>>;
}
```

**Review language — bad:** “Preload API is fine.”  
**Review language — good:** “Preload exposes use-case methods, not generic invoke; `PromptInput` / `CommandResult` still need Living `contract-ipc` rows for illegal states and timeout.”

---

### Example 5 — Module decomposition review language (prose)

**Bad:**

> Module decomposition is reasonable.

**Good (structure level, with gaps):**

> Process boundaries separate renderer, preload, main, and pi runtime. Main recognizes runtime, IPC, trust, credentials, and attachments as separate reasons for change. Gap: call boundary between `RuntimeController` and `PiAdapter` is not fixed in docs; `ExtensionUiCoordinator` not in planned tree yet.

Adapt names to VS Code (webview / extension host / adapter) or other products; keep the **evidence + gap** pattern.

---

## Index (dimensions at a glance)

| # | Dimension | § |
|---|-----------|---|
| 1 | Module decomposition | I.1 |
| 2 | Public interfaces | I.2 |
| 3 | Dependencies | I.3 |
| 4 | Contracts | I.4 |
| 5 | Ownership | I.5 |
| 6 | Requirements & scope | II.6 |
| 7 | Domain model | II.7 |
| 8 | State machines | II.8 |
| 9 | Concurrency | II.9 |
| 10 | Errors & recovery | II.10 |
| 11 | Lifecycle & cleanup | II.11 |
| 12 | Security & trust | III.12 |
| 13 | Data & persistence | III.13 |
| 14 | Observability & privacy | III.14 |
| 15 | Performance & backpressure | III.15 |
| 16 | Test strategy | III.16 |
| 17 | Build, release, upgrade | III.17 |
| 18 | Compatibility & versioning | III.18 |
| 19 | UX & accessibility | III.19 |

**Full narrative and examples:** optional product `docs/architecture-review-guide.md`.

Copy this file into product repos as `docs/guides/architecture-governance.md` or link from `AGENTS.md` load map.
