import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test, { after } from 'node:test';

const checker = fileURLToPath(new URL('./pr-base.mjs', import.meta.url));
const report = [];

function command(cwd, executable, args) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    shell: false,
    timeout: 30_000,
    windowsHide: true,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
}

function git(cwd, ...args) {
  const result = command(cwd, 'git', args);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function commit(cwd, contents) {
  fs.writeFileSync(path.join(cwd, 'fixture.txt'), contents);
  git(cwd, 'add', '--', 'fixture.txt');
  git(cwd, '-c', 'user.name=Isolation Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=', 'commit', '--quiet', '-m', contents);
}

function fixture(context, branch = 'master') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-pr-base-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const origin = path.join(root, 'origin.git');
  const primary = path.join(root, 'primary');
  const worktree = path.join(root, 'task');
  git(root, 'init', '--bare', '--quiet', `--initial-branch=${branch}`, origin);
  git(root, 'clone', '--quiet', origin, primary);
  commit(primary, 'initial');
  git(primary, 'push', '--quiet', 'origin', branch);
  git(primary, 'worktree', 'add', '--quiet', '-b', 'codex/task', worktree, `origin/${branch}`);
  return { root, primary, worktree };
}

function check(name, cwd, expectedStatus, message, args = []) {
  const result = command(cwd, process.execPath, [checker, ...args]);
  report.push({ name, arguments: args, expectedStatus, status: result.status,
    stdout: result.stdout.trim(), stderr: result.stderr.trim() });
  assert.equal(result.status, expectedStatus, result.stderr);
  assert.match(`${result.stdout}\n${result.stderr}`, message);
}

