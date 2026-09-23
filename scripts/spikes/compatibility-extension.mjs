// Synthetic deterministic provider, NOT real inference. Owned isolated fixture only.
import { createAssistantMessageEventStream } from '@earendil-works/pi-ai';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
export default function (pi) {
  writeFileSync(path.join(process.cwd(), 'initialized'), 'fixture');
  pi.registerProvider('fixture-synthetic', {
    baseUrl: 'http://invalid.invalid', apiKey: 'synthetic-not-a-credential', api: 'fixture-synthetic-api',
    models: [{ id: 'fixed', name: 'Synthetic fixed tool calls', reasoning: false, input: ['text'],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 32768, maxTokens: 256 }],
    streamSimple(model, context) {
      const stream = createAssistantMessageEventStream();
      const last = context.messages.at(-1);
      const custom = JSON.stringify(last?.content).includes('custom');
      const toolCall = { type: 'toolCall', id: 'fixture-call', name: custom ? 'fixture_write' : 'write',
        arguments: custom ? {} : { path: 'builtin-effect', content: 'synthetic-write-marker' } };
      const output = { role: 'assistant', api: model.api, provider: model.provider, model: model.id,
        content: last?.role === 'user' ? [toolCall] : [{ type: 'text', text: 'synthetic-complete' }],
        stopReason: last?.role === 'user' ? 'toolUse' : 'stop', timestamp: Date.now(),
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } } };
      stream.push({ type: 'start', partial: output });
      if (output.stopReason === 'toolUse') {
        stream.push({ type: 'toolcall_start', contentIndex: 0, partial: output });
        stream.push({ type: 'toolcall_end', contentIndex: 0, toolCall, partial: output });
      }
      stream.push({ type: 'done', reason: output.stopReason, message: output });
      stream.end();
      return stream;
    },
  });
  pi.registerTool({
    name: 'fixture_write', label: 'Fixture write', description: 'Writes a fixture marker',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute() {
      writeFileSync(path.join(process.cwd(), 'tool-effect'), 'fixture');
      return { content: [{ type: 'text', text: 'fixture' }], details: {} };
    },
  });
  pi.on('tool_call', async (event, ctx) => {
    ctx.ui.notify(`fixture:hook:${event.toolName}`);
    const allow = await ctx.ui.confirm('fixture-tool', 'Allow fixture write?');
    ctx.ui.notify(`fixture:hook:${allow ? 'allowed' : 'denied'}`);
    return allow ? undefined : { block: true, reason: 'fixture-denied' };
  });
  pi.registerCommand('fixture-tools', { handler: async (_args, ctx) => {
    ctx.ui.notify(pi.getActiveTools().includes('fixture_write') ? 'fixture:tool-enabled' : 'fixture:tool-excluded');
  } });
  pi.registerCommand('fixture-dialog', { handler: async (args, ctx) => {
    const [method, variant, token] = args.split(' ');
    const options = variant === 'timeout' ? { timeout: 50 } : undefined;
    let value;
    if (method === 'select') value = await ctx.ui.select('fixture', ['fixture-answer'], options);
    else if (method === 'confirm') value = await ctx.ui.confirm('fixture', 'fixture', options);
    else if (method === 'input') value = await ctx.ui.input('fixture', 'fixture', options);
    else if (method === 'editor') value = await ctx.ui.editor('fixture', 'fixture');
    else throw new Error('fixture-method-invalid');
    ctx.ui.notify(`continued:${token}`);
    ctx.ui.notify(`fixture:${token}:${value === undefined ? 'cancelled' : value === false ? 'false' : value === true ? 'true' : value === 'fixture-answer' ? 'answer' : 'other'}`);
  } });
}
