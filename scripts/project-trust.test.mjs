import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
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
