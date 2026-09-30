// Unit coverage for the VSIX packager: pattern expansion, the packaged
// extension manifest, and the full assemble path over a synthetic tree.
//
// The synthetic tree keeps production dependencies tiny. The real repository
// package (about 14,000 entries) is not rebuilt here; that is the packaging
// command's job and `verify-vsix.mjs` validates its output separately.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';

import {
  assertRequiredPackageFilesOnDisk,
  collectPackageFiles,
  bareRuntimeSpecifiers,
  buildExtensionManifest,
  buildVsixManifest,
  expandFilePatterns,
  packageRootOf,
  packageVsix,
  parseArgs,
  PackagingError,
} from './package-vsix.mjs';

/** Read one entry's bytes out of a produced ZIP archive. */
function readArchiveEntry(archive, name) {
  let end = archive.length - 22;
  while (end >= Math.max(0, archive.length - 65557) && archive.readUInt32LE(end) !== 0x06054b50) {
    end -= 1;
  }
  assert.ok(end >= 0, 'ZIP end-of-central-directory record missing');
  let cursor = archive.readUInt32LE(end + 16);
  const count = archive.readUInt16LE(end + 10);
  for (let i = 0; i < count; i += 1) {
    assert.equal(archive.readUInt32LE(cursor), 0x02014b50, 'central directory record expected');
    const method = archive.readUInt16LE(cursor + 10);
    const size = archive.readUInt32LE(cursor + 20);
    const offset = archive.readUInt32LE(cursor + 42);
    const length = archive.readUInt16LE(cursor + 28);
    const extra = archive.readUInt16LE(cursor + 30);
    const comment = archive.readUInt16LE(cursor + 32);
    const entryName = archive.toString('utf8', cursor + 46, cursor + 46 + length);
    if (entryName === name) {
      assert.equal(archive.readUInt32LE(offset), 0x04034b50, 'local file header expected');
      const start =
        offset + 30 + archive.readUInt16LE(offset + 26) + archive.readUInt16LE(offset + 28);
      const payload = archive.subarray(start, start + size);
      assert.ok(method === 0 || method === 8, `unsupported compression method ${method}`);
      return method === 8 ? inflateRawSync(payload) : payload;
    }
    cursor += 46 + length + extra + comment;
  }
  throw new Error(`archive entry not found: ${name}`);
}

/** Read the ZIP central directory of a produced archive. */
function readArchiveEntries(archive) {
  let end = archive.length - 22;
  while (end >= Math.max(0, archive.length - 65557) && archive.readUInt32LE(end) !== 0x06054b50) {
    end -= 1;
  }
  assert.ok(end >= 0, 'ZIP end-of-central-directory record missing');
  let cursor = archive.readUInt32LE(end + 16);
  const count = archive.readUInt16LE(end + 10);
  const entries = [];
  for (let i = 0; i < count; i += 1) {
    assert.equal(archive.readUInt32LE(cursor), 0x02014b50, 'central directory record expected');
    const size = archive.readUInt32LE(cursor + 20);
    const length = archive.readUInt16LE(cursor + 28);
    const extra = archive.readUInt16LE(cursor + 30);
    const comment = archive.readUInt16LE(cursor + 32);
    entries.push(archive.toString('utf8', cursor + 46, cursor + 46 + length));
    cursor += 46 + length + extra + comment;
  }
  return entries;
}

