import { useEffect, useRef, useState } from "react";

// Geometry, palette and sequence observed at pi.dev/assets/home-inline.js (2026-09-29).
// Render locally as SVG cells: no remote scripts, canvas scaling or host capabilities.
const coral = "#F09082", blue = "#4D9ABF", gold = "#F1BE58";
type Cell = { x: number; y: number; color: string };
const pieces = [
  { color: "#83CCD2", cells: [[0, 0], [0, 1], [0, 2], [0, 3]], fromX: 1, x: 1, y: 6 },
  { color: blue, cells: [[0, 0], [1, 0], [1, 1], [2, 0]], fromX: 0, x: 2, y: 3 },
  { color: coral, cells: [[0, 0], [0, 1], [0, 2], [1, 2]], fromX: 2, x: 2, y: 2 },
  { color: gold, cells: [[0, 0], [1, 0], [2, 0], [2, 1]], fromX: 5, x: 5, y: 4 },
] as const;
const place = (piece: typeof pieces[number], x: number, y: number): Cell[] =>
  piece.cells.map(([row, column]) => ({ x: x + column, y: y + row, color: piece.color }));
const settled = pieces.flatMap(piece => place(piece, piece.x, piece.y));
export const finalPiCells: readonly Cell[] = settled.filter(cell => cell.y !== 6).map(cell => ({ ...cell, y: cell.y + 1 }));
export const PI_INTRO_FRAMES = 44;

/** Discrete 18fps fall, row clear, then a one-cell settle, as on the website. */
export function piIntroCells(frame: number): readonly Cell[] {
  if (frame >= PI_INTRO_FRAMES) return finalPiCells;
  if (frame < 1) return [];
  if (frame < 33) {
    const index = Math.min(3, Math.floor((frame - 1) / 8));
    const piece = pieces[index];
    const progress = Math.min(1, ((frame - 1) % 8 + 1) / 7);
    const eased = 1 - (1 - progress) ** 3;
    return [...pieces.slice(0, index).flatMap(p => place(p, p.x, p.y)),
      ...place(piece, Math.round(piece.fromX + (piece.x - piece.fromX) * eased), Math.round(-3 + (piece.y + 3) * eased))];
  }
  if (frame < 38) return settled.map(cell => ({ ...cell, color: cell.y === 6 && frame % 2 === 1 ? "#ffffff" : cell.color }));
  if (frame < 40) return settled.filter(cell => cell.y !== 6);
  return finalPiCells;
}

export function PiWelcomeMark({ label }: { label: string }) {
  const [frame, setFrame] = useState(PI_INTRO_FRAMES);
  const [replay, setReplay] = useState(0);
  const busy = useRef(false);
  useEffect(() => {
    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    // A missing media-query API (e.g. a nonvisual renderer) uses the static fallback.
    if (!motion || motion.matches || document.hidden) { busy.current = false; return; }
    busy.current = true;
    let current = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const finish = () => {
      stopped = true;
      busy.current = false;
      clearTimeout(timer);
      setFrame(PI_INTRO_FRAMES);
    };
    const tick = () => {
      if (stopped) return;
      setFrame(current);
      if (current++ < PI_INTRO_FRAMES) timer = setTimeout(tick, 1000 / 18);
      else busy.current = false;
    };
    const onMotion = () => { if (motion.matches) finish(); };
    const onVisibility = () => { if (document.hidden) finish(); };
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    tick();
    return () => {
      stopped = true;
      busy.current = false;
      clearTimeout(timer);
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [replay]);
  return <button type="button" className="candidate__mark" aria-label={label} title={label} onClick={() => {
    if (busy.current) return;
    busy.current = true;
    setReplay(value => value + 1);
  }}>
    <svg viewBox="2 3 4 4" focusable="false" aria-hidden="true">
      {piIntroCells(frame).map((cell, index) => <rect key={index} x={cell.x} y={cell.y} width="1" height="1" fill={cell.color} />)}
    </svg>
  </button>;
}
