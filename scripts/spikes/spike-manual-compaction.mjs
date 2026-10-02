// Explicit isolated actual-pi probe. No real model/account/credential or native-host claim.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { isolatedFixture } from './project-trust-lib.mjs';
import { createLoopbackProvider, withQueueRuntime } from './queued-input-fixture.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const output = path.join(repo, 'dist/goal-eight/wi083');
const pkg = path.join(repo, 'node_modules/@earendil-works/pi-coding-agent');
const version = JSON.parse(await readFile(path.join(pkg, 'package.json'), 'utf8')).version;
assert.equal(version, '0.86.1', 'Re-review public compact API before upgrading');
await mkdir(output, { recursive: true });
const readerBundle = path.join(output, 'jsonl-probe.mjs');
await build({ entryPoints: [path.join(repo, 'src/adapter/runtime/rpc/jsonl.ts')], outfile: readerBundle, bundle: true, platform: 'node', format: 'esm' });
const { attachJsonlLineReader } = await import(pathToFileURL(readerBundle));
const records = [];
for (const scenario of ['completed', 'cancelled', 'too-small']) {
  const record = await isolatedFixture(async ({ root, env }) => {
    const events = [];
    const provider = await createLoopbackProvider(new Set([1, 2, 3]));
    try {
      const model = { id: 'queue-fixture', name: 'Synthetic compaction fixture', reasoning: false, input: ['text'], contextWindow: 10000, maxTokens: 1000, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } };
      await writeFile(path.join(root, 'agent/models.json'), JSON.stringify({ providers: { 'queue-loopback': { baseUrl: provider.url, api: 'openai-completions', apiKey: 'fixture-not-secret', models: [model] } } }));
      await writeFile(path.join(root, 'agent/auth.json'), '{}');
      await writeFile(path.join(root, 'agent/settings.json'), JSON.stringify({ compaction: { enabled: false, keepRecentTokens: 1, reserveTokens: 100 } }));
      return await withQueueRuntime(path.join(pkg, 'dist/bundle/cli.js'), { root, env, attachJsonlLineReader, timeoutMs: 20000, onEvent: frame => {
        if (frame.type === "compaction_start" || frame.type === "compaction_end") events.push({ type: frame.type, reason: frame.reason, ...(typeof frame.aborted === "boolean" ? { aborted: frame.aborted } : {}) });
      } }, async runtime => {
        if (scenario !== 'too-small') {
          await runtime.request('prompt', { message: 'SYNTHETIC_HISTORY '.repeat(200) });
          await provider.waitFor(1); provider.release(1); await runtime.waitForIdle();
          await runtime.request("prompt", { message: "SECOND_SYNTHETIC_TURN ".repeat(100) });
          await provider.waitFor(2); provider.release(2); await runtime.waitForIdle();
        }
        const compact = runtime.response('compact', { customInstructions: 'LITERAL_CUSTOM_中 preserve fixture only' });
        compact.catch(() => {});
        if (scenario === 'too-small') {
          const result = await compact;
          assert.equal(result.success, false); assert.equal(provider.requests.length, 0);
          assert.ok(events.some(event => event.type === 'compaction_end' && event.aborted === false));
          return { scenario, outcome: 'failed', loopbackRequests: 0, events };
        }
        await provider.waitFor(3);
        if (scenario === 'cancelled') {
          await runtime.request('clear_queue'); await runtime.request('abort');
          assert.equal((await compact).success, false);
          assert.ok(events.some(event => event.type === 'compaction_end' && event.aborted === true));
        } else { provider.release(3); const result = await compact; assert.equal(result.success, true); assert.equal(typeof result.data.summary, 'string');
          assert.ok(provider.requests.some(request => JSON.stringify(request.messages).includes("LITERAL_CUSTOM_中"))); }
        assert.equal((await runtime.request('get_state')).isCompacting, false);
        return { scenario, outcome: scenario, loopbackRequests: provider.requests.length, events, literalInstructionsObserved: scenario === "completed" };
      });
    } finally { await provider.close(); }
  });
  assert.equal(record.cleanup.childCloseObserved, true);
  records.push(record);
}
await writeFile(path.join(output, 'runtime-compaction.json'), JSON.stringify({ version, evidence: 'actual pi public RPC; isolated HOME/agent/project, synthetic loopback model', realModelCalls: 0,
  records, limits: ['not host adapter composition, F5, installed VSIX, real credentials or paid models'] }, null, 2) + '\n');
console.log(path.join(output, 'runtime-compaction.json'));
