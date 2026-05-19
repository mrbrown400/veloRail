import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  evaluateBashCommand,
  extractCommand
} from '../scripts/overstory-hook-policy.mjs';

test('git push remains blocked', () => {
  const decision = evaluateBashCommand('git push origin main');

  assert.equal(decision.decision, 'block');
  assert.match(decision.reason, /git push/);
});

test('readonly unsafe mail check is blocked', () => {
  const decision = evaluateBashCommand('ov mail check --agent builder-vr101');

  assert.equal(decision.decision, 'block');
  assert.match(decision.reason, /ov mail list --to/);
});

test('mail check help remains allowed', () => {
  const decision = evaluateBashCommand('ov mail check --help');

  assert.equal(decision.decision, 'allow');
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

test('user prompt hook uses read-only mail listing', () => {
  const hooks = JSON.parse(readFileSync('.overstory/hooks.json', 'utf8'));
  const userPromptCommands = hooks.hooks.UserPromptSubmit.flatMap((entry) => (
    entry.hooks.map((hook) => hook.command)
  ));

  assert.ok(userPromptCommands.some((command) => (
    command.includes('ov mail list --to orchestrator --unread')
  )));
  assert.ok(userPromptCommands.every((command) => !command.includes('ov mail check')));
});
