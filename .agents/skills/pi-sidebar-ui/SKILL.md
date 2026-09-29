---
name: pi-sidebar-ui
description: >-
  Applies pi VS Code sidebar visual craft: quiet tool-like empty session,
  scoped Pi branding, component motion, VS Code theme surfaces, closed spacing and type scales. Use
  when editing webview CSS or chat TSX, the candidate empty state, composer,
  session bar, popovers, model selectors, settings, session history, icon buttons, icon assets, visual polish,
  or when the user mentions sidebar
  UI, empty session, π mark, or accent color.
---

# Pi sidebar UI

Quiet, tool-like chat in the VS Code **secondary sidebar**. Mature AI-coding-assistant **proportions and finish**, never another product’s mark, mascot, or greeting.

The central production welcome mark has a maintainer-approved tricolor/block-drop exception (2026-09-29); see [tokens.md](tokens.md). Other monochrome rules below remain scoped to other surfaces.

The maintainer-approved effort control (now integrated into the production model popover) has a gradient exception; see [tokens.md](tokens.md).

This skill is craft. It does not authorize Build. User-visible CSS/TSX still needs `ACTIVE.md` approval.

## When you are done

For the surfaces changed, inspect actual rendered screenshots at 280 / 320 / 400px in light / dark / high-contrast, including opened controls. The idle empty session remains one work surface, small π + one plain line, composer pinned to the bottom. Spacing and type use [tokens.md](tokens.md). Apply the relevant checklist items below; report unavailable visual or interaction evidence rather than treating compilation as visual acceptance.

## Process

1. Read this file and [tokens.md](tokens.md).
2. If the task changes shipped UI, confirm `ACTIVE.md` authorizes it. Stop and say so when it does not.
3. When changing composer controls, menus, selectors, settings or history, read the relevant [component rules](components.md) and follow [visual-reference.md](visual-reference.md): inspect the actual reference image, open the interactive candidate, and use [specimens.json](specimens.json) to identify slots and states. For model menus, use the maintainer-approved refinement linked in visual-reference.md; other library specimens remain candidates. Map reference proportions to the closed tokens; screenshot pixels are not CSS measurements.
4. For icon buttons or icon assets, follow [Icon sourcing](components.md#icon-sourcing): reuse the bundled Lucide SVGs or fetch missing icons from the same official library; do not hand-draw common UI glyphs. Design the trigger and its opened content together. Implement within approved scope; idle layout follows **Empty session** below.
5. For transitions, dragging, replay or loading animation, read [motion.md](motion.md). Define trigger, interruption, end state and reduced-motion behavior before implementation; verify the temporal behavior, not only screenshots.
6. Compare rendered components with the reference: silhouette, padding, alignment, icon weight, text hierarchy, density and states. Remove an unnecessary decoration if one exists; preserve useful controls and explanations.
7. Check the widths and themes above with real English/Chinese labels, long content and short viewports. Exercise affected keyboard/focus and overflow behavior. Iterate on observed defects before handoff.

## Product frame

Narrow-first (280–400px). Wider sidebar stays the same layout, only less cramped. Host fonts (`--vscode-font-family`, `--vscode-font-size`). Surfaces from `--vscode-*` via `--ui-*`. Composer stays reachable.

## Empty session (canonical idle)

One continuous work surface, not a stack of cards.

**Session bar (top, compact):** conversation title on the left; thin-line **history** and **new** on the right. Settings may share that icon row. No second brand lockup in the bar — the canvas π carries identity. Optional tiny `pi` wordmark only when there is no title yet.

**Canvas:** generous empty space. Welcome sits at visual center, slightly below. **π** mark (approved central tricolor exception, small, no caret — a caret beside the right leg reads as an extra leg; not a poster) + **one** short, plain greeting. No feature tour, suggested prompts, mascot, pixel animal, glow, or large brand field.

**Composer (pinned to the bottom, modest side inset):** slightly darker than the page, hairline border, **8px** radius. Upper half: multiline input. Lower half: compact toolbar (mode, status, send). On a narrow sidebar, wrap or collapse — never overlap or crush.

Greeting copy stays an invitation to act (current English: “What should we work on?”). Drop the extra subtitle.

## Visual craft

- Dark fallback is neutral charcoal (`--ui-bg`), not blue or purple. Light and high-contrast use the host theme; do not lock the UI to dark.
- Primary text: soft off-white / host foreground. Secondary text and icons: muted. No pure-white display titles.
- Few type roles, stable weight, line-height, and spacing. See [tokens.md](tokens.md).
- Hairline borders and one-step lightness, not gradients, glass, heavy shadows, decorative cards, or motion for its own sake.
- Outside the welcome-mark and effort-control exceptions in tokens.md, pi is monochrome (grey / off-white, maintainer decision 2026-09-28). `--ui-brand` is the host foreground and is used only on the π mark, send / Stop fill, and a few key states. No hue: not coral, not the host's blue primary button, not blue sliders or checkmarks. Buttons use the host's secondary (grey) style.
- Dialogs and settings: retain the approved header and section structure. Start with a setting name and control; add visible explanation only when it changes the choice. Do not stack routine persistence, status or implementation notes around selectors and buttons in the narrow sidebar. A subtle container may group related settings when that layout is in scope; rows do not each need their own card. See [Settings](components.md#settings) for row anatomy. Secondary actions (refresh) are icon buttons in the section heading.

## Guardrails

Use the closed scale in [tokens.md](tokens.md). Prefer VS Code theme colors and thin-line icons.

Do not: copy another assistant’s logo, creature, or welcome line; add a second display font; introduce hue outside the scoped token exceptions or paint large filled surfaces; introduce 3 / 5 / 6 / 7 / 10 / 11px spacing; use 10–11px as the default voice.

## Critique

- [ ] Idle canvas: one surface; composer is the primary sculpted object. Open menus and settings retain their functional boundaries
- [ ] π follows its scoped token rule, small, not a poster; greeting is one line
- [ ] Session bar: title left, thin-line icons right; no extra clusters
- [ ] Spacing / type / radius only from tokens.md
- [ ] Hue limited to approved welcome/effort exceptions and status (warning / danger); `--ui-brand` only on mark, send / Stop, key status
- [ ] 280px: no page-wide horizontal scroll; toolbar wraps instead of colliding
- [ ] Light / dark / high-contrast stay the same layout
- [ ] Focus follows component rules; motion satisfies [motion.md](motion.md), including interruption and reduced-motion checks
- [ ] Relevant component checks in [components.md](components.md#component-review) pass on rendered output; unavailable evidence is reported
- [ ] Decoration earns its place; useful labels, state indicators and controls remain
