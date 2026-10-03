import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
const source = new URL('./', import.meta.url);
for (const scenario of ['f5', 'installed', 'failed-install', 'nonzero-review']) test(`local diagnostics native isolation: ${scenario}`, { skip: process.platform !== 'darwin' }, async () => {
  const repo = await realpath(await mkdtemp('/tmp/pi-diagnostics-native-contract-'));
  let root;
  try {
    const scripts = path.join(repo, 'scripts/spikes'); const app = path.join(repo, 'Fake Code.app');
    await mkdir(scripts, { recursive: true }); await mkdir(path.join(app, 'Contents/MacOS'), { recursive: true });
    for (const file of ['local-diagnostics-native.mjs', 'local-diagnostics-native-driver.cjs']) await copyFile(new URL(file, source), path.join(scripts, file));
    const receipt = path.join(repo, 'root.txt');
    const fake = `#!${process.execPath}
const fs=require('node:fs'),path=require('node:path');
const root=process.env.PI_DIAGNOSTICS_FIXTURE,evidence=process.env.PI_DIAGNOSTICS_EVIDENCE;
fs.writeFileSync(${JSON.stringify(receipt)},root);
if (${JSON.stringify(scenario)}==='nonzero-review') { fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify({result:'review-complete'}));process.exit(7); }
process.exit(${scenario === 'failed-install' ? 7 : 0});\n`;
    await writeFile(path.join(app, 'Contents/MacOS/Code'), fake, { mode: 0o700 });
    const mode = scenario === 'failed-install' || scenario === 'installed' ? 'installed' : 'f5';
    const result = spawnSync(process.execPath, [path.join(scripts, 'local-diagnostics-native.mjs'), mode, path.join(repo, 'synthetic.vsix')], { env: { PATH: path.dirname(process.execPath), PI_DIAGNOSTICS_CODE_APP: app }, timeout: 5000, encoding: 'utf8', windowsHide: true });
    assert.ifError(result.error); assert.equal(result.status, 1);
    root = await readFile(receipt, 'utf8');
    assert.equal(await readFile(path.join(root, 'agent/auth.json'), 'utf8'), '{}\n');
    assert.equal(await readFile(path.join(root, 'project/fixture.txt'), 'utf8'), 'DIAGNOSTIC_EXCLUDED_SOURCE\n');
    const evidence = path.join(repo, 'dist/goal-eight/wi088', mode);
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

test('ordinary diagnostic observer refuses missing actual case review', async () => {
  const { runInNewContext } = await import('node:vm');
  const code = await readFile(new URL('local-diagnostics-native-driver.cjs', source), 'utf8');
  let result;
  const fs = { async readFile(file) { return file.endsWith('review.json') ? JSON.stringify({ cases: {}, artifacts: ['synthetic-not-native'] }) : '{"version":"0.86.1"}'; }, async writeFile(file, value) { if (file.endsWith('result.json')) result = JSON.parse(value); } };
  const vscode = { version: '1.140.0', workspace: { onDidOpenTextDocument: () => ({ dispose() {} }) }, extensions: { getExtension: () => ({ extensionPath: '/owned-synthetic', packageJSON: { version: '0.0.1' } }) }, commands: { executeCommand: async () => {} } };
  const exports = {};
  runInNewContext(code, { exports, process: { env: { PI_DIAGNOSTICS_FIXTURE: '/owned-synthetic', PI_DIAGNOSTICS_EVIDENCE: '/owned-synthetic', PI_DIAGNOSTICS_MODE: 'f5' } }, Buffer, require: name => name === 'vscode' ? vscode : name === 'node:fs/promises' ? fs : name === 'node:path' ? path : assert });
  await assert.rejects(exports.run(), /Missing native case/); assert.equal(result.result, 'failed');
});

for (const scenario of ['valid', 'changed-export', 'sensitive-extra']) test(`ordinary diagnostic observation validates exact bounded bytes: ${scenario}`, async () => {
  const { runInNewContext } = await import('node:vm');
  const code = await readFile(new URL('local-diagnostics-native-driver.cjs', source), 'utf8');
  const cases = Object.fromEntries(['safe-initial-metadata', 'read-only-preview', 'review-cancel', 'save-cancel', 'overlap-no-second-preview', 'english-export', 'repeat-recovery', 'chinese-review-cancel', 'chinese-export', 'bilingual-keyboard-visual'].map(name => [name, { result: 'passed' }]));
  const report = { schema: 'pi-vscode-local-diagnostic', schemaVersion: 1, scope: 'local metadata only', versions: { extension: '0.0.1', piRuntime: '0.86.1', vscode: '1.140.0' }, host: { platform: 'darwin', architecture: 'arm64' }, state: { workspace: 'eligible', runtime: 'not-started', chatBusy: false, modelBusy: false, sessionBusy: false, controlled: false, hostError: false, runtimeError: false } };
  if (scenario === 'sensitive-extra') report.source = 'DIAGNOSTIC_EXCLUDED_SOURCE';
  const bytes = JSON.stringify(report) + '\n'; let listener; let result;
  const fs = { async readFile(file) { if (file.endsWith('review.json')) return JSON.stringify({ cases, artifacts: ['synthetic-not-native'] }); if (file.includes('/exports/')) return scenario === 'changed-export' ? bytes + ' ' : bytes; return '{"version":"0.86.1"}'; }, async writeFile(file, value) { if (file.endsWith('result.json')) result = JSON.parse(value); }, async stat() { return { size: Buffer.byteLength(bytes), mode: 0o100600, isFile: () => true }; } };
  const vscode = { version: '1.140.0', workspace: { onDidOpenTextDocument: fn => { listener = fn; return { dispose() {} }; } }, extensions: { getExtension: () => ({ extensionPath: '/owned-synthetic', packageJSON: { version: '0.0.1' } }) }, commands: { async executeCommand() { for (let n = 1; n <= 4; n++) listener({ uri: { scheme: 'pi-vscode-diagnostics', toString: () => 'pi-vscode-diagnostics:/diagnostic-' + n + '.json' }, isDirty: false, getText: () => bytes }); } } };
  const exports = {};
  runInNewContext(code, { exports, process: { env: { PI_DIAGNOSTICS_FIXTURE: '/owned-synthetic', PI_DIAGNOSTICS_EVIDENCE: '/owned-synthetic', PI_DIAGNOSTICS_MODE: 'f5' } }, Buffer, require: name => name === 'vscode' ? vscode : name === 'node:fs/promises' ? fs : name === 'node:path' ? path : assert });
  if (scenario === 'valid') { await exports.run(); assert.equal(result.result, 'review-complete'); assert.equal(result.previews.length, 4); }
  else { await assert.rejects(exports.run(), scenario === 'changed-export' ? /frozen preview/ : /allowlisted|Excluded/); assert.equal(result.result, 'failed'); }
});
