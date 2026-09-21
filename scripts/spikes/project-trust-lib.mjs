import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';

// Spike-only policy: VS Code trust is eligibility, never pi approval.
export function preflight({ folders, trusted }) {
  if (folders.length !== 1) return { allowed: false, reason: 'single-folder-required' };
  if (folders[0].scheme !== 'file') return { allowed: false, reason: 'local-folder-required' };
  if (!trusted) return { allowed: false, reason: 'workspace-untrusted' };
  return { allowed: true, requiresPiChoice: true };
}

export function startIfEligible(workspace, start) {
  const decision = preflight(workspace);
  return decision.allowed ? start(decision) : decision;
}

export async function isolatedFixture(run) {
  const root = await mkdtemp(path.join(tmpdir(), 'pi-trust-spike-'));
  try {
    for (const name of ['home', 'agent', 'tmp', 'a', 'b']) {
      await mkdir(path.join(root, name));
    }
    // Do not inherit tokens, NODE_OPTIONS, proxies, XDG paths, or user PATH.
    const env = {
      HOME: path.join(root, 'home'), USERPROFILE: path.join(root, 'home'),
      PI_CODING_AGENT_DIR: path.join(root, 'agent'),
      PI_OFFLINE: '1', PI_TELEMETRY: '0',
      TMPDIR: path.join(root, 'tmp'), TMP: path.join(root, 'tmp'), TEMP: path.join(root, 'tmp'),
      PATH: path.dirname(process.execPath), LANG: 'C.UTF-8', TERM: 'dumb',
    };
    return await run({ root, env });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

// One owned process; deadline/cancellation covers startup and all RPC requests.
// Stop waits for close (including SIGKILL escalation) before fixture deletion.
export async function withProcess(args, options, run) {
  options.signal?.throwIfAborted();
  const child = spawn(process.execPath, args, {
    cwd: options.cwd, env: options.env, stdio: ['pipe', 'pipe', 'pipe'],
  });
  let rejectFailure;
  const failure = new Promise((_, reject) => { rejectFailure = reject; });
  // Avoid an unhandled rejection during finally/cleanup.
  failure.catch(() => {});
  const fail = () => rejectFailure(new Error('Spike process failed or closed'));
  const closed = new Promise(resolve => child.once('close', resolve));
  child.on('error', fail);
  child.on('close', fail);
  child.stdin.on('error', fail);
  child.stderr.resume(); // Never log arbitrary runtime output or credentials.
  const reader = createInterface({ input: child.stdout });
  let sequence = 0;
  let pending;
  const onLine = line => {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    if (message.type === 'response' && message.id === pending?.id) {
      const { resolve, reject } = pending;
      pending = undefined;
      if (message.success) resolve(message.data);
      else reject(new Error(`RPC ${message.command} failed`));
    }
  };
  reader.on('line', onLine);
  const abort = () => rejectFailure(new Error('Spike cancelled'));
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) abort();
  const timer = setTimeout(() => rejectFailure(new Error('Spike timed out')), options.timeoutMs ?? 15000);
  const request = (type, fields = {}) => {
    if (pending) throw new Error('Only sequential spike requests supported');
    const id = String(++sequence);
    const response = new Promise((resolve, reject) => { pending = { id, resolve, reject }; });
    child.stdin.write(`${JSON.stringify({ ...fields, type, id })}\n`);
    return Promise.race([response, failure]);
  };
  try {
    return await Promise.race([Promise.resolve().then(() => run({ request, child })), failure]);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
    reader.off('line', onLine);
    reader.close();
    child.stdin.destroy();
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    const killTimer = setTimeout(() => child.kill('SIGKILL'), 500);
    await closed;
    clearTimeout(killTimer);
    child.off('error', fail);
    child.off('close', fail);
    child.stdin.off('error', fail);
  }
}
