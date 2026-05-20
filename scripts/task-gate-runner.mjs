import { spawnSync } from 'node:child_process';
import { findTaskById } from './task-metadata.mjs';
import {
  classifyTaskForGates,
  combineTaskGatePlans,
  formatGatePlan
} from './task-gate-policy.mjs';

function parseArgs(argv, { requireReason = false } = {}) {
  const ids = [];
  let reason = '';
  let explain = false;
  let applyLinear = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--explain' || arg === '--dry-run') {
      explain = true;
      continue;
    }
    if (arg === '--apply-linear') {
      applyLinear = true;
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
    throw new Error('At least one Linear or legacy task id is required.');
  }

  if (requireReason && !reason.trim()) {
    throw new Error('Closing tasks requires --reason "<summary>".');
  }

  return { ids, reason, explain, applyLinear };
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
  for (const gateTag of plan.browserGateTags) {
    runCommand('npm', ['run', 'test:browser:required', '--', '--grep', `@${gateTag}`]);
  }
}

export function buildGatePlan(ids, changedFiles = getChangedFiles()) {
  const taskLookups = ids.map((id) => findTaskById(id));
  const tasks = taskLookups.map((lookup) => lookup.task);
  const taskPlans = tasks.map((task) => classifyTaskForGates(task, changedFiles));
  return {
    changedFiles,
    tasks,
    plan: combineTaskGatePlans(taskPlans)
  };
}

async function closeLinearTasks(tasks, reason) {
  if (!process.env.LINEAR_API_KEY || !process.env.LINEAR_DONE_STATE_ID) {
    console.log('');
    console.log('Gates passed. Linear close was not applied because LINEAR_API_KEY and LINEAR_DONE_STATE_ID are not both set.');
    console.log(`Close these tasks in Linear with reason: ${reason}`);
    for (const task of tasks) {
      console.log(`- ${task.linearIdentifier || task.legacyId || task.id}: ${task.title}`);
    }
    return;
  }

  for (const task of tasks) {
    const issueId = task.linearId || task.id;
    if (!issueId) {
      throw new Error(`Task ${task.title} does not have a Linear id to close.`);
    }
    await linearGraphql(`
      mutation CloseTask($id: String!, $stateId: String!) {
        issueUpdate(id: $id, input: { stateId: $stateId }) {
          success
          issue { id identifier title }
        }
      }
    `, {
      id: issueId,
      stateId: process.env.LINEAR_DONE_STATE_ID
    });
  }
}

async function linearGraphql(query, variables) {
  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Authorization': process.env.LINEAR_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors) {
    throw new Error(JSON.stringify(payload.errors || payload, null, 2));
  }
  return payload.data;
}

export async function runTaskGateCli(argv = process.argv.slice(2)) {
  const { ids, explain } = parseArgs(argv);
  const { changedFiles, plan } = buildGatePlan(ids);
  console.log(formatGatePlan(plan, changedFiles));
  if (!explain) {
    runGatePlan(plan);
  }
}

export async function runTaskCloseCli(argv = process.argv.slice(2)) {
  const { ids, reason, explain, applyLinear } = parseArgs(argv, { requireReason: true });
  const { changedFiles, tasks, plan } = buildGatePlan(ids);
  console.log(formatGatePlan(plan, changedFiles));
  if (explain) {
    return;
  }

  runGatePlan(plan);
  if (applyLinear) {
    await closeLinearTasks(tasks, reason);
    return;
  }

  console.log('');
  console.log('Gates passed. Re-run with --apply-linear and LINEAR_API_KEY plus LINEAR_DONE_STATE_ID to update Linear automatically.');
}
