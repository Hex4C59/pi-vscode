import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { runDocsHealth } from './docs-health-lib.mjs';

function fixture(t, files) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-health-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  for (const [file, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(rootDir, file)), { recursive: true });
    fs.writeFileSync(path.join(rootDir, file), body);
  }
  return rootDir;
}

const today = '2026-09-19';
test('explicit due dates are notices, future dates are quiet, files remain unchanged', (t) => {
  const files = {
    'docs/due.md': '# Due\n- Review after: 2026-09-19\n',
    'docs/future.md': '# Future\n- Review after: 2026-09-20\n',
    'docs/old.md': '# Old\n- Created: 1999-01-01\n',
  };
  const rootDir = fixture(t, files);
  const result = runDocsHealth({ rootDir, today });
  assert.equal(result.errors, 0);
  assert.equal(result.reviews, 1);
  assert.equal(result.findings[0].line, 2);
  assert.equal(result.findings[0].id, 'review-due:docs/due.md');
  assert.deepEqual(runDocsHealth({ rootDir, today }), result);
  for (const [file, body] of Object.entries(files)) assert.equal(fs.readFileSync(path.join(rootDir, file), 'utf8'), body);
  assert.deepEqual(fs.readdirSync(path.join(rootDir, 'docs')).sort(), ['due.md', 'future.md', 'old.md']);
});

test('historical ADRs, archive and Superseded files are protected from age reminders', (t) => {
  const rootDir = fixture(t, {
    'docs/decisions/0001-old.md': '- Review after: 2000-01-01\n',
    'docs/archive/old.md': '- Review after: 2000-01-01\n',
    'docs/old.md': '- Status: Superseded\n- Review after: 2000-01-01\n',
  });
  assert.deepEqual(runDocsHealth({ rootDir, today }).findings, []);
});

test('invalid calendar dates and malformed clock are rejected', (t) => {
  const rootDir = fixture(t, { 'docs/invalid.md': '- Review after: 2026-02-30\n' });
  assert.equal(runDocsHealth({ rootDir, today }).findings[0].code, 'review-date-invalid');
  assert.throws(() => runDocsHealth({ rootDir, today: 'yesterday' }), /YYYY-MM-DD/);
});

test('replacement metadata requires a real target and a consistent status', (t) => {
  const rootDir = fixture(t, {
    'docs/current.md': '# Current\n',
    'docs/old.md': '- Status: Superseded\n- Superseded by: [Current](current.md)\n',
    'docs/conflict.md': '- Status: Accepted\n- Superseded by: [Current](current.md)\n',
    'docs/missing.md': '- Status: Superseded\n- Superseded by: [Missing](missing-target.md)\n',
  });
  assert.deepEqual(runDocsHealth({ rootDir, today }).findings.map((item) => item.code),
    ['replacement-status-conflict', 'replacement-missing']);
});

test('escaping, external, absolute and self replacement links are invalid', (t) => {
  const rootDir = fixture(t, Object.fromEntries([
    '../../outside.md', 'https://example.com/doc.md', '/absolute.md', 'bad3.md',
  ].map((target, index) => [`docs/bad${index}.md`, `- Superseded by: [Target](${target})\n`])));
  assert.equal(runDocsHealth({ rootDir, today }).errors, 4);
  assert.ok(runDocsHealth({ rootDir, today }).findings.every((item) => item.code === 'replacement-invalid'));
});

test('body examples, translated metadata and unconfigured files do not create notices', (t) => {
  const rootDir = fixture(t, {
    'docs/guide.md': '# Guide\n```text\n- Review after: 2000-01-01\n```\n## Example\n- Review after: 2000-01-01\n',
    'docs/guide.zh.md': '- Review after: 2000-01-01\n',
    'ACTIVE.md': '# Current\n## History\n- Review after: 2000-01-01\n',
  });
  assert.deepEqual(runDocsHealth({ rootDir, today }).findings, []);
});

test('CLI emits parseable JSON and fails on invalid arguments', () => {
  const cli = fileURLToPath(new URL('./docs-health.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [cli, '--json'], { encoding: 'utf8' });
  const report = JSON.parse(result.stdout);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.mode, 'read-only');
  assert.equal(result.status, report.errors ? 1 : 0);
  const invalid = spawnSync(process.execPath, [cli, '--write'], { encoding: 'utf8' });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Usage/);
});
