// Explicit actual public-RPC evidence; synthetic isolated catalogue, zero inference.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { isolatedFixture } from './project-trust-lib.mjs';
import { createLoopbackProvider, withQueueRuntime } from './queued-input-fixture.mjs';
const repo = fileURLToPath(new URL('../../', import.meta.url));
const output = path.join(repo, 'dist/goal-eight/wi085');
const pkg = path.join(repo, 'node_modules/@earendil-works/pi-coding-agent');
const version = JSON.parse(await readFile(path.join(pkg, 'package.json'), 'utf8')).version;
assert.equal(version, '0.86.1', 'Re-review public model RPC before upgrades');
await mkdir(output, { recursive: true });
const bundle = path.join(output, 'jsonl-probe.mjs');
await build({ entryPoints: [path.join(repo, 'src/adapter/runtime/rpc/jsonl.ts')], outfile: bundle, bundle: true, platform: 'node', format: 'esm' });
const { attachJsonlLineReader } = await import(pathToFileURL(bundle));
const record = await isolatedFixture(async ({ root, env }) => {
  const provider = await createLoopbackProvider();
  try {
    const model = id => ({ id, name: 'Duplicate synthetic label', reasoning: true, input: ['text'], contextWindow: 10000, maxTokens: 1000,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } });
    await writeFile(path.join(root, 'agent/models.json'), JSON.stringify({ providers: { 'queue-loopback': {
      baseUrl: provider.url, api: 'openai-completions', apiKey: 'fixture-not-secret', models: [model('queue-fixture'), model('cycle-second')],
    } } }));
    await writeFile(path.join(root, 'agent/auth.json'), '{}');
    return await withQueueRuntime(path.join(pkg, 'dist/bundle/cli.js'), { root, env, attachJsonlLineReader }, async runtime => {
      const catalogue = await runtime.request('get_available_models');
      assert.ok(catalogue.models.some(model => model.provider === 'queue-loopback' && model.id === 'cycle-second'));
      const applied = [];
      for (const modelId of ['cycle-second', 'queue-fixture', 'cycle-second']) {
        await runtime.request('set_model', { provider: 'queue-loopback', modelId });
        const state = await runtime.request('get_state'); assert.equal(state.model.id, modelId);
        applied.push({ provider: state.model.provider, modelId: state.model.id });
      }
      for (const level of ['high', 'off', 'medium']) {
        await runtime.request('set_thinking_level', { level });
        assert.equal((await runtime.request('get_state')).thinkingLevel, level);
      }
      assert.equal((await runtime.response('set_model', { provider: 'queue-loopback', modelId: 'not-a-model' })).success, false);
      assert.equal((await runtime.request('get_state')).model.id, 'cycle-second');
      assert.equal(provider.requests.length, 0);
      return { applied, thinkingLevelsReadBack: ['high', 'off', 'medium'], invalidModelRejected: true, loopbackInferenceRequests: 0 };
    });
  } finally { await provider.close(); }
});
assert.equal(record.cleanup.childCloseObserved, true);
await writeFile(path.join(output, 'runtime-model-cycling.json'), JSON.stringify({ version,
  evidence: 'actual pi public RPC; isolated HOME/agent/project, synthetic catalogue', realModelCalls: 0, record,
  limits: ['not host cycle command composition, native F5, installed VSIX or account connectivity'] }, null, 2) + '\n');
console.log(path.join(output, 'runtime-model-cycling.json'));
