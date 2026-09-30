# WI-066: Composer model-chip presentation acceptance

English | [中文](2026-10-01-wi-066-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Disposition: Accepted and closed on 2026-10-01 by the agent under the complete-ACTIVE `/goal`
- Authority: historical evidence for this presentation slice; not whole-PRD, gate or ADR acceptance, and not the REQ-002 duplicate-label gap
- Scope: [approved proposal](2026-10-01-wi-066-approved-proposal.md)
- Acceptance identity: agent under the maintainer’s `/goal` to finish every ACTIVE.md task; not personal maintainer testing

## Approved behavior

Composer and Settings `ModelPickerView` show a formatted model id with no provider. English thinking labels are Title Case. The open picker has no Model / Thinking level / Open provider settings chrome; the centered name+strength opens the list; the slider only changes thinking. Host `chatModel` remains `provider / modelId`. WI-042 radios still use stable `provider:modelId`.

## Verification

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | pass | Host/webview bundles and `tsc --noEmit` |
| `npm run lint` | pass | `eslint src` |
| `npm test` | 1059 pass, 0 fail/skip | Chip `GPT-6-Sol · Low`, list rows without provider, pending copy, Chinese thinking labels |
| Native F5 | not run | Not required by this WI |
| Vite preview | pass for this slice | Empty-session chip `Claude Sonnet · Medium`; open picker has no Model / Thinking level / Open provider settings; list rows `Claude-Sonnet` / `GPT-5` / `Gemini-Pro` with no provider. Checked 280/320/360/400 dark and 320 light/high-contrast. Synthetic host, not F5 or VSIX |

## Limits

Does not close the REQ-002 cross-provider duplicate-label gap. Mutex of model picker versus Execution profile stays later.

## Final disposition

WI-066 is closed. Remaining ACTIVE parking starts at composer popover mutex.
