import { spawnSync } from 'node:child_process';

function git(args) {
  return spawnSync('git', args, {
    encoding: 'utf8',
    shell: false,
    timeout: 60_000,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
  });
}

function fail(message, result = {}) {
  console.error(message);
  const detail = result.error?.message || result.stderr?.trim();
  if (detail) console.error(detail);
  process.exitCode = 1;
}

function candidate(argv) {
  if (argv.length === 0) return { base: 'origin/master', head: 'HEAD', fetch: true };
  const commitId = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i;
  if (argv.length !== 4 || argv[0] !== '--base' || argv[2] !== '--head'
    || !commitId.test(argv[1]) || !commitId.test(argv[3])) {
    fail('Usage: node scripts/testing/pr-base.mjs [--base <full-commit-sha> --head <full-commit-sha>]');
    return undefined;
  }
  return { base: argv[1], head: argv[3], fetch: false };
}

function verifyCandidate({ base, head }) {
  const ancestry = git(['merge-base', '--is-ancestor', base, head]);
  if (ancestry.error || (ancestry.status !== 0 && ancestry.status !== 1)) {
    fail(`Cannot verify ${base} ancestry against ${head}; PR base check failed.`, ancestry);
    return;
  }
  if (ancestry.status === 1) {
    fail(`${head} is behind ${base} or diverged; refresh only in your task worktree with explicit history-change authorization, then rerun checks.`, ancestry);
    return;
  }
  console.log(`PR base check passed: ${base} is an ancestor of ${head}.`);
}

function checkBase(argv) {
  const selected = candidate(argv);
  if (!selected) return;
  if (selected.fetch) {
    const fetch = git(['fetch', 'origin', 'master']);
    if (fetch.error || fetch.status !== 0) {
      fail('Cannot refresh origin/master; PR base check failed.', fetch);
      return;
    }
  }
  verifyCandidate(selected);
}

checkBase(process.argv.slice(2));
