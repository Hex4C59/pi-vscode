import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { build } from 'esbuild';

test('shipped Webview imports shared chat but never synthetic or baseline runtime modules', async () => {
  const result = await build({
    entryPoints: [path.resolve('src/webview/main.tsx')],
    bundle: true,
    write: false,
    metafile: true,
    platform: 'browser',
    format: 'esm',
    loader: { '.css': 'empty' },
    logLevel: 'silent',
  });
  const inputs = Object.keys(result.metafile.inputs).map(file => file.replaceAll('\\', '/'));
  assert.ok(inputs.includes('src/webview/chat/candidate.tsx'));
  assert.ok(inputs.includes('src/webview/webview-client.ts'));
  assert.ok(inputs.includes('src/webview/bridge.ts'));
  for (const input of inputs) {
    assert.doesNotMatch(input, /src\/webview\/(?:preview|tests)\//, input);
    assert.doesNotMatch(input, /src\/adapter\/|pi-coding-agent|src\/extension\/(?!contracts\/)/, input);
  }
});
