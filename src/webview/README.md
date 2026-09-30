# Webview directory guide

English | [中文](README.zh.md)

- Type: Guide
- Status: Accepted
- Scope: current file organization within `src/webview/`

This guide records where files belong inside the presentation layer. The tree matches the current filesystem. Feature subdirectories are internal groupings unless a public `index.ts` exists.

The [system architecture](../../docs/architecture/vscode-extension-architecture.md#source-directories) owns layers, dependencies and contract ownership. This guide describes organization inside the presentation layer.

## Current structure

```text
src/webview/
├── README.md
├── README.zh.md
├── main.tsx
├── index.ts
├── types.ts
├── styles.css
├── client/
├── chat/
│   ├── index.ts
│   ├── types.ts
│   ├── candidate.tsx
│   ├── candidate.css
│   ├── composer/
│   ├── conversation/
│   ├── sessions/
│   ├── execution/
│   └── workspace/
├── settings/
├── ui/
├── i18n/
├── components/
├── styles/
├── preview/
└── tests/
```

`components/` remains the public presentation entry (`index.ts` and `types.ts`). Feature implementations live beside their owners.

## Directory responsibilities

| Directory | Responsibility | Contents |
|-----------|----------------|----------|
| `client/` | Browser-side message transport, host-message parsing, projection state and client request coordination. Presentation modules use its capabilities to communicate with the host. | `bridge.ts`, `parse-host-message.ts`, `webview-client.ts`, `client-state.ts`, `saved-history-client.ts`, and client-owned `types.ts`. The Webview layer entry re-exports that contract. |
| `chat/` | Chat page entry and composition: assemble feature modules into the sidebar and coordinate page-level layout. | `index.ts`, page mount types, `candidate.tsx` and page-wide `candidate.css`. |
| `chat/composer/` | Draft input, context and attachment controls, and composer-specific presentation. | `message-composer`, `candidate-context`, `composer-icon`, `model-picker`, `model-display`, and composer CSS. Settings does not consume the picker. |
| `chat/conversation/` | Conversation and reply rendering, Markdown presentation, and welcome content in the message area. | `candidate-conversation`, `reply-markdown`, `pi-welcome-mark`. |
| `chat/sessions/` | Session navigation, saved-history presentation and transitions between conversation and history views. | `session-navigation`, `candidate-sessions`, `session-icon`, `saved-history`. |
| `chat/execution/` | Execution status, tool approvals, standard extension interactions and change-review presentation. Host policy and runtime execution retain their existing owners. | `task-status`, `extension-interactions`, `approvals`, `change-review`, and their CSS including former `styles/activity.css`. |
| `chat/workspace/` | Workspace readiness prompts and project-resource consent presentation. The host remains authoritative for workspace identity, eligibility and consent. | `no-folder-prompt`, `project-resource-consent`, `project-resources-prompt`, `workspace-setup`. |
| `settings/` | Separate settings page entry, page composition and page-specific styles. | `index.tsx`, `plugins.tsx`, `settings.css`. |
| `ui/` | Basic presentation modules reused by multiple features, without ownership of chat, session or execution state. | `chat-dialog` (workspace prompts) and `chat-preview` (conversation and review). |
| `i18n/` | UI language state, translation definitions and language packs shared by browser presentation. | `ui-language.ts`, `ui-zh-cn.ts`, `ui-text.tsx`. Preview language fixtures retain their preview owner. |
| `components/` | Public presentation entry for chat composition. Not a feature dump. | `index.ts` re-exports feature implementations; `types.ts` remains the presentation contract. |
| `styles/` | Global theme tokens, base rules, shared layout and responsive rules. Feature-specific styles live beside their owning feature. | `theme.css`, `base.css`, `layout.css`, `controls.css`, `responsive.css`. |
| `preview/` | Browser preview entries, synthetic scenarios, simulated host messages, review pages and developer controls. | Existing HTML/TS/TSX review entries, `scenarios.ts`, `preview-bridge.ts`, and preview-only styles. |
| `tests/` | Page composition tests, interactions across features, and shared browser test fixtures. | Existing application/client integration specs and shared React or candidate harnesses. |

`chat/execution/` groups related files. If approvals, interactions or review later need independent interfaces, evaluate their module decomposition separately. This directory does not merge their state or responsibilities.

## Files at the Webview root

- `main.tsx` selects and mounts the host-authored chat or settings surface.
- `index.ts` retains the Webview layer entry according to its existing consumers.
- `types.ts` re-exports the client contract for the Webview layer entry.
- `styles.css` assembles the stylesheet cascade. Preserve the required loading order when moving styles.
- These README files explain directory placement.

## Placement principles

1. **Group by feature.** Place a feature's TSX, dedicated CSS and supporting files together. Saved history, approvals and change review belong to named features rather than a generic `components/` collection.
2. **Share after observing reuse.** Keep local UI with its feature. Put it in `ui/` when multiple features use the same presentation responsibility.
3. **Keep language definitions together.** Shared translation definitions and language packs belong in `i18n/`; feature behavior stays with the feature.
4. **Retain the production/preview split.** Production and preview share chat presentation through its entry. Synthetic scenarios, timers and developer controls stay in `preview/`. The filename `candidate` does not establish preview ownership: production also uses the current chat composition.
5. **Distinguish grouping from an interface.** A feature subdirectory can remain an internal grouping. Add a public entry and explicit module interface when callers need to consume the module as a whole; each folder does not automatically need `index.ts` or `types.ts`.
6. **Preserve existing architectural owners.** Host-owned cross-layer contracts remain in `src/extension/contracts/`, consumed by the browser as types. The [architecture document](../../docs/architecture/vscode-extension-architecture.md#source-directories) remains authoritative for dependency direction and responsibilities.

Renaming production `candidate-*` files to describe their roles remains a later optional step after ownership is already clear.
