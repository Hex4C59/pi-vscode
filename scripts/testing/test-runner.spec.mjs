import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { cleanTestOutput, discoverTests, executeTests, runTests } from './test-runner-lib.mjs';

const passing = "import test from 'node:test'; test('fixture passes', () => {});";
const libraryUrl = new URL('./test-runner-lib.mjs', import.meta.url).href;

function fixture(t, files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pi runner 空间 '));
  t.after(() => fs.promises.rm(root, { recursive: true, force: true }));
  for (const [name, body] of Object.entries(files)) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  }
  return root;
}

function relative(root, files) {
  return files.map((file) => path.relative(root, file).split(path.sep).join('/'));
}

const minimal = {
  'src/extension/tests/basic.spec.ts': passing,
  'scripts/basic.spec.mjs': passing,
};

test('runner discovery is recursive, sorted and exact across owners and scripts', (t) => {
  const included = [
    'src/webview/tests/nested/z.spec.ts', 'src/adapter/tests/a.spec.ts',
    'src/extension/draft/tests/a.spec.ts', 'src/adapter/sessions/tests/a.spec.ts',
    'src/extension/nested/module/tests/deep/a.spec.ts',
    'src/extension/tests/nested/a.spec.ts', 'scripts/nested/z.spec.mjs', 'scripts/a.spec.mjs',
  ];
  const excluded = [
    'src/extension/outside.spec.ts', 'src/extension/draft/no.spec.ts', 'src/other/tests/no.spec.ts',
    'src/tests/no.spec.ts', 'src/extension/tests/harness.ts',
    'src/extension/draft/tests/harness.ts', 'src/adapter/sessions/tests/no.e2e.ts',
    'src/extension/fixtures/tests/no.spec.ts', 'src/adapter/sessions/expected/tests/no.spec.ts',
    'src/extension/tests/old.test.ts', 'src/extension/tests/x.e2e.ts',
    'src/extension/tests/x.expected.e2e.ts', 'src/extension/tests/x.snapshot.ts',
    'src/extension/tests/x.bench.ts', 'src/extension/tests/x.perf.ts',
    'src/extension/tests/fixtures/no.spec.ts', 'src/extension/tests/nested/expected/no.spec.ts',
    'scripts/harness.mjs', 'scripts/old.test.mjs', 'scripts/x.spec.ts',
    'scripts/fixtures/no.spec.mjs', 'scripts/nested/expected/no.spec.mjs',
  ];
  const root = fixture(t, Object.fromEntries([...included, ...excluded].map((name) => [name, ''])));
  const inventory = discoverTests(root);
  assert.deepEqual(relative(root, inventory.app), included.filter((name) => name.startsWith('src/')).sort());
  assert.deepEqual(relative(root, inventory.scripts), included.filter((name) => name.startsWith('scripts/')).sort());
});

test('runner ignores linked directories including linked owners and script roots', (t) => {
  const root = fixture(t, minimal);
  const outside = fixture(t, { 'tests/no.spec.ts': '', 'no.spec.mjs': '' });
  fs.symlinkSync(outside, path.join(root, 'src', 'linked'), 'junction');
  fs.symlinkSync(outside, path.join(root, 'src', 'extension', 'linked'), 'junction');
  fs.symlinkSync(outside, path.join(root, 'scripts', 'linked'), 'junction');
  assert.deepEqual(relative(root, discoverTests(root).app), ['src/extension/tests/basic.spec.ts']);
  assert.deepEqual(relative(root, discoverTests(root).scripts), ['scripts/basic.spec.mjs']);
  const other = fixture(t, { 'src/extension/tests/basic.spec.ts': passing });
  fs.symlinkSync(outside, path.join(other, 'scripts'), 'junction');
  assert.deepEqual(discoverTests(other).scripts, []);
});

test('runner library import has no discovery, cleanup or execution side effects', (t) => {
  const root = fixture(t, { 'dist/tests/sentinel': 'keep' });
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', `await import(${JSON.stringify(libraryUrl)});`], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
  assert.equal(fs.readFileSync(path.join(root, 'dist/tests/sentinel'), 'utf8'), 'keep');
});

for (const [name, files, message] of [
  ['application', { 'scripts/basic.spec.mjs': passing }, /Application test inventory is empty/],
  ['script', { 'src/extension/tests/basic.spec.ts': passing }, /Script test inventory is empty/],
]) {
  test(`runner rejects empty ${name} inventory before cleanup or launch`, async (t) => {
    const root = fixture(t, { ...files, 'dist/tests/sentinel': 'keep' });
    await assert.rejects(runTests(root, { spawn: () => assert.fail('must not launch') }), message);
    assert.equal(fs.readFileSync(path.join(root, 'dist/tests/sentinel'), 'utf8'), 'keep');
  });
}

