import fs from 'node:fs';
import path from 'node:path';
import { listMarkdownFiles, repoRoot } from './docs-i18n-check-lib.mjs';

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

/** Read-only, opt-in lifecycle checks; dates never establish semantic obsolescence. */
export function runDocsHealth({ rootDir = repoRoot(), today = new Date().toISOString().slice(0, 10) } = {}) {
  if (!validDate(today)) throw new Error('today must be a real YYYY-MM-DD date');
  const findings = [];
  const files = listMarkdownFiles(rootDir).filter((file) =>
    !file.endsWith('.zh.md') && (file.startsWith('docs/') || !file.includes('/')));
  const add = (file, line, code, severity, evidence, action) => findings.push({
    id: `${code}:${file}`, file, line, code, severity, evidence, action,
  });
  for (const file of files) {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf8')
      .replace(/^```[\s\S]*?^```/gm, (block) => block.replace(/[^\n]/g, ''));
    // Metadata is only read before the first H2, never from historical WI bodies or examples.
    const header = content.split(/^## /m)[0];
    const lines = header.split(/\r?\n/);
    const field = (name) => {
      const index = lines.findIndex((line) => line.startsWith(`- ${name}:`));
      return index < 0 ? null : { value: lines[index].slice(name.length + 3).trim(), line: index + 1 };
    };
    const status = field('Status')?.value;
    const historical = file.startsWith('docs/archive/') || file.startsWith('docs/decisions/') || status === 'Superseded';
    const due = field('Review after');
    if (due) {
      if (!validDate(due.value)) {
        add(file, due.line, 'review-date-invalid', 'error', due.value, 'Use a real YYYY-MM-DD review date.');
      } else if (!historical && due.value <= today) {
        add(file, due.line, 'review-due', 'review', `Review after ${due.value}; today ${today}`, 'Check evidence; retain, update, or explicitly defer. Age alone is not obsolescence.');
      }
    }
    const replacement = field('Superseded by');
    if (!replacement) continue;
    const target = replacement.value.match(/^\[[^\]]+\]\(([^)#]+\.md)\)$/)?.[1];
    const resolved = target ? path.posix.normalize(path.posix.join(path.posix.dirname(file), target)) : null;
    if (!resolved || target.includes('\\') || path.posix.isAbsolute(target) || /[:?]/.test(target) ||
        resolved === '..' || resolved.startsWith('../') || resolved === file) {
      add(file, replacement.line, 'replacement-invalid', 'error', replacement.value, 'Link to a different repository Markdown file using a relative path without an anchor.');
      continue;
    }
    const absolute = path.join(rootDir, resolved);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
      add(file, replacement.line, 'replacement-missing', 'error', resolved, 'Restore or correct the replacement link.');
    }
    if (status !== 'Superseded') {
      add(file, replacement.line, 'replacement-status-conflict', 'error', `Superseded by ${resolved}; Status ${status ?? '(missing)'}`, 'Confirm the decision before reconciling status or removing the replacement declaration.');
    }
  }
  return {
    today, scannedFiles: files.length, findings,
    errors: findings.filter((item) => item.severity === 'error').length,
    reviews: findings.filter((item) => item.severity === 'review').length,
    limitations: [
      'Lifecycle metadata is opt-in and read from English/root document headers only; missing metadata is not an error.',
      'No semantic review, automatic cleanup, scheduler, persistent deduplication, or file-age inference is performed.',
      'Historical ADRs, archive files and Superseded documents do not receive age-based review reminders.',
    ],
  };
}

export function formatHealthReport(result) {
  return [
    ...result.findings.map((item) => `${item.severity.toUpperCase()} [${item.id}] ${item.file}:${item.line}: ${item.evidence}\n  ${item.action}`),
    `Summary: ${result.errors} error(s), ${result.reviews} review notice(s), ${result.scannedFiles} file(s) scanned`,
    ...result.limitations.map((item) => `LIMIT: ${item}`),
  ].join('\n');
}
