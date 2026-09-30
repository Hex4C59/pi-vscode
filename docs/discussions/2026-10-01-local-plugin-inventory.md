# Local plugin inventory in Settings

English | [中文](2026-10-01-local-plugin-inventory.zh.md)

- Type: Discussion
- Status: Slice 1 accepted as WI-059; later slices remain parked
- Created: 2026-10-01
- Authority: **context only** — current product meanings are in [REQ-010](../product-requirements.md) and [Draft ADR 0010](../decisions/0010-local-plugin-inventory.md)
- Related: [WI-013](../archive/2026-09-28-wi-013-acceptance.md), [ADR 0002](../decisions/0002-interaction-contract-route.md), [WI-059](../archive/2026-10-01-wi-059-acceptance.md), composer execution profile (WI-026)

## Question

The maintainer found the composer **Execution profile** hard to interpret and preferred a Settings place that manages plugins: download, uninstall, enable and disable already-downloaded plugins.

Agent judgment: that is a plugin manager, not a relocation of today's two-row profile. Today's trusted path only picks one local entry for **this** runtime. New runtimes still start controlled. The PRD does not imply a marketplace, install UI or package-management delivery. Extra extension ecosystems remain a standing non-goal except for the parked local-inventory slices below.

## Decision recorded 2026-10-01

The maintainer asked to split the large idea into small tasks and park them in ACTIVE for later serial implementation. Recording is not Prepare completion, Build approval, a PRD change or an ADR. Each slice still needs its own proposal and maintainer Build confirmation. WIP remains 0 until one slice is promoted.

Download/marketplace stays out until a later explicit confirmation. Uninstall in the parked slices means **remove from the inventory**, not delete files on disk, unless a later slice says otherwise.

## Current product (do not treat as the manager)

- Controlled execution: bundled tools only; covered calls still ask.
- Trusted execution: native file picker + host confirmation, then load that entry for this runtime.
- Idle-only profile switch; failure requires explicit recovery.
- WI-013 accepted one local selected target (`pi-system-prompt-manager` 0.1.1 on pi 0.86.1), not arbitrary ecosystem compatibility.

## Parked slice sequence

Promote **one** row at a time. Later rows must not start while an earlier required row is still parked, except that slice 7 may be deferred if the settings list is already the management surface.

| Order | Slice | In | Out | Depends |
|------:|-------|----|-----|---------|
| 1 | Product boundary (Prepare, docs) | Inventory vs this-session load; where the list is stored; what enable/disable means for the next idle runtime; relation to controlled/trusted; PRD slice text; ADR class (`adr-after-approval` if persistence or trust changes) | No code, no UI, no marketplace | — |
| 2 | Host inventory store | Local path identity + enabled flag; missing/damaged/too-large file left unchanged; no secrets in Webview or `postMessage` | No runtime load, no Settings UI | 1 |
| 3 | Settings Plugins category: empty list + add from disk | Native picker adds to the inventory; empty, duplicate and invalid-path states | Does not change startup load | 2 |
| 4 | Remove from inventory | Drop the list entry; disclose that disk files stay | Does not uninstall pi global packages or delete the extension directory | 3 |
| 5 | Enable / disable | Persist the flag; disclose that a running runtime does not change until idle rebuild/switch | No silent mutation of a live trusted load | 3 |
| 6 | Apply enabled entries at runtime | Idle start or profile switch loads enabled inventory entries through public pi APIs; coverage warnings; failure recovery unchanged | No skip-approvals; no auto-discovery of unlisted paths | 1 and 5 |
| 7 | Composer entry fold | Permissions/composer shows status (and recovery if required); full add/remove/enable lives in Settings | No load-semantics change | 6 |

**Blocked later (not in the serial queue):** download, marketplace, remote catalog, auto-update, signed packages, enable-by-default across all windows without consent.

Candidate numbering when promoted: start at **WI-059**. Do not pre-assign those IDs in ACTIVE as current work.

## Slice 1 resolutions (WI-059)

Recorded in [REQ-010](../product-requirements.md) and [Draft ADR 0010](../decisions/0010-local-plugin-inventory.md):

- Enable means eligible for the **next idle Trusted apply**. Controlled never loads inventory entries.
- The list is this **VS Code profile** (`globalStorageUri`), not a window or workspace.
- Enable is not load consent. Native confirmation still covers paths that will load.
- Adding from disk **remembers the absolute path**; it does not copy files.

## Leaning

Ship a **local inventory** in Settings before any download UI. Keep tool-approval asking. Persistence and trust are ADR-worthy; that ADR is Draft until later slices verify the store and consent.
