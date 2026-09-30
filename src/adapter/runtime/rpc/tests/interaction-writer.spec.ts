import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import { Writable } from "node:stream";
import { createInteractionWriter } from "../interaction-writer.js";

test("interaction writes require callback and drain, consume one attempt, and remove observers", async () => {
  let callback!: (error?: Error | null) => void;
  const written: string[] = [];
  const stream = Object.assign(new EventEmitter(), {
    destroyed: false,
    writableEnded: false,
    write(frame: string, done: (error?: Error | null) => void) { written.push(frame); callback = done; return false; },
  }) as unknown as Writable;
  const write = createInteractionWriter(stream, () => true);
  let finished = false;
  const writing = write("frame\n").then(() => { finished = true; });
  await Promise.resolve(); assert.equal(finished, false);
  callback(); await Promise.resolve(); assert.equal(finished, false, "callback alone cannot confirm backpressure completion");
  stream.emit("drain"); await writing;
  assert.equal(finished, true); assert.deepEqual(written, ["frame\n"]);
  for (const event of ["drain", "error", "close"]) assert.equal(stream.listenerCount(event), 0);
});

test("a stalled interaction writer has a bounded pending budget and finite failure deadline", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const stream = new Writable({ write() { /* synthetic stalled receiver */ } });
  const write = createInteractionWriter(stream, () => true);
  const waits = Array.from({ length: 16 }, () => assert.rejects(write("frame\n"), /not confirmed/));
  await assert.rejects(write("overflow\n"), /capacity/);
  context.mock.timers.tick(5000); await Promise.all(waits);
  for (const event of ["drain", "error", "close"]) assert.equal(stream.listenerCount(event), 0);
  stream.destroy();
});

test("retired transport cannot write and late completion never confirms the replacement", async () => {
  let current = true; let callback!: (error?: Error | null) => void;
  let attempts = 0;
  const stream = new Writable({ write(_chunk, _encoding, done) { attempts++; callback = done; } });
  const write = createInteractionWriter(stream, () => current);
  const pending = assert.rejects(write("frame\n"), /not current/);
  current = false; callback(); await pending;
  await assert.rejects(write("second\n"), /not current/);
  assert.equal(attempts, 1);
  stream.destroy();
});
