import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSnapshot,
  buildStoredSnapshot,
  choosePreferredSnapshot,
  compareSnapshots,
  describeFetchError,
  getFallbackSnapshotPath
} from '../scripts/monitor-official-future-sources.mjs';

function makeResult(overrides = {}) {
  return {
    id: 'watch:test:metro-project-page',
    label: 'Test Metro project page',
    url: 'https://www.metro.net/projects/test-project/',
    kind: 'record-watch',
    ok: true,
    status: 200,
    statusText: 'OK',
    finalUrl: 'https://www.metro.net/projects/test-project/',
    contentType: 'text/html',
    byteLength: 1024,
    normalizedLength: 512,
    fingerprint: 'fingerprint-a',
    keywordHits: ['planning'],
    checkedAt: '2026-05-21T17:00:00.000Z',
    ...overrides
  };
}

test('compareSnapshots ignores fetch failures when prior snapshot was healthy', () => {
  const previousSnapshot = {
    version: 1,
    updatedAt: '2026-05-20T00:00:00.000Z',
    targets: {
      'watch:test:metro-project-page': makeResult()
    }
  };
  const currentSnapshot = buildSnapshot([
    makeResult({
      ok: false,
      status: 0,
      statusText: 'fetch failed',
      fingerprint: null
    })
  ]);

  assert.deepEqual(compareSnapshots(previousSnapshot, currentSnapshot), []);
});

test('compareSnapshots still reports a real fingerprint change after a successful fetch', () => {
  const previousSnapshot = {
    version: 1,
    updatedAt: '2026-05-20T00:00:00.000Z',
    targets: {
      'watch:test:metro-project-page': makeResult()
    }
  };
  const currentSnapshot = buildSnapshot([
    makeResult({
      fingerprint: 'fingerprint-b'
    })
  ]);
  const [change] = compareSnapshots(previousSnapshot, currentSnapshot);

  assert.equal(change.changeType, 'fingerprint_changed');
  assert.equal(change.previousFingerprint, 'fingerprint-a');
  assert.equal(change.currentFingerprint, 'fingerprint-b');
});

test('buildStoredSnapshot preserves the last successful target result on fetch failure', () => {
  const previousSnapshot = {
    version: 1,
    updatedAt: '2026-05-20T00:00:00.000Z',
    targets: {
      'watch:test:metro-project-page': makeResult({
        checkedAt: '2026-05-20T00:00:00.000Z'
      })
    }
  };
  const storedSnapshot = buildStoredSnapshot([
    makeResult({
      ok: false,
      status: 0,
      statusText: 'fetch failed',
      fingerprint: null,
      checkedAt: '2026-05-21T00:00:00.000Z'
    })
  ], previousSnapshot);

  assert.deepEqual(
    storedSnapshot.targets['watch:test:metro-project-page'],
    previousSnapshot.targets['watch:test:metro-project-page']
  );
});

test('choosePreferredSnapshot uses the newer fallback snapshot when it is fresher than the primary path', () => {
  const primarySnapshot = {
    version: 1,
    updatedAt: '2026-05-20T00:00:00.000Z',
    targets: {}
  };
  const fallbackSnapshot = {
    version: 1,
    updatedAt: '2026-05-21T00:00:00.000Z',
    targets: {}
  };
  const choice = choosePreferredSnapshot(
    primarySnapshot,
    '/tmp/primary.json',
    fallbackSnapshot,
    '/tmp/fallback.json'
  );

  assert.equal(choice.snapshot, fallbackSnapshot);
  assert.equal(choice.sourcePath, '/tmp/fallback.json');
});

test('getFallbackSnapshotPath generates a stable repo-local fallback path', () => {
  const snapshotPath = '/Users/kylebrown/.codex/automations/velorail-official-future-sources.json';
  const fallbackPath = getFallbackSnapshotPath(snapshotPath);

  assert.match(fallbackPath, /^\.velorail-monitor\/fallback-snapshots\/velorail-official-future-sources\.[0-9a-f]{12}\.json$/);
  assert.equal(fallbackPath, getFallbackSnapshotPath(snapshotPath));
});

test('describeFetchError preserves error name, cause, and abort state', () => {
  const controller = new AbortController();
  const error = new TypeError('fetch failed');
  error.cause = { code: 'ENOTFOUND' };
  controller.abort();

  assert.deepEqual(describeFetchError(error, controller.signal), {
    errorName: 'TypeError',
    errorMessage: 'fetch failed',
    errorCause: 'ENOTFOUND',
    aborted: true,
    statusText: 'TypeError: fetch failed: cause=ENOTFOUND: aborted=true'
  });
});
