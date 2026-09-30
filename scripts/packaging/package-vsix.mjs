// Assemble an installable VSIX from the declared package files and the pinned
// pi-coding-agent dependency subtree.
//
// Scope: extension/package.json, the declared `files` entries (which include
// the compiled dist output, assets and LICENSE) and the pi runtime subtree
// under node_modules/@earendil-works/pi-coding-agent. The subtree carries its
// own nested node_modules, and `verify-vsix.mjs` runs the packaged CLI from the
// extracted tree, so these files are the runtime closure the extension starts.
// Every other bare specifier a shipped bundle loads must already be inlined in
// that bundle; `assertRuntimeSpecifiersPackaged` fails the package otherwise,
// because a missing runtime dependency only surfaces on an installed host.
//
// The archive is built with the system `zip` run with `-X`. That flag drops the
// extra file attributes, but directory entries still carry the staging
// directory's modification time, which differs on every run. Normalizing the
// staged tree to one fixed timestamp is what makes two runs byte-identical.
import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, unlink, utimes, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEPENDENCY_ENTRY = 'node_modules/@earendil-works/pi-coding-agent';
/** Bare specifiers the extension host itself provides at runtime. */
const HOST_PROVIDED_MODULES = new Set(['vscode']);
const DEFAULT_OUT = 'dist/pi-vscode-validation.vsix';
const STAGE_PREFIX = '.vsix-stage-';
/** Fixed staging timestamp: the earliest instant the ZIP format can record. */
const STAGE_TIMESTAMP_SECONDS = 315_532_800;
/** Fields regenerated for the packaged extension, never copied verbatim. */
const REGENERATED_MANIFEST_FIELDS = new Set(['main', 'files', 'version']);

/** Dist files the delivery entry must select; unpack-run checks stay in verify-vsix. */
export const REQUIRED_PACKAGE_FILES = Object.freeze([
  'dist/extension.js',
  'dist/webview/webview.js',
  'dist/webview/webview.css',
  'dist/runtime-supervisor.mjs',
  'dist/session-worker.mjs',
  'dist/approval-gate.mjs',
]);

/** Minimal deterministic archive tool required to build the VSIX. */
const ARCHIVE_TOOL = Object.freeze({ bin: 'zip', args: ['-X', '-q', '-r'] });

export class PackagingError extends Error {}

function fail(message) {
  throw new PackagingError(message);
}

function assertRequiredPackageFiles(found) {
  for (const required of REQUIRED_PACKAGE_FILES) {
    if (!found.has(required)) {
      fail(`${required} is missing; run \`npm run compile\` before packaging`);
    }
  }
}

export async function assertRequiredPackageFilesOnDisk(root = repoRoot) {
  for (const required of REQUIRED_PACKAGE_FILES) {
    const absolute = resolveInsideRepo(root, required);
    if (!existsSync(absolute)) {
      fail(`${required} is missing; run \`npm run compile\` before packaging`);
    }
    const info = await stat(absolute);
    if (!info.isFile() || info.size === 0) {
      fail(`${required} is missing; run \`npm run compile\` before packaging`);
    }
  }
}

function toPosix(relative) {
  return relative.split(path.sep).join('/');
}

function resolveInsideRepo(root, relative) {
  if (typeof relative !== 'string' || relative.length === 0) {
    fail('empty path is not allowed');
  }
  if (path.isAbsolute(relative)) {
    fail(`absolute path is not allowed: ${relative}`);
  }
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    fail(`path escapes the repository root: ${relative}`);
  }
  return resolved;
}

export function parseArgs(argv, root) {
  let out = DEFAULT_OUT;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') {
      const value = argv[(i += 1)];
      if (value === undefined || value.startsWith('--')) fail('--out requires a path');
      out = value;
    } else if (arg.startsWith('--out=')) {
      out = arg.slice('--out='.length);
    } else {
      fail(`unknown argument: ${arg}`);
    }
  }
  if (!out.endsWith('.vsix')) fail(`output path must end with .vsix: ${out}`);
  return resolveInsideRepo(root, out);
}

