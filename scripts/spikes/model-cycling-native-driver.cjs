// Actual extension-host driver: no substituted window APIs or automatic messages.
const vscode = require('vscode');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const cases = ['initial-empty', 'native-subset', 'cancel-preserves', 'model-wrap', 'thinking-cycle', 'busy-pending-settlement', 'explicit-empty', 'existing-selector', 'english-keyboard-visual', 'chinese-keyboard-visual'];
async function waitReview(root) {
  const deadline = Date.now() + 3000000;
  while (Date.now() < deadline) {
    try { return JSON.parse(await fs.readFile(path.join(root, 'review.json'), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Native review deadline exceeded');
}
exports.run = async () => {
  const evidence = process.env.PI_MODEL_CYCLING_EVIDENCE;
  const record = { mode: process.env.PI_MODEL_CYCLING_MODE, vscode: vscode.version, evidenceKind: 'actual native driver plus explicit agent UI review' };
  try {
    const extension = vscode.extensions.getExtension('pi-vscode-dev.pi-vscode');
    assert.ok(extension);
    record.extensionPath = extension.extensionPath;
    record.extensionVersion = extension.packageJSON.version;
    record.piVersion = JSON.parse(await fs.readFile(path.join(extension.extensionPath, 'node_modules/@earendil-works/pi-coding-agent/package.json'), 'utf8')).version;
    await vscode.commands.executeCommand('pi-vscode.focusChat');
    await fs.writeFile(path.join(evidence, 'ready-for-native-review.json'), JSON.stringify(record, null, 2));
    const review = await waitReview(process.env.PI_MODEL_CYCLING_FIXTURE);
    for (const name of cases) assert.equal(review.cases?.[name]?.result, 'passed', 'Missing native case: ' + name);
    assert.ok(Array.isArray(review.artifacts) && review.artifacts.length > 0, 'Native artifacts required');
    record.review = review;
    record.result = 'review-complete';
    await fs.writeFile(path.join(evidence, 'result.json'), JSON.stringify(record, null, 2));
  } catch (error) {
    await fs.writeFile(path.join(evidence, 'result.json'), JSON.stringify({ ...record, result: 'failed', error: String(error) }, null, 2));
    throw error;
  }
};
