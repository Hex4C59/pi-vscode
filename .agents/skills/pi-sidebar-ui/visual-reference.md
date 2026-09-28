# Visual reference workflow

Use this branch when implementing or reviewing the components covered by [components.md](components.md). The library has three different evidence roles:

| Material | What it establishes |
|---|---|
| [Official images, local UI crops and annotations](sources.md) | Visible competitor composition, with separate provenance, redaction and coverage limits |
| [Interactive specimens](assets/component-lab.html) | Candidate pi interpretations to inspect and discuss; not approved production components |
| [Machine-readable component contracts](specimens.json) | Named slots, selectors, spatial relations and states to inspect; not an aesthetic score |

## Open the library

From the repository root:

```bash
python3 -m http.server 8768 --bind 127.0.0.1 --directory .agents/skills/pi-sidebar-ui
```

Open `http://127.0.0.1:8768/assets/component-lab.html`. Stop the server with Ctrl+C when finished. It serves only the skill directory on loopback. No build, npm installation, pi process, credentials or extension host is required. The lab uses local assets; the attribution links open official sites only when clicked.

Choose composer, settings or history; switch width, height, theme, language and long copy. Toggle alignment markers to alternate between annotated and clean views. The composer opens Add, permissions, effort/model and settings menus. History filters mock titles. Settings and all other controls affect memory only. Refresh or Reset discards changes. Sample control semantics are illustrative, not product requirements.

Reproducible initial views accept URL parameters: `specimen=composer|settings|history`, `width=280|320|400`, `height=480|640`, `theme=dark|light|contrast`, `language=zh|en`, `long=true`, `guides=false`, and composer `popup=add|permission|effort|models|settings-menu`. Controls change memory rather than rewriting the URL; reloading restores the specified initial view.

## Approved model-picker visual baseline

Open [the before/after model-picker study](assets/model-picker-study.html) for the first focused refinement. The left side illustrates the previous specimen structure; the right side supports selection, keyboard navigation, long names, widths 280/320/400 and three themes. The maintainer approved the refined right-hand component on 2026-09-29: “可以，非常不错，精修稿我很满意”. Use it as the visual baseline for model menus: bounded width, alignment with the trigger, clear space above the composer, stable label/check slots, and distinct selected/hover/keyboard-focus states. This acceptance covers the refinement’s visual design; other specimens and production integration retain their own acceptance requirements.

## Agent procedure

1. Choose the corresponding entry in `specimens.json`. Read its `basis` and `references`; use catalog `sourceKind` to distinguish local observations from official downloads.
2. Open the referenced source image and annotated crop using image viewing, not just filenames or alt text. Read [sources.md](sources.md) for version limits. The text column and numbered rectangles are study annotations; the original file is preserved.
3. Inspect the live candidate in its closed and opened states. Relate named slots to the rendered shape; treat the HTML/CSS as layout examples, not code to copy wholesale into the React product.
4. Preserve [tokens.md](tokens.md), approved behavior and the existing UI architecture. Use the approved model-menu baseline where applicable; other specimens remain pending. Visual acceptance does not establish shipped behavior or authorize additional product scope.
5. Compare the changed product's actual screenshot at the same viewport against the relevant reference. Check contours, internal gaps, alignment, text hierarchy and states. Record concrete differences and revise; token compliance alone is insufficient.

When no image viewer/browser is available, say which visual checks remain unverified. A source retrieval timeout does not imply that no official image exists. Do not generate a fictional competitor screenshot to fill a gap.

## Maintaining references

Keep indexed source images unchanged. Local captures are component crops; history redaction is recorded in the catalog. Preserve full-window captures outside this library. `assets/references/catalog.json` stores original URLs/dimensions, crop coordinates, numbered annotation boxes and generated image names. Source-image coordinates are not CSS measurements. Local entries also record full-capture crop coordinates and redacted regions. These assets are third-party study references, not relicensed as pi assets or shipped extension content.

The existing annotations can be regenerated with Python and Pillow:

```bash
python3 .agents/skills/pi-sidebar-ui/scripts/annotate-references.py
```

Use an interpreter with Pillow installed; the running lab itself has no Python package dependency. When replacing originals, update the source index and annotation coordinates, regenerate, then visually inspect all new crops. Do not silently reuse coordinates from an older image.

The reusable library is intentionally kept with this skill at the maintainer's request; the prototype skill's default throwaway-branch workflow does not apply. It stays outside `src` and extension packaging. No commit or application promotion follows from creating it.

## Motion inspection

Still images establish shape, not easing, continuity or replay behavior. For animation work, follow [motion.md](motion.md#verification): inspect a live interaction or a short recording containing the trigger, intermediate frames, interruption and settled state. Record the viewport, theme, motion preference and tested action; distinguish a lab recording from production and real-host evidence. A slowed recording helps inspect sequencing but does not prove normal-speed smoothness or frame performance.
