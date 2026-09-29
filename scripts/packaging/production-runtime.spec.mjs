import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

test('production runtime uses managed processes and excludes direct and memory strategies', async () => {
  const result = await build({
    entryPoints: ['src/extension.ts'], bundle: true, write: false, metafile: true,
    platform: 'node', format: 'cjs',
    external: ['vscode', '@earendil-works/pi-coding-agent', '@earendil-works/pi-ai'],
    logLevel: 'silent',
  });
  const inputs = Object.keys(result.metafile.inputs).map(file => file.replaceAll('\\', '/'));
  assert.ok(inputs.includes('src/adapter/runtime/process/managed-process.ts'));
  assert.ok(inputs.includes('src/adapter/ownership/runtime-owner.ts'));
  for (const input of inputs) assert.doesNotMatch(input, /direct-process|\/tests\//, input);
});
