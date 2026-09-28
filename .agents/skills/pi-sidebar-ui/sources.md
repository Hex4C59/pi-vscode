# Visual reference sources

Retrieved 2026-09-29 (Asia/Shanghai). These are visual study references, not pi product requirements or proof of current competitor behavior. First-party screenshots may depict an earlier build; no pictured build or capture date was established. Use composition and component relationships, then apply pi tokens and approved scope. Logos, colors, example content, and product features are not templates to copy. Attribution identifies provenance; these third-party images are not relicensed as project code.

## Downloaded Claude Code images

Both assets are linked as images from the fetched [Claude Code VS Code documentation](https://code.claude.com/docs/en/vs-code). The local source files are unmodified originals from its image CDN. [catalog.json](assets/references/catalog.json) supplies the machine-readable index, original-pixel crop coordinates and annotation boxes. Separately generated [sidebar study](assets/references/claude-interface-annotated.png) and [composer study](assets/references/claude-composer-annotated.png) crop the relevant regions and add numbered explanations. These derivatives preserve the originals and do not claim exact CSS measurements.

| Local image | Original asset | Dimensions | Useful regions |
|---|---|---|---|
| [Conversation and composer](assets/references/claude-vscode-interface.jpg) | [Official CDN original](https://mintcdn.com/claude-code/-YhHHmtSxwr7W8gy/images/vs-code-extension-interface.jpg) | 2500 × 1155 | Right-side session header, tool rows, composer and toolbar. Surrounding decorative background is not part of the extension. |
| [Focused composer](assets/references/claude-vscode-composer.png) | [Official CDN original](https://mintcdn.com/claude-code/FVYz38sRY-VuoGHA/images/vs-code-send-prompt.png) | 3288 × 1876 | Right sidebar, especially input/toolbar boundary, compact context labels, send button and header actions. |

Both files were downloaded and visually inspected. The first uses a visibly different composer from the second and from the user's screenshots. Compare a single coherent component reference at a time. Neither image establishes responsive behavior, keyboard support, opening/closing behavior, save timing, or current UI parity.

## Codex retry and downloaded image

The initial [Codex IDE overview](https://developers.openai.com/codex/ide/) and [IDE features page](https://developers.openai.com/codex/ide/features/) requests timed out. **Retry on 2026-09-29 after the maintainer enabled TUN succeeded:** both returned HTTP 200 after redirects and the same page with canonical URL [Codex IDE](https://learn.chatgpt.com/docs/codex/ide). The [official OpenAI extension listing](https://marketplace.visualstudio.com/items?itemName=OpenAI.chatgpt) had loaded earlier without usable screenshots.

The fetched IDE page links [ide-review.webp](https://learn.chatgpt.com/images/codex/ide-review.webp). Its unmodified [local original](assets/references/codex-ide-review.webp) is 1600 × 900 and was visually inspected. The [annotated sidebar crop](assets/references/codex-ide-review-annotated.png) highlights the session header, grouped file rows and integrated composer. Original and crop metadata are in the same catalog used by the gallery. The pictured build/capture date remains unknown. The decorative outer backdrop and screenshot example content are not pi design requirements.

The linked [developer settings page](https://learn.chatgpt.com/docs/developer-settings?surface=ide) also returned HTTP 200, but its image elements contained only branding/surface icons, not a full settings screenshot. The new Codex image shows closed controls and does not fill the opened-menu/settings/history gaps below.

## Local VS Code captures

Captured 2026-09-29 using Computer Use in the maintainer's installed VS Code: `openai.chatgpt` and `Anthropic.claude-code`. These are **local observations**, not official website screenshots. Exact extension versions, VS Code zoom and display-to-CSS scale were not established. Each full-window PNG was 2940 × 1650; only component crops enter this skill. Full-window originals remain in the maintainer's local Pictures capture folder, outside the repository. `catalog.json` records original filenames, crop coordinates, dimensions, redaction rectangles and annotation boxes; crop coordinates are image pixels, not CSS values.

| Local component source | Visible evidence |
|---|---|
| [Codex effort](assets/references/local-codex-effort.png) | Prominent value, quieter model context, separate slider band |
| [Codex models](assets/references/local-codex-models.png) | Pointer highlight on Sol while Astra retains the selected check |
| [Codex Add](assets/references/local-codex-add.png) | Quiet group headings, icon rail, inline short descriptions; visible portion only |
| [Codex permissions](assets/references/local-codex-permissions.png) | Header/help row, icon/title/description/check slots |
| [Codex settings menu](assets/references/local-codex-settings-menu.png) | Two compact command rows without an extra heading |
| [Codex settings page](assets/references/local-codex-settings.png) | Navigation, shared group boundaries, varying row height, naturally sized controls |
| [Codex history](assets/references/local-codex-history.png) | Integrated search, inset rows, trailing ages and optional markers; titles redacted |
| [Claude empty session](assets/references/local-claude-empty.png) | Sparse session header, generous canvas, integrated composer |
| [Claude models](assets/references/local-claude-models.png) | Descriptive two-line choices and separate effort footer |

For each image, the gallery also offers a numbered annotated derivative. History title pixels are replaced with neutral bars: this image supports row/metadata structure, **not original title typography, lengths or truncation**. All other crops preserve component pixels; surrounding workspace and unrelated conversation content are excluded. Local model names may reflect custom configuration, not the vendor's default catalogue. Colors, branding and available actions are not pi requirements.

Observed interaction was limited to opening menus/pages, opening Codex's model list from its effort panel, dismissing surfaces and switching plugin tabs. No model, permission or setting was changed. Screenshots do not establish keyboard navigation, save timing, responsive placement, accessibility conformance or all list states.

## Remaining coverage gaps

The local captures now fill the previously missing **visible** Codex settings, permissions, Add, effort/model and history references. No online replacement for those states was obtained; local evidence is indexed separately. Light/high-contrast themes, narrow widths, long-label behavior, loading/empty/error states, and Claude settings/history remain uncaptured. The approved pi model-menu study is a separate visual baseline; other pi specimens remain candidates. See [visual workflow](visual-reference.md).

## Component lab icons (2026-09-29)

The lab uses 13 SVGs downloaded from the official [Lucide icon library](https://lucide.dev/icons/). Pinned revision, originals and upstream license are retained in [the local source record](assets/icons/lucide/SOURCE.md). Geometry is embedded locally with currentColor, a 24-unit viewBox and a 1.75-unit stroke. Header icons render at 20px, standard icons at 16px, and compact chevrons at 12px. This replaces the lab’s hand-drawn paths only; the accepted model-picker study and production UI retain their own acceptance scope.
