import assert from "node:assert/strict";
import { test } from "node:test";
import { Writable } from "node:stream";
import { createInteractionWriter } from "../interaction-writer.js";

test("interaction writes require callback and drain, consume one attempt, and remove observers", async () => {
  let callback!: (error?: Error | null) => void;
  const stream = new Writable({ highWaterMark: 1, write(_chunk, _encoding, done) { callback = done; } });
  const write = createInteractionWriter(stream, () => true);
  let finished = false;
  const writing = write("frame\n").then(() => { finished = true; });
  await Promise.resolve(); assert.equal(finished, false);
  callback(); await writing;
  assert.equal(finished, true); assert.equal(stream.listenerCount("drain"), 0); assert.equal(stream.listenerCount("error"), 0);
  stream.destroy();
});

test("a stalled interaction writer has a bounded pending budget and finite failure deadline", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const stream = new Writable({ write() { /* synthetic stalled receiver */ } });
  const write = createInteractionWriter(stream, () => true);
  const waits = Array.from({ length: 16 }, () => assert.rejects(write("frame\n"), /not confirmed/));
  await assert.rejects(write("overflow\n"), /capacity/);
  context.mock.timers.tick(5000); await Promise.all(waits);
  assert.equal(stream.listenerCount("drain"), 0); assert.equal(stream.listenerCount("close"), 0);
  stream.destroy();
});

test("retired transport cannot write and late completion never confirms the replacement", async () => {
  let current = true; let callback!: (error?: Error | null) => void;
  const stream = new Writable({ write(_chunk, _encoding, done) { callback = done; } });
  const write = createInteractionWriter(stream, () => current);
  const pending = assert.rejects(write("frame\n"), /not current/);
  current = false; callback(); await pending;
  await assert.rejects(write("second\n"), /not current/); stream.destroy();
});
