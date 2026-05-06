import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateBashCommand,
  extractCommand
} from '../scripts/overstory-hook-policy.mjs';

test('git push remains blocked', () => {
  const decision = evaluateBashCommand('git push origin main');

  assert.equal(decision.decision, 'block');
  assert.match(decision.reason, /git push/);
});

test('direct sd close is blocked', () => {
  const decision = evaluateBashCommand('sd close VR-101 --reason done');

  assert.equal(decision.decision, 'block');
  assert.match(decision.reason, /issue:close/);
});

test('direct closed status update is blocked', () => {
  const decision = evaluateBashCommand('sd update VR-101 --status closed');

  assert.equal(decision.decision, 'block');
  assert.match(decision.reason, /issue:close/);
});

test('direct closed status assignment is blocked', () => {
  const decision = evaluateBashCommand('sd update VR-101 --status=closed');

  assert.equal(decision.decision, 'block');
  assert.match(decision.reason, /issue:close/);
});

test('issue close wrapper is allowed', () => {
  const decision = evaluateBashCommand('npm run issue:close -- VR-101 --reason done');

  assert.equal(decision.decision, 'allow');
});

test('hook input command is extracted from nested tool input', () => {
  const command = extractCommand(JSON.stringify({
    tool_name: 'Bash',
    tool_input: {
      command: 'sd close VR-101'
    }
  }));

  assert.equal(command, 'sd close VR-101');
});

