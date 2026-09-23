import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ActivityProjection } from '../activityProjection.js';

test('activity snapshots replace cumulative output and cap thinking; no synthetic thinking',()=>{
  const p=new ActivityProjection();assert.deepEqual(p.parse({type:'message_start',message:{role:'assistant'}}),[]);
  const thinking=p.parse({type:'message_update',assistantMessageEvent:{type:'thinking_delta',contentIndex:0,delta:'x'.repeat(20000)}})[0];assert.equal(thinking.text.length,16384);assert.equal(thinking.truncated,true);
  const start=p.parse({type:'tool_execution_start',toolCallId:'a',toolName:'write'})[0];assert.equal(start.status,'preparing');
  p.parse({type:'tool_execution_update',toolCallId:'a',partialResult:{content:[{type:'text',text:'a'}]}});
  const update=p.parse({type:'tool_execution_update',toolCallId:'a',partialResult:{content:[{type:'text',text:'ab'}]}})[0];assert.equal(update.text,'ab');assert.equal(update.id,start.id);
});

test('activity reserves stable overflow notice and reports truncated inputs across updates',()=>{
  const p=new ActivityProjection();const items=new Map();
  for(let i=0;i<100;i++)for(const item of p.parse({type:'tool_execution_start',toolCallId:String(i),toolName:'write',args:{content:'x'.repeat(20000)}}))items.set(item.id,item);
  assert.equal(items.size,64);assert.equal(items.get('activity-overflow').truncated,true);assert.match(items.get('activity-overflow').text,/omitted/);
  assert.equal(items.get('tool-0').input.length,16384);assert.equal(items.get('tool-0').truncated,true);
  const updated=p.parse({type:'tool_execution_end',toolCallId:'0',result:{content:[]}})[0];assert.equal(updated.truncated,true);assert.equal(updated.status,'complete');
  p.reset();assert.notEqual(p.parse({type:'tool_execution_start',toolCallId:'fresh'})[0].id,'activity-overflow');
});
test('thinking start and end without deltas preserve true empty state and final correction',()=>{
  const p=new ActivityProjection();
  const start=p.parse({type:'message_update',assistantMessageEvent:{type:'thinking_start',contentIndex:0}})[0];assert.equal(start.text,'');assert.equal(start.status,'thinking');
  const end=p.parse({type:'message_update',assistantMessageEvent:{type:'thinking_end',contentIndex:0,content:''}})[0];assert.equal(end.id,start.id);assert.equal(end.text,'');assert.equal(end.status,'complete');
  const final=p.parse({type:'message_update',assistantMessageEvent:{type:'thinking_end',contentIndex:1,content:'Actual summary'}})[0];assert.equal(final.text,'Actual summary');
});
