import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

const excludedDirectories = new Set(['fixtures', 'expected']);

function statIfPresent(file) {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

function walk(directory, relative = '') {
  const stat = statIfPresent(directory);
  if (!stat?.isDirectory() || stat.isSymbolicLink()) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return [];
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      return excludedDirectories.has(entry.name) ? [] : walk(path.join(directory, entry.name), name);
    }
    return entry.isFile() ? [name] : [];
  });
}

export function discoverTests(rootDir) {
  const root = path.resolve(rootDir);
  const app = walk(path.join(root, 'src'))
    .filter((name) => /^[^/]+\/tests\/(?:[^/]+\/)*[^/]+\.spec\.ts$/.test(name))
    .sort().map((name) => path.join(root, 'src', name));
  const scripts = walk(path.join(root, 'scripts'))
    .filter((name) => name.endsWith('.spec.mjs'))
    .sort().map((name) => path.join(root, 'scripts', name));
  return { app, scripts };
}

export async function cleanTestOutput(rootDir) {
  const root = path.resolve(rootDir);
  const dist = path.join(root, 'dist');
  const output = path.join(dist, 'tests');
  // Never traverse a linked dist/tests or its parent when deleting or building.
  for (const directory of [dist, output]) {
    const stat = statIfPresent(directory);
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) {
      throw new Error(`Refusing unsafe test output directory: ${directory}`);
    }
  }
  if (path.relative(root, output) !== path.join('dist', 'tests')) {
    throw new Error('Test output must be bounded to dist/tests');
  }
  await fs.promises.rm(output, { recursive: true, force: true });
  if (fs.existsSync(output)) throw new Error(`Test output cleanup did not remove ${output}`);
  return output;
}

export function executeTests(rootDir, files, { spawn = spawnSync, stdio = 'inherit' } = {}) {
  if (files.length === 0) throw new Error('Cannot execute an empty test inventory');
  // A runner invoked by a regression spec must start a fresh test coordinator,
  // not inherit node:test's child-worker context (which ignores --test).
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const result = spawn(process.execPath, ['--test', ...files], {
    cwd: path.resolve(rootDir), shell: false, stdio, env,
  });
  if (result.error) throw new Error(`Test process launch failed: ${result.error.message}`, { cause: result.error });
  if (result.signal) throw new Error(`Test process terminated by signal ${result.signal}`);
  if (result.status !== 0) throw new Error(`Test process failed with exit code ${result.status}`);
  return result;
}

export async function runTests(rootDir, options = {}) {
  const root = path.resolve(rootDir);
  const inventory = discoverTests(root);
  if (inventory.app.length === 0) throw new Error('Application test inventory is empty');
  if (inventory.scripts.length === 0) throw new Error('Script test inventory is empty');
  const outdir = await cleanTestOutput(root);
  const outbase = path.join(root, 'src');
  await build({
    absWorkingDir: root,
    entryPoints: inventory.app,
    outbase, outdir,
    bundle: true, platform: 'node', format: 'cjs', target: 'node22',
    logLevel: 'silent',
  });
  const built = inventory.app.map((file) => path.join(outdir, path.relative(outbase, file).replace(/\.ts$/, '.js')));
  executeTests(root, [...built, ...inventory.scripts], options);
  return { ...inventory, built };
}
