import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import { withFixture, runChild, withRpc } from './compatibility-lib.mjs';

test('dialog ledger rejects invalidated and cross-generation answers even for reused IDs', async () => {
  const { dialogLedger } = await import('./compatibility-lib.mjs');
  const ledger = dialogLedger();
  ledger.open('g1', 'same');
  assert.equal(ledger.invalidate('g1', 'same'), true);
  assert.equal(ledger.take('g1', 'same'), false);
  ledger.open('g2', 'same');
  assert.equal(ledger.take('g1', 'same'), false);
  assert.equal(ledger.take('g2', 'same'), true);
  assert.equal(ledger.take('g2', 'same'), false);
});

test('RPC observes natural EOF before cleanup and labels a bounded fallback separately', async () => {
  await withFixture(async fixture => {
    for (const natural of [true, false]) {
      let exit;
      const code = `process.stdin.resume(); ${natural ? '' : 'setInterval(() => {}, 1000);'} console.log(JSON.stringify({type:'ready'}));`;
      await withRpc(['-e', code], { ...fixture, cwd: fixture.root, generation: 'eof', onExit: value => { exit = value; } }, async rpc => {
        await rpc.wait(e => e.type === 'ready');
        const result = await rpc.disconnectAndObserve(100);
        assert.equal(result.natural, natural);
        if (natural) assert.equal(result.code, 0);
      });
      assert.equal(exit.ownerShutdown, !natural);
    }
    await assert.rejects(withRpc(['-e', `process.stdin.resume(); process.stdin.on('end', () => process.exit(7)); console.log(JSON.stringify({type:'ready'}));`],
      { ...fixture, cwd: fixture.root, generation: 'bad-eof' }, async rpc => {
        await rpc.wait(e => e.type === 'ready');
        await rpc.disconnectAndObserve(500);
      }), /rpc-exit:7/);
  });
});

test('compatibility helper cleans owned fixture after nonzero child exit', async () => {
  let root;
  await assert.rejects(withFixture(async fixture => {
    root = fixture.root;
    assert.equal(fixture.env.OPENAI_API_KEY, undefined);
    await runChild(['-e', 'process.exit(7)'], { ...fixture, cwd: root });
  }), /child-exit:7/);
  await assert.rejects(access(root), { code: 'ENOENT' });
});

test('RPC correlates generation IDs and ignores stale responses', async () => {
  await withFixture(async fixture => {
    const code = `process.stdin.on('data', chunk => { const q = JSON.parse(chunk); console.log(JSON.stringify({type:'response',id:'old:1',command:q.type,success:true,data:'stale'})); console.log(JSON.stringify({type:'response',id:q.id,command:q.type,success:true,data:'fresh'})); });`;
    await withRpc(['-e', code], { ...fixture, cwd: fixture.root, generation: 'new' }, async rpc => {
      assert.equal((await rpc.request('get_state')).data, 'fresh');
    });
  });
});

test('RPC timeout, malformed framing, output budget and callback failures close children', async () => {
  await withFixture(async fixture => {
    // Keep only the dedicated timeout probe on the short deadline. Protocol probes wait for child readiness or use a bounded scheduling allowance; these test overrides do not change helper or product deadlines.
    const probes = [
      {
        code: 'setInterval(() => {}, 1000)',
        expected: /rpc-request-timeout/,
        requestMs: 100,
        action: rpc => rpc.request('get_state'),
      },
      {
        code: `console.log(JSON.stringify({type:'ready'})); process.stdin.on('data', () => console.log('invalid')); setInterval(() => {}, 1000);`,
        expected: /rpc-invalid-json/,
        requestMs: 1000,
        action: async rpc => {
          await rpc.wait(e => e.type === 'ready');
          return rpc.request('get_state');
        },
      },
      {
        code: `console.log(JSON.stringify({type:'ready'})); process.stdin.on('data', () => console.log('x'.repeat(100))); setInterval(() => {}, 1000);`,
        expected: /rpc-log-budget/,
        requestMs: 1000,
        action: async rpc => {
          await rpc.wait(e => e.type === 'ready');
          return rpc.request('get_state');
        },
      },
      {
        code: 'setInterval(() => {}, 1000)',
        expected: /callback-failure/,
        requestMs: 1000,
        action: () => { throw new Error('callback-failure'); },
      },
    ];
    for (const { code, expected, requestMs, action } of probes) {
      let exited = false;
      await assert.rejects(withRpc(['-e', code], { ...fixture, cwd: fixture.root, generation: 'test', requestMs, logLimit: 32, onExit: () => { exited = true; } }, action), expected);
      assert.equal(exited, true);
    }
  });
});

test('RPC rejects nonzero exit even when callback itself succeeds', async () => {
  await withFixture(async fixture => {
    await assert.rejects(withRpc(['-e', 'process.exit(7)'], { ...fixture, cwd: fixture.root, generation: 'exit' },
      // Keep the callback pending until withRpc's failure race observes the natural nonzero close; its bounded scenario deadline remains the safety net.
      () => new Promise(() => {})), /rpc-exit:7/);
  });
});

test('RPC owner shutdown accepts its termination signal but rejects nonzero shutdown code', async () => {
  await withFixture(async fixture => {
    const options = { ...fixture, cwd: fixture.root, generation: 'shutdown' };
    let exit;
    await withRpc(['-e', 'console.log(JSON.stringify({type:"ready"})); setInterval(() => {}, 1000)'],
      { ...options, onExit: value => { exit = value; } }, rpc => rpc.wait(e => e.type === 'ready'));
    assert.equal(exit.ownerShutdown, true);
    assert.ok(exit.code === 0 || ['SIGTERM', 'SIGKILL'].includes(exit.signal));
    // Windows forcibly terminates SIGTERM targets, so only POSIX can test a handler exit code.
    if (process.platform !== 'win32') {
      await assert.rejects(withRpc(['-e', 'process.on("SIGTERM", () => process.exit(7)); console.log(JSON.stringify({type:"ready"})); setInterval(() => {}, 1000)'],
        options, rpc => rpc.wait(e => e.type === 'ready')), /rpc-exit:7/);
    }
  });
});

test('child timeout preserves bounded diagnostic stdout without stderr', async () => {
  await withFixture(async fixture => {
    await assert.rejects(runChild(['-e', 'console.log("fixture-marker"); console.error("private"); setInterval(() => {}, 1000)'],
      // This checks diagnostic retention, not a 250 ms startup SLA; the short timeout remains covered below.
      { ...fixture, cwd: fixture.root, timeoutMs: 1000, logLimit: 128 }), error => {
      assert.match(error.message, /child-timeout/);
      assert.equal(error.stdout, 'fixture-marker\n');
      return true;
    });
  });
});

test('compatibility child bounds time and diagnostics and preserves empty output', async () => {
  await withFixture(async fixture => {
    // Success and log-budget probes allow bounded child startup; retain a short override for the actual timeout assertion.
    const startupOptions = { ...fixture, cwd: fixture.root, timeoutMs: 1000, logLimit: 32 };
    const timeoutOptions = { ...startupOptions, timeoutMs: 100 };
    assert.equal((await runChild(['-e', ''], startupOptions)).stdout, '');
    await assert.rejects(runChild(['-e', 'setInterval(() => {}, 1000)'], timeoutOptions), /child-timeout/);
    await assert.rejects(runChild(['-e', 'process.stdout.write("x".repeat(100))'], startupOptions), /log-budget/);
  });
});
