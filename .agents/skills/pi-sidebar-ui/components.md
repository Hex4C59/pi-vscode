# Component craft

Reference for [pi-sidebar-ui](SKILL.md). Read the sections for the components being changed. Numeric and color choices remain in [tokens.md](tokens.md).

## Reference and evidence

Derived from the maintainer's 2026-09-29 screenshots: Codex and Claude Code idle composers; Codex settings menu, access menu, add menu, effort/model selectors, full settings page and recent-chat history. The preference concerns component proportions and finish, independently of color. The initial conversation images are not stored locally; subsequent Computer Use captures now supply the missing open-state assets. The [visual reference library](visual-reference.md) adds downloaded official Claude and Codex images with annotations, interactive pi candidates and machine-readable component contracts. [Sources](sources.md) distinguish official downloads, local captures and remaining gaps. The refined pi model menu is maintainer-approved; other candidate samples remain unapproved.

Borrow relationships: container/inset/highlight proportions, text and icon alignment, density, and hierarchy. Keep pi identity, theme rules and approved behavior. A reference feature is not a request to add it: approval modes, plugins, search, persistence or editor-tab settings require their own product scope. Use one coherent reference for each component family rather than mixing unrelated silhouettes.

Static images establish visible structure, not animation, exact CSS dimensions, save timing, keyboard behavior or responsive behavior. An emphasized row may be hovered, focused or selected; an unexplained ring does not prove a running state. Verify those meanings through interaction or the product contract.

## Choose density from content

Use the corresponding image and its numbered annotations before applying these rules. The captures suggest **different row families**, not one universal menu style:

| Need | Evidence | Transfer to pi |
|---|---|---|
| Two short commands | [Settings menu](assets/references/local-codex-settings-menu-annotated.png) | Icon and label are sufficient. Omit a heading that merely repeats the trigger. |
| Simple mutually exclusive names | [Codex models](assets/references/local-codex-models-annotated.png) | Keep one reading line and reserve a trailing check slot. Content-bounded width suits this family. |
| Choices that need explanation | [Permissions](assets/references/local-codex-permissions-annotated.png), [Claude models](assets/references/local-claude-models-annotated.png) | Add a quieter second line under the title. Let content justify extra height and width. |
| Many action families | [Add](assets/references/local-codex-add-annotated.png) | Group with low-emphasis headings; retain a common icon/text rail across groups. |
| A focused parameter | [Effort](assets/references/local-codex-effort-annotated.png) | Make the current value easy to find; place model context below it and the control in its own band. |
| Persistent preference rows | [Settings](assets/references/local-codex-settings-annotated.png) | Flexible text, natural-width trailing controls, variable row height, shared group boundary. |
| Fast scanning of recent items | [History](assets/references/local-codex-history-annotated.png) | Consistent compact rows and quiet trailing metadata. Search can provide the header. |

**Width follows information load.** The captured Codex model popup is compact while Add uses most of the sidebar width; Claude's descriptive model list is also wider. Apply the approved compact pi model baseline to simple choices, not indiscriminately to explained choices or settings. At pi's narrow widths, validate wrapping and available space rather than copying captured pixel widths.

**Separate state channels.** In the captured Codex model list, the mouse is on Sol while Astra has the check. This directly supports independent hover and selection visuals. Keyboard focus is a separate pi requirement, not proved by that screenshot. Reserve state-marker space even on unselected rows so labels stay aligned.

**Use boundaries at the right level.** A surface contour separates a popup from its context; an inset highlight identifies a row; a quiet heading separates groups. Settings use shared contours and inset separators for related rows. Adding a box around every label/control repeats the same grouping signal and increases noise.

**A reference can reveal a tradeoff.** Codex popups overlap part of the composer in the captured wide layout. Preserve the approved pi model study's clear draft area instead of copying that overlap. The Claude empty state informs header/composer balance; its second brand lockup and mascot do not supersede pi's single monochrome mark.

## Icon sourcing

