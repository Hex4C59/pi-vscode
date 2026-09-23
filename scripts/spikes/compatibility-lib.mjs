import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Probe-client routing only, not a product implementation or an upstream guarantee.
export function dialogLedger() {
  const active = new Set();
  const key = (generation, id) => JSON.stringify([generation, id]);
  return {
    open(generation, id) { active.add(key(generation, id)); },
    invalidate(generation, id) { return active.delete(key(generation, id)); },
    take(generation, id) { return active.delete(key(generation, id)); },
  };
}

export async function withFixture(run) {
  const root = await mkdtemp(path.join(tmpdir(), 'pi-compat-'));
  try {
    for (const name of ['home', 'agent', 'tmp', 'a', 'b']) await mkdir(path.join(root, name));
    const env = {
      HOME: path.join(root, 'home'), USERPROFILE: path.join(root, 'home'),
      PI_CODING_AGENT_DIR: path.join(root, 'agent'), PI_OFFLINE: '1', PI_TELEMETRY: '0',
      TMPDIR: path.join(root, 'tmp'), TEMP: path.join(root, 'tmp'), TMP: path.join(root, 'tmp'),
      PATH: path.dirname(process.execPath), LANG: 'C.UTF-8', TERM: 'dumb',
    };
    return await run({ root, env });
  } finally {
    try { await rm(root, { recursive: true, force: true }); }
    catch { throw new Error(`fixture-cleanup-failed:${root}`); }
  }
}

export async function withRpc(args, options, run) {
  const child = spawn(process.execPath, args, { cwd: options.cwd, env: options.env, stdio: ['pipe', 'pipe', 'pipe'] });
  let sequence = 0;
  let bytes = 0;
  let buffer = '';
  let terminalError;
  let ownerShutdown = false;
  let closedBeforeShutdown = false;
  let observingEof = false;
  let rejectFailure;
  const failure = new Promise((_, reject) => { rejectFailure = reject; });
  failure.catch(() => {});
  const pending = new Map();
  const events = [];
  const waiters = new Set();
  const timers = new Set();
  const fail = reason => {
    terminalError ??= new Error(reason);
    if (!ownerShutdown) rejectFailure(terminalError);
    for (const p of pending.values()) p.reject(terminalError);
    for (const w of waiters) w.reject(terminalError);
  };
  let closed = false;
  const close = new Promise(resolve => child.once('close', (code, signal) => {
    closedBeforeShutdown = !ownerShutdown;
    closed = true;
    if (observingEof && code === 0 && !terminalError) {
      for (const p of pending.values()) p.reject(new Error('rpc-eof'));
      for (const w of waiters) w.reject(new Error('rpc-eof'));
    } else fail(`rpc-exit:${code}:${signal}`);
    resolve({ code, signal });
  }));
  child.on('error', () => fail('rpc-spawn-error'));
  child.stdin.on('error', () => fail('rpc-input-error'));
  const budget = chunk => {
    bytes += Buffer.byteLength(chunk);
    if (bytes > (options.logLimit ?? 65536)) { fail('rpc-log-budget'); child.kill('SIGTERM'); return false; }
    return true;
  };
  child.stderr.on('data', budget);
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    if (!budget(chunk)) return;
    buffer += chunk;
    let index;
    while ((index = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, index).replace(/\r$/, ''); buffer = buffer.slice(index + 1);
      if (!line) continue;
      let message;
      try { message = JSON.parse(line); } catch { fail('rpc-invalid-json'); continue; }
      if (!message || typeof message.type !== 'string') { fail('rpc-invalid-envelope'); continue; }
      if (message.type === 'response') {
        const p = pending.get(message.id);
        if (p && p.type === message.command && typeof message.success === 'boolean') p.resolve(message);
      } else {
        events.push(message);
        for (const w of waiters) if (w.predicate(message)) { waiters.delete(w); w.resolve(message); }
      }
    }
  });
  const bounded = async (install, remove) => {
    if (terminalError) throw terminalError;
    let timer;
    try {
      return await new Promise((resolve, reject) => {
        timer = setTimeout(() => { fail('rpc-request-timeout'); reject(terminalError); }, options.requestMs ?? 10000);
        timers.add(timer); install(resolve, reject);
      });
    } finally { clearTimeout(timer); timers.delete(timer); remove(); }
  };
  const send = message => {
    if (terminalError) throw terminalError;
    child.stdin.write(`${JSON.stringify(message)}\n`);
  };
  const rpc = {
    events, send,
    request(type, fields = {}) {
      const id = `${options.generation}:${++sequence}`;
      return bounded((resolve, reject) => {
        pending.set(id, { type, resolve, reject }); send({ ...fields, type, id });
      }, () => pending.delete(id));
    },
    wait(predicate) {
      const existing = events.find(predicate);
      if (existing) return Promise.resolve(existing);
      let waiter;
      return bounded((resolve, reject) => { waiter = { predicate, resolve, reject }; waiters.add(waiter); }, () => waiters.delete(waiter));
    },
    async disconnectAndObserve(ms = 5000) {
      if (terminalError) throw terminalError;
      observingEof = true;
      child.stdin.end();
      let timer;
      try {
        return await Promise.race([
          close.then(exit => ({ natural: true, ...exit })),
          new Promise(resolve => { timer = setTimeout(() => resolve({ natural: false }), ms); }),
        ]);
      } finally { clearTimeout(timer); }
    },
  };
  let scenarioTimer;
  const deadline = new Promise((_, reject) => {
    scenarioTimer = setTimeout(() => { fail('rpc-scenario-timeout'); reject(terminalError); }, options.timeoutMs ?? 60000);
  });
  try { return await Promise.race([Promise.resolve().then(() => run(rpc)), deadline, failure]); }
  finally {
    clearTimeout(scenarioTimer);
    const priorFailure = terminalError;
    ownerShutdown = true;
    fail('rpc-disposed');
    for (const timer of timers) clearTimeout(timer);
    child.stdin.destroy();
    if (!closed) child.kill('SIGTERM');
    const killTimer = setTimeout(() => { if (!closed) child.kill('SIGKILL'); }, 500);
    let exitTimer;
    try {
      const exit = await Promise.race([close, new Promise((_, reject) => {
        exitTimer = setTimeout(() => reject(new Error('rpc-close-unconfirmed')), 5000);
      })]);
      options.onExit?.({ ...exit, ownerShutdown: !closedBeforeShutdown });
      if (!priorFailure && exit.code !== 0 && !(exit.code === null && ['SIGTERM', 'SIGKILL'].includes(exit.signal))) {
        throw new Error(`rpc-exit:${exit.code}:${exit.signal}`);
      }
    } finally {
      clearTimeout(killTimer); clearTimeout(exitTimer);
      child.removeAllListeners(); child.stdout.removeAllListeners(); child.stderr.removeAllListeners();
      if (!closed) { child.stdout.destroy(); child.stderr.destroy(); child.unref(); }
    }
  }
}

