import fs from 'node:fs';
import path from 'node:path';

import { extractRelativeLinks, listMarkdownFiles, repoRoot } from './docs-i18n-check-lib.mjs';

const GATES_EN = 'docs/reference/architecture-gates.md';
const DECISIONS_INDEX_EN = 'docs/decisions/README.md';
const PRD_EN = 'docs/product-requirements.md';
const ACTIVE = 'ACTIVE.md';

// Only enforce the mechanical PRD gate for an active Build WI; Prepare may be incomplete.
export function checkPrdGate(prd, active) {
  const errors = [];
  if (/\|\s*REQ-\d+\s*\|[^\n]*<!--/.test(prd)) {
    errors.push({ code: 'prd-placeholder', message: `${PRD_EN}: REQ row contains a placeholder comment` });
  }
  const current = active.split(/^## 正在做（WIP=1）/m)[1]?.split(/^## /m)[0] ?? '';
  const wi = current.match(/\|\s*\*\*ID\*\*\s*\|\s*(WI-\d+)\s*\|/)?.[1];
  const build = /\|\s*\*\*阶段\*\*\s*\|\s*(?:建造|Build)(?:\s|\||（|\()/.test(current);
  if (!wi || !build) return errors;
  const assessment = current.match(/\|\s*\*\*PRD 判定\*\*\s*\|\s*([^|]+)\|/)?.[1]?.trim();
  if (!assessment || /待定|pending/i.test(assessment)) {
    errors.push({ code: 'prd-assessment-missing', message: `${wi}: Build requires a resolved PRD 判定 row in ACTIVE.md` });
  } else if (/^(?:纯技术|technical-only)\s*[:：]\s*\S/i.test(assessment)) {
    // A technical-only WI has no user-visible PRD slice, but must explain why.
  } else if (/^(?:用户可见|user-visible)\s*[:：]\s*\S/i.test(assessment)) {
    const row = prd.split(/\r?\n/).find((line) => new RegExp(`^\\|\\s*${wi}\\s*\\|`).test(line));
    if (!row || /\*\(none|pending|待定|（无|暂无|<!--/i.test(row) || !/REQ-\d+/.test(row)) {
      errors.push({ code: 'prd-trace-missing', message: `${wi}: user-visible Build requires a traceability row with a REQ ID` });
    }
    const linkedIds = row?.match(/REQ-\d+/g) ?? [];
    const requirements = prd.split(/\r?\n/).filter((line) =>
      linkedIds.some((id) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(line)) &&
      !/<!--|\bTODO\b|待定|deferred/i.test(line) &&
      line.split('|')[2]?.trim(),
    );
    if (!requirements.length) {
      errors.push({ code: 'prd-requirement-missing', message: `${wi}: user-visible Build requires a substantive linked REQ row` });
    }
  } else {
    errors.push({ code: 'prd-assessment-invalid', message: `${wi}: PRD 判定 must specify 用户可见 or 纯技术, with a reason` });
  }
  return errors;
}

function readRepo(rel) {
  return fs.readFileSync(path.join(repoRoot(), rel), 'utf8');
}

function resolveLink(fromRel, linkPath) {
  const dir = path.dirname(fromRel);
  const joined = path.normalize(path.join(dir, linkPath)).split(path.sep).join('/');
  if (joined.startsWith('..')) return null;
  return joined;
}

function fileExists(rel) {
  return fs.existsSync(path.join(repoRoot(), rel));
}

function parseGateRows(content) {
  const rows = [];
  for (const line of content.split(/\r?\n/)) {
    if (!line.startsWith('| `gate-')) continue;
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;
    const id = cells[0].replace(/^`|`$/g, '');
    const status = cells[2].replace(/^`|`$/g, '');
    const adrCell = cells[3];
    let adrPath = null;
    const link = adrCell.match(/\]\(([^)]+)\)/);
    if (link) adrPath = link[1];
    rows.push({ id, status, adrPath, adrCell });
  }
  return rows;
}

function parseAcceptedAdrRows(content) {
  const rows = [];
  let inSection = false;
  for (const line of content.split(/\r?\n/)) {
    if (line.startsWith('## Accepted ADRs')) {
      inSection = true;
      continue;
    }
    if (inSection && line.startsWith('## ') && !line.includes('Accepted ADRs')) break;
    if (!inSection || !line.startsWith('|')) continue;
    if (line.includes('---') || line.includes('*(none')) continue;
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells[0] === 'ID' || cells[0] === '—') continue;
    const fileCell = cells[cells.length - 1];
    const link = fileCell.match(/\]\(([^)]+)\)/);
    rows.push({
      id: cells[0],
      file: link ? link[1] : fileCell === '—' ? null : fileCell,
    });
  }
  return rows;
}

