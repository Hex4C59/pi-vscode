import fs from 'node:fs';
import path from 'node:path';

import { extractRelativeLinks, listMarkdownFiles, repoRoot } from './docs-i18n-check-lib.mjs';

const GATES_EN = 'docs/reference/architecture-gates.md';
const DECISIONS_INDEX_EN = 'docs/decisions/README.md';
const PRD_EN = 'docs/product-requirements.md';
const ACTIVE = 'ACTIVE.md';
const CURRENT_HEADING = '## 正在做（WIP=1）';
const NO_CURRENT_HEADING = '## 当前无活动 WI（WIP=0）';
const PARALLEL_HEADING = '## 任务登记（最多 3 个执行槽位）';

function stripFencedBlocks(content) {
  return content.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1\s*$/gm, (block) => '\n'.repeat(block.split(/\r?\n/).length - 1));
}

export function parseCurrentWork(active) {
  const clean = stripFencedBlocks(active);
  const headings = (clean.match(/^## .+$/gm) ?? []).map((heading) => heading.trim());
  const boundaries = headings.filter((heading) => [CURRENT_HEADING, NO_CURRENT_HEADING, PARALLEL_HEADING].includes(heading));
  if (boundaries.length !== 1) return { kind: 'invalid', section: '' };
  if (boundaries[0] === NO_CURRENT_HEADING) return { kind: 'empty', section: '' };
  if (boundaries[0] === CURRENT_HEADING) return { kind: 'current', section: headingBody(clean, CURRENT_HEADING) };
  if (headings.filter((heading) => heading === '## 任务提案').length !== 1) return { kind: 'invalid', section: '' };
  const registry = headingBody(clean, PARALLEL_HEADING);
  const rows = registry.split(/\r?\n/).filter((line) => /^\|/.test(line)).map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
  const tasks = rows.filter((cells) => cells[0] !== '任务 ID' && !/^[-:]+$/.test(cells[0] ?? ''));
  const sections = headingBody(clean, '## 任务提案').split(/^### (?=WI-\d+)/m).slice(1);
  const header = ['任务 ID', '阶段', '槽位', '执行者／所有者', '分支／worktree', '范围／依赖'];
  const validHeader = rows.filter((cells) => JSON.stringify(cells) === JSON.stringify(header)).length === 1;
  return { kind: 'parallel', registry, tasks, sections, validHeader, section: '' };
}

function headingBody(clean, heading) {
  const lines = clean.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === heading) + 1;
  const next = lines.findIndex((line, index) => index >= start && /^## /.test(line));
  return lines.slice(start, next === -1 ? undefined : next).join('\n');
}

function proposalId(section) {
  return section.match(/\|\s*\*\*ID\*\*\s*\|\s*(WI-\d+)(?=\s|\||（|\()/)?.[1];
}

function checkParallelRegistry(parsed) {
  const errors = [];
  if (!parsed.validHeader) errors.push({ code: 'active-task-registry', message: `${ACTIVE}: require the six-column task registry header` });
  const ids = new Set();
  const slots = new Set();
  const proposalIds = parsed.sections.map(proposalId);
  for (const cells of parsed.tasks) {
    const [id, phase, slot, owner, worktree, scope] = cells;
    if (cells.length !== 6 || !/^(?:WI-\d+|[A-Z]+-[A-Z0-9-]+)$/.test(id) || !owner || !worktree || !scope || !/^(?:Build|Prepare|Audit|Blocked|Paused|Done)$/.test(phase)) {
      errors.push({ code: 'active-task-registry', message: `${ACTIVE}: malformed task row ${id ?? ''}` });
    }
    if (ids.has(id)) errors.push({ code: 'active-task-duplicate', message: `${ACTIVE}: duplicate task ID ${id}` });
    ids.add(id);
    const executing = ['Build', 'Prepare', 'Audit'].includes(phase);
    if (executing ? !/^[1-3]$/.test(slot) || slots.has(slot) : slot !== '-') {
      errors.push({ code: 'active-task-slots', message: `${ACTIVE}: ${id} needs a unique slot 1–3 while executing, otherwise -` });
    }
    if (executing) slots.add(slot);
    if (/^WI-\d+$/.test(id) && !proposalIds.includes(id)) {
      errors.push({ code: 'active-current-field', message: `${ACTIVE}: ${id} requires an inline proposal with an ID row` });
    }
  }
  if (new Set(proposalIds).size !== proposalIds.length || proposalIds.some((id, index) => !id || !ids.has(id) || !parsed.sections[index].startsWith(id))) {
    errors.push({ code: 'active-task-proposal', message: `${ACTIVE}: proposal IDs must be unique, registered and match their headings` });
  }
  errors.push(...checkTaskResources(parsed.tasks));
  return errors;
}

function checkTaskResources(tasks) {
  const errors = [];
  const branches = new Set();
  const worktrees = new Set();
  for (const [id, phase, , , resource] of tasks) {
    if (!['Build', 'Prepare', 'Audit'].includes(phase)) continue;
    const parts = (resource ?? '').replace(/`/g, '').split(/\s+\/\s+|／/).map((part) => part.trim());
    const [branch, worktree] = parts;
    if (parts.length !== 2 || !/^\S+$/.test(branch) || ['main', 'master'].includes(branch) || !/^(?:\.\.?\/|\/|[A-Za-z]:[\\/])/.test(worktree ?? '') || branches.has(branch) || worktrees.has(worktree)) {
      errors.push({ code: 'active-task-resource', message: `${ACTIVE}: ${id} requires a distinct development branch / worktree pair` });
    }
    branches.add(branch);
    worktrees.add(worktree);
  }
  return errors;
}

export function checkActiveStructure(active) {
  const errors = [];
  const warnings = [];
  const parsed = parseCurrentWork(active);
  if (parsed.kind === 'invalid') {
    errors.push({ code: 'active-current-boundary', message: `${ACTIVE}: require exactly one canonical task registry (with proposals), legacy current-work or no-active-WI heading` });
    return { errors, warnings };
  }
  const clean = stripFencedBlocks(active);
  const requiredH2 = ['## 当前焦点与未决项', '## 停车场', '## 最近交接', '## 已完成 WI 索引'];
  for (const heading of requiredH2) {
    if ((clean.match(new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'gm')) ?? []).length !== 1) {
      errors.push({ code: 'active-section', message: `${ACTIVE}: require exactly one ${heading}` });
    }
  }
  if (/^## (?:已完成（WI-|WI-\d+\s+讨论稿)/m.test(clean)) {
    errors.push({ code: 'active-closed-detail', message: `${ACTIVE}: closed WI detail belongs in docs/archive; keep only the completed index` });
  }
  if (parsed.kind === 'parallel') errors.push(...checkParallelRegistry(parsed));
  const sections = parsed.kind === 'parallel' ? parsed.sections : parsed.kind === 'current' ? [parsed.section] : [];
  for (const section of sections) {
    for (const field of ['ID', '阶段', 'Gate ID', 'Decision', 'PRD 判定']) {
      if (!new RegExp(`\\|\\s*\\*\\*${field}\\*\\*\\s*\\|`).test(section)) {
        errors.push({ code: 'active-current-field', message: `${ACTIVE}: current WI is missing ${field}` });
      }
    }
    for (const heading of ['目标与范围', '方案与架构核对', '验收', '范围外与批准边界']) {
      if (!new RegExp(`^#{3,4} ${heading}`, 'm').test(section)) {
        errors.push({ code: 'active-current-detail', message: `${ACTIVE}: current WI is missing ${heading}` });
      }
    }
  }
  const handoff = clean.split(/^## 最近交接\s*$/m)[1]?.split(/^## /m)[0] ?? '';
  if ((handoff.match(/^### /gm) ?? []).length > 2) {
    errors.push({ code: 'active-handoff-count', message: `${ACTIVE}: keep at most two recent handoffs; archive older entries` });
  }
  const lineCount = active.split(/\r?\n/).length;
  if (lineCount > 180) warnings.push({ code: 'active-size', message: `${ACTIVE}: ${lineCount} lines exceeds the 180-line guidance; do not remove live limits merely to reduce size` });
  return { errors, warnings };
}

// Only enforce the mechanical PRD gate for an active Build WI; Prepare may be incomplete.
export function checkPrdGate(prd, active) {
  const errors = [];
  if (/\|\s*REQ-\d+\s*\|[^\n]*<!--/.test(prd)) {
    errors.push({ code: 'prd-placeholder', message: `${PRD_EN}: REQ row contains a placeholder comment` });
  }
  const parsed = parseCurrentWork(active);
  const sections = parsed.kind === 'parallel' ? parsed.sections : parsed.kind === 'current' ? [parsed.section] : [];
  for (const section of sections) errors.push(...checkProposalPrdGate(prd, section));
  return errors;
}

function checkProposalPrdGate(prd, current) {
  const errors = [];
  const wi = proposalId(current);
  const build = /\|\s*\*\*阶段\*\*\s*\|\s*(?:建造|Build)(?:\s|\||（|\()/.test(current);
  if (!wi || !build) return errors;
  const assessment = current.match(/\|\s*\*\*PRD 判定\*\*\s*\|\s*([^|]+)\|/)?.[1]?.trim();
  if (!assessment || /待定|pending/i.test(assessment)) {
    errors.push({ code: 'prd-assessment-missing', message: `${wi}: Build requires a resolved PRD 判定 row in ACTIVE.md` });
  } else if (/^(?:纯技术|technical-only)\s*[:：]\s*\S/i.test(assessment)) {
    // A technical-only WI has no user-visible PRD slice, but must explain why.
  } else if (/^(?:用户可见|user-visible)\s*[:：]\s*\S/i.test(assessment)) {
    const row = prd.split(/\r?\n/).find((line) => new RegExp(`^\\|\\s*${wi}\\s*\\|`).test(line));
    const scope = row?.split('|')[2]?.trim() ?? '';
    if (!row || /\*\(none|pending|待定|（无|暂无|<!--/i.test(scope) || !/REQ-\d+/.test(row)) {
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

function readRepo(rel, root = repoRoot()) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function resolveLink(fromRel, linkPath) {
  const dir = path.dirname(fromRel);
  const joined = path.normalize(path.join(dir, linkPath)).split(path.sep).join('/');
  if (joined.startsWith('..')) return null;
  return joined;
}

function fileExists(rel, root = repoRoot()) {
  return fs.existsSync(path.join(root, rel));
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

function listAdrFiles(root = repoRoot()) {
  const dir = path.join(root, 'docs/decisions');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => /^[0-9]{4}-.+\.md$/.test(n) && !n.endsWith('.zh.md'))
    .map((n) => `docs/decisions/${n}`)
    .sort();
}

export function runDocsVerify(options = {}) {
  const root = options.rootDir ?? repoRoot();
  const errors = [];
  const warnings = [];

  const push = (severity, code, message) => {
    const item = { severity, code, message };
    if (severity === 'error') errors.push(item);
    else warnings.push(item);
  };

  const exists = (rel) => fs.existsSync(path.join(root, rel));
  const read = (rel) => readRepo(rel, root);
  const mdFiles = listMarkdownFiles(root).filter(
    (rel) => rel.startsWith('docs/') || rel === 'README.md' || rel === 'AGENTS.md' || rel === 'ACTIVE.md',
  );

  for (const rel of mdFiles) {
    const content = read(rel);
    for (const link of extractRelativeLinks(content)) {
      const resolved = resolveLink(rel, link);
      if (!resolved) {
        push('error', 'link-escape', `${rel}: link escapes repo: ${link}`);
        continue;
      }
      if (!exists(resolved)) {
        push('error', 'link-missing', `${rel}: broken relative link: ${link} (resolved ${resolved})`);
      }
    }
  }

  if (exists(ACTIVE)) {
    const active = read(ACTIVE);
    const activeReport = checkActiveStructure(active);
    for (const finding of activeReport.errors) push('error', finding.code, finding.message);
    for (const finding of activeReport.warnings) push('warning', finding.code, finding.message);
    for (const match of active.matchAll(/\]\((docs\/archive\/[^)#]+\.md)#([a-z0-9-]+)\)/g)) {
      const [, rel, anchor] = match;
      if (exists(rel) && !new RegExp(`<a\\s+id=["']${anchor}["']\\s*><\\/a>`, 'i').test(read(rel))) {
        push('error', 'active-archive-anchor', `${ACTIVE}: archive target ${rel} is missing explicit anchor #${anchor}`);
      }
    }
  }

  if (exists(PRD_EN) && exists(ACTIVE)) {
    for (const finding of checkPrdGate(read(PRD_EN), read(ACTIVE))) {
      push('error', finding.code, finding.message);
    }
  }

  if (exists(GATES_EN)) {
    const gatesContent = read(GATES_EN);
    for (const row of parseGateRows(gatesContent)) {
      if (row.status === 'Accepted') {
        if (!row.adrPath || row.adrCell === '—' || row.adrCell.includes('—')) {
          push('error', 'gate-accepted-no-adr', `${row.id}: status Accepted but ADR column is empty`);
        } else {
          const resolved = resolveLink(GATES_EN, row.adrPath);
          if (!resolved || !exists(resolved)) {
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

  if (exists(DECISIONS_INDEX_EN)) {
    const adrOnDisk = new Set(listAdrFiles(root));
    const indexContent = read(DECISIONS_INDEX_EN);
    const accepted = parseAcceptedAdrRows(indexContent);
    const indexedFiles = new Set();
    for (const row of accepted) {
      if (row.file) {
        const resolved = resolveLink(DECISIONS_INDEX_EN, row.file);
        if (resolved) {
          indexedFiles.add(resolved);
        }
        if (!resolved || !exists(resolved)) {
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
      const body = read(adr);
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
