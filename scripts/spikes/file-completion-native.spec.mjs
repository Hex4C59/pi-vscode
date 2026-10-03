// Pre-code subprocess contracts, synthetic executable only; no native acceptance claim.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
const source = new URL('./', import.meta.url);
for (const scenario of ['f5', 'installed', 'failed-install', 'nonzero-review']) test(`file completion native isolation: ${scenario}`, { skip: process.platform !== 'darwin' }, async () => {
  const repo = await realpath(await mkdtemp('/tmp/pi-file-native-contract-'));
  let root;
  try {
    const scripts = path.join(repo, 'scripts/spikes'); const app = path.join(repo, 'Fake Code.app');
    await mkdir(scripts, { recursive: true }); await mkdir(path.join(app, 'Contents/MacOS'), { recursive: true });
    for (const file of ['file-completion-native.mjs', 'file-completion-native-driver.cjs', 'queued-input-fixture.mjs']) await copyFile(new URL(file, source), path.join(scripts, file));
    const receipt = path.join(repo, 'root.txt');
    const fake = `#!${process.execPath}
const fs=require('node:fs'), path=require('node:path'), http=require('node:http');
const root=process.env.PI_FILE_COMPLETION_FIXTURE, evidence=process.env.PI_FILE_COMPLETION_EVIDENCE;
fs.writeFileSync(${JSON.stringify(receipt)}, root);
if (${JSON.stringify(scenario)}==='nonzero-review') {
const model=JSON.parse(fs.readFileSync(path.join(root,'agent/models.json'))).providers['queue-loopback'];
const req=http.request(model.baseUrl+'/chat/completions',{method:'POST'});req.on('error',()=>{});req.end(JSON.stringify({messages:[{role:'user',content:'FILE_COMPLETION_CHANGED_中'}]}));
setTimeout(()=>{fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify({result:'review-complete'}));process.exit(7);},500);
} else process.exit(${scenario === 'failed-install' ? 7 : 0});\n`;
    await writeFile(path.join(app, 'Contents/MacOS/Code'), fake, { mode: 0o700 });
    const mode = scenario === 'failed-install' ? 'installed' : scenario === 'installed' ? 'installed' : 'f5';
    const result = spawnSync(process.execPath, [path.join(scripts, 'file-completion-native.mjs'), mode, path.join(repo, 'synthetic.vsix')], { env: { PATH: path.dirname(process.execPath), PI_FILE_COMPLETION_CODE_APP: app }, timeout: 5000, encoding: 'utf8', windowsHide: true });
    assert.ifError(result.error); assert.equal(result.status, 1);
    root = await readFile(receipt, 'utf8');
    const evidence = path.join(repo, 'dist/goal-eight/wi084', mode);
    assert.equal(JSON.parse(await readFile(path.join(evidence, 'provider.json'), 'utf8')).closed, true);
    assert.equal(await readFile(path.join(root, 'agent/auth.json'), 'utf8'), '{}\n');
    assert.match(await readFile(path.join(root, 'project/nested/fixture-中.txt'), 'utf8'), /FILE_COMPLETION_ORIGINAL_中/);
    assert.equal((await readFile(path.join(root, 'project/oversized.txt'))).length, 262145);
    if (scenario === 'failed-install') return;
    const fixture = JSON.parse(await readFile(path.join(evidence, 'fixture.json'), 'utf8'));
    const args = mode === 'f5' ? JSON.parse(await readFile(path.join(root, 'launcher/.vscode/launch.json'), 'utf8')).configurations[0].args : fixture.launchArgs;
    assert.ok(args.includes('--use-inmemory-secretstorage')); assert.ok(!args.some(arg => arg.startsWith('--extensionTestsPath')));
    assert.deepEqual(args.filter(arg => !arg.startsWith('--')), [path.join(root, 'project')]);
    assert.match(await readFile(path.join(root, 'driver/extension.cjs'), 'utf8'), /exports\.activate.*require.*run/s);
    assert.equal(JSON.parse(await readFile(path.join(root, 'user/User/settings.json'), 'utf8'))['files.exclude']['**/excluded.txt'], true);
    if (scenario === 'nonzero-review') assert.equal(JSON.parse(await readFile(path.join(evidence, 'process-exit.json'), 'utf8')).code, 7);
  } finally { if (root) await rm(root, { recursive: true, force: true }); await rm(repo, { recursive: true, force: true }); }
});