// Transport seam only: tests run harmless Node children, never pi.
export async function runChild(args, { cwd, env, timeoutMs = 60000, logLimit = 65536 }) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let failure;
  let stdout = '';
  let bytes = 0;
  let killTimer;
  const stop = reason => {
    failure ??= new Error(reason);
    child.kill('SIGTERM');
    killTimer ??= setTimeout(() => child.kill('SIGKILL'), 500);
  };
  const consume = (chunk, output) => {
    bytes += chunk.length;
    if (bytes > logLimit) stop('log-budget');
    else if (output) stdout += chunk.toString('utf8');
  };
  child.stdout.on('data', chunk => consume(chunk, true));
  child.stderr.on('data', chunk => consume(chunk, false));
  const timer = setTimeout(() => stop('child-timeout'), timeoutMs);
  let closeTimer;
  try {
    return await new Promise((resolve, reject) => {
      // Final deadline is independent of whether termination succeeds.
      closeTimer = setTimeout(() => {
        child.kill('SIGKILL');
        child.stdout.destroy(); child.stderr.destroy(); child.unref();
        reject(Object.assign(new Error('child-close-unconfirmed'), { stdout }));
      }, timeoutMs + 5000);
      child.once('error', () => { failure ??= new Error('child-spawn-error'); });
      child.once('close', (code, signal) => {
        if (failure) reject(Object.assign(failure, { stdout }));
        else if (code !== 0) reject(Object.assign(new Error(`child-exit:${code}`), { stdout }));
        else resolve({ stdout, code, signal });
      });
    });
  } finally {
    clearTimeout(timer); clearTimeout(killTimer); clearTimeout(closeTimer);
    child.removeAllListeners(); child.stdout.removeAllListeners(); child.stderr.removeAllListeners();
  }
}
