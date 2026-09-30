# ADR 0010: Local pi-extension inventory persistence and load consent

English | [中文](0010-local-plugin-inventory.zh.md)

- Type: ADR
- Status: Draft
- Created: 2026-10-01
- Decision approval: 2026-10-01 maintainer `/goal` to complete every ACTIVE.md task, serial WI starting at WI-059
- Verification: pending remove/enable UI and runtime apply. WI-060 implemented the host file store with damage/size tests. WI-061 added Settings Plugins empty list and add from disk without skipping load consent. ADR stays Draft until load consent still cannot be skipped.
- Gates: none closed. Does not replace ADR 0002 load consent, coverage warnings, asking, or owned-runtime recovery.
- Work item: WI-059 records the product boundary; later slices implement
- Related: [ADR 0002](0002-interaction-contract-route.md), [REQ-010](../product-requirements.md), [discussion](../discussions/2026-10-01-local-plugin-inventory.md)

## Context

Today Trusted execution picks **one** local entry for **this** runtime through a native picker plus host confirmation. New runtimes start Controlled. The maintainer wants a Settings place that lists, adds, removes and enables already-on-disk pi extensions. That is an inventory, not a move of the two-row Execution profile. Download, marketplace, remote catalog and auto-update stay out.

Listing a path is not loading it. Persistence and trust must be decided before a store or Settings UI exists, otherwise slice 6 would invent them.

## Decision

1. **Inventory is not this-session load.** The inventory is a host-owned list of local pi-extension entry paths plus an enabled flag. Adding, removing or toggling an entry does not start, stop or mutate a live runtime.
2. **Storage is this VS Code profile, not a window or workspace.** Store a bounded JSON file under the extension `globalStorageUri`, separate from `recovery-v1`. Missing file means an empty list. Damaged or oversized files are left unchanged (slice 2). No secrets, extension source, prompts or transcripts in that file. Webview and `postMessage` receive secret-free projections only.
3. **Enable means eligible for the next idle Trusted apply.** Controlled execution still loads only bundled tools and never applies inventory entries. A running Trusted runtime does not change until an idle rebuild or profile switch applies the then-enabled set.
4. **Load consent stays a separate native confirmation.** Existing `selectTrustedExtension` identity checks (absolute path, allowed entry suffix, size, realpath, regular file, not a symlink, not a sensitive path, TOCTOU) remain the load-consent path. The picker is for **Add to inventory**. Switching to Trusted, or otherwise applying enabled entries, still requires the existing coverage-warning confirmation for the paths that will load. Enable is not that confirmation. Project-resource consent is still not extension-load consent.
5. **Remember the chosen path; do not copy files.** Uninstall in this product means drop the list entry. Disk files stay unless a later explicit slice says otherwise.
6. **Apply through public APIs only.** Slice 6 loads enabled entries on idle Trusted start or switch using documented pi CLI/RPC. If the pinned release accepts only one `-e` entry, at most one enabled path may be applied; extra enabled entries fail visibly. No auto-discovery of unlisted paths. Covered tool calls still ask.

## Rationale

A profile-scoped file matches “my plugins” without coupling the list to a recovery domain or a folder. Keeping Controlled ignorant of the list preserves REQ-006’s default. Separating list mutations from load consent prevents Settings from becoming a silent trusted-start. Path-only storage matches “remove from list, keep disk.” Public-API apply prevents a second loading channel.

## Alternatives considered

- Load enabled entries on Controlled start: rejected; that collapses the two policy dimensions.
- Per-window or per-workspace list: rejected; windows already have independent runtimes (ADR 0009); a plugin list is a user-profile preference.
- Copy into a product-owned directory: rejected; uninstall would then imply deleting files, which the parked slices forbid.
- Persist a separate “already consented” bit and skip native confirm: rejected for this ADR; load consent remains the existing dialog. Later slices may still confirm a set of paths in one dialog instead of reopening the picker.
- `globalState` instead of a file: rejected as the primary store; a bounded file has an explicit schema, size cap and leave-unchanged damage rule that `globalState` does not make obvious.

## Consequences

Until later slices ship, the composer Execution profile still picks one entry for this runtime. After they ship, Settings owns add/remove/enable; composer shows status and recovery. ADR remains Draft until a store exists, damage/size rules are tested, and load still cannot skip confirmation. No gate closes.

## Architecture review (WI-059, Direction)

| Dimension | Status | Evidence | Disposition |
|-----------|--------|----------|-------------|
| 2 Public interfaces | Direction | Named host store later; Webview remains projection-only | Slice 2 defines the file schema and validators |
| 5 Ownership | pass | Host owns the list; adapter applies public `-e`; UI renders projections | No dual writers |
| 6 Requirements | pass | REQ-010 / WI-059 docs-only slice | Later slices implement UI and load |
| 7 Domain | pass | Inventory vs this-session load vs Execution profile | Terms in CONTEXT.md |
| 12 Security | pass | Secrets stay in host; sensitive-path rules reused at load | Inventory file is paths plus flags only |
| 13 Persistence | Direction | `globalStorageUri` file, not recovery-v1 or session files | Slice 2 implements leave-unchanged damage |
| 1, 3–4, 8–11, 14–19 | N/A or later | No module split, contract frames, or UI in WI-059 | Revisit at slices 2–6 |

**Conclusion:** document first. Decision class `adr-after-approval`. Maturity: **Direction** until slice 2+ verification.
