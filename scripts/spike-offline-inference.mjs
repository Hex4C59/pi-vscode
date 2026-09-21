import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { isolatedFixture, withProcess } from './project-trust-lib.mjs';
// No real provider: actual OpenAI-compatible transport talks only to loopback.
await isolatedFixture(async({root,env})=>{
  let requests=0;
  const server=createServer((req,res)=>{
    requests++;assert.equal(req.url,'/v1/chat/completions');req.resume();
    res.writeHead(200,{'Content-Type':'text/event-stream'});
    const base={id:'fixture',object:'chat.completion.chunk',created:0,model:'offline-fixture'};
    res.write('data: '+JSON.stringify({...base,choices:[{index:0,delta:{role:'assistant',content:'loopback-ok'},finish_reason:null}]})+'\n\n');
    res.write('data: '+JSON.stringify({...base,choices:[{index:0,delta:{},finish_reason:'stop'}]})+'\n\n');
    res.end('data: [DONE]\n\n');
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  try {
    const port=server.address().port;
    await writeFile(path.join(root,'agent','models.json'),JSON.stringify({providers:{'offline-loopback':{baseUrl:`http://127.0.0.1:${port}/v1`,api:'openai-completions',apiKey:'fixture-not-secret',models:[{id:'offline-fixture',name:'Offline fixture',reasoning:false,input:['text'],contextWindow:10000,maxTokens:1000,cost:{input:0,output:0,cacheRead:0,cacheWrite:0}}]}}}));
    // Missing packages must be skipped rather than installed in offline startup.
    await writeFile(path.join(root,'agent','settings.json'),JSON.stringify({packages:['npm:pi-vscode-missing-offline-fixture@0.0.0']}));
    const cli=path.resolve('node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js');
    await withProcess([cli,'--offline','--mode','rpc','--no-session','--no-tools','--no-extensions','--no-approve','--model','offline-loopback/offline-fixture'],{cwd:path.join(root,'a'),env,timeoutMs:15000},async({child,request})=>{
      const reader=createInterface({input:child.stdout});let resolve;const settled=new Promise(r=>resolve=r);let text='';
      reader.on('line',line=>{const e=JSON.parse(line);if(e.type==='message_update'&&e.assistantMessageEvent?.type==='text_delta')text+=e.assistantMessageEvent.delta;if(e.type==='agent_settled')resolve();});
      try {await request('get_state');await request('prompt',{message:'fixture'});await settled;assert.equal(requests,1);assert.equal(text,'loopback-ok');}finally{reader.close();}
    });
    console.log('PASS offline startup skips missing package and still performs loopback provider inference');
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
