import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { verifyWebviewArchive, verifyWebviewAssets, verifyWebviewDirectory } from "./verify-webview-assets-lib.mjs";

function zip(entries) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const [name, body] of Object.entries(entries)) {
    const nameBytes = Buffer.from(name);
    const content = Buffer.from(body);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(nameBytes.length, 26);
    local.push(localHeader, nameBytes, content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(nameBytes.length, 28);
    centralHeader.writeUInt32LE(offset, 42);
    central.push(centralHeader, nameBytes);
    offset += localHeader.length + nameBytes.length + content.length;
  }
  const centralBody = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(centralBody.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, centralBody, end]);
}

async function fixture(t, files) {
  const root = await mkdtemp(path.join(os.tmpdir(), "pi-vscode-webview-assets-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "dist", "webview"), { recursive: true });
  for (const [name, body] of Object.entries(files)) await writeFile(path.join(root, "dist", "webview", name), body);
  return root;
}

test("static verifier accepts the stable bundle and packaged VSIX asset paths", async (t) => {
  const root = await fixture(t, { "webview.js": "console.log('bundle');", "webview.css": ":root{}" });
  const archive = zip({
    "extension/dist/webview/webview.js": "bundle",
    "extension/dist/webview/webview.css": "style",
    "extension/dist/extension.js": "host",
  });
  const result = await verifyWebviewAssets({ rootDir: root });
  assert.deepEqual(result.bundle.assets, ["webview.js", "webview.css"]);
  assert.equal(verifyWebviewArchive(archive).entries, 3);
});

test("static verifier rejects missing assets and unexpected JavaScript chunks", async (t) => {
  const root = await fixture(t, { "webview.js": "bundle", "webview.css": "style", "webview-extra.js": "chunk" });
  await assert.rejects(verifyWebviewDirectory(root), /unexpected JavaScript chunks/);
  await rm(path.join(root, "dist", "webview", "webview-extra.js"));
  await rm(path.join(root, "dist", "webview", "webview.css"));
  await assert.rejects(verifyWebviewDirectory(root), /bundle is missing dist\/webview\/webview\.css/);
  assert.throws(() => verifyWebviewArchive(zip({ "extension/dist/webview/webview.js": "bundle" })), /VSIX is missing/);
});

test("static archive verifier rejects empty or unexpected frontend assets", () => {
  assert.throws(() => verifyWebviewArchive(zip({
    "extension/dist/webview/webview.js": "", "extension/dist/webview/webview.css": "style",
  })), /asset is empty/);
  assert.throws(() => verifyWebviewArchive(zip({
    "extension/dist/webview/webview.js": "bundle", "extension/dist/webview/webview.css": "style",
    "extension/dist/webview/preview.js": "synthetic host",
  })), /unexpected frontend asset/);
});

test("VSIX verification binds the packaged frontend to the current build", async (t) => {
  const root = await fixture(t, { "webview.js": "current bundle", "webview.css": "current style" });
  const archivePath = path.join(root, "test.vsix");
  await writeFile(archivePath, zip({
    "extension/dist/webview/webview.js": "stale bundle", "extension/dist/webview/webview.css": "current style",
  }));
  await assert.rejects(verifyWebviewAssets({ rootDir: root, archivePath }), /does not match the current build/);
  await writeFile(archivePath, zip({
    "extension/dist/webview/webview.js": "current bundle", "extension/dist/webview/webview.css": "current style",
  }));
  const result = await verifyWebviewAssets({ rootDir: root, archivePath });
  assert.deepEqual(result.archive.sha256, result.bundle.sha256);
});
