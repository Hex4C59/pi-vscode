// Pre-code subprocess contracts, synthetic executable only; no native acceptance claim.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
const source = new URL('./', import.meta.url);
for (const scenario of ['f5', 'installed', 'failed-install', 'nonzero-review']) test(`mermaid native isolation: ${scenario}`, { skip: process.platform !== 'darwin' }, async () => {
  const repo = await realpath(await mkdtemp('/tmp/pi-mermaid-native-contract-'));
  let root;
  try {
    const scripts = path.join(repo, 'scripts/spikes'); const app = path.join(repo, 'Fake Code.app');
    await mkdir(scripts, { recursive: true }); await mkdir(path.join(app, 'Contents/MacOS'), { recursive: true });
    for (const file of ['mermaid-native.mjs', 'mermaid-native-driver.cjs', 'mermaid-native-provider.mjs']) await copyFile(new URL(file, source), path.join(scripts, file));
    const receipt = path.join(repo, 'root.txt');
    const fake = `#!${process.execPath}
const fs=require('node:fs'), path=require('node:path'), http=require('node:http');
const root=process.env.PI_MERMAID_FIXTURE, evidence=process.env.PI_MERMAID_EVIDENCE;
fs.writeFileSync(${JSON.stringify(receipt)}, root);
if (${JSON.stringify(scenario)}==='nonzero-review') {
const model=JSON.parse(fs.readFileSync(path.join(root,'agent/models.json'))).providers['queue-loopback'];
const req=http.request(model.baseUrl+'/chat/completions',{method:'POST'});req.on('error',()=>{});req.end(JSON.stringify({messages:[{role:'user',content:'MERMAID_NATIVE_SEED'}]}));
setTimeout(()=>{fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify({result:'review-complete'}));process.exit(7);},500);
} else process.exit(${scenario === 'failed-install' ? 7 : 0});\n`;
    await writeFile(path.join(app, 'Contents/MacOS/Code'), fake, { mode: 0o700 });
    const mode = scenario === 'failed-install' ? 'installed' : scenario === 'installed' ? 'installed' : 'f5';
    const result = spawnSync(process.execPath, [path.join(scripts, 'mermaid-native.mjs'), mode, path.join(repo, 'synthetic.vsix')], { env: { PATH: path.dirname(process.execPath), PI_MERMAID_CODE_APP: app }, timeout: 5000, encoding: 'utf8', windowsHide: true });
    assert.ifError(result.error); assert.equal(result.status, 1);
    root = await readFile(receipt, 'utf8');
    const evidence = path.join(repo, 'dist/goal-eight/wi087', mode);
    assert.equal(JSON.parse(await readFile(path.join(evidence, 'provider.json'), 'utf8')).closed, true);
    assert.equal(await readFile(path.join(root, 'agent/auth.json'), 'utf8'), '{}\n');
    const models = JSON.parse(await readFile(path.join(root, 'agent/models.json'), 'utf8')).providers['queue-loopback'].models;
    assert.deepEqual(models.map(model => model.id), ['queue-fixture']);
    assert.ok(models.every(model => model.reasoning));
    if (scenario === 'failed-install') return;
    const fixture = JSON.parse(await readFile(path.join(evidence, 'fixture.json'), 'utf8'));
    const args = mode === 'f5' ? JSON.parse(await readFile(path.join(root, 'launcher/.vscode/launch.json'), 'utf8')).configurations[0].args : fixture.launchArgs;
    assert.ok(args.includes('--use-inmemory-secretstorage')); assert.ok(!args.some(arg => arg.startsWith('--extensionTestsPath')));
    assert.deepEqual(args.filter(arg => !arg.startsWith('--')), [path.join(root, 'project')]);
    assert.match(await readFile(path.join(root, 'driver/extension.cjs'), 'utf8'), /exports\.activate.*require.*run/s);
    assert.equal(JSON.parse(await readFile(path.join(root, 'user/User/settings.json'), 'utf8'))['telemetry.telemetryLevel'], 'off');
    if (scenario === 'nonzero-review') assert.equal(JSON.parse(await readFile(path.join(evidence, 'process-exit.json'), 'utf8')).code, 7);
  } finally { if (root) await rm(root, { recursive: true, force: true }); await rm(repo, { recursive: true, force: true }); }
});


test('ordinary observer refuses missing actual case review', async () => {
  const { runInNewContext } = await import('node:vm');
  const code = await readFile(new URL('mermaid-native-driver.cjs', source), 'utf8');
  let result;
  const fs = { async readFile(file) { return file.endsWith('review.json') ? JSON.stringify({ cases: {}, artifacts: ['synthetic-not-native'] }) : '{"version":"synthetic"}'; },
    async writeFile(file, value) { if (file.endsWith('result.json')) result = JSON.parse(value); } };
  const vscode = { version: 'synthetic', extensions: { getExtension: () => ({ extensionPath: '/owned-synthetic', packageJSON: { version: 'synthetic' } }) }, commands: { executeCommand: async () => {} } };
  const exports = {};
  runInNewContext(code, { exports, process: { env: { PI_MERMAID_FIXTURE: '/owned-synthetic', PI_MERMAID_EVIDENCE: '/owned-synthetic', PI_MERMAID_MODE: 'f5' } },
    require: name => name === 'vscode' ? vscode : name === 'node:fs/promises' ? fs : name === 'node:path' ? path : assert });
  await assert.rejects(exports.run(), /Missing native case/);
  assert.equal(result.result, 'failed');
});
