# Component motion

Read when changing transitions, dragging, replay or animated status. This is design guidance, not authorization to change shipped UI. Primary-source evidence and its limits live in [the research note](../../../docs/discussions/2026-09-29-component-motion-research.md).

## Choose the purpose

Use functional motion to explain a state change, preserve spatial continuity or acknowledge input. Keep brand expression scoped to the approved welcome mark and effort control. Ordinary settings rows and history results should remain stable while the user reads; streaming text does not animate each token. Motion must not delay sending, stopping, selecting, focus or error feedback.

Before implementing, write a transition contract using these fields:

`trigger → from/to → animated properties → duration/easing → interruption → reduced motion → cleanup → verification`

Include failure/disabled states where relevant. Select CSS transitions for simple reversible changes; use an owned timeline only when sequencing or replay requires it. A motion library is not required merely to add animation.

## Local defaults

These are proposed Pi starting values, not numbers mandated by Fluent, Carbon or WCAG, and not a claim that existing components implement them. Tune from rendered evidence within the approved task.

| Use | Duration | Easing | Property / extent |
| --- | --- | --- | --- |
| Hover / press feedback | 100ms | ease-out | color or opacity; preserve hit target |
| Popup entrance | 160ms | cubic-bezier(.16, 1, .3, 1) | opacity 0→1, translateY 4px→0; origin follows trigger |
| Popup exit | 100ms | ease-in | opacity 1→0; keep exit short |
| Discrete selection settling | 180ms | ease-out | selected indicator / effort thumb and fill |
| Pointer dragging | 0ms | direct mapping | pointer and visual position agree every update |
| Reduced motion | 0ms | none | final state immediately; decorative loops off |

Keep easing and duration coherent within one component. Avoid `transition: all`: name only the intended properties. Normal menus need neither springs nor staggered rows. Text does not need to slide to prove selection changed.

## Transition contracts

| Component | Trigger and transition | Interruption / semantics | Reduced motion / cleanup |
| --- | --- | --- | --- |
| Menu / popover | Trigger opens; Escape or dismissal closes; use entrance/exit defaults | Reverse from current visual position when reopened mid-exit. Apply expanded state and appropriate focus behavior immediately. An exiting retained visual must no longer be focusable or interactive | Show/hide immediately; cancel obsolete completion handlers; unmount safely |
| Buttons / selection rows | Hover, press, selected changes | Selection, hover and keyboard focus stay independent; repeated actions never queue animation | Static state feedback; preserve focus according to the component contract |
| Settings disclosure | Expand/collapse an approved section | Content and focus follow logical state. Move focus safely if collapsing its container; preserve scroll position | Immediate layout change; no delayed actionable content |
| Loading / task status | Actual pending state begins/ends | Animation reflects real work, never fakes progress or delays completion; provide readable status independently | Static pending indicator and text; stop timers on completion/error/unmount |
| Welcome Pi | Mount or explicit replay → block sequence → settled logo | One playback owner; ignore replay during playback. Retain button keyboard semantics; follow tokens.md for geometry/palette | Static final logo; respond to preference changes, visibility and unmount |

An exit animation must never own business state. If a promise or `animationend` is cancelled, the component must still reach the requested logical state. Clean up timers, animation frames and listeners. For JS animation, subscribe to `matchMedia` changes instead of reading reduced motion only on mount.

## Approved effort control

The accepted signature is coral → blue → gold, progressively revealed along the full track. Geometry and palette live in [tokens.md](tokens.md); supported levels come from capabilities, not sample data.

- Drag: map pointer to continuous position without easing behind the pointer. Release settles to the nearest supported stop using the settling default; keyboard input chooses discrete stops. New input supersedes unfinished settling. Preserve existing host commit semantics.
- Below maximum: static clipped gradient and stop markers. At maximum: left-to-right repeating color flow, 1.8s linear cycle, 65% track-width repeat and a soft moving highlight. Leaving maximum removes the flow. Keep the approved treatment free of decorative curves.
- Reduced motion / forced colors: static fill, readable current value and markers. Reduced motion removes animated settling and scale transitions too.
- Lifecycle target: stop decorative animation when the popover closes, the control becomes disabled, the document is hidden or the component unmounts. Returning should resume from a coherent state without queued catch-up.

**Evidence boundary (2026-09-29):** the tricolor flow is integrated into production. CSS handles popover closure, disabled state, reduced motion and forced colors. Document-visibility pausing and rapid-interruption smoothness still need verification/improvement; do not report them as passed. The lab's 160ms moving value label is not implemented in production and is not required. Browser preview evidence does not establish installed-VSIX acceptance.

The maximum effect means an intensity setting, not ongoing model computation. Consider automatic replay of a saved maximum separately from a deliberate user selection. WCAG 2.2.2 depends on automatic start, duration and parallel content; reduced motion alone is not proof that pause/stop/hide requirements are met. Preserve the accepted design while flagging any needed pause or bounded-playback decision for the relevant product task.

## Performance

Prefer transform and opacity for movable overlays when practical. They are good candidates for compositing, not a guarantee of GPU acceleration or smoothness. Gradient/background-position and clipping may repaint; profile the accepted maximum flow in the actual webview before changing its implementation. Keep animation local to the small visible control. Use `will-change` only for an observed need, with bounded lifetime.

## Verification

For each changed transition, record pass/fail/unverified for:

1. Normal-speed trigger → intermediate state → settled state; check first and last frames for flashes or jumps.
2. Rapid reversal / repeated click, dragging during settling, leaving maximum mid-cycle; no queued replay or stale state.
3. Keyboard operation and focus return; logical state changes without waiting for animation.
4. Reduced motion enabled before load and switched during playback; correct static state with no decorative loop.
5. Closing, disabling, document hiding and unmounting during playback; no hidden work or stale completion handler.
6. Affected narrow widths and light/dark/forced-color themes; labels and targets remain stable.

Use the live specimen or a recording for temporal inspection, then verify the changed product surface. For performance claims, capture a browser performance trace of the active component, including several flow cycles, and report observed rendering cost/frame behavior with environment details. A screenshot, CSS duration or passing unit test does not establish smoothness. Add behavior tests when lifecycle or semantics change; decorative-only edits need visual evidence rather than tests that mirror CSS declarations.
