// Explicit keyless actual-pi evidence, not a default spec or native VS Code evidence.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolatedFixture, withProcess } from './project-trust-lib.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = path.join(root, 'dist/goal-eight/wi082/runtime-report.json');
const pkg = path.join(root, 'node_modules/@earendil-works/pi-coding-agent');
const version = JSON.parse(await readFile(path.join(pkg, 'package.json'), 'utf8')).version;
assert.equal(version, '0.86.1', 'Re-review public get_commands before upgrading');
const records = [];
await isolatedFixture(async ({ root: fixture, env }) => {
  const cwd = path.join(fixture, 'a');
  const prompts = path.join(cwd, '.pi/prompts');
  const skills = path.join(cwd, '.pi/skills/report-fixture');
  await mkdir(prompts, { recursive: true });
  await mkdir(skills, { recursive: true });
  await writeFile(path.join(prompts, 'report-template.md'), '---\ndescription: Synthetic report template\n---\nTEMPLATE_BODY_NOT_A_LOADING_REPORT\n');
  await writeFile(path.join(skills, 'SKILL.md'), '---\nname: report-fixture\ndescription: Synthetic report skill\n---\nSKILL_BODY_NOT_A_LOADING_REPORT\n');
  await writeFile(path.join(cwd, 'AGENTS.md'), 'CONTEXT_BODY_NOT_A_LOADING_REPORT\n');
  const entry = path.join(fixture, 'report-extension.mjs');
  await writeFile(entry, 'export default function(pi) { pi.registerCommand("report-extension", {description:"Synthetic command",handler:async()=>{}}); }\n');
  for (const profile of ['controlled', 'trusted']) {
    const args = [path.join(pkg, 'dist/cli.js'), '--mode', 'rpc', '--no-session', '--no-extensions', '--approve'];
    if (profile === 'trusted') args.push('-e', entry);
    let exited = false;
    await withProcess(args, { cwd, env, timeoutMs: 20000 }, async ({ request, child }) => {
      child.once('close', () => { exited = true; });
      const data = await request('get_commands');
      assert.ok(data.commands.some(item => item.name === 'report-template' && item.source === 'prompt'));
      assert.ok(data.commands.some(item => item.name === 'skill:report-fixture' && item.source === 'skill'));
      assert.equal(data.commands.some(item => item.name === 'report-extension'), profile === 'trusted');
      assert.doesNotMatch(JSON.stringify(data), /BODY_NOT_A_LOADING_REPORT/);
      records.push({ profile, commands: data.commands.map(({ name, source }) => ({ name, source })),
        unknown: ['AGENTS.md bodies', 'skill bodies in context', 'complete extension-file inventory'] });
    });
    assert.equal(exited, true, 'observe closure before claiming cleanup');
    records.at(-1).observedClose = true;
  }
});
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify({ version, evidence: 'actual pi RPC; isolated HOME and agent/project state',
  modelCalls: 0, records, limits: ['not real VS Code, F5, installed VSIX or arbitrary extension compatibility'] }, null, 2) + '\n');
console.log(output);
