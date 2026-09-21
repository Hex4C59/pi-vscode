import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolatedFixture, withProcess } from './project-trust-lib.mjs';

const packageDir = fileURLToPath(new URL('../node_modules/@earendil-works/pi-coding-agent/', import.meta.url));
const metadata = JSON.parse(await readFile(path.join(packageDir, 'package.json'), 'utf8'));
assert.equal(metadata.version, '0.85.1', 'Re-review public APIs before upgrading this spike');
// Verify the installed public isolation contract BEFORE importing/executing pi.
const readme = await readFile(path.join(packageDir, 'README.md'), 'utf8');
assert.match(readme, /PI_CODING_AGENT_DIR.*Override config directory/);
assert.match(readme, /--no-approve/);
const environmentDocs = await readFile(path.join(packageDir, 'docs/environment-variables.md'), 'utf8');
assert.match(environmentDocs, /PI_OFFLINE.*Disable startup network operations/);
const cli = path.join(packageDir, metadata.bin.pi);
const sdk = import.meta.resolve('@earendil-works/pi-coding-agent');
const controller = new AbortController();
const cancel = () => controller.abort();
process.once('SIGINT', cancel);
process.once('SIGTERM', cancel);

async function put(file, content) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}

// Only self-authored extensions run; no project package sources/install commands.
function extension(name) {
  return `export default function(pi) { pi.registerCommand(${JSON.stringify(name)}, { description: 'harmless fixture', handler: async () => {} }); }`;
}

