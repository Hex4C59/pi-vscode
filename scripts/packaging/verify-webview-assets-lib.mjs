import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";

const requiredAssets = ["webview.js", "webview.css"];

function fail(message) {
  throw new Error(`Webview asset verification failed: ${message}`);
}

function zipEntries(archive) {
  let end = archive.length - 22;
  while (end >= Math.max(0, archive.length - 65_557) && archive.readUInt32LE(end) !== 0x06054b50) end -= 1;
  if (end < Math.max(0, archive.length - 65_557)) fail("ZIP end directory missing");
  const count = archive.readUInt16LE(end + 10);
  let cursor = archive.readUInt32LE(end + 16);
  const names = [];
  for (let index = 0; index < count; index += 1) {
    if (cursor + 46 > archive.length || archive.readUInt32LE(cursor) !== 0x02014b50) fail("invalid ZIP central directory");
    const nameLength = archive.readUInt16LE(cursor + 28);
    const extraLength = archive.readUInt16LE(cursor + 30);
    const commentLength = archive.readUInt16LE(cursor + 32);
    const endOfEntry = cursor + 46 + nameLength + extraLength + commentLength;
    if (endOfEntry > archive.length) fail("truncated ZIP central directory entry");
    names.push({ name: archive.toString("utf8", cursor + 46, cursor + 46 + nameLength), size: archive.readUInt32LE(cursor + 24), compressedSize: archive.readUInt32LE(cursor + 20), method: archive.readUInt16LE(cursor + 10), offset: archive.readUInt32LE(cursor + 42) });
    cursor = endOfEntry;
  }
  return names;
}

function checksum(content) {
  return createHash("sha256").update(content).digest("hex");
}

function readAsset(archive, entry) {
  const { offset, compressedSize, method, size, name } = entry;
  if (offset + 30 > archive.length || archive.readUInt32LE(offset) !== 0x04034b50) fail(`invalid asset header: ${name}`);
  const start = offset + 30 + archive.readUInt16LE(offset + 26) + archive.readUInt16LE(offset + 28);
  if (start + compressedSize > archive.length || (method !== 0 && method !== 8)) fail(`invalid asset payload: ${name}`);
  const compressed = archive.subarray(start, start + compressedSize);
  const content = method === 8 ? inflateRawSync(compressed, { maxOutputLength: size }) : compressed;
  if (content.length !== size) fail(`invalid asset size: ${name}`);
  return content;
}

export function verifyWebviewArchive(archive, prefix = "extension/dist/webview") {
  const entries = zipEntries(archive);
  const names = entries.map(entry => entry.name);
  const unexpected = names.filter(name => name.startsWith(`${prefix}/`) && !name.endsWith("/") && !requiredAssets.some(asset => name === `${prefix}/${asset}`));
  if (unexpected.length) fail(`unexpected frontend asset: ${unexpected.join(", ")}`);
  const sha256 = {};
  for (const asset of requiredAssets) {
    const name = `${prefix}/${asset}`;
    const matches = entries.filter(entry => entry.name === name);
    if (!matches.length) fail(`VSIX is missing ${name}`);
    if (matches.length !== 1) fail(`duplicate frontend asset: ${name}`);
    if (matches[0].size === 0) fail(`VSIX asset is empty: ${name}`);
    sha256[asset] = checksum(readAsset(archive, matches[0]));
  }
  return { assets: requiredAssets.map((asset) => `${prefix}/${asset}`), entries: names.length, sha256 };
}

export async function verifyWebviewDirectory(rootDir) {
  const directory = path.resolve(rootDir, "dist", "webview");
  const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error?.code === "ENOENT") fail(`directory is missing: ${directory}`);
    throw error;
  });
  const names = new Set(entries.filter((entry) => entry.isFile()).map((entry) => entry.name));
  const sha256 = {};
  for (const asset of requiredAssets) {
    if (!names.has(asset)) fail(`bundle is missing dist/webview/${asset}`);
    const details = await stat(path.join(directory, asset));
    if (details.size === 0) fail(`bundle asset is empty: dist/webview/${asset}`);
    sha256[asset] = checksum(await readFile(path.join(directory, asset)));
  }
  const extraJavaScript = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".js") && entry.name !== "webview.js");
  if (extraJavaScript.length > 0) fail(`unexpected JavaScript chunks: ${extraJavaScript.map((entry) => entry.name).join(", ")}`);
  return { directory, assets: requiredAssets, entries: entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort(), sha256 };
}

export async function verifyWebviewAssets({ rootDir = process.cwd(), archivePath } = {}) {
  const bundle = await verifyWebviewDirectory(rootDir);
  const archive = archivePath ? verifyWebviewArchive(await readFile(archivePath)) : undefined;
  if (archive) for (const asset of requiredAssets) {
    if (archive.sha256[asset] !== bundle.sha256[asset]) fail(`VSIX ${asset} does not match the current build`);
  }
  return { bundle, archive };
}
