# pi VS Code — Product requirements

English | [中文](product-requirements.zh.md)

- Type: Product requirements
- Status: **Draft**
- Created: 2026-09-19
- Authority: **user-visible scope and acceptance when `Accepted`**; until then, outline only—not implementation authority
- Related: [`../ACTIVE.md`](../ACTIVE.md), [`architecture/`](architecture/), [`guides/agent-collaboration.md`](guides/agent-collaboration.md)

> **Draft:** Agents must not treat this file as shipped product behavior. Spike and toolchain work follow **`ACTIVE.md` WI-001** until you promote this document.

## Traceability to active work

Keep PRD slices aligned with **one WI at a time** (WIP=1). User-visible delivery claims require both **Accepted PRD sections** and **WI acceptance** in `ACTIVE.md`.

| WI ID | PRD section(s) | Acceptance (mirror or link `ACTIVE.md`) |
|-------|----------------|----------------------------------------|
| WI-001 | *(none — technical spike)* | See `ACTIVE.md` acceptance list |
| <!-- WI-002 --> | <!-- § User-visible … --> | <!-- copy acceptance bullets when WI opens --> |

**Parking lot** ideas stay in `ACTIVE.md` until a WI owns them and this table gains a row.

## Product summary (Draft)

Developers using VS Code who already run or want to run **pi** as their coding agent get a **sidebar chat** beside their editor (secondary sidebar by default) without giving the chat UI direct access to secrets or the pi runtime. Long-term scope aligns with **pi-desktop** presentation goals where practical; VS Code–specific UX (Explorer left, chat right) takes precedence over pixel parity with Electron.

## User-visible requirements (outline)

Use numbered requirements only when you are ready to maintain them. Prefer **observable behavior**, not implementation.

| ID | Requirement (Draft) | Notes |
|----|---------------------|-------|
| REQ-001 | <!-- e.g. User can … --> | <!-- out of scope for WI-001 --> |

## Non-goals

- Editor-tab chat as the default layout (parking lot)
- Native VS Code Chat Participant as the only UI (parking lot)
- Reimplementing pi agent loop, providers, or session file format in this extension
- WI-001: real chat, sessions, or paid provider integration beyond dev spike needs

## Out of scope for initialization

During WI-001 (toolchain + spike), leave REQ rows empty or marked `deferred`. Do not mark this file `Accepted` for spike-only work.

## Promoting to `Accepted`

1. Maintainer confirms the outline matches what they will accept as “done” for an upcoming WI.
2. Set **Status** on this file to `Accepted` (metadata line above).
3. Ensure the **Traceability** table links the owning WI and acceptance bullets.
4. Run `npm run docs:verify`. Add `product-requirements.zh.md` to `scripts/docs-i18n-config.mjs` when using bilingual docs.
5. Agents may cite REQ IDs for user-visible scope; architecture and gates still govern structure.

To demote or supersede: set `Status: Superseded`, move narrative to [`archive/`](archive/) if needed, and open a new Draft PRD or WI.