function hasZipTool() {
  try {
    execFileSync('zip', ['-v'], { stdio: 'ignore', windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

const ZIP_AVAILABLE = hasZipTool();

/**
 * Build a synthetic package root. The declared files, the pinned runtime
 * subtree and the manifest all match the shapes the real packager relies on.
 */
async function makeFixture({ declaredFiles } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'pi-vsix-pack-'));
  const manifest = {
    name: 'fixture-extension',
    displayName: 'Fixture',
    description: 'Synthetic package for the packager spec',
    publisher: 'fixture-publisher',
    version: '9.9.9',
    license: 'MIT',
    engines: { vscode: '^1.85.0' },
    categories: ['Other'],
    keywords: ['fixture', 'vsix'],
    main: './dist/extension.js',
    files:
      declaredFiles ?? [
        'dist/extension.js',
        'dist/approval-gate.mjs',
        'dist/session-worker.mjs',
        'dist/runtime-supervisor.mjs',
        'dist/webview/**',
        'assets',
        'LICENSE',
        'node_modules/**',
      ],
  };
  await writeFile(path.join(root, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(root, 'LICENSE'), 'fixture license\n');
  for (const relative of [
    'dist/extension.js',
    'dist/extension.js.map',
    'dist/approval-gate.mjs',
    'dist/session-worker.mjs',
    'dist/runtime-supervisor.mjs',
    'dist/spike-runtime.js',
    'dist/previous.vsix',
    'dist/webview/webview.js',
    'dist/webview/webview.css',
    'assets/pi.svg',
    'assets/unused.png',
  ]) {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `${relative}\n`);
  }
  const dependency = 'node_modules/@earendil-works/pi-coding-agent';
  for (const relative of [
    `${dependency}/package.json`,
    `${dependency}/dist/bundle/cli.js`,
    `${dependency}/node_modules/nested-dep/index.js`,
  ]) {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(
      target,
      relative.endsWith('package.json') ? `${JSON.stringify({ name: 'pi-coding-agent', version: '0.86.1' })}\n` : `${relative}\n`,
    );
  }
  // Present on disk but outside the declared scope and the pinned subtree.
  for (const relative of ['.local-env/secret.json', '.git/config', 'skills-lock.json', 'node_modules/left-pad/index.js']) {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, 'excluded\n');
  }
  return { root, run: () => packageVsix({ root, out: path.join(root, 'out.vsix') }) };
}

async function withFixture(options, run) {
  const fixture = await makeFixture(options);
  try {
    await run(fixture);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
}

test('expandFilePatterns splits exact, subtree and wildcard entries', () => {
  const selectors = expandFilePatterns([
    'dist/extension.js',
    './assets',
    'dist/webview/**',
    'dist/*.mjs',
    'LICENSE',
  ]);
  assert.deepEqual(
    selectors.map((selector) => selector.kind),
    ['exact', 'exact', 'subtree', 'glob', 'exact'],
  );
  assert.equal(selectors[0].value, 'dist/extension.js');
  assert.equal(selectors[1].value, 'assets');
  assert.equal(selectors[2].value, 'dist/webview');
  assert.ok(selectors[3].value.test('dist/extension.mjs'));
  assert.ok(!selectors[3].value.test('dist/webview/webview.js'));
});

test('expandFilePatterns rejects empty and absolute entries', () => {
  assert.throws(() => expandFilePatterns([]), PackagingError);
  assert.throws(() => expandFilePatterns(['']), PackagingError);
  assert.throws(() => expandFilePatterns(['/etc/passwd']), PackagingError);
  assert.throws(() => expandFilePatterns([7]), PackagingError);
});

test('parseArgs defaults the output and rejects unusable values', () => {
  const root = path.resolve('/srv/repo');
  assert.equal(parseArgs([], root), path.join(root, 'dist', 'pi-vscode-validation.vsix'));
  assert.equal(parseArgs(['--out', 'dist/a.vsix'], root), path.join(root, 'dist', 'a.vsix'));
  assert.equal(parseArgs(['--out=dist/b.vsix'], root), path.join(root, 'dist', 'b.vsix'));
  assert.throws(() => parseArgs(['--out'], root), PackagingError);
  assert.throws(() => parseArgs(['--out', 'dist/a.zip'], root), PackagingError);
  assert.throws(() => parseArgs(['--out', '../../escape.vsix'], root), PackagingError);
  assert.throws(() => parseArgs(['--wat'], root), PackagingError);
});

test('buildExtensionManifest pins the runtime version and rewrites entry fields', () => {
  const manifest = {
    name: 'x',
    publisher: 'p',
    displayName: 'X',
    version: '1.2.3',
    main: './out/other.js',
    files: ['old/**'],
    engines: { vscode: '^1.85.0' },
  };
  const staged = buildExtensionManifest(manifest, '0.86.1');
  assert.equal(staged.version, '0.86.1');
  assert.equal(staged.main, './dist/extension.js');
  assert.deepEqual(staged.files, [
    'dist/*.mjs',
    'dist/*.cjs',
    'dist/webview/**',
    'assets/**',
    'LICENSE',
  ]);
  // The source manifest must not be mutated.
  assert.equal(manifest.main, './out/other.js');
  assert.deepEqual(manifest.files, ['old/**']);
});

test('buildVsixManifest escapes values and requires the engine range', () => {
  const xml = buildVsixManifest({
    name: 'x',
    publisher: 'p&q',
    displayName: 'A <b>',
    description: 'quotes " and \'',
    version: '0.86.1',
    engines: { vscode: '^1.85.0' },
  });
  assert.match(xml, /Publisher="p&amp;q"/);
  assert.match(xml, /<DisplayName>A &lt;b&gt;<\/DisplayName>/);
  assert.match(xml, /quotes &quot; and &apos;/);
  assert.match(xml, /Path="extension\/package\.json"/);
  assert.throws(
    () => buildVsixManifest({ name: 'x', publisher: 'p', displayName: 'd', engines: {} }),
    PackagingError,
  );
});

test('packageVsix assembles the declared tree and excludes everything else', { skip: !ZIP_AVAILABLE }, async () => {
  await withFixture({}, async ({ root, run }) => {
    const summary = await run();
    assert.equal(summary.dependencyVersion, '0.86.1');
    assert.equal(summary.outputPath, path.join(root, 'out.vsix'));

    const entries = readArchiveEntries(await readFile(summary.outputPath));
    for (const required of [
      'extension/package.json',
      'extension/extension.vsixmanifest',
      'extension/LICENSE',
      'extension/dist/extension.js',
      'extension/dist/approval-gate.mjs',
      'extension/dist/session-worker.mjs',
      'extension/dist/runtime-supervisor.mjs',
      'extension/dist/webview/webview.js',
      'extension/dist/webview/webview.css',
      'extension/assets/pi.svg',
      'extension/node_modules/@earendil-works/pi-coding-agent/package.json',
      'extension/node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js',
      'extension/node_modules/@earendil-works/pi-coding-agent/node_modules/nested-dep/index.js',
    ]) {
      assert.ok(entries.includes(required), `expected archive entry ${required}`);
    }
    // A wildcard directory pulls in the whole tree, including files the
    // narrower entry patterns do not name.
    assert.ok(entries.includes('extension/assets/unused.png'));
    // Undeclared build output, excluded local state and root-only dependencies
    // must not be packaged.
    for (const unwanted of [
      'extension/dist/spike-runtime.js',
      'extension/dist/extension.js.map',
      'extension/.local-env/secret.json',
      'extension/node_modules/left-pad/index.js',
    ]) {
      assert.ok(!entries.includes(unwanted), `did not expect archive entry ${unwanted}`);
    }
    assert.ok(entries.every((entry) => entry.startsWith('extension/')));
  });
});

test('packageVsix rewrites the packaged manifest for the runtime closure', { skip: !ZIP_AVAILABLE }, async () => {
  await withFixture({}, async ({ root, run }) => {
    const summary = await run();
    const archive = await readFile(summary.outputPath);

    const staged = JSON.parse(readArchiveEntry(archive, 'extension/package.json').toString('utf8'));
    assert.equal(staged.version, '0.86.1');
    assert.equal(staged.main, './dist/extension.js');
    assert.deepEqual(staged.files, [
      'dist/*.mjs',
      'dist/*.cjs',
      'dist/webview/**',
      'assets/**',
      'LICENSE',
    ]);
    assert.equal(staged.publisher, 'fixture-publisher');

    const manifest = readArchiveEntry(archive, 'extension/extension.vsixmanifest').toString('utf8');
    assert.match(manifest, /Publisher="fixture-publisher"/);
    assert.match(manifest, /Version="0\.86\.1"/);
    assert.match(manifest, /Path="extension\/package\.json"/);

    // The source manifest on disk is left untouched.
    const source = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
    assert.equal(source.version, '9.9.9');
    assert.equal(source.main, './dist/extension.js');
  });
});

test('packageVsix excludes local state and archives even when files declares them', { skip: !ZIP_AVAILABLE }, async () => {
  await withFixture({ declaredFiles: [
    'dist/**', 'assets', 'LICENSE', '.local-env/**', '.git/**', 'skills-lock.json', 'node_modules/**',
  ] }, async ({ run }) => {
    const entries = readArchiveEntries(await readFile((await run()).outputPath));
    assert.ok(entries.includes('extension/dist/extension.js'));
    assert.ok(entries.includes('extension/node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js'));
    for (const forbidden of [
      'extension/.local-env/secret.json',
      'extension/.git/config',
      'extension/skills-lock.json',
      'extension/dist/previous.vsix',
    ]) assert.ok(!entries.includes(forbidden), `did not expect archive entry ${forbidden}`);
  });
});

test('packageVsix rejects a declared path outside the repository', { skip: !ZIP_AVAILABLE }, async () => {
  await withFixture({ declaredFiles: ['../outside', 'dist/**', 'node_modules/**'] }, async ({ run }) => {
    await assert.rejects(run(), /path escapes the repository root/);
  });
});

test('packageVsix rejects a manifest that drops a required build output', { skip: !ZIP_AVAILABLE }, async () => {
  await withFixture(
    { declaredFiles: ['dist/approval-gate.mjs', 'assets', 'LICENSE', 'node_modules/**'] },
    async ({ run }) => {
      await assert.rejects(run(), (error) => {
        assert.ok(error instanceof PackagingError);
        assert.match(error.message, /dist\/extension\.js is missing/);
        assert.match(error.message, /npm run compile/);
        return true;
      });
    },
  );
});

test('collectPackageFiles rejects a tree that only selects host and webview JS', async () => {
  await withFixture(
    { declaredFiles: ['dist/extension.js', 'dist/webview/webview.js', 'assets', 'LICENSE', 'node_modules/**'] },
    async ({ root }) => {
      await assert.rejects(() => collectPackageFiles(root), (error) => {
        assert.ok(error instanceof PackagingError);
        assert.match(error.message, /dist\/webview\/webview\.css is missing/);
        return true;
      });
    },
  );
});

test('collectPackageFiles rejects a tree that selects CSS but omits runtime helpers', async () => {
  await withFixture(
    { declaredFiles: ['dist/extension.js', 'dist/webview/**', 'assets', 'LICENSE', 'node_modules/**'] },
    async ({ root }) => {
      await assert.rejects(() => collectPackageFiles(root), (error) => {
        assert.ok(error instanceof PackagingError);
        assert.match(error.message, /dist\/runtime-supervisor\.mjs is missing/);
        return true;
      });
    },
  );
});

test('assertRequiredPackageFilesOnDisk accepts the synthetic complete tree', async () => {
  await withFixture({}, async ({ root }) => {
    await assertRequiredPackageFilesOnDisk(root);
  });
});

test('packageVsix rejects a missing pinned runtime subtree', { skip: !ZIP_AVAILABLE }, async () => {
  const fixture = await makeFixture({});
  try {
    await rm(path.join(fixture.root, 'node_modules'), { recursive: true, force: true });
    await assert.rejects(fixture.run(), (error) => {
      assert.ok(error instanceof PackagingError);
      assert.match(error.message, /pi-coding-agent is missing/);
      return true;
    });
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test('bareRuntimeSpecifiers reports runtime specifiers and drops builtins', () => {
  const source = [
    'const vscode = require("vscode");',
    'const cli = require("@earendil-works/pi-coding-agent");',
    'const ai = require("@earendil-works/pi-ai/dist/models.js");',
    'const cfg = require("./local.js");',
    'const fs = require("node:fs");',
    'const http = require("http");',
    'const gate = await import("@earendil-works/pi-agent-core");',
    'import { createRequire } from "node:module";',
    'import helper from "left-pad";',
    'import "side-effect-pkg";',
    'export { value } from "re-exported-pkg";',
  ].join('\n');
  assert.deepEqual(bareRuntimeSpecifiers(source), [
    '@earendil-works/pi-agent-core',
    '@earendil-works/pi-ai/dist/models.js',
    '@earendil-works/pi-coding-agent',
    'left-pad',
    're-exported-pkg',
    'side-effect-pkg',
    'vscode',
  ]);
  assert.equal(packageRootOf('@earendil-works/pi-ai/dist/models.js'), '@earendil-works/pi-ai');
  assert.equal(packageRootOf('typebox/build/index.mjs'), 'typebox');
});

test('packageVsix rejects a bundle that loads an unpackaged runtime dependency', { skip: !ZIP_AVAILABLE }, async () => {
  await withFixture({}, async ({ root, run }) => {
    await writeFile(path.join(root, 'dist/extension.js'), 'const ai = require("@earendil-works/pi-ai");\n');
    await assert.rejects(run(), (error) => {
      assert.ok(error instanceof PackagingError);
      assert.match(error.message, /dist\/extension\.js loads "@earendil-works\/pi-ai" at runtime/);
      assert.match(error.message, /node_modules\/@earendil-works\/pi-ai is not packaged/);
      return true;
    });
  });
});

test('packageVsix accepts a bundle whose external is the staged pinned runtime', { skip: !ZIP_AVAILABLE }, async () => {
  await withFixture({}, async ({ root, run }) => {
    await writeFile(path.join(root, 'dist/extension.js'), 'const cli = require("@earendil-works/pi-coding-agent");\nconst vscode = require("vscode");\n');
    const summary = await run();
    const entries = readArchiveEntries(await readFile(summary.outputPath));
    assert.ok(entries.includes('extension/node_modules/@earendil-works/pi-coding-agent/package.json'));
    assert.ok(entries.includes('extension/node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js'));
  });
});
