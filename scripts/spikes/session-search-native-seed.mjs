// Owned synthetic sessions via the public SDK, never session-file editing.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
export async function seedNativeSessions(repo, root, env, evidence) {
  const sdk = pathToFileURL(path.join(repo, 'node_modules/@earendil-works/pi-coding-agent/dist/index.js')).href;
  const source = `import {SessionManager} from ${JSON.stringify(sdk)};
for (const [directory,count,prefix] of [['project',40,'SYNTHETIC_META'],['foreign-project',3,'FOREIGN_ONLY']]) {
 for(let index=0;index<count;index++) {
  const manager=SessionManager.create(${JSON.stringify(root)}+'/'+directory);
  manager.appendModelChange('queue-loopback','queue-fixture');
  manager.appendThinkingLevelChange('medium');
  manager.appendMessage({role:'user',content:[{type:'text',text:prefix+' '+index}],timestamp:index});
  if(index%2) manager.appendSessionInfo('Named '+String(index).padStart(4,'0'));
  manager.appendMessage({role:'assistant',content:[{type:'text',text:'SYNTHETIC_REPLY'}],api:'openai-completions',provider:'queue-loopback',model:'queue-fixture',
   usage:{input:0,output:0,cacheRead:0,cacheWrite:0,totalTokens:0,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}},stopReason:'stop',timestamp:index});
 }
}`;
  const created = spawnSync(process.execPath, ['--input-type=module', '--eval', source], {
    cwd: path.join(root, 'project'), env, encoding: 'utf8', windowsHide: true,
    timeout: 60000, maxBuffer: 65536,
  });
  assert.ifError(created.error);
  assert.equal(created.status, 0, 'Public SDK session seed failed: ' + created.stderr);
  await writeFile(path.join(evidence, 'seed.json'), JSON.stringify({ method: 'public SessionManager SDK',
    currentProject: 40, foreignProject: 3, inferenceRequests: 0, root }, null, 2));
}
