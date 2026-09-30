import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bearerText, fieldAssignmentText, ordinaryText, privateKeyText } from '../../../extension/contracts/tests/credential-samples.js';
import { ActivityProjection } from '../activityProjection.js';
import { decodeRuntimeEvent } from '../rpc/rpc-events.js';

function projection() {
  const activity = new ActivityProjection();
  return {
    reset: () => activity.reset(),
    parse(raw: Record<string, unknown>) {
      const decoded = decodeRuntimeEvent(raw);
      assert.equal(decoded.kind, 'event');
      if (decoded.kind !== 'event') throw new Error('Invalid test event');
      return activity.parse(decoded.event);
    },
  };
}

test('activity snapshots replace cumulative output and cap thinking; no synthetic thinking',()=>{
  const p=projection();assert.deepEqual(p.parse({type:'message_start',message:{role:'assistant'}}),[]);
  const thinking=p.parse({type:'message_update',assistantMessageEvent:{type:'thinking_delta',contentIndex:0,delta:'x'.repeat(20000)}})[0];assert.equal(thinking.text.length,16384);assert.equal(thinking.truncated,true);
  const start=p.parse({type:'tool_execution_start',toolCallId:'a',toolName:'write'})[0];assert.equal(start.status,'preparing');
  p.parse({type:'tool_execution_update',toolCallId:'a',partialResult:{content:[{type:'text',text:'a'}]}});
  const update=p.parse({type:'tool_execution_update',toolCallId:'a',partialResult:{content:[{type:'text',text:'ab'}]}})[0];assert.equal(update.text,'ab');assert.equal(update.id,start.id);
});

test('activity reserves stable overflow notice and reports truncated inputs across updates',()=>{
  const p=projection();const items=new Map();
  for(let i=0;i<100;i++)for(const item of p.parse({type:'tool_execution_start',toolCallId:String(i),toolName:'write',args:{content:'x'.repeat(20000)}}))items.set(item.id,item);
  assert.equal(items.size,64);assert.equal(items.get('activity-overflow').truncated,true);assert.match(items.get('activity-overflow').text,/omitted/);
  assert.equal(items.get('tool-0').input.length,16384);assert.equal(items.get('tool-0').truncated,true);
  const updated=p.parse({type:'tool_execution_end',isError:false,toolCallId:'0',result:{content:[]}})[0];assert.equal(updated.truncated,true);assert.equal(updated.status,'complete');
  p.reset();assert.notEqual(p.parse({type:'tool_execution_start',toolCallId:'fresh'})[0].id,'activity-overflow');
});
test('thinking start and end without deltas preserve true empty state and final correction',()=>{
  const p=projection();
  const start=p.parse({type:'message_update',assistantMessageEvent:{type:'thinking_start',contentIndex:0}})[0];assert.equal(start.text,'');assert.equal(start.status,'thinking');
  const end=p.parse({type:'message_update',assistantMessageEvent:{type:'thinking_end',contentIndex:0,content:''}})[0];assert.equal(end.id,start.id);assert.equal(end.text,'');assert.equal(end.status,'complete');
  const final=p.parse({type:'message_update',assistantMessageEvent:{type:'thinking_end',contentIndex:1,content:'Actual summary'}})[0];assert.equal(final.text,'Actual summary');
});

test('shared credential samples are redacted and ordinary activity text stays', () => {
  const p = projection();
  const plain = p.parse({ type: 'message_update', assistantMessageEvent: { type: 'thinking_end', contentIndex: 0, content: ordinaryText } })[0];
  assert.equal(plain.text, ordinaryText);
  const key = p.parse({ type: 'message_update', assistantMessageEvent: { type: 'thinking_end', contentIndex: 1, content: privateKeyText } })[0];
  assert.equal(key.text, '[redacted]');
  assert.equal(key.text.includes('PRIVATE KEY'), false);
  const field = p.parse({ type: 'tool_execution_start', toolCallId: 'field', toolName: 'read', args: { note: fieldAssignmentText } })[0];
  assert.match(field.input ?? '', /password=\[redacted\]/);
  assert.equal(field.input?.includes('synthetic'), false);
  const bearer = p.parse({ type: 'tool_execution_end', isError: false, toolCallId: 'bearer', toolName: 'read', result: { content: [{ type: 'text', text: bearerText }] } })[0];
  assert.equal(bearer.text, 'Bearer [redacted]');
});

test('activity enforces its budget after sanitization and reports expansion truncation', () => {
  const p = projection();
  const value = 'a'.repeat(16_374) + 'password=x';
  const item = p.parse({ type: 'message_update', assistantMessageEvent: { type: 'thinking_end', contentIndex: 0, content: value } })[0];
  assert.equal(item.text.length, 16_384);
  assert.equal(item.text, 'a'.repeat(16_374) + 'password=[');
  assert.equal(item.truncated, true);
  const tool = p.parse({ type: 'tool_execution_start', toolCallId: 'bounded-input', toolName: 'read', args: { password: 'x', padding: 'b'.repeat(16_350) } })[0];
  assert.ok((tool.input?.length ?? 0) <= 16_384);
  assert.equal(tool.truncated, true);
});