after(() => {
  const output = fileURLToPath(new URL('../../out/work/agent-isolation/pr-base.json', import.meta.url));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify({ scenarios: report }, null, 2)}\n`);
});

test('accepts an up-to-date task worktree', (context) => {
  const { worktree } = fixture(context);
  check('current', worktree, 0, /origin\/master is an ancestor of HEAD/);
});

test('accepts task commits and preserves both worktrees, index and HEAD', (context) => {
  const { worktree, primary } = fixture(context);
  commit(worktree, 'task');
  fs.writeFileSync(path.join(worktree, 'staged.txt'), 'staged');
  git(worktree, 'add', '--', 'staged.txt');
  fs.writeFileSync(path.join(worktree, 'fixture.txt'), 'dirty task');
  fs.writeFileSync(path.join(primary, 'fixture.txt'), 'other owner');
  const head = git(worktree, 'rev-parse', 'HEAD');
  const status = git(worktree, 'status', '--porcelain=v1');
  const staged = git(worktree, 'diff', '--cached');
  const primaryStatus = git(primary, 'status', '--porcelain=v1');
  check('ahead and dirty', worktree, 0, /origin\/master is an ancestor of HEAD/);
  assert.equal(git(worktree, 'rev-parse', 'HEAD'), head);
  assert.equal(git(worktree, 'status', '--porcelain=v1'), status);
  assert.equal(git(worktree, 'diff', '--cached'), staged);
  assert.equal(fs.readFileSync(path.join(worktree, 'fixture.txt'), 'utf8'), 'dirty task');
  assert.equal(git(primary, 'status', '--porcelain=v1'), primaryStatus);
  assert.equal(fs.readFileSync(path.join(primary, 'fixture.txt'), 'utf8'), 'other owner');
});

test('fetches a newly advanced remote and rejects a behind task', (context) => {
  const { root, primary, worktree } = fixture(context);
  const publisher = path.join(root, 'publisher');
  git(root, 'clone', '--quiet', path.join(root, 'origin.git'), publisher);
  const staleBase = git(worktree, 'rev-parse', 'origin/master');
  commit(publisher, 'remote advance');
  git(publisher, 'push', '--quiet', 'origin', 'master');
  assert.equal(git(worktree, 'rev-parse', 'origin/master'), staleBase);
  const head = git(worktree, 'rev-parse', 'HEAD');
  check('behind after fresh fetch', worktree, 1, /behind origin\/master/);
  assert.notEqual(git(worktree, 'rev-parse', 'origin/master'), staleBase);
  assert.equal(git(worktree, 'rev-parse', 'HEAD'), head);
  assert.equal(git(primary, 'status', '--porcelain=v1'), '');
});

test('rejects a diverged task without merging or rebasing it', (context) => {
  const { primary, worktree } = fixture(context);
  commit(worktree, 'task divergence');
  const head = git(worktree, 'rev-parse', 'HEAD');
  commit(primary, 'remote divergence');
  git(primary, 'push', '--quiet', 'origin', 'master');
  check('diverged', worktree, 1, /behind origin\/master/);
  assert.equal(git(worktree, 'rev-parse', 'HEAD'), head);
});

test('fails closed when origin is unavailable', (context) => {
  const { root, worktree } = fixture(context);
  git(worktree, 'remote', 'set-url', 'origin', path.join(root, 'missing.git'));
  check('fetch failure', worktree, 1, /Cannot refresh origin\/master/);
});

test('fails closed when origin is missing', (context) => {
  const { worktree } = fixture(context);
  git(worktree, 'remote', 'remove', 'origin');
  check('missing origin', worktree, 1, /Cannot refresh origin\/master/);
});

test('fails closed when the remote has no master branch', (context) => {
  const { worktree } = fixture(context, 'main');
  check('missing master', worktree, 1, /Cannot refresh origin\/master/);
});

test('fails closed outside a Git repository', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-pr-base-no-repo-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  check('not a repository', root, 1, /Cannot refresh origin\/master/);
});

test('checks explicit CI commit snapshots without fetching or requiring origin', (context) => {
  const { worktree } = fixture(context);
  const base = git(worktree, 'rev-parse', 'HEAD');
  commit(worktree, 'ahead snapshot');
  const head = git(worktree, 'rev-parse', 'HEAD');
  git(worktree, 'remote', 'remove', 'origin');
  check('CI ahead snapshot without origin', worktree, 0, /is an ancestor of/,
    ['--base', base, '--head', head]);
});

test('accepts identical explicit base and head snapshots', (context) => {
  const { worktree } = fixture(context);
  const snapshot = git(worktree, 'rev-parse', 'HEAD');
  git(worktree, 'remote', 'remove', 'origin');
  check('CI identical snapshots', worktree, 0, /is an ancestor of/,
    ['--base', snapshot, '--head', snapshot]);
});

test('rejects the PR head snapshot even when checkout HEAD is an integration candidate', (context) => {
  const { worktree, primary } = fixture(context);
  const head = git(worktree, 'rev-parse', 'HEAD');
  commit(primary, 'new base snapshot');
  const base = git(primary, 'rev-parse', 'HEAD');
  git(worktree, 'merge', '--ff-only', base);
  assert.equal(git(worktree, 'rev-parse', 'HEAD'), base);
  check('CI stale PR head with current checkout HEAD', worktree, 1, /behind .* or diverged/,
    ['--base', base, '--head', head]);
  assert.equal(git(worktree, 'rev-parse', 'HEAD'), base);
});

test('fails closed when an explicit snapshot object is unavailable', (context) => {
  const { worktree } = fixture(context);
  const head = git(worktree, 'rev-parse', 'HEAD');
  check('CI unavailable snapshot', worktree, 1, /Cannot verify .* ancestry/,
    ['--base', '0'.repeat(40), '--head', head]);
});

test('fails closed on an incomplete explicit snapshot invocation', (context) => {
  const { worktree } = fixture(context);
  check('CI incomplete arguments', worktree, 1, /Usage:/,
    ['--base', git(worktree, 'rev-parse', 'HEAD')]);
});

test('requires immutable full commit IDs rather than symbolic CI snapshot names', (context) => {
  const { worktree } = fixture(context);
  check('CI symbolic arguments', worktree, 1, /Usage:/,
    ['--base', 'origin/master', '--head', 'HEAD']);
});
