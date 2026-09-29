import assert from "node:assert/strict";
import test from "node:test";
import { finalPiCells, PI_INTRO_FRAMES, piIntroCells } from "../chat/pi-welcome-mark.js";
import { candidateHarness } from "./candidate-harness.js";

test("welcome falls base, blue, coral and gold, then clears the base and settles", () => {
  assert.deepEqual(piIntroCells(0), []);
  const colors = (frame: number) => [...new Set(piIntroCells(frame).map(cell => cell.color))];
  assert.deepEqual(colors(8), ["#83CCD2"]);
  assert.deepEqual(colors(16), ["#83CCD2", "#4D9ABF"]);
  assert.deepEqual(colors(24), ["#83CCD2", "#4D9ABF", "#F09082"]);
  assert.equal(piIntroCells(32).length, 16);
  assert.deepEqual(colors(32), ["#83CCD2", "#4D9ABF", "#F09082", "#F1BE58"]);
  assert.equal(piIntroCells(38).length, 10);
  assert.deepEqual(piIntroCells(PI_INTRO_FRAMES), finalPiCells);
  assert.equal(new Set(finalPiCells.map(cell => `${cell.x}:${cell.y}`)).size, 10);
  assert.deepEqual(finalPiCells.filter(cell => cell.color === "#F1BE58").map(({ x, y }) => [x, y]), [[5, 5], [5, 6]]);
  assert.ok(finalPiCells.every(cell => cell.x >= 2 && cell.x <= 5 && cell.y >= 3 && cell.y <= 6));
});

test("click replays the settled logo once; active playback ignores repeated clicks", async t => {
  const h = await candidateHarness(t);
  let reduced = false;
  Object.defineProperty(h.dom.window.document, "hidden", { configurable: true, value: false });
  Object.defineProperty(h.dom.window, "matchMedia", { configurable: true, value: () => ({
    get matches() { return reduced; }, addEventListener() {}, removeEventListener() {},
  }) });
  await h.reset();
  for (let i = 0; i < PI_INTRO_FRAMES; i++) await h.advance(56);
  const cells = () => h.get(".candidate__mark").querySelectorAll("rect");
  assert.equal(cells().length, 10);
  await h.click(".candidate__mark");
  assert.equal(cells().length, 0);
  await h.advance(56);
  assert.equal(cells().length, 4);
  await h.click(".candidate__mark");
  assert.equal(cells().length, 4, "click during playback must not restart");
  for (let i = 0; i < PI_INTRO_FRAMES; i++) await h.advance(56);
  assert.equal(cells().length, 10);
  reduced = true;
  await h.click(".candidate__mark");
  assert.equal(cells().length, 10, "reduced motion keeps the final mark");
  reduced = false;
  await h.click(".candidate__mark");
  await h.dispose();
  await h.advance(3000);
  assert.equal(h.root.querySelector(".candidate__mark") === null, true);
});
