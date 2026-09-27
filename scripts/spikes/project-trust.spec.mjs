import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getEventListeners } from 'node:events';
import test from 'node:test';
import { isolatedFixture, preflight, startIfEligible, withProcess } from './project-trust-lib.mjs';

const local = { scheme: 'file' };
test('host preflight never spawns for absent/multiple/nonlocal/untrusted workspace', () => {
  let starts = 0;
  for (const workspace of [
    { folders: [], trusted: true },
    { folders: [local, local], trusted: true },
    { folders: [{ scheme: 'vscode-remote' }], trusted: true },
    { folders: [local], trusted: false },
  ]) {
    assert.equal(startIfEligible(workspace, () => { starts++; }).allowed, false);
  }
  assert.equal(starts, 0);
  assert.deepEqual(preflight({ folders: [local], trusted: true }), { allowed: true, requiresPiChoice: true });
  startIfEligible({ folders: [local], trusted: true }, decision => {
    starts++;
    assert.equal(decision.requiresPiChoice, true);
    assert.equal(decision.approved, undefined);
  });
  assert.equal(starts, 1);
});

test('isolation allowlist does not inherit credentials or host configuration', async () => {
  let directory;
  await isolatedFixture(async ({ root, env }) => {
    directory = root;
    assert.deepEqual(Object.keys(env).sort(), ['HOME', 'LANG', 'PATH', 'PI_CODING_AGENT_DIR', 'PI_OFFLINE', 'PI_TELEMETRY', 'TEMP', 'TERM', 'TMP', 'TMPDIR', 'USERPROFILE'].sort());
    assert.ok(env.HOME.startsWith(root));
    assert.ok(env.PI_CODING_AGENT_DIR.startsWith(root));
  });
  await assert.rejects(access(directory));
});

for (const mode of ['success', 'timeout', 'failure', 'cancel', 'spawn-error', 'callback-error']) {
  test(`owned process/listeners/fixture cleanup: ${mode}`, async () => {
    let directory;
    let child;
    const controller = new AbortController();
    let cancellation;
    const operation = isolatedFixture(async ({ root, env }) => {
      directory = root;
      const code = mode === 'failure' ? 'process.exit(2)' : mode === 'success'
        ? `process.stdin.once('data', () => console.log(JSON.stringify({ type: 'response', id: '1', success: true, data: 'ok' })));`
        : `process.on('SIGTERM', () => {}); setInterval(() => {}, 1000);`;
      return withProcess(['--eval', code], {
        cwd: mode === 'spawn-error' ? `${root}/missing` : root,
        env, signal: controller.signal, timeoutMs: mode === 'timeout' ? 150 : 3000,
      }, async runtime => {
        child = runtime.child;
        if (mode === 'cancel') cancellation = setTimeout(() => controller.abort(), 150);
        if (mode === 'callback-error') throw new Error('callback failed');
        return runtime.request('get_state');
      });
    });
    try {
      if (mode === 'success') assert.equal(await operation, 'ok');
      else await assert.rejects(operation, mode === 'timeout' ? /timed out/ : mode === 'cancel' ? /cancelled/ : /failed/);
    } finally {
      clearTimeout(cancellation);
    }
    await assert.rejects(access(directory));
    assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
    assert.equal(child.listenerCount('error'), 0);
    assert.equal(child.listenerCount('close'), 0);
    assert.equal(child.stdin.listenerCount('error'), 0);
    if (child.pid) assert.throws(() => process.kill(child.pid, 0), { code: 'ESRCH' });
  });
}

test('pre-cancelled operation never creates a child', async () => {
  const controller = new AbortController();
  controller.abort();
  let called = false;
  await assert.rejects(withProcess([], { signal: controller.signal }, () => { called = true; }));
  assert.equal(called, false);
});

test('registered resource probe verifies the current pinned release without model requests', { timeout: 360000 }, async () => {
  const metadata = JSON.parse(await readFile(new URL('../../node_modules/@earendil-works/pi-coding-agent/package.json', import.meta.url), 'utf8'));
  const env = { PATH: path.dirname(process.execPath), LANG: 'C.UTF-8', TERM: 'dumb' };
  for (const key of ['SystemRoot', 'WINDIR', 'COMSPEC']) if (process.env[key]) env[key] = process.env[key];
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./spike-project-trust.mjs', import.meta.url))], {
    env, encoding: 'utf8', timeout: 300000, maxBuffer: 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.version, metadata.version);
  assert.equal(report.scenarios.length, 6);
  const allow = report.scenarios.find(value => value.choice === '--approve' && value.defaultProjectTrust === 'always');
  const decline = report.scenarios.find(value => value.choice === '--no-approve' && !value.savedTrust);
  assert.ok(allow.startup.includes('fixture-a'));
  assert.equal(decline.startup.includes('fixture-a'), false);
  assert.equal(allow.afterSwitch.includes('fixture-a'), false);
  assert.ok(allow.afterSwitch.includes('fixture-b'));
  assert.ok(decline.observations.every(value => value.contextA || value.contextB));
  for (const scenario of report.scenarios) {
    const approved = scenario.choice === '--approve' || (scenario.choice === 'global-default-baseline' && scenario.defaultProjectTrust === 'always');
    assert.equal(scenario.settings.startup, approved ? 'off' : 'medium');
    assert.equal(scenario.settings.afterSwitch, approved ? 'low' : 'medium');
  }
});
