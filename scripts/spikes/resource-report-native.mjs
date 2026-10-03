// Opt-in macOS native verification. Requires UI resource consent in the isolated window.
// F5 mode uses the actual debugger launch command in a generated launcher workspace.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, realpath, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const mode = process.argv[2];
assert.ok(mode === 'f5' || mode === 'installed', 'Use f5 or installed [VSIX]');
assert.equal(process.platform, 'darwin', 'This evidence lane is macOS only');
const app = process.env.PI_REPORT_CODE_APP ?? '/Applications/Visual Studio Code.app';
const electron = path.join(app, 'Contents/MacOS/Code');
const root = await realpath(await mkdtemp('/tmp/pi-resource-native-'));
const evidence = path.join(repo, 'dist/goal-eight/wi082', mode);
await mkdir(evidence, { recursive: true });
for (const name of ['home', 'agent', 'tmp', 'project/.pi/prompts', 'project/.pi/skills/native-skill', 'driver', 'launcher/.vscode', 'user/User', 'extensions', 'parent-user/User', 'parent-extensions']) {
  await mkdir(path.join(root, name), { recursive: true });
}
const env = { HOME: path.join(root, 'home'), USERPROFILE: path.join(root, 'home'),
  PI_CODING_AGENT_DIR: path.join(root, 'agent'), PI_OFFLINE: '1', PI_TELEMETRY: '0',
  TMPDIR: path.join(root, 'tmp'), TMP: path.join(root, 'tmp'), TEMP: path.join(root, 'tmp'),
  PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`, LANG: 'en_US.UTF-8',
  PI_REPORT_FIXTURE: root, PI_REPORT_EVIDENCE: evidence, PI_REPORT_MODE: mode };
await writeFile(path.join(root, 'agent/auth.json'), '{}\n');
await writeFile(path.join(root, 'project/.pi/prompts/native-template.md'), '---\ndescription: Native synthetic template\n---\nBODY_MUST_NOT_APPEAR\n');
await writeFile(path.join(root, 'project/.pi/skills/native-skill/SKILL.md'), '---\nname: native-skill\ndescription: Native synthetic skill\n---\nBODY_MUST_NOT_APPEAR\n');
await writeFile(path.join(root, 'project/AGENTS.md'), 'BODY_MUST_NOT_APPEAR\n');
const settings = { 'workbench.startupEditor': 'none', 'workbench.welcomePage.walkthroughs.openOnInstall': false,
  'workbench.secondarySideBar.defaultVisibility': 'visible', 'telemetry.telemetryLevel': 'off',
  'git.openRepositoryInParentFolders': 'never', 'security.workspace.trust.enabled': false,
  'update.mode': 'none', 'extensions.autoCheckUpdates': false, 'extensions.autoUpdate': false,
  'editor.wordWrap': 'on', 'window.title': `PI-RESOURCE-${mode} — \${activeEditorShort}` };
for (const dir of ['user', 'parent-user']) await writeFile(path.join(root, dir, 'User/settings.json'), JSON.stringify(settings));
await writeFile(path.join(root, 'driver/package.json'), JSON.stringify({ name: 'resource-report-verifier', publisher: 'local-fixture', version: '0.0.1', engines: { vscode: '^1.85.0' }, main: './extension.cjs', activationEvents: ['*'] }));
await writeFile(path.join(root, 'driver/extension.cjs'), 'exports.activate = () => {};\n');
await writeFile(path.join(root, 'driver/test.cjs'), `
const vscode = require('vscode');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.env.PI_REPORT_FIXTURE;
const evidence = process.env.PI_REPORT_EVIDENCE;
async function waitFor(label, predicate, timeout = 240000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Timed out: ' + label);
}
exports.run = async () => {
  const record = { mode: process.env.PI_REPORT_MODE, vscode: vscode.version, modelCalls: 0 };
  try {
    const extension = vscode.extensions.getExtension('pi-vscode-dev.pi-vscode');
    assert.ok(extension);
    record.activeBeforeCommand = extension.isActive;
    record.extensionPath = extension.extensionPath;
    record.extensionVersion = extension.packageJSON.version;
    record.piVersion = JSON.parse(await fs.readFile(path.join(extension.extensionPath, 'node_modules/@earendil-works/pi-coding-agent/package.json'), 'utf8')).version;
    await vscode.commands.executeCommand('pi-vscode.showResourceReport');
    const document = vscode.workspace.textDocuments.find(doc => doc.uri.scheme === 'pi-vscode-resources');
    assert.ok(document);
    record.initial = document.getText();
    assert.match(record.initial, /unavailable/);
    assert.doesNotMatch(record.initial, /0 loaded/);
    await vscode.commands.executeCommand('pi-vscode.focusChat');
    await fs.writeFile(path.join(evidence, 'needs-resource-consent.json'), JSON.stringify({ root, initial: record.initial }, null, 2));
    await waitFor('resource consent and live catalogue', () => document.getText().includes('Prompt template definitions: 1 loaded'));
    record.loaded = document.getText();
    assert.match(record.loaded, /native-template/);
    assert.match(record.loaded, /skill:native-skill/);
    assert.match(record.loaded, /AGENTS.md: unknown/);
    assert.match(record.loaded, /Skill bodies in context: unknown/);
    assert.match(record.loaded, /Extension files loaded: unknown/);
    assert.doesNotMatch(record.loaded, /BODY_MUST_NOT_APPEAR|sourceInfo/);
    const editor = await vscode.window.showTextDocument(document, { preview: false });
    const before = document.getText();
    let changed = false;
    try { changed = await editor.edit(edit => edit.insert(new vscode.Position(0, 0), 'MUST_NOT_EDIT')); } catch {}
    record.nativeEditReturned = changed; // Host API may return true when readonly editor rejected the edit.
    assert.equal(document.getText(), before);
    record.readOnly = true;
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    await vscode.commands.executeCommand('pi-vscode.showResourceReport');
    assert.equal(vscode.window.activeTextEditor.document.getText(), record.loaded);
    record.reopen = true;
    await fs.writeFile(path.join(evidence, 'observed.json'), JSON.stringify(record, null, 2));
    await waitFor('agent native visual/keyboard review', async () => { try { await fs.access(path.join(root, 'finish')); return true; } catch { return false; } });
    record.result = 'passed';
    await fs.writeFile(path.join(evidence, 'result.json'), JSON.stringify(record, null, 2));
  } catch (error) {
    await fs.writeFile(path.join(evidence, 'result.json'), JSON.stringify({ ...record, result: 'failed', error: String(error) }, null, 2));
    throw error;
  }
};
`);
// Fixture-only: never consult/persist OS credentials or start account extensions.
const nativeSecretArgs = ['--use-inmemory-secretstorage',
  '--disable-extension=vscode.github-authentication',
  '--disable-extension=vscode.microsoft-authentication'];
const args = [...nativeSecretArgs, `--user-data-dir=${path.join(root, 'user')}`, `--extensions-dir=${path.join(root, 'extensions')}`,
  '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust', '--password-store=basic',
  `--extensionDevelopmentPath=${path.join(root, 'driver')}`, `--extensionTestsPath=${path.join(root, 'driver/test.cjs')}`,
  path.join(root, 'project')];
if (mode === 'f5') {
  args.unshift(`--extensionDevelopmentPath=${repo}`);
  await writeFile(path.join(root, 'launcher/.vscode/launch.json'), JSON.stringify({ version: '0.2.0', configurations: [{
    name: 'Resource report F5', type: 'extensionHost', request: 'launch', runtimeExecutable: electron, args, env, noDebug: true,
  }] }, null, 2));
} else {
  assert.ok(process.argv[3], 'installed mode requires a VSIX path');
  const cli = path.join(app, 'Contents/Resources/app/out/cli.js');
  const output = execFileSync(electron, [cli, '--use-inmemory-secretstorage', `--user-data-dir=${path.join(root, 'user')}`, `--extensions-dir=${path.join(root, 'extensions')}`, '--install-extension', path.resolve(process.argv[3]), '--force'], {
    env: { ...env, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8', windowsHide: true, timeout: 60000,
  });
  await writeFile(path.join(evidence, 'install.log'), output);
}
const launchArgs = mode === 'f5' ? [...nativeSecretArgs, '--new-window', `--user-data-dir=${path.join(root, 'parent-user')}`, `--extensions-dir=${path.join(root, 'parent-extensions')}`, '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust', '--password-store=basic', path.join(root, 'launcher')] : args;
const child = spawn(electron, launchArgs, { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
const log = [];
for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { if (log.length < 2000) log.push(String(data)); });
await writeFile(path.join(evidence, 'fixture.json'), JSON.stringify({ root, mode, repo, pid: child.pid, launchArgs, agentDir: env.PI_CODING_AGENT_DIR }, null, 2));
console.log(JSON.stringify({ mode, root, evidence, pid: child.pid, next: mode === 'f5' ? 'Start Resource report F5 via actual F5/debug UI, then allow synthetic project resources' : 'Allow synthetic project resources' }));
let killTimer;
const deadline = setTimeout(() => { child.kill('SIGTERM'); killTimer = setTimeout(() => child.kill('SIGKILL'), 5000); }, 600000);
child.once('error', error => { console.error(error); process.exitCode = 1; });
const exit = await new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
clearTimeout(deadline); clearTimeout(killTimer);
await writeFile(path.join(evidence, 'native.log'), log.join(''));
await writeFile(path.join(evidence, 'process-exit.json'), JSON.stringify(exit));

try {
  const result = JSON.parse(await readFile(path.join(evidence, 'result.json'), 'utf8'));
  if (result.result !== 'passed') process.exitCode = 1;
} catch { process.exitCode = 1; }
