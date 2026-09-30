# WI-066: Approved composer model-chip presentation

English | [中文](2026-10-01-wi-066-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical approved scope, not a new Build authorization for later slices
- Archival reason: WI-066 composer model-chip craft is implemented and tested; remaining ACTIVE tasks are independent.

## Approval and Traceability

The maintainer `/goal` to complete every ACTIVE.md task authorized this Build after WI-065. User-visible: REQ-002 composer model-control presentation. Decision: none. No gate.

## Goal and Scope

Closed chip, open picker header, and list rows omit the provider and format the model id (`gpt`→`GPT`, other alphabetic tokens Title Case). English thinking labels start with a capital (`low`→`Low`, `xhigh`→`Xhigh`). Target reading `GPT-6-Sol · Low`. Remove open-panel Model / Thinking level / Open provider settings chrome. Centered name+strength is one hit target that opens the model list. The slider only changes thinking. WI-042 radio identity stays. Do not close the REQ-002 duplicate-label gap.

## Approach

Format at the Webview presentation layer from `provider / modelId` (or catalog `modelId`). Do not change host `chatModel` identity strings. Dedicated abbreviation list is only `gpt`. Settings default-model follows because it shares `ModelPickerView`. Pending next-turn copy uses the same formatters.

## Acceptance

`hellocode / gpt-6-sol` with `low` displays `GPT-6-Sol · Low`. List rows have no provider. compile/lint/`npm test`. Native F5 not required.

## Subsequent Limits

Model-picker versus Execution-profile mutex, REQ-001 declined-resource notice, REQ-002 duplicate-label identity, REQ-009 remainder, directory organization.
