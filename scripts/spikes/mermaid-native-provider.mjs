// Anonymous owned HTTP fixture; no real provider, credentials or external loads.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
const prefix = 'SYNTHETIC_GRAPH\n```mermaid\nflowchart LR\nA[Start 起点] --> B[Review 核对] --> C[Done 完成]\n';
const suffix = '```\n\nSYNTHETIC_SEQUENCE\n```mermaid\nsequenceDiagram\nAlice->>Bob: Hello\nBob-->>Alice: Done\n```\n\nSYNTHETIC_SYNTAX\n```mermaid\nflowchart LR\nA[unterminated\n```\n\nSYNTHETIC_UNSAFE\n```mermaid\nflowchart LR\nclick A "https://example.invalid/"\n```\n\nSYNTHETIC_LARGE\n```mermaid\nflowchart LR\nA[' + 'X'.repeat(4200) + ']\n```\n\nSYNTHETIC_UNSUPPORTED\n```mermaid\npie\n"A": 2\n```\n\nSYNTHETIC_END';
function chunk(content, finish = null) {
  return 'data: ' + JSON.stringify({ id: 'fixture', object: 'chat.completion.chunk', created: 0, model: 'queue-fixture',
    choices: [{ index: 0, delta: content ? { role: 'assistant', content } : {}, finish_reason: finish }] }) + '\n\n';
}
export async function createMermaidNativeProvider() {
  const requests = []; const held = new Map();
  const server = createServer((request, response) => {
    if (request.method !== 'POST' || request.url !== '/v1/chat/completions') { response.writeHead(400); response.end(); return; }
    let body = '';
    request.setEncoding('utf8');
    request.on('data', part => { body += part; if (body.length > 1048576) request.destroy(new Error('Fixture body budget exceeded')); });
    request.on('error', () => response.destroy());
    request.on('end', () => {
      try {
        requests.push(JSON.parse(body));
        response.writeHead(200, { 'Content-Type': 'text/event-stream' });
        response.write(chunk(prefix)); held.set(requests.length, response);
      } catch { response.writeHead(400); response.end(); }
    });
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return { requests, prefix, suffix, url: `http://127.0.0.1:${server.address().port}/v1`,
    release(number) { assert.ok(held.has(number)); const response = held.get(number); held.delete(number);
      if (!response.destroyed) { response.write(chunk(suffix)); response.write(chunk('', 'stop')); response.end('data: [DONE]\n\n'); } },
    async close() { server.closeAllConnections(); held.clear(); await new Promise(resolve => server.close(resolve)); },
  };
}
