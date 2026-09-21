import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function parseNameStatusZ(input) {
  const text = Buffer.isBuffer(input) ? input.toString('utf8') : String(input);
  if (text === '') return [];
  if (!text.endsWith('\0')) throw new Error('Malformed git name-status output: missing final NUL');

  const fields = text.slice(0, -1).split('\0');
  const records = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    if (!/^[A-Z][0-9]*$/.test(status)) {
      throw new Error(`Malformed git name-status output: invalid status ${JSON.stringify(status)}`);
    }
    const pathCount = status[0] === 'R' || status[0] === 'C' ? 2 : 1;
    if (index + pathCount > fields.length) {
      throw new Error(`Malformed git name-status output: missing path for ${status}`);
    }
    const paths = fields.slice(index, index + pathCount);
    if (paths.some((name) => name.length === 0)) {
      throw new Error(`Malformed git name-status output: empty path for ${status}`);
    }
    records.push({ status, paths });
    index += pathCount;
  }
  return records;
}

export function isImplementationPath(file) {
  const name = file.replaceAll('\\', '/');
  // Keep this list deliberately narrow. These are implementation, build, or
  // automation inputs: src/, scripts/, package manifests, root build/TS/ESLint
  // configuration, and CI workflows. Other documentation remains docs-only.
  return name.startsWith('src/')
    || name.startsWith('scripts/')
    || name === 'package.json'
    || name === 'package-lock.json'
    || name === 'esbuild.mjs'
    || /^tsconfig[^/]*\.json$/.test(name)
    || /^eslint\.config\.[^/]+$/.test(name)
    || name.startsWith('.github/workflows/');
}

function runGit(root, args, spawn) {
  const result = spawn('git', args, {
    cwd: root,
    shell: false,
    encoding: 'buffer',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) {
    throw new Error(`git ${args.join(' ')} could not start: ${result.error.message}`, { cause: result.error });
  }
  if (result.signal) throw new Error(`git ${args.join(' ')} ended on signal ${result.signal}`);
  return result;
}

function outputText(value) {
  return Buffer.isBuffer(value) ? value.toString('utf8') : String(value ?? '');
}

export function checkStagedChanges(rootDir = repositoryRoot, { spawn = spawnSync } = {}) {
  const root = path.resolve(rootDir);
  const namesResult = runGit(root, ['diff', '--cached', '--name-status', '-z'], spawn);
  if (namesResult.status !== 0) {
    const detail = outputText(namesResult.stderr).trim();
    throw new Error(`Unable to inspect staged changes (git exited ${namesResult.status})${detail ? `: ${detail}` : ''}`);
  }

  const records = parseNameStatusZ(namesResult.stdout);
  const stagedPaths = [...new Set(records.flatMap((record) => record.paths))].sort((a, b) => a.localeCompare(b, 'en'));
  if (stagedPaths.length === 0) {
    return {
      ok: false,
      stagedPaths,
      summary: 'Commit check failed: the staging area is empty.',
      instructions: 'Stage the intended files before committing.',
    };
  }

  const checkResult = runGit(root, ['diff', '--cached', '--check'], spawn);
  if (checkResult.status !== 0) {
    const detail = [outputText(checkResult.stdout), outputText(checkResult.stderr)].join('').trim();
    return {
      ok: false,
      stagedPaths,
      summary: `Commit check failed: git diff --cached --check reported whitespace errors${detail ? `:\n${detail}` : '.'}`,
      instructions: 'Fix the reported staged whitespace errors, restage the files, and retry.',
    };
  }

  const hasActive = stagedPaths.includes('ACTIVE.md');
  const implementationPaths = stagedPaths.filter(isImplementationPath);
  if (hasActive && implementationPaths.length > 0) {
    return {
      ok: false,
      stagedPaths,
      summary: 'Commit check failed: ACTIVE.md is staged with implementation/build changes.',
      instructions: 'Unstage ACTIVE.md or the implementation/build paths and commit them separately. ACTIVE.md with docs-only changes is mechanically allowed; semantic splitting remains a manual review.',
    };
  }

  return {
    ok: true,
    stagedPaths,
    summary: `Commit check passed: ${stagedPaths.length} staged path${stagedPaths.length === 1 ? '' : 's'}.`,
    instructions: hasActive
      ? 'ACTIVE.md is paired only with docs changes; confirm the semantic split manually before committing.'
      : 'No ACTIVE.md/implementation split conflict or staged whitespace error found.',
  };
}

export function formatResult(result) {
  const paths = result.stagedPaths.length === 0
    ? 'Staged paths: (none)'
    : `Staged paths:\n${result.stagedPaths.map((name) => `- ${name}`).join('\n')}`;
  return `${paths}\n\n${result.summary}\n${result.instructions}`;
}

export function main(rootDir = repositoryRoot) {
  try {
    const result = checkStagedChanges(rootDir);
    console.log(formatResult(result));
    return result.ok ? 0 : 1;
  } catch (error) {
    console.error(`Commit check failed: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) process.exitCode = main();
