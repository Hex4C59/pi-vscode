# Composer model-chip label craft

English | [中文](2026-10-01-model-chip-label.zh.md)

- Type: Discussion
- Status: WI-066 delivered chip/list presentation; WI-067 delivered model-picker vs Execution-profile mutex
- Created: 2026-10-01
- Authority: **context only** — does not override [`ACTIVE.md`](../../ACTIVE.md), the [PRD](../product-requirements.md), or architecture
- Related: REQ-002, [WI-042](../archive/2026-09-30-wi-042-macos-acceptance.md), [WI-066](../archive/2026-10-01-wi-066-acceptance.md), [WI-067](../archive/2026-10-01-wi-067-acceptance.md), [`ModelPickerView`](../../src/webview/chat/composer/model-picker.tsx)

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

[`ModelPickerView`](../../src/webview/chat/composer/model-picker.tsx) formats the model id at the Webview layer (`displayModelId` / `formatModelId`) and Title-Cases English thinking labels. Host projections remain `provider / modelId`. Chinese thinking labels stay 关闭／低／中／高／最高.

[WI-042](../archive/2026-09-30-wi-042-macos-acceptance.md) still marks the applied **radio** by stable `provider:modelId`. WI-066 did not change that identity rule.

REQ-002 still requires the user to be able to tell which configured model is selected. Omitting the provider on chip and list is an explicit presentation choice; uniqueness remains the picker radios plus host identity. Cross-provider duplicate display names stay the existing REQ-002 gap in the [implementation check](2026-09-30-requirements-implementation-check.md).

## Delivered by WI-066

Slice 1 (composer model control) is implemented: formatted id, no provider, English thinking Title Case, no open-panel chrome titles or Open provider settings, centered name+strength opens the list, slider only changes thinking. Settings default-model follows because it shares `ModelPickerView`. English `xhigh` is `Xhigh`. Pending next-turn copy uses the same formatters.

## Remaining parking

None from this discussion. REQ-002 duplicate-label identity stays a separate ACTIVE parking item.

## Leaning

Format at the Webview presentation layer from `provider / modelId` (or catalog `modelId`) rather than changing host `chatModel` identity strings. Keep WI-042 radio identity. Mutex is a later composer-local WI (delivered as WI-067).
