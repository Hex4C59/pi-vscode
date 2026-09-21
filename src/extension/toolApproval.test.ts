import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ToolApprovals, inspectScope, unambiguousPath, parseGateEnvelope, type GateCall } from './toolApproval.js';
import { controlledEnvironment } from '../adapter/controlledEnvironment.js';
import { ActivityProjection } from '../adapter/activityProjection.js';
import { parseWebviewMessage } from './webviewMessages.js';
const call=(cwd:string,request='a'):GateCall=>({cwd,runtime:'runtime',request,toolCallId:request,tool:'write',input:{path:'file',content:'new'}});
test('readonly realpath policy rejects escapes, junctions and ambiguous Windows paths',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'approval-policy-'));
  try {const cwd=path.join(root,'workspace');await mkdir(cwd);await writeFile(path.join(cwd,'file'),'safe');await writeFile(path.join(root,'outside'),'outside');
    assert.equal((await inspectScope({...call(cwd),tool:'read'})).auto,true);
    assert.equal((await inspectScope({...call(cwd),tool:'read',input:{path:'../outside'}})).auto,false);
    await mkdir(path.join(root,'external'));await writeFile(path.join(root,'external','secret'),'outside');await symlink(path.join(root,'external'),path.join(cwd,'link'),'junction');
    assert.equal((await inspectScope({...call(cwd),tool:'read',input:{path:'link/secret'}})).auto,false);
    for(const p of ['C:relative','file:ads','NUL','foo.','\\\\?\\C:\\foo'])assert.equal(unambiguousPath(p),false);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('approval deny timeout cancellation late replies and exact session grant revoke',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'approval-state-'));
  try {await writeFile(path.join(root,'file'),'x');let notify:()=>void=()=>{};const manager=new ToolApprovals(()=>notify(),30);
    const requested=async(id:string)=>{const changed=new Promise<void>(r=>notify=r);const result=manager.request(call(root,id));await changed;return {result};};
    let p=await requested('one');assert.equal(manager.cards().length,1);manager.decide('one','deny');assert.equal(await p.result,false);assert.equal(manager.decide('one','once'),false);
    p=await requested('timeout');assert.equal(await p.result,false);
    p=await requested('cancel');manager.cancel();assert.equal(await p.result,false);assert.equal(manager.decide('cancel','once'),false);
    p=await requested('grant');manager.decide('grant','session');assert.equal(await p.result,true);assert.equal(await manager.request(call(root,'reuse')),true);
    const grant=manager.scopes()[0];assert.ok(grant);manager.revoke(grant.id);assert.equal(manager.scopes().length,0);
    p=await requested('again');manager.cancel(true);assert.equal(await p.result,false);
    assert.equal(await manager.request({...call(root),input:{content:'x'.repeat(40000)}}),false);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('activity snapshots replace cumulative output and cap thinking; no synthetic thinking',()=>{
  const p=new ActivityProjection();assert.deepEqual(p.parse({type:'message_start',message:{role:'assistant'}}),[]);
  const thinking=p.parse({type:'message_update',assistantMessageEvent:{type:'thinking_delta',contentIndex:0,delta:'x'.repeat(20000)}})[0];assert.equal(thinking.text.length,16384);assert.equal(thinking.truncated,true);
  const start=p.parse({type:'tool_execution_start',toolCallId:'a',toolName:'write'})[0];assert.equal(start.status,'preparing');
  p.parse({type:'tool_execution_update',toolCallId:'a',partialResult:{content:[{type:'text',text:'a'}]}});
  const update=p.parse({type:'tool_execution_update',toolCallId:'a',partialResult:{content:[{type:'text',text:'ab'}]}})[0];assert.equal(update.text,'ab');assert.equal(update.id,start.id);
});
test('controlled startup overrides offline opt-out while preserving provider environment',()=>{
  const inherited={PI_OFFLINE:'0',PI_TELEMETRY:'1',PI_VSCODE_GATE_ID:'stale',FIXTURE_PROVIDER_KEY:'fixture-only'};
  const actual=controlledEnvironment(inherited,'current');
  assert.equal(actual.PI_OFFLINE,'1');assert.equal(actual.PI_TELEMETRY,'0');assert.equal(actual.PI_VSCODE_GATE_ID,'current');assert.equal(actual.FIXTURE_PROVIDER_KEY,'fixture-only');assert.equal(inherited.PI_OFFLINE,'0');
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

test('approval protocol rejects wrong versions unknown tools and extra webview capabilities',()=>{
  assert.equal(parseGateEnvelope({...call('.'),protocol:'pi-vscode-approval',version:2,kind:'call'}),undefined);
  assert.equal(parseGateEnvelope({...call('.'),protocol:'pi-vscode-approval',version:1,kind:'call',tool:'unknown'}),undefined);
  assert.ok(parseWebviewMessage({version:1,type:'decideApproval',generation:1,id:'a',decision:'once'}));
  assert.equal(parseWebviewMessage({version:1,type:'decideApproval',generation:1,id:'a',decision:'once',command:'run'}),undefined);
  assert.equal(parseWebviewMessage({version:1,type:'decideApproval',generation:1,id:'a',decision:'always'}),undefined);
});
