// Launcher composition only: never starts Code or reads a real keychain.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const launcher = fileURLToPath(new URL('./resource-report-native.mjs', import.meta.url));
const fakeExecutable = `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.PI_REPORT_FIXTURE;
const args = process.argv.slice(2);
const calls = path.join(root, 'launcher-calls.jsonl');
fs.appendFileSync(calls, JSON.stringify({ args, home: process.env.HOME }) + '\\n');
// Installation CLI does not open an interactive window.
process.exit(0);
`;

function assertInteractiveIsolation(args) {
  assert.ok(args.includes('--use-inmemory-secretstorage'), 'memory-only secret storage required');
  for (const id of ['vscode.github-authentication', 'vscode.microsoft-authentication']) {
    assert.ok(args.includes(`--disable-extension=${id}`), `atomic disable builtin ${id}`);
  }
}

for (const mode of ['f5', 'installed']) {
  test(`native ${mode} launcher keeps credential isolation across executable boundaries`, {
    skip: process.platform !== 'darwin',
  }, async () => {
    const repo = await realpath(await mkdtemp('/tmp/pi-native-launch-contract-'));
    let fixture;
    try {
      const scripts = path.join(repo, 'scripts/spikes');
      const app = path.join(repo, 'Fake Code.app');
      await mkdir(scripts, { recursive: true });
      await mkdir(path.join(app, 'Contents/MacOS'), { recursive: true });
      await copyFile(launcher, path.join(scripts, 'resource-report-native.mjs'));
      await writeFile(path.join(app, 'Contents/MacOS/Code'), fakeExecutable, { mode: 0o700 });
      const result = spawnSync(process.execPath, [path.join(scripts, 'resource-report-native.mjs'), mode, path.join(repo, 'synthetic.vsix')], {
        env: { PATH: path.dirname(process.execPath), LANG: 'en_US.UTF-8', PI_REPORT_CODE_APP: app },
        timeout: 15000, encoding: 'utf8', windowsHide: true,
      });
      assert.ifError(result.error);
      const evidence = path.join(repo, 'dist/goal-eight/wi082', mode);
      fixture = JSON.parse(await readFile(path.join(evidence, 'fixture.json'), 'utf8'));
      assert.equal(result.status, 1, 'no driver/native acceptance must stay failed');
      const calls = (await readFile(path.join(fixture.root, 'launcher-calls.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
      assert.equal(calls.length, mode === 'installed' ? 2 : 1);
      for (const call of calls) {
        assert.ok(call.args.includes('--use-inmemory-secretstorage'), 'all invocations need memory-only secrets');
        assert.equal(call.home, path.join(fixture.root, 'home'));
      }
      assertInteractiveIsolation(fixture.launchArgs);
      if (mode === 'f5') {
        const debug = JSON.parse(await readFile(path.join(fixture.root, 'launcher/.vscode/launch.json'), 'utf8')).configurations[0];
        assertInteractiveIsolation(debug.args);
        assert.deepEqual(debug.args.filter(arg => !arg.startsWith('--')), [path.join(fixture.root, 'project')], 'only the synthetic project is positional');
        assert.equal(debug.env.HOME, path.join(fixture.root, 'home'));
      }
    } finally {
      if (fixture) await rm(fixture.root, { recursive: true, force: true });
      await rm(repo, { recursive: true, force: true });
    }
  });
}

// Virtual review latency: no sleep, GUI, real credentials or native pass.
const delayedReviewClock = `
let reviewClock = 0; Date.now = () => reviewClock;
global.setTimeout = callback => { reviewClock += 150001; callback(); };
require('node:fs/promises').access = async () => {
  if (reviewClock < 300000) throw new Error('review not complete yet');
};
`;

// Exercise the generated entry, not Code: MainThreadTextEditor may report true
// even when its readonly code editor rejects the edit. Bytes must stay unchanged.
for (const mutates of [false, true]) test(`generated native driver checks readonly bytes independently of edit return value: mutation=${mutates}`, {
  skip: process.platform !== 'darwin',
}, async () => {
  const repo = await realpath(await mkdtemp('/tmp/pi-native-driver-contract-'));
  let fixture;
  try {
    const scripts = path.join(repo, 'scripts/spikes'); const app = path.join(repo, 'Fake Code.app');
    await mkdir(scripts, { recursive: true }); await mkdir(path.join(app, 'Contents/MacOS'), { recursive: true });
    await copyFile(launcher, path.join(scripts, 'resource-report-native.mjs'));
    await writeFile(path.join(app, 'Contents/MacOS/Code'), fakeExecutable, { mode: 0o700 });
    const launch = spawnSync(process.execPath, [path.join(scripts, 'resource-report-native.mjs'), 'f5'], {
      env: { PATH: path.dirname(process.execPath), PI_REPORT_CODE_APP: app }, timeout: 15000, windowsHide: true,
    });
    assert.ifError(launch.error);
    const evidence = path.join(repo, 'dist/goal-eight/wi082/f5');
    fixture = JSON.parse(await readFile(path.join(evidence, 'fixture.json'), 'utf8'));
    const driver = path.join(fixture.root, 'driver'); const apiDir = path.join(driver, 'node_modules/vscode');
    const piDir = path.join(fixture.root, 'extension/node_modules/@earendil-works/pi-coding-agent');
    await mkdir(apiDir, { recursive: true }); await mkdir(piDir, { recursive: true });
    await writeFile(path.join(piDir, 'package.json'), JSON.stringify({ version: '0.86.1' }));
    await writeFile(path.join(apiDir, 'index.js'), `
const path = require('node:path'); let live = false; let prefix = '';
const loaded = 'Prompt template definitions: 1 loaded\\nnative-template\\nskill:native-skill\\nAGENTS.md: unknown\\nSkill bodies in context: unknown\\nExtension files loaded: unknown';
const document = { uri: { scheme: 'pi-vscode-resources' }, getText: () => prefix + (live ? loaded : 'unavailable') };
const editor = { document, edit: async () => { ${mutates ? "prefix = 'MUST_NOT_EDIT';" : ''} return true; } };
exports.version = 'synthetic-host'; exports.Position = class {};
exports.extensions = { getExtension: () => ({ isActive: false, extensionPath: path.join(process.env.PI_REPORT_FIXTURE, 'extension'), packageJSON: { version: '0.0.1' } }) };
exports.workspace = { textDocuments: [document] };
exports.window = { activeTextEditor: editor, showTextDocument: async () => editor };
exports.commands = { executeCommand: async name => { if (name === 'pi-vscode.focusChat') live = true; } };
`);
    await writeFile(path.join(fixture.root, 'finish'), 'synthetic driver review only, not native evidence\n');
    const result = spawnSync(process.execPath, ['--eval', `${mutates ? '' : delayedReviewClock}require(${JSON.stringify(path.join(driver, 'test.cjs'))}).run().catch(e => { console.error(e); process.exitCode = 1; });`], {
      env: { PATH: path.dirname(process.execPath), HOME: path.join(fixture.root, 'home'), PI_REPORT_FIXTURE: fixture.root, PI_REPORT_EVIDENCE: evidence, PI_REPORT_MODE: 'f5' },
      timeout: 15000, encoding: 'utf8', windowsHide: true,
    });
    assert.ifError(result.error); assert.equal(result.status, mutates ? 1 : 0, result.stderr);
    const record = JSON.parse(await readFile(path.join(evidence, 'result.json'), 'utf8'));
    assert.equal(record.result, mutates ? 'failed' : 'passed'); assert.equal(record.readOnly === true, !mutates);
  } finally {
    if (fixture) await rm(fixture.root, { recursive: true, force: true });
    await rm(repo, { recursive: true, force: true });
  }
});
