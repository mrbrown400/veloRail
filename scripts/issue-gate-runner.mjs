import { spawnSync } from 'node:child_process';
import {
  classifyIssueForGates,
  combineIssueGatePlans,
  formatGatePlan
} from './issue-gate-policy.mjs';

function parseArgs(argv, { requireReason = false } = {}) {
  const ids = [];
  let reason = '';
  let explain = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--explain' || arg === '--dry-run') {
      explain = true;
      continue;
    }
    if (arg === '--reason') {
      reason = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg.startsWith('--reason=')) {
      reason = arg.slice('--reason='.length);
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    ids.push(arg);
  }

  if (ids.length === 0) {
    throw new Error('At least one Seeds issue id is required.');
  }

  if (requireReason && !reason.trim()) {
    throw new Error('Closing issues requires --reason "<summary>".');
  }

  return { ids, reason, explain };
}

function runText(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    return '';
  }
  return result.stdout.trim();
}

function appendLines(target, text) {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !target.includes(trimmed)) {
      target.push(trimmed);
    }
  }
}

function refExists(ref) {
  return spawnSync('git', ['rev-parse', '--verify', '--quiet', ref], { stdio: 'ignore' }).status === 0;
}

function getChangedFiles() {
  const changedFiles = [];
  appendLines(changedFiles, runText('git', ['diff', '--name-only']));
  appendLines(changedFiles, runText('git', ['diff', '--name-only', '--cached']));
  appendLines(changedFiles, runText('git', ['ls-files', '--others', '--exclude-standard']));

  const baseRef = refExists('origin/main') ? 'origin/main' : refExists('main') ? 'main' : '';
  if (baseRef) {
    const mergeBase = runText('git', ['merge-base', 'HEAD', baseRef]);
    if (mergeBase) {
      appendLines(changedFiles, runText('git', ['diff', '--name-only', `${mergeBase}...HEAD`]));
    }
  }

  return changedFiles;
}

function readIssue(issueId) {
  const result = spawnSync('sd', ['show', issueId, '--json'], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`Failed to read Seeds issue ${issueId}.\n${result.stderr || result.stdout}`);
  }

  const parsed = JSON.parse(result.stdout);
  if (!parsed.issue) {
    throw new Error(`Seeds did not return an issue for ${issueId}.`);
  }
  return parsed.issue;
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}.`);
  }
}

function runGatePlan(plan) {
  if (plan.runQuality) {
    runCommand('npm', ['run', 'quality']);
  }
  if (plan.runBrowserSmoke) {
    runCommand('npm', ['run', 'test:browser:required', '--', '--grep', '@smoke']);
  }
  for (const issueId of plan.browserIssueIds) {
    runCommand('npm', ['run', 'test:browser:required', '--', '--grep', `@${issueId}`]);
  }
}

function closeIssues(ids, reason) {
  runCommand('sd', ['close', '--reason', reason, ...ids]);
}

export function buildGatePlan(ids, changedFiles = getChangedFiles()) {
  const issues = ids.map(readIssue);
  const issuePlans = issues.map((issue) => classifyIssueForGates(issue, changedFiles));
  return {
    changedFiles,
    plan: combineIssueGatePlans(issuePlans)
  };
}

export async function runIssueGateCli(argv = process.argv.slice(2)) {
  const { ids, explain } = parseArgs(argv);
  const { changedFiles, plan } = buildGatePlan(ids);
  console.log(formatGatePlan(plan, changedFiles));
  if (!explain) {
    runGatePlan(plan);
  }
}

export async function runIssueCloseCli(argv = process.argv.slice(2)) {
  const { ids, reason, explain } = parseArgs(argv, { requireReason: true });
  const { changedFiles, plan } = buildGatePlan(ids);
  console.log(formatGatePlan(plan, changedFiles));
  if (explain) {
    return;
  }

  runGatePlan(plan);
  closeIssues(ids, reason);
}
