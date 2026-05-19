import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('population density scoring documents approximate source options and missing data', async () => {
  const {
    POPULATION_DENSITY_SOURCE_OPTIONS,
    scorePopulationDensityForRoute
  } = await loadAppModule('/src/services/populationDensityScoring.ts');

  const score = scorePopulationDensityForRoute({
    id: 'test-route',
    name: 'Test Route',
    geometry: [
      [-118.2626, 33.7490],
      [-118.2402, 33.9419],
      [-118.2278, 34.0188]
    ],
    distanceKm: 28,
    stationCount: 3
  });

  assert.equal(score.method, 'vr-501-market-anchor-heuristic-v1');
  assert.ok(score.score > 0 && score.score <= 100);
  assert.ok(POPULATION_DENSITY_SOURCE_OPTIONS.some(source => source.id === 'census-acs-tract-density'));
  assert.ok(score.missingData.includes('Census tract population density'));
  assert.match(score.notes, /not a demand forecast/);
});
