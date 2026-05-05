import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('route segment analysis derives distance and grade from sampled elevations', async () => {
  const {
    analyzeRouteSegments
  } = await loadAppModule('/src/services/elevationService.ts');

  const geometry = {
    type: 'LineString',
    coordinates: [
      [-118.25, 34.05],
      [-118.24, 34.05],
      [-118.23, 34.05]
    ]
  };
  const elevationData = {
    points: [
      { lat: 34.05, lon: -118.25, elevation: 100 },
      { lat: 34.05, lon: -118.24, elevation: 110 },
      { lat: 34.05, lon: -118.23, elevation: 105 }
    ],
    totalAscent: 10,
    totalDescent: 5,
    minElevation: 100,
    maxElevation: 110
  };

  const segments = analyzeRouteSegments(geometry, elevationData);

  assert.equal(segments.length, 2);
  assert.ok(segments[0].distance > 900);
  assert.ok(segments[0].grade > 0);
  assert.ok(segments[1].grade < 0);
});
