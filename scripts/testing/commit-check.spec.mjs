import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  checkStagedChanges,
  formatResult,
  parseNameStatusZ,
} from './commit-check.mjs';

const checkerSource = new URL('./commit-check.mjs', import.meta.url);

function command(cwd, executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    cwd,
    shell: false,
    encoding: 'utf8',
    ...options,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null, `${executable} ${args.join(' ')} ended on ${result.signal}`);
  return result;
}

function git(cwd, ...args) {
  const result = command(cwd, 'git', args);
  assert.equal(result.status, 0, `git ${args.join(' ')} failed:\n${result.stderr}`);
  return result.stdout;
}

function write(root, name, contents = `${name}\n`) {
  const file = path.join(root, ...name.split('/'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function createRepo(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-commit-check-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, 'init', '--quiet');
  git(root, 'config', 'user.name', 'Commit Check Test');
  git(root, 'config', 'user.email', 'commit-check@example.invalid');
  return root;
}

function stage(root, files) {
  for (const [name, contents] of Object.entries(files)) write(root, name, contents);
  git(root, 'add', '--', ...Object.keys(files));
}

function resultFor(root) {
  return checkStagedChanges(root);
}

test('fails when the staging area is empty', (t) => {
  const root = createRepo(t);
  const result = resultFor(root);
  assert.equal(result.ok, false);
  assert.match(result.summary, /staging area is empty/);
});

test('allows ACTIVE.md with docs-only changes', (t) => {
  const root = createRepo(t);
  stage(root, { 'ACTIVE.md': 'handoff\n', 'docs/guide ünicode.md': 'docs\n' });
  const result = resultFor(root);
  assert.equal(result.ok, true);
  assert.deepEqual(result.stagedPaths, ['ACTIVE.md', 'docs/guide ünicode.md']);
  assert.match(result.instructions, /semantic split manually/);
});

test('rejects ACTIVE.md with a src implementation path', (t) => {
  const root = createRepo(t);
  stage(root, { 'ACTIVE.md': 'handoff\n', 'src/feature.ts': 'export {};\n' });
  const result = resultFor(root);
  assert.equal(result.ok, false);
  assert.match(result.summary, /implementation\/build/);
});

test('rejects ACTIVE.md with package.json', (t) => {
  const root = createRepo(t);
  stage(root, { 'ACTIVE.md': 'handoff\n', 'package.json': '{}\n' });
  assert.equal(resultFor(root).ok, false);
});

test('allows implementation changes without ACTIVE.md', (t) => {
  const root = createRepo(t);
  stage(root, { 'scripts/tool.mjs': 'export {};\n', 'tsconfig.test.json': '{}\n' });
  assert.equal(resultFor(root).ok, true);
});

test('parses NUL name-status rename and copy records with spaces and Unicode', (t) => {
  const root = createRepo(t);
  stage(root, { 'old name ü.txt': 'same content\n', 'copy source.txt': 'copy me\n' });
  git(root, 'commit', '--quiet', '-m', 'fixture');
  git(root, 'mv', 'old name ü.txt', 'renamed 名称.txt');
  fs.copyFileSync(path.join(root, 'copy source.txt'), path.join(root, 'copied 文件.txt'));
  git(root, 'add', '--', 'copied 文件.txt');

  const raw = spawnSync('git', [
    'diff', '--cached', '--name-status', '-z', '--find-renames', '--find-copies', '--find-copies-harder',
  ], { cwd: root, shell: false, encoding: 'buffer' });
  assert.ifError(raw.error);
  assert.equal(raw.status, 0);
  const records = parseNameStatusZ(raw.stdout);
  assert.deepEqual(records.map(({ status, paths }) => [status[0], paths]), [
    ['C', ['copy source.txt', 'copied 文件.txt']],
    ['R', ['old name ü.txt', 'renamed 名称.txt']],
  ]);
});

test('reports staged whitespace errors', (t) => {
  const root = createRepo(t);
  stage(root, { 'docs/bad.md': 'trailing spaces   \n' });
  const result = resultFor(root);
  assert.equal(result.ok, false);
  assert.match(result.summary, /whitespace errors/);
  assert.match(result.summary, /docs\/bad\.md:1/);
});

test('CLI resolves the repository root when invoked from another cwd', (t) => {
  const root = createRepo(t);
  stage(root, { 'docs/ok.md': 'ok\n' });
  const checker = path.join(root, 'scripts', 'testing', 'commit-check.mjs');
  fs.mkdirSync(path.dirname(checker), { recursive: true });
  fs.copyFileSync(checkerSource, checker);

  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-commit-check-cwd-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  const result = command(outside, process.execPath, [checker]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Commit check passed/);
  assert.match(result.stdout, /docs\/ok\.md/);
});

test('surfaces git failures without claiming success', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-commit-check-not-repo-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  assert.throws(() => resultFor(directory), /Unable to inspect staged changes/);
});

test('uses explicit git arguments with shell disabled and formats sorted paths', () => {
  const calls = [];
  const spawn = (executable, args, options) => {
    calls.push({ executable, args, options });
    if (args.includes('--name-status')) {
      return { status: 0, signal: null, stdout: Buffer.from('M\0src/z.ts\0M\0src/a.ts\0'), stderr: Buffer.alloc(0) };
    }
    return { status: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
  };
  const result = checkStagedChanges('.', { spawn });
  assert.equal(result.ok, true);
  assert.deepEqual(result.stagedPaths, ['src/a.ts', 'src/z.ts']);
  assert.equal(calls.length, 2);
  assert.ok(calls.every((call) => call.executable === 'git' && call.options.shell === false));
  assert.match(formatResult(result), /- src\/a\.ts\n- src\/z\.ts/);
});
