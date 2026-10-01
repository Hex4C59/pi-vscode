import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { act } from "react";
import { candidateHarness } from "./candidate-harness.js";
import { readAppStyles } from "./react-harness.js";

async function report(name: string, body: Record<string, unknown>): Promise<void> {
  const output = path.resolve("dist/wi077-queued-ui");
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, `${name}.json`), JSON.stringify({
    schemaVersion: 1, status: "passed", evidence: "preview-bridge-queue",
    limits: ["synthetic preview host", "not real pi, F5 or installed VSIX"], ...body,
  }, null, 2) + "\n");
}

// Failure modes: streaming preview never exposes Steer; queueChat ignored; Stop leaves pending visible.
test("streaming preview admits Steer into pending and Stop recalls into recovery", async t => {
  const h = await candidateHarness(t, "streaming");
  const style = h.dom.window.document.createElement("style");
  style.textContent = readAppStyles();
  h.dom.window.document.head.append(style);

  await h.input("steer from preview");
  const steer = [...h.root.querySelectorAll("button")].find(button => button.textContent === "Steer current task");
  assert.ok(steer, "busy streaming preview must offer Steer");
  assert.equal(steer.disabled, false);
  await act(async () => { steer.click(); });
  assert.match(h.root.textContent ?? "", /steer from preview/);
  assert.match(h.root.textContent ?? "", /Steering/);

  const stop = h.get('button[aria-label="Stop current task"]');
  await act(async () => { stop.click(); });
  await h.advance(500);
  assert.match(h.root.textContent ?? "", /Recalled text|brought back|steer from preview/);
  assert.match(h.root.textContent ?? "", /Use in draft|Discard/);

  const use = [...h.root.querySelectorAll("button")].find(button => button.textContent === "Use in draft");
  assert.ok(use);
  await act(async () => { use.click(); });
  await h.advance(0);
  const composer = h.root.querySelector("textarea");
  assert.ok(composer);
  assert.equal(composer.value, "steer from preview", "Use in draft must restore recalled text into the composer");

  await report("preview-queue-steer-stop", {
    steerVisibleOnStreaming: true,
    pendingAfterSteer: true,
    recoveryAfterStop: true,
    useInDraftRestoresComposer: true,
  });
});
