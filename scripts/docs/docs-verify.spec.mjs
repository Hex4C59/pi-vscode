import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkActiveStructure, checkPrdGate, parseCurrentWork } from './docs-verify-lib.mjs';

const current = (stage, assessment = '', lineEnding = '\n') => [
  '## 正在做（WIP=1）',
  '',
  '| 字段 | 内容 |',
  '|---|---|',
  '| **ID** | WI-003 |',
  `| **阶段** | ${stage} |`,
  '| **Gate ID** | `gate-example` |',
  '| **Decision** | `none` |',
  ...(assessment ? [`| **PRD 判定** | ${assessment} |`] : []),
  '',
  '### 目标与范围', '', '范围。',
  '### 方案与架构核对', '', '方案。',
  '### 验收', '', '验收。',
  '### 范围外与批准边界', '', '范围外。',
  '',
  '## 当前焦点与未决项', '', '- next',
  '## 停车场', '', '- later',
  '## 最近交接', '', '### Latest', '', '- handoff',
  '## 已完成 WI 索引', '', '| WI | 历史 |', '|---|---|',
  '',
].join(lineEnding);
const prd = (trace = '| WI-003 | REQ-003 | 验收 |', requirement = '| REQ-003 | 用户可以看到工作区状态。 | Draft |') => `## Traceability\n${trace}\n## Requirements\n${requirement}\n`;

test('Prepare permits a pending PRD assessment', () => {
  assert.deepEqual(checkPrdGate(prd(), current('准备', '待定')), []);
});

test('Build rejects missing or pending assessment', () => {
  for (const assessment of ['', '待定']) {
    assert.ok(checkPrdGate(prd(), current('建造（已确认）', assessment)).some((e) => e.code === 'prd-assessment-missing'));
  }
});

test('technical-only Build permits no requirement when reason is recorded', () => {
  assert.deepEqual(checkPrdGate(prd('| WI-003 | *(none)* | See ACTIVE |', ''), current('建造', '纯技术：仅接口探针，不改变用户可见行为')), []);
});

test('user-visible Build requires traceability and a linked substantive requirement', () => {
  assert.ok(checkPrdGate(prd('| WI-003 | *(pending)* | — |'), current('建造', '用户可见：打开文件夹')).some((e) => e.code === 'prd-trace-missing'));
  assert.ok(checkPrdGate(prd('| WI-003 | REQ-003 | 验收 |', '| REQ-004 | 其他需求 |'), current('Build', 'user-visible: folder selection')).some((e) => e.code === 'prd-requirement-missing'));
  assert.deepEqual(checkPrdGate(prd(), current('建造', '用户可见：打开文件夹')), []);
});

test('pending acceptance in trace status does not make substantive scope a placeholder', () => {
  const trace = '| WI-015 | REQ-001/002/004/005/006 existing UI slices and REQ-003 T014-01 only; visual refresh above | Sole current WI; T015-01–06 Build approved and implemented, verification/handoff in ACTIVE; product/ADR acceptance pending |';
  const active = current('Build', 'user-visible: visual refresh').replace('WI-003', 'WI-015');
  assert.deepEqual(checkPrdGate(prd(trace), active), []);
});

test('placeholder REQ rows fail even during Prepare', () => {
  assert.ok(checkPrdGate(prd(undefined, '| REQ-003 | <!-- placeholder --> |'), current('准备', '待定')).some((e) => e.code === 'prd-placeholder'));
});

test('canonical current boundary is fail-closed and ignores fenced examples', () => {
  assert.equal(parseCurrentWork(current('准备', '待定')).kind, 'current');
  assert.equal(parseCurrentWork(current('准备', '待定', '\r\n')).kind, 'current');
  assert.equal(parseCurrentWork('## Old heading\n').kind, 'invalid');
  assert.equal(parseCurrentWork(`${current('准备', '待定')}\n## 正在做（WIP=1）\n`).kind, 'invalid');
  assert.equal(parseCurrentWork('```text\n## 正在做（WIP=1）\n```\n## 当前无活动 WI（WIP=0）\n').kind, 'empty');
});

test('historical Build text cannot satisfy the current WI gate', () => {
  const body = `${current('准备', '待定')}\n## 已完成 WI 索引\n| WI-099 | Build 用户可见：历史 |\n`;
  assert.deepEqual(checkPrdGate(prd(), body), []);
});

test('ACTIVE structure accepts current or explicit empty state and rejects drift', () => {
  assert.deepEqual(checkActiveStructure(current('准备', '待定')).errors, []);
  const empty = [
    '## 当前无活动 WI（WIP=0）',
    '## 当前焦点与未决项',
    '## 停车场',
    '## 最近交接',
    '## 已完成 WI 索引',
  ].join('\n');
  assert.deepEqual(checkActiveStructure(empty).errors, []);
  assert.ok(checkActiveStructure(current('准备', '待定').replace('## 最近交接', '## Other')).errors.some((e) => e.code === 'active-section'));
  assert.ok(checkActiveStructure(`${current('准备', '待定')}\n## 已完成（WI-002）\n`).errors.some((e) => e.code === 'active-closed-detail'));
  assert.ok(checkActiveStructure(current('准备', '待定').replace('### 验收', '### Checks')).errors.some((e) => e.code === 'active-current-detail'));
});

test('ACTIVE permits at most two recent handoffs', () => {
  const body = current('准备', '待定').replace('### Latest\n\n- handoff', '### One\n\n- 1\n### Two\n\n- 2\n### Three\n\n- 3');
  assert.ok(checkActiveStructure(body).errors.some((e) => e.code === 'active-handoff-count'));
});
