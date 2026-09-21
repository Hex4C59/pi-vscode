import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { isolatedFixture, withProcess } from '../spikes/project-trust-lib.mjs';
// VSIX is a ZIP. Inspect central directory and extract to an owned temporary tree.
const archive=await readFile(process.argv[2]??'dist/pi-vscode-validation.vsix');
let end=archive.length-22;
while(end>=Math.max(0,archive.length-65557)&&archive.readUInt32LE(end)!==0x06054b50)end--;
assert.ok(end>=0,'ZIP end directory missing');
let cursor=archive.readUInt32LE(end+16);
const count=archive.readUInt16LE(end+10);const entries=[];
for(let i=0;i<count;i++){
  assert.equal(archive.readUInt32LE(cursor),0x02014b50);
  const method=archive.readUInt16LE(cursor+10),size=archive.readUInt32LE(cursor+20),offset=archive.readUInt32LE(cursor+42);
  const length=archive.readUInt16LE(cursor+28),extra=archive.readUInt16LE(cursor+30),comment=archive.readUInt16LE(cursor+32);
  const name=archive.toString('utf8',cursor+46,cursor+46+length);entries.push({name,method,size,offset});cursor+=46+length+extra+comment;
}
const cliRelative='extension/node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js';
for(const required of [cliRelative,'extension/dist/approval-gate.mjs','extension/dist/extension.js','extension/node_modules/@earendil-works/pi-coding-agent/package.json'])assert.ok(entries.some(e=>e.name===required),required);
assert.ok(entries.some(e=>e.name.startsWith('extension/node_modules/@earendil-works/pi-coding-agent/node_modules/')),'production transitive dependencies missing');
await isolatedFixture(async({root,env})=>{
  const extracted=path.join(root,'unpacked');
  for(const e of entries){
    const target=path.resolve(extracted,e.name);assert.ok(target.startsWith(extracted+path.sep));
    if(e.name.endsWith('/')){await mkdir(target,{recursive:true});continue;}
    assert.equal(archive.readUInt32LE(e.offset),0x04034b50);
    const start=e.offset+30+archive.readUInt16LE(e.offset+26)+archive.readUInt16LE(e.offset+28);
    const compressed=archive.subarray(start,start+e.size);assert.ok(e.method===0||e.method===8);
    await mkdir(path.dirname(target),{recursive:true});await writeFile(target,e.method===8?inflateRawSync(compressed):compressed);
  }
  const pkg=JSON.parse(await readFile(path.join(extracted,'extension/node_modules/@earendil-works/pi-coding-agent/package.json'),'utf8'));assert.equal(pkg.version,'0.86.1');
  let handshake=false;
  await withProcess([path.join(extracted,cliRelative),'--mode','rpc','--offline','--no-session','--no-tools','--no-extensions','--no-approve','-e',path.join(extracted,'extension/dist/approval-gate.mjs')],{cwd:path.join(root,'a'),env:{...env,PI_VSCODE_GATE_ID:'vsix-validation'},timeoutMs:20000},async({child,request})=>{
    const reader=createInterface({input:child.stdout});reader.on('line',line=>{const m=JSON.parse(line);if(m.type==='extension_ui_request'&&m.method==='notify'){try{const e=JSON.parse(m.message);handshake=e.protocol==='pi-vscode-approval'&&e.kind==='hello'&&e.runtime==='vsix-validation';}catch{}}});
    try{await request('get_state');assert.equal(handshake,true);}finally{reader.close();}
  });
});
console.log(`PASS VSIX: ${count} entries, pinned pi 0.86.1 CLI and production dependencies; extracted RPC readiness and gate handshake`);
