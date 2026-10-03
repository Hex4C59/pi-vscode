// Opt-in actual macOS compaction verification; UI consent and per-case native review required.
// F5 mode uses the actual debugger launch command in a generated launcher workspace.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, realpath, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLoopbackProvider } from './queued-input-fixture.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const mode = process.argv[2];
assert.ok(mode === 'f5' || mode === 'installed', 'Use f5 or installed [VSIX]');
assert.equal(process.platform, 'darwin', 'This evidence lane is macOS only');
const app = process.env.PI_COMPACTION_CODE_APP ?? '/Applications/Visual Studio Code.app';
const electron = path.join(app, 'Contents/MacOS/Code');
const root = await realpath(await mkdtemp('/tmp/pi-compaction-native-'));
const evidence = path.join(repo, 'dist/goal-eight/wi083', mode);
await mkdir(evidence, { recursive: true });
for (const name of ['home', 'agent', 'tmp', 'project', 'driver', 'launcher/.vscode', 'user/User', 'extensions', 'parent-user/User', 'parent-extensions']) {
  await mkdir(path.join(root, name), { recursive: true });
}
const env = { HOME: path.join(root, 'home'), USERPROFILE: path.join(root, 'home'),
  PI_CODING_AGENT_DIR: path.join(root, 'agent'), PI_OFFLINE: '1', PI_TELEMETRY: '0',
  TMPDIR: path.join(root, 'tmp'), TMP: path.join(root, 'tmp'), TEMP: path.join(root, 'tmp'),
  PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`, LANG: 'en_US.UTF-8',
  PI_COMPACTION_FIXTURE: root, PI_COMPACTION_EVIDENCE: evidence, PI_COMPACTION_MODE: mode };
await writeFile(path.join(root, 'agent/auth.json'), '{}\n');
const provider = await createLoopbackProvider(new Set(Array.from({ length: 64 }, (_, i) => i + 1)));
const released = new Set();
let polling = false;
let monitor;
try {
const model = { id: 'queue-fixture', name: 'Synthetic compaction fixture', reasoning: false,
  input: ['text'], contextWindow: 10000, maxTokens: 1000,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } };
await writeFile(path.join(root, 'agent/models.json'), JSON.stringify({ providers: {
  'queue-loopback': { baseUrl: provider.url, api: 'openai-completions', apiKey: 'fixture-not-secret', models: [model] },
} }));
await writeFile(path.join(root, 'agent/settings.json'), JSON.stringify({
  defaultProvider: 'queue-loopback', defaultModel: 'queue-fixture',
  compaction: { enabled: false, keepRecentTokens: 1, reserveTokens: 100 },
}));
await writeFile(path.join(root, 'project/SYNTHETIC.txt'), 'Owned synthetic compaction fixture. No real source or accounts.\n');
const settings = { 'workbench.startupEditor': 'none', 'workbench.welcomePage.walkthroughs.openOnInstall': false,
  'workbench.secondarySideBar.defaultVisibility': 'visible', 'telemetry.telemetryLevel': 'off',
  'git.openRepositoryInParentFolders': 'never', 'security.workspace.trust.enabled': false,
  'update.mode': 'none', 'extensions.autoCheckUpdates': false, 'extensions.autoUpdate': false,
  'editor.wordWrap': 'on', 'window.title': `PI-COMPACTION-${mode} — \${activeEditorShort}` };
for (const dir of ['user', 'parent-user']) await writeFile(path.join(root, dir, 'User/settings.json'), JSON.stringify(settings));
await writeFile(path.join(root, 'driver/package.json'), JSON.stringify({ name: 'manual-compaction-verifier', publisher: 'local-fixture', version: '0.0.1', engines: { vscode: '^1.85.0' }, main: './extension.cjs', activationEvents: ['*'] }));
await writeFile(path.join(root, 'driver/extension.cjs'), 'exports.activate = () => {};\n');
await writeFile(path.join(root, 'driver/test.cjs'), await readFile(new URL('./manual-compaction-native-driver.cjs', import.meta.url)));
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
    name: 'Manual compaction F5', type: 'extensionHost', request: 'launch', runtimeExecutable: electron, args, env, noDebug: true,
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
monitor = setInterval(async () => {
  if (polling) return;
  polling = true;
  try {
    for (let n = 1; n <= provider.requests.length; n++) {
      if (released.has(n)) continue;
      try { await readFile(path.join(root, 'release-' + n)); }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      released.add(n); provider.release(n);
    }
    await writeFile(path.join(evidence, 'provider-live.json'), JSON.stringify({ requests: provider.requests, released: [...released] }, null, 2));
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { polling = false; }
}, 250);
const child = spawn(electron, launchArgs, { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
const log = [];
for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { if (log.length < 2000) log.push(String(data)); });
await writeFile(path.join(evidence, 'fixture.json'), JSON.stringify({ root, mode, repo, pid: child.pid, launchArgs, agentDir: env.PI_CODING_AGENT_DIR }, null, 2));
console.log(JSON.stringify({ mode, root, evidence, pid: child.pid, next: mode === 'f5' ? 'Start Manual compaction F5 via actual F5/debug UI, then allow synthetic project resources' : 'Allow synthetic project resources' }));
let killTimer;
const deadline = setTimeout(() => { child.kill('SIGTERM'); killTimer = setTimeout(() => child.kill('SIGKILL'), 5000); }, 1800000);
child.once('error', error => { console.error(error); process.exitCode = 1; });
const exit = await new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
clearTimeout(deadline); clearTimeout(killTimer);
await writeFile(path.join(evidence, 'native.log'), log.join(''));
await writeFile(path.join(evidence, 'process-exit.json'), JSON.stringify(exit));

try {
  const result = JSON.parse(await readFile(path.join(evidence, 'result.json'), 'utf8'));
  assert.equal(exit.code, 0, 'Owned native process must exit successfully');
  assert.equal(result.result, 'review-complete');
  assert.ok(provider.requests.length >= 3, 'Real synthetic history/summary requests required');
  assert.ok(provider.requests.some(request => JSON.stringify(request.messages).includes('LITERAL_CUSTOM_中')), 'Actual summary custom instructions must be observed');
} catch { process.exitCode = 1; }

} finally {
  clearInterval(monitor);
  while (polling) await new Promise(resolve => setTimeout(resolve, 10));
  await provider.close();
  await writeFile(path.join(evidence, 'provider.json'), JSON.stringify({ closed: true,
    realModelCalls: 0, requests: provider.requests, released: [...released],
    limits: 'Loopback synthetic requests only; UI outcomes require explicit native review' }, null, 2));
}
