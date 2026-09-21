import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkPrdGate } from './docs-verify-lib.mjs';

const active = (stage, assessment = '') => `## 正在做（WIP=1）\n\n| 字段 | 内容 |\n|---|---|\n| **ID** | WI-003 |\n| **阶段** | ${stage} |\n${assessment ? `| **PRD 判定** | ${assessment} |\n` : ''}\n## 已完成（WI-002）\n`;
const prd = (trace = '| WI-003 | REQ-003 | 验收 |', requirement = '| REQ-003 | 用户可以看到工作区状态。 | Draft |') => `## Traceability\n${trace}\n## Requirements\n${requirement}\n`;

test('Prepare permits a pending PRD assessment', () => {
  assert.deepEqual(checkPrdGate(prd(), active('准备', '待定')), []);
});

test('Build rejects missing or pending assessment', () => {
  for (const assessment of ['', '待定']) {
    assert.ok(checkPrdGate(prd(), active('建造（已确认）', assessment)).some((e) => e.code === 'prd-assessment-missing'));
  }
});

test('technical-only Build permits no requirement when reason is recorded', () => {
  assert.deepEqual(checkPrdGate(prd('| WI-003 | *(none)* | See ACTIVE |', ''), active('建造', '纯技术：仅接口探针，不改变用户可见行为')), []);
});

test('user-visible Build requires traceability and a linked substantive requirement', () => {
  assert.ok(checkPrdGate(prd('| WI-003 | *(pending)* | — |'), active('建造', '用户可见：打开文件夹')).some((e) => e.code === 'prd-trace-missing'));
  assert.ok(checkPrdGate(prd('| WI-003 | REQ-003 | 验收 |', '| REQ-004 | 其他需求 |'), active('Build', 'user-visible: folder selection')).some((e) => e.code === 'prd-requirement-missing'));
  assert.deepEqual(checkPrdGate(prd(), active('建造', '用户可见：打开文件夹')), []);
});

test('placeholder REQ rows fail even during Prepare', () => {
  assert.ok(checkPrdGate(prd(undefined, '| REQ-003 | <!-- placeholder --> |'), active('准备', '待定')).some((e) => e.code === 'prd-placeholder'));
});