async function scenario(choice, savedTrust = false, defaultProjectTrust = 'always') {
  return isolatedFixture(async ({ root, env }) => {
    const a = path.join(root, 'a');
    const b = path.join(root, 'b');
    const agent = env.PI_CODING_AGENT_DIR;
    const observations = path.join(root, 'observations.jsonl');
    await put(path.join(agent, 'settings.json'), JSON.stringify({ defaultProjectTrust }));
    for (const [cwd, label] of [[a, 'a'], [b, 'b']]) {
      await put(path.join(cwd, '.pi/extensions/marker.ts'), extension(`fixture-${label}`));
      await put(path.join(cwd, '.pi/prompts', `fixture-prompt-${label}.md`), 'Harmless fixture prompt.');
      await put(path.join(cwd, '.pi/skills', `fixture-skill-${label}`, 'SKILL.md'), `---\nname: fixture-skill-${label}\ndescription: Harmless fixture\n---\nDo nothing.\n`);
      await put(path.join(cwd, 'AGENTS.md'), `CONTEXT_FIXTURE_${label.toUpperCase()}`);
      await put(path.join(cwd, '.pi/APPEND_SYSTEM.md'), `SYSTEM_FIXTURE_${label.toUpperCase()}`);
      await put(path.join(cwd, '.pi/settings.json'), JSON.stringify({ thinkingLevel: 'off' }));
    }
    const observer = `import { appendFileSync } from 'node:fs';
export default function(pi) {
  pi.registerCommand('fixture-global', { handler: async () => {} });
  pi.on('session_start', (_event, ctx) => {
    const prompt = ctx.getSystemPrompt();
    appendFileSync(${JSON.stringify(observations)}, JSON.stringify({ cwd: ctx.cwd, reason: _event.reason,
      contextA: prompt.includes('CONTEXT_FIXTURE_A'), contextB: prompt.includes('CONTEXT_FIXTURE_B'),
      systemA: prompt.includes('SYSTEM_FIXTURE_A'), systemB: prompt.includes('SYSTEM_FIXTURE_B') }) + '\\n');
  });
}`;
    await put(path.join(agent, 'extensions/observer.ts'), observer);

    // SessionManager runs in a separate, already-isolated process, not the host.
    // appendMessage with a synthetic assistant completion persists the fixture;
    // it is not a model request. Never read or construct a session file ourselves.
    const fixtureCode = `import { SessionManager } from ${JSON.stringify(sdk)};
const sm = SessionManager.create(${JSON.stringify(b)}, ${JSON.stringify(path.join(root, 'sessions'))});
sm.appendMessage({ role: 'user', content: 'Harmless fixture', timestamp: 0 });
sm.appendMessage({ role: 'assistant', content: [{ type: 'text', text: 'Synthetic fixture; no model call' }],
 api: 'anthropic-messages', provider: 'anthropic', model: 'fixture', timestamp: 0, stopReason: 'stop',
 usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
 cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } } });
process.stdin.once('data', () => console.log(JSON.stringify({ type: 'response', id: '1', success: true,
 data: { sessionPath: sm.getSessionFile(), persisted: sm.isPersisted(), cwd: sm.getCwd() } })));`;
    const fixture = await withProcess(['--input-type=module', '--eval', fixtureCode],
      { cwd: b, env, signal: controller.signal }, ({ request }) => request('fixture'));
    assert.equal(fixture.persisted, true);
    assert.equal(fixture.cwd, b);

    if (savedTrust) {
      // Public project_trust extension hook is the ONLY writer of saved trust.
      await put(path.join(agent, 'extensions/remember.ts'), `export default function(pi) {
        pi.on('project_trust', () => ({ trusted: 'yes', remember: true }));
      }`);
      for (const cwd of [a, b]) {
        await withProcess([cli, '--mode', 'rpc', '--no-session'], { cwd, env, signal: controller.signal },
          ({ request }) => request('get_commands'));
      }
      // Remove the hook so explicit overrides are tested against saved state alone.
      await put(path.join(agent, 'extensions/remember.ts'), 'export default function() {}');
      await put(path.join(agent, 'settings.json'), JSON.stringify({ defaultProjectTrust: 'never' }));
      for (const [cwd, label] of [[a, 'a'], [b, 'b']]) {
        const baseline = await withProcess([cli, '--mode', 'rpc', '--no-session'], { cwd, env, signal: controller.signal },
          ({ request }) => request('get_commands'));
        assert.ok(baseline.commands.some(command => command.name === `fixture-${label}`), 'saved trust must override never without the hook');
      }
      await put(path.join(agent, 'settings.json'), JSON.stringify({ defaultProjectTrust }));
    }
    await writeFile(observations, '');
    const args = [cli, '--mode', 'rpc', '--no-session', ...(choice ? [choice] : [])];
    const result = await withProcess(args, { cwd: a, env, signal: controller.signal }, async ({ request }) => {
      const startup = await request('get_commands');
      const switched = await request('switch_session', { sessionPath: fixture.sessionPath });
      assert.equal(switched.cancelled, false);
      const afterSwitch = await request('get_commands');
      return { startup, afterSwitch };
    });
    const events = (await readFile(observations, 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
    const names = data => data.commands.map(command => command.name).filter(name => name.startsWith('fixture-') || name.startsWith('skill:fixture-')).sort();
    const startup = names(result.startup);
    const afterSwitch = names(result.afterSwitch);
    const approved = choice === '--approve' || (choice === undefined && defaultProjectTrust === 'always');
    for (const [commands, label] of [[startup, 'a'], [afterSwitch, 'b']]) {
      assert.ok(commands.includes('fixture-global'));
      for (const marker of [`fixture-${label}`, `fixture-prompt-${label}`, `skill:fixture-skill-${label}`]) {
        assert.equal(commands.includes(marker), approved, `${choice}: ${marker}`);
      }
    }
    for (const oldMarker of ['fixture-a', 'fixture-prompt-a', 'skill:fixture-skill-a']) {
      assert.ok(!afterSwitch.includes(oldMarker), 'old cwd resource must not remain');
    }
    assert.ok(events.length >= 2);
    assert.equal(events[0].cwd, a);
    assert.equal(events.at(-1).cwd, b);
    for (const event of events) {
      const inA = event.cwd === a;
      assert.equal(event.contextA, inA);
      assert.equal(event.contextB, !inA);
      assert.equal(event.systemA, approved && inA);
      assert.equal(event.systemB, approved && !inA);
    }
    return { choice: choice ?? 'global-default-baseline', defaultProjectTrust, savedTrust,
      savedTrustVerifiedWithoutHook: savedTrust, startup, afterSwitch,
      observations: events.map(({ cwd, ...event }) => ({ ...event, cwd: cwd === a ? 'a' : 'b' })) };
  });
}

try {
  const scenarios = [];
  for (const choice of [undefined, '--approve', '--no-approve']) scenarios.push(await scenario(choice));
  scenarios.push(await scenario('--no-approve', true));
  scenarios.push(await scenario(undefined, false, 'never'));
  scenarios.push(await scenario('--approve', false, 'never'));
  console.log(JSON.stringify({ version: metadata.version, isolation: 'public PI_CODING_AGENT_DIR + PI_OFFLINE=1 + PI_TELEMETRY=0 + minimal environment + temporary cwd/HOME',
    scenarios, limitations: [
      'No OS network sandbox: no model/network requests or package installs are initiated by this harness; outbound traffic is not independently audited.',
      'Project settings effect and themes are not independently observed; project packages are intentionally not installed.',
      'Context/system prompt observations are snapshots from the public session_start/getSystemPrompt API, not model payload verification.',
      'No real user trust or credentials are read or modified. Gate remains Open; product UI is not connected.'
    ], cleanup: 'All owned processes closed and temporary fixtures removed' }, null, 2));
} finally {
  process.off('SIGINT', cancel);
  process.off('SIGTERM', cancel);
}
