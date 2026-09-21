import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ToolApprovals, inspectScope, unambiguousPath, parseGateEnvelope, type GateCall } from '../toolApproval.js';
import { parseWebviewMessage } from '../webviewMessages.js';
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

test('approval protocol rejects wrong versions unknown tools and extra webview capabilities',()=>{
  assert.equal(parseGateEnvelope({...call('.'),protocol:'pi-vscode-approval',version:2,kind:'call'}),undefined);
  assert.equal(parseGateEnvelope({...call('.'),protocol:'pi-vscode-approval',version:1,kind:'call',tool:'unknown'}),undefined);
  assert.ok(parseWebviewMessage({version:1,type:'decideApproval',generation:1,id:'a',decision:'once'}));
  assert.equal(parseWebviewMessage({version:1,type:'decideApproval',generation:1,id:'a',decision:'once',command:'run'}),undefined);
  assert.equal(parseWebviewMessage({version:1,type:'decideApproval',generation:1,id:'a',decision:'always'}),undefined);
});
