// Explicit T014-01 boundary probe using the current vector schema; not collected by npm test. No network or real inference.
import assert from 'node:assert/strict';
import { networkInterfaces } from 'node:os';
import { readFile, writeFile, realpath, copyFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { withFixture, runChild } from './compatibility-lib.mjs';
const here = fileURLToPath(import.meta.url);
const repo = path.resolve(path.dirname(here), '../..');
const record = (stage, detail = {}) => console.log(JSON.stringify({ stage, ...detail }));
async function guard() {
  assert.equal(process.platform, 'linux');
  const map = (await readFile('/proc/self/uid_map', 'utf8')).trim().split(/\s+/).map(Number);
  assert.deepEqual(map, [0, 65534, 1]);
  assert.deepEqual(networkInterfaces(), {});
  assert.equal((await readFile('/proc/net/route', 'utf8')).trim().split('\n').length, 1);
  assert.ok((await readFile('/proc/net/ipv6_route', 'utf8')).trim().split('\n').filter(Boolean).every(line => /^0{32} 00 0{32} 00 0{32} ffffffff [0-9a-f]{8} [0-9a-f]{8} 00200200\s+lo$/.test(line)));
}
async function worker(root) {
  await guard();
  assert.match(root, /^\/tmp\/pi-compat-[A-Za-z0-9]+$/); assert.equal(await realpath(root), root);
  assert.equal(process.cwd(), path.join(root, 'a'));
  const allowed = ['HOME', 'USERPROFILE', 'PI_CODING_AGENT_DIR', 'PI_OFFLINE', 'PI_TELEMETRY', 'TMPDIR', 'TEMP', 'TMP', 'PATH', 'LANG', 'TERM'];
  assert.deepEqual(Object.keys(process.env).sort(), allowed.sort());
  for (const key of ['HOME', 'USERPROFILE']) assert.equal(process.env[key], path.join(root, 'home'));
  assert.equal(process.env.PI_CODING_AGENT_DIR, path.join(root, 'agent'));
  for (const key of ['TMPDIR', 'TEMP', 'TMP']) assert.equal(process.env[key], path.join(root, 'tmp'));
  assert.equal(process.env.PI_OFFLINE, '1'); assert.equal(process.env.PI_TELEMETRY, '0');
  assert.equal(process.env.PATH, path.dirname(process.execPath));
  const pkg = JSON.parse(await readFile(path.join(repo, 'node_modules/@earendil-works/pi-coding-agent/package.json'), 'utf8'));
  assert.equal(pkg.version, '0.86.1');
  record('preflight', { version: pkg.version, node: process.version, hostUid: 65534, interfaces: 0, routes: 0 });
  const extension = path.join(root, 'provider.mjs');
  await copyFile(path.join(repo, 'scripts/spikes/attachment-provider.mjs'), extension);
  const prompts = path.join(root, 'agent/prompts'); await mkdir(prompts);
  await writeFile(path.join(prompts, 'literal.md'), 'TEMPLATE_EXPANDED_SENTINEL');
  await writeFile(path.join(root, 'agent/settings.json'), JSON.stringify({ defaultProvider: 'attachment-fixture', defaultModel: 'fixed', compaction: { enabled: false }, retry: { enabled: false } }));
  const require = createRequire(import.meta.url);
  const { createPiRpcRuntime } = require(path.join(repo, 'dist/attachment-verification.cjs'));
  let child; let exit; const frames = [];
  const runtime = createPiRpcRuntime({
    startupModel: () => 'attachment-fixture/fixed',
    cliPath: () => path.join(repo, 'node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js'),
    spawn(command, args, options) {
      // Only narrow process setup is substituted; encoder, prepared token, write/ACK and reader are production.
      child = spawn(command, [...args, '--no-skills', '--no-themes', '-e', extension], options);
      exit = new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
      const write = child.stdin.write.bind(child.stdin);
      child.stdin.write = function (frame, ...rest) {
        const message = JSON.parse(frame);
        if (message.type === 'prompt') frames.push(frame);
        return write(frame, ...rest);
      };
      return child;
    },
  });
  let settled; let failure;
  const unsubscribe = runtime.subscribe(event => {
    if (event.kind === 'agent_settled') settled?.();
    if (event.kind === 'runtime_error' || event.kind === 'stream_error') failure = event.kind;
  });
  try {
    assert.equal((await runtime.start({ cwd: process.cwd(), projectTrust: 'no-approve' })).ok, true);
    // Positive control proves template expansion is enabled, not merely disabled by flags.
    let controlTimer;
    const controlDone = new Promise((resolve, reject) => { settled = resolve; controlTimer = setTimeout(() => reject(new Error('control-timeout')), 15000); });
    controlDone.catch(() => {});
    try {
      assert.equal((await runtime.preparePrompt({ kind: 'plain', body: '/literal' }, runtime.getSession()).send(() => {})).delivery, 'rpc-accepted');
      await controlDone;
      const captured = JSON.parse(await readFile(path.join(process.cwd(), 'captured-input.json'), 'utf8'));
      assert.ok(JSON.stringify(captured.content).includes('TEMPLATE_EXPANDED_SENTINEL'));
      record('template-positive-control', { status: 'passed' });
    } finally { clearTimeout(controlTimer); settled = undefined; }
    for (const [name, text] of [['unicode', '😀'.repeat(65536)], ['control', '\u0000'.repeat(262144)], ['quoting', ('"\\\n/skill:literal ${literal} ').repeat(10000).slice(0, 262144)]]) {
      const input = { kind: 'enriched', body: '/literal /skill:literal ${literal} "\\\n', attachments: [{ path: 'src/字面.ts', kind: 'file', unsaved: true, text }] };
      const expected = structuredClone(input);
      const prepared = runtime.preparePrompt(input, runtime.getSession());
      input.attachments[0].text = 'MUTATED_AFTER_PREPARATION'; input.body = 'MUTATED_BODY';
      let timer;
      const completion = new Promise((resolve, reject) => { settled = resolve; timer = setTimeout(() => reject(new Error('settlement-timeout')), 15000); });
      completion.catch(() => {});
      try {
        let attempts = 0;
        assert.equal((await prepared.send(() => attempts++)).delivery, 'rpc-accepted');
        await completion; assert.equal(failure, undefined); assert.equal(attempts, 1);
        assert.equal((await prepared.send(() => attempts++)).delivery, 'not-sent'); assert.equal(attempts, 1);
        const frame = frames.at(-1); const decoded = JSON.parse(frame);
        assert.equal(frame.split('\n').length, 2); assert.ok(Buffer.byteLength(frame) <= 8388608);
        const captured = JSON.parse(await readFile(path.join(process.cwd(), 'captured-input.json'), 'utf8'));
        assert.equal(captured.role, 'user');
        const actual = typeof captured.content === 'string' ? captured.content : captured.content.filter(c => c.type === 'text').map(c => c.text).join('');
        assert.equal(actual, decoded.message);
        assert.deepEqual(JSON.parse(actual.slice(actual.indexOf('\n') + 1)), { body: expected.body, attachments: expected.attachments });
        assert.ok(!actual.includes('TEMPLATE_EXPANDED_SENTINEL'));
        record(name, { status: 'passed', textBytes: Buffer.byteLength(text), frameBytes: Buffer.byteLength(frame), immutable: true, providerInputExact: true, attempts });
      } finally { clearTimeout(timer); settled = undefined; }
    }
    assert.throws(() => runtime.preparePrompt({ kind: 'enriched', body: 'task', attachments: [{ path: 'a.ts', kind: 'file', unsaved: false, text: 'a'.repeat(262145) }] }, runtime.getSession()));
    assert.equal(frames.length, 4); record('oversize', { status: 'passed', additionalWrites: 0 });
  } finally {
    unsubscribe(); await runtime.stop();
    if (exit) {
      let timer;
      try {
        const observed = await Promise.race([exit, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('close-unconfirmed')), 1000); })]);
        assert.ok(child.exitCode !== null || child.signalCode !== null); record('rpc-close', observed);
      } finally { clearTimeout(timer); }
    }
  }
}
try {
  if (process.argv[2] === '--build') {
    const { build } = await import('esbuild');
    await build({ entryPoints: [path.join(repo, 'src/adapter/pi-rpc-runtime.ts')], bundle: true, platform: 'node', format: 'cjs', target: 'node22', outfile: path.join(repo, 'dist/attachment-verification.cjs') });
    record('production-adapter-bundle', { status: 'built' });
  } else {
    await guard();
    if (process.argv[2]) await worker(process.argv[2]);
    else {
      await withFixture(async fixture => {
        const result = await runChild([here, fixture.root], { ...fixture, cwd: path.join(fixture.root, 'a'), timeoutMs: 60000 });
        process.stdout.write(result.stdout); record('worker-close', { code: result.code, signal: result.signal });
      });
      record('cleanup', { status: 'passed' });
    }
  }
} catch {
  // Do not echo assertion operands, captured input, runtime stderr or environment.
  record('attachment-probe', { status: 'failed' }); process.exitCode = 1;
}
