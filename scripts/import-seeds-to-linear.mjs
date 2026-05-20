import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_SOURCE = '.seeds/issues.jsonl';
const DEFAULT_METADATA_PATH = '.linear/migration.json';
const DEFAULT_PROJECT_NAME = 'VeloRail Codex Migration';

const args = parseArgs(process.argv.slice(2));
const issues = readJsonl(args.source);
const report = buildReport(issues, args);

if (!args.apply) {
  printDryRun(report);
  process.exit(0);
}

if (!process.env.LINEAR_API_KEY) {
  throw new Error('LINEAR_API_KEY is required for --apply.');
}
if (!args.teamId) {
  throw new Error('A Linear team id is required. Pass --team-id <id> or set LINEAR_TEAM_ID.');
}

const project = await createProject(args);
const stateId = args.doneStateId || await findCompletedStateId(args.teamId);
const imported = [];

for (const issue of issues) {
  const created = await createIssue({
    issue,
    projectId: project.id,
    teamId: args.teamId,
    stateId
  });
  imported.push({
    legacyId: issue.id,
    linearId: created.id,
    linearIdentifier: created.identifier,
    browserGateTag: issue.id,
    title: issue.title,
    type: issue.type,
    labels: issue.labels || [],
    priority: issue.priority,
    url: created.url
  });
}

writeMetadata({
  pathName: args.metadataPath,
  project,
  tasks: imported
});

console.log(`Created Linear project ${project.name} (${project.id}).`);
console.log(`Imported ${imported.length} archived tasks into ${args.metadataPath}.`);

