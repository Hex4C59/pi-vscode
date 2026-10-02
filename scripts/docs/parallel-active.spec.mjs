import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { after, test } from 'node:test';
import { REQUIRED_CHINESE_PAIRS } from './docs-i18n-config.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const outcomes = [];
const row = (id, slot, phase = 'Build') => `| ${id} | ${phase} | ${slot} | owner-${id} | codex/${id} / ../worktrees/${id} | docs/${id} |`;
const proposal = (id, assessment = '纯技术：仅验证工具') => [
  `### ${id}`, '| 字段 | 内容 |', '|---|---|', `| **ID** | ${id} |`,
  '| **阶段** | Build |', '| **Gate ID** | none |', '| **Decision** | none |',
  `| **PRD 判定** | ${assessment} |`, '#### 目标与范围', 'scope', '#### 方案与架构核对',
  'approach', '#### 验收', 'checks', '#### 范围外与批准边界', 'excluded',
].join('\n');
const active = (rows, proposals = [proposal('WI-079')]) => [
  '# Current', '## 任务登记（最多 3 个执行槽位）',
  '| 任务 ID | 阶段 | 槽位 | 执行者／所有者 | 分支／worktree | 范围／依赖 |',
  '|---|---|---|---|---|---|', ...rows, '## 任务提案', ...proposals,
  '## 待完成',
].join('\n');

function fixture(context, content, prd = '# Requirements\n') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-parallel-active-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.cpSync(path.join(root, 'scripts/docs'), path.join(directory, 'scripts/docs'), { recursive: true });
  for (const english of REQUIRED_CHINESE_PAIRS) {
    const chinese = english.replace(/\.md$/, '.zh.md');
    fs.mkdirSync(path.dirname(path.join(directory, english)), { recursive: true });
    fs.writeFileSync(path.join(directory, english), `# Fixture\n\nEnglish | [中文](${path.basename(chinese)})\n`);
    fs.writeFileSync(path.join(directory, chinese), [
      '# Fixture', '', `[English](${path.basename(english)}) | 中文`,
      '- 翻译状态：Machine Draft', `- 权威原文：[source](${path.basename(english)})`,
      '- 原文版本：Uncommitted baseline', '- 最近同步：2026-10-02', '',
    ].join('\n'));
  }
  fs.writeFileSync(path.join(directory, 'ACTIVE.md'), content);
  fs.writeFileSync(path.join(directory, 'docs/product-requirements.md'), `# Requirements\n\nEnglish | [中文](product-requirements.zh.md)\n${prd}`);
  return directory;
}

function verify(context, name, content, expected, prd) {
  const directory = fixture(context, content, prd);
  const result = spawnSync(process.execPath, [path.join(directory, 'scripts/docs/docs-verify.mjs'), '--json'], {
    encoding: 'utf8', windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024,
  });
  const report = result.stdout ? JSON.parse(result.stdout) : null;
  const codes = report?.errors.map((finding) => finding.code) ?? [];
  outcomes.push({ name, expected, exitCode: result.status, codes });
  assert.equal(result.error, undefined);
  assert.equal(fs.readFileSync(path.join(directory, 'ACTIVE.md'), 'utf8'), content);
  assert.equal(result.status, expected ? 1 : 0, result.stdout + result.stderr);
  if (expected) assert.ok(codes.includes(expected), JSON.stringify(codes));
}

test('parallel ACTIVE CLI accepts three disjoint tasks and preserves source', (context) => {
  verify(context, 'three tasks', active([row('WI-079', 1), row('OPS-CHECK', 2, 'Audit'), row('OPS-PREPARE', 3, 'Prepare')]), null);
  verify(context, 'blocked task frees slot', active([row('WI-079', '-', 'Blocked'), row('OPS-CHECK', 1, 'Audit')]), null);
  verify(context, 'empty registry', active([], []), null);
});

