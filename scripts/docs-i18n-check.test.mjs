import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { extractFencedCodeBlocks, runDocsI18nCheck } from './docs-i18n-check-lib.mjs';

const marker = '<!-- docs-i18n: localized-mermaid -->';

function diagramPage(language, marked, tag = 'mermaid') {
  const english = language === 'en';
  const title = english ? '# Diagram\n\nEnglish | [中文](diagram.zh.md)' : '# 图\n\n[English](diagram.md) | 中文';
  const metadata = english ? '' : '\n- 翻译状态：Machine Draft\n- 权威原文：[diagram.md](diagram.md)\n- 原文版本：Uncommitted baseline\n- 最近同步：2026-09-19\n';
  return `${title}${metadata}\n${marked ? `${marker}\n` : ''}\`\`\`${tag}\nflowchart TD\n  A["${english ? 'User' : '用户'}"] --> B["Host"]\n\`\`\`\n`;
}

function fenceWarnings(enMarked, zhMarked, zhTag = 'mermaid') {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-docs-i18n-'));
  try {
    fs.writeFileSync(path.join(rootDir, 'diagram.md'), diagramPage('en', enMarked));
    fs.writeFileSync(path.join(rootDir, 'diagram.zh.md'), diagramPage('zh', zhMarked, zhTag));
    return runDocsI18nCheck({ rootDir }).warnings.filter((finding) => finding.file === 'diagram.zh.md');
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
}

test('recognizes marker only directly before a fenced block', () => {
  const blocks = extractFencedCodeBlocks(`${marker}\n\`\`\`mermaid\nflowchart TD\n  A --> B\n\`\`\``);
  assert.equal(blocks[0].info, 'mermaid');
  assert.equal(blocks[0].localizedMermaid, true);
  const separated = extractFencedCodeBlocks(`${marker}\n\n\`\`\`mermaid\nflowchart TD\n  A --> B\n\`\`\``);
  assert.equal(separated[0].localizedMermaid, false);
});

test('matching marked Mermaid pair permits translated labels', () => {
  assert.deepEqual(fenceWarnings(true, true), []);
});

test('unmarked or one-sided marker still warns on translated labels', () => {
  for (const [en, zh] of [[false, false], [true, false], [false, true]]) {
    assert.ok(fenceWarnings(en, zh).some((finding) => finding.code === 'code-fence-body'));
  }
});

test('marker cannot waive differing language tags', () => {
  const warnings = fenceWarnings(true, true, 'text');
  assert.ok(warnings.some((finding) => finding.code === 'code-fence-lang'));
  assert.ok(warnings.some((finding) => finding.code === 'code-fence-body'));
});
