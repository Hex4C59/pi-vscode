import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { EventEmitter, once } from "node:events";
import { createRequire } from "node:module";
import path from "node:path";
import type { TestContext } from "node:test";

const workerMain = `
const api = module.exports;
const fs = require('node:fs/promises');
let release;
process.on('message', async message => {
  if (message.type === 'resume') { release?.(); return; }
  if (message.type !== 'start') return;
  const { file, operation, id, hold } = message;
  let paused = false;
  const io = { ...fs, async open(target, flags, mode) {
    if (hold && target === file && !paused) {
      paused = true;
      await new Promise(resolve => { release = resolve; process.send({ event: 'held' }); });
    }
    return fs.open(target, flags, mode);
  } };
  try {
    const result = operation === 'add'
      ? await api.addOpenAiEndpoint(file, { providerId: id, displayName: id, baseUrl: 'http://127.0.0.1:8000/v1', modelId: 'fixture' }, () => false, io)
      : await api.removeOpenAiEndpoint(file, id, () => false, io);
    process.send({ event: 'done', result }, () => process.disconnect());
  } catch { process.send({ event: 'failed' }, () => process.disconnect()); }
});
`;

type Worker = { child: ChildProcess; wait(event: string): Promise<unknown>; close: Promise<unknown[]> };

function observeWorker(child: ChildProcess): Worker {
  const seen = new Map<string, unknown>();
  const events = new EventEmitter();
  let closed = false;
  child.on("message", message => {
    if (typeof message !== "object" || message === null || !("event" in message) || typeof message.event !== "string") return;
    seen.set(message.event, message);
    events.emit(message.event, message);
  });
  const close = once(child, "close");
  void close.then(() => { closed = true; events.emit("closed"); }, () => { closed = true; events.emit("closed"); });
  return { child, close, wait: event => {
    if (seen.has(event)) return Promise.resolve(seen.get(event));
    if (closed) return Promise.reject(new Error("worker closed before event"));
    return new Promise((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); events.off(event, done); events.off("closed", ended); };
      const done = (value: unknown) => { cleanup(); resolve(value); };
      const ended = () => { cleanup(); reject(new Error("worker closed before event")); };
      const timer = setTimeout(() => { cleanup(); reject(new Error(`worker event timeout: ${event}`)); }, 5000);
      events.once(event, done);
      events.once("closed", ended);
    });
  } };
}

export async function startEndpointWorker(
  t: TestContext, file: string, operation: "add" | "remove", id: string, hold = false,
): Promise<Worker> {
  // The installed dev dependency must stay outside the compiled test bundle.
  const tools: typeof import("esbuild") = createRequire(path.resolve("package.json"))("esbuild");
  const output = await tools.build({
    entryPoints: [path.resolve("src/extension/models/customEndpoints.ts")], bundle: true, write: false,
    platform: "node", format: "cjs", target: "node22", logLevel: "silent",
  });
  assert.equal(output.outputFiles.length, 1);
  const child = spawn(process.execPath, ["-e", `${output.outputFiles[0].text}\n${workerMain}`], {
    stdio: ["ignore", "ignore", "pipe", "ipc"], windowsHide: true,
  });
  const worker = observeWorker(child);
  let stderr = "";
  child.stderr?.on("data", chunk => { stderr = `${stderr}${String(chunk)}`.slice(-2048); });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await worker.close;
    assert.equal(stderr, "");
  });
  child.send({ type: "start", file, operation, id, hold });
  return worker;
}

export async function workerResult(worker: Worker): Promise<unknown> {
  const message = await worker.wait("done");
  assert.ok(typeof message === "object" && message !== null && "result" in message);
  const [code, signal] = await worker.close;
  assert.equal(code, 0);
  assert.equal(signal, null);
  return message.result;
}
