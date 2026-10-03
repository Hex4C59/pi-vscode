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
