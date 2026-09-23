// Reviewed keyless fixture: genuine pi invokes this synthetic inference seam.
import { createAssistantMessageEventStream } from '@earendil-works/pi-ai';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
export default function (pi) {
  pi.registerProvider('attachment-fixture', {
    baseUrl: 'http://invalid.invalid', apiKey: 'synthetic-not-a-credential', api: 'attachment-fixture-api',
    models: [{ id: 'fixed', name: 'Synthetic attachment capture', reasoning: false, input: ['text'],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2000000, maxTokens: 64 }],
    streamSimple(model, context) {
      writeFileSync(path.join(process.cwd(), 'captured-input.json'), JSON.stringify(context.messages.at(-1)));
      const stream = createAssistantMessageEventStream();
      const output = { role: 'assistant', api: model.api, provider: model.provider, model: model.id,
        content: [{ type: 'text', text: 'synthetic-capture-complete' }], stopReason: 'stop', timestamp: Date.now(),
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } } };
      stream.push({ type: 'start', partial: output });
      stream.push({ type: 'done', reason: 'stop', message: output }); stream.end(); return stream;
    },
  });
}
