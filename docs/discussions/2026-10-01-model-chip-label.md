# Composer model-chip label craft

English | [中文](2026-10-01-model-chip-label.zh.md)

- Type: Discussion
- Status: Parking-lot direction; not Build authorization or PRD acceptance
- Created: 2026-10-01
- Authority: **context only** — does not override [`ACTIVE.md`](../../ACTIVE.md), the [PRD](../product-requirements.md), or architecture
- Related: REQ-002, [WI-042](../archive/2026-09-30-wi-042-macos-acceptance.md), [`ModelPickerView`](../../src/webview/components/model-picker.tsx)

## Question

The maintainer found the closed composer chip and the open model popover ugly. Example: `hellocode / gpt-6-sol · low`. Confirmed presentation:

1. Do **not** show the provider name anywhere in this control (`hellocode` gone from chip, popover header, and list rows).
2. Dedicated abbreviations in the model id are uppercase (`gpt` → `GPT`).
3. An ordinary noun token is Title Case (`sol` → `Sol`).
4. Thinking-strength English labels start with a capital (`low` → `Low`).
5. Remove the open-panel chrome **Model**, **Thinking level**, and **Open provider settings**.
6. Put formatted model name and thinking strength **together, centered**. That block is one hit target: **click opens the model list** (not cycle-to-next).
7. The **slider below** only changes thinking strength.
8. List rows use the same formatted id and also omit the provider.

Target reading for that example: **`GPT-6-Sol · Low`**. Provider settings stay on the sidebar gear, not inside this popover.

Recording this is not Build. Promotion still needs a Prepare proposal and maintainer confirmation. Decision class: `none` unless slice work changes host identity strings (it should not).

## Current behavior

[`ModelPickerView`](../../src/webview/components/model-picker.tsx) prints `state.chatModel` on the trigger. Host projections use `provider / modelId` (tests and live `hellocode / gpt-6-sol`). Known thinking levels go through `t(level)`, so English chrome is lowercase `off` / `low` / `medium` / …; Chinese already uses 关闭／低／中／高／最高.

[WI-042](../archive/2026-09-30-wi-042-macos-acceptance.md) marks the applied **radio** by stable `provider:modelId`, then a unique display label. That identity rule stays. This parking item is **composer model-control presentation** (closed chip + open popover), not a runtime-selection change.

REQ-002 still requires the user to be able to tell which configured model is selected. Omitting the provider on chip and list is an explicit presentation choice; uniqueness remains the picker radios plus host identity. Cross-provider duplicate display names stay the existing REQ-002 gap in the [implementation check](2026-09-30-requirements-implementation-check.md)—do not pretend this craft slice fixes that.

## Parked slice

| Order | Slice | In | Out |
|------:|-------|----|-----|
| 1 | Composer model control | Closed chip, open popover header, and list rows: formatted **model id** (no provider); hyphen tokens as above; English thinking Title Case. Open panel: no Model / Thinking level / Open provider settings labels; centered name+strength is the model-list trigger; slider only changes thinking | No provider/model identity protocol change; no skip-approvals; no catalog rewrite; no plugin-inventory work |

**Default for unknown tokens:** Title Case the alphabetic segment. Do not grow an unbounded brand glossary in code without listing the dedicated abbreviations in the WI proposal (`gpt` is confirmed; others only when the maintainer names them).

## Confirmed 2026-10-01

Clicking the centered name+strength **opens the model list**. List rows **do not show the provider** and use the same id formatting.

## Still open for Prepare

- Does the **settings default-model** surface follow the same rule?
- English `xhigh`: `Xhigh` vs `XHigh`? (Chinese 最高 unchanged.)
- Pending next-turn model/thinking on the chip: same formatting?

## Leaning

Format at the Webview presentation layer from `provider / modelId` (or catalog `modelId`) rather than changing host `chatModel` identity strings. Keep WI-042 radio identity. Treat this as independent of the local plugin-inventory queue.
