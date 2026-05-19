import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('bike rail scoring is deterministic and documents Google API non-usage', async () => {
  const {
    BIKE_RAIL_SCORING_POLICY,
    scoreBikeRailAccessForRoute
  } = await loadAppModule('/src/services/bikeRailScoring.ts');

  const input = {
    id: 'bike-test-route',
    name: 'Bike Test Route',
    geometry: [
      [-118.2626, 33.7490],
      [-118.2402, 33.9419],
      [-118.2278, 34.0188]
    ],
    distanceKm: 28,
    stationCount: 3
  };
  const firstScore = scoreBikeRailAccessForRoute(input);
  const secondScore = scoreBikeRailAccessForRoute(input);

  assert.deepEqual(firstScore, secondScore);
  assert.equal(firstScore.method, 'vr-502-bike-rail-access-heuristic-v1');
  assert.match(BIKE_RAIL_SCORING_POLICY.googleApiUse, /No live Google Bicycling/);
  assert.ok(firstScore.missingData.includes('protected bike lane network'));
  assert.match(firstScore.notes, /low-stress network/);
});
