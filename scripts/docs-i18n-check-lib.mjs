import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
  CODE_FENCE_LOCALIZED_MODIFIERS,
  IGNORE_DIR_NAMES,
  REQUIRED_CHINESE_PAIRS,
  SOURCE_REVISION_UNCOMMITTED,
  VALID_TRANSLATION_STATUSES,
} from './docs-i18n-config.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

export function repoRoot() {
  return REPO_ROOT;
}

export function isIgnoredPath(relPath) {
  const parts = relPath.split('/');
  return parts.some((p) => IGNORE_DIR_NAMES.has(p));
}

export function listMarkdownFiles(rootDir = REPO_ROOT) {
  const results = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') && entry.name !== '.github') {
        if (IGNORE_DIR_NAMES.has(entry.name)) continue;
      }
      const abs = path.join(dir, entry.name);
      const rel = path.relative(rootDir, abs).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if (IGNORE_DIR_NAMES.has(entry.name)) continue;
        walk(abs);
      } else if (entry.name.endsWith('.md')) {
        if (!isIgnoredPath(rel)) results.push(rel);
      }
    }
  }
  walk(rootDir);
  return results.sort();
}

export function englishPathForZh(zhRel) {
  if (!zhRel.endsWith('.zh.md')) return null;
  return zhRel.slice(0, -'.zh.md'.length) + '.md';
}

export function zhPathForEnglish(enRel) {
  if (!enRel.endsWith('.md') || enRel.endsWith('.zh.md')) return null;
  return enRel.slice(0, -'.md'.length) + '.zh.md';
}

function readFile(rootDir, rel) {
  return fs.readFileSync(path.join(rootDir, rel), 'utf8');
}

function firstNonemptyAfterH1(content) {
  const lines = content.split(/\r?\n/);
  const h1 = lines.findIndex((l) => /^# /.test(l));
  if (h1 === -1) return { h1: -1, switcher: null, switcherLine: -1 };
  for (let i = h1 + 1; i < Math.min(h1 + 6, lines.length); i++) {
    const t = lines[i].trim();
    if (t) return { h1, switcher: t, switcherLine: i + 1 };
  }
  return { h1, switcher: null, switcherLine: -1 };
}

const EN_SWITCHER_RE = /^English \| \[中文\]\(([^)]+)\)\s*$/;
const ZH_SWITCHER_RE = /^\[English\]\(([^)]+)\) \| 中文\s*$/;

export function parseSwitcher(content, language) {
  const { switcher, switcherLine } = firstNonemptyAfterH1(content);
  if (!switcher) {
    return { ok: false, line: switcherLine, target: null, error: 'missing language switcher after H1' };
  }
  const re = language === 'en' ? EN_SWITCHER_RE : ZH_SWITCHER_RE;
  const m = switcher.match(re);
  if (!m) {
    return {
      ok: false,
      line: switcherLine,
      target: null,
      error: `invalid ${language} switcher line: ${switcher}`,
    };
  }
  return { ok: true, line: switcherLine, target: m[1], error: null };
}

function metadataLineValue(content, label) {
  const re = new RegExp(`^-\\s*${label}[：:](.*)$`, 'm');
  const m = content.match(re);
  return m ? m[1].trim() : null;
}

function parseSourceRevision(raw) {
  if (!raw) return { kind: 'missing', value: null };
  const unquoted = raw.replace(/^`|`$/g, '').trim();
  if (unquoted === SOURCE_REVISION_UNCOMMITTED) return { kind: 'uncommitted', value: unquoted };
  const hex = unquoted.match(/^[0-9a-f]{7,40}$/i);
  if (hex) return { kind: 'commit', value: unquoted };
  return { kind: 'unknown', value: unquoted };
}

export function parseZhMetadata(content) {
  const translationStatus = metadataLineValue(content, '翻译状态');
  const authoritativeSource = metadataLineValue(content, '权威原文');
  const sourceRevisionRaw = metadataLineValue(content, '原文版本');
  const lastSync = metadataLineValue(content, '最近同步');
  return {
    translationStatus,
    authoritativeSource,
    sourceRevision: parseSourceRevision(sourceRevisionRaw),
    lastSync,
  };
}

