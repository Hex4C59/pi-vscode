// Pre-code actual owned HTTP streaming-fixture contract; not VS Code evidence.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createMermaidNativeProvider } from './mermaid-native-provider.mjs';
test('owned Mermaid fixture streams incomplete source then explicitly closes once', async () => {
  const provider = await createMermaidNativeProvider();
  try {
    const response = await fetch(provider.url + '/chat/completions', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'MERMAID_NATIVE_SEED' }] }) });
    const reader = response.body.getReader(); const first = await reader.read();
    const prefix = new TextDecoder().decode(first.value);
    assert.match(prefix, /flowchart LR/); assert.ok(!prefix.includes('[DONE]'));
    assert.equal((provider.prefix.match(/```/g) ?? []).length, 1);
    assert.equal(provider.requests.length, 1);
    provider.release(1); assert.throws(() => provider.release(1));
    let tail = ''; for (;;) { const part = await reader.read(); if (part.done) break; tail += new TextDecoder().decode(part.value); }
    assert.match(tail, /sequenceDiagram/); assert.match(tail, /SYNTHETIC_END/); assert.match(tail, /\[DONE\]/);
    assert.match(provider.suffix, /https:\/\/example.invalid/); assert.ok(provider.suffix.length > 4096);
  } finally { await provider.close(); }
});
test('owned Mermaid fixture refuses unrelated endpoint without an inference record', async () => {
  const provider = await createMermaidNativeProvider();
  try { const result = await fetch(provider.url + '/not-allowed'); assert.equal(result.status, 400); assert.equal(provider.requests.length, 0); }
  finally { await provider.close(); }
});