test('parallel ACTIVE CLI fails closed for registry drift and duplicate ownership', (context) => {
  const valid = active([row('WI-079', 1)]);
  for (const [name, content, expected] of [
    ['four running tasks', active([row('WI-079', 1), row('WI-080', 2), row('WI-081', 3), row('WI-082', 4)]), 'active-task-slots'],
    ['duplicate slot', active([row('WI-079', 1), row('OPS-CHECK', 1, 'Audit')]), 'active-task-slots'],
    ['duplicate task', active([row('WI-079', 1), row('WI-079', 2)]), 'active-task-duplicate'],
    ['missing owner', valid.replace('owner-WI-079', ''), 'active-task-registry'],
    ['unknown phase', valid.replace('| Build | 1 |', '| Mystery | 1 |'), 'active-task-registry'],
    ['blocked still has slot', active([row('WI-079', 1, 'Blocked')]), 'active-task-slots'],
    ['missing registry header', valid.replace('| 任务 ID | 阶段 | 槽位 | 执行者／所有者 | 分支／worktree | 范围／依赖 |', ''), 'active-task-registry'],
    ['same development checkout', active([row('WI-079', 1), row('OPS-CHECK', 2, 'Audit').replace('codex/OPS-CHECK / ../worktrees/OPS-CHECK', 'codex/WI-079 / ../worktrees/WI-079')]), 'active-task-resource'],
    ['empty executing registry', valid.replace(row('WI-079', 1), '| WI-079 | Build | 1 | owner | missing-worktree | docs/check |'), 'active-task-resource'],
    ['no proposal', active([row('WI-079', 1)], []), 'active-current-field'],
    ['unregistered proposal', active([row('WI-079', 1)], [proposal('WI-079'), proposal('WI-080')]), 'active-task-proposal'],
    ['duplicate proposal', active([row('WI-079', 1)], [proposal('WI-079'), proposal('WI-079')]), 'active-task-proposal'],
    ['ambiguous legacy heading', `${valid}\n## 正在做（WIP=1）`, 'active-current-boundary'],
  ]) verify(context, name, content, expected);
});

test('parallel ACTIVE CLI checks each Build WI PRD gate, not only the first', (context) => {
  const rows = [row('WI-079', 1), row('WI-080', 2)];
  verify(context, 'second Build pending', active(rows, [proposal('WI-079'), proposal('WI-080', '待定')]), 'prd-assessment-missing');
  verify(context, 'second Build lacks trace', active(rows, [proposal('WI-079'), proposal('WI-080', '用户可见：新增行为')]), 'prd-trace-missing');
  verify(context, 'second Build traced', active(rows, [proposal('WI-079'), proposal('WI-080', '用户可见：新增行为')]), null,
    '# Requirements\n| WI-080 | REQ-080 | checks |\n| REQ-080 | approved behavior | Accepted |\n');
});

// Failure modes: a valid empty entry rejected; missing/duplicate pending section
// accepted; closed history reintroduced; a pending row mistaken for active Build;
// missing current-WI fields or PRD approval ignored; verification writes source.
test('single ACTIVE CLI validates only current work and pending work', (context) => {
  const empty = '# Current\n## 正在做（WIP=0）\n暂无。\n## 待完成\n';
  const running = `# Current\n## 正在做（WIP=1）\n${proposal('WI-082')}\n## 待完成\n`;
  verify(context, 'empty current and pending', empty, null);
  verify(context, 'single current proposal', running, null);
  verify(context, 'pending is not active Build', `${empty}| WI-099 | Build | 用户可见：未开始 |\n`, null);
  verify(context, 'pending missing', empty.replace('## 待完成', '## Other'), 'active-section');
  verify(context, 'pending duplicate', `${empty}\n## 待完成\n`, 'active-section');
  verify(context, 'current identity missing', running.replace('| **ID** | WI-082 |', ''), 'active-current-field');
  verify(context, 'Build still needs approved PRD', running.replace('纯技术：仅验证工具', '用户可见：新增功能'), 'prd-trace-missing');
  for (const heading of ['停车场', '当前焦点与未决项', '最近交接', '已完成 WI 索引']) {
    verify(context, `obsolete ${heading}`, `${empty}\n## ${heading}\n`, 'active-obsolete-section');
  }
});

after(() => {
  const directory = path.join(root, 'out/work/parallel-active');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'cli-report.json'), JSON.stringify({ sourceState: 'uncommitted development checks', outcomes }, null, 2));
});
