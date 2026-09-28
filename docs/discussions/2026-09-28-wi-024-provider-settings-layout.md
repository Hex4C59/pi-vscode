# WI-024: provider settings layout (progressive disclosure)

English | [中文](2026-09-28-wi-024-provider-settings-layout.zh.md)

- Type: Discussion
- Status: Accepted (layout choice)
- Created: 2026-09-28
- Authority: **context only** — does not override [`ACTIVE.md`](../../ACTIVE.md) acceptance or host contracts

## Background

WI-024 first shipped a gear-settings section that listed every API-key provider vertically (`src/webview/chat/interface-settings.tsx`). The host still projects the full non-secret `providers` array plus a cross-provider default-model `catalog`. After F5, the maintainer reported that the sidebar dialog is too long and proposed a provider select that reveals API-key actions for one vendor at a time.

## Decision (maintainer, 2026-09-28)

Adopt **option 3 (hybrid)**:

1. Keep **Default model** as a top-level control over the existing cross-provider catalogue.
2. Show a one-line **configured-providers** summary.
3. Use a **Provider** `<select>`; Add / Update / Remove apply only to the selected vendor.
4. Do not change host messages, secrets path, or `setDefaultModelAndProvider` semantics.

## Evidence

- Implemented in `interface-settings.tsx` with UI strings/CSS and `provider-config-ui.spec.ts`.
- Host contract remains `providerConfigState` + existing intents; API keys still collect only via host InputBox.

## Visual polish (2026-09-28)

Maintainer found the hybrid layout still visually irregular (mixed left/right rows, uneven buttons, orphaned refresh). Redesigned the settings dialog to follow VS Code narrow-panel form patterns:

- One-column stacked fields (label above, control full width)
- Credential status + actions in one bordered panel with equal-width button grid
- Refresh as a secondary dashed control
- Shared section rhythm with the execution-profile block

Behavior and host contracts unchanged.
