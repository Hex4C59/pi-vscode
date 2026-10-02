// Explicit public-SDK/worker acceptance probe; synthetic data and isolated user state.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { isolatedFixture } from './project-trust-lib.mjs';
const repo = fileURLToPath(new URL('../../', import.meta.url));
const output = path.join(repo, 'dist/goal-eight/wi086');
const pkg = path.join(repo, 'node_modules/@earendil-works/pi-coding-agent');
const version = JSON.parse(await readFile(path.join(pkg, 'package.json'), 'utf8')).version;
assert.equal(version, '0.86.1', 'Re-review public session SDK before upgrades');
await mkdir(output, { recursive: true });
const bundle = path.join(output, 'session-probe.mjs');
await build({ entryPoints: [path.join(repo, 'src/adapter/sessions/index.ts')], outfile: bundle, bundle: true, platform: 'node', format: 'esm' });
const { createPiSessionBackend } = await import(pathToFileURL(bundle));
function seed(root, env, count, project = 'a') {
  const source = `import {SessionManager} from ${JSON.stringify(pathToFileURL(path.join(pkg, 'dist/index.js')).href)};
for(let index=0;index<${count};index++) {
const manager=SessionManager.create(${JSON.stringify(path.join(root, project))});
manager.appendMessage({role:'user',content:[{type:'text',text:'SYNTHETIC_META '+index}],timestamp:index});
if(index%2) manager.appendSessionInfo('Named '+String(index).padStart(4,'0'));
manager.appendMessage({role:'assistant',content:[{type:'text',text:'SYNTHETIC_REPLY'}],api:'fixture',provider:'fixture',model:'fixture',usage:{input:0,output:0,cacheRead:0,cacheWrite:0,totalTokens:0,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}},stopReason:'stop',timestamp:index});
}`;
  const created = spawnSync(process.execPath, ['--input-type=module', '--eval', source], { cwd: path.join(root, project), env, encoding: 'utf8', windowsHide: true, timeout: 60_000, maxBuffer: 65536 });
  assert.equal(created.status, 0, 'Synthetic public SDK seed must exit successfully');
}
async function assertOverBudget(backend, root, env, signal) {
  seed(root, env, 5001, 'b');
  const tooLarge = await backend.list(path.join(root, 'b'), 0, signal, { query: '', namedOnly: false, sort: 'recent' });
  assert.deepEqual(tooLarge, { ok: false, code: 'catalogue-too-large' });
}
const record = await isolatedFixture(async ({ root, env }) => {
  await writeFile(path.join(root, 'agent/auth.json'), '{}');
  seed(root, env, 40); seed(root, env, 3, 'b');
  let spawned = 0; let closed = 0;
  const backend = createPiSessionBackend(path.join(repo, 'dist/session-worker.mjs'), { env, spawn(command, args, options) {
    const child = spawn(command, args, { ...options, windowsHide: true }); spawned++; child.once('close', () => { closed++; }); return child;
  } });
  const signal = new AbortController().signal; const cwd = path.join(root, 'a');
  const all = await backend.list(cwd, 0, signal, { query: '', namedOnly: false, sort: 'recent' });
  assert.ok(all.ok); assert.equal(all.total, 40);
  const named = await backend.list(cwd, 0, signal, { query: 'SYNTHETIC_META', namedOnly: true, sort: 'name' });
  assert.ok(named.ok); assert.equal(named.total, 20); assert.equal(named.entries.length, 16); assert.equal(named.entries[0].name, 'Named 0001');
  const second = await backend.list(cwd, 1, signal, { query: 'SYNTHETIC_META', namedOnly: true, sort: 'name' });
  assert.ok(second.ok); assert.equal(second.total, 20); assert.equal(second.entries.length, 4); assert.equal(second.entries[0].name, 'Named 0033');
  const found = await backend.list(cwd, 0, signal, { query: 'named 0039', namedOnly: true, sort: 'recent' });
  assert.ok(found.ok); assert.equal(found.total, 1); assert.equal(found.entries[0].name, 'Named 0039');
  const noMatch = await backend.list(cwd, 0, signal, { query: 'absent', namedOnly: false, sort: 'oldest' });
  assert.ok(noMatch.ok); assert.equal(noMatch.total, 0);
  const clamped = await backend.list(cwd, 999, signal, { query: '', namedOnly: true, sort: 'name' });
  assert.ok(clamped.ok); assert.equal(clamped.page, 1); assert.equal(clamped.entries.length, 4);
  assert.equal(spawned, closed);
  await assertOverBudget(backend, root, env, signal);
  assert.equal(spawned, closed);
  return { projectOnlyTotal: 40, namedTotal: 20, firstPageRows: 16, secondPageRows: 4, crossPageMatch: true, noMatch: true,
    stalePageClamped: true, overBudgetRefused: true, observedWorkerClose: { spawned, closed }, inferenceRequests: 0 };
});
await writeFile(path.join(output, 'actual-session-search.json'), JSON.stringify({ version, evidence: 'actual public SessionManager + production worker/backend in isolated HOME/agent/project', record,
  limits: ['not native F5, installed VSIX, real user sessions or full-transcript search'] }, null, 2) + '\n');
console.log(path.join(output, 'actual-session-search.json'));
