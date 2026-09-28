import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
function sources(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink() || ['.local-env', 'node_modules', 'dist'].includes(entry.name)) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sources(file) : /\.(?:ts|mjs)$/.test(entry.name) ? [file] : [];
  });
}

// A launch-policy check, not a claim that a mocked process proves native window
// behavior. Actual Windows console observations are recorded in WI-022.
// Limit discovery to source/script trees; never walk profiles or .local-env.
test('repository background process boundaries explicitly hide Windows consoles', () => {
  const violations = [];
  let checked = 0;
  for (const file of [...sources(path.join(root, 'src')), ...sources(path.join(root, 'scripts'))]) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = node => {
      if (ts.isCallExpression(node)) {
        const name = node.expression.getText(source);
        if (/^(?:spawn|spawnSync|nodeSpawn|execFileSync|execFile|\(environment\.spawn \?\? spawn\))$/.test(name)) {
          const options = node.arguments[2];
          // These two test recorders deliberately forward their production boundary's
          // exact options. Their public-seam tests check windowsHide before forwarding.
          const relative = path.relative(root, file).replaceAll('\\', '/');
          const recordingForwarder = ((relative === 'scripts/testing/test-runner.spec.mjs' && name === 'spawnSync')
              || (relative === 'src/adapter/sessions/tests/session-backend.spec.ts' && name === 'nodeSpawn')) && options?.getText(source) === 'options';
          if (!recordingForwarder) {
            checked++;
            const properties = options && ts.isObjectLiteralExpression(options) ? options.properties : [];
            const hide = properties.findLast(p => ts.isPropertyAssignment(p) && p.name.getText(source) === 'windowsHide');
            // A later spread could overwrite the guarantee. Put windowsHide last
            // when inheriting options from another boundary.
            const index = properties.indexOf(hide);
            if (!hide || hide.initializer.kind !== ts.SyntaxKind.TrueKeyword
              || properties.slice(index + 1).some(ts.isSpreadAssignment)) {
              violations.push(`${relative}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  assert.ok(checked >= 15, 'must inspect the real process-launch inventory');
  assert.deepEqual(violations, [], 'background launches must not allocate visible consoles');
});