function parseArgs(argv) {
  const parsed = {
    apply: false,
    source: DEFAULT_SOURCE,
    metadataPath: DEFAULT_METADATA_PATH,
    projectName: DEFAULT_PROJECT_NAME,
    teamId: process.env.LINEAR_TEAM_ID || '',
    doneStateId: process.env.LINEAR_DONE_STATE_ID || ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      parsed.apply = false;
      continue;
    }
    if (arg === '--apply') {
      parsed.apply = true;
      continue;
    }
    if (arg === '--source') {
      parsed.source = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--metadata') {
      parsed.metadataPath = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--project-name') {
      parsed.projectName = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--team-id') {
      parsed.teamId = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--done-state-id') {
      parsed.doneStateId = argv[index + 1] || '';
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return parsed;
}

function readJsonl(filePath) {
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function buildReport(sourceIssues, options) {
  const ids = new Set();
  const duplicateIds = [];
  const statuses = {};
  const types = {};
  const priorities = {};
  const labels = {};
  const dependencyEdges = [];
  const missingDependencyTargets = [];

  for (const issue of sourceIssues) {
    if (ids.has(issue.id)) {
      duplicateIds.push(issue.id);
    }
    ids.add(issue.id);
    statuses[issue.status || 'unknown'] = (statuses[issue.status || 'unknown'] || 0) + 1;
    types[issue.type || 'task'] = (types[issue.type || 'task'] || 0) + 1;
    priorities[`P${issue.priority || 'none'}`] = (priorities[`P${issue.priority || 'none'}`] || 0) + 1;
    for (const label of issue.labels || []) {
      labels[label] = (labels[label] || 0) + 1;
    }
    for (const blocker of issue.blockedBy || []) {
      dependencyEdges.push([blocker, issue.id]);
      if (!ids.has(blocker) && !sourceIssues.some((candidate) => candidate.id === blocker)) {
        missingDependencyTargets.push([blocker, issue.id]);
      }
    }
    for (const blocked of issue.blocks || []) {
      dependencyEdges.push([issue.id, blocked]);
      if (!ids.has(blocked) && !sourceIssues.some((candidate) => candidate.id === blocked)) {
        missingDependencyTargets.push([issue.id, blocked]);
      }
    }
  }

  return {
    source: options.source,
    projectName: options.projectName,
    teamId: options.teamId,
    count: sourceIssues.length,
    statuses,
    types,
    priorities,
    topLabels: Object.entries(labels).sort((a, b) => b[1] - a[1]).slice(0, 20),
    duplicateIds,
    dependencyEdgeCount: dependencyEdges.length,
    missingDependencyTargets
  };
}

function printDryRun(currentReport) {
  console.log('Linear import dry run');
  console.log('');
  console.log(`Source: ${currentReport.source}`);
  console.log(`Target project to create: ${currentReport.projectName}`);
  console.log(`Target team id: ${currentReport.teamId || '<required for --apply>'}`);
  console.log(`Issues to import: ${currentReport.count}`);
  console.log(`Statuses: ${JSON.stringify(currentReport.statuses)}`);
  console.log(`Types: ${JSON.stringify(currentReport.types)}`);
  console.log(`Priorities: ${JSON.stringify(currentReport.priorities)}`);
  console.log(`Dependency edges: ${currentReport.dependencyEdgeCount}`);
  console.log(`Missing dependency targets: ${currentReport.missingDependencyTargets.length}`);
  console.log(`Duplicate ids: ${currentReport.duplicateIds.length ? currentReport.duplicateIds.join(', ') : 'none'}`);
  console.log('');
  console.log('Top labels:');
  for (const [label, count] of currentReport.topLabels) {
    console.log(`- ${label}: ${count}`);
  }
}

async function createProject(options) {
  const description = [
    'Codex-native VeloRail migration project.',
    '',
    'Imported from archived Seeds issues. All imported tasks are historical unless explicitly reopened.',
    'Active workflow uses Codex, Linear, GitHub, repo docs, and repo-local skills.'
  ].join('\n');

  const data = await linearGraphql(`
    mutation CreateProject($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        success
        project { id name url }
      }
    }
  `, {
    input: {
      name: options.projectName,
      description,
      teamIds: [options.teamId]
    }
  });

  return data.projectCreate.project;
}

async function findCompletedStateId(teamId) {
  const data = await linearGraphql(`
    query TeamStates($teamId: String!) {
      team(id: $teamId) {
        states {
          nodes { id name type }
        }
      }
    }
  `, { teamId });

  const states = data.team?.states?.nodes || [];
  const completed = states.find((state) => state.type === 'completed') ||
    states.find((state) => /done|closed|complete/i.test(state.name));
  if (!completed) {
    throw new Error('Could not find a completed Linear workflow state. Pass --done-state-id <id>.');
  }
  return completed.id;
}

async function createIssue({ issue, projectId, teamId, stateId }) {
  const data = await linearGraphql(`
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier title url }
      }
    }
  `, {
    input: {
      teamId,
      projectId,
      stateId,
      title: `[${issue.id}] ${issue.title}`,
      description: formatIssueBody(issue),
      priority: normalizePriority(issue.priority)
    }
  });

  return data.issueCreate.issue;
}

function formatIssueBody(issue) {
  const lines = [];
  lines.push(`Legacy Seeds ID: ${issue.id}`);
  lines.push(`Legacy status: ${issue.status || 'unknown'}`);
  lines.push(`Type: ${issue.type || 'task'}`);
  lines.push(`Priority: P${issue.priority || 'unknown'}`);
  lines.push(`Labels: ${(issue.labels || []).join(', ') || 'none'}`);
  if (issue.assignee) {
    lines.push(`Legacy assignee: ${issue.assignee}`);
  }
  if (issue.createdAt) {
    lines.push(`Created: ${issue.createdAt}`);
  }
  if (issue.updatedAt) {
    lines.push(`Updated: ${issue.updatedAt}`);
  }
  if (issue.closedAt) {
    lines.push(`Closed: ${issue.closedAt}`);
  }
  if (issue.closeReason) {
    lines.push('');
    lines.push('Close reason:');
    lines.push(issue.closeReason);
  }
  if ((issue.blockedBy || []).length || (issue.blocks || []).length) {
    lines.push('');
    lines.push('Dependencies:');
    for (const blocker of issue.blockedBy || []) {
      lines.push(`- Blocked by ${blocker}`);
    }
    for (const blocked of issue.blocks || []) {
      lines.push(`- Blocks ${blocked}`);
    }
  }
  lines.push('');
  lines.push('Source description:');
  lines.push(issue.description || '_No source description._');
  return lines.join('\n');
}

function normalizePriority(priority) {
  const value = Number(priority);
  if (value >= 1 && value <= 4) {
    return value;
  }
  return 3;
}

function writeMetadata({ pathName, project, tasks }) {
  mkdirSync(path.dirname(pathName), { recursive: true });
  writeFileSync(pathName, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    project,
    tasks
  }, null, 2)}\n`);
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