/** Run one child process, capturing merged output and enforcing a deadline. */
function run(bin, args, { cwd, timeoutMs = 600_000 } = {}) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(bin, args, { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      reject(new PackagingError(`cannot start ${bin}: ${error.message}`));
      return;
    }
    const chunks = [];
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(new PackagingError(`${bin} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on('data', (data) => chunks.push(data));
    child.stderr.on('data', (data) => chunks.push(data));
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new PackagingError(`cannot run ${bin}: ${error.message}`));
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const output = Buffer.concat(chunks).toString('utf8');
      if (code === 0) resolve(output);
      else reject(new PackagingError(`${bin} ${args.join(' ')} exited with ${code}\n${output}`));
    });
  });
}

/**
 * Expand the `files` field of a package manifest into matchers.
 * Supports the plain name, `*`, `?` and `**` forms used by this package.
 */
export function expandFilePatterns(patterns) {
  if (!Array.isArray(patterns) || patterns.length === 0) {
    fail('package.json `files` must be a non-empty array');
  }
  return patterns.map((pattern) => {
    if (typeof pattern !== 'string' || pattern.length === 0) {
      fail(`invalid entry in package.json \`files\`: ${JSON.stringify(pattern)}`);
    }
    if (path.isAbsolute(pattern)) {
      fail(`absolute path is not allowed in package.json \`files\`: ${pattern}`);
    }
    const normalized = toPosix(pattern).replace(/^\.\//, '').replace(/\/+$/, '');
    if (normalized.length === 0) {
      fail(`invalid entry in package.json \`files\`: ${pattern}`);
    }
    if (!/[*?]/.test(normalized)) return { kind: 'exact', value: normalized };
    // A trailing `/**` selects the directory and every file beneath it,
    // including files directly inside it. Keeping it as a subtree matcher keeps
    // `dist/**` covering dist/extension.js as well as dist/webview/*.
    if (normalized.endsWith('/**')) {
      const base = normalized.slice(0, -'/**'.length);
      if (base.length === 0) fail(`invalid entry in package.json \`files\`: ${pattern}`);
      return { kind: 'subtree', value: base };
    }
    const source = normalized
      .split('/')
      .map((segment) =>
        [...segment]
          .map((char) => {
            if (char === '*') return '[^/]*';
            if (char === '?') return '[^/]';
            return /[.+^${}()|[\]\\]/.test(char) ? `\\${char}` : char;
          })
          .join(''),
      )
      .join('/');
    return { kind: 'glob', value: new RegExp(`^${source}$`) };
  });
}

function isSelected(archivePath, selectors, directorySelectors) {
  return selectors.some((selector) => {
    if (selector.kind === 'exact') {
      // A declared entry may name a directory (for example `assets`); that
      // selects everything inside it, not just the directory name.
      if (selector.value === archivePath) return true;
      return directorySelectors.has(selector.value) && archivePath.startsWith(`${selector.value}/`);
    }
    if (selector.kind === 'subtree') {
      return archivePath === selector.value || archivePath.startsWith(selector.value + '/');
    }
    return selector.value.test(archivePath);
  });
}

function isExcludedPackageFile(file) {
  const segments = file.split('/');
  return segments.includes('.git') || segments.includes('.local-env')
    || segments.at(-1) === 'skills-lock.json' || file.toLowerCase().endsWith('.vsix');
}

/** Bundled forms that load another module at runtime. */
const SPECIFIER_PATTERNS = [
  /\brequire\s*\(\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']/g,
  /\bimport\s+[^;"']*?from\s*["']([^"']+)["']/g,
  /\bimport\s*["']([^"']+)["']/g,
  /\bexport\s+[^;"']*?from\s*["']([^"']+)["']/g,
];

/**
 * Bare specifiers a shipped bundle loads at runtime, ignoring relative paths
 * and Node built-ins. The patterns cover `require`, dynamic `import`, static
 * ESM `import ... from` and `export ... from`. This is still a text scan:
 * computed specifiers, `require.resolve` targets and `createRequire` are
 * outside it and need a targeted check.
 */
export function bareRuntimeSpecifiers(source) {
  const found = new Set();
  for (const pattern of SPECIFIER_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) continue;
      if (isBuiltin(specifier)) continue;
      found.add(specifier);
    }
  }
  return [...found].sort();
}

/** The package directory a bare specifier belongs to (`@scope/name` aware). */
export function packageRootOf(specifier) {
  const segments = specifier.split('/');
  return segments[0].startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
}

/** Every packaged JavaScript bundle the extension host loads from dist/. */
function shippedBundlePaths(found) {
  return [...found].filter((file) => /^dist\/[^/]+\.(?:js|mjs|cjs)$/.test(file)).sort();
}

/**
 * Refuse a package whose shipped bundles load a runtime dependency that is not
 * staged in the archive. A missing dependency only fails on a real installed
 * extension host (PACKAGE-01), so the packager checks it here instead. The
 * bundle list comes from what is packaged, so a new dist bundle is covered too.
 */
async function assertRuntimeSpecifiersPackaged(root, found) {
  for (const bundle of shippedBundlePaths(found)) {
    const source = await readFile(resolveInsideRepo(root, bundle), 'utf8');
    for (const specifier of bareRuntimeSpecifiers(source)) {
      if (HOST_PROVIDED_MODULES.has(specifier)) continue;
      const staged = `node_modules/${packageRootOf(specifier)}/package.json`;
      if (!found.has(staged)) {
        fail(`${bundle} loads "${specifier}" at runtime, but node_modules/${packageRootOf(specifier)} is not packaged; stage it or inline it in the bundle`);
      }
    }
  }
}

