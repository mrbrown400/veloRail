#!/usr/bin/env node

import crypto from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const DEFAULT_SNAPSHOT_PATH = '.velorail-monitor/official-future-sources.json';
const FALLBACK_SNAPSHOT_DIR = '.velorail-monitor/fallback-snapshots';
const DEFAULT_TIMEOUT_MS = 20000;
const SNAPSHOT_VERSION = 1;

function readOptions(argv) {
  const options = {
    snapshotPath: DEFAULT_SNAPSHOT_PATH,
    updateSnapshot: false,
    failOnChange: false,
    failOnError: false,
    json: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    help: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--snapshot') {
      options.snapshotPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--update-snapshot') {
      options.updateSnapshot = true;
      continue;
    }

    if (arg === '--fail-on-change') {
      options.failOnChange = true;
      continue;
    }

    if (arg === '--fail-on-error') {
      options.failOnError = true;
      continue;
    }

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--timeout-ms') {
      const value = Number(argv[index + 1]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('--timeout-ms must be a positive finite number.');
      }
      options.timeoutMs = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Usage: npm run monitor:official-future-transit -- [options]

Fetches official Metro future-transit watch URLs and broad discovery URLs,
compares stable text fingerprints with the last local snapshot, and reports
source changes for human review. It does not rewrite the transit proposal
database.

Options:
  --snapshot PATH       Snapshot file path. Default: ${DEFAULT_SNAPSHOT_PATH}
  --update-snapshot     Save the latest fetch results after comparison.
  --fail-on-change      Exit non-zero when source fingerprints changed.
  --fail-on-error       Exit non-zero when a source fetch fails.
  --json                Print machine-readable JSON.
  --timeout-ms N        Per-source fetch timeout. Default: ${DEFAULT_TIMEOUT_MS}`);
}

async function createViteModuleLoader() {
  return createServer({
    appType: 'custom',
    configFile: false,
    logLevel: 'error',
    optimizeDeps: {
      entries: []
    },
    resolve: {
      alias: {
        '@': path.resolve('src')
      }
    },
    server: {
      hmr: false,
      middlewareMode: true,
      ws: false
    }
  });
}

async function loadTargets() {
  const server = await createViteModuleLoader();

  try {
    const {
      OFFICIAL_FUTURE_TRANSIT_DISCOVERY_TARGETS = [],
      OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS
    } = await server.ssrLoadModule('/src/data/officialFutureTransitProposals.ts');

    const watchedSources = OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS.map((target) => ({
      id: `watch:${target.proposalId}:${target.sourceId}`,
      label: target.label,
      url: target.url,
      publisher: target.publisher,
      kind: 'record-watch',
      proposalId: target.proposalId,
      sourceId: target.sourceId,
      note: target.note
    }));
    const discoveryTargets = OFFICIAL_FUTURE_TRANSIT_DISCOVERY_TARGETS.map((target) => ({
      id: `discover:${target.id}`,
      label: target.label,
      url: target.url,
      publisher: target.publisher,
      kind: 'discovery',
      note: target.note
    }));

    return [...watchedSources, ...discoveryTargets];
  } finally {
    await server.close();
  }
}

async function readSnapshot(snapshotPath) {
  try {
    return JSON.parse(await readFile(snapshotPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export function getFallbackSnapshotPath(snapshotPath) {
  const extension = path.extname(snapshotPath) || '.json';
  const baseName = path.basename(snapshotPath, extension);
  const snapshotKey = crypto
    .createHash('sha256')
    .update(path.resolve(snapshotPath))
    .digest('hex')
    .slice(0, 12);

  return path.join(FALLBACK_SNAPSHOT_DIR, `${baseName}.${snapshotKey}${extension}`);
}

function getSnapshotTimestamp(snapshot) {
  const timestamp = Date.parse(snapshot?.updatedAt ?? '');
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

export function choosePreferredSnapshot(primarySnapshot, primaryPath, fallbackSnapshot, fallbackPath) {
  if (primarySnapshot && fallbackSnapshot) {
    if (getSnapshotTimestamp(fallbackSnapshot) > getSnapshotTimestamp(primarySnapshot)) {
      return {
        snapshot: fallbackSnapshot,
        sourcePath: fallbackPath
      };
    }

    return {
      snapshot: primarySnapshot,
      sourcePath: primaryPath
    };
  }

  if (primarySnapshot) {
    return {
      snapshot: primarySnapshot,
      sourcePath: primaryPath
    };
  }

  if (fallbackSnapshot) {
    return {
      snapshot: fallbackSnapshot,
      sourcePath: fallbackPath
    };
  }

  return {
    snapshot: null,
    sourcePath: null
  };
}

export async function readSnapshotWithFallback(snapshotPath) {
  const fallbackPath = getFallbackSnapshotPath(snapshotPath);
  const [primarySnapshot, fallbackSnapshot] = await Promise.all([
    readSnapshot(snapshotPath),
    fallbackPath === snapshotPath ? null : readSnapshot(fallbackPath)
  ]);
  const preferred = choosePreferredSnapshot(
    primarySnapshot,
    snapshotPath,
    fallbackSnapshot,
    fallbackPath
  );

  return {
    ...preferred,
    fallbackPath
  };
}

export function isRecoverableSnapshotWriteError(error) {
  return ['EACCES', 'EPERM', 'EROFS'].includes(error?.code);
}

async function writeSnapshot(snapshotPath, snapshot) {
  await mkdir(path.dirname(snapshotPath), { recursive: true });
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
}

export async function writeSnapshotWithFallback(snapshotPath, snapshot) {
  const fallbackPath = getFallbackSnapshotPath(snapshotPath);

  try {
    await writeSnapshot(snapshotPath, snapshot);
    return {
      requestedPath: snapshotPath,
      savedPath: snapshotPath,
      usedFallback: false,
      warning: null
    };
  } catch (error) {
    if (!isRecoverableSnapshotWriteError(error)) {
      throw error;
    }

    await writeSnapshot(fallbackPath, snapshot);
    return {
      requestedPath: snapshotPath,
      savedPath: fallbackPath,
      usedFallback: true,
      warning: `Snapshot path ${snapshotPath} was not writable (${error.code}); saved fallback snapshot to ${fallbackPath}.`
    };
  }
}

async function fetchTarget(target, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(target.url, {
      headers: {
        accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
        'user-agent': 'VeloRail future transit source monitor'
      },
      signal: controller.signal
    });
    const body = await response.text();
    const normalized = normalizeSourceText(body);
    const monitorableStatus = response.ok || (response.status >= 300 && response.status < 400);

    return {
      ...target,
      ok: monitorableStatus,
      status: response.status,
      statusText: response.statusText,
      finalUrl: response.url,
      contentType: response.headers.get('content-type') ?? '',
      byteLength: Buffer.byteLength(body),
      normalizedLength: normalized.length,
      fingerprint: hashText(normalized),
      keywordHits: scanExpansionKeywords(normalized),
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      ...target,
      ok: false,
      status: 0,
      statusText: error instanceof Error ? error.message : String(error),
      finalUrl: target.url,
      contentType: '',
      byteLength: 0,
      normalizedLength: 0,
      fingerprint: null,
      keywordHits: [],
      checkedAt: new Date().toISOString()
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeSourceText(body) {
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function scanExpansionKeywords(text) {
  const keywords = [
    'board selected',
    'current phase',
    'estimated project completion',
    'extension',
    'future transit',
    'k line',
    'locally preferred alternative',
    'lpa',
    'opening',
    'planning',
    'sepulveda',
    'station',
    'transit corridor'
  ];

  return keywords.filter((keyword) => text.includes(keyword));
}

export function compareSnapshots(previousSnapshot, currentSnapshot) {
  const previousTargets = previousSnapshot?.targets ?? {};
  const changes = [];

  for (const [id, current] of Object.entries(currentSnapshot.targets)) {
    const previous = previousTargets[id];

    if (!previous) {
      changes.push({
        id,
        label: current.label,
        url: current.url,
        kind: current.kind,
        changeType: 'new_target'
      });
      continue;
    }

    if (
      previous.ok
      && current.ok
      && previous.fingerprint
      && current.fingerprint
      && previous.fingerprint !== current.fingerprint
    ) {
      changes.push({
        id,
        label: current.label,
        url: current.url,
        kind: current.kind,
        changeType: 'fingerprint_changed',
        previousStatus: previous.status,
        currentStatus: current.status,
        previousFingerprint: previous.fingerprint,
        currentFingerprint: current.fingerprint
      });
      continue;
    }

    if (previous.ok && current.ok && previous.status !== current.status) {
      changes.push({
        id,
        label: current.label,
        url: current.url,
        kind: current.kind,
        changeType: 'status_changed',
        previousStatus: previous.status,
        currentStatus: current.status
      });
    }
  }

  for (const [id, previous] of Object.entries(previousTargets)) {
    if (currentSnapshot.targets[id]) continue;
    changes.push({
      id,
      label: previous.label,
      url: previous.url,
      kind: previous.kind,
      changeType: 'removed_target'
    });
  }

  return changes;
}

export function buildSnapshot(results) {
  const targets = {};

  for (const result of results) {
    targets[result.id] = result;
  }

  return {
    version: SNAPSHOT_VERSION,
    updatedAt: new Date().toISOString(),
    targets
  };
}

export function buildStoredSnapshot(results, previousSnapshot) {
  const previousTargets = previousSnapshot?.targets ?? {};
  const targets = {};

  for (const result of results) {
    targets[result.id] = !result.ok && previousTargets[result.id]
      ? previousTargets[result.id]
      : result;
  }

  return {
    version: SNAPSHOT_VERSION,
    updatedAt: new Date().toISOString(),
    targets
  };
}

function printSummary(summary) {
  if (summary.previousSnapshotFound) {
    console.log(`Official future source monitor checked ${summary.checkedTargetCount} targets.`);
  } else {
    console.log(`Official future source monitor initialized ${summary.checkedTargetCount} targets.`);
  }

  console.log(`Source changes: ${summary.changes.length}; fetch issues: ${summary.fetchIssues.length}.`);

  for (const change of summary.changes) {
    console.log(`- ${change.changeType}: ${change.label} (${change.url})`);
  }

  for (const issue of summary.fetchIssues) {
    console.log(`- fetch issue: ${issue.label} (${issue.statusText})`);
  }

  if (summary.snapshotUpdated) {
    console.log(`Snapshot updated: ${summary.snapshotSavedPath}`);
  } else {
    console.log('Snapshot not updated. Re-run with --update-snapshot to save current fingerprints.');
  }

  if (summary.snapshotWarning) {
    console.log(`Snapshot warning: ${summary.snapshotWarning}`);
  }
}

async function main() {
  const options = readOptions(process.argv);

  if (options.help) {
    printHelp();
    return;
  }

  const targets = await loadTargets();
  const results = await Promise.all(targets.map((target) => fetchTarget(target, options.timeoutMs)));
  const currentSnapshot = buildSnapshot(results);
  const previousSnapshotResult = await readSnapshotWithFallback(options.snapshotPath);
  const previousSnapshot = previousSnapshotResult.snapshot;
  const changes = compareSnapshots(previousSnapshot, currentSnapshot);
  const fetchIssues = results.filter((result) => !result.ok);
  const storedSnapshot = buildStoredSnapshot(results, previousSnapshot);
  const summary = {
    snapshotPath: options.snapshotPath,
    snapshotReadPath: previousSnapshotResult.sourcePath,
    snapshotFallbackPath: previousSnapshotResult.fallbackPath,
    previousSnapshotFound: Boolean(previousSnapshot),
    snapshotUpdated: false,
    snapshotSavedPath: null,
    snapshotWarning: null,
    checkedTargetCount: results.length,
    changes,
    fetchIssues: fetchIssues.map(({ id, label, url, status, statusText }) => ({
      id,
      label,
      url,
      status,
      statusText
    }))
  };

  if (options.updateSnapshot) {
    const writeResult = await writeSnapshotWithFallback(options.snapshotPath, storedSnapshot);
    summary.snapshotUpdated = true;
    summary.snapshotSavedPath = writeResult.savedPath;
    summary.snapshotWarning = writeResult.warning;
  }

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printSummary(summary);
  }

  if ((options.failOnChange && changes.length > 0) || (options.failOnError && fetchIssues.length > 0)) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
