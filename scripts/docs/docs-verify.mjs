#!/usr/bin/env node
import { formatReport, runDocsI18nCheck } from './docs-i18n-check-lib.mjs';
import { formatVerifyReport, runDocsVerify } from './docs-verify-lib.mjs';

const json = process.argv.includes('--json');

const i18n = runDocsI18nCheck();
const verify = runDocsVerify();

const combined = {
  i18n,
  verify,
  errors: [
    ...i18n.errors.map((e) => ({ ...e, source: 'i18n' })),
    ...verify.errors.map((e) => ({ ...e, source: 'verify' })),
  ],
  warnings: [
    ...i18n.warnings.map((w) => ({ ...w, source: 'i18n' })),
    ...verify.warnings.map((w) => ({ ...w, source: 'verify' })),
  ],
};

if (json) {
  console.log(JSON.stringify(combined, null, 2));
} else {
  console.log('=== docs:verify (structure) ===');
  console.log(formatVerifyReport(verify));
  console.log('');
  console.log('=== docs:i18n:check ===');
  console.log(formatReport(i18n));
}

if (combined.errors.length > 0) {
  process.exit(1);
}