Maintainer preference (2026-09-29): use professionally designed library icons for standard UI actions. **Lucide is the default family for the component lab.** Use official geometry rather than agent-generated SVG paths, Unicode approximations, emoji or image-generated icons. Custom icon drawing requires an explicit design request; the pi brand mark is a separate asset governed by tokens.md.

1. Reuse the bundled SVGs in [assets/icons/lucide](assets/icons/lucide/SOURCE.md) first. The source record pins the upstream revision and records rendering choices; the adjacent LICENSE must accompany redistributed assets.
2. When a glyph is missing, select its semantic match from the [official Lucide catalog](https://lucide.dev/icons/) and download its SVG from the official repository. Prefer the pinned revision; record any different revision, original filename and source URL. Keep the original geometry and license locally. A network failure is a missing asset, not a reason to invent a replacement path.
3. Use one family across the affected surface. Preserve SVG viewBox and proportions; tune display size, currentColor and stroke consistently through CSS. Keep the button hit target separate from glyph size. Embed or bundle local assets; avoid runtime CDN requests and unnecessary package dependencies for a few icons.
4. Inspect the actual rendered icons at sidebar size, including light/dark themes and hover states. Check optical alignment, recognizable silhouettes and consistent apparent weight. Keep accessible names on icon-only buttons and mark decorative SVGs aria-hidden.

Current lab mapping: history → `clock`, settings → `settings`, new/add → `plus`, send → `arrow-up`, permissions → `shield-check`, back → `arrow-left`, disclosure → `chevron-down` / `chevron-right`, search → `search`, file → `file`, selected → `check`, close → `x`, shortcuts → `keyboard`. The source choice does not authorize changing the approved model-picker study or production UI outside the current task.

## Composer and small controls

- Treat input and toolbar as one container. Keep attachment previews within that composition without making the input area a stack of decorative panels.
- Group related auxiliary actions and separate them from the send/Stop action. Preserve pi's approved order; use spacing and alignment to clarify groups rather than copying another product's order.
- Compact selectors fit their label plus a small disclosure icon. Keep the label/chevron gap stable and allow long labels to shrink without squeezing the send/Stop control.
- Match icon family, stroke weight and optical size. Center the glyph visually inside its hit target; a small glyph need not imply a small clickable target. Keep auxiliary icon buttons quiet and give send/Stop a clear, controlled silhouette.
- Inspect text baselines, icon centers and distances to container edges together. Correct each using the existing scale; passing token checks alone does not establish good proportions.

## Menus and selectors

Choose the lightest structure that explains the choice:

| Content | Structure |
|---|---|
| A few commands, such as settings/shortcuts | Compact icon-and-label rows |
| Choices needing explanation, such as access modes | Icon, title with description below, trailing selected marker |
| Many related actions, such as the add menu | Quiet group headings and spacing; short descriptions inline when they fit |
| A focused parameter, such as effort | Prominent current value, secondary context and the appropriate control |
| A simple model choice | Name and trailing selected marker |

- Coordinate outer radius, row radius and inset using pi tokens. Keep row highlights inset from the outer border; text needs its own breathing room inside the row.
- Align descriptions with their title, not with the leading icon. Keep trailing checks/disclosure icons from colliding with text.
- Use group spacing before adding divider lines; avoid a separate card for each action. At narrow widths, wrap descriptions beneath titles instead of crushing them inline.
- Represent selection independently of hover and keyboard focus. A check can mark selection while a background emphasizes the pointed row; state changes should not move text or resize the row.
- When scope supports progressive disclosure, keep the current task prominent and reveal secondary choices separately. Do not add nesting solely to imitate a reference.
- Bound the popup to the available viewport, maintain its relationship to the trigger, and scroll long contents locally. Verify edge placement, Escape, focus return and keyboard navigation appropriate to the control semantics; screenshots do not establish these behaviors.
- Preserve pi's permission explanations and confirmation semantics. Visual simplification must not hide consequential differences or imply another product's access model.

### Effort-study revision

The maintainer rejected the thin white native slider on 2026-09-29. The [updated study](assets/component-lab.html) uses a thick light-to-dark gradient and explicit discrete stops. The proposal uses a 24px track and 28px white thumb; the current color treatment is scoped in tokens.md. Keep every supported level visible as a marker; the thumb and current-value heading agree. The maintainer removed the lower label row and the range focus outline; keyboard stepping and accessible value text remain. Native range semantics preserve keyboard stepping. Five levels are sample data, not a hardcoded runtime capability list. The maintainer accepted the tricolor maximum-flow revision on 2026-09-29 and authorized its integration into the production reasoning control; the approved model-menu baseline is unchanged. The color/geometry exception is scoped in [tokens.md](tokens.md).

Effort motion is defined in [motion.md](motion.md#approved-effort-control). Keep the full-track gradient progressively clipped at the thumb; the unfilled track stays neutral. The component lab includes a value-text transition that is not production evidence. Consult ACTIVE.md for host verification status.

## Settings

- Work within the approved settings surface. The reference uses an editor tab with category navigation while chat remains visible; this is evidence of that product's layout, not authorization to migrate pi out of its dialog/sidebar.
- Use category navigation only when the approved surface and number of settings justify it. Establish a readable hierarchy of page/category, section, setting name and description through existing type roles, weight and spacing.
- Group related settings in one section. Where an outer group container is approved, use a quiet shared boundary and hairline row separators, not nested cards. Existing dialog sections can express the same grouping without adding another border.
- Row anatomy: flexible name/description column on the left, content-sized control on the right. Names and descriptions share a start edge; controls share an end edge. Center controls against the row and let descriptions determine row height.
- Use a switch for a binary setting, adjacent choices for a few short alternatives, and a compact selector for longer choice lists when those semantics fit the existing setting. Keep controls proportionally related without forcing equal widths.
- Use brief names, add explanations only where needed, and visually subordinate descriptions. Test real translations; at narrow widths place controls below text when necessary instead of clipping explanations or shrinking the font.
- Keep group separation greater than row padding, and row padding greater than name/description spacing, using the closed scale. Required validation, pending-save or error feedback belongs near its setting; do not infer autosave from the absence of a Save button in a reference.

## Session history

- Integrate search into the list header when search is in approved scope: icon and input aligned to list content, with a quiet separator. Avoid redundant headings and repeated nested input borders; retain an accessible input name.
- Prioritize the title, with compact time and meaningful status in a trailing group. Keep additional metadata only when needed to distinguish sessions or explain scope; do not remove required project/origin or restore warnings for visual parity.
- Use a flexible title region and a nonshrinking trailing group. Give titles a consistent start edge; let timestamps sit next to optional status markers rather than imposing unnecessary table columns.
- Single-line history rows use consistent height and padding, with whole-row inset highlighting and minimal separators. Plan truncation and an accessible way to recover the full title. Description-heavy settings rows deliberately use a different density.
- Bound the list height and scroll its contents locally while keeping search reachable. Loading, empty, no-match and error states use the same frame when applicable, with a clear next action where one exists.
- Apply row craft inside pi's approved history surface. A reference popup does not authorize changing navigation, session restore confirmation or the availability of composer/Stop/approvals.

## Component review

For each changed component, inspect the rendered closed and open states at the skill's target widths/themes:

- Does the outer shape, inset and highlighted row form a coherent whole using existing tokens?
- Do names, descriptions, icons, chevrons and state markers align without crowding or jumping between states?
- Do real English/Chinese labels and long names preserve readable text and reachable actions?
- Are groups clear through spacing, with boundaries only where they explain structure?
- Are selected, hovered, keyboard-focused, disabled and loading states distinguishable where applicable, including without hue alone?
- Can long content scroll within its surface, with affected focus/dismissal behavior verified and important actions reachable in a short viewport?

Report concrete visual checks separately from automated behavior tests, F5 and installed-package evidence. A written rule or a passing build is not evidence that the resulting UI looks good.
