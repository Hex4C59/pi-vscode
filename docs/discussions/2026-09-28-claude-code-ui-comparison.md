# Claude Code vs Pi sidebar: why the other UI feels more premium

English | [中文](2026-09-28-claude-code-ui-comparison.zh.md)

- Type: Discussion
- Status: Open
- Created: 2026-09-28
- Authority: **context only** — does not override [`ACTIVE.md`](../../ACTIVE.md), the Draft PRD visual direction, or architecture
- Related: [encoding UI as agent rules](2026-09-28-agent-ui-rules.md)

## Background

The maintainer compared Claude Code’s empty-window UI with this extension’s sidebar and asked why Claude Code feels more tactile / better looking, and how Pi should be designed.

This is not a defect report against current CSS. The current look follows an already confirmed product brief.

## Evidence

**Claude Code (screenshot, 2026-09-28):** full-window product, large empty canvas, branded coral mark, editorial empty copy, announcement card with generous padding, composer as a sculpted object with a warm focus ring and a filled brand send control.

**Pi current implementation:**

- Product brief ([PRD WI-015 / visual redesign](../product-requirements.md)): compact, **IDE-native**, VS Code theme colors/fonts, **320–400px** sidebar (down to 280px), Codex as the simplicity reference. Not pixel parity with a standalone chat app.
- Tokens in `src/webview/styles/theme.css`: `--ui-bg` / `--ui-fg` / `--ui-focus` / `--ui-accent` all alias VS Code. `--ui-radius: 6px`. No product accent independent of the host theme.
- Empty state in `src/webview/chat/candidate.tsx`: 38px mask of `assets/pi.svg` in `--ui-fg`, heading “What should we work on?” at 19px, muted 12px subtitle. No card, no brand color.
- Composer in `candidate.css`: 13px radius, 1px `--ui-border-strong`, focus = `--ui-focus` (VS Code blue). Send is 30×30 `--ui-fg` on `--ui-bg`. Body type is 13px / 11px chrome.

WI-024 remains F5 acceptance for provider settings. This comparison does not authorize a visual rewrite or a new WI.

## Why it feels different

The gap is mostly **frame**, then **craft**.

| Lever | Claude Code | Pi sidebar |
|-------|-------------|------------|
| Stage | Full window; empty space is the product | 280–400px secondary sidebar beside Explorer |
| Color | One coral accent on a designed dark | Host theme tokens; no Pi accent |
| Empty state | Brand moment (logo, greeting, card) | Small grey mark + two lines of utility copy |
| Composer | Large object: thick radius, warm ring, filled send | Thin 1px box; focus is IDE blue |
| Density | Few chrome items, large hit targets | History/New/gear, model chip, thinking, +/approvals/review in the same strip |
| Type | Editorial greeting vs quiet body | 11–13px throughout; headings barely larger |

Copying Claude Code’s canvas into this sidebar would fight the accepted IDE-native brief and overflow the width budget. The transferable part is craft, not layout.

## Current leaning (agent; not a decision)

Keep the **sidebar / VS Code-token** product. If a visual slice is later approved, raise craft without becoming a standalone chat app:

1. **One quiet Pi accent** for empty-state mark, composer focus, and send — still readable on light/dark/high-contrast; do not replace theme surfaces.
2. **Empty state as a moment:** larger mark, more vertical air, one greeting + one muted line. No announcement-card product surface unless there is a real message.
3. **Composer as the only sculpted object:** slightly larger radius, softer border, focus ring in the Pi accent, send as a filled accent control rather than inverted foreground.
4. **Fewer simultaneous chrome rows** in the idle empty state; keep approval/error/Stop conspicuous when they exist.
5. **Type scale:** idle chrome 12px, body 13px, empty heading clearly larger; avoid 10–11px as the default voice.

Out of scope unless the PRD brief is explicitly revised: full-window chat, custom dark independent of VS Code, Plan mode, decorative illustration, or treating F5 visual taste as WI-024 acceptance.

## Open questions for the maintainer

1. Stay with the Codex / IDE-native brief, or allow a **bounded brand overlay** (accent + empty state + composer) on top of VS Code tokens?
2. If yes, should that wait until after WI-024 F5, as a separate Prepare visual-craft WI?
3. Light/high-contrast: accent must remain a token with fallbacks, not a hardcoded coral.
