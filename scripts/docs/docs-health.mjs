#!/usr/bin/env node
import { runDocsI18nCheck } from './docs-i18n-check-lib.mjs';
import { runDocsVerify } from './docs-verify-lib.mjs';
import { formatHealthReport, runDocsHealth } from './docs-health-lib.mjs';

try {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--json')) throw new Error('Usage: node scripts/docs/docs-health.mjs [--json]');
  const lifecycle = runDocsHealth();
  const i18n = runDocsI18nCheck();
  const verify = runDocsVerify();
  const errors = lifecycle.errors + i18n.errors.length + verify.errors.length;
  const result = { schemaVersion: 1, mode: 'read-only', lifecycle, i18n, verify, errors };
  if (args.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatHealthReport(lifecycle));
    for (const [source, report] of [['i18n', i18n], ['verify', verify]]) {
      for (const item of [...report.errors, ...report.warnings, ...(report.stale ?? [])]) {
        console.log(`${source} [${item.code}] ${item.file ?? ''}: ${item.message}`);
      }
    }
    console.log(`Combined errors: ${errors}. Semantic review must be performed separately by an agent.`);
  }
  process.exitCode = errors ? 1 : 0;
} catch (error) {
  console.error(`docs:health failed: ${error.message}`);
  process.exitCode = 1;
}