test('runner cleans stale tests only, builds same basenames separately and executes exact inventory', async (t) => {
  const root = fixture(t, {
    ...minimal,
    'src/adapter/tests/basic.spec.ts': passing,
    'src/adapter/sessions/tests/basic.spec.ts': passing,
    'src/extension/draft/tests/basic.spec.ts': passing,
    'src/webview/tests/nested/basic.spec.ts': passing,
    'src/extension/tests/harness.ts': 'export const value = 42;',
    'src/extension/tests/import.spec.ts': "import { value } from './harness'; if (value !== 42) throw Error('helper failed');",
    'scripts/nested/basic.spec.mjs': passing,
    'dist/tests/stale.spec.js': "throw Error('stale ran');",
    'dist/extension.js': 'production bundle',
    'dist/approval-gate.mjs': 'approval bundle',
  });
  let launched;
  const result = await runTests(root, { stdio: 'pipe', spawn: (command, args, options) => {
    launched = { command, args, options };
    return spawnSync(command, args, options);
  } });
  assert.deepEqual(relative(root, result.built), [
    'dist/tests/adapter/sessions/tests/basic.spec.js', 'dist/tests/adapter/tests/basic.spec.js',
    'dist/tests/extension/draft/tests/basic.spec.js', 'dist/tests/extension/tests/basic.spec.js',
    'dist/tests/extension/tests/import.spec.js', 'dist/tests/webview/tests/nested/basic.spec.js',
  ]);
  for (const file of result.built) assert.ok(fs.existsSync(file));
  assert.equal(fs.existsSync(path.join(root, 'dist/tests/stale.spec.js')), false, JSON.stringify(fs.readdirSync(path.join(root, 'dist/tests'), { recursive: true })));
  assert.equal(fs.readFileSync(path.join(root, 'dist/extension.js'), 'utf8'), 'production bundle');
  assert.equal(fs.readFileSync(path.join(root, 'dist/approval-gate.mjs'), 'utf8'), 'approval bundle');
  assert.equal(launched.command, process.execPath);
  assert.deepEqual(launched.args, ['--test', ...result.built, ...result.scripts]);
  assert.equal(launched.options.shell, false);
  assert.equal(launched.options.cwd, root);
});

test('runner refuses linked output parents and linked test outputs without deleting targets', async (t) => {
  for (const link of ['dist', 'dist/tests']) {
    const root = fixture(t);
    const outside = fixture(t, { sentinel: 'keep' });
    fs.mkdirSync(path.dirname(path.join(root, link)), { recursive: true });
    fs.symlinkSync(outside, path.join(root, link), 'junction');
    await assert.rejects(cleanTestOutput(root), /unsafe test output/);
    assert.equal(fs.readFileSync(path.join(outside, 'sentinel'), 'utf8'), 'keep');
  }
});

test('runner fails real esbuild errors without launching tests', async (t) => {
  const root = fixture(t, { ...minimal, 'src/extension/draft/tests/broken.spec.ts': 'const broken = ;' });
  await assert.rejects(runTests(root, { spawn: () => assert.fail('must not launch') }), /Build failed/);
});

test('runner fails real node test assertion failures', async (t) => {
  const root = fixture(t, {
    ...minimal,
    'scripts/fail.spec.mjs': "import test from 'node:test'; test('fails', () => { throw Error('intentional failure'); });",
  });
  await assert.rejects(runTests(root, { stdio: 'pipe' }), /exit code 1/);
});

test('runner fails real launch errors and reports nonzero or signalled exits', (t) => {
  const root = fixture(t);
  assert.throws(() => executeTests(path.join(root, 'missing'), ['missing.spec.mjs'], { stdio: 'pipe' }), /launch failed/);
  assert.throws(() => executeTests(root, ['x'], { spawn: () => ({ status: 2, signal: null }) }), /exit code 2/);
  assert.throws(() => executeTests(root, ['x'], { spawn: () => ({ status: null, signal: 'SIGTERM' }) }), /signal SIGTERM/);
  assert.throws(() => executeTests(root, ['x'], { spawn: () => { throw Error('synchronous spawn failure'); } }), /synchronous spawn failure/);
  assert.throws(() => executeTests(root, []), /empty test inventory/);
});

test('runner CLI resolves its root from its URL with spaces, Unicode and non-root cwd', (t) => {
  const runnerSource = fs.readFileSync(fileURLToPath(new URL('./run-tests.mjs', import.meta.url)), 'utf8');
  // Point only the copied entry's library import at the real library; its root calculation is unchanged.
  const root = fixture(t, {
    ...minimal,
    'scripts/testing/run-tests.mjs': runnerSource.replace("'./test-runner-lib.mjs'", JSON.stringify(libraryUrl)),
  });
  const cwd = fixture(t);
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/testing/run-tests.mjs')], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.ok(fs.existsSync(path.join(root, 'dist/tests/extension/tests/basic.spec.js')));
  assert.equal(fs.existsSync(path.join(cwd, 'dist')), false);
  fs.writeFileSync(path.join(root, 'src/extension/tests/basic.spec.ts'), 'const broken = ;');
  const failed = spawnSync(process.execPath, [path.join(root, 'scripts/testing/run-tests.mjs')], { cwd, encoding: 'utf8' });
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /Build failed/);
});
