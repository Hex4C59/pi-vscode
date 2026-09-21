import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTests } from './test-runner-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
try {
  await runTests(root);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
