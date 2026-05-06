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

export function issueLabels(issue) {
  return Array.isArray(issue?.labels) ? issue.labels.filter((label) => typeof label === 'string') : [];
}

export function hasBrowserKeyword(value) {
  const normalized = String(value || '').toLowerCase();
  return BROWSER_KEYWORDS.find((keyword) => normalized.includes(keyword)) || null;
}

export function classifyIssueForGates(issue, changedFiles = []) {
  if (!issue || typeof issue !== 'object') {
    throw new TypeError('classifyIssueForGates requires an issue object');
  }

  const id = String(issue.id || '<unknown>');
  const labels = new Set(issueLabels(issue));
  const reasons = [];
  const browserReasons = [];
  const smokeOnly = labels.has(BROWSER_SMOKE_ONLY_LABEL);
  const noCode = labels.has(NO_CODE_LABEL);

  if (noCode) {
    reasons.push(`${NO_CODE_LABEL} skips code and browser gates`);
    return {
      id,
      runQuality: false,
      runBrowser: false,
      smokeOnly,
      issueTagRequired: false,
      reasons,
      browserReasons
    };
  }

  reasons.push('code gate required by default');

  if (labels.has(FORCE_BROWSER_LABEL)) {
    browserReasons.push(`${FORCE_BROWSER_LABEL} label`);
  } else if (labels.has(SUPPRESS_BROWSER_LABEL)) {
    reasons.push(`${SUPPRESS_BROWSER_LABEL} suppresses automatic browser gate`);
  } else if (issue.type === 'feature') {
    browserReasons.push('issue type is feature');
  } else {
    const matchedLabel = [...labels].find((label) => AUTO_BROWSER_LABELS.has(label));
    if (matchedLabel) {
      browserReasons.push(`${matchedLabel} label`);
    }
  }

  if (!browserReasons.length && !labels.has(SUPPRESS_BROWSER_LABEL)) {
    const textKeyword = hasBrowserKeyword(`${issue.title || ''}\n${issue.description || ''}`);
    if (textKeyword) {
      browserReasons.push(`issue text mentions "${textKeyword}"`);
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
      reasons.push(`browser gate requires a Playwright title containing @${id}`);
    }
  }

  return {
    id,
    runQuality: true,
    runBrowser,
    smokeOnly,
    issueTagRequired: runBrowser && !smokeOnly,
    reasons,
    browserReasons
  };
}

export function combineIssueGatePlans(issuePlans) {
  const runQuality = issuePlans.some((issuePlan) => issuePlan.runQuality);
  const runBrowserSmoke = issuePlans.some((issuePlan) => issuePlan.runBrowser && issuePlan.smokeOnly);
  const browserIssueIds = issuePlans
    .filter((issuePlan) => issuePlan.runBrowser && !issuePlan.smokeOnly)
    .map((issuePlan) => issuePlan.id);

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
  for (const issueId of browserIssueIds) {
    commands.push({
      name: `browser-${issueId}`,
      command: `npm run test:browser:required -- --grep @${issueId}`
    });
  }

  return {
    issuePlans,
    runQuality,
    runBrowserSmoke,
    browserIssueIds,
    commands
  };
}

export function formatGatePlan(plan, changedFiles = []) {
  const lines = ['Issue gate plan'];
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
  lines.push('Issue reasons:');
  for (const issuePlan of plan.issuePlans) {
    lines.push(`- ${issuePlan.id}: ${issuePlan.reasons.join('; ') || 'no gates required'}`);
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

