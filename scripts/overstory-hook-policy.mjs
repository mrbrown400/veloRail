export function extractCommand(input) {
  if (!input) {
    return '';
  }

  if (typeof input === 'string') {
    try {
      return extractCommand(JSON.parse(input));
    } catch {
      const match = input.match(/"command"\s*:\s*"([^"]+)"/);
      return match ? match[1] : '';
    }
  }

  if (typeof input !== 'object') {
    return '';
  }

  if (typeof input.command === 'string') {
    return input.command;
  }

  for (const value of Object.values(input)) {
    const command = extractCommand(value);
    if (command) {
      return command;
    }
  }

  return '';
}

export function evaluateBashCommand(command) {
  const normalized = String(command || '');
  if (/\bgit\s+push\b/.test(normalized)) {
    return {
      decision: 'block',
      reason: 'git push is blocked by overstory - merge locally, push manually when ready'
    };
  }

  if (/\bov\s+mail\s+check\b/.test(normalized) && !/\s--help\b/.test(normalized)) {
    return {
      decision: 'block',
      reason: 'ov mail check marks messages read and fails when the Overstory mail DB is read-only. Use: ov mail list --to $OVERSTORY_AGENT_NAME --unread'
    };
  }

  if (/\bsd\s+close\b/.test(normalized)) {
    return {
      decision: 'block',
      reason: 'Direct sd close is blocked. Use: npm run issue:close -- <issue-id> --reason "<summary>"'
    };
  }

  if (/\bsd\s+update\b/.test(normalized) && /--status(?:=|\s+)closed\b/.test(normalized)) {
    return {
      decision: 'block',
      reason: 'Direct Seeds closed status updates are blocked. Use: npm run issue:close -- <issue-id> --reason "<summary>"'
    };
  }

  return {
    decision: 'allow',
    reason: ''
  };
}
