// Prewritten subprocess composition: fake executable, no Code/keychain/native claim.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
const source = fileURLToPath(new URL('./', import.meta.url));
for (const mode of ['f5', 'installed']) test(`compaction native ${mode} isolates synthetic models and never accepts missing review`, {
  skip: process.platform !== 'darwin',
}, async () => {
  const repo = await realpath(await mkdtemp('/tmp/pi-compact-contract-'));
  let fixture;
  try {
    const scripts = path.join(repo, 'scripts/spikes');
    const app = path.join(repo, 'Fake Code.app');
    await mkdir(scripts, { recursive: true });
    await mkdir(path.join(app, 'Contents/MacOS'), { recursive: true });
    for (const file of ['manual-compaction-native.mjs', 'manual-compaction-native-driver.cjs', 'queued-input-fixture.mjs']) {
      await copyFile(path.join(source, file), path.join(scripts, file));
    }
    await writeFile(path.join(app, 'Contents/MacOS/Code'), `#!${process.execPath}\nprocess.exit(0);\n`, { mode: 0o700 });
    const result = spawnSync(process.execPath, [path.join(scripts, 'manual-compaction-native.mjs'), mode, path.join(repo, 'synthetic.vsix')], {
      env: { PATH: path.dirname(process.execPath), PI_COMPACTION_CODE_APP: app }, timeout: 15000, encoding: 'utf8', windowsHide: true,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 1, 'no native review must fail');
    fixture = JSON.parse(await readFile(path.join(repo, 'dist/goal-eight/wi083', mode, 'fixture.json'), 'utf8'));
    const settings = JSON.parse(await readFile(path.join(fixture.root, 'agent/settings.json'), 'utf8'));
    assert.equal(settings.defaultProvider, 'queue-loopback'); assert.equal(settings.defaultModel, 'queue-fixture');
    assert.equal(settings.compaction.enabled, false);
    assert.equal(await readFile(path.join(fixture.root, 'agent/auth.json'), 'utf8'), '{}\n');
    const provider = JSON.parse(await readFile(path.join(fixture.root, 'agent/models.json'), 'utf8')).providers['queue-loopback'];
    assert.match(provider.baseUrl, /^http:\/\/127\.0\.0\.1:\d+\/v1$/);
    assert.equal(provider.apiKey, 'fixture-not-secret');
    let args = fixture.launchArgs;
    if (mode === 'f5') args = JSON.parse(await readFile(path.join(fixture.root, 'launcher/.vscode/launch.json'), 'utf8')).configurations[0].args;
    for (const arg of ['--use-inmemory-secretstorage', '--disable-extension=vscode.github-authentication', '--disable-extension=vscode.microsoft-authentication']) assert.ok(args.includes(arg));
    assert.deepEqual(args.filter(arg => !arg.startsWith('--')), [path.join(fixture.root, 'project')]);
    assert.ok(!args.some(arg => arg.startsWith('--extensionTestsPath')), 'VS Code test mode refuses native modal dialogs');
    assert.match(await readFile(path.join(fixture.root, 'driver/extension.cjs'), 'utf8'), /exports\.activate.*require.*run/s, 'ordinary observer activation required');
    assert.equal(JSON.parse(await readFile(path.join(repo, 'dist/goal-eight/wi083', mode, 'provider.json'), 'utf8')).closed, true);
  } finally {
    if (fixture) await rm(fixture.root, { recursive: true, force: true });
    await rm(repo, { recursive: true, force: true });
  }
});

test('failed installation closes the owned loopback provider without opening Code', { skip: process.platform !== 'darwin' }, async () => {
  const repo = await realpath(await mkdtemp('/tmp/pi-compact-install-failure-'));
  let fixture;
  try {
    const scripts = path.join(repo, 'scripts/spikes'); const app = path.join(repo, 'Fake Code.app');
    await mkdir(scripts, { recursive: true }); await mkdir(path.join(app, 'Contents/MacOS'), { recursive: true });
    for (const file of ['manual-compaction-native.mjs', 'manual-compaction-native-driver.cjs', 'queued-input-fixture.mjs']) await copyFile(path.join(source, file), path.join(scripts, file));
    const receipt = path.join(repo, 'owned-root.txt');
    await writeFile(path.join(app, 'Contents/MacOS/Code'), `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(receipt)}, process.env.PI_COMPACTION_FIXTURE); process.exit(7);\n`, { mode: 0o700 });
    const result = spawnSync(process.execPath, [path.join(scripts, 'manual-compaction-native.mjs'), 'installed', path.join(repo, 'synthetic.vsix')], {
      env: { PATH: path.dirname(process.execPath), PI_COMPACTION_CODE_APP: app }, timeout: 2000, encoding: 'utf8', windowsHide: true,
    });
    fixture = await readFile(receipt, 'utf8');
    assert.ifError(result.error); assert.equal(result.status, 1);
    const provider = JSON.parse(await readFile(path.join(repo, 'dist/goal-eight/wi083/installed/provider.json'), 'utf8'));
    assert.equal(provider.closed, true); assert.equal(provider.requests.length, 0);
  } finally {
    if (fixture) await rm(fixture, { recursive: true, force: true });
    await rm(repo, { recursive: true, force: true });
  }
});

test('nonzero owned Code exit cannot be masked by a completed review record', { skip: process.platform !== 'darwin' }, async () => {
  const repo = await realpath(await mkdtemp('/tmp/pi-compact-exit-contract-'));
  let fixture;
  try {
    const scripts = path.join(repo, 'scripts/spikes'); const app = path.join(repo, 'Fake Code.app');
    await mkdir(scripts, { recursive: true }); await mkdir(path.join(app, 'Contents/MacOS'), { recursive: true });
    for (const file of ['manual-compaction-native.mjs', 'manual-compaction-native-driver.cjs', 'queued-input-fixture.mjs']) await copyFile(path.join(source, file), path.join(scripts, file));
    await writeFile(path.join(app, 'Contents/MacOS/Code'), `#!${process.execPath}
const fs = require('node:fs'); const path = require('node:path'); const http = require('node:http');
const root = process.env.PI_COMPACTION_FIXTURE; const evidence = process.env.PI_COMPACTION_EVIDENCE;
const model = JSON.parse(fs.readFileSync(path.join(root, 'agent/models.json'))).providers['queue-loopback'];
for (let i = 0; i < 3; i++) { const req = http.request(model.baseUrl + '/chat/completions', { method: 'POST' }); req.on('error', () => {}); req.end(JSON.stringify({ messages: [{ role: 'user', content: 'LITERAL_CUSTOM_中' }] })); }
const timer = setInterval(() => { try { if (JSON.parse(fs.readFileSync(path.join(evidence, 'provider-live.json'))).requests.length < 3) return; } catch { return; }
clearInterval(timer); fs.writeFileSync(path.join(evidence, 'result.json'), JSON.stringify({ result: 'review-complete' })); process.exit(7); }, 50);
`, { mode: 0o700 });
    const result = spawnSync(process.execPath, [path.join(scripts, 'manual-compaction-native.mjs'), 'f5'], {
      env: { PATH: path.dirname(process.execPath), PI_COMPACTION_CODE_APP: app }, timeout: 5000, encoding: 'utf8', windowsHide: true,
    });
    assert.ifError(result.error);
    fixture = JSON.parse(await readFile(path.join(repo, 'dist/goal-eight/wi083/f5/fixture.json'), 'utf8')).root;
    assert.equal(result.status, 1, 'a failed native process must not pass');
    assert.equal(JSON.parse(await readFile(path.join(repo, 'dist/goal-eight/wi083/f5/process-exit.json'), 'utf8')).code, 7);
  } finally {
    if (fixture) await rm(fixture, { recursive: true, force: true });
    await rm(repo, { recursive: true, force: true });
  }
});
