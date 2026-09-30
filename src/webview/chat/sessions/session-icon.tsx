import type { ReactElement } from "react";

// Official Lucide geometry; pinned originals and ISC license: assets/icons/lucide.
const glyphs = {
  "clock": <><circle cx="12" cy="12" r="10" />
  <path d="M12 6v6l4 2" /></>,
  "settings": <><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
  <circle cx="12" cy="12" r="3" /></>,
  "plus": <><path d="M5 12h14" />
  <path d="M12 5v14" /></>,
  "arrow-left": <><path d="m12 19-7-7 7-7" />
  <path d="M19 12H5" /></>,
  "check": <><path d="M20 6 9 17l-5-5" /></>,
  "chevron-right": <><path d="m9 18 6-6-6-6" /></>,
  "chevron-left": <><path d="m15 18-6-6 6-6" /></>,
  "refresh-cw": <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
  <path d="M21 3v5h-5" />
  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
  <path d="M8 16H3v5" /></>,
  "x": <><path d="M18 6 6 18" />
  <path d="m6 6 12 12" /></>,
} satisfies Record<string, ReactElement>;

export function SessionIcon({ name }: { name: keyof typeof glyphs }): ReactElement {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{glyphs[name]}</svg>;
}
