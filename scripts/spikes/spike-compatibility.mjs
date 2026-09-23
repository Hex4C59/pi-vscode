// WI-012 only. Launch explicitly inside a fresh Linux user/network namespace.
// No static pi import: isolation, unique state and sanitized environment precede it.
import { networkInterfaces, release } from 'node:os';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { withFixture, runChild } from './compatibility-lib.mjs';

async function preflight() {
  if (process.platform !== 'linux') throw new Error('blocked:linux-network-namespace-required');
  const uidMap = (await readFile('/proc/self/uid_map', 'utf8')).trim().split(/\s+/).map(Number);
  if (uidMap.length !== 3 || uidMap[0] !== 0 || uidMap[1] <= 0 || uidMap[2] !== 1) throw new Error('blocked:unprivileged-user-namespace-required');
  if (Object.keys(networkInterfaces()).length !== 0) throw new Error('blocked:network-interfaces-present');
  const routes = await readFile('/proc/net/route', 'utf8');
  if (routes.trim().split('\n').length !== 1) throw new Error('blocked:ipv4-routes-present');
  const routes6 = await readFile('/proc/net/ipv6_route', 'utf8');
  // Linux exposes reject-only null routes even in an empty namespace (not usable routes).
  if (routes6.trim().split('\n').filter(Boolean).some(line => !/^0{32} 00 0{32} 00 0{32} ffffffff [0-9a-f]{8} [0-9a-f]{8} 00200200\s+lo$/.test(line))) throw new Error('blocked:ipv6-routes-present');
}

try {
  await preflight();
  await withFixture(async fixture => {
    const result = await runChild([fileURLToPath(new URL('./compatibility-worker.mjs', import.meta.url)), fixture.root], {
      ...fixture, cwd: path.join(fixture.root, 'a'), timeoutMs: 60000,
    });
    // Worker output consists exclusively of allowlisted probe records.
    process.stdout.write(result.stdout);
    console.log(JSON.stringify({ stage: 'worker-exit', code: result.code, signal: result.signal }));
  });
  console.log(JSON.stringify({ stage: 'cleanup', status: 'passed', platform: process.platform, node: process.version, kernel: release() }));
} catch (error) {
  if (typeof error.stdout === 'string') process.stdout.write(error.stdout);
  // Helper errors contain fixed diagnostics (or the owned cleanup path), not runtime stderr.
  console.error(JSON.stringify({ stage: 'runner', status: 'failed', reason: String(error.message).slice(0, 400) }));
  process.exitCode = 1;
}