/** Walk an absolute directory, returning repo-relative paths of regular files. */
async function walkFiles(root, startAbsolute) {
  const found = [];
  const queue = [startAbsolute];
  while (queue.length > 0) {
    const current = queue.pop();
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      fail(`cannot read ${toPosix(path.relative(root, current))}: ${error.message}`);
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.bin') continue;
        queue.push(absolute);
      } else if (entry.isFile()) {
        found.push(toPosix(path.relative(root, absolute)));
      }
    }
  }
  return found;
}

/** Resolve the package's declared bytes plus the pinned pi runtime subtree. */
export async function collectPackageFiles(root) {
  const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const selectors = expandFilePatterns(manifest.files);

  const found = new Set();
  const walked = new Set();
  const directorySelectors = new Set();
  const walkBase = async (relative) => {
    const base = relative.replace(/\/+$/, '');
    if (base.length === 0 || walked.has(base)) return;
    walked.add(base);
    // Dependencies are added below from the pinned runtime subtree, which
    // carries its own nested node_modules. Walking the top-level node_modules
    // here would sweep in the whole development tree.
    if (base === 'node_modules') return;
    const absolute = resolveInsideRepo(root, base);
    if (!existsSync(absolute)) return;
    const info = await stat(absolute);
    if (info.isFile()) {
      found.add(base);
      return;
    }
    for (const file of await walkFiles(root, absolute)) found.add(file);
  };

  // Derive the directories to walk from the declared patterns, then filter the
  // walked results by those same patterns. Walking the declared directories and
  // filtering is what lets both `dist/extension.js` and `dist/webview/**` work.
  for (const selector of selectors) {
    const raw = selector.kind === 'subtree' ? selector.value : selector.value;
    const literal = String(raw).split('/').filter((segment) => !/[*?]/.test(segment));
    if (literal.length === 0) continue;
    const asDirectory = literal.join('/');
    await walkBase(asDirectory);
    if (literal.length > 1) {
      // A pattern may name a file (for example dist/extension.js); walking its
      // parent directory covers it, and filtering below keeps only matches.
      await walkBase(literal.slice(0, -1).join('/'));
    }
  }
  for (const selector of selectors) {
    if (selector.kind !== 'exact') continue;
    const absolute = resolveInsideRepo(root, selector.value);
    if (!existsSync(absolute)) continue;
    if ((await stat(absolute)).isDirectory()) directorySelectors.add(selector.value);
  }
  for (const file of [...found]) {
    if (!isSelected(file, selectors, directorySelectors)) found.delete(file);
  }

  const dependencyRoot = resolveInsideRepo(root, DEPENDENCY_ENTRY);
  if (!existsSync(dependencyRoot)) {
    fail(`${DEPENDENCY_ENTRY} is missing; run the repository install before packaging`);
  }
  const dependencyManifest = JSON.parse(
    await readFile(path.join(dependencyRoot, 'package.json'), 'utf8'),
  );
  for (const file of await walkFiles(root, dependencyRoot)) found.add(file);
  for (const file of found) if (isExcludedPackageFile(file)) found.delete(file);

  // Run the build before packaging: a stale or empty dist silently produces a
  // package that cannot activate, so fail here instead of shipping it.
  assertRequiredPackageFiles(found);

  return {
    files: [...found].sort(),
    dependencyVersion: dependencyManifest.version,
    manifest,
  };
}

/** Refuse a source path whose resolved location leaves the staging tree. */
function assertInsideStage(stageExtensionRoot, archivePath) {
  const target = path.resolve(stageExtensionRoot, archivePath);
  if (!target.startsWith(stageExtensionRoot + path.sep)) {
    fail(`refusing to stage a path outside extension/: ${archivePath}`);
  }
  return target;
}

