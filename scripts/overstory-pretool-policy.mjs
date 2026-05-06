import { readFileSync } from 'node:fs';
import { evaluateBashCommand, extractCommand } from './overstory-hook-policy.mjs';

const input = readFileSync(0, 'utf8');
const command = extractCommand(input);
const decision = evaluateBashCommand(command);

if (decision.decision === 'block') {
  console.log(JSON.stringify(decision));
}

