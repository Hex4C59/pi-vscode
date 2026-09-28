# Pi sidebar tokens

Closed scale for [pi-sidebar-ui](SKILL.md). New CSS uses these values, not one-off pixels.

## Spacing

Layout and gaps: **8, 12, 16, 24**. **4** only inside chips, icons, and compact controls. Composer side inset 8 or 12. Canvas empty padding 16 / 24, not 12+38 ad hoc.

## Type

Host family. Roles:

| Role | Size | Weight | Line-height | Use |
|------|------|--------|-------------|-----|
| chrome | 12px | 400 | 1.4 | session bar, toolbar, captions |
| body | 13px (`--vscode-font-size`) | 400 | 1.5 | messages, input |
| title | 15px | 600 | 1.35 | reply headings h1–h2 (h3+ stay body-size bold) |
| empty | 16–18px | 550 | 1.35 | the one idle greeting |

No 10–11px as default voice. No pure-white display title.

## Radius

| Use | Value |
|-----|--------|
| chrome / menus | 6px |
| composer (the sculpted object) | **8px** |
| send / icon hit | 8px |

Do not add a fourth radius.

## Color

Surfaces alias VS Code (`src/webview/styles/theme.css`):

| Token | Host |
|-------|------|
| `--ui-bg` | `--vscode-sideBar-background` |
| `--ui-input` | `--vscode-input-background` (composer: one step darker than page) |
| `--ui-fg` | `--vscode-foreground` |
| `--ui-muted` | `--vscode-descriptionForeground` |
| `--ui-border` | `--vscode-panel-border` (hairline) |

**Monochrome emphasis (maintainer decision 2026-09-28):** pi is grey / off-white. There is no hue accent.

| Token | Value | Where |
|-------|--------|--------|
| `--ui-brand` | `var(--ui-fg)` (off-white on dark, near-black on light) | π, send / Stop fill, active progress dot, slider fill |
| `--ui-brand-fg` | `var(--ui-bg)` | icon on the send / Stop fill |
| `--ui-brand-focus` | `var(--ui-muted)`; high contrast `var(--ui-focus)` | composer `:focus-within` border |
| `--ui-accent*` | `--vscode-button-secondary*` | every button; never the host's blue primary |

**Effort study exception (2026-09-29):** the maintainer requested a thick gradient with every effort level visible, then chose the official pi coral/blue/gold palette over the earlier blue/purple and silver/champagne proposals. The isolated study uses a 24px capsule track, 28px porcelain-white thumb and five visible stop markers. Use coral #F09082 at the left, blue #4D9ABF at the midpoint and gold #F1BE58 at the right. Reveal this fixed gradient only up to the thumb; the unfilled track stays neutral. Decorative curves remain removed. The maintainer subsequently requested a maximum-only left-to-right flowing gradient; its behavior is defined in [motion.md](motion.md). The maintainer accepted the enhanced 1.8s flow and authorized production integration on 2026-09-29. The palette is scoped to this reasoning control, not global tokens or unrelated components; installed-host verification remains separate. High-contrast/forced-color presentation keeps explicit markers and current-value text.

Outside the effort and central welcome exceptions, only status keeps hue: `--ui-warning` and `--ui-danger`. Keyboard `:focus-visible` rings keep the host `--ui-focus` for accessibility. Outside those scoped brand palettes, do not write a literal hex outside `var(--vscode-…, fallback)`.

## Mark

**2026-09-29 override:** the central welcome mark uses the official coral `#F09082`, blue `#4D9ABF` and gold `#F1BE58`, with the pi.dev block-drop/row-clear entrance. The temporary base is turquoise `#83CCD2`. It settles once and can be replayed by clicking or keyboard activation (without overlapping playback), keeps its 36px layout footprint, respects reduced motion and cancels on unmount. This supersedes the monochrome central mark instruction below; other brand uses and host-owned icons retain their rules.

Existing `assets/pi.svg` as a mask, painted with `--ui-brand`, about 32–40px. No caret. Not a 64px poster.

## Contrast

Text 4.5:1 (WCAG 1.4.3). Controls, focus, and the π mark 3:1 against adjacent color (1.4.11).

## Motion

Timing, state transitions, interruption and verification have one authority: [motion.md](motion.md). Read it when adding or changing component animation.
