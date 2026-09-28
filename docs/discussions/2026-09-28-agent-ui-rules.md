# Encoding UI craft as rules a code agent can follow

English | [中文](2026-09-28-agent-ui-rules.zh.md)

- Type: Discussion
- Status: Adopted into skill; implementation in WI-025
- Created: 2026-09-28
- Authority: **context only** — does not override the Draft PRD visual brief, [`ACTIVE.md`](../../ACTIVE.md), or architecture
- Related: [Claude Code comparison](2026-09-28-claude-code-ui-comparison.md)

## Question

Can UI design be described as **checkable rules** for a code agent, instead of “make it feel more premium”?

Yes. The useful form is a **token system + forbidden list + self-critique checklist**, not a mood board. Taste that cannot be numbered or named will drift every session.

## Sources (primary)

- Anthropic Claude Code **frontend-design** skill: [raw SKILL.md](https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md). Process: brief → compact token plan (color/type/layout/principles) → uniqueness review → then code. Also: one signature element; match complexity to vision; take one accessory off. Calibration: cream+terracotta, acid-on-black, broadsheet, identical SaaS cards are *defaults*, not choices.
- VS Code Webview theming: [extension-guides/webview](https://code.visualstudio.com/api/extension-guides/webview). Body classes `vscode-light` / `vscode-dark` / `vscode-high-contrast`; colors as `--vscode-*`; UI font `--vscode-font-family/size/weight` (host default size **13px**); editor font separate.
- WCAG 2.2: [1.4.3](https://www.w3.org/TR/2023/REC-WCAG22-20231005/) text contrast **4.5:1** (large text 3:1); [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) controls/focus/icons **3:1** against adjacent colors.
- Material Design 3 spacing: [styles/spacing](https://m3.material.io/styles/spacing). Base unit `space100` = **8dp**; layout on 8; nested 4 (and 2/6/10) only inside small components. Padding / gap / margin named separately.
- Material 2 spacing methods: [8dp grid / 4dp type](https://m2.material.io/design/layout/spacing-methods.html). Touch targets 48dp is a **mobile** floor; a 280–400px IDE sidebar is compact density, not a phone.

## Two rule families (do not mix)

| Family | What it encodes | Fits Pi? |
|--------|-----------------|----------|
| **Aesthetic direction** (Anthropic skill) | Distinct identity, custom typefaces, asymmetry, “not Inter/system-ui” | **No as a default.** This product’s brief is IDE-native and must use VS Code fonts/colors. That skill would fight the PRD and look like a foreign app inside the sidebar. |
| **Constraint / token / checklist** | Named roles, numeric scale, contrast floors, density, one accent, “don’t invent a 7th gray” | **Yes.** This is how agents stop producing 11px chrome, 10px gaps, and a new radius per control. |

Claude Code’s own UI is closer to family 1 (branded full window). Pi’s accepted brief is family 2 plus a *bounded* brand overlay, if the maintainer later allows one accent.

## What an agent can actually follow

Agents follow rules that are **named, numeric, or binary**. They fail on “more tactile” and “like Claude Code.”

A Pi-shaped pack would be four layers:

1. **Product frame (already in the PRD):** secondary sidebar 280–400px; VS Code theme surfaces and fonts; light/dark/high-contrast; composer stays reachable; Codex-style simplicity, not a standalone chat canvas.
2. **Token table (missing today as *roles*):** `theme.css` already aliases VS Code, but `--ui-radius: 6px` and `--ui-gap: 10px` are unused as a closed scale. Spacing should be a list (4 / 8 / 12 / 16 / 24), not arbitrary 3/5/7/10. Type should be roles (chrome / body / empty-title), not per-selector 10/11/12/13/19.
3. **Hard constraints:** no new hex except the optional Pi accent token; no new font-family; no page-wide horizontal scroll at 280px; `prefers-reduced-motion`; focus visible; text 4.5:1, controls 3:1.
4. **Critique loop (from the Anthropic skill, usable here):** plan tokens first; screenshot; “remove one accessory”; one signature object (for Pi: the composer), everything else quiet.

## Draft rule set (proposal, not approved)

Not implementation authorization. Numbers are starting points for a later visual-craft WI.

| Rule | Checkable form |
|------|----------------|
| Spacing | Only 4, 8, 12, 16, 24px. 4 only *inside* chips/icons. New CSS must not introduce 3, 5, 6, 7, 10, 11. |
| Type roles | `chrome` 12/400, `body` 13/400 lh 1.5, `title` 16–20/550. No 10–11px as default voice. |
| Radius | 6 chrome, 8 controls, 12 composer/empty card. Not a new radius per widget. |
| Color | Surfaces from `--vscode-*`. At most **one** product accent, used on empty mark + composer focus + send. |
| Density | Idle empty state: nav icons + composer. Approval/error/Stop remain conspicuous when present. |
| Motion | Action-triggered only (open/close popover). Respect `prefers-reduced-motion`. |
| Copy | Empty state is an invitation to act; errors name the fix. Sentence case. |
| Themes | Same layout on light/dark/high-contrast; accent is a token with fallback, never hardcoded coral. |

Current `candidate.css` violates the spacing rule in many places (3, 5, 7, 10, 11px). That is why a full-window brand app feels “designed” and this sidebar feels assembled: the agent (and humans) had no closed scale.

## What not to copy from the Anthropic skill

- Ban on system fonts / Inter — here the host font **is** the product.
- “Every page a unique identity” — a VS Code extension should look like VS Code, with at most one signature.
- Cream/terracotta or acid-green defaults — the skill itself flags terracotta (~#D97757) as a Claude-interaction tell.
- Maximal motion and custom display faces.

Take only: **plan tokens before CSS**, **one signature**, **self-critique**, **copy is design**.

## Skill (2026-09-28)

Maintainer chose an independent skill. Codex idle-session brief adopted into [pi-sidebar-ui](../../.agents/skills/pi-sidebar-ui/SKILL.md) with [tokens.md](../../.agents/skills/pi-sidebar-ui/tokens.md).

| Codex line | Disposition |
|------------|-------------|
| Quiet, tool-like, narrow-first, not another product’s mark/mascot/copy | Adopt |
| π mark, optional caret, warm coral as only accent, small not poster | Adopt (`--ui-brand`) |
| One work surface; title left; history+new thin-line icons; welcome slightly below center; one greeting | Adopt |
| Composer slightly darker, hairline, ~8px radius; input above, toolbar below; wrap don’t crush | Adopt (8px overrides the earlier 12px composer proposal) |
| Neutral charcoal, soft type, no gradients/glass/heavy shadow | Adopt as **dark fallback**; light/high-contrast still follow `--vscode-*` |
| Prefer VS Code colors/icons; coral only for brand and key states | Adopt |

Not adopted as-is: locking the UI to a designed dark canvas (conflicts with the IDE-native theme brief). Session-bar settings gear stays allowed (product needs it). Empty-state implementation is **not** authorized by writing the skill; WI-024 F5 remains current.

## Screenshot component reference (2026-09-29)

The maintainer supplied Codex/Claude Code screenshots and explicitly requested integrating the discussion into the existing skill. The preference is component proportions and finish, with color set aside for this comparison. The adopted instructions live in [component craft](../../.agents/skills/pi-sidebar-ui/components.md): composer controls, content-shaped menus/selectors, grouped settings rows and compact searchable history where those features are approved.

This supplements numeric tokens with rendered comparison of spacing, alignment, hierarchy and states. The idle-canvas rule about the composer being the only sculpted object does not prohibit functional menu boundaries or approved settings groups. Existing pi tokens and color decisions remain in force. Screenshot pixels and unobserved interaction behavior are not implementation evidence. This is a skill/documentation update only; editor-tab settings, search, new approval modes and history navigation changes are not authorized by the references. Application UI acceptance remains pending in ACTIVE.

## Visual library follow-up (2026-09-29)

The maintainer then authorized a visual component library and requested better online references. Two official Claude Code documentation images were downloaded, cropped and annotated with provenance in [sources](../../.agents/skills/pi-sidebar-ui/sources.md). Codex documentation requests timed out and its official Marketplace listing yielded no usable screenshots; no online replacement was established for the user's Codex popovers/settings/history. This does not invalidate the user's references or establish that official images do not exist.

The skill now routes agents through actual image inspection, a local interactive [component lab](../../.agents/skills/pi-sidebar-ui/assets/component-lab.html), and [structured component contracts](../../.agents/skills/pi-sidebar-ui/specimens.json). The lab contains original pi candidates with width/height/theme/language controls, opened menus, settings rows and mock searchable history. These are isolated, in-memory studies, not shipped UI, real permissions or session operations. Their visual acceptance remains pending. [Run and inspection instructions](../../.agents/skills/pi-sidebar-ui/visual-reference.md) distinguish official evidence, candidate interpretation and product approval.

Follow-up: after the maintainer enabled TUN, both Codex IDE requests succeeded and yielded a 1600 × 900 official IDE screenshot. The original, annotated sidebar crop and provenance now appear in the same library. It covers the header, grouped file rows and closed composer controls; opened menus, full settings and history still lack online originals. See the updated source record for redirects and remaining limits.

## Open questions

1. ~~Skill vs AGENTS.md dump~~ → skill, with one load-map row.
2. ~~Host-only color vs one accent~~ → one `--ui-brand` overlay. **Superseded 2026-09-28:** after seeing coral in F5, the maintainer ruled the whole UI must be grey / off-white, pi's own color. `--ui-brand` is now the host foreground, buttons use the host secondary style, and no hue remains except warning and error. The coral rows in the table above are history; the skill and PRD carry the current rule.
3. ~~Wait until WI-024 F5 before visual-craft Prepare / empty-session Build?~~ → No. On 2026-09-28 the maintainer authorized WI-025 Build directly and parked WI-024 F5 separately; scope lives in [`ACTIVE.md`](../../ACTIVE.md) and the PRD “Sidebar visual craft slice” section.

2026-09-29: The maintainer explicitly approved the refined model-picker study. Its right-hand component is now the [approved visual baseline](../../.agents/skills/pi-sidebar-ui/visual-reference.md#approved-model-picker-visual-baseline); other specimens and production integration retain separate acceptance.

2026-09-29: Local Computer Use captures now fill the visible Codex popup, settings and history gaps: nine component crops with numbered annotations and provenance, linked from the component contracts. History titles are redacted and full windows remain local. Component rules now distinguish density by information load, width by content, independent selection/hover, and boundary hierarchy. This does not establish untested responsive/keyboard behavior or accept other pi specimens.

2026-09-29: The maintainer rejected the thin white effort slider and requested a thick light-to-dark gradient with all levels visible. The isolated specimen now proposes a 24px blue gradient capsule, 28px thumb and five clickable labeled stops; the exact blue treatment awaits visual acceptance. This scoped study exception does not recolor production UI or change the accepted model-menu baseline.

2026-09-29 follow-up: The maintainer rejected the blue-only palette and pointed to Codex Ultra. The new candidate uses indigo/lavender/purple, central soft light, sparse static stars and a white thumb. Decoration increases above medium and remains clipped to the filled portion; continuous dragging and eased snapping remain. This reference comes from the conversation, not a newly downloaded or independently captured Ultra asset. The previous blue proposal is superseded; the new isolated study still awaits visual acceptance.

2026-09-29: The maintainer subsequently rejected the Codex-like blue/purple direction and authorized a pi-specific graphite/silver/champagne motion study. The candidate adds thumb hover/press feedback, value-text transitions and a single maximum-level metallic sweep. It preserves continuous fill, discrete labels and eased snapping, with interrupted animations cancelled and reduced motion respected. This supersedes the cosmic candidate; visual acceptance and production integration remain pending.

## Motion guidance update (2026-09-29)

At the maintainer’s request, [primary-source research](2026-09-29-component-motion-research.md) informed the new [motion authority](../../.agents/skills/pi-sidebar-ui/motion.md). It defines local timing defaults, transition contracts, interruption, reduced-motion and lifecycle checks. Screenshot-only evidence is insufficient. Existing welcome/effort exceptions remain; lab-only text motion is distinguished from production. This update changes skill guidance only, not application code or acceptance.
