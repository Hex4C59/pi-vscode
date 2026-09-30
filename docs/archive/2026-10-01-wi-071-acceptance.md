# WI-071: Webview directory organization acceptance

English | [中文](2026-10-01-wi-071-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Disposition: Accepted and closed on 2026-10-01 by the agent under the complete-ACTIVE `/goal`
- Authority: historical evidence for this technical slice; not whole-PRD, gate or ADR acceptance
- Scope: [approved proposal](2026-10-01-wi-071-approved-proposal.md)
- Acceptance identity: agent under the maintainer’s `/goal` to finish every ACTIVE.md task; not personal maintainer testing

## Approved behavior

Presentation files now follow [src/webview/README.md](../../src/webview/README.md). `components/` remains the public presentation entry. Feature subdirectories are internal groupings. Production still mounts from `main.tsx`. No protocol, CSS cascade order or user-visible behavior change.

## Placement

| Directory | Contents |
|---|---|
| `client/` | Bridge, parser, webview client, snapshot helpers, client types |
| `chat/composer/` | Composer, context, model picker/display, composer CSS |
| `chat/conversation/` | Conversation, Markdown, welcome mark |
| `chat/sessions/` | Navigation, saved history, session icon |
| `chat/execution/` | Task status, approvals, change review, extension interactions, activity CSS |
| `chat/workspace/` | Folder/resource prompts and workspace setup |
| `ui/` | Shared `chat-dialog` and `chat-preview` |
| `i18n/` | Language packs and `UiLanguageState` |

`candidate-*` names are unchanged.

## Verification

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | pass | Host/webview bundles and `tsc --noEmit` |
| `npm run lint` | pass | `eslint src` |
| `npm test` | 1064 pass, 0 fail/skip | Includes architecture public-entry, packaging path asserts and webview specs |
| `npm run docs:verify` | 0 error; 2 Draft-ADR-0010 warnings | Path updates in anatomy, README and discussion locators |
| Native F5 | not run | Not required by this technical WI |

## Limits

Feature folders are not new module interfaces. `components/index.ts` still re-exports implementations. Runtime rpc grouping is a later WI. Docs directory navigation and PI-GAP candidates stay parked.

## Final disposition

WI-071 is closed. Remaining ACTIVE parking starts at Runtime rpc grouping.
