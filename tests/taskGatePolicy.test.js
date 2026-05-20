import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyTaskForGates,
  combineTaskGatePlans
} from '../scripts/task-gate-policy.mjs';

test('gate/browser forces browser verification', () => {
  const plan = classifyTaskForGates({
    id: 'VR-101',
    type: 'task',
    labels: ['gate/browser']
  });

  assert.equal(plan.runQuality, true);
  assert.equal(plan.runBrowser, true);
  assert.equal(plan.taskTagRequired, true);
});

test('gate/no-browser suppresses automatic browser verification', () => {
  const plan = classifyTaskForGates({
    id: 'VR-303',
    type: 'task',
    title: 'Redesign map controls',
    labels: ['role/ui-designer', 'gate/no-browser']
  });

  assert.equal(plan.runQuality, true);
  assert.equal(plan.runBrowser, false);
});

test('gate/no-code skips code and browser gates', () => {
  const plan = classifyTaskForGates({
    id: 'VR-DOC',
    type: 'feature',
    title: 'Document map behavior',
    labels: ['gate/no-code']
  });

  assert.equal(plan.runQuality, false);
  assert.equal(plan.runBrowser, false);
});

test('ui labels automatically require browser verification', () => {
  const plan = classifyTaskForGates({
    id: 'VR-306',
    type: 'task',
    labels: ['role/ui-designer']
  });

  assert.equal(plan.runBrowser, true);
});

test('data-only task does not require browser verification by default', () => {
  const plan = classifyTaskForGates({
    id: 'VR-402',
    type: 'task',
    title: 'Import corridor dataset',
    labels: ['role/transit-data']
  });

  assert.equal(plan.runQuality, true);
  assert.equal(plan.runBrowser, false);
});

test('changed user-facing files automatically require browser verification', () => {
  const plan = classifyTaskForGates({
    id: 'VR-XYZ',
    type: 'task',
    title: 'Adjust component state',
    labels: ['role/infrastructure']
  }, ['src/components/Map/MapContainer.tsx']);

  assert.equal(plan.runBrowser, true);
});

test('linear task can preserve legacy browser gate tag', () => {
  const plan = classifyTaskForGates({
    id: 'VEL-42',
    legacyId: 'VR-304',
    browserGateTag: 'VR-304',
    type: 'task',
    labels: ['role/ui-designer']
  });

  assert.equal(plan.browserGateTag, 'VR-304');
});

test('multi-task gate plan computes the union of required gates', () => {
  const dataPlan = classifyTaskForGates({
    id: 'VR-402',
    type: 'task',
    labels: ['role/transit-data']
  });
  const featurePlan = classifyTaskForGates({
    id: 'VEL-101',
    legacyId: 'VR-101',
    browserGateTag: 'VR-101',
    type: 'feature',
    labels: []
  });

  const combined = combineTaskGatePlans([dataPlan, featurePlan]);

  assert.equal(combined.runQuality, true);
  assert.deepEqual(combined.browserGateTags, ['VR-101']);
  assert.deepEqual(combined.commands.map((command) => command.command), [
    'npm run quality',
    'npm run test:browser:required -- --grep @VR-101'
  ]);
});