/** Build the packaged extension manifest from the source manifest. */
export function buildExtensionManifest(manifest, dependencyVersion) {
  const staged = { ...manifest, version: dependencyVersion, main: './dist/extension.js' };
  for (const field of REGENERATED_MANIFEST_FIELDS) {
    if (field === 'files') continue;
    if (staged[field] === undefined) fail(`package.json is missing required field: ${field}`);
  }
  staged.files = ['dist/*.mjs', 'dist/*.cjs', 'dist/webview/**', 'assets/**', 'LICENSE'];
  return staged;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildVsixManifest(manifest) {
  for (const field of ['publisher', 'name', 'displayName', 'engines']) {
    if (manifest[field] === undefined) fail(`package.json is missing required field: ${field}`);
  }
  if (typeof manifest.engines.vscode !== 'string' || manifest.engines.vscode.length === 0) {
    fail('package.json `engines.vscode` must be a non-empty string');
  }
  return `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata>
    <Identity Language="en-US" Id="${escapeXml(manifest.name)}" Version="${escapeXml(
      manifest.version,
    )}" Publisher="${escapeXml(manifest.publisher)}" />
    <DisplayName>${escapeXml(manifest.displayName)}</DisplayName>
    <Description xml:space="preserve">${escapeXml(manifest.description ?? '')}</Description>
    <Tags>${escapeXml((manifest.keywords ?? []).join(','))}</Tags>
    <Categories>${escapeXml((manifest.categories ?? []).join(','))}</Categories>
    <License>extension/LICENSE</License>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" />
  </Installation>
  <Dependencies />
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
  </Assets>
</PackageManifest>
`;
}

async function assertArchiveTool() {
  try {
    await run(ARCHIVE_TOOL.bin, ['-v'], { timeoutMs: 15_000 });
  } catch (error) {
    fail(`the \`${ARCHIVE_TOOL.bin}\` command is required to build the VSIX: ${error.message}`);
  }
}

/**
 * Normalize every staged directory to one timestamp. Regular files keep their
 * source timestamps; staging directories are created fresh on each run, so
 * their modification times would otherwise leak into the archive.
 */
async function normalizeDirectoryTimes(startAbsolute, seconds) {
  const queue = [startAbsolute];
  while (queue.length > 0) {
    const current = queue.pop();
    await utimes(current, seconds, seconds);
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) queue.push(path.join(current, entry.name));
    }
  }
}

async function assembleStage(root, stage, collected) {
  const extensionRoot = path.join(stage, 'extension');
  await mkdir(extensionRoot, { recursive: true });
  let bytes = 0;
  for (const relative of collected.files) {
    const source = resolveInsideRepo(root, relative);
    const target = assertInsideStage(extensionRoot, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await cp(source, target, { preserveTimestamps: true });
    bytes += (await stat(source)).size;
  }
  const staged = buildExtensionManifest(collected.manifest, collected.dependencyVersion);
  const stagedManifestPath = path.join(extensionRoot, 'package.json');
  const vsixManifestPath = path.join(extensionRoot, 'extension.vsixmanifest');
  await writeFile(stagedManifestPath, `${JSON.stringify(staged, null, 2)}\n`);
  await writeFile(vsixManifestPath, buildVsixManifest(staged));
  // These two files are generated during staging, so pin their timestamps too;
  // otherwise every run embeds the moment it ran.
  for (const generated of [stagedManifestPath, vsixManifestPath]) {
    await utimes(generated, STAGE_TIMESTAMP_SECONDS, STAGE_TIMESTAMP_SECONDS);
  }
  await normalizeDirectoryTimes(stage, STAGE_TIMESTAMP_SECONDS);
  return { bytes, entries: collected.files.length + 2 };
}

export async function packageVsix({ root = repoRoot, out } = {}) {
  const outputPath = out ?? path.join(root, DEFAULT_OUT);
  await assertArchiveTool();
  const collected = await collectPackageFiles(root);
  if (collected.files.length === 0) fail('no package files were selected');
  await assertRuntimeSpecifiersPackaged(root, new Set(collected.files));

  await mkdir(path.dirname(outputPath), { recursive: true });
  await mkdir(path.join(root, 'dist'), { recursive: true });
  const stage = await mkdtemp(path.join(root, 'dist', STAGE_PREFIX));
  const archive = `${outputPath}.tmp`;
  try {
    const summary = await assembleStage(root, stage, collected);
    await unlink(archive).catch(() => {});
    await run(ARCHIVE_TOOL.bin, [...ARCHIVE_TOOL.args, archive, '.'], { cwd: stage });
    await rename(archive, outputPath);
    return {
      outputPath,
      entryCount: summary.entries,
      sourceBytes: summary.bytes,
      dependencyVersion: collected.dependencyVersion,
    };
  } finally {
    await unlink(archive).catch(() => {});
    await rm(stage, { recursive: true, force: true });
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv[0] === '--check-files') {
    if (argv.length !== 1) fail('--check-files does not take other arguments');
    await assertRequiredPackageFilesOnDisk();
    console.log('required package files present');
    return;
  }
  const out = parseArgs(argv, repoRoot);
  const summary = await packageVsix({ root: repoRoot, out });
  const { size } = await stat(summary.outputPath);
  console.log(
    `packed ${summary.outputPath}\n  source entries: ${summary.entryCount}\n  source bytes: ${summary.sourceBytes}\n  archive bytes: ${size}\n  pi runtime: ${summary.dependencyVersion}`,
  );
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`packaging failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
