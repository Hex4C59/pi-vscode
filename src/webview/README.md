# Webview directory guide

English | [中文](README.zh.md)

- Type: Guide
- Status: Draft
- Scope: proposed file organization within `src/webview/`

This guide records the proposed Webview directory structure and explains where files belong. The tree below is a target structure, not the current filesystem. This documentation task does not move source files or establish new module interfaces. Candidate placements are based on existing filenames and documented responsibilities; check actual imports and reuse before moving files.

The [system architecture](../../docs/architecture/vscode-extension-architecture.md#source-directories) owns layers, dependencies and contract ownership. This guide describes organization inside the presentation layer.

## Proposed structure

```text
src/webview/
├── README.md
├── README.zh.md
├── main.tsx
├── index.ts
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
├── styles/
├── preview/
└── tests/
```

Currently, `chat/`, `components/`, `settings/`, `styles/`, `preview/` and `tests/` exist. `client/`, `ui/`, `i18n/` and the five feature directories inside `chat/` are proposed. Files under `components/` would be placed by feature or actual reuse, eventually replacing that broad directory.

## Directory responsibilities

| Directory | Responsibility | Candidate contents |
|-----------|----------------|--------------------|
| `client/` | Browser-side message transport, host-message parsing, projection state and client request coordination. Presentation modules use its capabilities to communicate with the host. | Current root files `bridge.ts`, `parse-host-message.ts`, `webview-client.ts`, `client-state.ts`, `saved-history-client.ts` and client-owned types. |
| `chat/` | Chat page entry and composition: assemble feature modules into the sidebar and coordinate page-level layout. | `index.ts`, page mount types, `candidate.tsx` and page-wide `candidate.css`. |
| `chat/composer/` | Draft input, context and attachment controls, and composer-specific presentation. | `message-composer.tsx` / `.css`, `candidate-context.tsx` / `.css`, `composer-icon.tsx`; composer-specific styles currently under `styles/`. |
| `chat/conversation/` | Conversation and reply rendering, Markdown presentation, and welcome content in the message area. | `candidate-conversation.tsx` / `.css`, `reply-markdown.tsx`, `pi-welcome-mark.tsx`. |
| `chat/sessions/` | Session navigation, saved-history presentation and transitions between conversation and history views. | `session-navigation.tsx` / `.css`, `candidate-sessions.tsx` / `.css`, `session-icon.tsx`, and `components/saved-history.tsx` / `.css`. |
| `chat/execution/` | Execution status, tool approvals, standard extension interactions and change-review presentation. Host policy and runtime execution retain their existing owners. | `task-status.tsx` / `.css`, `extension-interactions.tsx` / `.css`, `components/approvals.tsx`, `components/change-review.tsx` / `.css`, and chat-specific approval/review styles. |
| `chat/workspace/` | Workspace readiness prompts and project-resource consent presentation. The host remains authoritative for workspace identity, eligibility and consent. | `no-folder-prompt.tsx`, `project-resource-consent.tsx`, `project-resources-prompt.tsx`, and `components/workspace-setup.tsx`. |
| `settings/` | Separate settings page entry, page composition and page-specific styles. | Existing `index.tsx` and `settings.css`; future settings-specific presentation. |
| `ui/` | Basic presentation modules actually reused by multiple features, without ownership of chat, session or execution state. | `chat-dialog.tsx` / `.css` if shared usage warrants it; genuinely shared icons or controls. Feature-specific UI stays with its feature. |
| `i18n/` | UI language state, translation definitions and language packs shared by browser presentation. | `chat/ui-language.ts`, `chat/ui-zh-cn.ts`, and translation-related definitions under `components/ui-text.tsx`. Preview language fixtures retain their preview owner. |
| `styles/` | Global theme tokens, base rules, shared layout and responsive rules. Feature-specific styles live beside their owning feature. | `theme.css`, `base.css`, `layout.css`, `responsive.css`; shared rules from `controls.css` after checking ownership. |
| `preview/` | Browser preview entries, synthetic scenarios, simulated host messages, review pages and developer controls. | Existing HTML/TS/TSX review entries, `scenarios.ts`, `preview-bridge.ts`, and preview-only styles. |
| `tests/` | Page composition tests, interactions across features, and shared browser test fixtures. | Existing application/client integration specs and shared React or candidate harnesses. Feature-owned tests can be colocated inside the feature when source files are reorganized. |

`chat/execution/` initially groups related files. If approvals, interactions or review later need independent interfaces, evaluate their module decomposition separately. Creating this directory alone does not merge their state or responsibilities.

## Files at the Webview root

- `main.tsx` selects and mounts the host-authored chat or settings surface.
- `index.ts` retains the Webview layer entry according to its existing consumers.
- `styles.css` assembles the stylesheet cascade. Preserve the required loading order when moving styles.
- These README files explain directory placement. Module-owned types move with their owners; retain root `types.ts` only for genuinely layer-wide types.

## Placement principles

1. **Group by feature.** Place a feature's TSX, dedicated CSS and supporting files together. Saved history, approvals and change review belong to named features rather than a generic `components/` collection.
2. **Share after observing reuse.** Keep local UI with its feature. Put it in `ui/` when multiple features use the same presentation responsibility. A shared model picker may warrant its own named directory if both chat and settings consume it.
3. **Keep language definitions together.** Shared translation definitions and language packs belong in `i18n/`; feature behavior stays with the feature. Check ownership of the current broad `types.ts` files before dividing them.
4. **Retain the production/preview split.** Production and preview share chat presentation through its entry. Synthetic scenarios, timers and developer controls stay in `preview/`. The filename `candidate` does not establish preview ownership: production also uses the current chat composition.
5. **Distinguish grouping from an interface.** A feature subdirectory can remain an internal grouping. Add a public entry and explicit module interface when callers need to consume the module as a whole; each folder does not automatically need `index.ts` or `types.ts`.
6. **Preserve existing architectural owners.** Host-owned cross-layer contracts remain in `src/extension/contracts/`, consumed by the browser as types. The [architecture document](../../docs/architecture/vscode-extension-architecture.md#source-directories) remains authoritative for dependency direction and responsibilities.

## Suggested organization order

1. Group session, composer and execution files inside `chat/`, including their dedicated styles currently split between `chat/` and `components/`.
2. Group browser client files and shared language files under `client/` and `i18n/`.
3. Place remaining `components/` files according to feature ownership or confirmed shared usage. Check consumers of `chat-preview.tsx`, `model-picker.tsx` and broad type files before choosing their destination.
4. Consider renaming production `candidate-*` files to describe their roles after ownership is clear. The target tree retains the current composition name so it does not imply renaming has occurred.

These steps describe proposed organization only. Source moves, import changes, stylesheet ordering and build/test entry adjustments belong to a separate implementation task.
