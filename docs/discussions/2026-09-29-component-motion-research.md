# Component motion research for the sidebar UI skill

English | [中文](2026-09-29-component-motion-research.zh.md)

- Type: Discussion
- Status: Research complete; skill guidance update, not production acceptance
- Created: 2026-09-29
- Authority: **context only** — external evidence and design recommendations; does not override the PRD, [`ACTIVE.md`](../../ACTIVE.md), or maintainer-approved visual choices
- Related: [UI craft discussion](2026-09-28-agent-ui-rules.md), [pi-sidebar-ui skill](../../.agents/skills/pi-sidebar-ui/SKILL.md)

## Question and scope

The maintainer requested internet research before improving the skill's component-animation guidance. The useful addition is a reusable motion contract: purpose, trigger, duration/easing, interruption, reduced-motion fallback and verification. This research does not audit every production component or authorize replacing the approved Pi logo replay and highest-effort flow effect.

## Primary evidence

All sources below were fetched and read on 2026-09-29. The Carbon website returned HTTP 403; its official repository's page source was read instead. The other linked pages were retrieved successfully. These are source observations, not measured behavior of the extension.

| Source | What it establishes | Implication for Pi |
|---|---|---|
| [Carbon motion overview, official source](https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/elements/motion/overview.mdx) | Separates subtle, responsive **productive** motion from occasional **expressive** moments. Distinguishes standard, entrance and exit easing. Duration depends on distance and size. | Everyday menus/buttons should remain fast and restrained; brand animation is a scoped exception. |
| [Fluent 2 motion](https://fluent2.microsoft.design/motion) | Motion should be functional, natural, consistent and appealing. Larger travel needs more time. Top-level navigation favors a quick fade over large moving surfaces. Keep motion near the element in focus. | A narrow sidebar benefits from small local changes, not long panel sweeps or animating every row independently. |
| [web.dev: high-performance CSS animations](https://web.dev/articles/animations-guide) | Prefer `transform` and `opacity`; investigate properties causing layout or paint. Profile dropped frames and paint regions. Apply `will-change` sparingly and only when justified. | Try a translated, clipped gradient layer for continuous flow before repeatedly repainting a background; verify actual performance, since compositor behavior is not guaranteed by syntax. |
| [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) | The media feature expresses a preference to remove, reduce or replace nonessential motion. Large scaling and panning can cause discomfort. | Provide a real static end state for decorative animation, retaining text, value and operability. |
| [MDN: matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) | `matches` reads the current preference; the returned media query supports a `change` event. | JavaScript/Canvas animation should handle changes while mounted, not just the initial preference. |
| [MDN: Animation.cancel](https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel) | Cancellation aborts playback and clears animation effects. A running animation's `finished` promise rejects with `AbortError`. | Interruptible implementations must preserve the intended underlying state and handle cancellation without stale completion effects or unhandled promises. |
| [WAI-ARIA APG: modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) | Opening moves focus inside; Escape closes; focus ordinarily returns to the invoker. Modal semantics require actual modal behavior. | An animation must not delay or break focus handling. These requirements apply to modal dialogs, not automatically to every popover. |
| [WCAG 2.2 Understanding 2.2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Moving information that starts automatically, lasts more than five seconds and appears alongside other content needs a pause/stop/hide mechanism unless essential. Direct intentional activation differs from automatic or indirect activation. | Assess long-running flow by its actual trigger, including restoring a persisted highest setting. A reduced-motion media query alone is not evidence that all applicable requirements are satisfied. |

Carbon publishes duration tokens **70, 110, 150, 240, 400 and 700 ms**. Its productive curves are standard `cubic-bezier(0.2, 0, 0.38, 0.9)`, entrance `cubic-bezier(0, 0, 0.38, 0.9)` and exit `cubic-bezier(0.2, 0, 1, 0.9)`. These are Carbon's design-system values, not universal accessibility requirements. Fluent's page describes timing principles rather than prescribing the Pi timings below.

## Recommended skill changes

These are **Pi-specific starting proposals**, to be calibrated in the actual sidebar rather than attributed as source requirements:

| Component | Proposed treatment | Completion and interruption |
|---|---|---|
| Icon button / selected row | 100–120 ms color/opacity feedback; keep geometry and hit target stable | A new hover/press state replaces the previous state immediately. |
| Anchored menu / popover | 150–180 ms entrance, 90–120 ms exit; opacity with at most 4 px travel toward its anchor | Escape and outside-click remain responsive; reopening cancels stale exit cleanup. |
| Settings / history surface | 180–220 ms short fade; preserve orientation and scroll position | Search and navigation remain usable immediately; avoid replaying row entrances on each keystroke. |
| Effort slider | Pointer position follows directly; 160–180 ms settling only after release or discrete keyboard change | New input starts from the current visual position; canonical value and submit timing stay under the existing interaction contract. |
| Streaming / status | Stable layout and minimal local state feedback | Do not replay entrances per token or use animation as the only state signal. |

A component recipe should include `trigger → animated properties → end state → cancellation → reduced-motion fallback`. Keep business state independent of animation completion: closing a menu or applying a setting must still work if an animation is skipped or cancelled. For exits that retain a visual element briefly, prevent stale focusable or clickable content and stale cleanup from affecting a reopened component. These lifecycle rules are engineering recommendations informed by the platform APIs and APG, not quotations from either.

The approved Pi logo replay and maximum-effort flow are expressive exceptions. Preserve their current identity and trigger scope while requiring static reduced-motion behavior, cleanup on disposal, and no continuing animation in hidden UI. Assess any continuous animation against its activation context before claiming accessibility compliance. Choosing to bound its duration or add a dedicated pause control would be a separate product change, not an automatic consequence of this research.

## Verification and open questions

A screenshot shows geometry and color but cannot establish motion quality. The skill should require a short interaction check: rapid open/close/reopen, interrupted slider settling, keyboard-only operation, reduced-motion enabled before opening and changed while open, and hidden/unmounted cleanup. Inspect animation performance with a trace or paint/frame diagnostics when introducing continuous or paint-heavy effects; record the actual host and avoid claiming smoothness from a build pass.

The next implementation should use the smallest suitable mechanism: CSS transitions for state feedback, Web Animations API when explicit playback/cancellation is useful, and requestAnimationFrame/Canvas only for interaction or drawing that needs it. A new animation library is not required by these findings. Whether the current flow effect repaints excessively, and whether existing components handle interruption correctly, remain unverified until a targeted implementation review and runtime check.
