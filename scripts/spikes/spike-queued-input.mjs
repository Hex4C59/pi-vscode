import assert from 'node:assert/strict';
import { access, readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { isolatedFixture } from './project-trust-lib.mjs';
import { createLoopbackProvider, withQueueRuntime } from './queued-input-fixture.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(repo, 'dist/wi076-queue-rpc');
const markers = { recalled: 'RECALL_STEER_中\u2028literal', followRecall: 'RECALL_FOLLOW', steer: 'DELIVER_STEER', follow: 'DELIVER_FOLLOW' };

async function snapshotPin() {
  const pkg = JSON.parse(await readFile(path.join(repo, 'package.json'), 'utf8'));
  const installed = path.join(repo, 'node_modules/@earendil-works/pi-coding-agent');
  const actual = JSON.parse(await readFile(path.join(installed, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies['@earendil-works/pi-coding-agent'], actual.version);
  assert.equal(actual.version, '0.86.1', 'Re-review public queue semantics before upgrading this spike');
  const cli = path.join(installed, 'dist/bundle/cli.js');
  return { version: actual.version, cli, cliSha256: createHash('sha256').update(await readFile(cli)).digest('hex') };
}

async function configureAgent(root, url) {
  const model = { id: 'queue-fixture', name: 'Queue fixture', reasoning: false, input: ['text'], contextWindow: 10000, maxTokens: 1000, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } };
  const models = { providers: { 'queue-loopback': { baseUrl: url, api: 'openai-completions', apiKey: 'fixture-not-secret', models: [model] } } };
  await writeFile(path.join(root, 'agent/models.json'), JSON.stringify(models));
}

async function verifyRecall(runtime, provider) {
  await runtime.request('prompt', { message: 'BASE_RECALL' });
  await provider.waitFor(1);
  const rejected = await runtime.response('prompt', { message: 'BUSY_NOT_QUEUED' });
  assert.equal(rejected.success, false);
  await runtime.request('steer', { message: markers.recalled });
  await runtime.request('follow_up', { message: markers.followRecall });
  assert.equal((await runtime.request('get_state')).pendingMessageCount, 2);
  const cleared = await runtime.request('clear_queue');
  assert.deepEqual(cleared, { steering: [markers.recalled], followUp: [markers.followRecall] });
  await runtime.request('abort');
  const state = await runtime.request('get_state');
  assert.equal(state.isStreaming, false);
  assert.equal(state.pendingMessageCount, 0);
  return { rejectedBusyPrompt: true, cleared, stopped: true };
}

async function verifyDelivery(runtime, provider) {
  await runtime.request('prompt', { message: 'BASE_DELIVERY' });
  await provider.waitFor(2);
  await runtime.request('steer', { message: markers.steer });
  await runtime.request('follow_up', { message: markers.follow });
  assert.equal((await runtime.request('get_state')).pendingMessageCount, 2);
  assert.equal(provider.requests.length, 2, 'ACK must not be presented as queue execution');
  provider.release(2);
  await runtime.waitForIdle();
  assert.equal(provider.requests.length, 4);
  const messages = provider.requests.slice(1).map(request => JSON.stringify(request.messages));
  assert.ok(!messages[0].includes(markers.steer) && !messages[0].includes(markers.follow));
  assert.ok(messages[1].includes(markers.steer) && !messages[1].includes(markers.follow));
  assert.ok(messages[2].includes(markers.steer) && messages[2].includes(markers.follow));
  for (const message of messages) {
    for (const forbidden of [markers.recalled, markers.followRecall, 'BUSY_NOT_QUEUED']) assert.ok(!message.includes(forbidden));
  }
  assert.equal((await runtime.request('get_state')).pendingMessageCount, 0);
  return { requests: 3, order: ['base', 'steering', 'follow-up'], oldQueueExcluded: true };
}

async function verifyDeadline(pin, attachJsonlLineReader) {
  let ownedRoot;
  const result = await isolatedFixture(async ({ root, env }) => {
    ownedRoot = root;
    const provider = await createLoopbackProvider();
    let closed = false;
    try {
      await configureAgent(root, provider.url);
      await assert.rejects(withQueueRuntime(pin.cli, {
        root, env, attachJsonlLineReader, timeoutMs: 2000,
        onClosed: () => { closed = true; },
      }, async runtime => {
        await runtime.request('prompt', { message: 'DEADLINE_ONLY' });
        await provider.waitFor(1);
        await runtime.waitForIdle();
      }), /deadline exceeded/);
      assert.equal(provider.requests.length, 1, 'Timeout scenario must reach the actual provider');
      assert.equal(closed, true, 'A timeout is not cleanup until process close is observed');
      return { timeoutRejected: true, liveProviderReached: true, childCloseObserved: true };
    } finally { await provider.close(); }
  });
  await assert.rejects(access(ownedRoot), error => error.code === 'ENOENT');
  return { ...result, fixtureRemoved: true };
}

async function run() {
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ status: 'running' }) + '\n');
  const pin = await snapshotPin();
  const readerFile = path.join(output, 'jsonl-reader.mjs');
  await build({ entryPoints: [path.join(repo, 'src/adapter/runtime/rpc/jsonl.ts')], bundle: true, platform: 'node', format: 'esm', target: 'node22', outfile: readerFile });
  const { attachJsonlLineReader } = await import(pathToFileURL(readerFile).href);
  let ownedRoot;
  const results = await isolatedFixture(async ({ root, env }) => {
    ownedRoot = root;
    const provider = await createLoopbackProvider();
    try {
      await configureAgent(root, provider.url);
      return await withQueueRuntime(pin.cli, { root, env, attachJsonlLineReader }, async runtime => ({
        recall: await verifyRecall(runtime, provider), delivery: await verifyDelivery(runtime, provider),
        transport: { delimiter: 'LF', unicodeRoundTrip: true }, providerRequests: provider.requests.length,
      }));
    } finally { await provider.close(); }
  });
  await assert.rejects(access(ownedRoot), error => error.code === 'ENOENT');
  results.cleanup.fixtureRemoved = true;
  const failureCleanup = await verifyDeadline(pin, attachJsonlLineReader);
  const report = { schemaVersion: 1, status: 'passed', failureCleanup, evidence: 'actual-pi-runtime-with-synthetic-loopback-provider', version: pin.version, cliSha256: pin.cliSha256, host: { platform: process.platform, arch: process.arch, node: process.version }, results, limits: ['not a real model', 'not extension-host/F5/installed-VSIX acceptance', 'no product queue UI or attachments verified'] };
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('PASS queued input: exact recall, clear→abort, steering→follow-up, no old-queue replay; report in dist/wi076-queue-rpc/report.json');
}

try { await run(); }
catch (error) {
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ schemaVersion: 1, status: 'failed', evidence: 'no passing acceptance; see command diagnostics' }) + '\n');
  throw error;
}
