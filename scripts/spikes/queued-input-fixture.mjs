import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  promise.catch(() => {});
  return { promise, resolve, reject };
}

function reply(response, text) {
  if (response.destroyed) return;
  response.writeHead(200, { 'Content-Type': 'text/event-stream' });
  const base = { id: 'fixture', object: 'chat.completion.chunk', created: 0, model: 'queue-fixture' };
  const chunk = (delta, finish_reason) => 'data: ' + JSON.stringify({ ...base, choices: [{ index: 0, delta, finish_reason }] }) + '\n\n';
  response.write(chunk({ role: 'assistant', content: text }, null));
  response.write(chunk({}, 'stop'));
  response.end('data: [DONE]\n\n');
}

export async function createLoopbackProvider() {
  const requests = [];
  const held = new Map();
  const arrival = new Map();
  const failures = deferred();
  const server = createServer((request, response) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', part => { body += part; if (body.length > 1048576) request.destroy(new Error('Fixture body budget exceeded')); });
    request.on('error', error => { failures.reject(error); response.destroy(); });
    request.on('end', () => {
      try {
        assert.equal(request.method, 'POST');
        assert.equal(request.url, '/v1/chat/completions');
        requests.push(JSON.parse(body));
        const number = requests.length;
        if (number <= 2) held.set(number, response);
        else reply(response, number === 3 ? 'STEER_RESULT' : 'FOLLOW_RESULT');
        arrival.get(number)?.resolve();
      } catch (error) { failures.reject(error); response.destroy(); }
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return {
    requests, url: `http://127.0.0.1:${server.address().port}/v1`,
    waitFor(number) {
      if (requests.length >= number) return Promise.resolve();
      if (!arrival.has(number)) arrival.set(number, deferred());
      return Promise.race([arrival.get(number).promise, failures.promise]);
    },
    release(number) { assert.ok(held.has(number)); reply(held.get(number), 'BASE_RESULT'); held.delete(number); },
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); },
  };
}

function createRpcDriver(child, attachReader) {
  const failure = deferred();
  const requests = new Map();
  const idle = new Set();
  let sequence = 0;
  let running = false;
  const fail = error => { failure.reject(error); for (const waiter of idle) waiter.reject(error); };
  const detach = attachReader(child.stdout, line => {
    try {
      const frame = JSON.parse(line);
      if (frame.type === 'response') {
        const request = requests.get(frame.id);
        if (!request) return;
        assert.equal(frame.command, request.type);
        assert.equal(typeof frame.success, 'boolean');
        requests.delete(frame.id); request.resolve(frame);
      }
      if (frame.type === 'agent_start') running = true;
      if (frame.type === 'agent_settled') { running = false; for (const waiter of idle) waiter.resolve(); idle.clear(); }
    } catch (error) { fail(error); }
  }, () => fail(new Error('Runtime frame budget exceeded')));
  const response = (type, fields = {}) => {
    const id = `queue-spike-${++sequence}`;
    const waiting = { ...deferred(), type };
    requests.set(id, waiting);
    child.stdin.write(JSON.stringify({ ...fields, id, type }) + '\n');
    return Promise.race([waiting.promise, failure.promise]);
  };
  return {
    response,
    async request(type, fields) { const result = await response(type, fields); assert.equal(result.success, true, `RPC ${type} rejected`); return result.data; },
    waitForIdle() { if (!running) return Promise.resolve(); const waiter = deferred(); idle.add(waiter); return Promise.race([waiter.promise, failure.promise]); },
    fail,
    dispose() { detach(); requests.clear(); idle.clear(); },
  };
}

export async function withQueueRuntime(cli, options, run) {
  const args = [cli, '--offline', '--mode', 'rpc', '--no-session', '--no-tools', '--no-extensions', '--no-approve', '--model', 'queue-loopback/queue-fixture'];
  const child = spawn(process.execPath, args, { cwd: path.join(options.root, 'a'), env: options.env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  const closed = new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
  const driver = createRpcDriver(child, options.attachJsonlLineReader);
  const failure = deferred();
  const fail = error => { driver.fail(error); failure.reject(error); };
  const onClose = () => fail(new Error('Runtime closed before probe completion'));
  const onError = () => fail(new Error('Runtime transport failed'));
  child.on('error', onError); child.on('close', onClose);
  child.stdin.on('error', onError); child.stdout.on('error', onError); child.stderr.on('error', onError);
  child.stderr.resume();
  const timer = setTimeout(() => fail(new Error('Queue spike deadline exceeded')), options.timeoutMs ?? 20000);
  let result;
  try { result = await Promise.race([Promise.resolve().then(() => run(driver)), failure.promise]); }
  finally {
    clearTimeout(timer);
    driver.dispose(); child.stdin.destroy();
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    const escalation = setTimeout(() => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); }, 500);
    const receipt = await closed;
    clearTimeout(escalation);
    options.onClosed?.(receipt);
    child.off('error', onError); child.off('close', onClose);
    child.stdin.off('error', onError); child.stdout.off('error', onError); child.stderr.off('error', onError);
  }
  return { ...result, cleanup: { childCloseObserved: true } };
}