function git(args) {
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

export function commitExists(sha) {
  return git(['rev-parse', '--verify', `${sha}^{commit}`]) !== null;
}

export function englishChangedSinceCommit(enRel, commit) {
  try {
    execFileSync('git', ['diff', '--quiet', commit, '--', enRel], { cwd: REPO_ROOT });
    return { unknown: false, changed: false };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err && err.status === 1) {
      return { unknown: false, changed: true };
    }
    return { unknown: true, changed: false };
  }
}

export function extractFencedCodeBlocks(content) {
  const blocks = [];
  const re = /^```([^\n]*)\n([\s\S]*?)^```/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    const precedingText = content.slice(0, m.index);
    const localizedMermaid = /(?:^|\n)<!-- docs-i18n: localized-mermaid -->\r?\n$/.test(precedingText);
    blocks.push({ info: (m[1] ?? '').trim(), body: m[2], localizedMermaid });
  }
  return blocks;
}

export function extractHeadings(content) {
  return content
    .split(/\r?\n/)
    .filter((l) => /^#{1,6} /.test(l))
    .map((l) => l.replace(/^#+\s*/, '').trim());
}

const LINK_RE = /!?\[[^\]]*\]\(([^)]+)\)/g;

const STRICT_CODE_FENCE_LANGS = new Set([
  'bash',
  'sh',
  'shell',
  'zsh',
  'json',
  'typescript',
  'ts',
  'javascript',
  'js',
  'yaml',
  'yml',
  'toml',
]);

export function stripFencedCode(content) {
  return content.replace(/^```[\s\S]*?^```/gm, '');
}

export function extractRelativeLinks(content) {
  const prose = stripFencedCode(content);
  const links = [];
  let m;
  const re = new RegExp(LINK_RE.source, 'g');
  while ((m = re.exec(prose)) !== null) {
    const target = m[1].trim();
    if (!target || /^(https?:|mailto:|#)/i.test(target)) continue;
    const withoutAnchor = target.split('#')[0];
    if (!withoutAnchor) continue;
    links.push(withoutAnchor);
  }
  return links;
}

function parseFenceInfo(info) {
  const parts = (info ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const lang = parts[0] ?? '';
  const modifiers = new Set(parts.slice(1));
  return { lang, modifiers };
}

/** @param {string} info */
export function codeFenceAllowsLocalizedBody(info) {
  const { modifiers } = parseFenceInfo(info);
  for (const m of modifiers) {
    if (CODE_FENCE_LOCALIZED_MODIFIERS.has(m)) return true;
  }
  return false;
}

function codeFenceSeverity(info) {
  const { lang } = parseFenceInfo(info);
  if (!lang || lang === 'text' || lang === 'mermaid' || lang === 'markdown' || lang === 'md') {
    return 'warning';
  }
  if (STRICT_CODE_FENCE_LANGS.has(lang)) return 'error';
  return 'warning';
}

function resolveLink(fromRel, linkPath) {
  const dir = path.dirname(fromRel);
  const joined = path.normalize(path.join(dir, linkPath)).split(path.sep).join('/');
  if (joined.startsWith('..')) return null;
  return joined;
}

/**
 * @typedef {{ level: 'error' | 'warning', code: string, file: string, message: string, line?: number }} Finding
 */

/**
 * @param {{ rootDir?: string }} [options]
 * @returns {{ errors: Finding[], warnings: Finding[], stale: Finding[] }}
 */
export function runDocsI18nCheck(options = {}) {
  const rootDir = options.rootDir ?? REPO_ROOT;
  const files = listMarkdownFiles(rootDir);
  const errors = [];
  const warnings = [];
  const stale = [];

  const zhFiles = files.filter((f) => f.endsWith('.zh.md'));
  const enWithZh = files.filter((f) => f.endsWith('.md') && !f.endsWith('.zh.md') && fs.existsSync(path.join(rootDir, zhPathForEnglish(f))));

  for (const zhRel of zhFiles) {
    const enRel = englishPathForZh(zhRel);
    if (!enRel || !files.includes(enRel)) {
      errors.push({
        level: 'error',
        code: 'zh-missing-en',
        file: zhRel,
        message: `Chinese file has no matching English source at ${enRel ?? '<invalid>'}`,
      });
      continue;
    }

    const enContent = readFile(rootDir, enRel);
    const zhContent = readFile(rootDir, zhRel);

    const enSw = parseSwitcher(enContent, 'en');
    const zhSw = parseSwitcher(zhContent, 'zh');
    if (!enSw.ok) {
      errors.push({ level: 'error', code: 'en-switcher', file: enRel, message: enSw.error, line: enSw.line });
    }
    if (!zhSw.ok) {
      errors.push({ level: 'error', code: 'zh-switcher', file: zhRel, message: zhSw.error, line: zhSw.line });
    }
    if (enSw.ok && enSw.target !== path.basename(zhRel)) {
      errors.push({
        level: 'error',
        code: 'en-switcher-target',
        file: enRel,
        message: `English switcher links to ${enSw.target}, expected ${path.basename(zhRel)}`,
        line: enSw.line,
      });
    }
    if (zhSw.ok && zhSw.target !== path.basename(enRel)) {
      errors.push({
        level: 'error',
        code: 'zh-switcher-target',
        file: zhRel,
        message: `Chinese switcher links to ${zhSw.target}, expected ${path.basename(enRel)}`,
        line: zhSw.line,
      });
    }

    const meta = parseZhMetadata(zhContent);
    if (!meta.translationStatus) {
      errors.push({ level: 'error', code: 'zh-meta-status', file: zhRel, message: 'missing 翻译状态 metadata' });
    } else if (!VALID_TRANSLATION_STATUSES.has(meta.translationStatus)) {
      errors.push({
        level: 'error',
        code: 'zh-meta-status-invalid',
        file: zhRel,
        message: `invalid 翻译状态: ${meta.translationStatus}`,
      });
    }
    if (!meta.authoritativeSource) {
      errors.push({ level: 'error', code: 'zh-meta-source', file: zhRel, message: 'missing 权威原文 metadata' });
    } else if (!meta.authoritativeSource.includes(path.basename(enRel))) {
      warnings.push({
        level: 'warning',
        code: 'zh-meta-source-name',
        file: zhRel,
        message: `权威原文 should reference ${path.basename(enRel)}`,
      });
    }
    if (meta.sourceRevision.kind === 'missing') {
      errors.push({ level: 'error', code: 'zh-meta-revision', file: zhRel, message: 'missing 原文版本 metadata' });
    } else if (meta.sourceRevision.kind === 'unknown') {
      warnings.push({
        level: 'warning',
        code: 'zh-meta-revision-format',
        file: zhRel,
        message: `unrecognized 原文版本: ${meta.sourceRevision.value}`,
      });
    } else if (meta.sourceRevision.kind === 'commit') {
      const sha = meta.sourceRevision.value;
      if (!commitExists(sha)) {
        errors.push({
          level: 'error',
          code: 'zh-meta-revision-missing-commit',
          file: zhRel,
          message: `recorded 原文版本 commit does not exist: ${sha}`,
        });
      } else {
        const drift = englishChangedSinceCommit(enRel, sha);
        if (!drift.unknown && drift.changed) {
          const msg = `English source changed after recorded 原文版本 ${sha}; translation may be stale`;
          if (meta.translationStatus === 'Stale') {
            stale.push({ level: 'warning', code: 'stale-marked', file: zhRel, message: msg });
          } else {
            errors.push({ level: 'error', code: 'source-drift', file: zhRel, message: msg });
          }
        }
      }
    }
    if (!meta.lastSync) {
      errors.push({ level: 'error', code: 'zh-meta-sync', file: zhRel, message: 'missing 最近同步 metadata' });
    }
    if (meta.translationStatus === 'Stale') {
      stale.push({
        level: 'warning',
        code: 'translation-stale',
        file: zhRel,
        message: 'translation status is Stale',
      });
    }

    const enBlocks = extractFencedCodeBlocks(enContent);
    const zhBlocks = extractFencedCodeBlocks(zhContent);
    if (enBlocks.length !== zhBlocks.length) {
      warnings.push({
        level: 'warning',
        code: 'code-fence-count',
        file: zhRel,
        message: `fenced code block count differs (en=${enBlocks.length}, zh=${zhBlocks.length})`,
      });
    } else {
      for (let i = 0; i < enBlocks.length; i++) {
        if (enBlocks[i].info !== zhBlocks[i].info) {
          warnings.push({
            level: 'warning',
            code: 'code-fence-lang',
            file: zhRel,
            message: `code fence ${i + 1} language tag differs (en="${enBlocks[i].info}", zh="${zhBlocks[i].info}")`,
          });
        }
        if (enBlocks[i].body !== zhBlocks[i].body) {
          const localizedOk =
            (codeFenceAllowsLocalizedBody(enBlocks[i].info) &&
              codeFenceAllowsLocalizedBody(zhBlocks[i].info)) ||
            (enBlocks[i].info === 'mermaid' &&
              zhBlocks[i].info === 'mermaid' &&
              enBlocks[i].localizedMermaid &&
              zhBlocks[i].localizedMermaid);
          if (!localizedOk) {
            const severity = codeFenceSeverity(enBlocks[i].info);
            const finding = {
              level: severity,
              code: 'code-fence-body',
              file: zhRel,
              message: `code fence ${i + 1} body differs from English source (${enBlocks[i].info || 'plain'})`,
            };
            if (severity === 'error') errors.push(finding);
            else warnings.push(finding);
          }
        }
      }
    }

    const enHeadings = extractHeadings(enContent);
    const zhHeadings = extractHeadings(zhContent);
    if (enHeadings.length !== zhHeadings.length) {
      warnings.push({
        level: 'warning',
        code: 'heading-count',
        file: zhRel,
        message: `heading count differs (en=${enHeadings.length}, zh=${zhHeadings.length})`,
      });
    }
  }

  for (const enRel of REQUIRED_CHINESE_PAIRS) {
    const zhRel = zhPathForEnglish(enRel);
    const enAbs = path.join(rootDir, enRel);
    const zhAbs = path.join(rootDir, zhRel);
    if (!fs.existsSync(enAbs)) {
      warnings.push({
        level: 'warning',
        code: 'required-en-missing',
        file: enRel,
        message: 'required English source listed in config is missing',
      });
      continue;
    }
    if (!fs.existsSync(zhAbs)) {
      errors.push({
        level: 'error',
        code: 'required-zh-missing',
        file: enRel,
        message: `required Chinese translation missing: ${zhRel}`,
      });
    }
  }

  for (const rel of files) {
    const abs = path.join(rootDir, rel);
    const content = fs.readFileSync(abs, 'utf8');
    for (const link of extractRelativeLinks(content)) {
      const resolved = resolveLink(rel, link);
      if (!resolved) {
        warnings.push({
          level: 'warning',
          code: 'link-escape',
          file: rel,
          message: `relative link escapes repository: ${link}`,
        });
        continue;
      }
      const targetAbs = path.join(rootDir, resolved);
      if (!fs.existsSync(targetAbs)) {
        errors.push({
          level: 'error',
          code: 'link-missing',
          file: rel,
          message: `broken relative link: ${link} (resolved ${resolved})`,
        });
      }
    }
  }

  return { errors, warnings, stale };
}

export function formatReport(result) {
  const lines = [];
  const all = [
    ...result.errors.map((f) => ({ ...f, kind: 'ERROR' })),
    ...result.warnings.map((f) => ({ ...f, kind: 'WARN' })),
    ...result.stale.map((f) => ({ ...f, kind: 'STALE' })),
  ];
  for (const f of all) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file;
    lines.push(`${f.kind} [${f.code}] ${loc}: ${f.message}`);
  }
  lines.push('');
  lines.push(
    `Summary: ${result.errors.length} error(s), ${result.warnings.length} warning(s), ${result.stale.length} stale notice(s)`,
  );
  return lines.join('\n');
}
