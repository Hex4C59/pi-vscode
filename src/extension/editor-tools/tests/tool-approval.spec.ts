import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ToolApprovals, inspectScope, unambiguousPath } from '../toolApproval.js';
import { parseGateEnvelope, type GateCall } from '../../contracts/approvalProtocol.js';
import { parseWebviewMessage } from '../../bridge/webviewMessages.js';
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
test('approval deny timeout cancellation late replies and exact session grant revoke', { timeout: 5000 }, async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const root=await mkdtemp(path.join(tmpdir(),'approval-state-'));
  let notify:()=>void=()=>{};
  const manager=new ToolApprovals(()=>notify(),1000);
  try {await writeFile(path.join(root,'file'),'x');
    const requested=async(id:string)=>{
      const changed=new Promise<void>(r=>notify=r);
      const result=manager.request(call(root,id));
      // Scope inspection does real filesystem I/O. Expiry must not race it or
      // leave this test waiting for a card that was never offered.
      assert.equal(await Promise.race([changed.then(()=>"offered"),result.then(()=>"settled")]),"offered");
      return {result};
    };
    let p=await requested('one');assert.equal(manager.cards().length,1);manager.decide('one','deny');assert.equal(await p.result,false);assert.equal(manager.decide('one','once'),false);
    p=await requested('timeout');t.mock.timers.tick(1001);assert.equal(await p.result,false);
    p=await requested('cancel');manager.cancel();assert.equal(await p.result,false);assert.equal(manager.decide('cancel','once'),false);
    p=await requested('grant');manager.decide('grant','session');assert.equal(await p.result,true);assert.equal(await manager.request(call(root,'reuse')),true);
    const grant=manager.scopes()[0];assert.ok(grant);manager.revoke(grant.id);assert.equal(manager.scopes().length,0);
    p=await requested('again');manager.cancel(true);assert.equal(await p.result,false);
    assert.equal(await manager.request({...call(root),input:{content:'x'.repeat(40000)}}),false);
  }finally{manager.cancel(true);await rm(root,{recursive:true,force:true});}
});

test('approval protocol rejects wrong versions unknown tools and extra webview capabilities',()=>{
  assert.equal(parseGateEnvelope({...call('.'),protocol:'pi-vscode-approval',version:2,kind:'call'}),undefined);
  assert.equal(parseGateEnvelope({...call('.'),protocol:'pi-vscode-approval',version:1,kind:'call',tool:'unknown'}),undefined);
  assert.ok(parseWebviewMessage({version:2,viewId:'view',type:'decideApproval',generation:1,id:'a',decision:'once'}));
  assert.equal(parseWebviewMessage({version:2,viewId:'view',type:'decideApproval',generation:1,id:'a',decision:'once',command:'run'}),undefined);
  assert.equal(parseWebviewMessage({version:2,viewId:'view',type:'decideApproval',generation:1,id:'a',decision:'always'}),undefined);
});


test('revoking a reused session grant during the final asynchronous safety check prevents execution', { timeout: 5000 }, async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'approval-revoke-'));
  let release: (() => void) | undefined;
  let pause = false;
  let checks = 0;
  let checked: (() => void) | undefined;
  let offered: (() => void) | undefined;
  const manager = new ToolApprovals(() => { if (manager.cards().length) offered?.(); }, 1000, async () => {
    if (pause && ++checks === 2) { const pending = new Promise<void>(resolve => { release = resolve; }); checked?.(); await pending; }
    return true;
  });
  try {
    await writeFile(path.join(root, 'file'), 'disk');
    const approval = new Promise<void>(resolve => { offered = resolve; });
    const first = manager.request(call(root, 'first'));
    assert.equal(await Promise.race([approval.then(() => "offered"), first.then(() => "settled")]), "offered");
    manager.decide('first', 'session'); assert.equal(await first, true);
    const grant = manager.scopes()[0]; assert.ok(grant);
    pause = true;
    const reached = new Promise<void>(resolve => { checked = resolve; });
    const next = manager.request(call(root, 'reuse'));
    assert.equal(await Promise.race([reached.then(() => "checking"), next.then(() => "settled")]), "checking");
    manager.revoke(grant.id); release?.();
    assert.equal(await next, false);
  } finally { release?.(); manager.cancel(true); await rm(root, { recursive: true, force: true }); }
});


test('a write spelling normalized by pi cannot obtain a grant for a different raw filesystem target', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'approval-normalized-'));
  try {
    await writeFile(path.join(root, 'space file'), 'actual write destination');
    await writeFile(path.join(root, 'space\u00a0file'), 'different raw-name file');
    assert.equal((await inspectScope({ ...call(root), input: { path: 'space\u00a0file', content: 'new' } })).scope, null);
  } finally { await rm(root, { recursive: true, force: true }); }
});


test('approval expiry during the final asynchronous safety check cannot authorize a call or session grant', { timeout: 5000 }, async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 1000 });
  const root = await mkdtemp(path.join(tmpdir(), 'approval-expiry-'));
  let offered: (() => void) | undefined; let checked: (() => void) | undefined; let release: (() => void) | undefined; let checks = 0;
  const manager = new ToolApprovals(() => { if (manager.cards().length) offered?.(); }, 1000, async () => {
    if (++checks === 2) { const pending = new Promise<void>(resolve => { release = resolve; }); checked?.(); await pending; }
    return true;
  });
  try {
    await writeFile(path.join(root, 'file'), 'disk');
    const card = new Promise<void>(resolve => { offered = resolve; }); const finalCheck = new Promise<void>(resolve => { checked = resolve; });
    const pending = manager.request(call(root, 'expires'));
    assert.equal(await Promise.race([card.then(() => "offered"), pending.then(() => "settled")]), "offered");
    manager.decide('expires', 'session');
    assert.equal(await Promise.race([finalCheck.then(() => "checking"), pending.then(() => "settled")]), "checking");
    t.mock.timers.tick(1001); release?.();
    assert.equal(await pending, false); assert.equal(manager.scopes().length, 0);
  } finally { release?.(); manager.cancel(true); await rm(root, { recursive: true, force: true }); }
});