function listAdrFiles() {
  const dir = path.join(repoRoot(), 'docs/decisions');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => /^[0-9]{4}-.+\.md$/.test(n) && !n.endsWith('.zh.md'))
    .map((n) => `docs/decisions/${n}`)
    .sort();
}

export function runDocsVerify() {
  const errors = [];
  const warnings = [];

  const push = (severity, code, message) => {
    const item = { severity, code, message };
    if (severity === 'error') errors.push(item);
    else warnings.push(item);
  };

  const mdFiles = listMarkdownFiles().filter(
    (rel) => rel.startsWith('docs/') || rel === 'README.md' || rel === 'AGENTS.md' || rel === 'ACTIVE.md',
  );

  for (const rel of mdFiles) {
    const content = readRepo(rel);
    for (const link of extractRelativeLinks(content)) {
      const resolved = resolveLink(rel, link);
      if (!resolved) {
        push('error', 'link-escape', `${rel}: link escapes repo: ${link}`);
        continue;
      }
      if (!fileExists(resolved)) {
        push('error', 'link-missing', `${rel}: broken relative link: ${link} (resolved ${resolved})`);
      }
    }
  }

  if (fileExists(PRD_EN) && fileExists(ACTIVE)) {
    for (const finding of checkPrdGate(readRepo(PRD_EN), readRepo(ACTIVE))) {
      push('error', finding.code, finding.message);
    }
  }

  if (fileExists(GATES_EN)) {
    const gatesContent = readRepo(GATES_EN);
    for (const row of parseGateRows(gatesContent)) {
      if (row.status === 'Accepted') {
        if (!row.adrPath || row.adrCell === '—' || row.adrCell.includes('—')) {
          push('error', 'gate-accepted-no-adr', `${row.id}: status Accepted but ADR column is empty`);
        } else {
          const resolved = resolveLink(GATES_EN, row.adrPath);
          if (!resolved || !fileExists(resolved)) {
            push(
              'error',
              'gate-adr-missing',
              `${row.id}: ADR link missing on disk: ${row.adrPath}${resolved ? ` (resolved ${resolved})` : ''}`,
            );
          }
        }
      }
      if (row.adrPath && row.status !== 'Accepted') {
        push(
          'warning',
          'gate-adr-premature',
          `${row.id}: ADR linked while gate status is ${row.status} (expected Accepted when ADR is set)`,
        );
      }
    }
  }

  if (fileExists(DECISIONS_INDEX_EN)) {
    const adrOnDisk = new Set(listAdrFiles());
    const indexContent = readRepo(DECISIONS_INDEX_EN);
    const accepted = parseAcceptedAdrRows(indexContent);
    const indexedFiles = new Set();
    for (const row of accepted) {
      if (row.file) {
        const resolved = resolveLink(DECISIONS_INDEX_EN, row.file);
        if (resolved) {
          indexedFiles.add(resolved);
        }
        if (!resolved || !fileExists(resolved)) {
          push(
            'error',
            'adr-index-missing-file',
            `decisions/README lists ${row.id} → ${row.file} but file is missing`,
          );
        }
      }
    }
    for (const adr of adrOnDisk) {
      if (!indexedFiles.has(adr)) {
        push('warning', 'adr-file-not-indexed', `${adr} exists but is not listed in decisions/README Accepted ADRs table`);
      }
      const body = readRepo(adr);
      if (!/^-\s*Status:\s*Accepted/m.test(body)) {
        push('warning', 'adr-status-not-accepted', `${adr}: on disk but Status is not Accepted in file metadata`);
      }
    }
  }

  return { errors, warnings };
}

export function formatVerifyReport({ errors, warnings }) {
  const lines = [];
  for (const e of errors) lines.push(`ERROR [${e.code}] ${e.message}`);
  for (const w of warnings) lines.push(`WARN [${w.code}] ${w.message}`);
  lines.push('');
  lines.push(`Summary: ${errors.length} error(s), ${warnings.length} warning(s)`);
  return lines.join('\n');
}
