const FORCE_BROWSER_LABEL = 'gate/browser';
const SUPPRESS_BROWSER_LABEL = 'gate/no-browser';
const NO_CODE_LABEL = 'gate/no-code';
const BROWSER_SMOKE_ONLY_LABEL = 'gate/browser-smoke-only';

const AUTO_BROWSER_LABELS = new Set([
  'role/ui-designer',
  'role/cartographer',
  'epic/ui'
]);

const BROWSER_KEYWORDS = [
  'map',
  'route',
  'routing',
  'search',
  'overlay',
  'marker',
  'station',
  'toggle',
  'panel',
  'responsive',
  'accessibility',
  'render'
];

export function taskLabels(task) {
  return Array.isArray(task?.labels) ? task.labels.filter((label) => typeof label === 'string') : [];
}

export function hasBrowserKeyword(value) {
  const normalized = String(value || '').toLowerCase();
  return BROWSER_KEYWORDS.find((keyword) => normalized.includes(keyword)) || null;
}

export function classifyTaskForGates(task, changedFiles = []) {
  if (!task || typeof task !== 'object') {
    throw new TypeError('classifyTaskForGates requires a task object');
  }

  const id = String(task.id || task.identifier || task.legacyId || '<unknown>');
  const browserGateTag = String(task.browserGateTag || task.legacyId || id);
  const labels = new Set(taskLabels(task));
  const reasons = [];
  const browserReasons = [];
  const smokeOnly = labels.has(BROWSER_SMOKE_ONLY_LABEL);
  const noCode = labels.has(NO_CODE_LABEL);

  if (noCode) {
    reasons.push(`${NO_CODE_LABEL} skips code and browser gates`);
    return {
      id,
      browserGateTag,
      runQuality: false,
      runBrowser: false,
      smokeOnly,
      taskTagRequired: false,
      reasons,
      browserReasons
    };
  }

  reasons.push('code gate required by default');

  if (labels.has(FORCE_BROWSER_LABEL)) {
    browserReasons.push(`${FORCE_BROWSER_LABEL} label`);
  } else if (labels.has(SUPPRESS_BROWSER_LABEL)) {
    reasons.push(`${SUPPRESS_BROWSER_LABEL} suppresses automatic browser gate`);
  } else if (task.type === 'feature') {
    browserReasons.push('task type is feature');
  } else {
    const matchedLabel = [...labels].find((label) => AUTO_BROWSER_LABELS.has(label));
    if (matchedLabel) {
      browserReasons.push(`${matchedLabel} label`);
    }
  }

  if (!browserReasons.length && !labels.has(SUPPRESS_BROWSER_LABEL)) {
    const textKeyword = hasBrowserKeyword(`${task.title || ''}\n${task.description || ''}`);
    if (textKeyword) {
      browserReasons.push(`task text mentions "${textKeyword}"`);
    }
  }

  if (!browserReasons.length && !labels.has(SUPPRESS_BROWSER_LABEL)) {
    const changedFile = changedFiles.find((filePath) => hasBrowserKeyword(filePath));
    if (changedFile) {
      browserReasons.push(`changed file "${changedFile}" looks user-facing`);
    }
  }

  const runBrowser = browserReasons.length > 0;
  if (runBrowser) {
    reasons.push(...browserReasons.map((reason) => `browser gate required: ${reason}`));
    if (smokeOnly) {
      reasons.push(`${BROWSER_SMOKE_ONLY_LABEL} allows @smoke browser coverage`);
    } else {
      reasons.push(`browser gate requires a Playwright title containing @${browserGateTag}`);
    }
  }

  return {
    id,
    browserGateTag,
    runQuality: true,
    runBrowser,
    smokeOnly,
    taskTagRequired: runBrowser && !smokeOnly,
    reasons,
    browserReasons
  };
}

export function combineTaskGatePlans(taskPlans) {
  const runQuality = taskPlans.some((taskPlan) => taskPlan.runQuality);
  const runBrowserSmoke = taskPlans.some((taskPlan) => taskPlan.runBrowser && taskPlan.smokeOnly);
  const browserGateTags = taskPlans
    .filter((taskPlan) => taskPlan.runBrowser && !taskPlan.smokeOnly)
    .map((taskPlan) => taskPlan.browserGateTag);

  const commands = [];
  if (runQuality) {
    commands.push({ name: 'quality', command: 'npm run quality' });
  }
  if (runBrowserSmoke) {
    commands.push({
      name: 'browser-smoke',
      command: 'npm run test:browser:required -- --grep @smoke'
    });
  }
  for (const gateTag of browserGateTags) {
    commands.push({
      name: `browser-${gateTag}`,
      command: `npm run test:browser:required -- --grep @${gateTag}`
    });
  }

  return {
    taskPlans,
    runQuality,
    runBrowserSmoke,
    browserGateTags,
    commands
  };
}

export function formatGatePlan(plan, changedFiles = []) {
  const lines = ['Task gate plan'];
  lines.push('');
  lines.push('Commands:');
  if (plan.commands.length === 0) {
    lines.push('- none');
  } else {
    for (const command of plan.commands) {
      lines.push(`- ${command.command}`);
    }
  }

  lines.push('');
  lines.push('Task reasons:');
  for (const taskPlan of plan.taskPlans) {
    lines.push(`- ${taskPlan.id}: ${taskPlan.reasons.join('; ') || 'no gates required'}`);
  }

  if (changedFiles.length > 0) {
    lines.push('');
    lines.push('Changed files considered:');
    for (const changedFile of changedFiles) {
      lines.push(`- ${changedFile}`);
    }
  }

  return lines.join('\n');
}
