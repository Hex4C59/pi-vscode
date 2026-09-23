import assert from 'node:assert/strict';
import { networkInterfaces } from 'node:os';
import { readFile, realpath, copyFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { withRpc, dialogLedger } from './compatibility-lib.mjs';
import path from 'node:path';

// Independent worker guard; importing this entry outside the owned fixture fails closed.
const root = process.argv[2];
assert.equal(process.platform, 'linux');
assert.deepEqual(networkInterfaces(), {});
assert.match(root ?? '', /^\/tmp\/pi-compat-[A-Za-z0-9]+$/);
assert.equal(await realpath(root), root);
// unshare --map-root-user must map namespace root to one unprivileged host UID.
const uidMap = (await readFile('/proc/self/uid_map', 'utf8')).trim().split(/\s+/).map(Number);
assert.equal(uidMap.length, 3);
assert.equal(uidMap[0], 0);
assert.ok(uidMap[1] > 0);
assert.equal(uidMap[2], 1);
assert.equal(await realpath(process.cwd()), path.join(root, 'a'));
assert.equal(process.env.HOME, path.join(root, 'home'));
assert.equal(process.env.PI_CODING_AGENT_DIR, path.join(root, 'agent'));
const allowed = ['HOME', 'USERPROFILE', 'PI_CODING_AGENT_DIR', 'PI_OFFLINE', 'PI_TELEMETRY', 'TMPDIR', 'TEMP', 'TMP', 'PATH', 'LANG', 'TERM'];
assert.deepEqual(Object.keys(process.env).sort(), allowed.sort());
assert.equal(process.env.USERPROFILE, path.join(root, 'home'));
for (const key of ['TMPDIR', 'TEMP', 'TMP']) assert.equal(process.env[key], path.join(root, 'tmp'));
assert.equal(process.env.PATH, path.dirname(process.execPath));
assert.equal(process.env.PI_OFFLINE, '1');
assert.equal(process.env.PI_TELEMETRY, '0');
for (const name of ['home', 'agent', 'tmp', 'a', 'b']) assert.equal(await realpath(path.join(root, name)), path.join(root, name));
assert.equal((await readFile('/proc/net/route', 'utf8')).trim().split('\n').length, 1);
assert.ok((await readFile('/proc/net/ipv6_route', 'utf8')).trim().split('\n').filter(Boolean).every(line => /^0{32} 00 0{32} 00 0{32} ffffffff [0-9a-f]{8} [0-9a-f]{8} 00200200\s+lo$/.test(line)));
const manifest = JSON.parse(await readFile(new URL('../../node_modules/@earendil-works/pi-coding-agent/package.json', import.meta.url), 'utf8'));
assert.equal(manifest.version, '0.86.1');
console.log(JSON.stringify({ stage: 'preflight', status: 'passed', version: manifest.version, interfaces: 0, routes: 0 }));
const record = (stage, status, details = {}) => console.log(JSON.stringify({ stage, status, ...details }));
let SessionManager;
try {
  ({ SessionManager } = await import('@earendil-works/pi-coding-agent'));
} catch (error) {
  record('P1-public-root-import', 'blocked', { reason: /native|linux/.test(String(error.message)) ? 'linux-native-dependency-unavailable' : 'public-root-import-failed' });
}
const saved = {};
if (SessionManager) {
  assert.deepEqual(await SessionManager.list(process.cwd()), []);
  record('P1-empty-list', 'passed');
  for (const project of ['a', 'b']) {
    const cwd = path.join(root, project);
    const manager = SessionManager.create(cwd);
    manager.appendMessage({ role: 'user', content: `fixture-${project}`, timestamp: Date.now() });
    manager.appendCustomMessageEntry('fixture', `history-${project}`, true);
    assert.equal(manager.getCwd(), cwd);
    assert.equal((await SessionManager.list(cwd)).length, 0);
    manager.appendMessage({ role: 'assistant', content: [{ type: 'text', text: `synthetic-assistant-${project}` }],
      api: 'fixture-synthetic-api', provider: 'fixture-synthetic', model: 'fixed', stopReason: 'stop', timestamp: Date.now(),
      usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } } });
    const listed = await SessionManager.list(cwd);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].cwd, cwd);
    assert.equal(listed[0].id, manager.getSessionId());
    saved[project] = listed[0];
    record(`P1-create-${project}`, 'passed', { listed: 1, cwdMatches: true, fixture: 'synthetic-public-API-not-inference' });
  }
  const a = await SessionManager.list(path.join(root, 'a'));
  assert.equal(a.length, 1);
  assert.ok(!a.some(session => session.id === saved.b.id));
  record('P1-project-filter', 'passed', { excludesB: true });
}
const cli = fileURLToPath(new URL('../../node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js', import.meta.url));
const base = [cli, '--mode', 'rpc', '--no-session', '--no-extensions', '--no-skills', '--no-prompt-templates', '--no-themes', '--tools', 'read'];
let generation = 0;
const routingLedger = dialogLedger();
let obsoleteDialog;
const run = (extra, body, toolsExpected = false) => {
  const id = `g${++generation}`;
  return withRpc([...base, ...extra], {
    cwd: path.join(root, 'a'), env: process.env, generation: id,
    onExit: exit => record('rpc-exit', 'observed', { generation: id, ...exit }),
  }, async rpc => {
    assert.equal((await rpc.request('get_state')).success, true);
    const result = await body(rpc, id);
    if (!toolsExpected) assert.ok(!rpc.events.some(event => ['agent_start', 'tool_execution_start'].includes(event.type)), 'unexpected-agent-or-tool-execution');
    return result;
  });
};
const extensionDir = path.join(root, 'a', '.pi', 'extensions');
await mkdir(extensionDir, { recursive: true });
const extension = path.join(extensionDir, 'fixture.mjs');
await copyFile(new URL('./compatibility-extension.mjs', import.meta.url), extension);
try {
  await run([], async rpc => {
    const commands = await rpc.request('get_commands');
    assert.ok(!commands.data.commands.some(c => c.name.startsWith('fixture-')));
    await assert.rejects(access(path.join(root, 'a', 'initialized')));
    record('P2-disabled', 'passed');
    if (saved.a) {
      const restored = await rpc.request('switch_session', { sessionPath: saved.a.path });
      assert.equal(restored.success, true);
      const messages = (await rpc.request('get_messages')).data.messages;
      assert.equal(messages.filter(m => m.role === 'user' && m.content === 'fixture-a').length, 1);
      assert.equal(messages.filter(m => m.role === 'assistant' && m.content.some(c => c.text === 'synthetic-assistant-a')).length, 1);
      assert.ok(!JSON.stringify(messages).includes('synthetic-assistant-b'));
      record('P1-saved-restore', 'passed', { messageCount: messages.length, replay: false, fixture: 'synthetic-public-API' });
    }
    const missing = await rpc.request('switch_session', { sessionPath: path.join(root, 'unavailable.jsonl') });
    record('P1-unavailable-restore', 'observed', { success: missing.success, messageCount: (await rpc.request('get_messages')).data.messages.length });
  });
  await run(['-e', extension], async (rpc, id) => {
    await access(path.join(root, 'a', 'initialized'));
    const commands = await rpc.request('get_commands');
    assert.ok(commands.data.commands.some(c => c.name === 'fixture-dialog'));
    record('P2-explicit-loading', 'passed');
    assert.equal((await rpc.request('prompt', { message: '/fixture-tools' })).success, true);
    await rpc.wait(e => e.method === 'notify' && e.message === 'fixture:tool-excluded');
    record('P2-custom-tool-allowlist', 'passed', { enabled: false });
    const ledger = dialogLedger();
    let token = 0;
    const dialog = async (method, variant, action) => {
      const tag = `${id}-${++token}`;
      const start = rpc.events.length;
      const request = rpc.request('prompt', { message: `/fixture-dialog ${method} ${variant} ${tag}` });
      // Observe rejection immediately even while waiting for the UI request.
      request.catch(() => {});
      const ui = await rpc.wait(e => rpc.events.indexOf(e) >= start && e.type === 'extension_ui_request' && e.method === method);
      if (action) await action(ui);
      const result = await rpc.wait(e => e.method === 'notify' && e.message?.startsWith(`fixture:${tag}:`));
      assert.equal((await request).success, true);
      const continued = rpc.events.find(e => e.message === `continued:${tag}`);
      assert.ok(continued);
      assert.ok(rpc.events.indexOf(ui) < rpc.events.indexOf(continued));
      assert.ok(rpc.events.indexOf(continued) < rpc.events.indexOf(result));
      record(`P3-${method}-${variant}`, 'observed', { generation: id, requestId: ui.id, result: result.message.split(':').at(-1), events: rpc.events.slice(start).map(e => e.method ?? e.type) });
      return { ui, result };
    };
    for (const method of ['select', 'confirm', 'input', 'editor']) {
      const done = await dialog(method, 'complete', ui => rpc.send({ type: 'extension_ui_response', id: ui.id, value: 'fixture-answer', confirmed: true }));
      assert.ok(done.result.message.endsWith(method === 'confirm' ? ':true' : ':answer'));
      const cancelled = await dialog(method, 'cancel', ui => rpc.send({ type: 'extension_ui_response', id: ui.id, cancelled: true }));
      assert.ok(cancelled.result.message.endsWith(method === 'confirm' ? ':false' : ':cancelled'));
      if (method !== 'editor') {
        const timed = await dialog(method, 'timeout');
        assert.equal(timed.ui.timeout, 50);
        assert.ok(timed.result.message.endsWith(method === 'confirm' ? ':false' : ':cancelled'));
      }
      else record('P3-editor-timeout', 'blocked', { reason: 'editor-public-signature-has-no-timeout-options' });
      await dialog(method, 'late', ui => {
        rpc.send({ type: 'extension_ui_response', id: cancelled.ui.id, value: 'obsolete', confirmed: true });
        rpc.send({ type: 'extension_ui_response', id: ui.id, value: 'fixture-answer', confirmed: true });
      }).then(result => assert.ok(result.result.message.endsWith(method === 'confirm' ? ':true' : ':answer')));
    }
    const stopOrder = [];
    const stopped = await dialog('confirm', 'cancel-before-abort', async ui => {
      ledger.open(id, ui.id);
      assert.equal(ledger.invalidate(id, ui.id), true);
      stopOrder.push('client-invalidated');
      rpc.send({ type: 'extension_ui_response', id: ui.id, cancelled: true });
      stopOrder.push('cancelled-sent');
      assert.equal((await rpc.request('clear_queue')).success, true);
      stopOrder.push('clear-queue-ack');
      assert.equal((await rpc.request('abort')).success, true);
      stopOrder.push('abort-ack');
    });
    assert.ok(stopped.result.message.endsWith(':false'));
    const stopToken = stopped.result.message.split(':')[1];
    assert.ok(rpc.events.findIndex(e => e.message === `continued:${stopToken}`) < rpc.events.indexOf(stopped.result));
    const replacement = await dialog('confirm', 'replacement', ui => {
      assert.equal(ledger.take(id, stopped.ui.id), false);
      // Deliberate protocol fault injection bypasses the client ledger.
      rpc.send({ type: 'extension_ui_response', id: stopped.ui.id, confirmed: true });
      rpc.send({ type: 'extension_ui_response', id: ui.id, confirmed: false });
    });
    assert.ok(replacement.result.message.endsWith(':false'));
    assert.equal(rpc.events.filter(e => e.message?.startsWith(`fixture:${stopToken}:`)).length, 1);
    record('P3-cancel-before-abort', 'passed', { order: stopOrder, continuedAfterCancel: true, oldCompletionCount: 1, replacement: false });
    await dialog('confirm', 'abort', async ui => {
      assert.equal((await rpc.request('clear_queue')).success, true);
      assert.equal((await rpc.request('abort')).success, true);
      rpc.send({ type: 'extension_ui_response', id: ui.id, confirmed: true });
    });
    // Disconnect while an extension dialog is pending; process closure is separately observed.
    const start = rpc.events.length;
    rpc.request('prompt', { message: '/fixture-dialog input disconnect final' }).catch(() => {});
    await rpc.wait(e => rpc.events.indexOf(e) >= start && e.method === 'input');
    const pendingUi = rpc.events.slice(start).find(e => e.method === 'input');
    obsoleteDialog = { generation: id, id: pendingUi.id };
    routingLedger.open(id, pendingUi.id);
    assert.equal(routingLedger.invalidate(id, pendingUi.id), true);
    const eof = await rpc.disconnectAndObserve();
    record('P3-disconnect', 'observed', { generation: id, ...eof,
      completionObserved: rpc.events.some(e => e.message?.startsWith('fixture:final:')),
      reason: eof.natural ? 'natural-exit-before-owner-shutdown' : 'no-natural-exit-within-5000ms;owner-cleanup-next' });
  });
  await run(['-e', extension], async (rpc, id) => {
    const request = rpc.request('prompt', { message: '/fixture-dialog confirm cross-generation fresh' });
    request.catch(() => {});
    const ui = await rpc.wait(e => e.method === 'confirm');
    routingLedger.open(id, ui.id);
    // Reuse the NEW request ID with the OLD generation: safety cannot rely on UUID uniqueness.
    assert.equal(routingLedger.take(obsoleteDialog.generation, ui.id), false);
    assert.equal(routingLedger.take(obsoleteDialog.generation, obsoleteDialog.id), false);
    assert.equal(routingLedger.take(id, ui.id), true);
    rpc.send({ type: 'extension_ui_response', id: ui.id, confirmed: false });
    await rpc.wait(e => e.message === 'fixture:fresh:false');
    assert.equal((await request).success, true);
    assert.equal(rpc.events.filter(e => e.message?.startsWith('fixture:fresh:')).length, 1);
    record('P3-cross-generation-routing', 'passed', { oldGeneration: obsoleteDialog.generation, newGeneration: id,
      reusedCurrentIdWithOldGenerationRejected: true, evidence: 'probe-client-ledger-plus-real-new-dialog;not-upstream-generation-support' });
  });
  for (const tool of ['write', 'fixture_write']) {
    await run(['-e', extension, '--tools', tool, '--provider', 'fixture-synthetic', '--model', 'fixed'], async rpc => {
      for (const allow of [false, true]) {
        const start = rpc.events.length;
        const request = await rpc.request('prompt', { message: tool === 'write' ? 'synthetic builtin' : 'synthetic custom' });
        assert.equal(request.success, true);
        const ui = await rpc.wait(e => rpc.events.indexOf(e) >= start && e.method === 'confirm');
        assert.equal(ui.title, 'fixture-tool');
        rpc.send({ type: 'extension_ui_response', id: ui.id, confirmed: allow });
        await rpc.wait(e => rpc.events.indexOf(e) >= start && e.type === 'agent_end');
        await rpc.wait(e => rpc.events.indexOf(e) >= start && e.type === 'agent_settled');
        const events = rpc.events.slice(start);
        assert.ok(events.some(e => e.message === `fixture:hook:${tool}`));
        assert.ok(events.some(e => e.message === `fixture:hook:${allow ? 'allowed' : 'denied'}`));
        const execution = events.find(e => e.type === 'tool_execution_end');
        assert.ok(execution);
        assert.equal(execution.isError, !allow);
        const effect = path.join(root, 'a', tool === 'write' ? 'builtin-effect' : 'tool-effect');
        if (allow) assert.equal(await readFile(effect, 'utf8'), tool === 'write' ? 'synthetic-write-marker' : 'fixture');
        else await assert.rejects(access(effect), { code: 'ENOENT' });
        assert.ok(!events.some(e => e.type === 'message_end' && ['error', 'aborted'].includes(e.message?.stopReason)));
        record(`P2-${tool}-${allow ? 'allow' : 'deny'}`, 'passed', { provider: 'synthetic-fixed-not-real-inference',
          effect: allow ? 'exact-marker' : 'absent', events: events.map(e => e.method ?? e.type) });
      }
    }, true);
  }
} catch (error) {
  record('rpc-scenario', 'failed', { reason: /rpc-[a-z-]+/.exec(String(error.message))?.[0] ?? 'probe-assertion-failed' });
  process.exitCode = 1;
}
