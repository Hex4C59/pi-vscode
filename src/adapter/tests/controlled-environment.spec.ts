import { test } from 'node:test';
import assert from 'node:assert/strict';
import { controlledEnvironment } from '../controlledEnvironment.js';

test('controlled startup overrides offline opt-out while preserving provider environment',()=>{
  const inherited={PI_OFFLINE:'0',PI_TELEMETRY:'1',PI_VSCODE_GATE_ID:'stale',FIXTURE_PROVIDER_KEY:'fixture-only'};
  const unchanged = { ...inherited };
  const actual=controlledEnvironment(inherited,'current');
  assert.notStrictEqual(actual, inherited);
  assert.deepEqual(actual, { ...inherited, PI_OFFLINE: '1', PI_TELEMETRY: '0', PI_VSCODE_GATE_ID: 'current' });
  assert.deepEqual(inherited, unchanged);
});
