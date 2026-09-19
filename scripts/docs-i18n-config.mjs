/**
 * Configuration for docs:i18n:check (product repository).
 * Edit REQUIRED_CHINESE_PAIRS when you add authoritative English docs.
 */

/** English sources that must have a `.zh.md` translation. */
export const REQUIRED_CHINESE_PAIRS = [
  'README.md',
  'AGENTS.md',
  'docs/README.md',
  'docs/git-commit-convention.md',
  'docs/bilingual-documentation.md',
  'docs/guides/agent-collaboration.md',
  'docs/guides/agent/judgment.md',
  'docs/reference/architecture-gates.md',
  'docs/architecture/vscode-extension-architecture.md',
];

export const IGNORE_DIR_NAMES = new Set(['.git', 'node_modules']);

export const VALID_TRANSLATION_STATUSES = new Set([
  'Machine Draft',
  'Human Reviewed',
  'Technically Verified',
  'Stale',
]);

export const SOURCE_REVISION_UNCOMMITTED = 'Uncommitted baseline';

/**
 * Extra tokens on a fenced code block info line (after the language), e.g. ```text prompt.
 * When present on **both** English and Chinese fences at the same index, body text may differ.
 */
export const CODE_FENCE_LOCALIZED_MODIFIERS = new Set(['prompt', 'localized']);
