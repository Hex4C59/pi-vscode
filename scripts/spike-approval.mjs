import assert from 'node:assert/strict';
import { writeFile, access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { isolatedFixture, withProcess } from './project-trust-lib.mjs';
const pkg = path.resolve('node_modules/@earendil-works/pi-coding-agent');
assert.equal(JSON.parse(await readFile(path.join(pkg,'package.json'),'utf8')).version,'0.86.1');
const cli = path.join(pkg, 'dist/bundle/cli.js');
const gate = path.resolve('dist/approval-gate.mjs');
const ai = '@earendil-works/pi-ai';
await isolatedFixture(async ({root, env}) => {
  const forbidden=path.join(root,'third-party-loaded');
  const markerExtension=`import {writeFileSync} from 'node:fs';export default function(){writeFileSync(${JSON.stringify(forbidden)},'loaded');}`;
  const globalExtension=path.join(root,'agent','extensions','discovered.mjs');
  await mkdir(path.dirname(globalExtension),{recursive:true});await writeFile(globalExtension,markerExtension);
  const configured=path.join(root,'configured.mjs');await writeFile(configured,markerExtension);
  const packageDir=path.join(root,'local-package');await mkdir(packageDir);
  await writeFile(path.join(packageDir,'package.json'),JSON.stringify({name:'fixture-package',version:'1.0.0',pi:{extensions:['index.mjs']}}));
  await writeFile(path.join(packageDir,'index.mjs'),markerExtension);
  await writeFile(path.join(root,'agent','settings.json'),JSON.stringify({extensions:[configured],packages:[packageDir]}));
  const fixture = path.join(root, 'provider.mjs');
  await writeFile(fixture, `import { createAssistantMessageEventStream } from ${JSON.stringify(ai)};
export default function(pi) { pi.registerProvider('fixture', {baseUrl:'http://127.0.0.1:1',apiKey:'fixture-not-a-credential', api:'fixture', models:[{id:'offline',name:'Offline',reasoning:false,input:['text'],contextWindow:10000,maxTokens:1000,cost:{input:0,output:0,cacheRead:0,cacheWrite:0}}], streamSimple(model,context){const s=createAssistantMessageEventStream(); const done=context.messages.some(m=>m.role==='toolResult'); const out={role:'assistant',api:'fixture',provider:'fixture',model:'offline',timestamp:Date.now(),usage:{input:0,output:0,cacheRead:0,cacheWrite:0,totalTokens:0,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}},content:done?[{type:'text',text:'done'}]:process.env.FIXTURE_SHELL?[{type:'toolCall',id:'shell',name:'powershell',arguments:{command:process.env.FIXTURE_COMMAND}}]:[{type:'toolCall',id:'one',name:'write',arguments:{path:'marker',content:'approved'}},{type:'toolCall',id:'two',name:'write',arguments:{path:'marker-two',content:'approved'}}],stopReason:done?'stop':'toolUse'};queueMicrotask(()=>{s.push({type:'start',partial:out});s.push({type:'done',reason:out.stopReason,message:out});s.end();});return s;}});}`);
  for (const scenario of ['allow','deny','timeout','stop','shell-allow','shell-deny','shell-stop','shell-running-stop','load-failure']) {
    const cwd = path.join(root, scenario);
    await mkdir(path.join(cwd,'.pi','extensions'),{recursive:true});
    await writeFile(path.join(cwd,'.pi','extensions','project.mjs'),markerExtension);
    await writeFile(path.join(cwd,'.pi','settings.json'),JSON.stringify({extensions:[configured],packages:[packageDir]}));
    const shell=scenario.startsWith('shell-');
    const shellDir='C:\\Windows\\System32\\WindowsPowerShell\\v1.0';
    if(shell)await access(path.join(shellDir,'powershell.exe'));
    const marker = path.join(cwd,'marker');
    const absent = async()=>{await assert.rejects(access(marker));await assert.rejects(access(path.join(cwd,'marker-two')));};
    let hello = false, requested = false, stopping = false;
    const execution = withProcess([cli,'--mode','rpc','--no-session',...(scenario==='load-failure'?['--no-tools']:['--tools','read,write,edit,bash,powershell,grep,find,ls']),'--no-extensions','--no-skills','--no-prompt-templates',scenario.endsWith('allow')?'--approve':'--no-approve','-e',scenario==='load-failure'?path.join(root,'missing.mjs'):gate,'-e',fixture,'--model','fixture/offline'],{cwd,env:{...env,...(shell?{PATH:env.PATH+';'+shellDir+';C:\\Windows\\System32',SystemRoot:'C:\\Windows',FIXTURE_SHELL:'1',FIXTURE_COMMAND:scenario==='shell-running-stop'?"Write-Output 'fixture-started'; Start-Sleep -Seconds 30; [System.IO.File]::WriteAllText((Join-Path (Get-Location) 'marker'), 'too late')":"[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'marker'), 'approved')"}:{}),PI_VSCODE_GATE_ID:'spike',PI_VSCODE_GATE_TIMEOUT:'3000'},timeoutMs:20000},async({child,request})=>{
      const reader=createInterface({input:child.stdout});
      let settle; const settled=new Promise(resolve=>settle=resolve);
      let stopped; const stopDone=new Promise(resolve=>stopped=resolve);
      const lateIds=[];
      let failure; const failed=new Promise((_,reject)=>failure=reject);
      reader.on('line',line=>{ void (async()=>{const m=JSON.parse(line); if(scenario==='shell-running-stop' && m.type==='tool_execution_update' && !stopping){stopping=true;await request('clear_queue');await request('abort');stopped();} if(m.type==='agent_settled')settle(); if(m.type!=='extension_ui_request')return;const e=JSON.parse(m.message);if(e.kind==='hello'){hello=true;child.stdin.write(JSON.stringify({type:'extension_ui_response',id:m.id,confirmed:true})+'\n');return;}requested=true;await absent();if(scenario==='timeout'){lateIds.push(m.id);return;}if(scenario.endsWith('stop') && scenario!=='shell-running-stop'){child.stdin.write(JSON.stringify({type:'extension_ui_response',id:m.id,cancelled:true})+'\n');if(!stopping){stopping=true;await request('clear_queue');await request('abort');stopped();}return;}child.stdin.write(JSON.stringify({type:'extension_ui_response',id:m.id,confirmed:scenario.endsWith('allow')||scenario==='shell-running-stop'})+'\n');})().catch(failure);});
      try {await request('get_state');if(scenario==='load-failure'){assert.equal(hello,false);await absent();return;}await request('prompt',{message:'offline fixture'});await Promise.race([settled,failed]);if(scenario.endsWith('stop'))await Promise.race([stopDone,failed]);for(const id of lateIds)child.stdin.write(JSON.stringify({type:'extension_ui_response',id,confirmed:true})+'\n');await request('get_state');assert.equal(hello,true);assert.equal(requested,true);if(scenario.endsWith('allow')){await access(marker);if(!shell)await access(path.join(cwd,'marker-two'));}else await absent();} finally {reader.close();}
    });
    if (scenario === 'load-failure') { await assert.rejects(execution); await absent(); } else await execution;
    await assert.rejects(access(forbidden));
    console.log('PASS approval bridge '+scenario+'; discovered/settings/package extensions excluded');
  }
});
