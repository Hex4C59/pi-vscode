import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { withProcess } from './project-trust-lib.mjs';
import { sessionUsageNumbers } from '../../src/adapter/runtime/session-usage.ts';

const output = path.resolve('dist/wi079-session-usage');
const root = path.join(output, `isolated-real-pi-${Date.now()}`);
for (const name of ['home', 'agent', 'tmp', 'workspace']) await mkdir(path.join(root, name), { recursive: true });
const env = { HOME: path.join(root, 'home'), USERPROFILE: path.join(root, 'home'), PI_CODING_AGENT_DIR: path.join(root, 'agent'),
  PI_OFFLINE: '1', PI_TELEMETRY: '0', TMPDIR: path.join(root, 'tmp'), TMP: path.join(root, 'tmp'), TEMP: path.join(root, 'tmp'),
  PATH: path.dirname(process.execPath), LANG: 'C.UTF-8', TERM: 'dumb' };
let requests = 0, childClosed = false;
const server = createServer((request, response) => {
  requests++; assert.equal(request.url, '/v1/chat/completions'); request.resume();
  response.writeHead(200, { 'Content-Type': 'text/event-stream' });
  const base = { id: 'fixture', object: 'chat.completion.chunk', created: 0, model: 'usage-fixture' };
  const chunk = value => response.write(`data: ${JSON.stringify({ ...base, ...value })}\n\n`);
  chunk({ choices: [{ index: 0, delta: { role: 'assistant', content: 'usage-fixture-ok' }, finish_reason: null }] });
  chunk({ choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] });
  chunk({ choices: [], usage: { prompt_tokens: 123, completion_tokens: 17, total_tokens: 140 } });
  response.end('data: [DONE]\n\n');
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
let evidence;
try {
  const model = { id: 'usage-fixture', name: 'Usage fixture', reasoning: false, input: ['text'], contextWindow: 10000, maxTokens: 1000,
    cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 } };
  await writeFile(path.join(root, 'agent', 'models.json'), JSON.stringify({ providers: { 'usage-loopback': { baseUrl: `http://127.0.0.1:${server.address().port}/v1`, api: 'openai-completions', apiKey: 'fixture-not-secret', models: [model] } } }));
  const cli = path.resolve('node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js');
  await withProcess([cli, '--offline', '--mode', 'rpc', '--no-session', '--no-tools', '--no-extensions', '--no-approve', '--model', 'usage-loopback/usage-fixture'],
    { cwd: path.join(root, 'workspace'), env, timeoutMs: 15000 }, async ({ child, request }) => {
      child.once('close', () => { childClosed = true; });
      const reader = createInterface({ input: child.stdout });
      let settle; const settled = new Promise(resolve => { settle = resolve; });
      reader.on('line', line => { const event = JSON.parse(line); if (event.type === 'agent_settled') settle(); });
      try {
        const initial = await request('get_session_stats');
        await request('prompt', { message: 'fixture' }); await settled;
        const state = await request('get_state'), stats = await request('get_session_stats');
        const usage = sessionUsageNumbers(stats, state);
        assert.equal(usage.tokens.input, 123); assert.equal(usage.tokens.output, 17);
        assert.equal(usage.tokens.total, 140); assert.equal(requests, 1);
        const after = await request('get_session_stats'); assert.deepEqual(after.tokens, stats.tokens); assert.equal(requests, 1);
        evidence = { status: 'passed', piVersion: '0.86.1', evidence: 'actual-public-pi-rpc-loopback-provider', initialUsage: sessionUsageNumbers(initial, state), usage,
          refreshDidNotPrompt: true, limits: ['fixture provider counts', 'not native F5 or installed VSIX'] };
      } finally { reader.close(); }
    });
} finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
assert.equal(childClosed, true);
await writeFile(path.join(output, 'real-pi-rpc.json'), JSON.stringify({ ...evidence, childClosed }, null, 2));
console.log('PASS actual pi 0.86.1 usage and observed child close');
