// Ordinary observer: actual UI consent only; no substituted VS Code APIs or automatic exports.
const vscode = require('vscode');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const cases = ['safe-initial-metadata', 'read-only-preview', 'review-cancel', 'save-cancel', 'overlap-no-second-preview', 'english-export', 'repeat-recovery', 'chinese-review-cancel', 'chinese-export', 'bilingual-keyboard-visual'];
function validateSnapshot(bytes) {
  assert.ok(Buffer.byteLength(bytes) <= 4096, 'Bounded diagnostic bytes');
  const report = JSON.parse(bytes);
  assert.equal(Object.keys(report).sort().join(','), 'host,schema,schemaVersion,scope,state,versions', 'Only allowlisted diagnostic keys');
  assert.equal(report.schema, 'pi-vscode-local-diagnostic'); assert.equal(report.schemaVersion, 1);
  assert.equal(Object.keys(report.versions).sort().join(','), 'extension,piRuntime,vscode');
  assert.equal(Object.keys(report.host).sort().join(','), 'architecture,platform');
  assert.equal(Object.keys(report.state).sort().join(','), 'chatBusy,controlled,hostError,modelBusy,runtime,runtimeError,sessionBusy,workspace');
  assert.equal(report.state.runtime, 'not-started', 'Export must not start a runtime');
  assert.equal(report.state.workspace, 'eligible');
  for (const key of ['chatBusy', 'modelBusy', 'sessionBusy', 'controlled', 'hostError', 'runtimeError']) assert.equal(typeof report.state[key], 'boolean');
  assert.ok(!bytes.includes('DIAGNOSTIC_EXCLUDED_'), 'Excluded synthetic content');
  return report;
}
async function waitReview(root) {
  const deadline = Date.now() + 3000000;
  while (Date.now() < deadline) {
    try { return JSON.parse(await fs.readFile(path.join(root, 'review.json'), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Native review deadline exceeded');
}
async function observe(document, record, evidence) {
  const bytes = document.getText(); const report = validateSnapshot(bytes);
  assert.equal(document.isDirty, false);
  assert.equal(report.versions.extension, record.extensionVersion);
  assert.equal(report.versions.piRuntime, record.piVersion);
  assert.equal(report.versions.vscode, record.vscode);
  assert.ok(record.previews.length < 8, 'Native fixture preview budget');
  const entry = { uri: document.uri.toString(), bytes, report, dirty: document.isDirty };
  record.previews.push(entry);
  await fs.writeFile(path.join(evidence, 'preview-' + record.previews.length + '.json'), bytes);
  await fs.writeFile(path.join(evidence, 'observations.json'), JSON.stringify(record, null, 2));
}
async function verifyExports(root, record) {
  assert.ok(record.previews.length >= 4, 'Actual cancelled and reviewed previews required');
  record.exports = [];
  for (const language of ['en', 'zh']) {
    const file = path.join(root, 'exports', language + '.json');
    const bytes = await fs.readFile(file, 'utf8'); const stat = await fs.stat(file);
    validateSnapshot(bytes); assert.ok(record.previews.some(item => item.bytes === bytes), 'Export must equal exact frozen preview');
    assert.ok(stat.isFile() && stat.size <= 4096); assert.equal(stat.mode & 0o777, 0o600);
    record.exports.push({ language, bytes, size: stat.size, mode: stat.mode & 0o777 });
  }
}
exports.run = async () => {
  const evidence = process.env.PI_DIAGNOSTICS_EVIDENCE;
  const record = { mode: process.env.PI_DIAGNOSTICS_MODE, vscode: vscode.version, evidenceKind: 'actual ordinary observer plus explicit agent UI review', previews: [] };
  let subscription; let pending = Promise.resolve(); let captureError;
  try {
    const extension = vscode.extensions.getExtension('pi-vscode-dev.pi-vscode'); assert.ok(extension);
    record.extensionPath = extension.extensionPath; record.extensionVersion = extension.packageJSON.version;
    record.piVersion = JSON.parse(await fs.readFile(path.join(extension.extensionPath, 'node_modules/@earendil-works/pi-coding-agent/package.json'), 'utf8')).version;
    subscription = vscode.workspace.onDidOpenTextDocument(document => {
      if (document.uri.scheme !== 'pi-vscode-diagnostics') return;
      pending = pending.then(() => observe(document, record, evidence)).catch(error => { captureError ??= error; });
    });
    await vscode.commands.executeCommand('pi-vscode.focusChat');
    await fs.writeFile(path.join(evidence, 'ready-for-native-review.json'), JSON.stringify(record, null, 2));
    const review = await waitReview(process.env.PI_DIAGNOSTICS_FIXTURE);
    for (const name of cases) assert.equal(review.cases?.[name]?.result, 'passed', 'Missing native case: ' + name);
    assert.ok(Array.isArray(review.artifacts) && review.artifacts.length > 0, 'Native artifacts required');
    await pending; if (captureError) throw captureError;
    await verifyExports(process.env.PI_DIAGNOSTICS_FIXTURE, record);
    record.review = review; record.result = 'review-complete';
    await fs.writeFile(path.join(evidence, 'result.json'), JSON.stringify(record, null, 2));
  } catch (error) {
    await fs.writeFile(path.join(evidence, 'result.json'), JSON.stringify({ ...record, result: 'failed', error: String(error) }, null, 2));
    throw error;
  } finally { subscription?.dispose(); }
};
