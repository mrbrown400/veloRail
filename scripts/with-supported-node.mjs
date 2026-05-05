#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const REQUIRED_RANGE = 'Node.js ^20.19.0 || >=22.12.0';
const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error(`Usage: node scripts/with-supported-node.mjs <command> [...args]`);
  process.exit(2);
}

function parseNodeVersion(value) {
  const match = String(value).trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }

  return {
    raw: match[0].startsWith('v') ? match[0] : `v${match[0]}`,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function isSupported(version) {
  if (!version) {
    return false;
  }

  if (version.major === 20) {
    return version.minor > 19 || (version.minor === 19 && version.patch >= 0);
  }

  if (version.major === 22) {
    return version.minor > 12 || (version.minor === 12 && version.patch >= 0);
  }

  return version.major > 22;
}

function readNodeVersion(nodePath) {
  if (!nodePath || !existsSync(nodePath)) {
    return null;
  }

  const result = spawnSync(nodePath, ['-v'], { encoding: 'utf8' });
  if (result.status !== 0) {
    return null;
  }

  return parseNodeVersion(result.stdout);
}

function addVersionedNodeDirs(candidates, root, suffix = 'bin/node') {
  if (!root || !existsSync(root)) {
    return;
  }

  for (const entry of readdirSync(root)) {
    candidates.push(join(root, entry, suffix));
  }
}

function addPlaywrightNodeCaches(candidates, root) {
  if (!root || !existsSync(root)) {
    return;
  }

  for (const entry of readdirSync(root)) {
    candidates.push(join(root, entry, 'node'));
  }
}

function candidateNodePaths() {
  const candidates = [
    process.env.VELO_RAIL_NODE,
    process.env.NODE_BINARY,
    process.execPath,
  ];

  for (const pathEntry of (process.env.PATH || '').split(delimiter)) {
    candidates.push(join(pathEntry, process.platform === 'win32' ? 'node.exe' : 'node'));
  }

  const home = process.env.HOME;
  addVersionedNodeDirs(candidates, home && join(home, '.nvm/versions/node'));
  addVersionedNodeDirs(candidates, home && join(home, '.volta/tools/image/node'));
  addVersionedNodeDirs(candidates, home && join(home, '.local/share/mise/installs/node'));
  addVersionedNodeDirs(candidates, home && join(home, '.asdf/installs/nodejs'));

  candidates.push(
    '/opt/homebrew/opt/node@22/bin/node',
    '/opt/homebrew/opt/node@20/bin/node',
    '/opt/homebrew/opt/node/bin/node',
    '/usr/local/opt/node@22/bin/node',
    '/usr/local/opt/node@20/bin/node',
    '/usr/local/opt/node/bin/node',
  );

  addPlaywrightNodeCaches(candidates, home && join(home, 'Library/Caches/ms-playwright-go'));
  addPlaywrightNodeCaches(candidates, home && join(home, 'Library/Caches/ms-playwright'));

  return [...new Set(candidates.filter(Boolean))];
}

function findSupportedNode() {
  const supported = [];

  for (const [index, nodePath] of candidateNodePaths().entries()) {
    const version = readNodeVersion(nodePath);
    if (isSupported(version)) {
      supported.push({ nodePath, version, index });
    }
  }

  supported.sort((left, right) => {
    const priority = (candidate) => {
      if (candidate.index <= 1) {
        return 0;
      }
      if (candidate.version.major === 22) {
        return 1;
      }
      if (candidate.version.major === 20) {
        return 2;
      }
      return 3;
    };

    const priorityDiff = priority(left) - priority(right);
    return priorityDiff || left.index - right.index;
  });

  return supported[0] || null;
}

const currentVersion = readNodeVersion(process.execPath);
const selected = isSupported(currentVersion)
  ? { nodePath: process.execPath, version: currentVersion }
  : findSupportedNode();

if (!selected) {
  console.error(
    `Vite 7 requires ${REQUIRED_RANGE}. Current runtime is ${currentVersion?.raw || 'unknown'}.`,
  );
  console.error('Install or activate Node 22.13.1, or set VELO_RAIL_NODE to a supported node binary.');
  process.exit(1);
}

if (selected.nodePath !== process.execPath) {
  console.error(
    `Using ${selected.version.raw} from ${selected.nodePath}; current ${currentVersion?.raw || 'unknown'} is outside Vite 7's supported range.`,
  );
}

const result = spawnSync(command, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    PATH: `${dirname(selected.nodePath)}${delimiter}${process.env.PATH || ''}`,
    VELO_RAIL_NODE_ACTIVE: selected.nodePath,
  },
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
