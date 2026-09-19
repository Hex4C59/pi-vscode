#!/usr/bin/env node
import { formatReport, runDocsI18nCheck } from './docs-i18n-check-lib.mjs';

const json = process.argv.includes('--json');
const result = runDocsI18nCheck();

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(formatReport(result));
}

if (result.errors.length > 0) {
  process.exit(1);
}
