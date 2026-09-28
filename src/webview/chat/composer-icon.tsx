import type { ReactElement } from "react";

// Official Lucide geometry; revision and ISC attribution: assets/icons/lucide.
const glyphs = {
  "plus": <><path d="M5 12h14" />
  <path d="M12 5v14" /></>,
  "file": <><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
  <path d="M14 2v5a1 1 0 0 0 1 1h5" /></>,
  "keyboard": <><path d="M10 8h.01" />
  <path d="M12 12h.01" />
  <path d="M14 8h.01" />
  <path d="M16 12h.01" />
  <path d="M18 8h.01" />
  <path d="M6 8h.01" />
  <path d="M7 16h10" />
  <path d="M8 12h.01" />
  <rect width="20" height="16" x="2" y="4" rx="2" /></>,
  "shield-check": <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  <path d="m9 12 2 2 4-4" /></>,
  "arrow-up": <><path d="m5 12 7-7 7 7" />
  <path d="M12 19V5" /></>,
} satisfies Record<string, ReactElement>;

export function ComposerIcon({ name }: { name: keyof typeof glyphs }): ReactElement {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" strokeLinecap="round" strokeLinejoin="round">{glyphs[name]}</svg>;
}
