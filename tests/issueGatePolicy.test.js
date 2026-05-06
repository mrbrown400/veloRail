import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyIssueForGates,
  combineIssueGatePlans
} from '../scripts/issue-gate-policy.mjs';

test('gate/browser forces browser verification', () => {
  const plan = classifyIssueForGates({
    id: 'VR-101',
    type: 'task',
    labels: ['gate/browser']
  });

  assert.equal(plan.runQuality, true);
  assert.equal(plan.runBrowser, true);
  assert.equal(plan.issueTagRequired, true);
});

test('gate/no-browser suppresses automatic browser verification', () => {
  const plan = classifyIssueForGates({
    id: 'VR-303',
    type: 'task',
    title: 'Redesign map controls',
    labels: ['role/ui-designer', 'gate/no-browser']
  });

  assert.equal(plan.runQuality, true);
  assert.equal(plan.runBrowser, false);
});

test('gate/no-code skips code and browser gates', () => {
  const plan = classifyIssueForGates({
    id: 'VR-DOC',
    type: 'feature',
    title: 'Document map behavior',
    labels: ['gate/no-code']
  });

  assert.equal(plan.runQuality, false);
  assert.equal(plan.runBrowser, false);
});

test('ui labels automatically require browser verification', () => {
  const plan = classifyIssueForGates({
    id: 'VR-306',
    type: 'task',
    labels: ['role/ui-designer']
  });

  assert.equal(plan.runBrowser, true);
});

test('data-only issue does not require browser verification by default', () => {
  const plan = classifyIssueForGates({
    id: 'VR-402',
    type: 'task',
    title: 'Import corridor dataset',
    labels: ['role/transit-data']
  });

  assert.equal(plan.runQuality, true);
  assert.equal(plan.runBrowser, false);
});

test('changed user-facing files automatically require browser verification', () => {
  const plan = classifyIssueForGates({
    id: 'VR-XYZ',
    type: 'task',
    title: 'Adjust component state',
    labels: ['role/infrastructure']
  }, ['src/components/Map/MapContainer.tsx']);

  assert.equal(plan.runBrowser, true);
});

test('multi-issue gate plan computes the union of required gates', () => {
  const dataPlan = classifyIssueForGates({
    id: 'VR-402',
    type: 'task',
    labels: ['role/transit-data']
  });
  const featurePlan = classifyIssueForGates({
    id: 'VR-101',
    type: 'feature',
    labels: []
  });

  const combined = combineIssueGatePlans([dataPlan, featurePlan]);

  assert.equal(combined.runQuality, true);
  assert.deepEqual(combined.browserIssueIds, ['VR-101']);
  assert.deepEqual(combined.commands.map((command) => command.command), [
    'npm run quality',
    'npm run test:browser:required -- --grep @VR-101'
  ]);
});

